# CSA Widget

An embeddable **Leaflet map widget** for citizen-science submissions, built with
Next.js. It's served inside an `<iframe>` on third-party sites and shows submissions
as colour-coded markers, with a responsive details popup, dark mode, and a server-side
auth proxy that keeps credentials hidden from the browser.

## Features

- Full-screen Leaflet map that auto-fits the submissions' bounds.
- Markers colour-coded by `overallAssessment`: **Good** (green), **Moderate** (amber), **Poor** (red).
- Popup with a summary + expandable full details (1/2/3 responsive columns).
- Dark mode (`prefers-color-scheme` + a manual System/Light/Dark toggle).
- "Updated" timestamp and a **Refresh** button.
- Server-side caching (5 min TTL) + JWT auth proxy — credentials never reach the client.
- Embeddable anywhere (`frame-ancestors *`).

## Prerequisites

- **Node.js ≥ 20.9** (Node 22 LTS recommended)
- **npm**

## Local development

```bash
# 1. install dependencies
npm ci

# 2. create .env.local from the template and fill in credentials
cp .env.example .env.local

# 3. start the dev server (port 3003)
npm run dev
```

Open **<http://localhost:3003/embed>** to see the widget.

## Environment variables

Set these in `.env.local` (local dev) or the process environment (production):

| Variable | Description |
| --- | --- |
| `UPSTREAM_URL` | Base URL of the upstream API, e.g. `https://api.enora-oah.eu` (or `http://localhost:8080` for local dev) |
| `UPSTREAM_USERNAME` | Service account username |
| `UPSTREAM_PASSWORD` | Service account password |
| `SUBMISSIONS_CACHE_TTL_MS` | *(optional)* submissions cache TTL in ms (default `300000` = 5 min) |

> If the password contains a `#`, quote it: `UPSTREAM_PASSWORD="uiAccess1@#"` — otherwise
> the `#` is treated as a comment and truncated.

## Production build & run

```bash
npm run build
npm run start        # serves the production build on port 3000 (override with PORT)
```

> `next.config.ts` sets `output: "standalone"`, so `npm run build` also produces a
> self-contained `.next/standalone` bundle (`server.js` + minimal `node_modules`) that
> can be deployed without a full `node_modules`.

## Deployment

Two supported paths — see **[DEPLOYMENT.md](./DEPLOYMENT.md)** for full details:

1. **Docker Compose + Caddy** (recommended — automatic HTTPS):

   ```bash
   cp .env.example .env          # fill credentials
   # edit Caddyfile with your domain
   docker compose up -d --build
   ```

2. **Standalone folder** (no Docker):

   ```bash
   npm run build
   # assemble the deploy folder (see DEPLOYMENT.md), then on the server:
   node server.js
   ```

> **HTTPS is required** for iframe embedding: browsers block `http://` iframes inside
> `https://` pages (mixed content).

## Embedding

```html
<iframe
  src="https://your-widget-domain.example/embed"
  style="width: 100%; height: 600px; border: none;"
  title="CSA Widget"
/>
```

## How it works

```text
iframe → /embed
        └── Map.tsx fetches /api/submissions (same-origin)
              └── route.ts → lib/upstream.ts
                    ├── POST {UPSTREAM_URL}/api/auth/login   → JWT
                    └── GET  {UPSTREAM_URL}/api/citizens/user-generated-sites/all-submissions
```

Credentials and the upstream URL stay on the server; the browser only sees the final
JSON. `proxy.ts` adds per-IP rate limiting on `/api/submissions`.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Dev server with hot reload (port 3003) |
| `npm run build` | Production build (also emits `.next/standalone`) |
| `npm run start` | Serve the production build (port 3000) |
| `npm run lint` | Run ESLint |
