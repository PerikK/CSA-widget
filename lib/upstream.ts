// Server-only helper for talking to the upstream Enora API.
//
// IMPORTANT: only import this module from server code (route handlers).
// It reads credentials from environment variables, which must never reach
// the client.
//
// Auth flow:
//   1. POST {BASE}/api/auth/login        { username, password } -> JWT (text)
//   2. GET  {BASE}/api/citizens/submissions  Authorization: Bearer <JWT>
//   3. GET  {BASE}/api/citizens/user-generated-sites/all-submissions
//
// The JWT is cached in module state and re-logged-in when it expires or the
// upstream responds 401.
//
// The two submission endpoints are fetched in parallel and merged. Their rows
// only differ by the site-identifier field (`researchSite` vs
// `userGeneratedSite`), so each merged row is tagged with its `source`.

import type {
	CitizenSubmission,
	SourceStatus,
	SubmissionSource,
	SubmissionsResponse,
} from './types';

const BASE_URL = (
	process.env.UPSTREAM_URL ?? 'https://api.enora-oah.eu'
).replace(/\/+$/, '');

const LOGIN_PATH = '/api/auth/login';

const SUBMISSION_PATHS: Record<SubmissionSource, string> = {
	research: '/api/citizens/submissions',
	userGenerated: '/api/citizens/user-generated-sites/all-submissions',
};

const SUBMISSION_SOURCES = Object.keys(
	SUBMISSION_PATHS,
) as SubmissionSource[];

// Safety margin: consider a token expired this long before its `exp` claim.
const EXPIRY_SKEW_MS = 30_000;
// Fallback TTL if the JWT has no parseable `exp` claim.
const FALLBACK_TTL_MS = 10 * 60_000;

interface CachedToken {
	token: string;
	expiresAt: number;
}

let cachedToken: CachedToken | null = null;

// Cache for the submissions payloads, shared across all widget loads.
// Same single-instance assumption as the token cache: in-memory per server
// process. Override the TTL with SUBMISSIONS_CACHE_TTL_MS (milliseconds).
const SUBMISSIONS_CACHE_TTL_MS = Number(
	process.env.SUBMISSIONS_CACHE_TTL_MS ?? 5 * 60_000,
);

interface SourceCacheEntry {
	data: CitizenSubmission[];
	fetchedAt: number;
	ok: boolean;
}

// Per-source cache so a failed refresh of one list never discards the
// last-known-good data of the other.
const sourceCaches: Record<SubmissionSource, SourceCacheEntry | null> = {
	research: null,
	userGenerated: null,
};

const refreshInFlight: Record<SubmissionSource, Promise<void> | null> = {
	research: null,
	userGenerated: null,
};

function decodeJwtExp(token: string): number | null {
	try {
		const payload = token.split('.')[1];
		const json = JSON.parse(
			Buffer.from(payload, 'base64url').toString('utf8'),
		);
		return typeof json.exp === 'number' ? json.exp * 1000 : null;
	} catch {
		return null;
	}
}

async function login(): Promise<string> {
	const username = process.env.UPSTREAM_USERNAME;
	const password = process.env.UPSTREAM_PASSWORD;

	if (!username || !password) {
		throw new Error(
			'Missing UPSTREAM_USERNAME / UPSTREAM_PASSWORD environment variables',
		);
	}

	const res = await fetch(`${BASE_URL}${LOGIN_PATH}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ username, password }),
		cache: 'no-store',
	});

	if (!res.ok) {
		throw new Error(
			`Upstream login failed with status ${res.status}`,
		);
	}

	const token = (await res.text()).trim();
	if (!token) {
		throw new Error('Upstream login returned an empty token');
	}

	return token;
}

async function getToken(force = false): Promise<string> {
	if (
		!force &&
		cachedToken &&
		cachedToken.expiresAt > Date.now() + EXPIRY_SKEW_MS
	) {
		return cachedToken.token;
	}

	const token = await login();
	const exp = decodeJwtExp(token);

	cachedToken = {
		token,
		expiresAt: exp ?? Date.now() + FALLBACK_TTL_MS,
	};

	return token;
}

function fetchSource(
	source: SubmissionSource,
	token: string,
): Promise<Response> {
	return fetch(`${BASE_URL}${SUBMISSION_PATHS[source]}`, {
		headers: { Authorization: `Bearer ${token}` },
		cache: 'no-store',
	});
}

type UpstreamSubmission = Omit<CitizenSubmission, 'source'>;

interface SourceFetchResult {
	data?: CitizenSubmission[];
	error?: unknown;
}

// Fetch one or more sources in parallel. A shared token means a single
// re-login + retry covers every source that answered 401. `allSettled` keeps
// a network failure on one source from discarding the other's response.
async function fetchFreshSources(
	sources: SubmissionSource[],
): Promise<Record<SubmissionSource, SourceFetchResult>> {
	const results = {} as Record<SubmissionSource, SourceFetchResult>;

	if (sources.length === 0) return results;

	let token = await getToken();
	let outcomes = await Promise.allSettled(
		sources.map(source => fetchSource(source, token)),
	);

	const hasUnauthorized = outcomes.some(
		outcome =>
			outcome.status === 'fulfilled' &&
			outcome.value.status === 401,
	);
	if (hasUnauthorized) {
		try {
			token = await getToken(true);
			outcomes = await Promise.allSettled(
				sources.map(source => fetchSource(source, token)),
			);
		} catch (err) {
			// Re-login failed; keep the first round so a source that succeeded
			// isn't discarded along with the unauthorized one.
			console.error('[upstream] re-login failed', err);
		}
	}

	await Promise.all(
		sources.map(async (source, index) => {
			const outcome = outcomes[index];

			if (outcome.status === 'rejected') {
				results[source] = { error: outcome.reason };
				return;
			}

			const res = outcome.value;
			if (!res.ok) {
				results[source] = {
					error: new Error(
						`Upstream ${source} request failed with status ${res.status}`,
					),
				};
				return;
			}

			try {
				const rows = (await res.json()) as UpstreamSubmission[];
				results[source] = {
					data: rows.map(row => ({ ...row, source })),
				};
			} catch (err) {
				results[source] = { error: err };
			}
		}),
	);

	return results;
}

function refreshSourceInBackground(source: SubmissionSource): void {
	if (refreshInFlight[source]) return;

	refreshInFlight[source] = fetchFreshSources([source])
		.then(results => {
			const result = results[source];
			if (result.data) {
				sourceCaches[source] = {
					data: result.data,
					fetchedAt: Date.now(),
					ok: true,
				};
				return;
			}

			const cached = sourceCaches[source];
			if (cached) cached.ok = false;
			console.error(
				`[upstream] background ${source} refresh failed`,
				result.error,
			);
		})
		.catch(err => {
			const cached = sourceCaches[source];
			if (cached) cached.ok = false;
			console.error(
				`[upstream] background ${source} refresh failed`,
				err,
			);
		})
		.finally(() => {
			refreshInFlight[source] = null;
		});
}

function isFresh(cache: SourceCacheEntry, now: number): boolean {
	return now - cache.fetchedAt < SUBMISSIONS_CACHE_TTL_MS;
}

function toSourceStatus(
	cache: SourceCacheEntry | null,
): SourceStatus {
	return {
		updatedAt: cache
			? new Date(cache.fetchedAt).toISOString()
			: null,
		ok: cache?.ok ?? false,
	};
}

export async function getSubmissions(
	force = false,
): Promise<SubmissionsResponse> {
	const now = Date.now();
	const toFetch: SubmissionSource[] = [];

	for (const source of SUBMISSION_SOURCES) {
		const cache = sourceCaches[source];

		if (force || !cache) {
			toFetch.push(source);
		} else if (!isFresh(cache, now)) {
			// Stale but usable: serve it now and refresh in the background.
			refreshSourceInBackground(source);
		}
	}

	if (toFetch.length > 0) {
		try {
			const results = await fetchFreshSources(toFetch);

			for (const source of toFetch) {
				const result = results[source];
				if (result.data) {
					sourceCaches[source] = {
						data: result.data,
						fetchedAt: Date.now(),
						ok: true,
					};
				} else {
					const cached = sourceCaches[source];
					if (cached) cached.ok = false;
					console.error(
						`[upstream] ${source} fetch failed`,
						result.error,
					);
				}
			}
		} catch (err) {
			// Login/network failure: keep any last-known-good data and flag it.
			for (const source of toFetch) {
				const cached = sourceCaches[source];
				if (cached) cached.ok = false;
			}
			console.error('[upstream] submissions fetch failed', err);
		}
	}

	const submissions = SUBMISSION_SOURCES.flatMap(
		source => sourceCaches[source]?.data ?? [],
	);

	// No source has ever been fetched successfully: let the route return 502.
	const hasAnySource = SUBMISSION_SOURCES.some(
		source => sourceCaches[source] !== null,
	);
	if (!hasAnySource) {
		throw new Error('No submissions available from upstream');
	}

	const sources = SUBMISSION_SOURCES.reduce(
		(acc, source) => {
			acc[source] = toSourceStatus(sourceCaches[source]);
			return acc;
		},
		{} as Record<SubmissionSource, SourceStatus>,
	);

	return { submissions, sources };
}
