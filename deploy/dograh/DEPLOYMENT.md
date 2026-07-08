# Dograh Production Deployment — ai.synklyapp.com

## Problem diagnosed

`https://ai.synklyapp.com` was serving **SKC Mines Admin** (`SKCMinesDashboard`) because:

1. DNS `ai.synklyapp.com` → `194.164.150.223` (correct)
2. **No dedicated nginx `server_name ai.synklyapp.com` block** existed
3. Requests fell through to the **default_server** (SKC static SPA)
4. Browser showed "Not Secure" because the wrong vhost/cert was used

## Fix (on VPS as root)

### Option A — Full isolated install (Dograh + nginx + SSL)

```bash
# Copy deploy/dograh/ to the server, then:
cd /path/to/deploy/dograh
chmod +x install-isolated.sh fix-nginx-ai-subdomain.sh
sudo ./install-isolated.sh
```

### Option B — Nginx only (if Dograh already runs on port 3010)

```bash
sudo ./fix-nginx-ai-subdomain.sh
sudo certbot --nginx -d ai.synklyapp.com
```

## What gets created (unchanged elsewhere)

| Item | Location |
|------|----------|
| Dograh install | `/opt/dograh` |
| Docker override | `/opt/dograh/docker-compose.override.yml` |
| Environment | `/opt/dograh/.env` |
| Nginx vhost | `/etc/nginx/sites-available/ai.synklyapp.com` |
| Symlink | `/etc/nginx/sites-enabled/ai.synklyapp.com` |
| SSL certs | `/etc/letsencrypt/live/ai.synklyapp.com/` |

**Not modified:** other `sites-enabled`, PM2, Synkly Next.js, Firebase, existing containers.

## Internal routing

| Path | Backend |
|------|---------|
| `/` | `127.0.0.1:3010` (Dograh UI) |
| `/api/v1/` | `127.0.0.1:8000` (Dograh API) |
| `/voice-audio/` | `127.0.0.1:9000` (MinIO) |

## Docker containers (after install)

```bash
cd /opt/dograh && docker compose ps
```

Typical names: `dograh-ui-1`, `dograh-api-1`, `postgres`, `redis`, `minio` (prefix may vary).

## SynklyERP integration (.env)

```env
DOGRAH_URL=https://ai.synklyapp.com
DOGRAH_API_KEY=dgr_...          # from Dograh → Settings → API Keys
DOGRAH_APP_PUBLIC_URL=https://synklyapp.com
```

## Verify

```bash
curl -sI https://ai.synklyapp.com/ | head -10
curl -s http://127.0.0.1:3010 | head -5
docker compose -f /opt/dograh/docker-compose.yaml logs --tail=50 api ui
```

Expected: HTML title contains Dograh, **not** `SKCMinesDashboard`.

## API key

Generate in Dograh dashboard: **Settings → API Keys → Create API Key**

Store in SynklyERP `DOGRAH_API_KEY` and Organisation Setup → Dograh AI Voice.

## WebRTC / voice calls

For production voice, open firewall UDP/TCP **3478, 5349, 49152-49200** if using TURN (optional `local-turn` profile). UI + REST work without TURN for dashboard access.

## Rollback nginx only

```bash
rm /etc/nginx/sites-enabled/ai.synklyapp.com
nginx -t && systemctl reload nginx
```

Dograh containers can stay stopped with `cd /opt/dograh && docker compose down` without affecting other apps.
