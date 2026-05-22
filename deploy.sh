#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/synklyerp"
STANDALONE_DIR="$APP_DIR/.next/standalone"

echo "==> Building..."
npm run build --prefix "$APP_DIR"

echo "==> Copying static assets into standalone output..."
# The standalone output doesn't include static files or the public folder.
# They must be copied after every build for the server to serve them correctly.
rm -rf "$STANDALONE_DIR/.next/static"
cp -r "$APP_DIR/.next/static" "$STANDALONE_DIR/.next/static"

if [ -d "$APP_DIR/public" ]; then
  rm -rf "$STANDALONE_DIR/public"
  cp -r "$APP_DIR/public" "$STANDALONE_DIR/public"
fi

echo "==> Restarting PM2 process..."
pm2 restart synklyerp

echo "==> Done!"
