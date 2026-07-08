#!/usr/bin/env bash
# Quick fix when Dograh is already running but ai.synklyapp.com shows SKC admin.
# Only adds/replaces the ai.synklyapp.com nginx vhost. Run as root.

set -euo pipefail
DOMAIN="ai.synklyapp.com"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NGINX_SITE="/etc/nginx/sites-available/${DOMAIN}"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }

echo "[fix] Checking Dograh on localhost:3010..."
if ! curl -sf http://127.0.0.1:3010 >/dev/null 2>&1; then
  echo "[fix] WARNING: Nothing on 127.0.0.1:3010 — start Dograh first (install-isolated.sh)"
fi

echo "[fix] Installing nginx vhost for ${DOMAIN}..."
mkdir -p /var/www/certbot

if [[ -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]]; then
  cp "${SCRIPT_DIR}/nginx/ai.synklyapp.com.conf" "${NGINX_SITE}"
else
  cat > "${NGINX_SITE}" <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name ai.synklyapp.com;

    location /api/v1/ {
        proxy_pass http://127.0.0.1:18000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location /voice-audio/ {
        proxy_pass http://127.0.0.1:9000/voice-audio/;
        proxy_set_header Host $host;
    }

    location / {
        proxy_pass http://127.0.0.1:3010;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
fi

ln -sf "${NGINX_SITE}" "/etc/nginx/sites-enabled/${DOMAIN}"

echo "[fix] Sites currently enabled:"
ls -la /etc/nginx/sites-enabled/

nginx -t
systemctl reload nginx

echo "[fix] Done. Test: curl -sI -H 'Host: ai.synklyapp.com' http://127.0.0.1/ | head -5"
curl -sI -H "Host: ${DOMAIN}" http://127.0.0.1/ | head -8
