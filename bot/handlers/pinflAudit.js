const { User } = require('../../models');
const adminOnly = require('../middleware/adminOnly');
const { PINFL_CHECK_BUTTON_TEXT } = require('../keyboards');

// PINFL bo'yicha unique indeks (models/User.js: pinflHash) yozish
// paytida duplikatning oldini oladi — bu komanda esa qo'shimcha
// himoya qatlami sifatida bazani mustaqil qayta tekshiradi (masalan
// indeks tasodifan o'chirilgan yoki eski ma'lumot import qilingan
// holatlar uchun). Duplikat topilsa FAQAT SIGNAL beriladi, hech kim
// avtomatik bloklanmaydi — qaror admin qo'lida.
async function checkPinflDuplicates(ctx) {
  const duplicates = await User.aggregate([
    { $group: { _id: '$pinflHash', count: { $sum: 1 }, telegramIds: { $push: '$telegramId' } } },
    { $match: { count: { $gt: 1 } } },
  ]);

  if (duplicates.length === 0) {
    return ctx.reply('✅ PINFL bo\'yicha duplikat topilmadi.');
  }

  const lines = duplicates.map(
    (d, i) => `${i + 1}. ${d.count} ta hisob, telegramId'lar: ${d.telegramIds.join(', ')}`
  );

  await ctx.reply(
    `⚠️ PINFL bo'yicha ${duplicates.length} ta shubhali guruh topildi:\n\n${lines.join('\n')}\n\n` +
      'Bu avtomatik bloklanmaydi — har birini qo\'lda ko\'rib chiqing.'
  );
}

function registerPinflAudit(bot) {
  bot.hears(PINFL_CHECK_BUTTON_TEXT, adminOnly, checkPinflDuplicates);
}

module.exports = registerPinflAudit;
