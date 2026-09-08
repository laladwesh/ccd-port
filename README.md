# CCD Projects

A minimal listing page for every route/project the Center For Career Development
(CCD), IIT Guwahati, maintains. Plain HTML + Tailwind CSS, no framework, no
client-side routing.

## Structure

- `index.html` — the page markup.
- `app.js` — reads `projects.json` and renders the list. No build step needed for this file.
- `projects.json` — **the only file you need to edit day-to-day.** Add one object per route:
  ```json
  {
    "name": "Route name",
    "description": "One line describing what it does.",
    "github": "https://github.com/user/repo"
  }
  ```
- `src/input.css` / `output.css` — Tailwind source and compiled output. Only rebuild
  this if you change classes in `index.html`.

## Local dev

```
npm install
npm run dev     # watches src/input.css -> output.css
npm run serve   # serves the folder at http://localhost:4173 (needs Python)
```

## Deploy (Docker on your VPS, over SSH)

The repo has a `Dockerfile` and `docker-compose.yml`. The container builds
`output.css` from source and serves the static files with nginx's default
config (no custom nginx config in this repo) on container port 80, mapped to
**host port 2025**.

1. Get the code onto the server (either `git clone` the repo there, or `scp`
   the folder over):
   ```
   scp -r ./ccd-port user@your-server:/opt/ccd-port
   ```
2. SSH in and bring it up:
   ```
   ssh user@your-server
   cd /opt/ccd-port
   docker compose up -d --build
   ```
3. Verify it's up: `curl localhost:2025` on the server should return the page
   HTML.
4. Whenever you edit `projects.json` or anything else: `git pull` (or `scp`
   again), then `docker compose up -d --build` to rebuild and restart.

That's the whole deploy step — the site is now live at `localhost:2025` on
the server. Forwarding `ccd.avinashgupta.in` to it (reverse proxy + DNS) is
the part you said you'll wire up yourself; ping me if you want a hand with
that nginx/Caddy reverse-proxy block once you're ready.

### Useful commands
```
docker compose logs -f       # tail container logs
docker compose down          # stop and remove the container
docker compose up -d --build # rebuild after changes and restart
```

## DNS

Since `avinashgupta.in` currently resolves to a plain A record
(`129.159.16.182` — looks like your own VPS, not Vercel/Netlify/GitHub
Pages), once you're ready to point the subdomain at this container, the
typical path is: add an **A record** `ccd` → `129.159.16.182` at your
registrar, then reverse-proxy `ccd.avinashgupta.in` → `localhost:2025` on
that same box. Say the word when you want that config written out.

## Portfolio nav link

`avinashgupta.in`'s navbar now has a **CCD** entry (see
`portfolio/src/constants/index.js` and `Navbar.jsx`) that opens
`https://ccd.avinashgupta.in` in a new tab — a plain link, not a redirect, per
your call. No changes needed on the portfolio's hosting/DNS side for this part.
