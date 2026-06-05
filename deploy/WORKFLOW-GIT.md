# Workflow Git — local ↔ GitHub ↔ VPS

Chaîne de déploiement complète :

```text
Lovable editor ──► GitHub (zugherhorizon/zugher) ──► GitHub Actions ──► VPS OVH
       ▲                       ▲
       │                       │
       └──── git push ─────────┘
   C:\Users\amrab\Documents\GitHub\zugherrepo
```

Deux sources de vérité, un seul dépôt central : **GitHub `zugherhorizon/zugher` branche `main`**.

---

## 1. Quotidien — synchroniser ta machine locale avec Lovable

Lovable pousse en temps réel sur `main`. À chaque session de travail local :

```bash
cd C:\Users\amrab\Documents\GitHub\zugherrepo
git fetch origin
git status
git pull --ff-only origin main
```

Si `git pull` échoue avec « divergent branches », c'est que tu as commit localement pendant que Lovable poussait. Résous :

```bash
git stash              # met tes changements de côté
git pull --ff-only origin main
git stash pop          # réapplique (résous les conflits éventuels)
```

---

## 2. Pousser une modification locale vers GitHub (et donc le VPS)

```bash
cd C:\Users\amrab\Documents\GitHub\zugherrepo
git pull --ff-only origin main     # toujours avant de bosser
# ... édite le code ...
git add .
git commit -m "feat: description claire"
git push origin main
```

→ déclenche automatiquement `.github/workflows/deploy.yml` qui SSH sur le VPS et lance `deploy/deploy.sh`.

**Suivi du déploiement** : https://github.com/zugherhorizon/zugher/actions

Job vert = site mis à jour sur https://zugher.com (smoke test inclus dans le workflow).

---

## 3. Vérifier qu'une modification Lovable est bien partie sur le VPS

1. Lovable pousse sur `main` → onglet **Actions** sur GitHub → workflow `Deploy to OVH VPS` doit passer vert (~2–3 min).
2. Si rouge : ouvre le job → onglet `deploy via SSH` pour voir le log `deploy.sh`.
3. Côté VPS :
   ```bash
   ssh ubuntu@51.68.227.85
   cd /var/www/zugher
   git log -1 --oneline      # doit correspondre au dernier commit GitHub
   sudo systemctl status zugher
   sudo tail -n 50 /var/log/zugher.log
   ```

---

## 4. Cas particuliers

### Annuler un déploiement raté

```bash
cd C:\Users\amrab\Documents\GitHub\zugherrepo
git revert HEAD
git push origin main     # nouveau commit qui annule le précédent + redéploie
```

### Forcer un re-déploiement sans changement de code

GitHub → repo `zugherhorizon/zugher` → onglet **Actions → Deploy to OVH VPS → Run workflow**.

### Travailler sur une branche sans déclencher de prod

```bash
git checkout -b feat/ma-feature
git push origin feat/ma-feature   # le workflow ne tourne que sur 'main'
```

Quand prêt : Pull Request sur GitHub → merge → déploiement auto.

---

## 5. Règles d'or

1. **Toujours `git pull --ff-only` avant de commencer** — évite les conflits avec Lovable.
2. **Jamais de `git push --force` sur `main`** — casserait la chronologie partagée avec Lovable.
3. **Commits atomiques** : un sujet = un commit = un déploiement traçable.
4. **Secrets jamais committés** — `.env.production` reste sur le VPS uniquement (`chmod 600`).
5. **Si Actions échoue 2 fois de suite**, regarde `/var/log/zugher.log` sur le VPS avant de re-pousser.
