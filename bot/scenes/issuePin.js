const { Scenes, Markup } = require('telegraf');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { User, EmergencyPin, AuditLog } = require('../../models');
const { adminMenuKeyboard } = require('../keyboards');
const { findBestUserMatch } = require('../../lib/fuzzyMatch');

const PIN_VALIDITY_MS = 5 * 60 * 1000;

const issuePinWizard = new Scenes.WizardScene(
  'issuePin',

  async (ctx) => {
    await ctx.reply(
      'Favqulodda PIN kerak bo\'lgan foydalanuvchining ism va familiyasini kiriting:',
      Markup.removeKeyboard()
    );
    return ctx.wizard.next();
  },

  async (ctx) => {
    const query = (ctx.message?.text || '').trim();
    if (!query) {
      return ctx.reply('Iltimos, ism va familiyani matn sifatida kiriting:');
    }

    const candidates = await User.find({}).select('firstName lastName telegramId status isBlocked').lean();
    const match = findBestUserMatch(query, candidates);

    if (!match) {
      return ctx.reply('Mos foydalanuvchi topilmadi. Qayta urinib ko\'ring (ism va familiyani tekshiring):');
    }

    if (match.user.status !== 'approved' || match.user.isBlocked) {
      await ctx.reply(
        `Eng yaqin topilgan: ${match.user.firstName} ${match.user.lastName} — bu foydalanuvchi ` +
          'tasdiqlanmagan yoki bloklangan, favqulodda PIN berilmaydi.',
        adminMenuKeyboard
      );
      return ctx.scene.leave();
    }

    ctx.wizard.state.candidateUserId = String(match.user._id);

    await ctx.reply(
      `Eng yaqin topilgan: ${match.user.firstName} ${match.user.lastName}\n\n` +
        'Shu odamga favqulodda PIN beramizmi?',
      Markup.inlineKeyboard([
        [Markup.button.callback('✅ Ha, PIN berish', 'yes'), Markup.button.callback('❌ Yo\'q', 'no')],
      ])
    );
    return ctx.wizard.next();
  },

  async (ctx) => {
    const data = ctx.callbackQuery?.data;
    if (!data) {
      return ctx.reply('Iltimos, tugmalardan birini bosing.');
    }
    try {
      await ctx.answerCbQuery();
    } catch (_err) {
      // jim tur
    }
    try {
      await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    } catch (_err) {
      // jim tur
    }

    if (data !== 'yes') {
      await ctx.reply('Bekor qilindi.', adminMenuKeyboard);
      return ctx.scene.leave();
    }

    const user = await User.findById(ctx.wizard.state.candidateUserId).lean();
    if (!user) {
      await ctx.reply('Foydalanuvchi topilmadi (o\'chirilgan bo\'lishi mumkin).', adminMenuKeyboard);
      return ctx.scene.leave();
    }

    // 4 xonali tasodifiy PIN — faqat xashi saqlanadi, ochiq holda
    // HECH QAYERDA (bazada, logda) yozilmaydi.
    const pin = String(crypto.randomInt(0, 10000)).padStart(4, '0');
    const pinHash = await bcrypt.hash(pin, 10);
    const expiresAt = new Date(Date.now() + PIN_VALIDITY_MS);

    await EmergencyPin.create({
      pinHash,
      userId: user._id,
      createdByAdminId: ctx.from.id,
      expiresAt,
    });

    await AuditLog.create({
      actorType: 'admin',
      actorId: String(ctx.from.id),
      action: 'emergency_pin_issued',
      targetId: String(user._id),
    });

    await ctx.reply(
      `🆘 Favqulodda PIN — ${user.firstName} ${user.lastName}\n\n` +
        `PIN (BU XABAR FAQAT BIR MARTA KO'RSATILADI):\n\n<code>${pin}</code>\n\n` +
        'Muddati: 5 daqiqa. Kassir sahifasidagi "Favqulodda PIN" maydoniga kiritiladi. ' +
        'Bir marta ishlatilgach avtomatik bekor bo\'ladi.',
      { parse_mode: 'HTML', ...adminMenuKeyboard }
    );
    return ctx.scene.leave();
  }
);

module.exports = issuePinWizard;
