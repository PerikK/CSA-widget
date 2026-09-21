import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	reactCompiler: true,
	// Produce a self-contained `.next/standalone` bundle (server.js + minimal
	// node_modules) so the app can be deployed without a full `node_modules`.
	output: 'standalone',
	async headers() {
		return [
			// Allow the /embed page to be framed by any site.
			{
				source: '/embed',
				headers: [
					{
						key: 'Content-Security-Policy',
						value: 'frame-ancestors *;',
					},
				],
			},
			// The widget fetches /api/submissions same-origin, but allow cross-origin
			// GET access too (e.g. if the widget is used via a direct fetch).
			{
				source: '/api/:path*',
				headers: [
					{
						key: 'Access-Control-Allow-Origin',
						value: '*',
					},
					{
						key: 'Access-Control-Allow-Methods',
						value: 'GET, OPTIONS',
					},
					{
						key: 'Access-Control-Allow-Headers',
						value: 'Content-Type',
					},
				],
			},
		];
	},
};

export default nextConfig;
