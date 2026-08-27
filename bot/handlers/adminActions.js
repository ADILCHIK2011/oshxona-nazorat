const { User, AuditLog } = require('../../models');
const adminOnly = require('../middleware/adminOnly');
const { mainMenuKeyboard } = require('../keyboards');

async function handleDecision(ctx, decision) {
  const userId = ctx.match[1];

  const update =
    decision === 'approved'
      ? { status: 'approved', approvedAt: new Date() }
      : { status: 'rejected' };

  // Atomik: faqat hozircha "pending" bo'lgan hujjat yangilanadi — shu
  // orqali ikkinchi marta bosish yoki ikki adminning bir vaqtda bosishi
  // race condition yaratmaydi.
  const user = await User.findOneAndUpdate({ _id: userId, status: 'pending' }, update);

  if (!user) {
    try {
      await ctx.answerCbQuery('Bu so\'rov allaqachon ko\'rib chiqilgan.');
    } catch (_err) {
      // jim tur
    }
    return;
  }

  await AuditLog.create({
    actorType: 'admin',
    actorId: String(ctx.from.id),
    action: decision === 'approved' ? 'user_approved' : 'user_rejected',
    targetId: String(user._id),
  });

  const resultLine = decision === 'approved' ? '\n\n✅ Qabul qilindi' : '\n\n❌ Rad etildi';
  const originalCaption = ctx.callbackQuery.message?.caption || '';

  try {
    await ctx.editMessageCaption(`${originalCaption}${resultLine}`, {
      reply_markup: { inline_keyboard: [] },
    });
  } catch (err) {
    console.error('[BOT] Admin xabarini yangilab bo\'lmadi:', err);
  }

  try {
    await ctx.answerCbQuery();
  } catch (_err) {
    // jim tur
  }

  const userMessage =
    decision === 'approved'
      ? '✅ Arizangiz qabul qilindi! Endi tizimdan foydalanishingiz mumkin.'
      : 'Afsuski, imkoniyat cheklangan.';

  try {
    await ctx.telegram.sendMessage(
      user.telegramId,
      userMessage,
      decision === 'approved' ? mainMenuKeyboard : undefined
    );
  } catch (err) {
    console.error('[BOT] Foydalanuvchiga xabar yuborilmadi:', err);
  }
}

function registerAdminActions(bot) {
  bot.action(/^approve:([a-f0-9]{24})$/, adminOnly, (ctx) => handleDecision(ctx, 'approved'));
  bot.action(/^reject:([a-f0-9]{24})$/, adminOnly, (ctx) => handleDecision(ctx, 'rejected'));
}

module.exports = registerAdminActions;
