# Deploying to the VPS

Live demo: **https://srv2059641.hstgr.cloud** (Let's Encrypt certificate) and http://191.215.47.95.

The site runs on a Hostinger VPS (KVM 1, Ubuntu) as a Docker Compose project managed through
Hostinger's Docker Manager API (which cannot build from a git URL, hence the builder):

- `builder` (one-off) downloads the commit `GIT_REF` from GitHub, builds it into the `releases`
  volume and exits. A commit that is already built is skipped, so restarts are instant.
- `web` runs that release: non-root, read-only filesystem, all capabilities dropped,
  no-new-privileges, memory and process limits, health check.
- `caddy` serves HTTPS on `SITE_HOST` (HSTS, upgrade-insecure-requests) and plain HTTP on `SITE_IP`,
  with request timeouts, a 1 MB body limit and no Server header.
- `db` is PostgreSQL, reachable only inside the project.
- `backup` dumps the database into the `pgbackups` volume when the project starts and then daily at
  06:00 Riyadh time, verifies each dump and keeps `BACKUP_KEEP_DAYS` (30) of them. Admins download a
  copy from `/admin` (web mounts the volume read-only); see **Backups and restore** below.

**Every push to `main` deploys itself:** `.github/workflows/deploy.yml` lints and builds the commit,
then `deploy/hostinger.py` sends it here with only `GIT_REF` changed and waits until it is live.
It needs one repository secret, `HOSTINGER_API_TOKEN`.

By hand, a deploy is one API call: send `deploy/docker-compose.yml` with the environment below.

| Variable | Value |
| --- | --- |
| `GIT_REF` | Commit SHA to deploy (only a full SHA is accepted) |
| `GITHUB_TOKEN` | Only while the repository is private: fine-grained token, this repository only, **Contents: read** |
| `SITE_HOST` | `srv2059641.hstgr.cloud`, or the real domain once it points at the server |
| `SITE_IP` | `191.215.47.95` |
| `DB_PASSWORD` | Database password. `deploy/hostinger.py` generates it on the first deploy that needs it; never change it afterwards (the database keeps the one it was created with) |
| `ADMIN_EMAILS` | Comma-separated emails whose accounts can open `/admin` |
| `BACKUP_KEEP_DAYS` | Optional. Days of database dumps to keep on the server (default 30) |
| `RESEND_API_KEY` | Optional. Lets the site email password-reset links through [Resend](https://resend.com). Set it as a **repository secret**; the workflow passes it on. Without it the link is only written to the web container's log |
| `MAIL_FROM` | Optional. The sender, e.g. `52 طريقة <no-reply@example.com>`, once that domain is verified in Resend. Set it as a **repository variable**. Until then the default `onboarding@resend.dev` works, but Resend delivers it only to the Resend account's own address |

```bash
# HOSTINGER_API_TOKEN: hPanel → Account → API. VM id 2059641.
python3 - <<'PY' | curl -sS -X POST https://developers.hostinger.com/api/vps/v1/virtual-machines/2059641/docker \
  -H "Authorization: Bearer $HOSTINGER_API_TOKEN" -H "Content-Type: application/json" --data @-
import json, os
env = "\n".join(f"{k}={os.environ[k]}" for k in ("GIT_REF", "GITHUB_TOKEN", "SITE_HOST", "SITE_IP", "DB_PASSWORD", "ADMIN_EMAILS") if os.environ.get(k))
print(json.dumps({"project_name": "mazen-book", "content": open("deploy/docker-compose.yml").read(), "environment": env}))
PY
```

Then watch it come up:

```bash
curl -sS -H "Authorization: Bearer $HOSTINGER_API_TOKEN" \
  https://developers.hostinger.com/api/vps/v1/virtual-machines/2059641/docker/mazen-book/containers
curl -sS -H "Authorization: Bearer $HOSTINGER_API_TOKEN" \
  https://developers.hostinger.com/api/vps/v1/virtual-machines/2059641/docker/mazen-book/logs
```

## Password-reset email

`/forgot` emails a one-hour, single-use link to `/reset?token=…` (only the token's hash is stored;
using it signs the member out everywhere else). The email goes through Resend when
`RESEND_API_KEY` is set. **Resend's sandbox only delivers to the account owner's address**: to reach
members, add the site's domain in Resend, publish the DNS records it gives you, then set
`MAIL_FROM` to an address on that domain and deploy again.

## Backups and restore

The `backup` service writes `mazen-YYYY-MM-DD-HHMM.dump` files (`pg_dump` custom format, compressed)
into the `pgbackups` volume: one when the project starts, then one a day. Each dump is checked with
`pg_restore -l` before it replaces the `.part` file, so a listed file is always a complete archive.
The service's log says `backup ok …` or `backup FAILED …` for each run (Docker Manager → logs).

The dumps stay on the same VPS. **Download the latest one regularly** from `/admin` → النسخ
الاحتياطي and keep it somewhere else (that page also warns when the latest copy is older than a day
and a half). A VPS snapshot in hPanel is a second, independent layer.

To restore a dump, open the VPS terminal in hPanel and run, with the file's name:

```bash
# 1. stop the site so nothing writes while the database is replaced
docker stop mazen-book-web-1
# 2. drop and recreate the schema, then load the dump (the file is inside the pgbackups volume)
docker exec mazen-book-db-1 psql -U mazen -d mazen -c 'drop schema public cascade; create schema public;'
docker run --rm --network mazen-book_default -v mazen-book_pgbackups:/backups:ro -e PGPASSWORD="$DB_PASSWORD" \
  postgres:17-alpine pg_restore -h db -U mazen -d mazen --no-owner /backups/mazen-2026-10-30-0300.dump
# 3. start the site again; it re-checks the migrations and carries on
docker start mazen-book-web-1
```

To restore a dump you downloaded, copy it into the volume first:
`docker cp mazen-2026-10-30-0300.dump mazen-book-backup-1:/backups/`.

## Connecting the real domain

The checklist for the day the domain is chosen:

1. DNS: an `A` record for the domain (and `www`, if wanted) → `191.215.47.95`.
2. Hostinger project environment: set `SITE_HOST` to the domain and deploy again (any push to
   `main`, or `workflow_dispatch`). Caddy fetches the certificate on its own; `NEXT_PUBLIC_SITE_URL`
   (QR codes, canonical links, social previews) follows `SITE_HOST`, so the rebuild picks it up.
3. Email: add the domain in Resend, publish the DNS records it gives, then set the repository
   variable `MAIL_FROM` to `52 طريقة <no-reply@DOMAIN>` and deploy again. Test `/forgot` with an
   address that is not the Resend account's own.
4. Redirect the old addresses (`srv2059641.hstgr.cloud` and the bare IP) to the domain in the
   Caddyfile, so printed QR codes and shared links keep working.
5. At launch: `SAMPLES=0` in the project environment to remove the illustrative content.

## Building locally

```bash
docker build --build-arg NEXT_PUBLIC_SITE_URL=https://example.com -t mazen-book .
docker run --rm -p 3000:3000 mazen-book
```

If Docker Hub rate-limits the pull, add `--build-arg NODE_IMAGE=mirror.gcr.io/library/node:22-alpine`.
