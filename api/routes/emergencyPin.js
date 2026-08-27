const { z } = require('zod');
const bcrypt = require('bcryptjs');
const { EmergencyPin, User, MealWindow, EntryLog, AuditLog } = require('../../models');
const { sendMessage } = require('../../lib/telegramApi');
const { ADMIN_CHAT_IDS } = require('../../config/admins');
const { getCurrentHHMM } = require('../../lib/time');

const pinSchema = z.object({ pin: z.string().regex(/^\d{4}$/) });

async function findActiveMealWindow(now) {
  const nowHHMM = getCurrentHHMM(now);
  const windows = await MealWindow.find({}).lean();
  return windows.find((w) => w.startTime <= nowHHMM && nowHHMM <= w.endTime) || null;
}

async function emergencyPinHandler(req, res) {
  const parsed = pinSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(200).json({ ok: false, message: '❌ PIN yaroqsiz' });
  }
  const { pin } = parsed.data;
  const now = new Date();

  // PIN maydoni kichik (0000-9999) bo'lgani uchun, faol va muddati
  // o'tmagan barcha EmergencyPin yozuvlari bilan bcrypt orqali
  // solishtiramiz (indekslanadigan oddiy qiymat emas).
  const candidates = await EmergencyPin.find({ used: false, expiresAt: { $gt: now } }).lean();

  let matched = null;
  for (const candidate of candidates) {
    // eslint-disable-next-line no-await-in-loop
    const isMatch = await bcrypt.compare(pin, candidate.pinHash);
    if (isMatch) {
      matched = candidate;
      break;
    }
  }

  if (!matched) {
    return res.status(200).json({ ok: false, message: '❌ PIN yaroqsiz yoki muddati o\'tgan' });
  }

  // ATOMIK: faqat hali used:false bo'lgan hujjat "used"ga o'tkaziladi
  // — ikkinchi marta ishlatish yoki parallel urinish race condition
  // yaratmaydi (xuddi QR tekshiruvidagi kabi).
  const claimed = await EmergencyPin.findOneAndUpdate(
    { _id: matched._id, used: false },
    { used: true, usedAt: now },
    { new: true }
  );

  if (!claimed) {
    return res.status(200).json({ ok: false, message: '❌ PIN allaqachon ishlatilgan' });
  }

  const [user, mealWindow] = await Promise.all([
    User.findById(claimed.userId).select('firstName lastName').lean(),
    findActiveMealWindow(now),
  ]);

  await EntryLog.create({
    userId: claimed.userId,
    qrCode: `emergency:${claimed._id}`,
    mealWindowId: mealWindow ? mealWindow._id : null,
    stationId: req.station.id,
    method: 'emergency_pin',
  });

  // Favqulodda kirishlar keyinchalik alohida ko'rib chiqilishi uchun
  // AuditLog'ga ham alohida yoziladi.
  await AuditLog.create({
    actorType: 'system',
    actorId: String(req.station.id),
    action: 'emergency_pin_used',
    targetId: String(claimed.userId),
    details: { emergencyPinId: String(claimed._id) },
  });

  const adminText =
    `🆘 Favqulodda PIN ishlatildi\n${user?.firstName || ''} ${user?.lastName || ''}\n` +
    `🕐 ${getCurrentHHMM(now)}`;
  Promise.all(
    ADMIN_CHAT_IDS.map((chatId) => sendMessage(chatId, adminText).catch(() => {}))
  ).catch(() => {});

  return res.status(200).json({
    ok: true,
    message: '✅ Favqulodda kirish tasdiqlandi',
    user: {
      userId: String(claimed.userId),
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
    },
  });
}

module.exports = emergencyPinHandler;
