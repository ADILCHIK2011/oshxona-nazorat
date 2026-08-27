const { ADMIN_CHAT_IDS } = require('../config/admins');

async function notifyAdminsOfNewRegistration(telegram, user, maskedPinfl) {
  if (ADMIN_CHAT_IDS.length === 0) {
    console.warn(
      '[BOT] config/admins.js bo\'sh — yangi ro\'yxatdan o\'tish haqida hech kimga xabar berilmadi.'
    );
    return;
  }

  const caption =
    `🆕 Yangi ro'yxatdan o'tish so'rovi\n\n` +
    `Ism: ${user.firstName}\n` +
    `Familiya: ${user.lastName}\n` +
    `Telefon: ${user.phone}\n` +
    `Lavozim: ${user.position}\n` +
    `PINFL: ${maskedPinfl}`;

  const replyMarkup = {
    inline_keyboard: [
      [
        { text: '✅ Qabul qilish', callback_data: `approve:${user._id}` },
        { text: '❌ Rad etish', callback_data: `reject:${user._id}` },
      ],
    ],
  };

  await Promise.all(
    ADMIN_CHAT_IDS.map((chatId) =>
      telegram
        .sendPhoto(chatId, user.photoFileId, { caption, reply_markup: replyMarkup })
        .catch((err) => console.error(`[BOT] Admin ${chatId}ga xabar yuborilmadi:`, err))
    )
  );
}

module.exports = { notifyAdminsOfNewRegistration };
