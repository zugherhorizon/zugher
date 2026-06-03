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

Active **Sauvegarde automatisée** (~2 €/mois HT) :
- snapshot quotidien
- rétention 7 jours
- restauration en 1 clic depuis l'interface

Optionnel complément : **Snapshot manuel** (~1,20 €/mois) à prendre **juste avant** chaque grosse migration de schéma (ALTER TABLE risqués).

---

## 3. SSL — Let's Encrypt (sur le VPS, après propagation DNS)

Connecte-toi puis :
```bash
ssh ubuntu@51.68.227.85
sudo certbot --nginx -d zugher.fr -d www.zugher.fr \
  --non-interactive --agree-tos -m contact@zugher.fr --redirect
sudo systemctl status certbot.timer    # renouvellement auto déjà actif
```
Test du renouvellement :
```bash
sudo certbot renew --dry-run
```

---

## 4. Déploiement automatique (GitHub Actions)

Le workflow `.github/workflows/deploy.yml` est créé. Il déclenche `./deploy/deploy.sh` à chaque push sur `main`.

### Setup unique — clé SSH dédiée au CI

**Sur ta machine locale** (pas sur le VPS) :
```bash
ssh-keygen -t ed25519 -f ~/.ssh/zugher_deploy -C "github-actions" -N ""
ssh-copy-id -i ~/.ssh/zugher_deploy.pub ubuntu@51.68.227.85
cat ~/.ssh/zugher_deploy        # → copier le contenu (clé PRIVÉE)
```

**Sur GitHub** : repo → Settings → Secrets and variables → Actions → **New repository secret** :
- Nom : `VPS_SSH_PRIVATE_KEY`
- Valeur : contenu complet de `~/.ssh/zugher_deploy` (lignes `-----BEGIN…END-----` incluses)

**Sur le VPS** — donner à `ubuntu` le droit de redémarrer le service sans mot de passe (utilisé par `deploy.sh`) :
```bash
echo 'ubuntu ALL=(ALL) NOPASSWD: /bin/systemctl restart zugher, /bin/systemctl status zugher' \
  | sudo tee /etc/sudoers.d/zugher-deploy
sudo chmod 440 /etc/sudoers.d/zugher-deploy
```

### Vérif

Push un commit vide :
```bash
git commit --allow-empty -m "ci: test deploy" && git push
```
Onglet **Actions** sur GitHub → job `Deploy to OVH VPS` doit passer vert, puis `https://zugher.fr` répondre 200.

---

## 5. Hardening complémentaire (recommandé une fois en prod)

```bash
# Désactiver login root + password (clé SSH uniquement)
sudo sed -i 's/^#*PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sudo sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart ssh

# Mises à jour de sécurité auto
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

# fail2ban (SSH) actif par défaut, vérifier :
sudo systemctl status fail2ban
```

---

## Ordre recommandé d'exécution

1. DNS (section 1) — attendre propagation
2. Backups OVH (section 2) — 2 clics dans le panel
3. Install initiale du VPS (cf. `deploy/README.md` étapes 1→7)
4. SSL (section 3)
5. Secret GitHub + sudoers + push test (section 4)
6. Hardening (section 5)
