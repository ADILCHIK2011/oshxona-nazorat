# CLAUDE.md

Bu fayl loyiha bo'yicha men (Claude Code) uchun doimiy kontekst. Foydalanuvchidan
yangi ma'lumot kelganda shu faylni yangilab boraman.

## Loyiha

**Oshxona tekin ovqatlanish nazorati tizimi** — to'liq tavsif `PROJECT.md` da.

Qisqacha: ro'yxatdagi xodimlar tekin ovqatlanadi, ro'yxatdan tashqarilar ham
foydalanib qolayotgani muammo. Yechim — Telegram bot orqali ro'yxatdan o'tish,
bir martalik QR-kod, kassirda skaner bilan tekshirish.

## Texnik stek

- Backend: Node.js + Express
- Telegram bot: Telegraf.js (**POLLING** rejimida, webhook emas)
- Baza: MongoDB + Mongoose
- Kassir stansiyasi: oddiy HTML/JS veb-sahifa (HID skaner klaviatura sifatida)
- QR generatsiya: `qrcode`
- Excel hisobot: `exceljs`
- Cron: `node-cron`
- Xavfsizlik: `helmet`, `express-rate-limit`, `express-mongo-sanitize`,
  `zod` (validatsiya), Node ichki `crypto` moduli (shifrlash)

## Muhim tamoyillar (buzilmasin)

**#1 — Admin almashinuvi:** Admin keyinchalik boshqa odamga topshiriladi —
shuning uchun HECH QANDAY sozlama (mahal vaqtlari, geofencing radiusi, yopiq
kunlar, admin ID) kodga hardcode qilinmaydi. Hammasi bazada saqlanadi, bot
ichidan o'zgartiriladi. Adminlik topshirilganda kalitlar almashtiriladi
(Faza 7 rejalashtirilgan).

**#2 — Ma'lumotlar xavfsizligi:** Tizim PINFL, telefon va selfie kabi
shaxsga doir ma'lumotlarni saqlaydi (O'zbekiston qonunchiligi bo'yicha
himoyalangan toifa):
- Hech qanday maxfiy kalit (.env, DB parol, API token) kodga yoki git
  repoga yozilmaydi
- PINFL bazada plain text saqlanmaydi — shifrlanadi
- Har bir tashqi kirish nuqtasi (kassir API, bot) autentifikatsiya bilan
  himoyalanadi
- Kamroq ma'lumot saqlash: kerak bo'lmagan ma'lumot (masalan geolokatsiya)
  darhol o'chiriladi

## Asosiy oqim

1. Foydalanuvchi botga ro'yxatdan o'tadi (ism, familiya, PINFL, telefon,
   lavozim, selfie)
2. Admin "Qabul qilish / Rad etish" tugmalarini ko'radi
3. Qabul qilinsa — kuniga 3 marta (har mahal uchun bittadan) QR olish huquqi
4. Mahal vaqtida "QR olish" bosilsa — joylashuv tekshiriladi, 60 soniyalik
   unikal QR generatsiya qilinadi
5. Kassir skaner bilan o'qiydi — tizim tekshiradi, natija ko'rsatiladi,
   adminga darhol xabar boradi
6. Kunlik/haftalik hisobotlar va xavfsizlik nazorati fon rejimida ishlaydi

## Muhim tamoyillar #3 — xavfsizlik prinsiplari (to'liq ro'yxat)

- **Hech narsa hardcode qilinmaydi** — maxfiy kalitlar faqat `.env`da,
  `.env` esa `.gitignore`da.
- **Defense in depth** (kamida 2 qatlam himoya) — masalan, MongoDB ham
  firewall bilan, ham parol bilan himoyalangan; bitta qatlam yiqilsa ham
  ikkinchisi ushlab qoladi.
- **Least privilege** — kassir stansiyasi faqat skanerlash huquqiga ega
  token oladi, adminning to'liq bazaga kirish huquqi bilan aralashmaydi.
- **Encryption at rest** — PINFL kabi nozik maydonlar bazada shifrlangan
  holda saqlanadi.
- **Atomik amallar** — QR-kodni tekshirish va "ishlatilgan" deb belgilash
  BITTA atomik operatsiyada (`findOneAndUpdate`), race condition bo'lmasligi
  uchun. Hech qachon find + save ketma-ketligi emas.
- **Audit jurnali** — kim, qachon, nima qildi — o'chirilmaydigan tarzda
  yoziladi (AuditLog).
- **Ma'lumotni minimallashtirish** — kerak bo'lmagan ma'lumot (masalan
  aniq geolokatsiya) tekshiruvdan keyin saqlanmaydi.
- **Xato xabarlari orqali sizdirilmaydi** — foydalanuvchiga stack trace/DB
  xatosi hech qachon ko'rsatilmaydi, faqat umumiy xabar; to'liq xato faqat
  server logiga yoziladi.

## Loyiha strukturasi (qaror qilindi)

```
/bot     — Telegraf bot handlerlari (polling)
/api     — Express ilova, route'lar, middleware
/models  — Mongoose sxemalari
/config  — env tekshiruvi, DB ulanish
/jobs    — node-cron vazifalari
/public  — kassir stansiyasi HTML/JS
/lib     — crypto, validatsiya funksiyalari
```

Asosiy ma'lumot modellari: User, MealWindow, QRSession, EntryLog,
SuspiciousAttempt, EmergencyPin, CashierStation, AdminConfig (singleton),
AuditLog.

`.env` o'zgaruvchilari: `BOT_TOKEN`, `MONGODB_URI`, `PORT`,
`ENCRYPTION_KEY` (32 bayt, PINFL AES-256-GCM shifrlash),
`HMAC_SECRET` (PINFL qidiruv xash — HMAC-SHA256, oddiy SHA-256 emas),
`STATION_API_SALT` (kassir tokenlarini xashlash).

## Holat

- **Poydevor tayyor** (2026-08-24): papka strukturasi, `.gitignore`,
  `.env.example`, `package.json` + bog'liqliklar o'rnatildi,
  `config/env.js` (fail-fast validatsiya), `config/db.js` (Mongo
  ulanish), `lib/crypto.js` (+ `lib/crypto.test.js`, `npm run
  test:crypto` bilan tekshiriladi), barcha 9 ta Mongoose modeli
  (`models/`), `api/app.js` (helmet, rate-limit, mongo-sanitize,
  umumiy xato ushlovchi, `/health`) yozildi. README.md yozildi.
  Git repo ishga tushirildi (`git init`), hali commit qilinmagan.
- **Haqiqiy `BOT_TOKEN` (@oshxona_nazoratchi_bot) va `MONGODB_URI`
  (MongoDB Atlas, `1-dars` klaster, `oshxona` bazasi) `.env`ga
  qo'yilgan va sinovdan o'tkazilgan** (2026-08-24): `getMe` orqali
  token, real yozish/o'qish/o'chirish orqali baza tasdiqlandi.
  ⚠️ Bu ikkala qiymat suhbat orqali ochiq almashilgani uchun,
  ishlab chiqarishga chiqishdan oldin **almashtirilishi (rotate)
  qilinishi tavsiya etiladi** (Atlas foydalanuvchi paroli va
  @BotFather orqali bot tokenini qayta generatsiya qilish).
  `.env` baribir `.gitignore`da, git tomonidan e'tiborsiz
  qoldirilgani tasdiqlangan — repoga hech qachon tushmaydi.
- **FAZA 1 tayyor** (2026-08-24) — ro'yxatdan o'tish oqimi:
  - `bot/scenes/registration.js` — Telegraf WizardScene: ism →
    familiya → telefon (faqat contact tugmasi, egasiga tegishli
    ekani tekshiriladi) → PINFL (14 raqam) → lavozim → selfie.
    Har bosqichda `zod` bilan validatsiya, xato bo'lsa xushmuomala
    qayta so'raladi (bosqich ilgarilamaydi).
  - `bot/validators/registration.js` — zod sxemalari (ism/familiya,
    telefon, PINFL, lavozim). Lavozim maydonida `<>{}$` kabi
    belgilar rad etiladi (in'yeksiya ehtimolini kamaytirish uchun).
  - PINFL: avval `hashPinflForLookup` bilan duplikat tekshiriladi
    (app darajasida `findOne` + DB darajasida `pinflHash` unique
    indeks — ikki qatlam himoya). Duplikat bo'lsa `AuditLog`ga
    `duplicate_pinfl_attempt` deb yoziladi. Aks holda
    `encryptPinfl` bilan shifrlanib saqlanadi; ochiq PINFL saqlagan
    o'zgaruvchi ishlatilgach `null` qilinadi (JS satrlari
    o'zgarmasligi sababli bu faqat "eng yaxshi urinish").
  - `lib/mask.js` — `maskPinfl` (oxirgi 4 raqamdan boshqasi
    yashiriladi), admin xabarida to'liq PINFL HECH QACHON
    ko'rsatilmaydi.
  - Selfie: faqat Telegram `file_id` saqlanadi (`bot/scenes/
    registration.js`), diskka yozilmaydi.
  - `bot/notifyAdmins.js` — `config/admins.js`dagi HAR BIR adminga
    `sendPhoto` orqali (ism, familiya, telefon, lavozim, maskalangan
    PINFL) + Qabul/Rad tugmalari yuboriladi.
  - `bot/handlers/adminActions.js` — tugma bosilganda `User`
    hujjati FAQAT `{_id, status:'pending'}` sharti bilan atomik
    `findOneAndUpdate` orqali yangilanadi (ikkinchi bosish/parallel
    ikki admin race condition yaratmaydi), `AuditLog`ga yoziladi,
    xabar tugmalari natija matniga almashtiriladi.
  - `bot/middleware/adminOnly.js` — admin bo'lmagan callback
    so'roviga HECH QANDAY javob qaytarilmaydi (jim e'tiborsizlik).
  - `bot/handlers/start.js` — AVVAL `config/admins.js`dagi
    `ADMIN_CHAT_IDS` tekshiriladi: admin bo'lsa ro'yxatdan o'tish
    SO'RALMAYDI (admin xodim emas), oddiy salomlashish xabari
    ko'rsatiladi. Admin bo'lmasa — mavjud foydalanuvchi holatiga
    qarab javob (pending/approved/rejected/blocked), yangi
    foydalanuvchi `registration` sahnasiga yo'naltiriladi.

  **⚠️ QAROR: admin ID ATAYIN hardcode qilingan (2026-08-24) —
  `config/admins.js`** — bu MUHIM PRINSIP #1'dan (hech narsa
  hardcode qilinmasin) **ongli ravishda chetlashish**, foydalanuvchi
  bevosita shunday so'ragani uchun. Avval bot ichidan boshqariladigan
  variant (`/addadmin`, `/removeadmin`, `/id` buyruqlari,
  `AdminConfig.adminChatIds` bazada) qurilgan edi, lekin foydalanuvchi
  buni olib tashlashni so'radi: **haqiqiy admin (oshxona boshlig'i)
  texnik odam emas va bu buyruqlarni tushunmaydi/ishlatmaydi.**
  Foydalanuvchi loyiha tugagach `config/admins.js`dagi
  `ADMIN_CHAT_IDS` massivini o'zi qo'lda, koddan tahrirlab
  o'zgartiradi. Shu sabab:
  - `bot/handlers/adminManagement.js` o'chirildi (`/addadmin`,
    `/removeadmin`, `/id` buyruqlari yo'q endi).
  - `scripts/seedAdmin.js` va `npm run seed:admin` o'chirildi
    (endi kerak emas).
  - `models/AdminConfig.js`dan `adminChatIds` maydoni olib
    tashlandi (ikkita "haqiqat manbai" bo'lib qolmasligi uchun) —
    boshqa sozlamalar (mahal vaqtlari, geofencing va h.k.) hamon
    bazada, MUHIM PRINSIP #1 ular uchun to'liq kuchda qoladi.
  - **Kelajakda o'zgartirish kerak bo'lsa**: `config/admins.js`
    faylini oching, `ADMIN_CHAT_IDS` massiviga kerakli Telegram
    chat ID'larni yozing, botni qayta ishga tushiring.
  - `bot/middleware/rateLimit.js` — telegramId boshiga 60 soniyada
    20 tadan ortiq yangilanish (xabar YOKI tugma bosish) kelsa,
    keyingi so'rovlar e'tiborsiz qoldiriladi (jim), 15 soniyada bir
    marta ogohlantirish yuboriladi. Hozircha barcha foydalanuvchilarga
    (shu jumladan adminlarga) baravar qo'llaniladi.
    **⚠️ Tuzatilgan bug (2026-08-24):** dastlab limit 5 edi — bu
    ro'yxatdan o'tish sahnasining o'zi (kamida 6 ta xabar: /start +
    ism + familiya + telefon + PINFL + lavozim + selfie) tomonidan
    real foydalanuvchida ishga tushib, "lavozim" bosqichida oddiy
    ro'yxatdan o'tishning o'zini bloklab qo'ygan edi. 20ga
    ko'tarildi — bir nechta noto'g'ri kiritish + qayta urinishga ham
    yetadi, lekin haqiqiy avtomatlashtirilgan floodni hamon ushlaydi.
  - `bot/index.js` — Telegraf + Scenes.Stage yig'ilgan, `npm run
    start:bot` bilan ishga tushadi (polling). **Session
    in-memory** — bot qayta ishga tushsa, yarim yo'ldagi ro'yxatdan
    o'tish jarayoni yo'qoladi (foydalanuvchi qayta boshlashi
    kerak); ko'lam kattalashsa persistent session (masalan Redis)
    kerak bo'ladi.
  - **Haqiqiy Atlas bazasida end-to-end sinovdan o'tkazildi**
    (2026-08-24, keyin tozalandi): `User.create` → `decryptPinfl`
    orqali to'g'ri o'qildi, `pinflHash` unique indeksi haqiqiy
    duplikatni bazada rad etdi, `AuditLog.create` ishladi, `bot/
    index.js` haqiqiy `BOT_TOKEN` bilan xatosiz ishga tushib polling
    boshladi. Sinov ma'lumotlari bazadan o'chirildi.
  - **Topilgan va tuzatilgan xato:** `config/db.js`da
    `mongoose.set('sanitizeFilter', true)` global o'rnatilgan edi —
    bu ilovaning O'ZI yozgan ishonchli `$in`/`$addToSet` kabi query
    operatorlarini ham "in'yeksiya" deb hisoblab, ularni buzib
    qo'yar edi (masalan `deleteMany({telegramId:{$in:[...]}})`
    CastError berardi). Bu haqiqiy bazada sinov paytida aniqlandi.
    Yechim: `sanitizeFilter` olib tashlandi — untrusted (HTTP)
    kirish uchun himoya `express-mongo-sanitize` orqali API
    qatlamida (`api/app.js`) yetarli, bot/ichki kod filterlarini
    o'zi qat'iy nazorat qiladi.
  - **Admin ID belgilandi** (2026-08-24): `8564520675` (bot
    egasi/boshqaruvchi akkaunt) `config/admins.js` ichidagi
    `ADMIN_CHAT_IDS`ga yozildi. Bot hozir shu holat bilan fon
    jarayonida (background) ishlab turibdi.
- **FAZA 2 tayyor** (2026-08-24) — "🍽 QR olish" oqimi:
  - `lib/time.js` — oshxonaning mahalliy vaqt zonasi (`Asia/Tashkent`,
    ATAYIN kodda qat'iy belgilangan — bu texnik konstanta, MUHIM
    PRINSIP #1'dagi "biznes sozlama" ro'yxatiga kirmaydi). Bugungi
    sana (`YYYY-MM-DD`), joriy `HH:mm`, hafta kuni (0=Yak..6=Shan)
    shu yerdan olinadi.
  - `lib/dailyUsage.js` — `recordDailyUsage(userId, mealWindowId,
    today, dailyLimit)`: **BITTA aggregation-pipeline
    `findOneAndUpdate`** orqali ham "shu mahal bugun ishlatilganmi",
    ham "kunlik limitga yetganmi"ni ATOMIK tekshiradi va yozadi.
    Mos kelmasa `null` qaytaradi. **Haqiqiy Atlas bazasida 5 ta
    PARALLEL (`Promise.all`) so'rov bilan sinaldi (limit=3) — aynan
    3 tasi o'tdi, race condition yo'qligi tasdiqlandi.**
  - `bot/handlers/qrRequest.js` — oddiy (sahnasiz) handler,
    `bot.hears('🍽 QR olish', ...)` orqali chaqiriladi. Ketma-ket
    tekshiradi (spesifikatsiyada berilgan tartibda) — yopiq kun
    (`closedWeekdays`/`holidayDates`) → mahal vaqti (faol
    `MealWindow` topilmasa rad etadi) → kunlik limit (tezkor,
    oldindan xabar — YAKUNIY tekshiruv keyinroq atomik bajariladi)
    → bloklanganlik (`isBlocked`). Muvaffaqiyatli bo'lsa:
    `recordDailyUsage` (atomik) → `crypto.randomUUID()` bilan
    `QRSession` yaratiladi (unique kod to'qnashsa 3 martagacha
    qayta urinadi) → `expiresAt = now + AdminConfig.qrValiditySeconds`
    yoziladi (**muddat tekshiruvi HALI YOZILMAGAN** — bu kassir/API
    fazasida server tomonida bajarilishi shart, botga ishonilmaydi)
    → `QRCode.toBuffer(code, {errorCorrectionLevel:'H'})` bilan rasm
    yuboriladi, `qrBuffer` darhol `null` qilinadi.
  - `bot/keyboards.js` — "🍽 QR olish" doimiy klaviatura tugmasi;
    `start.js`da (approved & !blocked) va `adminActions.js`da
    (approve qilinganda) ko'rsatiladi.
  - Barcha yangi fayllar `node --check` bilan sintaksis tekshirildi,
    `lib/time.js` alohida unit-test bilan, `lib/dailyUsage.js` esa
    **haqiqiy Atlas bazasida** (yakka + parallel stsenariylar)
    sinovdan o'tkazildi, so'ng test ma'lumotlari tozalandi.
  - **⚠️ GEOFENCING OLIB TASHLANDI (2026-08-24) — foydalanuvchi
    qarori**: dastlab joylashuvni so'rab, Haversine bilan masofani
    tekshiruvchi qadam (`lib/geo.js`, sahna ichidagi `location`
    bosqichi, `AdminConfig.restaurantLocation`/`geofenceRadiusMeters`)
    qurilgan edi, lekin foydalanuvchi buni butunlay olib tashlashni
    so'radi: **oshxonadan uzoqda turib "buyurtma berish" degan narsa
    yo'q — faqat oshxonaning o'zida iste'mol qilinadi, shuning uchun
    joylashuv tekshiruvi keraksiz.** Shu sabab:
    - `lib/geo.js` va `bot/scenes/qrRequest.js` (WizardScene, joylashuv
      bosqichi bilan) o'chirildi — o'rniga oddiy, bir bosqichli
      `bot/handlers/qrRequest.js` yozildi (sahna endi shart emas,
      chunki foydalanuvchidan hech narsa so'ralmaydi).
    - `models/AdminConfig.js`dan `restaurantLocation` va
      `geofenceRadiusMeters` maydonlari olib tashlandi.
    - Bazadagi eskirgan `restaurantLocation`, `geofenceRadiusMeters`
      va (bundan oldingi qarordan qolgan) `adminChatIds`
      maydonlari `AdminConfig` hujjatidan tozalandi (`$unset`,
      xom `collection` orqali — Mongoose'ning strict-mode'i
      schema'da yo'q maydonlarni $unset qila olmaydi, bu haqiqiy
      bazada sinalganda ma'lum bo'ldi).
    - Foydalanuvchi avval `41.3678676, 69.2832057` koordinatasini
      bergan edi — bu bazaga yozilgan, so'ng shu qarordan keyin
      butunlay o'chirildi.
  - `scripts/seedConfig.js` — 3 ta `MealWindow` (Nonushta 08:00–10:00,
    Tushlik 12:00–14:00, Kechki ovqat 18:00–20:00) va bo'sh
    `AdminConfig` singleton hujjatini yaratadigan qayta ishlatsa
    bo'ladigan skript (`npm run seed:config`) — bot ichida bularni
    tahrirlash UI'i hali yo'q.
- **FAZA 3 tayyor** (2026-08-24) — kassir stansiyasi API + sahifa:
  - `bot/handlers/cashierManagement.js` — admin buyrug'i
    `/kassa_qoshish <nom>`: `crypto.randomBytes(32).toString('hex')`
    token generatsiya qiladi, ekranda BIR MARTA (oddiy matn xabarda,
    Markdown emas — xabar formatlash xatolarining oldini olish uchun)
    ko'rsatadi, bazaga (`CashierStation.tokenHash`) faqat `bcryptjs`
    xashi yoziladi. `AuditLog`ga `cashier_station_added` yoziladi.
  - `api/middleware/stationAuth.js` — `Authorization: Bearer <token>`
    sarlavhasini har bir FAOL stansiyaning `tokenHash`i bilan
    `bcrypt.compare` orqali solishtiradi (indekslanadigan oddiy token
    emas — bcrypt bilan solishtirish uchun boshqa yo'l yo'q). Mos
    kelmasa 401, `req.station` o'rnatilmaydi, hech narsa bajarilmaydi.
  - `api/middleware/stationRateLimit.js` — `express-rate-limit`,
    KEYGENERATOR IP EMAS, `req.station.id` (auth'dan KEYIN ishlaydi):
    `/api/scan` — 60/daq, `/api/user-photo` — 120/daq.
    **⚠️ `express-rate-limit`ning `limit` sozlamasi `windowMs`
    ichida FIXED WINDOW hisoblaydi — sekin (masalan sekvensial,
    har biri Atlas'ga alohida so'rov yuboradigan) so'rovlar bilan
    sinalsa, oyna limitga yetishdan oldin qayta boshlanib ketishi
    mumkin. Shu sabab test PARALLEL (`Promise.all`) so'rovlar bilan
    yozilgan — real foydalanishda (tez-tez ketma-ket skanerlash)
    muammo emas.**
  - `api/routes/scan.js` — `POST /api/scan`: **bitta atomik**
    `QRSession.findOneAndUpdate({code, status:'active',
    expiresAt:{$gt:now}}, {status:'used',...})` — ikkita kassir bir
    xil kodni bir vaqtda yuborsa ham FAQAT BITTASI o'tadi (haqiqiy
    bazada 2 ta parallel so'rov bilan tasdiqlandi). Muvaffaqiyatsiz
    bo'lsa, sabab (`not_found`/`already_used`/`expired`) faqat
    `SuspiciousAttempt`ga yoziladi — mijozga umumiy "❌ Kod yaroqsiz"
    xabari qaytadi (sabab oshkor qilinmaydi). Muvaffaqiyatli
    skanerlashda `EntryLog` yoziladi va barcha adminlarga (fire-and
    -forget, javobni sekinlashtirmaydi) Telegram orqali xabar
    ketadi.
  - `api/routes/userPhoto.js` — `GET /api/user-photo/:userId`
    (token talab qiladi): foydalanuvchi rasmi HECH QACHON diskda/
    ochiq URL sifatida saqlanmagan — har safar Telegram Bot API
    orqali (`lib/telegramApi.js`: `getFile` + yuklab olish) real
    vaqtda olinib, to'g'ridan-to'g'ri (proksi qilib) uzatiladi.
  - `lib/telegramApi.js` — Telegraf'siz, xom Telegram Bot API
    (`fetch`) bilan ishlaydi (`sendMessage`, `getFilePath`,
    `downloadFile`) — chunki `api/` va `bot/` alohida jarayonlar,
    ikkalasi ham mustaqil ravishda faqat `BOT_TOKEN` orqali
    Telegramga murojaat qiladi.
  - `api/app.js` — `helmet`ning standart CSP'iga faqat `img-src`ga
    `blob:` qo'shildi (foydalanuvchi rasmi `URL.createObjectURL`
    orqali ko'rsatiladi); production'da (`NODE_ENV=production`)
    HTTPS bo'lmagan so'rovlar 400 bilan rad etiladi (lokalda
    o'chirilgan, aks holda `npm start` HTTP bilan sinalmas edi);
    `/public` statik xizmat qiladi (faqat shu papkadagi fayllar —
    rasm/PINFL kabi narsalar bu yerdan HECH QACHON xizmat
    qilinmaydi).
  - `public/kassir.html` + `public/kassir.js` (JS ATAYIN alohida
    faylda — helmet'ning standart CSP'i `script-src 'self'`, inline
    `<script>`ni bloklaydi): token kirish ekrani → tokenni
    `sessionStorage`da saqlaydi (localStorage EMAS — tab/brauzer
    yopilsa avtomatik o'chadi) → skaner "yozgan" kodni (Enter
    bosilganda) `/api/scan`ga yuboradi → ✅/❌ natija, ism, rasm
    (rasm alohida, TOKEN bilan `/api/user-photo/:userId`dan blob
    sifatida olinadi) → muvaffaqiyat/xato uchun alohida ohang
    (Web Audio API, tashqi fayl kerak emas) → oflayn navbat
    (`sessionStorage`da FAQAT kod+vaqt, shaxsiy ma'lumot emas),
    internet qaytganda avtomatik qayta yuboradi.
  - Barcha yangi fayllar `node --check` bilan tekshirildi. **Haqiqiy
    Atlas bazasida to'liq integratsion sinovdan o'tkazildi**:
    tokensiz/noto'g'ri token → 401; mavjud bo'lmagan/eskirgan/band
    kod → rad etiladi + `SuspiciousAttempt` yoziladi (sabab bilan);
    haqiqiy QR → muvaffaqiyatli, `EntryLog` yoziladi; 2 ta parallel
    skanerlash → faqat 1 tasi o'tadi; noto'g'ri `userId` formati →
    404 (stack trace yo'q); rate limit → 70 ta parallel so'rovdan
    bir qismi 429 bilan rad etildi. Test ma'lumotlari tozalandi.
  - **⚠️ Tuzatilgan bug (2026-08-24) — buyruq → tugma**: dastlab
    kassa qo'shish `/kassa_qoshish <nom>` slash-buyrug'i sifatida
    yozilgan edi, lekin (a) foydalanuvchi buni "🍽 QR olish" kabi
    TUGMA qilishni so'radi (admin uchun ham izchil UX), (b) kod
    qo'shilgach botni qayta ishga tushirishni unutib qo'ygandim —
    shu ikkalasi "ishlamayapti" taassurotini bergan. Yechim:
    `bot/scenes/addCashierStation.js` (WizardScene: tugma → "nomni
    kiriting" → yaratish) + `bot/handlers/cashierManagement.js`
    (`bot.hears('➕ Kassa qo\'shish', ...)`, faqat admin uchun, admin
    bo'lmasa jim e'tiborsiz) — `bot/handlers/adminActions.js`dagi
    "🍽 QR olish" bilan bir xil naqsh. Admin `/start`da endi shu
    tugmani ko'radi (`bot/keyboards.js`: `adminMenuKeyboard`).
  - **ESLATMA (o'zim uchun): bot/ fayllariga har qanday o'zgarish
    kiritilgach, ishlab turgan `node bot/index.js` jarayonini
    ALBATTA to'xtatib qayta ishga tushirish kerak — Node kodni
    "hot-reload" qilmaydi, aks holda o'zgarish botda ko'rinmaydi.**
  - **Tuzatilgan bug (2026-08-24) — to'g'ri token ham 401 berardi**:
    sabab — token 64 belgili hex qator oddiy matn sifatida
    yuborilgani uchun mobil Telegram'da qo'lda nusxalashda satr
    bo'linishi/qisman tanlash xatosiga moyil edi. Yechim: token endi
    `<code>` (HTML parse_mode) ichida yuboriladi — Telegram
    klientlarida bunga bosish butun qatorni bitta tugma kabi to'liq
    nusxalaydi. Qo'shimcha himoya qatlami sifatida ham
    `public/kassir.js` (kiritilgan tokendagi barcha bo'shliq/qator
    ko'chirish belgilari olib tashlanadi), ham `api/middleware/
    stationAuth.js` (xuddi shunday tozalash server tomonida ham)
    yangilandi. **Eski (bug tuzatilishidan oldin yaratilgan)
    stansiya tokeni tekshirilmagan qoladi — admin "➕ Kassa qo'shish"
    orqali yangi stansiya yaratib, yangi tokenni endi bosib
    nusxalashi tavsiya etiladi.**
  - Hozir ham bot (`bot/index.js`), ham API (`api/app.js`) fon
    rejimida ishlab turibdi (`npm run start:bot` / `npm start`,
    ALOHIDA jarayonlar). Haqiqiy kassir tokenini olish uchun admin
    Telegram'da "➕ Kassa qo'shish" tugmasini bosishi kerak (buni
    FAQAT admin akkaunt o'zi qila oladi), so'ng `http://localhost:
    3000/kassir.html`ga o'sha token bilan kirish mumkin.
- **FAZA 4 tayyor** (2026-08-24) — xavfsizlik nazorati va admin
  vositalari:
  - `lib/suspiciousMonitor.js` — `checkAndAlertSuspiciousActivity
    ({userId, stationId})`: bitta manba (foydalanuvchi YOKI kassa
    stansiyasi) so'nggi 10 daqiqada shubhali urinishga AYNAN 3-marta
    yetganda (ortiqda emas — takroriy spam bo'lmasin uchun) barcha
    adminlarga zudlik bilan Telegram xabari yuboradi.
    `api/routes/scan.js` endi muvaffaqiyatsiz urinishda (mavjud
    `QRSession`dan) `userId`ni ham aniqlab, shu tekshiruvni
    chaqiradi (fire-and-forget). **Haqiqiy bazada sinaldi**: 3 ta
    `SuspiciousAttempt` yozilgach chaqiruv xatosiz bajarildi.
  - `/shubhali` (admin-only) — so'nggi 20 ta `SuspiciousAttempt`ni
    (vaqt, sabab, kassa nomi, foydalanuvchi ismi bilan) ko'rsatadi.
  - `/block <telegram_id>` / `/unblock <telegram_id>` (admin-only) —
    `User.isBlocked`ni atomik `findOneAndUpdate` bilan o'zgartiradi,
    `AuditLog`ga (`user_blocked`/`user_unblocked`) yozadi,
    foydalanuvchiga xabar yuboradi.
  - **Favqulodda PIN**: `/pin <telegram_id>` (admin-only,
    `bot/handlers/emergencyPin.js`) — 4 xonali tasodifiy PIN
    (`crypto.randomInt`), bazaga FAQAT `bcryptjs` xashi
    (`EmergencyPin.pinHash`) yoziladi, muddati 5 daqiqa, admin
    ekranida (`<code>` bilan, bosib nusxalanadigan) bir marta
    ko'rsatiladi. `AuditLog`ga `emergency_pin_issued` yoziladi.
    Kassir tomonida yangi `POST /api/emergency-pin`
    (`api/routes/emergencyPin.js`, `public/kassir.html`dagi alohida
    "🆘 Favqulodda PIN" maydoni orqali): barcha faol/muddati
    o'tmagan PIN'lar bilan `bcrypt.compare`, so'ng **atomik**
    `findOneAndUpdate({_id, used:false}, {used:true,...})` — QR
    tekshiruvidagi bilan bir xil naqsh, ikkinchi marta ishlatish
    yoki parallel urinish race condition yaratmaydi (**haqiqiy
    bazada 2 ta parallel so'rov bilan tasdiqlandi — faqat 1 tasi
    o'tdi**). Muvaffaqiyatli kirish `EntryLog`ga
    `method:'emergency_pin'` bilan va `AuditLog`ga
    `emergency_pin_used` bilan alohida yoziladi (keyinchalik
    alohida ko'rib chiqish uchun). PIN maydoni juda kichik (10 000
    variant) bo'lgani uchun `api/middleware/stationRateLimit.js`ga
    QATTIQ limit (`emergencyPinRateLimiter`, 10/daq) qo'shildi —
    real bazada rate limit ishlashi tasdiqlandi.
    `models/EntryLog.js`: `mealWindowId` endi majburiy EMAS
    (favqulodda kirish mahal vaqtidan tashqarida ham, admin
    qaroriga ko'ra, mumkin bo'lishi kerak).
  - `/pinfl_tekshir` (admin-only) — `User.aggregate` orqali
    `pinflHash` bo'yicha takroriy guruhlarni qidiradi (bazadagi
    `pinflHash` unique indeksiga QO'SHIMCHA himoya qatlami —
    indeks tasodifan o'chirilgan/eski ma'lumot import qilingan
    holatlar uchun). Topilsa FAQAT signal beradi, avtomatik hech
    kimni bloklamaydi.
  - **5-band bo'yicha qayta tekshiruv**: barcha 8 ta admin-only
    kirish nuqtasi (`approve`/`reject` tugmalari, "➕ Kassa qo'shish"
    tugmasi, `/shubhali`, `/block`, `/unblock`, `/pin`,
    `/pinfl_tekshir`) endi BITTA umumiy `bot/middleware/
    adminOnly.js`dan foydalanadi — hech biri buni chetlab
    o'tmaydi (`grep` bilan tasdiqlandi).
  - **⚠️ Keyinroq tuzatildi: barcha slash-buyruqlar tugmaga
    aylantirildi** (foydalanuvchi so'ragan, "➕ Kassa qo'shish" bilan
    bir xil naqsh): `/shubhali`→🔎, `/pinfl_tekshir`→🔁 to'g'ridan-
    to'g'ri `bot.hears(..., adminOnly, handler)`; `/block`,
    `/unblock`, `/pin` esa qo'shimcha ma'lumot talab qilgani uchun
    kichik `WizardScene`larga aylandi (`bot/scenes/blockUser.js`,
    `unblockUser.js`, `issuePin.js`).
  - **⚠️ Yana bir o'zgarish: Telegram ID emas — ism+familiya bo'yicha
    "eng yaqin moslik" qidiruvi** (foydalanuvchi so'ragan — admin
    telegramId'ni bilmaydi/eslamaydi, faqat ismni biladi). `lib/
    fuzzyMatch.js`: `findBestUserMatch(query, candidates)` —
    Levenshtein tahrirlash masofasi asosida, "Ism Familiya" VA
    "Familiya Ism" ikkala tartibda solishtiradi, register'ga
    e'tibor bermaydi. O'xshashlik 0.5 (50%)dan past bo'lsa `null`
    (mos topilmadi). Har uchala sahna endi: ism kiritiladi → eng
    yaqin moslik topiladi → **admin tasdiqlashi so'raladi** (inline
    "✅ Ha" / "❌ Yo'q" tugmalari — noto'g'ri odamni tasodifan
    bloklash/PIN berish xavfidan himoya, chunki fuzzy-qidiruv
    ba'zan noto'g'ri odamni topishi mumkin) → faqat "Ha" bosilgach
    amal bajariladi. Sinaldi: aniq mos, xato yozilgan ism ("Odilbeck
    Kodirov" → "Odilbek Qodirov", score 0.88), teskari tartib,
    register farqi, mutlaqo mos kelmaydigan ism (`null`) — barchasi
    to'g'ri ishladi, shu jumladan haqiqiy bazadagi Odilbek Qodirov
    yozuvi bilan ("odilbek kodirov" → score 0.93).
  - Admin klaviaturasi (`bot/keyboards.js`: `adminMenuKeyboard`) endi
    6 ta tugmani 3 qatorda ko'rsatadi. Endi hech qanday yangi
    admin-only slash-buyruq yo'q — hammasi tugma orqali.
  - Barcha yangi fayllar `node --check` bilan tekshirildi, **haqiqiy
    Atlas bazasida to'liq integratsion sinovdan o'tkazildi**: to'g'ri
    PIN → muvaffaqiyatli + EntryLog/AuditLog yozildi; ikkinchi marta
    → rad etildi; eskirgan PIN → rad etildi; noto'g'ri PIN → rad
    etildi; tokensiz → 401; 2 ta parallel urinish → faqat 1 tasi;
    rate limit → 429; `already_used` holatida `SuspiciousAttempt.
    userId` to'g'ri to'ldirildi. Test ma'lumotlari tozalandi.
  - Bot va API FAZA 4 kodi bilan qayta ishga tushirildi (fon
    rejimida ishlab turibdi).
- Cron vazifalari (`/jobs`), AdminConfig/MealWindow'ni bot ichidan
  sozlash UI'i hali yozilmagan — keyingi fazalar.

## Ma'lum qabul qilingan xavf

`npm audit`: `exceljs` → `uuid@<11.1.1` (moderate, GHSA-w5hq-g745-h8pq).
Upstream'da buzilishsiz tuzatish yo'q (fix `exceljs@3.4.0`ga
tushiradi — regressiya). Zaiflik faqat qo'lda `buf` argumenti bilan
chaqirilgan `uuid`ga tegishli, bizning kodda ishlatilmaydi. Kritik/
yuqori daraja yo'q. `bcrypt` (native, `tar` orqali critical zaiflik
olib kelgan) o'rniga `bcryptjs` tanlandi; `node-cron` 3.x → 4.x ga
ko'tarildi (uuid zaifligi tuzatildi).

## Konventsiyalar / qarorlar

- CommonJS (`require`), ES modules emas.
- Har bir model alohida faylda (`models/<Name>.js`), `models/index.js`
  orqali barchasi eksport qilinadi.
- QRSession statusi FAQAT `findOneAndUpdate` bilan atomik yangilanadi
  ([[#3 — xavfsizlik prinsiplari]]dagi "Atomik amallar"ga qarang).
- Parol/token/PIN xashlash uchun `bcryptjs` ishlatiladi (native
  `bcrypt` emas — Windows'da build-tool talab qilmaydi va `tar`
  orqali kelgan critical CVE zanjiridan xoli).
