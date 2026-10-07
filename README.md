# The Server Rack

One Vite + React app that serves two showcase hubs, each drawn as a physical server rack:

- **RACK-01**, CCD (Centre for Career Development, IIT Guwahati): `ccd.avinashgupta.in`
- **RACK-02**, Prasad Academic: `prasad.avinashgupta.in`

The hostname picks the hub (`ccd.*` or `prasad.*`). Anywhere else (local dev, previews) use `?hub=ccd` or `?hub=prasad`.
Each portal is a unit in the rack; click it (or run `ssh <unit>` in the console) to slide out a drawer with its details.

The look is copied from the portfolio (`avinashgupta.in`): paper and ink page, dark devices, Clash Display + JetBrains Mono
(self-hosted in `public/fonts`), the ink-block section heading, the terminal, and the daemon pointer.

## Editing content

The only files you edit day to day are the two data files. One object per portal:

| File | Hub |
|---|---|
| `src/data/ccd.json` | RACK-01 |
| `src/data/prasad.json` | RACK-02 |

```json
{
  "name": "Internship Portal",
  "description": "One line describing what it does.",
  "url": "https://example.com/route",
  "github": "https://github.com/owner/repo",
  "role": "optional, a string",
  "stack": ["optional", "array"],
  "highlights": ["optional", "array"],
  "appStore": "optional link",
  "playStore": "optional link",
  "screenshot": "optional image path or URL"
}
```

Optional fields are hidden in the drawer while empty. Nothing is invented: if a field is missing, it is not shown.

What the rack derives from the data:

- **LED**: amber if the GitHub owner is `laladwesh` (built by me), mint for any other owner (institute or org repo). LEDs are steady.
- **Unit size**: 2U if the entry has a `stack`, otherwise 1U.
- **Model label**: `SLUG / TOP-3-STACK` when there is a stack, otherwise `SLUG / URL-HOST`.

## Local dev

```
npm install
npm run dev          # http://localhost:5173/?hub=ccd   or   ?hub=prasad
npm run build        # outputs dist/
npm run preview
```

## Docker

`Dockerfile` is multi-stage: `node:20-alpine` builds the app, `nginx:1.27-alpine` serves `dist/` with `nginx.conf`
(unknown paths fall back to `index.html`). Both hubs use the same image:

| Service | Container | Host port | Hostname |
|---|---|---|---|
| `ccd-port` | `ccd-port` | 2025 | `ccd.avinashgupta.in` |
| `prasad-port` | `prasad-port` | 2026 | `prasad.avinashgupta.in` |

```
docker compose up -d --build
curl localhost:2025    # RACK-01 page
curl localhost:2026    # RACK-02 page
```

The app picks the hub from the hostname, so the reverse proxy must pass the **original Host header**
(`proxy_set_header Host $host;`), as in the blocks below.

## Deploy on the VPS

These are steps for you to run; nothing here has been run on the server.

1. SSH in, pull, and rebuild:
   ```
   ssh user@your-server
   cd ccd-port && git pull
   docker compose up -d --build
   ```
   Before the first run, check the ports and names are free:
   ```
   docker ps -a --format '{{.Names}}\t{{.Ports}}'
   sudo ss -tlnp | grep -E '2025|2026'
   ```
2. **`ccd.avinashgupta.in`** already has DNS and an nginx site (`/etc/nginx/sites-available/ccd-app`) pointing at
   `localhost:2025`. Make sure it keeps `proxy_set_header Host $host;`.

### Bringing `prasad.avinashgupta.in` live

1. **DNS.** At your registrar, add an A record: `prasad` -> `129.159.16.182`. Check it with
   `dig +short prasad.avinashgupta.in`.
2. **nginx site.** Create `/etc/nginx/sites-available/prasad-app`:
   ```nginx
   server {
     listen 80;
     server_name prasad.avinashgupta.in;

     location / {
       proxy_pass http://localhost:2026;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
     }
   }
   ```
3. **Enable it and reload:**
   ```
   sudo ln -s /etc/nginx/sites-available/prasad-app /etc/nginx/sites-enabled/prasad-app
   sudo nginx -t && sudo systemctl reload nginx
   ```
4. **TLS with certbot** (after the DNS record resolves):
   ```
   sudo certbot --nginx -d prasad.avinashgupta.in
   ```
   Certbot adds the `listen 443 ssl` block and the HTTP -> HTTPS redirect. Check renewal with
   `sudo certbot renew --dry-run`.
5. Open `https://prasad.avinashgupta.in`. It should show RACK-02.

## Portfolio link

The portfolio navbar has a CCD entry that opens `https://ccd.avinashgupta.in`. There is no nav link to
`prasad.avinashgupta.in` yet.
