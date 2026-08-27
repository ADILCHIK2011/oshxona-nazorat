const path = require('path');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

const { PORT, HOST, NODE_ENV } = require('../config/env');
const { connectDB } = require('../config/db');
const asyncHandler = require('./asyncHandler');
const stationAuth = require('./middleware/stationAuth');
const { scanRateLimiter, photoRateLimiter, emergencyPinRateLimiter } = require('./middleware/stationRateLimit');
const scanHandler = require('./routes/scan');
const userPhotoHandler = require('./routes/userPhoto');
const emergencyPinHandler = require('./routes/emergencyPin');

const app = express();

app.disable('x-powered-by');
// Faqat lokal nginx'dan (127.0.0.1) kelgan so'rovning
// X-Forwarded-For/-Proto sarlavhalariga ishoniladi — internetdagi haqiqiy
// mijoz bu sarlavhalarni soxtalashtirib rate-limit yoki HTTPS
// tekshiruvini chetlab o'ta olmaydi.
app.set('trust proxy', 'loopback');
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        // Kassir sahifasi foydalanuvchi rasmini blob: URL orqali
        // ko'rsatadi (autentifikatsiyalangan fetch bilan olib,
        // <img>ga bog'lanadi) — boshqa hamma narsa standart holicha.
        'img-src': ["'self'", 'data:', 'blob:'],
      },
    },
  })
);

// Kassir sahifasi (rasm, PINFL, token) faqat HTTPS orqali uzatilishi
// shart — production'da HTTP so'rovlar rad etiladi. Lokal
// ishlab-chiqishda (NODE_ENV=development) bu tekshiruv o'chirilgan,
// aks holda `npm start` mahalliy HTTP bilan sinab bo'lmas edi.
if (NODE_ENV === 'production') {
  app.use((req, res, next) => {
    const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
    if (!isSecure) {
      return res.status(400).json({ error: 'HTTPS talab qilinadi' });
    }
    return next();
  });
}

app.use(express.json({ limit: '1mb' }));
app.use(mongoSanitize());

// Global rate limit — kassir API'ning o'ziga xos, qattiqroq limitlari
// (`stationRateLimit.js`) bundan tashqari, alohida qo'llaniladi.
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.post('/api/scan', stationAuth, scanRateLimiter, asyncHandler(scanHandler));
app.get('/api/user-photo/:userId', stationAuth, photoRateLimiter, asyncHandler(userPhotoHandler));
app.post('/api/emergency-pin', stationAuth, emergencyPinRateLimiter, asyncHandler(emergencyPinHandler));

// Kassir sahifasi va statik fayllar (faqat /public ichidagi fayllar
// ochiq — boshqa hech narsa, masalan foydalanuvchi rasmlari, bu yerdan
// XIZMAT QILINMAYDI).
app.use(express.static(path.join(__dirname, '../public')));

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Topilmadi' });
});

// Umumiy xato ushlovchi — foydalanuvchiga HECH QACHON stack trace yoki
// DB xatosi ko'rsatilmaydi, faqat umumiy xabar. To'liq xato faqat
// server logiga yoziladi.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[API] Kutilmagan xato:', err);
  res.status(500).json({ error: 'Serverda xatolik yuz berdi' });
});

async function start() {
  await connectDB();
  app.listen(PORT, HOST, () => {
    console.log(`[API] Server ${HOST}:${PORT}-da ishga tushdi (${NODE_ENV})`);
  });
}

if (require.main === module) {
  start().catch((err) => {
    console.error('[API] Ishga tushmadi:', err);
    process.exit(1);
  });
}

module.exports = app;
