รูปที่โหลดผ่าน bundler (Vite) — ใช้ import

  import hero from '@/assets/images/hero.png'
  <img src={hero} alt="" />

ข้อดี: ได้ hash ชื่อไฟล์ตอน build, cache ดีขึ้น

เมื่อไหร่ใช้ public/images/
  - อ้างใน CSS แบบ url("/images/...")
  - อ้างใน <img src="/images/..."> โดยไม่ import
  - ไฟล์ใหญ่ที่ไม่ต้องการให้ webpack/vite ประมวลผลพิเศษ
