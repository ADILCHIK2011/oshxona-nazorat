LOYIHA: Oshxona tekin ovqatlanish nazorati tizimi

MUAMMO: Oshxonada ro'yxatdagi xodimlar tekin ovqatlanadi, lekin ro'yxatda
yo'q odamlar ham ba'zida tekin ovqatlanib ketmoqda. Hozir bu qog'oz-
ruchka bilan nazorat qilinadi.

YECHIM: Telegram bot orqali ro'yxatdan o'tish, bir martalik QR-kod
generatsiya qilish, kassirda skaner orqali tekshirish.

TEXNIK STEK:
- Backend: Node.js + Express
- Telegram bot: Telegraf.js (POLLING rejimida — pastga qarang)
- Baza: MongoDB + Mongoose
- Kassir stansiyasi: oddiy HTML/JS veb-sahifa (HID skaner klaviatura
  sifatida ishlaydi)
- QR generatsiya: `qrcode` npm paketi
- Excel hisobot: `exceljs`
- Cron vazifalar: `node-cron`
- Xavfsizlik: `helmet`, `express-rate-limit`, `express-mongo-sanitize`,
  `zod` (validatsiya), Node ichki `crypto` moduli (shifrlash)

MUHIM PRINSIP #1 — ADMIN ALMASHINUVI: Admin (oshxona egasi) keyinchalik
boshqa odamga topshiriladi. Shuning uchun HECH QANDAY sozlama (mahal
vaqtlari, geofencing radiusi, yopiq kunlar, admin ID) kodga qattiq
yozilmasin (hardcode qilinmasin) — barchasi bazada saqlanadi va bot
ichidan o'zgartiriladi. Adminlik topshirilganda kalitlar almashtiriladi
(pastga qarang, Faza 7).

MUHIM PRINSIP #2 — MA'LUMOTLAR XAVFSIZLIGI: Bu tizim PINFL, telefon
raqami va shaxsiy rasmlarni saqlaydi — bular O'zbekiston qonunchiligida
"shaxsga doir ma'lumotlar" deb himoyalangan. Shuning uchun:
- Hech qanday maxfiy kalit (.env, DB parol, API tokenlar) kodga yoki
  git repozitoriyaga yozilmaydi
- PINFL bazada ochiq matn (plain text) holida SAQLANMAYDI — shifrlanadi
- Har bir tashqi kirish nuqtasi (kassir API, bot) autentifikatsiya
  bilan himoyalanadi
- Kamroq ma'lumot saqlash prinsipi: nima kerak — faqat shu saqlanadi,
  kerak bo'lmagan joyda (masalan geolokatsiya) darhol o'chiriladi

ASOSIY OQIM:
1. Foydalanuvchi botga ro'yxatdan o'tadi (ism, familiya, PINFL, telefon,
   lavozim, selfie rasm)
2. Admin botda "Qabul qilish / Rad etish" tugmalarini ko'radi
3. Qabul qilinsa — foydalanuvchi bazaga qo'shiladi, kuniga 3 marta
   (har mahal uchun bittadan) QR-kod olish huquqiga ega bo'ladi
4. Foydalanuvchi mahal vaqtida "QR olish" bossa — joylashuvi tekshiriladi,
   keyin 60 soniyaga amal qiluvchi unikal QR-kod generatsiya qilinadi
5. Kassir QR-ni skaner bilan o'qiydi — tizim tekshiradi va natijani
   ko'rsatadi, adminga darhol xabar boradi
6. Kunlik/haftalik hisobotlar, xavfsizlik nazorati va avtomatlashtirish
   fon rejimida ishlaydi