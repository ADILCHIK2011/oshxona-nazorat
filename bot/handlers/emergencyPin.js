const adminOnly = require('../middleware/adminOnly');
const { PIN_BUTTON_TEXT } = require('../keyboards');

function registerEmergencyPin(bot) {
  bot.hears(PIN_BUTTON_TEXT, adminOnly, (ctx) => ctx.scene.enter('issuePin'));
}

module.exports = registerEmergencyPin;
