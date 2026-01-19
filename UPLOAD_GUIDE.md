# File & Folder Upload Guide - aaPanel VPS

## ✅ WAJIB DI-UPLOAD

### 📁 Folder Utama

```
travel-api/
├── src/                    ✅ WAJIB (source code)
├── .vscode/               ❌ TIDAK PERLU
├── node_modules/          ❌ TIDAK PERLU (akan di-install di VPS)
├── dist/                  ❌ TIDAK PERLU (akan di-build di VPS)
├── logs/                  ❌ TIDAK PERLU (akan dibuat otomatis)
└── coverage/              ❌ TIDAK PERLU
```

### 📄 File Konfigurasi (Root Directory)

```
✅ WAJIB:
├── package.json           ✅ WAJIB
├── pnpm-lock.yaml         ✅ WAJIB (atau package-lock.json/yarn.lock)
├── tsconfig.json          ✅ WAJIB
├── tsconfig.build.json    ✅ WAJIB
├── nest-cli.json          ✅ WAJIB
├── ecosystem.config.js    ✅ WAJIB (PM2 config)
├── .env.example           ✅ WAJIB (template)
├── .gitignore             ✅ RECOMMENDED
├── .dockerignore          ❌ TIDAK PERLU (jika tidak pakai Docker)

❌ TIDAK PERLU:
├── .env                   ❌ JANGAN! (buat baru di VPS)
├── .git/                  ❌ TIDAK PERLU
├── .DS_Store              ❌ TIDAK PERLU
├── README.md              ⚠️  OPTIONAL
```

### 🛠️ Helper Scripts

```
✅ WAJIB/RECOMMENDED:
├── check-env-security.sh  ✅ RECOMMENDED
├── monitor.sh             ✅ RECOMMENDED
├── prepare-deployment.sh  ❌ TIDAK PERLU (hanya untuk local)

❌ TIDAK PERLU:
├── Dockerfile             ❌ TIDAK PERLU (jika pakai PM2)
├── docker-compose*.yaml   ❌ TIDAK PERLU (jika pakai PM2)
```

### 📚 Documentation

```
⚠️  OPTIONAL (tidak affect aplikasi):
├── README.md
├── DEPLOYMENT_CHECKLIST.md
├── PM2_COMMANDS.md
├── VPS_OPTIMIZATION.md
└── ... (semua .md files)
```

---

## 📦 Struktur Upload yang Benar

### Metode 1: Upload Semua (Kecuali yang Excluded)

```
travel-api/
├── src/                    ✅
├── package.json            ✅
├── pnpm-lock.yaml          ✅
├── tsconfig.json           ✅
├── tsconfig.build.json     ✅
├── nest-cli.json           ✅
├── ecosystem.config.js     ✅
├── .env.example            ✅
├── .gitignore              ✅
├── check-env-security.sh   ✅
├── monitor.sh              ✅
└── (optional: *.md files)  ⚠️
```

**JANGAN UPLOAD:**

- ❌ `node_modules/`
- ❌ `dist/`
- ❌ `.env`
- ❌ `.git/`
- ❌ `logs/`
- ❌ `coverage/`
- ❌ `Dockerfile*`
- ❌ `docker-compose*.yaml`

---

## 🎯 Cara Compress yang Benar

### Opsi 1: Menggunakan Script (RECOMMENDED)

```bash
cd /Users/test/Documents/project-benny/travel-app/travel-api
./prepare-deployment.sh
```

Script ini otomatis exclude file yang tidak perlu.

### Opsi 2: Manual Compress

```bash
cd /Users/test/Documents/project-benny/travel-app

# Compress dengan exclude
zip -r travel-api.zip travel-api \
  -x "travel-api/node_modules/*" \
  -x "travel-api/dist/*" \
  -x "travel-api/.git/*" \
  -x "travel-api/.env" \
  -x "travel-api/logs/*" \
  -x "travel-api/coverage/*" \
  -x "travel-api/.DS_Store" \
  -x "travel-api/Dockerfile*" \
  -x "travel-api/docker-compose*"
```

### Opsi 3: Selective Upload (Manual)

Jika tidak mau compress, upload folder/file ini satu per satu:

**Priority 1 (CRITICAL):**

1. `src/` folder
2. `package.json`
3. `pnpm-lock.yaml`
4. `tsconfig.json`
5. `tsconfig.build.json`
6. `nest-cli.json`
7. `ecosystem.config.js`
8. `.env.example`

**Priority 2 (RECOMMENDED):** 9. `.gitignore` 10. `check-env-security.sh` 11. `monitor.sh`

**Priority 3 (OPTIONAL):** 12. Documentation files (\*.md)

---

## 📋 Checklist Upload

### Before Upload:

- [ ] Run `./prepare-deployment.sh` (atau compress manual)
- [ ] Verify ukuran zip < 20 MB
- [ ] Pastikan `.env` TIDAK termasuk dalam zip

### After Upload & Extract:

- [ ] Verify `src/` folder ada
- [ ] Verify `package.json` ada
- [ ] Verify `ecosystem.config.js` ada
- [ ] Create `.env` file baru di VPS
- [ ] Run `chmod 600 .env`
- [ ] Run `./check-env-security.sh`

---

## 🔍 Verify Upload di VPS

Setelah extract di VPS, jalankan:

```bash
cd /www/wwwroot/travel-api

# Check struktur
ls -la

# Should see:
# src/
# package.json
# ecosystem.config.js
# etc.

# Check src folder
ls -la src/

# Should see:
# app.module.ts
# main.ts
# modules/
# etc.
```

---

## ⚠️ PENTING: File yang JANGAN DI-UPLOAD

### 1. `.env` File

❌ **JANGAN upload .env dari local!**

**Alasan:**

- Berisi credentials production
- Bisa berbeda antara local dan VPS
- Security risk jika ter-upload

**Yang Benar:**

```bash
# Di VPS, buat .env baru
cp .env.example .env
nano .env  # Edit dengan credentials VPS
chmod 600 .env
```

### 2. `node_modules/` Folder

❌ **JANGAN upload node_modules!**

**Alasan:**

- Ukuran sangat besar (100-500 MB)
- Bisa incompatible dengan VPS (different OS/architecture)
- Akan di-install ulang di VPS

**Yang Benar:**

```bash
# Di VPS, install fresh
pnpm install --prod
```

### 3. `dist/` Folder

❌ **JANGAN upload dist!**

**Alasan:**

- Hasil build dari local
- Bisa incompatible
- Akan di-build ulang di VPS

**Yang Benar:**

```bash
# Di VPS, build fresh
pnpm build
```

### 4. `.git/` Folder

❌ **JANGAN upload .git!**

**Alasan:**

- Ukuran besar
- Tidak diperlukan di production
- Berisi history yang tidak perlu

**Alternative:**

```bash
# Jika butuh git di VPS, clone langsung
git clone https://github.com/your-repo/travel-app.git
```

---

## 📊 Ukuran File yang Diharapkan

### Sebelum Compress:

```
travel-api/ (dengan node_modules): ~200-500 MB
travel-api/ (tanpa node_modules):  ~5-15 MB
```

### Setelah Compress:

```
travel-api.zip (correct):  ~2-5 MB   ✅
travel-api.zip (too big):  >50 MB   ❌ (kemungkinan include node_modules)
```

---

## 🚀 Quick Upload Guide

### Step-by-Step:

1. **Di Local:**

   ```bash
   cd /Users/test/Documents/project-benny/travel-app/travel-api
   ./prepare-deployment.sh
   # Output: ../travel-api_YYYYMMDD_HHMMSS.zip
   ```

2. **Upload ke VPS:**
   - Login aaPanel: `http://31.97.111.170:7800`
   - Files → Navigate to `/www/wwwroot/travel-api`
   - Upload → Select zip file
   - Wait upload complete

3. **Extract:**
   - Right-click zip file
   - Decompress → Current directory
   - Delete zip file after extract

4. **Verify:**

   ```bash
   # SSH ke VPS
   cd /www/wwwroot/travel-api
   ls -la
   # Should see: src/, package.json, ecosystem.config.js, etc.
   ```

5. **Setup .env:**
   ```bash
   cp .env.example .env
   nano .env  # Edit
   chmod 600 .env
   ```

---

## 🎯 Summary

### ✅ WAJIB UPLOAD:

- `src/` folder
- `package.json`
- `pnpm-lock.yaml`
- `tsconfig.json`
- `tsconfig.build.json`
- `nest-cli.json`
- `ecosystem.config.js`
- `.env.example`

### ⚠️ RECOMMENDED:

- `.gitignore`
- `check-env-security.sh`
- `monitor.sh`

### ❌ JANGAN UPLOAD:

- `node_modules/`
- `dist/`
- `.env`
- `.git/`
- `logs/`
- `coverage/`
- `Dockerfile*` (jika pakai PM2)
- `docker-compose*.yaml` (jika pakai PM2)

### 📦 Ukuran Ideal:

- Zip file: **2-5 MB**
- Jika > 20 MB: kemungkinan ada file yang tidak perlu

---

**Gunakan `./prepare-deployment.sh` untuk otomatis compress dengan exclude yang benar!** 🚀
