# Docker Compose Review & Recommendations (CONTROL-Z)

## Overview

ไฟล์ `docker-compose.yaml` มีโครงสร้างที่ดี เหมาะสำหรับโปรเจกต์ขนาดกลางถึงใหญ่ มีการแบ่ง Service ชัดเจน ใช้ YAML Anchor ลดการเขียนซ้ำ และคำนึงถึง Security และ Production ตั้งแต่ต้น

**คะแนนโดยรวม:** 9/10

---

# High Priority (ควรทำ)

## 1. แยก Compose สำหรับ Development และ Production

แทนที่จะ Comment / Uncomment

```yaml
build:
# image:
```

ควรแยกไฟล์

```
compose.yaml
compose.dev.yaml
compose.prod.yaml
```

ตัวอย่าง

```bash
# Development
docker compose \
    -f compose.yaml \
    -f compose.dev.yaml up

# Production
docker compose \
    -f compose.yaml \
    -f compose.prod.yaml up -d
```

ข้อดี

* ไม่ต้องแก้ไฟล์ก่อน Deploy
* ใช้ร่วมกับ CI/CD ได้ง่าย
* ลด Human Error

---

## 2. ใช้ YAML Anchor เพิ่ม

ปัจจุบันมีเฉพาะ Logging และ Environment

แนะนำเพิ่ม Service Default

```yaml
x-service-defaults: &service-defaults
  restart: unless-stopped
  init: true
  <<: *default-logging
```

แล้วทุก Service

```yaml
backend:
  <<: *service-defaults
```

ข้อดี

* ลด Code ซ้ำ
* แก้ไขครั้งเดียวทุก Service

---

## 3. รวม Environment ของ Backend และ Worker

ปัจจุบัน

Backend

```yaml
environment:
  <<: *backend-env
```

Worker

```yaml
environment:
  DATABASE_URL: ...
  JWT_SECRET_KEY: ...
```

ควรใช้

```yaml
environment:
  <<: *backend-env
```

เพื่อให้ Config ตรงกัน

---

## 4. ลบ Worker ชั่วคราว

ปัจจุบัน Worker รัน

```bash
uvicorn app.main:app
```

ซึ่งเป็น Backend อีกตัวหนึ่ง

หากยังไม่มี

* Celery
* ARQ
* Dramatiq
* RQ

ควรถอด Service นี้ออกก่อน

เมื่อมีระบบ Background Job ค่อยเพิ่มกลับมา

---

## 5. ใช้ Docker Profiles

เช่น

```yaml
phpmyadmin:
  profiles:
    - tools
```

Production

```bash
docker compose up
```

จะไม่เปิด phpMyAdmin

เมื่อจำเป็น

```bash
docker compose --profile tools up
```

---

# Medium Priority (ควรทำ)

## 6. เอา container_name ออก

ปัจจุบัน

```yaml
container_name:
```

Docker Compose ตั้งชื่อให้อัตโนมัติอยู่แล้ว

ข้อดีของการไม่กำหนด

* รองรับ Scale
* Compose ยืดหยุ่นกว่า
* ลดปัญหาชื่อชนกัน

---

## 7. ใช้ Named Volume สำหรับ Database

แทน

```yaml
./storage/mysql
```

ใช้

```yaml
mysql_data:/var/lib/mysql
```

ประกาศ

```yaml
volumes:
  mysql_data:
  redis_data:
```

ส่วน

```
storage/uploads
```

ยังใช้ Bind Mount ได้ตามเดิม

---

## 8. เพิ่ม init

ทุก Service

```yaml
init: true
```

ข้อดี

* จัดการ Zombie Process
* Shutdown Container สะอาดขึ้น

---

## 9. เพิ่ม Restart ให้ Certbot

```yaml
restart: unless-stopped
```

เพื่อให้ Certbot กลับมาทำงานหลังเครื่อง Restart

---

## 10. ตรวจสอบ Health Check ของ Nginx

ถ้าใช้

```yaml
wget http://localhost/health
```

ต้องมี

```nginx
location /health {
    return 200;
}
```

หากไม่มี Endpoint นี้ ควรเพิ่ม

---

# Low Priority (Production Hardening)

## 11. Frontend / Nginx

ใช้

```yaml
read_only: true
```

ป้องกันการเขียนไฟล์โดยไม่จำเป็น

---

## 12. Backend

รันด้วย User

```yaml
user: "1000:1000"
```

แทน Root

---

## 13. tmpfs

```yaml
tmpfs:
  - /tmp
```

ช่วยลดการเขียนลง Disk

---

## 14. Backup Script

เพิ่ม

```
scripts/
    backup.sh
    restore.sh
```

สำหรับ Backup / Restore

---

## 15. Deploy Script

เพิ่ม

```
scripts/
    deploy.sh
```

ใช้ร่วมกับ GitHub Actions หรือ Manual Deploy

---

# สิ่งที่ไม่จำเป็น

## deploy:

```yaml
deploy:
  resources:
```

ถ้าใช้

```bash
docker compose up
```

Section นี้แทบไม่มีผล

ใช้ได้จริงเฉพาะ

```bash
docker stack deploy
```

(Docker Swarm)

หากไม่ได้ใช้ Swarm สามารถลบออกได้ หรือเปลี่ยนไปใช้ข้อจำกัดที่ Docker Compose รองรับแทน

---

# โครงสร้าง Project ที่แนะนำ

```
controlz/
│
├── compose.yaml
├── compose.dev.yaml
├── compose.prod.yaml
│
├── .env
├── .env.example
│
├── docker/
│   ├── nginx/
│   ├── mysql/
│   └── redis/
│
├── storage/
│   ├── uploads/
│   ├── logs/
│   ├── backup/
│   └── letsencrypt/
│
├── scripts/
│   ├── deploy.sh
│   ├── backup.sh
│   └── restore.sh
│
├── Backend/
└── Frontend/
```

---

# ลำดับการปรับปรุง

## Phase 1

* แยก `compose.dev.yaml`
* แยก `compose.prod.yaml`
* เพิ่ม YAML Anchor
* รวม Environment
* ใช้ Docker Profiles

---

## Phase 2

* ลบ `container_name`
* เปลี่ยน Database และ Redis เป็น Named Volume
* เพิ่ม `init: true`
* เพิ่ม Restart ให้ Certbot
* ตรวจสอบ Health Check

---

## Phase 3

* เพิ่ม Security Hardening
* ใช้ Non-root User
* เพิ่ม `read_only`
* เพิ่ม `tmpfs`
* เพิ่ม Backup Script
* เพิ่ม Deploy Script

---

# สรุป

โครงสร้างปัจจุบันถือว่าอยู่ในระดับ **Production Ready** สำหรับ VPS ที่ใช้

* FastAPI
* React
* Nginx
* MySQL
* Redis

หลังจากปรับตามรายการด้านบน จะได้โครงสร้างที่

* Maintain ง่าย
* รองรับ CI/CD
* ขยายระบบได้ในอนาคต
* ปลอดภัยขึ้น
* ลดการเขียนซ้ำของ Compose
* พร้อมสำหรับการเพิ่ม Background Worker และระบบ Monitoring ในอนาคต
