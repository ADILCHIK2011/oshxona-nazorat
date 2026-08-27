const adminOnly = require('../middleware/adminOnly');
const { BLOCK_BUTTON_TEXT, UNBLOCK_BUTTON_TEXT } = require('../keyboards');

function registerUserModeration(bot) {
  bot.hears(BLOCK_BUTTON_TEXT, adminOnly, (ctx) => ctx.scene.enter('blockUser'));
  bot.hears(UNBLOCK_BUTTON_TEXT, adminOnly, (ctx) => ctx.scene.enter('unblockUser'));
}

module.exports = registerUserModeration;
