#!/usr/bin/env bash
# Runs on the VPS as root, piped over SSH by .github/workflows/deploy.yml.
# Expects the build at /tmp/mazen-book-release.tgz. First run installs Node.js,
# nginx and the systemd service; every run unpacks a new release, switches to
# it, and rolls back if the server doesn't come up.
set -euo pipefail

RELEASE_ID="$1"
APP=mazen-book
ROOT=/var/www/$APP
PORT=3000
TARBALL=/tmp/$APP-release.tgz
export DEBIAN_FRONTEND=noninteractive

if ! node -e 'process.exit(+process.versions.node.split(".")[0] >= 20 ? 0 : 1)' 2>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
command -v nginx >/dev/null || { apt-get update && apt-get install -y nginx; }
id "$APP" >/dev/null 2>&1 || useradd --system --no-create-home --shell /usr/sbin/nologin "$APP"

# Unpack the release; the server writes its cache inside it, so the app user owns it.
REL=$ROOT/releases/$RELEASE_ID
rm -rf "$REL"
mkdir -p "$REL"
tar -xzf "$TARBALL" -C "$REL"
rm -f "$TARBALL"
chown -R "$APP:$APP" "$REL"

cat > /etc/systemd/system/$APP.service <<EOF
[Unit]
Description=mazen_book Next.js server
After=network.target

[Service]
User=$APP
WorkingDirectory=$ROOT/current
Environment=NODE_ENV=production PORT=$PORT HOSTNAME=127.0.0.1
ExecStart=$(command -v node) server.js
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

# Written once so later edits (domain, certbot SSL) survive deploys.
SITE=/etc/nginx/sites-available/$APP
if [ ! -f "$SITE" ]; then
  cat > "$SITE" <<'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        # Partial-prerendered pages stream; buffering would hold them back.
        proxy_buffering off;
    }
}
EOF
  ln -sfn "$SITE" /etc/nginx/sites-enabled/$APP
  rm -f /etc/nginx/sites-enabled/default
  nginx -t
  systemctl enable --now nginx
  systemctl reload nginx
fi

PREVIOUS=$(readlink "$ROOT/current" || true)
ln -sfn "$REL" "$ROOT/current"
systemctl daemon-reload
systemctl enable "$APP" >/dev/null 2>&1
systemctl restart "$APP"

for _ in $(seq 1 30); do
  if curl -fsS -o /dev/null "http://127.0.0.1:$PORT/"; then
    ls -1dt "$ROOT"/releases/* | tail -n +4 | xargs -r rm -rf
    echo "Deployed $RELEASE_ID"
    exit 0
  fi
  sleep 1
done

journalctl -u "$APP" -n 50 --no-pager || true
if [ -n "$PREVIOUS" ]; then
  echo "Server didn't start; rolling back to $PREVIOUS"
  ln -sfn "$PREVIOUS" "$ROOT/current"
  systemctl restart "$APP"
fi
exit 1
