const { Scenes, Markup } = require('telegraf');
const { User, AuditLog } = require('../../models');
const { encryptPinfl, hashPinflForLookup } = require('../../lib/crypto');
const { maskPinfl } = require('../../lib/mask');
const {
  nameSchema,
  phoneSchema,
  pinflSchema,
  positionSchema,
} = require('../validators/registration');
const { notifyAdminsOfNewRegistration } = require('../notifyAdmins');

function reportInvalid(ctx, result) {
  const message = result.error.issues[0]?.message || 'Noto\'g\'ri format';
  return ctx.reply(`⚠️ ${message}. Qayta kiriting:`);
}

const registrationWizard = new Scenes.WizardScene(
  'registration',

  // 0) Kirish — ism so'raladi
  async (ctx) => {
    await ctx.reply(
      'Ro\'yxatdan o\'tishni boshlaymiz.\n\nIsmingizni kiriting:',
      Markup.removeKeyboard()
    );
    return ctx.wizard.next();
  },

  // 1) ism -> familiya so'raladi
  async (ctx) => {
    if (!ctx.message?.text) {
      return ctx.reply('Iltimos, ismingizni matn sifatida kiriting:');
    }
    const result = nameSchema.safeParse(ctx.message.text);
    if (!result.success) return reportInvalid(ctx, result);

    ctx.wizard.state.firstName = result.data;
    await ctx.reply('Familiyangizni kiriting:');
    return ctx.wizard.next();
  },

  // 2) familiya -> telefon so'raladi (contact tugmasi)
  async (ctx) => {
    if (!ctx.message?.text) {
      return ctx.reply('Iltimos, familiyangizni matn sifatida kiriting:');
    }
    const result = nameSchema.safeParse(ctx.message.text);
    if (!result.success) return reportInvalid(ctx, result);

    ctx.wizard.state.lastName = result.data;
    await ctx.reply(
      'Telefon raqamingizni yuborish uchun quyidagi tugmani bosing:',
      Markup.keyboard([Markup.button.contactRequest('📱 Raqamni yuborish')])
        .oneTime()
        .resize()
    );
    return ctx.wizard.next();
  },

  // 3) telefon (faqat contact tugmasi orqali, o'zining raqami) -> PINFL so'raladi
  async (ctx) => {
    const contact = ctx.message?.contact;
    if (!contact) {
      return ctx.reply('Iltimos, "📱 Raqamni yuborish" tugmasini bosing:');
    }
    // Boshqa odamning kontaktini forward qilishning oldini olamiz.
    if (contact.user_id && contact.user_id !== ctx.from.id) {
      return ctx.reply('Iltimos, faqat O\'ZINGIZNING telefon raqamingizni yuboring:');
    }

    const result = phoneSchema.safeParse(contact.phone_number);
    if (!result.success) return reportInvalid(ctx, result);

    const phone = result.data.startsWith('+') ? result.data : `+${result.data}`;
    ctx.wizard.state.phone = phone;

    await ctx.reply(
      'PINFL (JSHSHIR) raqamingizni kiriting (14 ta raqam):',
      Markup.removeKeyboard()
    );
    return ctx.wizard.next();
  },

  // 4) PINFL -> lavozim so'raladi
  async (ctx) => {
    if (!ctx.message?.text) {
      return ctx.reply('Iltimos, PINFL\'ni matn sifatida kiriting:');
    }
    const result = pinflSchema.safeParse(ctx.message.text);
    if (!result.success) return reportInvalid(ctx, result);

    ctx.wizard.state.pinfl = result.data;
    await ctx.reply('Lavozimingizni kiriting:');
    return ctx.wizard.next();
  },

  // 5) lavozim -> selfie so'raladi
  async (ctx) => {
    if (!ctx.message?.text) {
      return ctx.reply('Iltimos, lavozimingizni matn sifatida kiriting:');
    }
    const result = positionSchema.safeParse(ctx.message.text);
    if (!result.success) return reportInvalid(ctx, result);

    ctx.wizard.state.position = result.data;
    await ctx.reply('Endi tekshirish uchun selfie rasmingizni yuboring:');
    return ctx.wizard.next();
  },

  // 6) selfie -> ro'yxatdan o'tishni yakunlash
  async (ctx) => {
    const photos = ctx.message?.photo;
    if (!photos || photos.length === 0) {
      return ctx.reply('Iltimos, selfie rasmingizni surat (photo) sifatida yuboring:');
    }

    // Eng yuqori sifatli variant ro'yxat oxirida keladi.
    const bestPhoto = photos[photos.length - 1];
    ctx.wizard.state.photoFileId = bestPhoto.file_id;

    return finishRegistration(ctx);
  }
);

async function finishRegistration(ctx) {
  const state = ctx.wizard.state;
  // Ochiq PINFL faqat shu funksiya doirasida, ishlatilgach tozalanadi
  // (JS satrlari o'zgarmas bo'lgani uchun bu "eng yaxshi urinish" —
  // haqiqiy xotira tozalash uchun emas, balki qiymatning keyingi
  // kodda tasodifan qayta ishlatilishining oldini olish uchun).
  let pinflPlain = state.pinfl;

  try {
    const pinflHash = hashPinflForLookup(pinflPlain);
    const existing = await User.findOne({ pinflHash }).select('_id').lean();

    if (existing) {
      await AuditLog.create({
        actorType: 'system',
        actorId: String(ctx.from.id),
        action: 'duplicate_pinfl_attempt',
        targetId: String(existing._id),
        details: { attemptedByTelegramId: ctx.from.id },
      });
      await ctx.reply(
        '⚠️ Bu ma\'lumotlar bilan hisob allaqachon mavjud. Agar bu xato deb ' +
          'hisoblasangiz, administratorga murojaat qiling.'
      );
      return;
    }

    const maskedPinfl = maskPinfl(pinflPlain);
    const pinflEncrypted = encryptPinfl(pinflPlain);

    const user = await User.create({
      telegramId: ctx.from.id,
      firstName: state.firstName,
      lastName: state.lastName,
      phone: state.phone,
      pinflEncrypted,
      pinflHash,
      position: state.position,
      photoFileId: state.photoFileId,
      status: 'pending',
    });

    await ctx.reply('Ma\'lumotlaringiz yuborildi ⏳');
    await notifyAdminsOfNewRegistration(ctx.telegram, user, maskedPinfl);
  } catch (err) {
    if (err?.code === 11000) {
      // pinflHash unique indeksi — ilova darajasidagi tekshiruv
      // o'tkazib yuborgan (masalan parallel so'rov) holatni ushlaydi.
      await ctx.reply(
        '⚠️ Bu ma\'lumotlar bilan hisob allaqachon mavjud. Agar bu xato deb ' +
          'hisoblasangiz, administratorga murojaat qiling.'
      );
    } else {
      console.error('[BOT] Ro\'yxatdan o\'tishda xato:', err);
      await ctx.reply('Kechirasiz, xatolik yuz berdi. Birozdan so\'ng qayta urinib ko\'ring.');
    }
  } finally {
    pinflPlain = null;
    delete ctx.wizard.state.pinfl;
  }

  return ctx.scene.leave();
}

module.exports = registrationWizard;
