# Deploying akbarovlabs.uz

The site runs on the Contabo server, production only (no staging), the same
way as random-bot and posbon: GitHub builds a Docker image and every push to
`main` goes straight to production.

| | Production |
|---|---|
| Address | `https://akbarovlabs.uz` (+ `www` → redirect) |
| Folder on the server | `/opt/apps/akbarovlabs` |
| Container | `akbarovlabs-web` |
| Deploys | every push to `main` |

The image is nginx serving the built files (see `Dockerfile` and
`docker/nginx.conf`). No database and nothing to back up yet.

Traffic: visitor → **Cloudflare** (DNS, caching, protection) → the server's
shared **edge Caddy** (HTTPS) → this container.

The general server tools and docs live in `akbarov-labs/reads`:
`docs/add-app.md` and `docs/cloudflare-real-ip.md`.

## Setting up on a new server

The current server is already set up. Only follow this to rebuild it.

### 1. Cloudflare DNS

The domain's nameservers must already point to Cloudflare (at ahost.uz).
Then in Cloudflare → **DNS → Records**:

| Type | Name | Content | Proxy |
|---|---|---|---|
| A | `@` | the server's address | **DNS only** (grey) for now |
| CNAME | `www` | `akbarovlabs.uz` | **DNS only** (grey) for now |

Keep them grey until step 4, so Caddy can get its certificates directly.

### 2. Server: create the app

`sudo add-app` always sets up staging too, so it doesn't fit this app. Do the
production half instead, using `infra/setup-server.sh` in
`akbarov-labs/group-manager-bot` as the template:

- Make a CI key on the Mac:
  `ssh-keygen -q -t ed25519 -f ~/.ssh/ci_akbarovlabs -N "" -C ci_akbarovlabs`.
- Set `APP=akbarovlabs` and `REPO=ghcr.io/akbarov-labs/website`, and require
  only `DOMAIN` in the `.env`. The `.env` is one line:
  `DOMAIN=akbarovlabs.uz`.

### 3. GitHub

The repository is private, so it can't see the org's variables. In
**akbarov-labs/website → Settings → Secrets and variables → Actions →
Variables**, add the same four as the other projects: `CONTABO_HOST`,
`CONTABO_PORT` (`22`), `CONTABO_USER` (`deployer`), `CONTABO_KNOWN_HOSTS`
(copy it from the org's Variables page).

Then **Settings → Environments → `production`**: secret `CONTABO_SSH_KEY` =
`pbcopy < ~/.ssh/ci_akbarovlabs`, variable `SITE_URL` =
`https://akbarovlabs.uz`, Deployment branches → Selected → `main`.

Then **Actions → Build and deploy → Run workflow** (or push to `main`). Open
`https://akbarovlabs.uz` and `https://www.akbarovlabs.uz` (it should
redirect).

Delete the key from the Mac once the deploy is green:

```bash
rm ~/.ssh/ci_akbarovlabs
```

### 4. Cloudflare proxy on

Once `https://akbarovlabs.uz` works with Caddy's certificate:

1. **SSL/TLS → Overview**: **Full (strict)**.
2. **DNS → Records**: switch both records to **Proxied** (orange cloud).
3. **SSL/TLS → Edge Certificates**: Always Use HTTPS on, Minimum TLS 1.2.

The site doesn't use visitor IPs today, so no real-IP label is needed. When
the contact form and AI assistant arrive (they will rate-limit by visitor),
add the label from `docs/cloudflare-real-ip.md` in `akbarov-labs/reads`.

## Day to day

- Check the change locally (below), then push to `main` → production updates
  in a few minutes.
- Roll back: run **Actions → Promote to production → Run workflow** with an
  older commit's full SHA (the server keeps the last 3 images).
- CI doesn't copy `docker-compose.prod.yml` to the server. After changing it,
  install the new copy at `/opt/apps/akbarovlabs/` by hand, owned by root.

## Local Docker check

```bash
docker build --platform linux/amd64 -t akbarovlabs-web:test .
```

```bash
docker run --rm -p 8091:80 akbarovlabs-web:test
```

Then open `http://localhost:8091`.
