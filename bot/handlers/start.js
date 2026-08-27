const { User } = require('../../models');
const { ADMIN_CHAT_IDS } = require('../../config/admins');
const { mainMenuKeyboard, adminMenuKeyboard } = require('../keyboards');

const ADMIN_WELCOME =
  '👋 Salom!\n\nYangi ro\'yxatdan o\'tish so\'rovlari shu yerga xabar sifatida keladi.';

function statusMessage(user) {
  if (user.isBlocked) {
    return '🚫 Hisobingiz vaqtincha bloklangan. Administrator bilan bog\'laning.';
  }

  switch (user.status) {
    case 'pending':
      return '⏳ Arizangiz hali ko\'rib chiqilmoqda. Iltimos, kuting.';
    case 'approved':
      return '✅ Xush kelibsiz! Hisobingiz tasdiqlangan.';
    case 'rejected':
      return '❌ Arizangiz rad etilgan. Xato deb hisoblasangiz, administrator bilan bog\'laning.';
    default:
      return '⏳ Arizangiz ko\'rib chiqilmoqda.';
  }
}

async function startHandler(ctx) {
  // Admin (oshxona egasi/boshqaruvchisi) tekin ovqatlanish ro'yxatiga
  // kiruvchi xodim emas — shuning uchun ro'yxatdan o'tish so'ralmaydi.
  // Kim admin ekani config/admins.js faylida qo'lda belgilanadi.
  if (ADMIN_CHAT_IDS.includes(ctx.from.id)) {
    return ctx.reply(ADMIN_WELCOME, adminMenuKeyboard);
  }

  const user = await User.findOne({ telegramId: ctx.from.id }).lean();

  if (!user) {
    return ctx.scene.enter('registration');
  }

  if (user.status === 'approved' && !user.isBlocked) {
    return ctx.reply(statusMessage(user), mainMenuKeyboard);
  }

  return ctx.reply(statusMessage(user));
}

module.exports = startHandler;
