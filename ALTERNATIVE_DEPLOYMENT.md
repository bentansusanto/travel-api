# Alternative Deployment: Direct Upload (Tanpa Docker)

## 📋 Daftar Isi

1. [Deployment Tanpa Docker](#1-deployment-tanpa-docker)
2. [Memory Limitation dengan PM2](#2-memory-limitation-dengan-pm2)
3. [Keamanan Environment Variables](#3-keamanan-environment-variables)
4. [Perbandingan Docker vs Direct](#4-perbandingan-docker-vs-direct)

---

## 1. Deployment Tanpa Docker

### ✅ Ya, Bisa! Menggunakan PM2 (Process Manager)

PM2 adalah production process manager untuk Node.js yang memberikan:

- ✅ Auto-restart jika crash
- ✅ Memory limit
- ✅ CPU limit
- ✅ Load balancing (cluster mode)
- ✅ Log management
- ✅ Monitoring

---

### 📝 Step-by-Step Deployment Direct (PM2)

#### **Step 1: Install Node.js di VPS**

```bash
# SSH ke VPS
ssh root@your-vps-ip

# Install Node.js 20 (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version
```

#### **Step 2: Install pnpm dan PM2**

```bash
# Install pnpm globally
npm install -g pnpm

# Install PM2 globally
npm install -g pm2

# Verify
pnpm --version
pm2 --version
```

#### **Step 3: Upload Project ke VPS**

**Opsi A: Via aaPanel File Manager**

1. Compress project di local: `zip -r travel-api.zip travel-api/`
2. Login ke aaPanel → File Manager
3. Navigate ke `/www/wwwroot/`
4. Upload `travel-api.zip`
5. Extract di VPS

**Opsi B: Via Git (Recommended)**

```bash
cd /www/wwwroot
git clone https://github.com/your-username/travel-app.git
cd travel-app/travel-api
```

**Opsi C: Via SCP**

```bash
# Di local machine
scp -r /Users/test/Documents/project-benny/travel-app/travel-api root@your-vps-ip:/www/wwwroot/
```

#### **Step 4: Setup Environment Variables**

```bash
cd /www/wwwroot/travel-api

# Copy .env.example to .env
cp .env.example .env

# Edit dengan credentials production
nano .env
```

**PENTING:** Update `DATABASE_HOST` ke IP MySQL Anda:

```env
DATABASE_HOST=localhost  # Jika MySQL di VPS yang sama
# atau
DATABASE_HOST=31.97.111.170  # Jika MySQL eksternal
```

#### **Step 5: Install Dependencies & Build**

```bash
# Install dependencies
pnpm install --prod

# Build aplikasi
pnpm build

# Verify build
ls -la dist/
```

#### **Step 6: Create PM2 Ecosystem File**

Buat file `ecosystem.config.js`:

```bash
nano ecosystem.config.js
```

Isi dengan konfigurasi berikut:

```javascript
module.exports = {
  apps: [
    {
      name: 'travel-api',
      script: './dist/main.js',
      instances: 2, // Cluster mode: 2 instances (sesuaikan dengan CPU)
      exec_mode: 'cluster',

      // Environment variables
      env: {
        NODE_ENV: 'production',
        PORT: 8082,
      },

      // Memory limit (PENTING untuk shared VPS!)
      max_memory_restart: '400M', // Restart jika memory > 400MB

      // Auto-restart configuration
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',

      // Logging
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Advanced settings
      kill_timeout: 5000,
      listen_timeout: 3000,

      // Environment file
      env_file: '.env',
    },
  ],
};
```

#### **Step 7: Start dengan PM2**

```bash
# Create logs directory
mkdir -p logs

# Start aplikasi
pm2 start ecosystem.config.js

# Verify
pm2 status
pm2 logs travel-api

# Save PM2 configuration
pm2 save

# Setup auto-start on reboot
pm2 startup
# Jalankan command yang diberikan PM2
```

#### **Step 8: Setup Reverse Proxy di aaPanel**

Same as Docker deployment:

1. aaPanel → Website → Add Site
2. Domain: `api.pacifictravelindo.com`
3. Reverse Proxy: `http://localhost:8082`
4. SSL: Enable Let's Encrypt

---

## 2. Memory Limitation dengan PM2

### 🎯 Cara Limit Memory Tanpa Docker

#### **A. Per-Application Limit (Recommended)**

Di `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'travel-api',
      script: './dist/main.js',

      // MEMORY LIMIT
      max_memory_restart: '400M', // Auto-restart jika exceed

      // NODE.JS HEAP LIMIT
      node_args: '--max-old-space-size=384', // V8 heap limit

      instances: 2,
      exec_mode: 'cluster',
    },
  ],
};
```

**Penjelasan:**

- `max_memory_restart: '400M'` → PM2 restart app jika memory usage > 400MB
- `node_args: '--max-old-space-size=384'` → Node.js heap limit 384MB
- `instances: 2` → 2 processes (total ~800MB for both)

#### **B. System-wide Limit (cgroups)**

Untuk limit lebih ketat, gunakan cgroups:

```bash
# Install cgroup-tools
apt-get install cgroup-tools

# Create cgroup for travel-api
cgcreate -g memory:/travel-api

# Set memory limit (512MB)
echo 536870912 > /sys/fs/cgroup/memory/travel-api/memory.limit_in_bytes

# Run PM2 in cgroup
cgexec -g memory:travel-api pm2 start ecosystem.config.js
```

#### **C. Monitoring Memory Usage**

```bash
# Real-time monitoring
pm2 monit

# Memory usage
pm2 status

# Detailed info
pm2 show travel-api

# Logs
pm2 logs travel-api --lines 100
```

---

## 3. Keamanan Environment Variables

### 🔐 Best Practices untuk Mengamankan .env

#### **A. File Permissions (CRITICAL!)**

```bash
# Set .env file permissions (owner read/write only)
chmod 600 .env

# Verify
ls -la .env
# Should show: -rw------- (600)

# Set ownership
chown www-data:www-data .env
# atau
chown root:root .env
```

**Penjelasan:**

- `600` = Owner bisa read/write, others tidak bisa akses sama sekali
- Prevents other users di VPS dari membaca credentials

#### **B. Git Ignore (MANDATORY!)**

Pastikan `.gitignore` berisi:

```gitignore
# Environment files
.env
.env.local
.env.*.local
.env.production

# Keep example only
!.env.example
```

**Verify:**

```bash
# Check if .env is tracked
git status

# If .env appears, remove from git
git rm --cached .env
git commit -m "Remove .env from git"
```

#### **C. Encrypt Sensitive Values**

Untuk extra security, encrypt sensitive values:

**Install dotenv-vault:**

```bash
npm install -g dotenv-vault

# Login
dotenv-vault login

# Encrypt .env
dotenv-vault encrypt
```

**Atau gunakan manual encryption:**

```javascript
// src/config/encryption.ts
import * as crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32 bytes
const IV_LENGTH = 16;

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    iv
  );
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift(), 'hex');
  const encrypted = Buffer.from(parts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    iv
  );
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}
```

#### **D. Use Environment-Specific Files**

```bash
# Development
.env.development

# Production
.env.production

# Load based on NODE_ENV
# In package.json
"start:prod": "env-cmd -f .env.production node dist/main"
```

#### **E. Secrets Management (Advanced)**

Untuk production yang lebih secure:

**Opsi 1: HashiCorp Vault**

```bash
# Install Vault
wget https://releases.hashicorp.com/vault/1.15.0/vault_1.15.0_linux_amd64.zip
unzip vault_1.15.0_linux_amd64.zip
mv vault /usr/local/bin/

# Start Vault server
vault server -dev

# Store secrets
vault kv put secret/travel-api \
  DATABASE_PASSWORD="your_password" \
  PAYPAL_SECRET="your_secret"

# Retrieve in app
vault kv get -field=DATABASE_PASSWORD secret/travel-api
```

**Opsi 2: AWS Secrets Manager / Google Secret Manager**

**Opsi 3: aaPanel Environment Variables**

Di aaPanel:

1. Website → PHP Settings → Environment Variables
2. Add variables (tidak tersimpan di file)

#### **F. Audit & Rotation**

```bash
# Check who can read .env
ls -la .env

# Check file history (jika di git)
git log --all --full-history -- .env

# Rotate secrets regularly (monthly)
# 1. Generate new secrets
# 2. Update .env
# 3. Restart application
pm2 restart travel-api
```

#### **G. .env Security Checklist**

```bash
# Create security check script
cat > check-env-security.sh << 'EOF'
#!/bin/bash

echo "🔐 Environment Security Check"
echo "================================"

# Check .env permissions
if [ -f .env ]; then
    PERMS=$(stat -c %a .env 2>/dev/null || stat -f %A .env)
    if [ "$PERMS" = "600" ]; then
        echo "✅ .env permissions: $PERMS (secure)"
    else
        echo "❌ .env permissions: $PERMS (INSECURE! Should be 600)"
        echo "   Fix: chmod 600 .env"
    fi
else
    echo "⚠️  .env file not found"
fi

# Check if .env is in git
if git ls-files --error-unmatch .env 2>/dev/null; then
    echo "❌ .env is tracked by git (DANGEROUS!)"
    echo "   Fix: git rm --cached .env"
else
    echo "✅ .env not tracked by git"
fi

# Check .gitignore
if grep -q "^\.env$" .gitignore 2>/dev/null; then
    echo "✅ .env in .gitignore"
else
    echo "❌ .env not in .gitignore"
    echo "   Fix: echo '.env' >> .gitignore"
fi

# Check for exposed secrets in code
if grep -r "password.*=.*['\"]" src/ 2>/dev/null | grep -v "process.env"; then
    echo "⚠️  Possible hardcoded passwords found in code"
else
    echo "✅ No hardcoded passwords detected"
fi

echo "================================"
EOF

chmod +x check-env-security.sh
./check-env-security.sh
```

---

## 4. Perbandingan Docker vs Direct

### 📊 Comparison Table

| Aspek                    | Docker       | PM2 (Direct)    | Rekomendasi               |
| ------------------------ | ------------ | --------------- | ------------------------- |
| **Memory Usage**         | 700-1200 MB  | 400-600 MB      | PM2 (lebih hemat)         |
| **Setup Complexity**     | Medium       | Easy            | PM2 (lebih mudah)         |
| **Isolation**            | ✅ Excellent | ❌ Shared OS    | Docker                    |
| **Security**             | ✅ Better    | ⚠️ Good         | Docker                    |
| **Performance**          | ~95% native  | 100% native     | PM2 (sedikit lebih cepat) |
| **Portability**          | ✅ Anywhere  | ⚠️ OS-dependent | Docker                    |
| **Memory Limit**         | Built-in     | Via PM2/cgroups | Docker (lebih mudah)      |
| **Auto-restart**         | ✅ Yes       | ✅ Yes          | Tie                       |
| **Monitoring**           | docker stats | pm2 monit       | PM2 (lebih user-friendly) |
| **Rollback**             | ✅ Instant   | ⚠️ Manual       | Docker                    |
| **Dependency Conflicts** | ✅ Isolated  | ❌ Possible     | Docker                    |
| **Learning Curve**       | Steep        | Gentle          | PM2                       |

---

### 🎯 Rekomendasi untuk VPS Anda (16GB RAM, 4 WordPress)

#### **Gunakan PM2 (Direct) jika:**

- ✅ Ingin hemat memory (~300-400 MB saved)
- ✅ Tim belum familiar dengan Docker
- ✅ Setup cepat dan simple
- ✅ Hanya 1 environment (production)
- ✅ Tidak butuh portability

#### **Gunakan Docker jika:**

- ✅ Ingin isolasi maksimal dari WordPress
- ✅ Butuh reproducible environment
- ✅ Plan untuk scale atau multi-environment
- ✅ Security adalah prioritas utama
- ✅ Tim familiar dengan Docker

---

### 💡 Rekomendasi Saya untuk Anda:

**Mulai dengan PM2, upgrade ke Docker nanti jika perlu**

**Alasan:**

1. VPS Anda cukup powerful (16GB RAM)
2. PM2 lebih mudah untuk first deployment
3. Hemat ~300-400 MB memory
4. Bisa upgrade ke Docker kapan saja tanpa downtime
5. Monitoring PM2 lebih user-friendly

**Migration path:**

```
Phase 1: Deploy dengan PM2 (sekarang)
         ↓
Phase 2: Monitor performance & stability (1-2 bulan)
         ↓
Phase 3: Jika butuh isolation/scaling → migrate ke Docker
```

---

## 📝 Quick Start Guide - PM2 Deployment

### Minimal Steps:

```bash
# 1. SSH ke VPS
ssh root@your-vps-ip

# 2. Install Node.js & PM2
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
npm install -g pnpm pm2

# 3. Upload & setup project
cd /www/wwwroot
# Upload via aaPanel File Manager atau git clone
cd travel-api

# 4. Setup environment
cp .env.example .env
nano .env  # Edit credentials
chmod 600 .env  # SECURE!

# 5. Install & build
pnpm install --prod
pnpm build

# 6. Create PM2 config (ecosystem.config.js)
# Copy config dari section sebelumnya

# 7. Start
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# 8. Verify
pm2 status
pm2 logs travel-api
curl http://localhost:8082/health

# 9. Setup reverse proxy di aaPanel
# Done!
```

---

## 🔒 Security Checklist

### Environment Variables:

- [ ] `.env` permissions set to 600
- [ ] `.env` in `.gitignore`
- [ ] `.env` not committed to git
- [ ] Sensitive values encrypted (optional)
- [ ] Regular secret rotation scheduled

### Application:

- [ ] PM2 running as non-root user (www-data)
- [ ] Firewall configured (ufw)
- [ ] Reverse proxy setup (Nginx)
- [ ] SSL certificate installed
- [ ] CORS properly configured
- [ ] Rate limiting enabled

### Monitoring:

- [ ] PM2 monitoring active
- [ ] Log rotation configured
- [ ] Backup strategy in place
- [ ] Alert system setup (optional)

---

## 📊 Memory Monitoring Commands

```bash
# PM2 memory usage
pm2 status
pm2 monit

# System memory
free -h
htop

# Process-specific
ps aux | grep node
pmap -x $(pgrep -f "travel-api")

# If memory high, restart
pm2 restart travel-api

# Check memory leaks
pm2 logs travel-api | grep -i "memory"
```

---

## 🆘 Troubleshooting

### Problem: Memory leak

```bash
# Check memory trend
pm2 monit

# If growing, restart
pm2 restart travel-api

# Check logs for errors
pm2 logs travel-api --err

# Reduce max_memory_restart if needed
# Edit ecosystem.config.js
max_memory_restart: '300M'  # Lower limit
```

### Problem: .env not loading

```bash
# Verify .env exists
ls -la .env

# Check permissions
chmod 600 .env

# Verify PM2 config
cat ecosystem.config.js | grep env_file

# Restart PM2
pm2 delete travel-api
pm2 start ecosystem.config.js
```

---

**Kesimpulan:** Kedua metode valid, pilih sesuai kebutuhan Anda! 🚀
