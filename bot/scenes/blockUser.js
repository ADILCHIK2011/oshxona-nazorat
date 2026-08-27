const { Scenes, Markup } = require('telegraf');
const { User, AuditLog } = require('../../models');
const { adminMenuKeyboard } = require('../keyboards');
const { findBestUserMatch } = require('../../lib/fuzzyMatch');

const blockUserWizard = new Scenes.WizardScene(
  'blockUser',

  async (ctx) => {
    await ctx.reply(
      'Bloklanadigan foydalanuvchining ism va familiyasini kiriting:',
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

    ctx.wizard.state.candidateUserId = String(match.user._id);
    ctx.wizard.state.candidateName = `${match.user.firstName} ${match.user.lastName}`;

    const statusNote = match.user.isBlocked ? ' (allaqachon bloklangan)' : '';
    await ctx.reply(
      `Eng yaqin topilgan: ${match.user.firstName} ${match.user.lastName}${statusNote}\n\nShu odamni bloklaymizmi?`,
      Markup.inlineKeyboard([
        [Markup.button.callback('✅ Ha, bloklash', 'yes'), Markup.button.callback('❌ Yo\'q', 'no')],
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

    const user = await User.findByIdAndUpdate(
      ctx.wizard.state.candidateUserId,
      { isBlocked: true },
      { new: true }
    );
    if (!user) {
      await ctx.reply('Foydalanuvchi topilmadi (o\'chirilgan bo\'lishi mumkin).', adminMenuKeyboard);
      return ctx.scene.leave();
    }

    await AuditLog.create({
      actorType: 'admin',
      actorId: String(ctx.from.id),
      action: 'user_blocked',
      targetId: String(user._id),
    });

    await ctx.reply(`🚫 ${user.firstName} ${user.lastName} bloklandi.`, adminMenuKeyboard);

    try {
      await ctx.telegram.sendMessage(
        user.telegramId,
        '🚫 Hisobingiz vaqtincha bloklandi. Administrator bilan bog\'laning.'
      );
    } catch (err) {
      console.error('[BOT] Foydalanuvchiga bloklash haqida xabar yuborilmadi:', err);
    }

    return ctx.scene.leave();
  }
);

module.exports = blockUserWizard;
