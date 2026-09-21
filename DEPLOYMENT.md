# CSA Widget — Deployment Guide

## Overview

This is a **Next.js app**, not a static React site. It runs as a **Node.js server**
because it has a server-side route (`/api/submissions`) that authenticates to the
upstream Enora API and proxies the data. Credentials never reach the browser.

The embeddable page is served at **`/embed`**.

There are two supported ways to deploy it:

- **Option A** — a pre-built **standalone folder** (needs Node.js on the server).
- **Option B** — **Docker Compose + Caddy** (needs Docker; automatic HTTPS).

Both are described below.

---

## Requirements

| Option | Needed on the server |
| --- | --- |
| A — Standalone | Node.js >= 20.9 (Node 22 LTS recommended) |
| B — Docker | Docker + Docker Compose |

## Environment variables

Required at runtime (set in the process environment, a `.env`, PM2/systemd, or Docker):

| Variable | Description |
| --- | --- |
| `UPSTREAM_URL` | Base URL of the upstream API, e.g. `https://api.enora-oah.eu` |
| `UPSTREAM_USERNAME` | Service account username |
| `UPSTREAM_PASSWORD` | Service account password |

> ⚠️ The password may contain a `#`. If you place it in a `.env` file, quote it:
> `UPSTREAM_PASSWORD="uiAccess1@#"`.

---

## Option A — Standalone folder (no Docker)

### Build & assemble (done once by the developer)

```bash
npm ci
npm run build

# assemble the deployable folder
rm -rf deploy && mkdir -p deploy
cp -r .next/standalone/. deploy/
cp -r .next/static deploy/.next/static
cp -r public deploy/public
```

This produces `deploy/`, a self-contained folder containing `server.js`,
a minimal `node_modules`, and the static assets. (`output: "standalone"` is
already enabled in `next.config.ts`.)

### Run (on the server)

```bash
# in the deploy/ folder
export UPSTREAM_URL=https://api.enora-oah.eu
export UPSTREAM_USERNAME=uiaccess
export UPSTREAM_PASSWORD='uiAccess1@#'

PORT=3000 HOSTNAME=0.0.0.0 node server.js
```

Verify:

```bash
curl -I http://localhost:3000/embed        # → 200
curl http://localhost:3000/api/submissions # → JSON array
```

See `deploy/RUN.md` for full instructions.

---

## Option B — Docker Compose + Caddy

Files: `Dockerfile`, `docker-compose.yml`, `Caddyfile`.

### Steps

1. **Set credentials** — create a `.env` file (next to `docker-compose.yml`):

   ```bash
   UPSTREAM_URL=https://api.enora-oah.eu
   UPSTREAM_USERNAME=uiaccess
   UPSTREAM_PASSWORD="uiAccess1@#"
   ```

2. **Set the domain** — edit `Caddyfile`:

   ```text
   widget.example.com {
       reverse_proxy widget:3000
   }
   ```

3. **Point DNS** — create an A record for `widget.example.com` → server IP.

4. **Start**:

   ```bash
   docker compose up -d --build
   ```

Caddy automatically obtains and renews the TLS certificate. The widget is then
available at `https://widget.example.com/embed`.

---

## HTTPS / reverse proxy (why it's required)

Browsers block **mixed content**: an `http://` iframe cannot be embedded inside an
`https://` page. Since the embedding site is (almost always) HTTPS, the widget must
also be served over HTTPS.

- In **Option B**, Caddy provides HTTPS automatically.
- In **Option A**, put nginx or Caddy in front of the Node server with a
  Let's Encrypt certificate.

Example nginx location (Option A):

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## Embedding

The app already sends `Content-Security-Policy: frame-ancestors *`, so any site may
embed it:

```html
<iframe
  src="https://widget.example.com/embed"
  style="width: 100%; height: 600px; border: none;"
  title="CSA Widget"
/>
```

## Security notes

- Credentials are **not** shipped in any artifact — they are injected at runtime.
- `frame-ancestors *` currently allows any site to embed the widget. To restrict it,
  change the value in `next.config.ts` to a domain allowlist.
