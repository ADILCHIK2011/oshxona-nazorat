const WINDOW_MS = 60 * 1000;
// MUHIM: ro'yxatdan o'tish sahnasining o'zi kamida 6 ta xabar talab
// qiladi (/start + ism + familiya + telefon + PINFL + lavozim + selfie).
// Limit past bo'lsa (masalan 5), oddiy ro'yxatdan o'tishning o'zi
// spam sifatida bloklanib qoladi. Shuning uchun limit haqiqiy
// avtomatlashtirilgan floodni ushlaydigan, lekin bir nechta noto'g'ri
// kiritish + qayta urinishga ham yetadigan darajada tanlangan.
const MAX_REQUESTS = 20;
const WARNING_COOLDOWN_MS = 15 * 1000;

// telegramId -> { timestamps: number[], warnedAt: number }
// Jarayon (process) qayta ishga tushsa tozalanadi — bir nechta
// instansiya orqasida ishlashi kerak bo'lsa, buni Redis kabi umumiy
// bir joyga ko'chirish kerak bo'ladi (hozircha bitta instansiya).
const buckets = new Map();

function rateLimit() {
  return async (ctx, next) => {
    const id = ctx.from?.id;
    if (!id) return next();

    const now = Date.now();
    const bucket = buckets.get(id) || { timestamps: [], warnedAt: 0 };
    bucket.timestamps = bucket.timestamps.filter((t) => now - t < WINDOW_MS);
    bucket.timestamps.push(now);
    buckets.set(id, bucket);

    if (bucket.timestamps.length > MAX_REQUESTS) {
      // So'rov butunlay e'tiborsiz qoldiriladi (next() chaqirilmaydi).
      // Ogohlantirish xabari spam bo'lib ketmasligi uchun cooldown bilan.
      if (now - bucket.warnedAt > WARNING_COOLDOWN_MS) {
        bucket.warnedAt = now;
        try {
          await ctx.reply('⏳ Juda tez-tez yozyapsiz. Biroz kutib turing.');
        } catch (_err) {
          // jim tur — xabar yuborilmasa ham davom etamiz
        }
      }
      return;
    }

    return next();
  };
}

module.exports = rateLimit;
