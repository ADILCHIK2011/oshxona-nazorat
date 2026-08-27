const rateLimit = require('express-rate-limit');

// `stationAuth` DAN KEYIN ishlatilishi shart — req.station kerak.
// Stansiya bo'yicha (IP emas) cheklaydi, chunki bir nechta stansiya
// bitta tarmoq ortida bo'lishi mumkin va aksincha.
function createStationRateLimiter({ windowMs, limit, message }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.station?.id?.toString() || req.ip,
    handler: (req, res) => {
      res.status(429).json({ ok: false, message });
    },
  });
}

// Kodlarni "taxmin qilib ko'rish" (brute force) urinishining oldini
// olish uchun — bitta stansiyadan daqiqasiga oqilona so'rov soni.
const scanRateLimiter = createStationRateLimiter({
  windowMs: 60 * 1000,
  limit: 60,
  message: 'Juda ko\'p so\'rov. Birozdan so\'ng qayta urinib ko\'ring.',
});

const photoRateLimiter = createStationRateLimiter({
  windowMs: 60 * 1000,
  limit: 120,
  message: 'Juda ko\'p so\'rov. Birozdan so\'ng qayta urinib ko\'ring.',
});

// PIN maydoni juda kichik (0000-9999, 10000 variant) — qattiq
// cheklanmasa, tez-tez urinish orqali "taxmin qilib topish" real
// xavf. 10/daq bilan 10 000 variantni tugatish ~1000 daqiqa talab
// qiladi — bu PIN'ning 5 daqiqalik amal qilish muddatidan ancha
// uzoq, ya'ni amalda brute-force qilib bo'lmaydi.
const emergencyPinRateLimiter = createStationRateLimiter({
  windowMs: 60 * 1000,
  limit: 10,
  message: 'Juda ko\'p so\'rov. Birozdan so\'ng qayta urinib ko\'ring.',
});

module.exports = { scanRateLimiter, photoRateLimiter, emergencyPinRateLimiter };
