const { Telegraf, Scenes, session } = require('telegraf');
const { BOT_TOKEN } = require('../config/env');
const { connectDB } = require('../config/db');
const rateLimit = require('./middleware/rateLimit');
const registrationWizard = require('./scenes/registration');
const addCashierStationWizard = require('./scenes/addCashierStation');
const blockUserWizard = require('./scenes/blockUser');
const unblockUserWizard = require('./scenes/unblockUser');
const issuePinWizard = require('./scenes/issuePin');
const startHandler = require('./handlers/start');
const qrRequestHandler = require('./handlers/qrRequest');
const registerAdminActions = require('./handlers/adminActions');
const registerCashierManagement = require('./handlers/cashierManagement');
const registerSuspiciousMonitoring = require('./handlers/suspiciousMonitoring');
const registerUserModeration = require('./handlers/userModeration');
const registerEmergencyPin = require('./handlers/emergencyPin');
const registerPinflAudit = require('./handlers/pinflAudit');
const { QR_BUTTON_TEXT } = require('./keyboards');

const bot = new Telegraf(BOT_TOKEN);
const stage = new Scenes.Stage([
  registrationWizard,
  addCashierStationWizard,
  blockUserWizard,
  unblockUserWizard,
  issuePinWizard,
]);

// MUHIM: session() standart holatda jarayon xotirasida (in-memory)
// ishlaydi — bot qayta ishga tushsa, ro'yxatdan o'tish jarayoni
// yarim yo'lda bo'lgan foydalanuvchilar qaytadan boshlashi kerak
// bo'ladi. Ko'lam kattalashsa, buni persistent session'ga
// (masalan Redis) ko'chirish kerak bo'ladi.
bot.use((ctx, next) => {
  console.log(`[BOT] Yangilanish qabul qilindi: ${ctx.updateType}, from=${ctx.from?.id}`);
  return next();
});
bot.use(rateLimit());
bot.use(session());
bot.use(stage.middleware());

bot.start(startHandler);
bot.hears(QR_BUTTON_TEXT, qrRequestHandler);
registerAdminActions(bot);
registerCashierManagement(bot);
registerSuspiciousMonitoring(bot);
registerUserModeration(bot);
registerEmergencyPin(bot);
registerPinflAudit(bot);

bot.catch((err, ctx) => {
  console.error(`[BOT] Kutilmagan xato (update turi: ${ctx.updateType}):`, err);
});

async function launch() {
  await connectDB();
  // Telegraf'ning launch() promise'i polling davomida hech qachon
  // bajarilmaydi (uzluksiz tsikl) — shuning uchun "tayyor" logini
  // await'dan keyin emas, launch()ning ikkinchi argumenti (onLaunch
  // callback, getMe muvaffaqiyatli bo'lgach chaqiriladi) orqali beramiz.
  await bot.launch({}, () => {
    console.log(`[BOT] @${bot.botInfo.username} POLLING rejimida ishga tushdi.`);
  });
}

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

if (require.main === module) {
  launch().catch((err) => {
    console.error('[BOT] Ishga tushmadi:', err);
    process.exit(1);
  });
}

module.exports = { bot, launch };
