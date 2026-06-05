#!/usr/bin/env bash
# Déploiement Zugher sur VPS OVH — exécuté par GitHub Actions (webhook push sur main)
# ou manuellement depuis /var/www/zugher : ./deploy/deploy.sh
#
# Étapes :
#   1. git pull (fast-forward only, fail si divergence)
#   2. bun install (frozen lockfile)
#   3. build Nitro node-server
#   4. vérifie que .output/server/index.mjs existe
#   5. restart service systemd + healthcheck local
#
# Prérequis (setup unique) : voir deploy/README.md et deploy/OVH-SETUP.md

set -Eeuo pipefail

APP_DIR="/var/www/zugher"
SERVICE="zugher"
BUN="$HOME/.bun/bin/bun"
HEALTH_URL="http://127.0.0.1:3000"
LOG_PREFIX="[deploy $(date -u +%Y-%m-%dT%H:%M:%SZ)]"

log()  { echo "$LOG_PREFIX $*"; }
fail() { echo "$LOG_PREFIX ❌ $*" >&2; exit 1; }

trap 'fail "échec ligne $LINENO (exit $?)"' ERR

cd "$APP_DIR" || fail "APP_DIR introuvable: $APP_DIR"

[ -x "$BUN" ] || fail "bun introuvable à $BUN — installer Bun (cf. README)"
[ -f ".env.production" ] || fail ".env.production manquant (chmod 600)"

log "▶ git fetch & pull (ff-only)"
git fetch --prune origin
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
[ "$CURRENT_BRANCH" = "main" ] || fail "branche courante=$CURRENT_BRANCH (attendu: main)"
git pull --ff-only origin main
COMMIT=$(git rev-parse --short HEAD)
log "   commit déployé: $COMMIT"

log "▶ bun install --frozen-lockfile"
"$BUN" install --frozen-lockfile

log "▶ build (NITRO_PRESET=node-server)"
NITRO_PRESET=node-server "$BUN" run build

[ -f ".output/server/index.mjs" ] || fail "build a échoué : .output/server/index.mjs absent"

log "▶ restart systemd ($SERVICE)"
sudo /bin/systemctl restart "$SERVICE"

log "▶ healthcheck local ($HEALTH_URL)"
for i in $(seq 1 20); do
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 "$HEALTH_URL" || echo "000")
  if [ "$code" = "200" ] || [ "$code" = "301" ] || [ "$code" = "302" ]; then
    log "✅ service up (HTTP $code) — commit $COMMIT déployé"
    sudo /bin/systemctl status "$SERVICE" --no-pager -l | head -n 10 || true
    exit 0
  fi
  sleep 2
done

sudo /bin/systemctl status "$SERVICE" --no-pager -l | head -n 30 || true
fail "service ne répond pas après 40s (dernier code: $code)"
