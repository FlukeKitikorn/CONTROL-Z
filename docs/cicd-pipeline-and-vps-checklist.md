# CI/CD Pipeline & VPS Deployment Checklist

## Git Flow Strategy

```
feature branch  →  PR  →  develop  →  PR  →  releases  →  tag  →  Deploy
                           (CI รัน)           (CI รัน)    vX.Y.Z
```

| Branch | บทบาท | CI |
|--------|--------|----|
| `main` | Stable production code | รัน (safety net) |
| `develop` | Integration branch | รัน ทุก push + PR |
| `releases` | Release candidate | รัน ทุก push + PR |
| feature branches | งาน dev | ไม่รัน (ต้องเปิด PR) |

### Tag Pattern → Environment

| Tag | Environment |
|-----|-------------|
| `v1.2.3-dev` / `-beta` / `-rc` | Dev VPS |
| `v1.2.3` (stable) | Prod VPS |

---

## CI Pipeline Jobs

CI รันเมื่อ: push หรือ PR ไปที่ `main`, `develop`, `releases` หรือ trigger manual

```
Security Scan  →  Test Backend  →  Test Frontend
    (fail fast)        (pytest)      (lint + build)
```

| Job | สิ่งที่ตรวจ |
|-----|------------|
| Security Scan | Gitleaks (secret leak), pip-audit (Python CVE), Bandit (SAST), npm audit |
| Test Backend | `pytest --tb=short -q` |
| Test Frontend | `npm run lint` + `npm run build` |

---

## Deploy Pipeline Flow

```
push tag vX.Y.Z
    │
    ├─ Gate 1: tag ต้องมาจาก releases branch เท่านั้น
    ├─ Gate 2: รอ CI checks ผ่านทั้งหมด (poll 30s × 30 ครั้ง = max 15 min)
    │
    ├─ Build & Push Docker images → GHCR
    │      ghcr.io/FlukeKitikorn/controlz-backend:<tag>
    │      ghcr.io/FlukeKitikorn/controlz-frontend:<tag>
    │
    └─ SSH เข้า VPS → docker compose pull + up
```

---

## End-to-End Test Pipeline

```bash
# 1. ทำงานบน feature branch ปกติ
git checkout dev-devops
# ... commit changes ...
git push origin dev-devops

# 2. เปิด PR: dev-devops → develop
#    CI จะรันอัตโนมัติ

# 3. Merge develop → releases (เปิด PR อีกครั้ง)

# 4. สร้าง tag จาก releases → trigger Deploy
git checkout releases
git pull origin releases
git tag v0.1.0-dev
git push origin v0.1.0-dev
```

### Manual Trigger (ไม่ต้องใช้ tag)

GitHub UI → Actions → Deploy → Run workflow → เลือก `dev` + ระบุ tag

---

## GitHub Setup

### 1. Environments

ไปที่ **Settings → Environments** สร้าง 2 environments:

| Environment Name | ใช้กับ |
|-----------------|--------|
| `development` | deploy-dev job |
| `production` | deploy-prod job |

### 2. GitHub Secrets

ไปที่ **Settings → Secrets and variables → Actions**

| Secret | ค่า | ใช้ใน |
|--------|-----|--------|
| `VPS_DEV_HOST` | IP หรือ hostname ของ Dev VPS | deploy-dev |
| `VPS_DEV_USER` | SSH username (เช่น `ubuntu`) | deploy-dev |
| `VPS_DEV_SSH_KEY` | ED25519 private key (ทั้ง block) | deploy-dev |
| `VPS_DEV_PORT` | SSH port (ปกติ `22`) | deploy-dev |
| `VPS_HOST` | IP หรือ hostname ของ Prod VPS | deploy-prod |
| `VPS_USER` | SSH username | deploy-prod |
| `VPS_SSH_KEY` | ED25519 private key | deploy-prod |
| `VPS_PORT` | SSH port | deploy-prod |

### 3. สร้าง SSH Deploy Key

รันบนเครื่อง local หรือ VPS:

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy-dev" -f ~/.ssh/deploy_dev_key

# ค่าที่ต้องเอาไปใช้:
# deploy_dev_key.pub  → เพิ่มใน VPS: ~/.ssh/authorized_keys
# deploy_dev_key      → copy ทั้ง block ใส่ GitHub Secret: VPS_DEV_SSH_KEY
```

---

## VPS Checklist

### A. System Requirements

| รายการ | ข้อกำหนด |
|--------|----------|
| OS | Ubuntu 22.04 LTS |
| CPU | 2 cores ขึ้นไป |
| RAM | 4 GB ขึ้นไป |
| Disk | 20 GB ขึ้นไป |
| Docker Engine | 24+ |
| Docker Compose | v2.x (plugin, ไม่ใช่ standalone) |

### B. ติดตั้ง Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# ตรวจสอบ
docker --version
docker compose version
```

### C. สร้าง Directory และ Files

```bash
sudo mkdir -p /opt/controlz
sudo chown $USER:$USER /opt/controlz
cd /opt/controlz

# copy ไฟล์จาก repo มาไว้บน VPS (ด้วย scp หรือ git clone)
# ไฟล์ที่ต้องมี:
# - compose.yaml
# - compose.prod.yaml
# - nginx/nginx.conf
# - nginx/conf.d/default.conf
# - nginx/conf.d/phpmyadmin.conf  (optional)
# - .env.example

# สร้าง storage directories
mkdir -p storage/{uploads/{users,products,documents,temp},backup,logs/nginx,letsencrypt,certbot-webroot}

# สร้าง .env จาก template
cp .env.example .env
chmod 600 .env
chown $USER:$USER .env
```

### D. กรอกค่าใน `.env`

```bash
# Generate secrets ด้วย Python:
python3 -c "import secrets; print(secrets.token_hex(32))"  # สำหรับ JWT
python3 -c "import secrets; print(secrets.token_hex(24))"  # สำหรับ Redis
```

| Variable | ค่าที่ต้องกรอก |
|----------|---------------|
| `MYSQL_ROOT_PASSWORD` | password แข็งแกร่ง |
| `MYSQL_PASSWORD` | password แข็งแกร่ง |
| `JWT_SECRET_KEY` | `token_hex(32)` |
| `PASSWORD_RESET_SECRET_KEY` | `token_hex(32)` |
| `REDIS_PASSWORD` | `token_hex(24)` |
| `CORS_ORIGINS` | `http://<VPS-IP>` หรือ domain |
| `FRONTEND_BASE_URL` | `http://<VPS-IP>` หรือ domain |
| `GHCR_ORG` | `FlukeKitikorn` |
| `IMAGE_TAG` | `v0.1.0-dev` (pipeline จะ override เอง) |

### E. Login GHCR บน VPS

Pipeline pull image จาก GitHub Container Registry (GHCR) — VPS ต้อง login ก่อน

```bash
# สร้าง GitHub Personal Access Token (PAT):
# GitHub → Settings → Developer settings → Personal access tokens → Fine-grained
# Permission: read:packages

docker login ghcr.io -u FlukeKitikorn -p <PAT>

# ตรวจสอบว่า login สำเร็จ
cat ~/.docker/config.json | grep ghcr
```

### F. Firewall

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
sudo ufw status
```

### G. เพิ่ม SSH Deploy Key

```bash
# เพิ่ม public key ของ GitHub Actions ลงใน VPS
echo "<ค่าจาก deploy_dev_key.pub>" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# ทดสอบ SSH จากเครื่อง local
ssh -i ~/.ssh/deploy_dev_key ubuntu@<VPS-IP> "echo connected"
```

### H. ทดสอบ Manual Deploy ก่อน

ก่อนให้ pipeline รัน ควรทดสอบ deploy มือบน VPS ก่อน:

```bash
cd /opt/controlz
export IMAGE_TAG=v0.1.0-dev
export GHCR_ORG=FlukeKitikorn

docker compose -f compose.yaml -f compose.prod.yaml pull
docker compose -f compose.yaml -f compose.prod.yaml up -d
docker compose -f compose.yaml -f compose.prod.yaml ps
```

### I. ตรวจสอบ Services หลัง Deploy

```bash
# ดู status ทุก container
docker compose -f compose.yaml -f compose.prod.yaml ps

# ตรวจ healthcheck
docker inspect controlz-backend-1 | grep -A5 '"Health"'

# ดู logs
docker compose -f compose.yaml -f compose.prod.yaml logs -f backend
docker compose -f compose.yaml -f compose.prod.yaml logs -f nginx

# ทดสอบ API
curl http://localhost/api/v1/health
```

---

## Checklist สรุป (ติ๊กก่อน deploy จริง)

### GitHub Side
- [ ] สร้าง environment `development` ใน repo settings
- [ ] เพิ่ม secret `VPS_DEV_HOST`
- [ ] เพิ่ม secret `VPS_DEV_USER`
- [ ] เพิ่ม secret `VPS_DEV_SSH_KEY`
- [ ] เพิ่ม secret `VPS_DEV_PORT`

### VPS Side
- [ ] ติดตั้ง Docker Engine + Compose v2
- [ ] สร้าง `/opt/controlz/` และ copy ไฟล์ compose + nginx
- [ ] สร้าง `storage/` directories ครบ
- [ ] กรอก `.env` ครบทุก field, `chmod 600 .env`
- [ ] `docker login ghcr.io` สำเร็จ
- [ ] เปิด firewall port 80, 443, 22
- [ ] เพิ่ม deploy public key ใน `~/.ssh/authorized_keys`
- [ ] ทดสอบ manual `docker compose pull` สำเร็จ
- [ ] `docker compose ps` แสดงทุก service `healthy`

### Pipeline Test
- [ ] Push ไป `develop` → CI รัน และผ่าน
- [ ] Merge `develop` → `releases`
- [ ] `git tag v0.1.0-dev && git push origin v0.1.0-dev`
- [ ] Pipeline: Gate 1 (releases check) → Gate 2 (CI check) → Build → Deploy
- [ ] ตรวจ VPS: `curl http://<VPS-IP>/api/v1/health` ตอบ 200
