const { SuspiciousAttempt } = require('../models');
const { sendMessage } = require('./telegramApi');
const { ADMIN_CHAT_IDS } = require('../config/admins');

const WINDOW_MS = 10 * 60 * 1000;
const THRESHOLD = 3;

/**
 * Bitta manba (userId YOKI stationId) so'nggi 10 daqiqada 3 martaga
 * YETGANDA (ortiq emas — har safar qayta-qayta xabar bermaslik uchun
 * faqat chegaraga aynan yetgan onda) barcha adminlarga zudlik bilan
 * ogohlantirish yuboradi.
 */
async function checkAndAlertSuspiciousActivity({ userId, stationId }) {
  const since = new Date(Date.now() - WINDOW_MS);

  const sources = [];
  if (userId) sources.push({ field: 'userId', value: userId, label: 'Foydalanuvchi' });
  if (stationId) sources.push({ field: 'stationId', value: stationId, label: 'Kassa stansiyasi' });

  for (const source of sources) {
    // eslint-disable-next-line no-await-in-loop
    const count = await SuspiciousAttempt.countDocuments({
      [source.field]: source.value,
      timestamp: { $gte: since },
    });

    if (count === THRESHOLD) {
      const text =
        `⚠️ Shubhali faollik!\n\n${source.label}: ${source.value}\n` +
        `So'nggi 10 daqiqada ${count} marta shubhali urinish qayd etildi.`;
      // eslint-disable-next-line no-await-in-loop
      await Promise.all(
        ADMIN_CHAT_IDS.map((chatId) =>
          sendMessage(chatId, text).catch((err) =>
            console.error(`[MONITOR] Admin ${chatId}ga ogohlantirish yuborilmadi:`, err)
          )
        )
      );
    }
  }
}

module.exports = { checkAndAlertSuspiciousActivity };
