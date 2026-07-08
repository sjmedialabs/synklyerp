# Dograh isolated deployment — ai.synklyapp.com
#
# Root cause of SKC redirect: ai.synklyapp.com had no dedicated nginx
# server_name block, so requests hit the default_server (SKC Mines SPA).
#
# This package:
# - Installs Dograh under /opt/dograh (Docker, localhost ports only)
# - Adds ONLY /etc/nginx/sites-available/ai.synklyapp.com
# - Does NOT modify other nginx sites, PM2, or existing apps
