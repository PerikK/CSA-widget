import { getSubmissions } from '@/lib/upstream';
import type { NextRequest } from 'next/server';

// This endpoint performs the authenticated upstream fetch server-side and
// returns clean JSON to the browser. Credentials never leave the server.
//
// The response is cached server-side for a short TTL. Pass `?refresh=1` to
// bypass the cache and fetch fresh data from upstream.
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
	try {
		const force = request.nextUrl.searchParams.get('refresh') != null;
		const result = await getSubmissions(force);
		return Response.json(result, {
			headers: { 'Cache-Control': 'no-store' },
		});
	} catch (err) {
		console.error('[api/submissions]', err);
		return Response.json(
			{ error: 'Failed to fetch submissions from upstream' },
			{ status: 502 },
		);
	}
}
