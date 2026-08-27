const { Scenes, Markup } = require('telegraf');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { CashierStation, AuditLog } = require('../../models');
const { adminMenuKeyboard } = require('../keyboards');

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Kassir stansiyasi tokeni: uzun, tasodifiy (256 bitli), bazada faqat
// bcrypt xashi saqlanadi — token o'zi FAQAT shu xabarda, bir marta
// ko'rsatiladi (least privilege: bu token faqat /api/scan va
// /api/user-photo uchun, adminning bot huquqlariga aloqasi yo'q).
const addCashierStationWizard = new Scenes.WizardScene(
  'addCashierStation',

  async (ctx) => {
    await ctx.reply('Yangi kassa nomini kiriting:', Markup.removeKeyboard());
    return ctx.wizard.next();
  },

  async (ctx) => {
    const name = (ctx.message?.text || '').trim();
    if (!name) {
      return ctx.reply('Iltimos, kassa nomini matn sifatida kiriting:');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(token, 10);
    const station = await CashierStation.create({ name, tokenHash, isActive: true });

    await AuditLog.create({
      actorType: 'admin',
      actorId: String(ctx.from.id),
      action: 'cashier_station_added',
      targetId: String(station._id),
      details: { name },
    });

    await ctx.reply(
      `✅ "${escapeHtml(name)}" kassasi qo'shildi.\n\n` +
        'Token (BU XABAR FAQAT BIR MARTA KO\'RSATILADI — kassir kompyuterida xavfsiz joyda saqlang):\n\n' +
        `<code>${token}</code>\n\n` +
        'Yuqoridagi kodga bosib nusxalang (to\'liq, boshqa hech narsa qo\'shmasdan) va kassir ' +
        'sahifasiga (/kassir.html) birinchi kirishda joylang.',
      { parse_mode: 'HTML', ...adminMenuKeyboard }
    );
    return ctx.scene.leave();
  }
);

module.exports = addCashierStationWizard;
