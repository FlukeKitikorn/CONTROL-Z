# CONTROL-Z — Environment Guidebook

> Dev และ Prod setup ตั้งแต่ต้นจนปล่อย production

---

## สารบัญ

1. [ภาพรวม Architecture](#1-ภาพรวม-architecture)
2. [Prerequisites](#2-prerequisites)
3. [First-Time Setup](#3-first-time-setup)
4. [Development Environment](#4-development-environment)
5. [Production Environment](#5-production-environment)
6. [Environment Variables Reference](#6-environment-variables-reference)
7. [Nginx & SSL](#7-nginx--ssl)
8. [CI/CD Pipeline](#8-cicd-pipeline)
9. [Database — Backup & Restore](#9-database--backup--restore)
10. [phpMyAdmin (Tools Profile)](#10-phpmyadmin-tools-profile)
11. [Useful Commands Cheat Sheet](#11-useful-commands-cheat-sheet)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. ภาพรวม Architecture

```
                   ┌──────────────────────────────────────────────┐
Internet ──────▶   │  Nginx (port 80/443)                         │
                   │  - HTTP → HTTPS redirect                      │
                   │  - Rate limiting (auth: 5r/m, api: 30r/m)    │
                   │  - SSL termination (Let's Encrypt)            │
                   └──────┬──────────────────────┬────────────────┘
                          │                      │
                   ┌──────▼──────┐      ┌────────▼────────┐
                   │  Frontend   │      │    Backend       │
                   │  React SPA  │      │  FastAPI + Uvicorn│
                   │  nginx:80   │      │  port 8000       │
                   └─────────────┘      └────────┬─────────┘
                                                 │
                          ┌──────────────────────┤
                          │                      │
                   ┌──────▼──────┐      ┌────────▼────────┐
                   │   MySQL 8.0 │      │   Redis 7        │
                   │ (internal)  │      │  (internal)      │
                   └─────────────┘      └─────────────────-┘
```

**Networks:**
- `proxy-network` — Nginx ↔ Frontend ↔ Backend (public-facing)
- `backend-network` — Backend ↔ MySQL ↔ Redis (internal only, ไม่มี public port)

**Compose file structure:**
| ไฟล์ | หน้าที่ |
|------|---------|
| `compose.yaml` | Base config — services, networks, volumes, healthchecks |
| `compose.dev.yaml` | Dev override — build from local source, `DEBUG=true` |
| `compose.prod.yaml` | Prod override — pull versioned images from GHCR, `DEBUG=false` |
| `docker-compose.yaml` | All-in-one convenience file (legacy, dev only) |

---

## 2. Prerequisites

### เครื่องมือที่ต้องติดตั้ง

| เครื่องมือ | เวอร์ชันขั้นต่ำ | ใช้งาน |
|-----------|----------------|--------|
| Docker Desktop | 24+ | Container runtime |
| Docker Compose | v2 (plugin) | Orchestration (`docker compose`, ไม่ใช่ `docker-compose`) |
| Git | 2.x | Version control |
| Python | 3.12 | Backend dev (นอก Docker) |
| Node.js | 20 LTS | Frontend dev (นอก Docker) |

### ตรวจสอบ

```bash
docker --version          # Docker version 24.x.x
docker compose version    # Docker Compose version v2.x.x
python --version          # Python 3.12.x
node --version            # v20.x.x
```

---

## 3. First-Time Setup

ทำครั้งเดียวทั้ง dev และ prod

### 3.1 Clone และสร้าง .env

```bash
git clone <repo-url>
cd CONTROL-Z

# คัดลอก template
cp .env.example .env

# แก้ไขค่าในไฟล์ .env (ดู section 6 สำหรับรายละเอียด)
```

### 3.2 สร้าง Storage Directories

```bash
mkdir -p storage/{uploads/{users,products,documents,temp},backup,logs/nginx,letsencrypt,certbot-webroot}
```

โครงสร้างที่ได้:
```
storage/
├── uploads/
│   ├── users/
│   ├── products/
│   ├── documents/
│   └── temp/
├── backup/          # MySQL dump files
├── logs/nginx/      # Nginx access/error logs
├── letsencrypt/     # SSL certificates (production)
└── certbot-webroot/ # ACME challenge files
```

### 3.3 สร้าง Secret Keys

```bash
# สร้าง JWT_SECRET_KEY
python -c "import secrets; print(secrets.token_hex(32))"

# สร้าง PASSWORD_RESET_SECRET_KEY
python -c "import secrets; print(secrets.token_hex(32))"

# สร้าง REDIS_PASSWORD
python -c "import secrets; print(secrets.token_hex(24))"
```

นำค่าที่ได้ไปใส่ใน `.env`

---

## 4. Development Environment

### 4.1 ค่า .env สำหรับ Dev

```env
# Database
MYSQL_ROOT_PASSWORD=devroot1234
MYSQL_DATABASE=control_z
MYSQL_USER=user
MYSQL_PASSWORD=devmysql1234

# Backend
JWT_SECRET_KEY=<สร้างด้วย secrets.token_hex(32)>
PASSWORD_RESET_SECRET_KEY=<สร้างด้วย secrets.token_hex(32)>
DEBUG=true
CORS_ORIGINS=http://localhost:5173,http://localhost:80
FRONTEND_BASE_URL=http://localhost:5173

# Mail (ปิดใน dev)
MAIL_ENABLED=false

# Redis
REDIS_PASSWORD=<สร้างด้วย secrets.token_hex(24)>

# Domain (ไม่ใช้ใน dev)
DOMAIN=localhost
```

### 4.2 รันทั้งระบบด้วย Docker (วิธีแนะนำ)

```bash
# Start ทุก service (build จาก local source)
docker compose -f compose.yaml -f compose.dev.yaml up

# หรือ background mode
docker compose -f compose.yaml -f compose.dev.yaml up -d

# ดู logs
docker compose -f compose.yaml -f compose.dev.yaml logs -f

# ดู log เฉพาะ service
docker compose -f compose.yaml -f compose.dev.yaml logs -f backend
```

**Endpoints หลังจาก start:**
| Service | URL |
|---------|-----|
| Frontend (React) | http://localhost:80 |
| Backend API | http://localhost:80/api/v1 |
| Swagger Docs | http://localhost:8000/docs (direct) |

### 4.3 รัน Backend นอก Docker (Hot Reload)

เหมาะสำหรับ backend development ที่ต้องการ hot-reload เร็วขึ้น

```bash
# 1. Start เฉพาะ database services
docker compose -f compose.yaml -f compose.dev.yaml up mysql redis -d

# 2. Setup Backend
cd Backend
cp .env.example .env
# แก้ DATABASE_URL ให้ชี้ไปที่ localhost แทน mysql (docker service name)
# DATABASE_URL=mysql+pymysql://user:devmysql1234@127.0.0.1:3306/control_z

# 3. Install และรัน
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend API: http://127.0.0.1:8000 | Swagger: http://127.0.0.1:8000/docs

### 4.4 รัน Frontend นอก Docker (Vite HMR)

```bash
cd Frontend
npm install
npm run dev
```

Frontend: http://localhost:5173

> Vite proxy `/api` → `http://127.0.0.1:8000` อัตโนมัติ ไม่ต้องตั้ง `VITE_API_BASE_URL`

### 4.5 รัน Backend Tests

```bash
cd Backend
pytest                              # รัน test ทั้งหมด
pytest --tb=short -q                # แบบ compact
pytest tests/test_ghg_formulas.py  # เฉพาะไฟล์
```

### 4.6 รัน Frontend Checks

```bash
cd Frontend
npm run lint    # ESLint
npm run build   # Type-check + production build
```

### 4.7 Stop Dev Environment

```bash
docker compose -f compose.yaml -f compose.dev.yaml down

# ลบ volumes ด้วย (ล้างข้อมูล database)
docker compose -f compose.yaml -f compose.dev.yaml down -v
```

---

## 5. Production Environment

### 5.1 ค่า .env สำหรับ Prod

```env
# Database (ใช้ password ที่แข็งแกร่ง)
MYSQL_ROOT_PASSWORD=<random-strong-password>
MYSQL_DATABASE=control_z
MYSQL_USER=user
MYSQL_PASSWORD=<random-strong-password>

# Backend
JWT_SECRET_KEY=<สร้างด้วย secrets.token_hex(32)>
PASSWORD_RESET_SECRET_KEY=<สร้างด้วย secrets.token_hex(32)>
DEBUG=false
CORS_ORIGINS=https://yourdomain.com
FRONTEND_BASE_URL=https://yourdomain.com

# Mail (เปิดใน prod)
MAIL_ENABLED=true
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_STARTTLS=true
MAIL_SSL_TLS=false
MAIL_USERNAME=yourapp@gmail.com
MAIL_PASSWORD=<gmail-app-password>
MAIL_FROM=yourapp@gmail.com
MAIL_FROM_NAME=CONTROL-Z

# Redis
REDIS_PASSWORD=<สร้างด้วย secrets.token_hex(24)>

# Domain
DOMAIN=yourdomain.com

# Deploy
GHCR_ORG=your-github-org
IMAGE_TAG=v1.0.0
```

```bash
# จำกัดสิทธิ์ไฟล์ .env บน VPS
chmod 600 .env
```

### 5.2 SSL Certificate (ครั้งแรก)

ก่อน start nginx ต้องได้ certificate ก่อน:

```bash
# ออก certificate ครั้งแรก
docker compose -f compose.yaml -f compose.prod.yaml run --rm certbot \
  certonly --webroot \
  -w /var/www/certbot \
  -d yourdomain.com \
  -d www.yourdomain.com \
  --email admin@yourdomain.com \
  --agree-tos \
  --no-eff-email
```

Certificate จะถูกเก็บที่ `storage/letsencrypt/` และ auto-renew ทุก 12 ชั่วโมง

### 5.3 แก้ไข Nginx Config

แก้ไข `nginx/conf.d/default.conf` — แทน `yourdomain.com` ด้วย domain จริง:

```bash
sed -i 's/yourdomain.com/example.com/g' nginx/conf.d/default.conf
sed -i 's/yourdomain.com/example.com/g' nginx/conf.d/phpmyadmin.conf
```

### 5.4 Deploy ครั้งแรกบน VPS

```bash
# โครงสร้าง directory บน VPS
mkdir -p /opt/controlz
cd /opt/controlz

# Clone repo
git clone <repo-url> .

# สร้าง storage directories
mkdir -p storage/{uploads/{users,products,documents,temp},backup,logs/nginx,letsencrypt,certbot-webroot}

# สร้างและแก้ .env
cp .env.example .env
vim .env   # ใส่ค่า prod

# Login GHCR (ถ้า pull private images)
echo $GITHUB_TOKEN | docker login ghcr.io -u your-github-username --password-stdin

# Start ทุก service
docker compose -f compose.yaml -f compose.prod.yaml up -d
```

### 5.5 Deploy Update (Manual)

```bash
# วิธีที่ 1: ใช้ deploy script
./scripts/deploy.sh v1.2.0

# วิธีที่ 2: Manual
export IMAGE_TAG=v1.2.0
docker compose -f compose.yaml -f compose.prod.yaml pull
docker compose -f compose.yaml -f compose.prod.yaml up -d --remove-orphans
docker image prune -f
```

### 5.6 ตรวจสอบสถานะ Production

```bash
# ดูสถานะ container
docker compose -f compose.yaml -f compose.prod.yaml ps

# ดู logs
docker compose -f compose.yaml -f compose.prod.yaml logs -f

# ดู resource usage
docker stats

# ตรวจ health ด้วยมือ
curl -f http://localhost/health        # nginx
curl -f http://localhost:8000/         # backend (direct)
```

---

## 6. Environment Variables Reference

| Variable | Dev | Prod | คำอธิบาย |
|----------|-----|------|----------|
| `MYSQL_ROOT_PASSWORD` | ง่ายได้ | ต้องแข็งแกร่ง | MySQL root password |
| `MYSQL_DATABASE` | `control_z` | `control_z` | Database name |
| `MYSQL_USER` | `user` | `user` | App DB user |
| `MYSQL_PASSWORD` | ง่ายได้ | ต้องแข็งแกร่ง | App DB password |
| `JWT_SECRET_KEY` | random hex | random hex | JWT signing key (32 bytes) |
| `PASSWORD_RESET_SECRET_KEY` | random hex | random hex | Password reset JWT key |
| `DEBUG` | `true` | **`false`** | FastAPI debug mode |
| `CORS_ORIGINS` | `http://localhost:5173` | `https://yourdomain.com` | Allowed origins (comma-separated) |
| `FRONTEND_BASE_URL` | `http://localhost:5173` | `https://yourdomain.com` | Used in email links |
| `MAIL_ENABLED` | `false` | `true` | เปิด/ปิดการส่งอีเมล |
| `MAIL_USERNAME` | — | Gmail account | SMTP username |
| `MAIL_PASSWORD` | — | Gmail App Password | SMTP password (ไม่ใช่ password ปกติ) |
| `REDIS_PASSWORD` | random hex | random hex | Redis auth password |
| `DOMAIN` | `localhost` | `yourdomain.com` | ใช้ใน nginx config |
| `GHCR_ORG` | — | GitHub org name | สำหรับ pull prod images |
| `IMAGE_TAG` | — | `v1.x.x` | เวอร์ชัน image ที่ deploy |
| `BACKUP_DIR` | — | `/opt/controlz/storage/backup` | Local backup path |
| `RCLONE_REMOTE` | — | `remote:controlz-backup` | Off-site backup destination |

---

## 7. Nginx & SSL

### Config Files

```
nginx/
├── nginx.conf           # Main config (worker processes, rate limit zones)
└── conf.d/
    ├── default.conf     # HTTP→HTTPS redirect + HTTPS reverse proxy
    └── phpmyadmin.conf  # phpMyAdmin (tools profile only)
```

### Rate Limits (default.conf)

| Zone | Limit | Endpoint |
|------|-------|----------|
| `auth` | 5 req/min, burst 3 | `/api/v1/auth/*` |
| `api` | 30 req/min, burst 10 | `/api/*` |

### SSL Auto-renewal

Certbot container รันทุก 12 ชั่วโมงอัตโนมัติ ไม่ต้องทำอะไรเพิ่ม

ตรวจสอบ certificate:
```bash
docker compose -f compose.yaml -f compose.prod.yaml exec certbot \
  certbot certificates
```

### Reload Nginx หลังแก้ config

```bash
docker compose -f compose.yaml -f compose.prod.yaml exec nginx \
  nginx -s reload
```

---

## 8. CI/CD Pipeline

### GitHub Actions Workflows

**`.github/workflows/ci.yml`** — รันทุก push/PR ไปที่ `main` หรือ `develop`

```
push to main/develop  →  test-backend (pytest)
                      →  test-frontend (lint + build)
```

**`.github/workflows/deploy.yml`** — รันเมื่อ push git tag `v*.*.*`

```
git tag v1.2.0  →  build-and-push (GHCR images)  →  deploy (SSH to VPS)
```

### GitHub Secrets ที่ต้องตั้ง

ไปที่ Settings → Secrets and variables → Actions → New repository secret

| Secret | คำอธิบาย |
|--------|----------|
| `VPS_HOST` | IP หรือ hostname ของ VPS |
| `VPS_USER` | Linux username (เช่น `ubuntu`, `deploy`) |
| `VPS_SSH_KEY` | Private SSH key (generate ด้วย `ssh-keygen -t ed25519`) |
| `VPS_PORT` | SSH port (default `22`) |

### Deploy Flow

```bash
# 1. Merge code ไป main
git checkout main
git merge develop

# 2. Tag version
git tag v1.2.0
git push origin v1.2.0

# 3. GitHub Actions จะ:
#    - Build Backend Docker image → push ไป ghcr.io/<org>/controlz-backend:v1.2.0
#    - Build Frontend Docker image → push ไป ghcr.io/<org>/controlz-frontend:v1.2.0
#    - SSH เข้า VPS → pull images → docker compose up -d
```

---

## 9. Database — Backup & Restore

### Backup (Manual)

```bash
# Set env ก่อน
export MYSQL_ROOT_PASSWORD=yourpassword
export BACKUP_DIR=/opt/controlz/storage/backup
export RCLONE_REMOTE=s3:my-bucket/controlz-backup

# รัน backup
./scripts/backup.sh
```

Backup จะ:
1. Dump MySQL → `storage/backup/mysql_YYYYMMDD_HHMMSS.sql`
2. Compress → `.sql.gz`
3. Sync ไป rclone remote (S3, B2, Google Drive, ฯลฯ)
4. ลบ local backup เก่ากว่า 7 วัน

### Backup อัตโนมัติด้วย Cron

```bash
# บน VPS เพิ่ม cron job
crontab -e

# รัน backup ทุกวันเวลา 02:00
0 2 * * * cd /opt/controlz && source .env && ./scripts/backup.sh >> /var/log/controlz-backup.log 2>&1
```

### Restore

```bash
# ดู backup ที่มี
ls -lh storage/backup/*.sql.gz

# Restore จาก backup file
export MYSQL_ROOT_PASSWORD=yourpassword
./scripts/restore.sh storage/backup/mysql_20260627_020001.sql.gz
```

> จะถาม confirm ก่อน restore เสมอ — พิมพ์ `yes` เพื่อยืนยัน

### Setup rclone (ครั้งแรก)

```bash
# Install rclone
curl https://rclone.org/install.sh | sudo bash

# Config remote (interactive)
rclone config

# ทดสอบ
rclone lsd remote:
```

---

## 10. phpMyAdmin (Tools Profile)

phpMyAdmin **ไม่รันโดยอัตโนมัติ** — ต้องระบุ `--profile tools` และ `phpmyadmin` service ชัดเจน

### Dev

```bash
docker compose -f compose.yaml -f compose.dev.yaml --profile tools up phpmyadmin -d
```

เข้าใช้ได้ที่: http://localhost:8080

### Prod (ผ่าน SSH Tunnel)

phpMyAdmin bind ที่ `127.0.0.1:8080` เท่านั้น (ไม่ expose ออก internet)

```bash
# เปิด SSH tunnel บนเครื่อง local
ssh -L 8080:localhost:8080 user@your-vps-ip

# เปิด phpMyAdmin บน VPS (session อื่น หรือ background)
docker compose -f compose.yaml -f compose.prod.yaml --profile tools up phpmyadmin -d

# เข้าใช้บน browser เครื่อง local
# http://localhost:8080
```

### หยุด phpMyAdmin

```bash
docker compose -f compose.yaml -f compose.dev.yaml stop phpmyadmin
```

---

## 11. Useful Commands Cheat Sheet

### Dev

```bash
# Start
docker compose -f compose.yaml -f compose.dev.yaml up -d

# Stop
docker compose -f compose.yaml -f compose.dev.yaml down

# Rebuild หลังแก้ Dockerfile
docker compose -f compose.yaml -f compose.dev.yaml up -d --build backend
docker compose -f compose.yaml -f compose.dev.yaml up -d --build frontend

# ดู logs แบบ follow
docker compose -f compose.yaml -f compose.dev.yaml logs -f backend

# เข้า container shell
docker compose -f compose.yaml -f compose.dev.yaml exec backend bash
docker compose -f compose.yaml -f compose.dev.yaml exec mysql mysql -u root -p

# รัน tests
cd Backend && pytest
cd Frontend && npm run lint && npm run build
```

### Prod

```bash
# Deploy version ใหม่
./scripts/deploy.sh v1.2.0

# ดูสถานะ
docker compose -f compose.yaml -f compose.prod.yaml ps
docker compose -f compose.yaml -f compose.prod.yaml logs -f

# Restart service เดียว
docker compose -f compose.yaml -f compose.prod.yaml restart backend

# Scale backend (optional)
docker compose -f compose.yaml -f compose.prod.yaml up -d --scale backend=2

# ทำ backup ทันที
export MYSQL_ROOT_PASSWORD=$(grep MYSQL_ROOT_PASSWORD .env | cut -d= -f2)
./scripts/backup.sh
```

---

## 12. Troubleshooting

### Backend ไม่ start (unhealthy)

```bash
docker compose -f compose.yaml -f compose.dev.yaml logs backend

# ตรวจ database connection
docker compose -f compose.yaml -f compose.dev.yaml exec backend \
  python -c "from app.core.database import engine; print(engine.connect())"
```

สาเหตุที่พบบ่อย:
- `DATABASE_URL` ใน `.env` ผิด
- MySQL ยัง start ไม่เสร็จ — รอ healthcheck ผ่านก่อน (ใช้เวลา ~60s)

### MySQL healthcheck timeout

```bash
# ตรวจสอบว่า MySQL ขึ้นมาหรือยัง
docker compose -f compose.yaml -f compose.dev.yaml logs mysql

# MySQL ใช้เวลา start นาน (สูงสุด 60s) — รอก่อน
docker compose -f compose.yaml -f compose.dev.yaml ps
```

### Frontend ไม่ connect Backend (dev นอก Docker)

ตรวจว่า Vite proxy ทำงานอยู่ — `Frontend/vite.config.ts` ต้องมี:
```ts
proxy: {
  '/api': 'http://127.0.0.1:8000'
}
```

### Nginx 502 Bad Gateway

```bash
# ตรวจ backend healthy ไหม
docker compose -f compose.yaml -f compose.prod.yaml exec backend \
  wget --spider http://localhost:8000/

# ตรวจ logs
docker compose -f compose.yaml -f compose.prod.yaml logs nginx backend
```

### SSL Certificate ไม่ได้

```bash
# ตรวจว่า domain ชี้มาที่ server ก่อน
dig +short yourdomain.com

# ตรวจ certbot logs
docker compose -f compose.yaml -f compose.prod.yaml logs certbot

# ลอง dry-run ก่อน
docker compose -f compose.yaml -f compose.prod.yaml run --rm certbot \
  certonly --webroot --dry-run \
  -w /var/www/certbot -d yourdomain.com
```

### Reset ทุกอย่าง (Dev เท่านั้น)

```bash
docker compose -f compose.yaml -f compose.dev.yaml down -v
docker system prune -f
```

> อย่าทำบน production — จะลบ database ทั้งหมด

---

## ข้อควรจำ

| หัวข้อ | Dev | Prod |
|--------|-----|------|
| `DEBUG` | `true` | **`false`** — บังคับเสมอ |
| Database port | expose ออก (ถ้าต้องการ) | internal only |
| phpMyAdmin | http://localhost:8080 | SSH tunnel เท่านั้น |
| Images | build จาก local source | pull จาก GHCR |
| SSL | ไม่มี | Let's Encrypt |
| Mail | ปิด | เปิด + App Password |
| `.env` permissions | ไม่ strict | `chmod 600 .env` |
