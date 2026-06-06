#!/usr/bin/env bash
# Script de build local — Zugher
# Usage : bash scripts/local-build.sh [chemin/vers/zugher]

set -euo pipefail

REPO_URL="https://github.com/zugherhorizon/zugher.git"
DEFAULT_DIR="zugher"
TARGET_DIR="${1:-$DEFAULT_DIR}"

# Résoudre le chemin absolu
if command -v realpath &>/dev/null; then
  ABS_DIR=$(realpath "$TARGET_DIR" 2>/dev/null || echo "$TARGET_DIR")
else
  ABS_DIR="$TARGET_DIR"
fi

if [ ! -d "$TARGET_DIR/.git" ]; then
  echo "➡️  Clone dans $ABS_DIR …"
  git clone "$REPO_URL" "$TARGET_DIR"
else
  echo "➡️  Pull --ff-only dans $ABS_DIR …"
  cd "$TARGET_DIR"
  git pull --ff-only origin main
fi

cd "$TARGET_DIR"

echo "➡️  Installation des dépendances (bun) …"
bun install --frozen-lockfile

echo "➡️  Build local …"
bun run build

echo "✅ Build terminé."
echo "   Pour prévisualiser : bun run preview"
echo "   Pour développer    : bun run dev"
