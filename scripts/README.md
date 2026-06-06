# Scripts de build local

## `local-build.sh` (Git Bash / WSL / macOS / Linux)

```bash
# Depuis n'importe quel dossier
bash /chemin/vers/zugher/scripts/local-build.sh

# Ou spécifier un dossier cible
bash scripts/local-build.sh ../mon-zugher
```

## `local-build.bat` (Windows CMD / PowerShell)

```cmd
:: Depuis le dossier du repo
scripts\local-build.bat

:: Ou spécifier un dossier cible
scripts\local-build.bat C:\Users\amrab\Documents\GitHub\zugherrepo
```

## Prérequis

- [Bun](https://bun.sh/) installé (`bun --version`)
- Git installé

## Ce que fait le script

1. **Clone** le repo si le dossier n'existe pas, sinon **pull** `main` en fast-forward.
2. **`bun install --frozen-lockfile`** pour synchroniser les dépendances.
3. **`bun run build`** pour compiler le projet.
