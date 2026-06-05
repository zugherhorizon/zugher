# Configuration OVH — Zugher (VPS vps-bbe645b3)

VPS : `51.68.227.85` (IPv6 `2001:41d0:305:2100::6171`) — utilisateur `ubuntu`.

---

## 1. DNS — zone `zugher.fr` (Espace Client OVH → Web Cloud → Noms de domaine → zugher.fr → Zone DNS)

Supprime les anciens enregistrements A/AAAA pour `@` et `www`, puis ajoute :

| Type   | Sous-domaine | Cible                          | TTL |
|--------|--------------|--------------------------------|-----|
| A      | @            | `51.68.227.85`                 | 600 |
| A      | www          | `51.68.227.85`                 | 600 |
| AAAA   | @            | `2001:41d0:305:2100::6171`     | 600 |
| AAAA   | www          | `2001:41d0:305:2100::6171`     | 600 |
| CAA    | @            | `0 issue "letsencrypt.org"`    | 600 |

Vérifie la propagation (5–30 min) :
```bash
dig +short zugher.fr A
dig +short www.zugher.fr A
```
Les deux doivent renvoyer `51.68.227.85` avant l'étape SSL.

---

## 2. Sauvegardes automatiques OVH

**Espace Client OVH → Bare Metal Cloud → VPS → `vps-bbe645b3` → onglet « Sauvegardes »**

Active **Sauvegarde automatisée** (~2 €/mois HT) — snapshot quotidien, rétention 7 jours, restauration 1 clic. Optionnel : **Snapshot manuel** (~1,20 €/mois) avant chaque migration de schéma risquée.

---

## 3. SSL — Let's Encrypt (sur le VPS, après propagation DNS)

```bash
ssh ubuntu@51.68.227.85
sudo certbot --nginx -d zugher.fr -d www.zugher.fr \
  --non-interactive --agree-tos -m contact@zugher.fr --redirect
sudo certbot renew --dry-run
```

---

## 4. Déploiement automatique (GitHub Actions = webhook GitHub natif)

> ℹ️ **Pas besoin d'installer de webhook receiver sur le VPS.** GitHub Actions est déjà déclenché par le webhook interne de GitHub à chaque `push` sur `main`. Le workflow `.github/workflows/deploy.yml` se connecte en SSH au VPS et lance `./deploy/deploy.sh`.

### 4.a — Clé SSH dédiée au CI (une seule fois, sur ta machine locale)

```bash
ssh-keygen -t ed25519 -f ~/.ssh/zugher_deploy -C "github-actions@zugher" -N ""
ssh-copy-id -i ~/.ssh/zugher_deploy.pub ubuntu@51.68.227.85
ssh -i ~/.ssh/zugher_deploy ubuntu@51.68.227.85 "echo OK"   # doit afficher OK sans mot de passe
cat ~/.ssh/zugher_deploy                                    # ← copier la clé PRIVÉE complète
```

### 4.b — Secret GitHub (une seule fois)

Repo `zugherhorizon/zugher` → **Settings → Secrets and variables → Actions → New repository secret** :
- Nom : `VPS_SSH_PRIVATE_KEY`
- Valeur : contenu complet de `~/.ssh/zugher_deploy` (lignes `-----BEGIN…END-----` incluses)

### 4.c — Sudoers sur le VPS (deploy.sh redémarre systemd sans mot de passe)

```bash
ssh ubuntu@51.68.227.85
echo 'ubuntu ALL=(ALL) NOPASSWD: /bin/systemctl restart zugher, /bin/systemctl status zugher' \
  | sudo tee /etc/sudoers.d/zugher-deploy
sudo chmod 440 /etc/sudoers.d/zugher-deploy
sudo visudo -c    # → doit dire "parsed OK"
```

### 4.d — Vérifier que le webhook GitHub est bien actif

Repo `zugherhorizon/zugher` → **Settings → Webhooks** : tu dois voir un webhook géré par GitHub Actions (créé automatiquement quand un workflow existe — rien à configurer).

### 4.e — Test de bout en bout

```bash
git commit --allow-empty -m "ci: test auto-deploy"
git push origin main
```

→ Onglet **Actions** sur GitHub : le job `Deploy to OVH VPS` doit passer vert (job `deploy` puis `Smoke test` qui hit `https://zugher.fr` jusqu'à recevoir 200).

### 4.f — Déclenchement manuel

Repo → **Actions → Deploy to OVH VPS → Run workflow** (le workflow expose `workflow_dispatch`).

---

## 5. Hardening complémentaire (après mise en prod)

```bash
sudo sed -i 's/^#*PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sudo sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart ssh

sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

sudo systemctl status fail2ban
```

---

## Ordre recommandé

1. DNS (§1) — attendre propagation
2. Backups OVH (§2)
3. Install VPS (cf. `deploy/README.md` étapes 1→7)
4. SSL (§3)
5. Auto-deploy (§4 : clé SSH → secret GitHub → sudoers → push test)
6. Hardening (§5)
