const { z } = require('zod');
const { QRSession, User, MealWindow, EntryLog, SuspiciousAttempt } = require('../../models');
const { sendMessage } = require('../../lib/telegramApi');
const { ADMIN_CHAT_IDS } = require('../../config/admins');
const { getCurrentHHMM } = require('../../lib/time');
const { checkAndAlertSuspiciousActivity } = require('../../lib/suspiciousMonitor');

const scanSchema = z.object({ code: z.string().uuid() });

async function determineFailureDetails(code, now) {
  const existing = await QRSession.findOne({ code }).lean();
  if (!existing) return { reason: 'not_found', userId: null };
  if (existing.status === 'used') return { reason: 'already_used', userId: existing.userId };
  if (existing.expiresAt <= now) return { reason: 'expired', userId: existing.userId };
  return { reason: 'unknown', userId: existing.userId };
}

async function scanHandler(req, res) {
  const parsed = scanSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(200).json({ ok: false, message: '❌ Kod yaroqsiz' });
  }
  const { code } = parsed.data;
  const now = new Date();

  // MUHIM: bitta atomik findOneAndUpdate — QR faqat "active" va
  // muddati o'tmagan bo'lsa "used"ga o'tkaziladi. Ikkita kassir bir
  // xil kodni bir vaqtda skanerlasa ham, MongoDB bitta hujjatga bir
  // vaqtning o'zida faqat bitta yozuvni bajaradi — race condition
  // yo'q, FAQAT BITTASI muvaffaqiyatli bo'ladi.
  const session = await QRSession.findOneAndUpdate(
    { code, status: 'active', expiresAt: { $gt: now } },
    { status: 'used', usedAt: now, scannedByStationId: req.station.id },
    { new: true }
  );

  if (!session) {
    // Sabab ANIQLASH so'rovi faqat SuspiciousAttempt uchun — mijozga
    // (kassir sahifasiga) sabab bitma-bit oshkor qilinmaydi, umumiy
    // xabar yetarli.
    const { reason, userId } = await determineFailureDetails(code, now);
    await SuspiciousAttempt.create({ code, reason, stationId: req.station.id, userId });

    // Bitta manba (foydalanuvchi yoki stansiya) qisqa vaqtda 3+ marta
    // shubhali urinish qilsa, adminlarga zudlik bilan xabar boradi.
    checkAndAlertSuspiciousActivity({ userId, stationId: req.station.id }).catch((err) =>
      console.error('[API] Shubhali faollik tekshiruvida xato:', err)
    );

    return res.status(200).json({ ok: false, message: '❌ Kod yaroqsiz' });
  }

  const [user, mealWindow] = await Promise.all([
    User.findById(session.userId).select('firstName lastName').lean(),
    MealWindow.findById(session.mealWindowId).select('name').lean(),
  ]);

  await EntryLog.create({
    userId: session.userId,
    qrCode: session.code,
    mealWindowId: session.mealWindowId,
    stationId: req.station.id,
    method: 'qr',
  });

  const adminText =
    `✅ ${user?.firstName || ''} ${user?.lastName || ''}\n` +
    `🍽 ${mealWindow?.name || ''}\n` +
    `🕐 ${getCurrentHHMM(now)}`;
  Promise.all(
    ADMIN_CHAT_IDS.map((chatId) =>
      sendMessage(chatId, adminText).catch((err) =>
        console.error(`[API] Admin ${chatId}ga xabar yuborilmadi:`, err)
      )
    )
  ).catch(() => {});

  return res.status(200).json({
    ok: true,
    message: '✅ Tasdiqlandi',
    user: {
      userId: String(session.userId),
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
    },
    mealWindowName: mealWindow?.name || '',
  });
}

module.exports = scanHandler;
