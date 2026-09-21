// Server-only helper for talking to the upstream Enora API.
//
// IMPORTANT: only import this module from server code (route handlers).
// It reads credentials from environment variables, which must never reach
// the client.
//
// Auth flow:
//   1. POST {BASE}/api/auth/login        { username, password } -> JWT (text)
//   2. GET  {BASE}/api/citizens/submissions  Authorization: Bearer <JWT>
//
// The JWT is cached in module state and re-logged-in when it expires or the
// upstream responds 401.

import type { CitizenSubmission, SubmissionsResponse } from './types';

const BASE_URL = (
	process.env.UPSTREAM_URL ?? 'https://api.enora-oah.eu'
).replace(/\/+$/, '');

const LOGIN_PATH = '/api/auth/login';
// const SUBMISSIONS_PATH = "/api/citizens/submissions";
// const SUBMISSIONS_PATH = '/api/sites/user-generated';
// const SUBMISSIONS_PATH = '/api/citizens/user-generated-sites/my-sites';
const SUBMISSIONS_PATH =
	'/api/citizens/user-generated-sites/all-submissions';

// Safety margin: consider a token expired this long before its `exp` claim.
const EXPIRY_SKEW_MS = 30_000;
// Fallback TTL if the JWT has no parseable `exp` claim.
const FALLBACK_TTL_MS = 10 * 60_000;

interface CachedToken {
	token: string;
	expiresAt: number;
}

let cachedToken: CachedToken | null = null;

// Cache for the (larger) submissions payload, shared across all widget loads.
// Same single-instance assumption as the token cache: in-memory per server
// process. Override the TTL with SUBMISSIONS_CACHE_TTL_MS (milliseconds).
const SUBMISSIONS_CACHE_TTL_MS = Number(
	process.env.SUBMISSIONS_CACHE_TTL_MS ?? 5 * 60_000,
);

interface SubmissionsCache {
	data: CitizenSubmission[];
	fetchedAt: number;
}

let submissionsCache: SubmissionsCache | null = null;
let refreshInFlight: Promise<void> | null = null;

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

async function fetchSubmissions(token: string): Promise<Response> {
	return fetch(`${BASE_URL}${SUBMISSIONS_PATH}`, {
		headers: { Authorization: `Bearer ${token}` },
		cache: 'no-store',
	});
}

async function fetchFreshSubmissions(): Promise<CitizenSubmission[]> {
	let token = await getToken();
	let res = await fetchSubmissions(token);

	// Token may have been revoked/expired server-side despite our cache.
	if (res.status === 401) {
		token = await getToken(true);
		res = await fetchSubmissions(token);
	}

	if (!res.ok) {
		throw new Error(
			`Upstream submissions request failed with status ${res.status}`,
		);
	}

	return res.json();
}

function toSubmissionsResponse(
	cache: SubmissionsCache,
): SubmissionsResponse {
	return {
		submissions: cache.data,
		updatedAt: new Date(cache.fetchedAt).toISOString(),
	};
}

export async function getSubmissions(
	force = false,
): Promise<SubmissionsResponse> {
	const now = Date.now();

	// Fresh cache → return it immediately.
	if (
		!force &&
		submissionsCache &&
		now - submissionsCache.fetchedAt < SUBMISSIONS_CACHE_TTL_MS
	) {
		return toSubmissionsResponse(submissionsCache);
	}

	// Stale cache + no refresh already in flight → serve stale now and refresh
	// in the background so the next request gets fresh data.
	if (!force && submissionsCache && !refreshInFlight) {
		refreshInFlight = fetchFreshSubmissions()
			.then(data => {
				submissionsCache = { data, fetchedAt: Date.now() };
			})
			.catch(err => {
				console.error(
					'[upstream] background submissions refresh failed',
					err,
				);
			})
			.finally(() => {
				refreshInFlight = null;
			});

		return toSubmissionsResponse(submissionsCache);
	}

	// No cache yet (or forced refresh) → fetch and await.
	const data = await fetchFreshSubmissions();
	submissionsCache = { data, fetchedAt: Date.now() };
	return toSubmissionsResponse(submissionsCache);
}
