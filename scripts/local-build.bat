@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: Script de build local — Zugher (Windows CMD)
:: Usage : scripts\local-build.bat [chemin\vers\zugher]

set "REPO_URL=https://github.com/zugherhorizon/zugher.git"
set "DEFAULT_DIR=zugher"
if "%~1"=="" (
  set "TARGET_DIR=%DEFAULT_DIR%"
) else (
  set "TARGET_DIR=%~1"
)

if exist "%TARGET_DIR%\.git" (
  echo ➡️  Pull --ff-only dans %TARGET_DIR% …
  cd /d "%TARGET_DIR%"
  git pull --ff-only origin main
) else (
  echo ➡️  Clone dans %TARGET_DIR% …
  git clone "%REPO_URL%" "%TARGET_DIR%"
  cd /d "%TARGET_DIR%"
)

echo ➡️  Installation des dépendances (bun) …
bun install --frozen-lockfile

echo ➡️  Build local …
bun run build

echo ✅ Build termine.
echo    Pour previsualiser : bun run preview
echo    Pour developper    : bun run dev

endlocal
