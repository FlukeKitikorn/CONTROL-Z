# ControlZ - Deployment Architecture Design (V2)

> Last Updated: 2026-06-27  
> Change from V1: เพิ่ม Secrets Management, Off-site Backup, Zero-downtime Deploy, Resource Limits, Rate Limiting, Log Rotation, SSL Auto-renewal

---

# Overview

เอกสารนี้สรุปแนวทางการ Deploy ระบบ ControlZ สำหรับ Production โดยมีเงื่อนไขดังนี้

* VPS เครื่องเดียว
* Ubuntu Server 24.04 LTS
* Docker Compose
* Open Source
* รองรับการขยายในอนาคต
* ใช้งานง่าย ดูแลรักษาง่าย
* เหมาะกับทีมขนาดเล็ก

---

# Technology Stack

| Layer              | Technology                                |
| ------------------ | ----------------------------------------- |
| OS                 | Ubuntu Server 24.04 LTS                   |
| Reverse Proxy      | Nginx                                     |
| Frontend           | React + TypeScript + Vite                 |
| Backend            | FastAPI                                   |
| Database           | MySQL 8                                   |
| Cache / Queue      | Redis 7                                   |
| Background Worker  | FastAPI Worker                            |
| Database Admin     | phpMyAdmin                                |
| Container          | Docker Compose                            |
| Container Registry | GitHub Container Registry (GHCR)          |
| CI/CD              | GitHub Actions                            |
| SSL                | Let's Encrypt                             |
| Monitoring         | Plesk + Docker CLI + FastAPI Health Check |
| Off-site Backup    | Rclone → S3 / Backblaze B2               |

---

# Web Architecture

```text
                               Internet
                                   │
                             HTTPS (80/443)
                                   │
                        ┌─────────────────────┐
                        │        Nginx        │
                        │ Reverse Proxy + SSL │
                        │ Static Files        │
                        │ Rate Limiting       │  ← NEW
                        └─────────┬───────────┘
                                  │
          ┌───────────────────────┴────────────────────────┐
          │                                                │
          ▼                                                ▼
┌─────────────────────┐                        ┌──────────────────────┐
│ Frontend            │                        │ Backend (FastAPI)    │
│ React + Vite        │──── REST API ───────▶ │ Uvicorn              │
└─────────────────────┘                        └──────────┬───────────┘
                                                         │
══════════════════════ Docker Private Network ════════════╪══════════════════════
                                                         │
                 ┌──────────────────┬────────────────────┼─────────────────┐
                 ▼                  ▼                    ▼                 ▼
             MySQL             Redis Cache          Worker          phpMyAdmin
             (Volume)        Cache / Queue         (Future)     (IP-restricted)

                 │
                 ▼
          storage/mysql

                 │

          storage/uploads
                 │
                 ├── users/
                 ├── products/
                 ├── posts/
                 ├── documents/
                 └── temp/

          storage/backup
                 │
                 └──→ Rclone (Off-site)   ← NEW
```

---

# Docker Services

```text
nginx
frontend
backend
mysql
redis
worker
phpmyadmin
```

---

# Docker Network

แบ่งออกเป็น 2 Network

```text
proxy-network
backend-network
```

### proxy-network

* nginx
* frontend
* backend

### backend-network

* backend
* mysql
* redis
* worker
* phpmyadmin

> MySQL และ Redis จะไม่เปิด Public Port

---

# Resource Limits (NEW)

กำหนด CPU/Memory limit ให้ทุก Service เพื่อป้องกัน resource spike กระทบ Service อื่น

```yaml
# ตัวอย่าง docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M

  worker:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M

  mysql:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G

  redis:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M

  frontend:
    deploy:
      resources:
        limits:
          cpus: '0.25'
          memory: 128M

  nginx:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 128M

  phpmyadmin:
    deploy:
      resources:
        limits:
          cpus: '0.25'
          memory: 128M
```

---

# Storage Strategy

ใช้ Bind Mount

```text
storage/

├── mysql/
├── uploads/
├── backup/
│   └── (sync → off-site via Rclone)   ← NEW
└── logs/
```

### Upload Strategy

```text
Client

↓

Backend

↓

storage/uploads

↓

MySQL (เก็บ Path)

↓

Nginx Serve Static
```

Database เก็บเพียง Path

```text
users/avatar.webp
```

ไม่เก็บ Binary

---

# Project Structure

```text
controlz/

├── docker-compose.yml
├── .env                    ← chmod 600 (NEW)
│
├── frontend/
│   ├── Dockerfile
│   └── ...
│
├── backend/
│   ├── Dockerfile
│   └── ...
│
├── nginx/
│   ├── nginx.conf
│   └── conf.d/
│
├── storage/
│   ├── mysql/
│   ├── uploads/
│   ├── backup/
│   └── logs/
│
└── scripts/
    ├── backup.sh           ← NEW
    └── rclone-sync.sh      ← NEW
```

---

# Docker Image Strategy

Frontend และ Backend มี Dockerfile แยกกัน

Development

```yaml
build:
```

Production

```yaml
image:
```

ตัวอย่าง

```yaml
frontend:
  image: ghcr.io/<org>/controlz-frontend:v1.0.0

backend:
  image: ghcr.io/<org>/controlz-backend:v1.0.0
```

ใช้ Version Tag เสมอ

```text
v1.0.0
v1.0.1
v1.1.0
```

ไม่ใช้

```text
latest
```

---

# Log Rotation (NEW)

กำหนด log rotation ให้ทุก Container ป้องกัน Disk เต็ม

```yaml
# docker-compose.yml — เพิ่มใน service ทุกตัว
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "5"

  nginx:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "5"

  # ... ทุก service เพิ่มแบบเดียวกัน
```

---

# Git Workflow

ใช้ GitHub Flow พร้อม develop branch

```text
main
 │
 ├──────────── Production
 │
develop
 │
 ├── feature/*
 ├── fix/*
 ├── chore/*
 ├── docs/*
 └── hotfix/*
```

## Branch

| Branch    | Purpose             |
| --------- | ------------------- |
| main      | Production          |
| develop   | Integration         |
| feature/* | Feature Development |
| fix/*     | Bug Fix             |
| hotfix/*  | Production Fix      |
| chore/*   | Infrastructure      |
| docs/*    | Documentation       |

---

## Workflow

```text
feature/*
      │
      ▼
Pull Request
      │
      ▼
develop
      │
Testing
      │
      ▼
Pull Request
      │
      ▼
main
      │
Tag Release
      │
Deploy
```

---

## Commit Convention

```text
feat(auth): login

feat(upload): image upload

fix(api): validation

refactor(user): cleanup

docs(readme): update

chore(docker): update compose
```

---

# Deployment Strategy

ใช้ GitHub Actions

```text
Developer

↓

Git Push + Tag (v1.0.0)

↓

GitHub Actions

↓

Build Docker Image

↓

Push GHCR

↓

SSH VPS

↓

docker compose pull

↓

docker compose up -d   ← rolling update (start-first)   ← NEW
```

Production จะไม่ Build Image บน VPS

## Zero-downtime Deploy (NEW)

ใช้ `start-first` order เพื่อให้ container ใหม่ขึ้นมาก่อน แล้วค่อยหยุด container เก่า

```yaml
# docker-compose.yml
services:
  backend:
    deploy:
      update_config:
        order: start-first
        failure_action: rollback

  frontend:
    deploy:
      update_config:
        order: start-first
        failure_action: rollback
```

---

# VPS Configuration

## Host Software

ติดตั้งบน Host

```text
Ubuntu Server 24.04 LTS

Docker Engine

Docker Compose Plugin

Git

OpenSSH

UFW

Fail2ban
```

---

## Application (Docker Compose)

รันผ่าน Docker ทั้งหมด

```text
Nginx

Frontend

Backend

MySQL

Redis

Worker

phpMyAdmin
```

ไม่ติดตั้งบน Host

* Node.js
* Python
* MySQL
* Redis
* PHP
* Nginx

---

# Nginx Rate Limiting (NEW)

เพิ่ม Rate Limit ที่ Nginx เพื่อป้องกัน abuse และ brute force

```nginx
# nginx/conf.d/api.conf

http {
    limit_req_zone $binary_remote_addr zone=api:10m rate=30r/m;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;

    server {
        location /api/ {
            limit_req zone=api burst=10 nodelay;
            limit_req_status 429;
        }

        location /api/auth/ {
            limit_req zone=auth burst=3 nodelay;
            limit_req_status 429;
        }
    }
}
```

---

# Secrets Management (NEW)

## .env บน VPS

จำกัด Permission ของ `.env` เพื่อป้องกันการเข้าถึงโดยไม่ได้รับอนุญาต

```bash
chmod 600 .env
chown root:root .env
```

## GitHub Actions Secrets

ห้าม commit `.env` ขึ้น Repository — ให้ใช้ GitHub Secrets แทน

```yaml
# .github/workflows/deploy.yml
- name: Deploy
  env:
    DB_PASSWORD: ${{ secrets.DB_PASSWORD }}
    REDIS_PASSWORD: ${{ secrets.REDIS_PASSWORD }}
    SECRET_KEY: ${{ secrets.SECRET_KEY }}
```

Inject ค่าตอน deploy ผ่าน SSH หรือ Vault ไม่ commit ลง repo

---

# Monitoring

## Host

ใช้ Plesk

* CPU
* RAM
* Disk
* Network
* SSL
* Backup

---

## Application

ใช้ FastAPI

```text
/docs
/health
```

Docker

```text
docker compose ps

docker compose logs

docker compose restart
```

Docker Healthcheck

```yaml
healthcheck:
```

สำหรับ Backend

### Phase 2: Uptime Kuma

เพิ่ม Uptime Kuma ใน Phase 2 สำหรับ Uptime monitoring และแจ้งเตือน

---

# Security

* ใช้ HTTPS
* เปิดเฉพาะ Port 22, 80, 443
* ใช้ UFW Firewall
* ใช้ Fail2ban
* ไม่เปิด MySQL Public Port
* ไม่เปิด Redis Public Port
* phpMyAdmin เปิดเฉพาะ Internal และจำกัด IP
* `.env` chmod 600   ← NEW
* Nginx Rate Limiting   ← NEW
* GitHub Secrets สำหรับ CI/CD   ← NEW

---

# Backup Strategy

Backup

* MySQL (mysqldump)
* uploads

เก็บไว้ที่

```text
storage/backup
```

Backup เป็นประจำผ่าน Cron

## Off-site Backup (NEW)

Sync ไปยัง Object Storage หลัง Backup เสร็จ เพื่อป้องกันกรณี VPS พัง หรือ Disk เสียหาย

```bash
# scripts/backup.sh
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/opt/controlz/storage/backup

# MySQL dump
docker compose exec mysql mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" \
  --all-databases > "$BACKUP_DIR/mysql_$DATE.sql"

# Compress
gzip "$BACKUP_DIR/mysql_$DATE.sql"

# Sync to off-site (S3 / Backblaze B2 / Google Drive)
rclone sync "$BACKUP_DIR" remote:controlz-backup

# Retain local: 7 days
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete
```

```bash
# Crontab — รันทุกวัน 02:00
0 2 * * * /opt/controlz/scripts/backup.sh >> /var/log/controlz-backup.log 2>&1
```

---

# SSL Auto-renewal (NEW)

ถ้าใช้ Certbot ใน Docker ต้องมี hook reload Nginx หลัง renew เสร็จ

```yaml
# docker-compose.yml
services:
  certbot:
    image: certbot/certbot
    volumes:
      - ./storage/letsencrypt:/etc/letsencrypt
      - ./storage/certbot-webroot:/var/www/certbot
    entrypoint: >
      /bin/sh -c "trap exit TERM;
      while :; do
        certbot renew --webroot -w /var/www/certbot;
        nginx -s reload;
        sleep 12h;
      done"
```

หรือใช้ Cron renew + hook

```bash
# Crontab — ตรวจ renewal ทุก 12 ชั่วโมง
0 */12 * * * docker compose run --rm certbot renew && docker compose exec nginx nginx -s reload
```

---

# Roadmap

## Phase 1 (Current)

* VPS เดียว
* Docker Compose
* MySQL
* Redis
* Worker
* Upload Volume
* GitHub Actions
* GHCR
* Secrets Management ✓ (NEW)
* Off-site Backup ✓ (NEW)
* Rate Limiting ✓ (NEW)
* Log Rotation ✓ (NEW)
* Zero-downtime Deploy ✓ (NEW)
* SSL Auto-renewal ✓ (NEW)

---

## Phase 2

* เพิ่ม Worker
* เพิ่ม Backend Instance
* เพิ่ม Uptime Kuma สำหรับตรวจสอบ Uptime และแจ้งเตือน

---

## Phase 3

* แยก Database ไปอีก VPS
* เปลี่ยน Upload Storage → Object Storage
* เพิ่ม Load Balancer

---

# Final Stack

| Category        | Selected                                  |
| --------------- | ----------------------------------------- |
| OS              | Ubuntu 24.04 LTS                          |
| Reverse Proxy   | Nginx + Rate Limiting                     |
| Frontend        | React + TypeScript + Vite                 |
| Backend         | FastAPI                                   |
| Database        | MySQL 8                                   |
| Cache           | Redis 7                                   |
| Queue           | Redis                                     |
| Worker          | FastAPI Worker                            |
| Upload          | Bind Mount (`storage/uploads`)            |
| DB Admin        | phpMyAdmin (IP-restricted)                |
| Container       | Docker Compose                            |
| Registry        | GitHub Container Registry                 |
| CI/CD           | GitHub Actions + GitHub Secrets           |
| Monitoring      | Plesk + Docker CLI + FastAPI Health Check |
| Version Control | GitHub Flow (`main` + `develop`)          |
| Backup          | Cron + Rclone (off-site)                  |
| SSL             | Let's Encrypt + Auto-renewal              |
| Secrets         | `.env` chmod 600 + GitHub Secrets         |

---

# Design Principles

* Keep Infrastructure Simple
* Everything Runs in Docker
* Stateless Backend
* Bind Mount for Persistent Data
* Docker Image for Production
* Infrastructure as Code
* Easy Backup (+ Off-site)
* Easy Rollback
* Ready for Future Scaling
* Avoid Over Engineering
