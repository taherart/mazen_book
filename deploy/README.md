# Deploying to the VPS

The site runs on a Hostinger VPS (KVM 1, Ubuntu) as a Docker Compose project managed through
Hostinger's Docker Manager API. Two containers: `web` (the Next.js standalone server, built from
the repository's `Dockerfile`) and `caddy` (HTTPS on the host name, plain HTTP on the IP).

The server builds the image itself, straight from GitHub at `GIT_REF`, so a deploy is one API call:
send `deploy/docker-compose.yml` with the environment below. A new `GIT_REF` gives a new image tag,
so the server always rebuilds the code you asked for.

| Variable | Value |
| --- | --- |
| `GIT_REPO_URL` | `https://x-access-token:<token>@github.com/taherart/mazen_book.git` with a fine-grained token (this repository only, **Contents: read**). Leave it unset while the repository is public |
| `GIT_REF` | Commit SHA to deploy. It also tags the image, so each SHA is a fresh build (branch names with `/` are not valid tags) |
| `SITE_HOST` | `srv2059641.hstgr.cloud`, or the real domain once it points at the server |
| `SITE_IP` | `191.215.47.95` |

```bash
# HOSTINGER_API_TOKEN: hPanel → Account → API. VM id 2059641.
python3 - <<'PY' | curl -sS -X POST https://developers.hostinger.com/api/vps/v1/virtual-machines/2059641/docker \
  -H "Authorization: Bearer $HOSTINGER_API_TOKEN" -H "Content-Type: application/json" --data @-
import json, os
env = "\n".join(f"{k}={os.environ[k]}" for k in ("GIT_REPO_URL", "GIT_REF", "SITE_HOST", "SITE_IP") if os.environ.get(k))
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

## Connecting the real domain

Point the domain's A record at `191.215.47.95`, set `SITE_HOST` to the domain and deploy again.
Caddy fetches the certificate on its own. `NEXT_PUBLIC_SITE_URL` (QR codes, canonical links, social
previews) follows `SITE_HOST`, so the rebuild picks it up.

## Building locally

```bash
docker build --build-arg NEXT_PUBLIC_SITE_URL=https://example.com -t mazen-book .
docker run --rm -p 3000:3000 mazen-book
```

If Docker Hub rate-limits the pull, add `--build-arg NODE_IMAGE=mirror.gcr.io/library/node:22-alpine`.
