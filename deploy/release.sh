#!/usr/bin/env bash
# release.sh — active sur le VPS un build produit par GitHub Actions.
#
# Usage (exécuté par le pipeline CI/CD) :
#   GIT_SHA=<sha> bash /tmp/zugher-release.sh /tmp/zugher-output.tar.gz
#
# Principe : release atomique.
#   1. extrait l'archive dans .output-new
#   2. sauvegarde l'ancienne version dans .output-prev
#   3. bascule, redémarre systemd, healthcheck
#   4. rollback automatique si le service ne répond pas

set -Eeuo pipefail

APP_DIR="/var/www/zugher"
SERVICE="zugher"
HEALTH_URL="http://127.0.0.1:3000"
ARCHIVE="${1:-/tmp/zugher-output.tar.gz}"
GIT_SHA="${GIT_SHA:-inconnu}"
LOG_PREFIX="[release $(date -u +%Y-%m-%dT%H:%M:%SZ)]"

log()  { echo "$LOG_PREFIX $*"; }
fail() { echo "$LOG_PREFIX ❌ $*" >&2; exit 1; }

[ -f "$ARCHIVE" ] || fail "archive introuvable: $ARCHIVE"
cd "$APP_DIR" || fail "APP_DIR introuvable: $APP_DIR"
[ -f ".env.production" ] || fail ".env.production manquant sur le VPS (chmod 600)"

log "▶ extraction du build (commit ${GIT_SHA:0:8})"
rm -rf .output-new
mkdir -p .output-new
tar -xzf "$ARCHIVE" -C .output-new --strip-components=1
[ -f ".output-new/server/index.mjs" ] || fail "entrypoint absent dans l'archive"

log "▶ bascule de version"
rm -rf .output-prev
[ -d .output ] && mv .output .output-prev
mv .output-new .output

restart_and_check() {
  sudo /bin/systemctl restart "$SERVICE"
  local code
  for _ in $(seq 1 20); do
    code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 "$HEALTH_URL" || echo "000")
    case "$code" in
      200|301|302) log "✅ service up (HTTP $code)"; return 0 ;;
    esac
    sleep 2
  done
  log "⚠ service KO après 40s (dernier code: ${code:-000})"
  return 1
}

log "▶ redémarrage systemd ($SERVICE)"
if restart_and_check; then
  rm -f "$ARCHIVE"
  log "✅ version ${GIT_SHA:0:8} déployée"
  exit 0
fi

log "▶ ROLLBACK vers la version précédente"
if [ -d .output-prev ]; then
  rm -rf .output
  mv .output-prev .output
  if restart_and_check; then
    fail "déploiement échoué — rollback effectué, l'ancienne version tourne à nouveau"
  fi
  fail "déploiement échoué ET rollback échoué — intervention manuelle requise"
fi

sudo /bin/systemctl status "$SERVICE" --no-pager -l | head -n 30 || true
fail "déploiement échoué, aucune version précédente disponible"
