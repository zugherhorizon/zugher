#!/usr/bin/env bash
# Déploiement Zugher sur VPS OVH (Ubuntu/Debian, Node 20, Bun, Nginx, systemd)
#
# Usage (sur le VPS, depuis /var/www/zugher) :
#   ./deploy/deploy.sh
#
# Ce script :
#   1. Pulle le dernier code (git)
#   2. Installe les deps
#   3. Build en mode node-server (Nitro)
#   4. Redémarre le service systemd
#
# Prérequis (une seule fois) :
#   - /var/www/zugher/.env.production rempli (chmod 600)
#   - service systemd installé : sudo cp deploy/zugher.service /etc/systemd/system/
#                                sudo systemctl daemon-reload && sudo systemctl enable zugher
#   - nginx configuré      : sudo cp deploy/nginx-zugher.conf /etc/nginx/sites-available/zugher
#                            sudo ln -s ../sites-available/zugher /etc/nginx/sites-enabled/
#                            sudo nginx -t && sudo systemctl reload nginx
#   - SSL                  : sudo certbot --nginx -d zugher.fr -d www.zugher.fr

set -euo pipefail

APP_DIR="/var/www/zugher"
SERVICE="zugher"

cd "$APP_DIR"

echo "▶ git pull"
git pull --ff-only

echo "▶ bun install"
~/.bun/bin/bun install --frozen-lockfile

echo "▶ build (Nitro preset node-server)"
NITRO_PRESET=node-server ~/.bun/bin/bun run build

echo "▶ restart systemd service ($SERVICE)"
sudo systemctl restart "$SERVICE"

sleep 2
sudo systemctl status "$SERVICE" --no-pager -l | head -n 15

echo "✅ Déploiement terminé"
