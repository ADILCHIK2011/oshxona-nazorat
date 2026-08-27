const crypto = require('crypto');
const QRCode = require('qrcode');
const { User, MealWindow, AdminConfig, QRSession } = require('../../models');
const { getTodayDateString, getCurrentHHMM, getWeekday } = require('../../lib/time');
const { recordDailyUsage } = require('../../lib/dailyUsage');

async function findActiveMealWindow() {
  const now = getCurrentHHMM();
  const windows = await MealWindow.find({}).sort({ order: 1 }).lean();
  return windows.find((w) => w.startTime <= now && now <= w.endTime) || null;
}

// Ketma-ket tekshiruvlar: yopiq kun -> mahal vaqti -> kunlik limit
// (oldindan, tezkor xabar uchun) -> bloklanganlik. Har biri
// muvaffaqiyatsiz bo'lsa, aniq va xushmuomala xabar bilan to'xtaydi.
// Geofencing YO'Q — masofadan buyurtma qilinmaydi, faqat oshxonaning
// o'zida iste'mol qilinadi, shuning uchun joylashuv tekshiruvi kerak
// emas.
async function qrRequestHandler(ctx) {
  const user = await User.findOne({ telegramId: ctx.from.id }).lean();
  if (!user || user.status !== 'approved') {
    return ctx.reply('Sizda bu funksiyadan foydalanish huquqi yo\'q.');
  }

  const config = await AdminConfig.findById('singleton').lean();
  if (!config) {
    return ctx.reply('Tizim hali sozlanmagan. Administrator bilan bog\'laning.');
  }

  const today = getTodayDateString();
  const weekday = getWeekday();

  // 1) yopiq kun
  if ((config.closedWeekdays || []).includes(weekday) || (config.holidayDates || []).includes(today)) {
    return ctx.reply('📅 Bugun oshxona yopiq.');
  }

  // 2) mahal vaqti
  const mealWindow = await findActiveMealWindow();
  if (!mealWindow) {
    return ctx.reply('⏰ Hozir ovqatlanish vaqti emas.');
  }

  // 3) kunlik limit — bu shunchaki tezkor, oldindan ko'rsatiladigan
  // xabar uchun. Haqiqiy, race-condition'ga chidamli tekshiruv QR
  // yaratish paytida `recordDailyUsage` orqali ATOMIK bajariladi.
  const dailyLimit = config.dailyQrLimit ?? 3;
  const todayUsage = (user.dailyUsage || []).find((d) => d.date === today);
  const usedMealWindowIds = (todayUsage?.mealWindowIds || []).map(String);
  if (usedMealWindowIds.includes(String(mealWindow._id))) {
    return ctx.reply('✅ Siz bu mahal uchun QR kodni allaqachon olgansiz.');
  }
  if (usedMealWindowIds.length >= dailyLimit) {
    return ctx.reply('📵 Kunlik QR olish limitiga yetdingiz.');
  }

  // 4) bloklanganlik
  if (user.isBlocked) {
    return ctx.reply('🚫 Hisobingiz vaqtincha bloklangan. Administrator bilan bog\'laning.');
  }

  try {
    // Kunlik limitni ATOMIK ravishda "band qilamiz" — ikkita parallel
    // so'rov bir vaqtda kelsa ham faqat bittasi muvaffaqiyatli bo'ladi.
    const updatedUser = await recordDailyUsage(user._id, mealWindow._id, today, dailyLimit);
    if (!updatedUser) {
      return ctx.reply(
        '📵 Kunlik QR olish limitiga allaqachon yetgansiz (yoki bu mahal uchun olib bo\'lgansiz).'
      );
    }

    // QRSession yaratish: kod to'qnashsa (128-bitli UUID'da amalda
    // deyarli imkonsiz) qayta urinamiz.
    let qrSession = null;
    let lastErr = null;
    for (let attempt = 0; attempt < 3 && !qrSession; attempt++) {
      const code = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + config.qrValiditySeconds * 1000);
      try {
        // MUHIM: expiresAt shu yerda faqat SAQLANADI. Haqiqiy muddat
        // tekshiruvi kassir skanerlagan payt SERVER tomonida
        // (keyingi fazada) bajariladi — botning o'zi yoki
        // foydalanuvchi qurilmasi hisobiga hech qachon ishonilmaydi.
        qrSession = await QRSession.create({
          code,
          userId: user._id,
          mealWindowId: mealWindow._id,
          expiresAt,
          status: 'active',
        });
      } catch (err) {
        if (err?.code === 11000) {
          lastErr = err;
          continue;
        }
        throw err;
      }
    }

    if (!qrSession) {
      throw lastErr || new Error('QR kod yaratib bo\'lmadi');
    }

    let qrBuffer = await QRCode.toBuffer(qrSession.code, { errorCorrectionLevel: 'H', width: 400 });

    await ctx.replyWithPhoto(
      { source: qrBuffer },
      { caption: `🍽 ${mealWindow.name}\n\nBu QR kod ${config.qrValiditySeconds} soniya amal qiladi.` }
    );

    // Vaqtinchalik nusxani darhol tozalaymiz.
    qrBuffer = null;
  } catch (err) {
    console.error('[BOT] QR generatsiyada xato:', err);
    await ctx.reply('Kechirasiz, QR kod yaratishda xatolik yuz berdi. Birozdan so\'ng qayta urinib ko\'ring.');
  }
}

module.exports = qrRequestHandler;
