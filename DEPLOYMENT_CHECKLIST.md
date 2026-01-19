# Quick Deployment Checklist - PM2

Gunakan checklist ini saat deployment untuk memastikan tidak ada step yang terlewat.

## 📋 Pre-Deployment

- [ ] Compress project: `zip -r travel-api.zip travel-api -x "*/node_modules/*" -x "*/dist/*"`
- [ ] Copy credentials dari `.env` local
- [ ] Pastikan domain sudah pointing ke VPS IP

## 🖥️ VPS Preparation

```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install pnpm & PM2
npm install -g pnpm pm2

# Create directory
mkdir -p /www/wwwroot/travel-api
```

## 📤 Upload Project

Via aaPanel File Manager:

- [ ] Login ke aaPanel (http://your-vps-ip:7800)
- [ ] Navigate ke `/www/wwwroot/travel-api`
- [ ] Upload `travel-api.zip`
- [ ] Extract file
- [ ] Delete zip file

## ⚙️ Configuration

```bash
cd /www/wwwroot/travel-api

# Create .env
cp .env.example .env
nano .env  # Edit dengan credentials production

# Secure .env
chmod 600 .env
chown www-data:www-data .env

# Run security check
chmod +x check-env-security.sh
./check-env-security.sh
```

## 🔨 Build & Deploy

```bash
# Install dependencies
pnpm install --prod

# Build
pnpm build

# Create logs directory
mkdir -p logs

# Start PM2
pm2 start ecosystem.config.js

# Save & setup auto-start
pm2 save
pm2 startup
```

## 🌐 Reverse Proxy (aaPanel)

- [ ] Website → Add site → `api.pacifictravelindo.com`
- [ ] Reverse Proxy → Target: `http://127.0.0.1:8082`
- [ ] SSL → Let's Encrypt → Apply
- [ ] Force HTTPS → Enable

## ✅ Verification

```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs travel-api --lines 50

# Test API
curl https://api.pacifictravelindo.com/health

# Monitor
pm2 monit
```

## 🔧 Post-Deployment

```bash
# Setup log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# Setup monitoring cron
crontab -e
# Add: 0 * * * * /www/wwwroot/travel-api/monitor.sh >> /var/log/travel-api-monitor.log 2>&1
```

## 🎯 Final Checks

- [ ] PM2 status: online
- [ ] Memory usage: < 500 MB
- [ ] API responding via HTTPS
- [ ] No errors in logs
- [ ] Frontend can connect
- [ ] Auto-restart configured
- [ ] Monitoring setup

---

**Done! 🚀** Your API is now live at `https://api.pacifictravelindo.com`
