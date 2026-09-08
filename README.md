# Project Listing Sites

One repo, two independent static listing sites, each mapped to its own
subdomain of `avinashgupta.in`. Plain HTML/CSS/JS, no framework, no build
step, no client-side routing.

- `ccd/` — **CCD Projects**, for the Center For Career Development, IIT
  Guwahati. Deployed at `ccd.avinashgupta.in`.
- `prasad/` — **PIMS Projects**, for Prasad Institute of Medical Sciences.
  Deployed at `prasad.avinashgupta.in`.

Each subfolder is a self-contained site with the identical structure:

- `index.html` — the page markup: a sticky left-rail intro (`.context-rail`)
  next to a scrolling right-rail project list (`.data-rail`).
- `style.css` — all styling, plain CSS custom properties, no framework.
- `app.js` — reads `projects.json` and renders `.project-item` entries into
  the list.
- `projects.json` — **the only file you need to edit day-to-day.** Add one
  object per route:
  ```json
  {
    "name": "Route name",
    "description": "One line describing what it does.",
    "url": "https://example.com/route",
    "github": "https://github.com/user/repo"
  }
  ```
  `url` is optional — if present, it renders as the "Route" link; `github`
  is also optional — if present, it renders as the "Source" link.
- `Dockerfile` — nginx serving the folder's static files as-is.

## Local dev

```
npm run serve:ccd      # http://localhost:4173 (needs Python)
npm run serve:prasad   # http://localhost:4174
```
No install or build step — just edit the relevant `projects.json` and refresh.

## Deploy (Docker on your VPS, over SSH)

`docker-compose.yml` at the repo root defines both sites as separate
services, each built from its own subfolder:

| Service        | Build context | Host port |
|-----------------|---------------|-----------|
| `ccd-port`      | `./ccd`       | 2025      |
| `prasad-port`   | `./prasad`    | 2026      |

Since other projects already run on this server, this is intentionally
isolated: `docker compose` scopes its own network/containers per project
directory, so bringing these up does **not** touch any other container,
compose stack, or network already on the box — the only shared resource is
the host ports. Before first deploy (or after adding `prasad-port`), confirm
the ports and container names are free:
```
docker ps -a --format '{{.Names}}\t{{.Ports}}'   # check for name/port clashes
sudo ss -tlnp | grep -E '2025|2026'               # confirm nothing else is bound to these
```
If a port's taken, change the left side of that service's `ports:` mapping
in `docker-compose.yml` — nothing else needs to change to move host ports.

1. Get the code onto the server (`git pull` if it's already cloned there, or
   clone fresh):
   ```
   git clone https://github.com/laladwesh/ccd-port.git
   ```
2. SSH in and bring both sites up:
   ```
   ssh user@your-server
   cd ccd-port
   docker compose up -d --build
   ```
3. Verify: `curl localhost:2025` and `curl localhost:2026` on the server
   should each return their page's HTML.
4. Whenever you edit either `projects.json` (or anything else): `git pull`,
   then `docker compose up -d --build` to rebuild and restart both services
   (add a service name, e.g. `docker compose up -d --build prasad-port`, to
   only rebuild one).

### Useful commands
```
docker compose logs -f                # tail logs for both services
docker compose logs -f prasad-port    # tail logs for just one
docker compose down                   # stop and remove both containers
docker compose up -d --build          # rebuild after changes and restart
```

## DNS + reverse proxy

`avinashgupta.in` resolves to a plain A record (`129.159.16.182` — your own
VPS), with a system nginx in front handling TLS per-subdomain via certbot.

- **`ccd.avinashgupta.in`** — already live. DNS A record and nginx config
  (`/etc/nginx/sites-available/ccd-app`) already existed on the server from a
  prior deploy; we just repointed its `proxy_pass` to `localhost:2025`.
- **`prasad.avinashgupta.in`** — not set up yet. You'll need:
  1. An **A record**: `prasad` → `129.159.16.182` at your registrar.
  2. A new nginx server block proxying `prasad.avinashgupta.in` →
     `localhost:2026`, then `sudo certbot --nginx -d prasad.avinashgupta.in`
     for TLS — same pattern as the `ccd-app` config. Ask when you're ready
     and I'll write out the exact block/commands.

## Portfolio nav link

`avinashgupta.in`'s navbar has a **CCD** entry (see
`portfolio/src/constants/index.js` and `Navbar.jsx`) that opens
`https://ccd.avinashgupta.in` in a new tab — a plain link, not a redirect. No
nav link exists yet for `prasad.avinashgupta.in`; say if you want one added
the same way.
