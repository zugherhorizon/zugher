# Déploiement Zugher — VPS OVH

Stack : Ubuntu 24.04 + Node 20 + Bun + Nginx + systemd + Let's Encrypt.

## Installation initiale (une seule fois)

### 1. Préparer le VPS

```bash
ssh ubuntu@<IP>
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx ufw fail2ban unzip build-essential \
                    certbot python3-certbot-nginx
sudo ufw allow OpenSSH && sudo ufw allow 'Nginx Full' && sudo ufw --force enable

# Node 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt install -y nodejs

# Bun
curl -fsSL https://bun.sh/install | bash
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### 2. Cloner le projet

```bash
sudo mkdir -p /var/www/zugher
sudo chown -R $USER:$USER /var/www/zugher
git clone https://github.com/zugherhorizon/zugher.git /var/www/zugher
cd /var/www/zugher
```

### 3. Variables d'environnement

Créer `/var/www/zugher/.env.production` (voir liste dans `deploy.sh`) puis :

```bash
chmod 600 /var/www/zugher/.env.production
```

### 4. Service systemd

```bash
sudo cp deploy/zugher.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable zugher
```

### 5. Nginx

```bash
sudo cp deploy/nginx-zugher.conf /etc/nginx/sites-available/zugher
sudo ln -sf /etc/nginx/sites-available/zugher /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

### 6. SSL (après propagation DNS)

```bash
sudo certbot --nginx -d zugher.com -d www.zugher.com
```

### 7. Premier build & démarrage

```bash
cd /var/www/zugher
bun install
NITRO_PRESET=node-server NODE_OPTIONS="--max-old-space-size=1536" node ./node_modules/vite/bin/vite.js build
sudo systemctl start zugher
sudo systemctl status zugher
```

### 8. Configurer Lovable Cloud (Supabase)

- Auth → URL Configuration → Site URL = `https://zugher.com`
- Auth → URL Configuration → Redirect URLs += `https://zugher.com/**`
- Auth → Providers → Google → ajouter `https://zugher.com` aux Authorized JS origins

### 9. Webhook Paddle

Paddle dashboard → Notifications → URL :
```
https://zugher.com/api/public/payments/webhook?env=live
```

## Mises à jour ultérieures

```bash
ssh ubuntu@<IP>
cd /var/www/zugher
./deploy/deploy.sh
```

## Logs & debug

```bash
sudo journalctl -u zugher -f         # logs live
sudo tail -f /var/log/zugher.log     # stdout/stderr applicatifs
sudo tail -f /var/log/nginx/access.log /var/log/nginx/error.log
sudo systemctl restart zugher        # redémarrage manuel
```
