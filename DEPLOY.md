# Deploying akbarovlabs.uz

The site runs on the Contabo server like the other projects: GitHub builds
a Docker image, every push to `main` goes to **staging** automatically, and
**production** gets that same image when you press **Actions → Promote to
production → Run workflow**.

| | Production | Staging |
|---|---|---|
| Address | `https://akbarovlabs.uz` (+ `www` → redirect) | `https://akbarovlabs.staging.sarvarlogs.uz`, password protected (user `staging`) |
| Folder on the server | `/opt/apps/akbarovlabs` | `/opt/apps/akbarovlabs-staging` |
| Container | `akbarovlabs-web` | `akbarovlabs-staging-web` |
| Deploys | Promote to production (by hand) | every push to `main` |

The image is nginx serving the built files (see `Dockerfile` and
`docker/nginx.conf`). No database and nothing to back up yet.

Traffic: visitor → **Cloudflare** (DNS, caching, protection) → the server's
shared **edge Caddy** (HTTPS) → this container.

The general server tools and docs live in `akbarov-labs/reads`:
`docs/add-app.md` and `docs/cloudflare-real-ip.md`.

## First-time setup

### 1. Cloudflare DNS

The domain's nameservers must already point to Cloudflare (at ahost.uz).
Then in Cloudflare → **DNS → Records**:

| Type | Name | Content | Proxy |
|---|---|---|---|
| A | `@` | `169.58.243.86` | **DNS only** (grey) for now |
| CNAME | `www` | `akbarovlabs.uz` | **DNS only** (grey) for now |

Keep them grey until step 5, so Caddy can get its certificates directly.

### 2. Mac: keys and files for the server

```bash
cd ~/dev/sites/Reads
deploy/prepare-app akbarovlabs ~/dev/sites/akbarovlabs
```

### 3. Server: create the app

This is a new app, so first give production its `.env` (add-app copies it
from the folder you name):

```bash
mkdir -p /tmp/akbarovlabs-env && printf 'DOMAIN=akbarovlabs.uz\n' > /tmp/akbarovlabs-env/.env
```

```bash
sudo add-app akbarovlabs ghcr.io/akbarov-labs/website /tmp/akbarovlabs-env
```

It asks for staging's password twice. Then:

```bash
rm -rf /tmp/akbarovlabs-env
```

### 4. GitHub

The repository is private, so it can't see the org's variables. In
**akbarov-labs/website → Settings → Secrets and variables → Actions →
Variables**, add the same four as the other projects: `CONTABO_HOST`
(`169.58.243.86`), `CONTABO_PORT` (`22`), `CONTABO_USER` (`deployer`),
`CONTABO_KNOWN_HOSTS` (copy it from the org's Variables page).

Then **Settings → Environments**:

- **`staging`**: secret `CONTABO_SSH_KEY` = `pbcopy < ~/.ssh/ci_akbarovlabs_staging`,
  variable `SITE_URL` = `https://akbarovlabs.staging.sarvarlogs.uz`,
  Deployment branches → Selected → `main`.
- **`production`**: secret `CONTABO_SSH_KEY` = `pbcopy < ~/.ssh/ci_akbarovlabs`,
  variable `SITE_URL` = `https://akbarovlabs.uz`,
  Deployment branches → Selected → `main`.

Then **Actions → Build and deploy → Run workflow** (or push to `main`).
Check staging, then **Promote to production → Run workflow**. Open
`https://akbarovlabs.uz` and `https://www.akbarovlabs.uz` (it should
redirect).

Delete the keys from the Mac once both deploys are green:

```bash
rm ~/.ssh/ci_akbarovlabs ~/.ssh/ci_akbarovlabs_staging
```

### 5. Cloudflare proxy on

Once `https://akbarovlabs.uz` works with Caddy's certificate:

1. **SSL/TLS → Overview**: **Full (strict)**.
2. **DNS → Records**: switch both records to **Proxied** (orange cloud).
3. **SSL/TLS → Edge Certificates**: Always Use HTTPS on, Minimum TLS 1.2.

The site doesn't use visitor IPs today, so no real-IP label is needed. When
the contact form and AI assistant arrive (they will rate-limit by visitor),
add the label from `docs/cloudflare-real-ip.md` in `akbarov-labs/reads`.

## Day to day

- Change something, push to `main` → staging updates in a few minutes.
- Happy with staging → **Actions → Promote to production → Run workflow**.
- Roll back: run **Promote to production** with an older commit's full SHA
  (the server keeps the last 3 images).

## Local Docker check

```bash
docker build --platform linux/amd64 -t akbarovlabs-web:test .
```

```bash
docker run --rm -p 8091:80 akbarovlabs-web:test
```

Then open `http://localhost:8091`.
