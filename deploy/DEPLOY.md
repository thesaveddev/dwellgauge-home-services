# DwellGauge — VPS Deployment Guide

## Prerequisites

- VPS: 2 vCores, 4 GB RAM, 40 GB SSD (your purchase)
- Ubuntu 22.04/24.04
- Root or sudo access
- Domain name (can configure later)
- This repository on GitHub

---

## Step 1: Upload deploy scripts to VPS

From your local machine (where this project lives):

```bash
# Upload the deploy directory
scp -r deploy/ ubuntu@158.69.221.87:/home/ubuntu/
```

Or if you prefer to paste directly on the VPS, SSH in first:

```bash
ssh ubuntu@158.69.221.87
```

Then create the scripts on the VPS:

```bash
mkdir -p /home/ubuntu/deploy
# Copy the contents of deploy/ folder here
```

---

## Step 2: Provision the VPS

SSH into your VPS:

```bash
ssh ubuntu@158.69.221.87
```

Enter your password: `Uhf9bDQHfbjv`

Run the provision script as root:

```bash
sudo bash /home/ubuntu/deploy/provision-vps.sh
```

This installs:
- Node.js 22
- PostgreSQL 16 (tuned for 4 GB RAM)
- Nginx
- PM2 (process manager)
- UFW firewall
- Fail2ban

**Save the database credentials** printed at the end. The script also writes them to `/var/www/dwellgauge/.db-credentials`.

---

## Step 3: Deploy the app

```bash
bash /home/ubuntu/deploy/deploy-app.sh
```

This:
1. Clones the repo from GitHub
2. Installs npm dependencies
3. Creates `.env.local` with production config
4. Runs all database migrations
5. Seeds Florida license data
6. Builds the production bundle
7. Starts the app with PM2
8. Runs a health check

**Verify it's running:**

```bash
curl http://localhost:3000/api/health
```

Should return: `{"ok":true,"storage":"postgres",...}`

---

## Step 4: Configure Nginx

```bash
# Copy the Nginx config
sudo cp /home/ubuntu/deploy/nginx-dwellgauge.conf /etc/nginx/sites-available/dwellgauge

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Enable DwellGauge
sudo ln -sf /etc/nginx/sites-available/dwellgauge /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

**Verify Nginx is proxying:**

```bash
curl -I http://localhost
```

Should return `200` with DwellGauge headers.

---

## Step 5: Configure DNS (when domain is ready)

At your domain registrar, add:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 158.69.221.87 | 300 |
| A | www | 158.69.221.87 | 300 |

Wait for DNS propagation (5-30 minutes). Verify:

```bash
dig +short yourdomain.com
# Should return: 158.69.221.87
```

---

## Step 6: Enable SSL with Let's Encrypt

Once DNS is propagating:

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts. Certbot will:
1. Verify domain ownership
2. Obtain SSL certificate
3. Auto-configure Nginx for HTTPS
4. Set up auto-renewal

**Verify SSL:**

```bash
curl -I https://yourdomain.com
```

Should return `200` with `Strict-Transport-Security` header.

---

## Step 7: Update production URL

After SSL is working, update the environment:

```bash
cd /var/www/dwellgauge
sed -i 's|http://localhost:3000|https://yourdomain.com|g' .env.local
pm2 restart dwellgauge
```

---

## Ongoing Management

### View logs
```bash
pm2 logs dwellgauge
```

### Restart app
```bash
pm2 restart dwellgauge
```

### Check status
```bash
pm2 status
```

### Deploy updates (pull latest changes)
```bash
cd /var/www/dwellgauge
git pull origin master
npm ci --no-audit --no-fund
NODE_ENV=production npm run build
pm2 restart dwellgauge
```

### Database backup
```bash
pg_dump -U dwellgauge dwellgauge | gzip > /var/backups/dwellgauge-$(date +%Y%m%d).sql.gz
```

### View database credentials
```bash
cat /var/www/dwellgauge/.db-credentials
```

---

## Troubleshooting

### App not responding
```bash
pm2 logs dwellgauge --lines 50
pm2 status
curl http://localhost:3000/api/health
```

### Database connection errors
```bash
source /var/www/dwellgauge/.db-credentials
psql "$DATABASE_URL" -c "SELECT count(*) FROM licenses;"
```

### Nginx 502 Bad Gateway
```bash
# App might be down
pm2 status
pm2 restart dwellgauge

# Check if port 3000 is listening
netstat -tlnp | grep 3000
```

### SSL certificate issues
```bash
sudo certbot renew --dry-run
sudo nginx -t && sudo systemctl reload nginx
```

### Disk space check
```bash
df -h /
du -sh /var/www/dwellgauge/.next
du -sh /var/lib/postgresql
```

---

## Security Checklist

Before going live:

- [ ] Change `ADMIN_PASSWORD` in `.env.local`
- [ ] Change `AUTH_SECRET` in `.env.local`
- [ ] Verify `UFW` is active: `sudo ufw status`
- [ ] Verify SSL is working: `curl -I https://yourdomain.com`
- [ ] Test admin login: visit `/admin`
- [ ] Verify health endpoint: `/api/health` returns `ok:true`
- [ ] Check that `/api/health/data` doesn't expose credentials
- [ ] Review Nginx access logs for unusual patterns
