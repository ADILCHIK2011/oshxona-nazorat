# Oshxona nazorat boti

Oshxonada tekin ovqatlanishni Telegram bot + QR-kod orqali nazorat qiluvchi
tizim. To'liq loyiha konteksti uchun [PROJECT.md](./PROJECT.md) ga qarang.

## O'rnatish

```bash
npm install
cp .env.example .env
```

`.env` faylini to'ldiring:

```bash
# Linux/macOS/Git Bash
openssl rand -hex 32
```

```powershell
# Windows PowerShell (openssl bo'lmasa)
-join ((1..32) | ForEach-Object { "{0:x2}" -f (Get-Random -Max 256) })
```

Yuqoridagi buyruqni **uch marta** ishga tushirib, natijalarni mos ravishda
`ENCRYPTION_KEY`, `HMAC_SECRET`, `STATION_API_SALT`ga qo'ying. `BOT_TOKEN`ni
[@BotFather](https://t.me/BotFather)dan, `MONGODB_URI`ni pastdagi bo'limdan
oling.

## MongoDB xavfsizligi (MAJBURIY)

- MongoDB **hech qachon** autentifikatsiyasiz yoki `0.0.0.0`da (barcha
  tarmoq interfeyslarida) ishga tushirilmasin.
- Mahalliy o'rnatilgan MongoDB uchun `mongod.conf`da `bindIp: 127.0.0.1`
  bo'lishi va 27017-port tashqi firewall orqali yopiq bo'lishi shart.
- Foydalanuvchi/parol (yoki MongoDB Atlas) orqali autentifikatsiya
  yoqilgan bo'lishi kerak — bu "defense in depth" tamoyilining bir
  qatlami: firewall yiqilsa ham, parol himoyasi qoladi.

## Ishga tushirish

```bash
npm start
```

Ilova ishga tushishdan oldin barcha majburiy env o'zgaruvchilarni
tekshiradi (`config/env.js`) — birortasi yo'q bo'lsa, aniq xato bilan
to'xtaydi.

## Kripto funksiyalarini tekshirish

```bash
npm run test:crypto
```

## Ma'lum, qabul qilingan xavf (known accepted risk)

`npm audit` `exceljs`ning ichki `uuid` bog'liqligida (moderate severity,
GHSA-w5hq-g745-h8pq) ogohlantiradi. Bu upstream'da hali tuzatilmagan va
buzilishsiz (non-breaking) tuzatish yo'q. Zaiflik faqat qo'lda `buf`
argumenti bilan chaqirilgan `uuid` funksiyalariga tegishli — `exceljs`
buni ichki ID generatsiya uchun ishlatadi va foydalanuvchi kirishi bilan
bog'liq emas. Kritik/yuqori darajadagi zaifliklar yo'q.

## Xavfsizlik prinsiplari

Loyiha davomida qo'llaniladigan barcha xavfsizlik tamoyillari
[PROJECT.md](./PROJECT.md) va [CLAUDE.md](./CLAUDE.md) fayllarida
belgilangan (hardcode qilmaslik, defense in depth, least privilege,
encryption at rest, atomik amallar, audit jurnali, ma'lumotni
minimallashtirish, xato xabarlari orqali sizdirmaslik).
