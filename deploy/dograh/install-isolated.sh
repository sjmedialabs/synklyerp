#!/usr/bin/env bash
# Isolated Dograh deployment for ai.synklyapp.com on an existing production VPS.
# Run as root:  bash install-isolated.sh
#
# Safe by design:
# - Only creates /opt/dograh and ai.synklyapp.com nginx site
# - Does not edit other sites-enabled entries
# - Does not touch PM2 or existing Docker containers (except Dograh stack)

set -euo pipefail

DOMAIN="ai.synklyapp.com"
INSTALL_DIR="/opt/dograh"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NGINX_SITE="/etc/nginx/sites-available/${DOMAIN}"
CERTBOT_WEBROOT="/var/www/certbot"

log() { echo "[dograh] $*"; }
die() { echo "[dograh] ERROR: $*" >&2; exit 1; }

[[ "$(id -u)" -eq 0 ]] || die "Run as root (sudo bash install-isolated.sh)"

log "=== Step 1: Docker ==="
command -v docker >/dev/null || die "Docker not installed. Run: apt update && apt install -y docker.io docker-compose-plugin"
docker --version
docker compose version

log "=== Step 2: Deployment directory ${INSTALL_DIR} ==="
mkdir -p "${INSTALL_DIR}"
cd "${INSTALL_DIR}"

if [[ ! -f docker-compose.yaml ]]; then
  log "Downloading Dograh docker-compose.yaml..."
  curl -fsSL -o docker-compose.yaml \
    https://raw.githubusercontent.com/dograh-hq/dograh/main/docker-compose.yaml
fi

if [[ ! -f start_docker.sh ]]; then
  curl -fsSL -o start_docker.sh \
    https://raw.githubusercontent.com/dograh-hq/dograh/main/scripts/start_docker.sh
  chmod +x start_docker.sh
fi

log "Installing localhost-only port override..."
cp "${SCRIPT_DIR}/docker-compose.override.host-nginx.yml" docker-compose.override.yml

if [[ ! -f .env ]]; then
  cp "${SCRIPT_DIR}/env.example" .env
  if ! grep -q '^OSS_JWT_SECRET=' .env || grep -q '^OSS_JWT_SECRET=$' .env; then
    echo "OSS_JWT_SECRET=$(openssl rand -hex 32)" >> .env
  fi
  if ! grep -q '^POSTGRES_PASSWORD=' .env; then
    echo "POSTGRES_PASSWORD=$(openssl rand -hex 16)" >> .env
  fi
  if ! grep -q '^REDIS_PASSWORD=' .env; then
    echo "REDIS_PASSWORD=$(openssl rand -hex 16)" >> .env
  fi
  log "Created .env — add provider API keys if needed."
else
  log ".env exists — keeping current secrets."
fi

# Ensure public URL settings
grep -q '^PUBLIC_HOST=' .env && sed -i "s|^PUBLIC_HOST=.*|PUBLIC_HOST=${DOMAIN}|" .env || echo "PUBLIC_HOST=${DOMAIN}" >> .env
grep -q '^PUBLIC_BASE_URL=' .env && sed -i "s|^PUBLIC_BASE_URL=.*|PUBLIC_BASE_URL=https://${DOMAIN}|" .env || echo "PUBLIC_BASE_URL=https://${DOMAIN}" >> .env
grep -q '^BACKEND_API_ENDPOINT=' .env && sed -i "s|^BACKEND_API_ENDPOINT=.*|BACKEND_API_ENDPOINT=https://${DOMAIN}|" .env || echo "BACKEND_API_ENDPOINT=https://${DOMAIN}" >> .env
grep -q '^MINIO_PUBLIC_ENDPOINT=' .env && sed -i "s|^MINIO_PUBLIC_ENDPOINT=.*|MINIO_PUBLIC_ENDPOINT=https://${DOMAIN}|" .env || echo "MINIO_PUBLIC_ENDPOINT=https://${DOMAIN}" >> .env

log "=== Step 3: Start Dograh (local profile, no Docker nginx on 80/443) ==="
docker compose pull
docker compose up -d

log "Waiting for UI on 127.0.0.1:3010..."
for i in $(seq 1 60); do
  if curl -sf http://127.0.0.1:3010 >/dev/null 2>&1; then
    log "Dograh UI is up."
    break
  fi
  sleep 5
  if [[ "$i" -eq 60 ]]; then
    die "Dograh UI did not start. Check: docker compose -f ${INSTALL_DIR}/docker-compose.yaml logs ui api"
  fi
done

log "=== Step 4: Nginx site for ${DOMAIN} only ==="
mkdir -p "${CERTBOT_WEBROOT}"
cp "${SCRIPT_DIR}/nginx/ai.synklyapp.com.conf" "${NGINX_SITE}"

# HTTP-only config first (for certbot if certs missing)
if [[ ! -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]]; then
  log "No SSL cert yet — installing temporary HTTP proxy for certbot..."
  cat > "${NGINX_SITE}" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

    location /.well-known/acme-challenge/ {
        root ${CERTBOT_WEBROOT};
        default_type "text/plain";
        try_files \$uri =404;
    }

    location /api/v1/ {
        proxy_pass http://127.0.0.1:18000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /voice-audio/ {
        proxy_pass http://127.0.0.1:9000/voice-audio/;
        proxy_set_header Host \$host;
    }

    location / {
        proxy_pass http://127.0.0.1:3010;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
fi

ln -sf "${NGINX_SITE}" "/etc/nginx/sites-enabled/${DOMAIN}"

log "Current nginx sites-enabled:"
ls -la /etc/nginx/sites-enabled/

nginx -t
systemctl reload nginx

log "=== Step 5: SSL (Let's Encrypt) ==="
if [[ ! -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]]; then
  apt-get update -qq
  apt-get install -y certbot python3-certbot-nginx
  certbot --nginx -d "${DOMAIN}" --non-interactive --agree-tos -m admin@synklyapp.com --redirect || {
    log "certbot --nginx failed; try: certbot certonly --webroot -w ${CERTBOT_WEBROOT} -d ${DOMAIN}"
  }
  if [[ -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]]; then
    cp "${SCRIPT_DIR}/nginx/ai.synklyapp.com.conf" "${NGINX_SITE}"
    nginx -t && systemctl reload nginx
  fi
else
  log "SSL cert already exists for ${DOMAIN}"
  cp "${SCRIPT_DIR}/nginx/ai.synklyapp.com.conf" "${NGINX_SITE}"
  nginx -t && systemctl reload nginx
fi

log "=== Step 6: Verification ==="
echo ""
docker compose ps
echo ""
curl -sI -H "Host: ${DOMAIN}" http://127.0.0.1/ | head -5 || true
curl -skI "https://${DOMAIN}/" | head -10 || true
echo ""

cat <<EOF

================================================================================
Dograh deployment complete (isolated)
================================================================================
Install dir:     ${INSTALL_DIR}
Containers:    cd ${INSTALL_DIR} && docker compose ps
UI (internal): http://127.0.0.1:3010
API (internal): http://127.0.0.1:8000
Public URL:    https://${DOMAIN}
Nginx site:    ${NGINX_SITE}

Next steps:
1. Open https://${DOMAIN} — you should see Dograh (not SKC Mines).
2. In Dograh: Settings → API Keys → create key for SynklyERP.
3. Set in SynklyERP .env:
   DOGRAH_URL=https://${DOMAIN}
   DOGRAH_API_KEY=<your-key>
   DOGRAH_APP_PUBLIC_URL=https://synklyapp.com

API key already in your .env (if generated earlier): check Dograh dashboard.

Logs: docker compose -f ${INSTALL_DIR}/docker-compose.yaml logs -f ui api
================================================================================
EOF
