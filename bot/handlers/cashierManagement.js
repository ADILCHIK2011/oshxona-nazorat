const adminOnly = require('../middleware/adminOnly');
const { ADD_STATION_BUTTON_TEXT } = require('../keyboards');

function registerCashierManagement(bot) {
  // Bu tugma faqat admin klaviaturasida ko'rinadi, lekin matnni
  // qo'lda ham yuborish mumkin — shuning uchun yagona `adminOnly`
  // middleware bilan tekshiramiz (boshqa barcha admin-only
  // komandalar bilan bir xil naqsh).
  bot.hears(ADD_STATION_BUTTON_TEXT, adminOnly, (ctx) => ctx.scene.enter('addCashierStation'));
}

module.exports = registerCashierManagement;
