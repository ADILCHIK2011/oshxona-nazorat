const { ADMIN_CHAT_IDS } = require('../../config/admins');

/**
 * Faqat config/admins.js ichidagi ADMIN_CHAT_IDS'dagi foydalanuvchilarga
 * next()ni chaqiradi. Admin bo'lmagan so'rov BUTUNLAY e'tiborsiz
 * qoldiriladi — hech qanday javob (hatto xato xabari ham)
 * qaytarilmaydi, shunda tashqaridan kim admin ekanini aniqlab
 * bo'lmaydi.
 */
function adminOnly(ctx, next) {
  const fromId = ctx.from?.id;
  if (!fromId || !ADMIN_CHAT_IDS.includes(fromId)) {
    return;
  }

  return next();
}

module.exports = adminOnly;
