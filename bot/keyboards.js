const { Markup } = require('telegraf');

const QR_BUTTON_TEXT = '🍽 QR olish';
const ADD_STATION_BUTTON_TEXT = '➕ Kassa qo\'shish';
const SUSPICIOUS_BUTTON_TEXT = '🔎 Shubhali urinishlar';
const BLOCK_BUTTON_TEXT = '🚫 Bloklash';
const UNBLOCK_BUTTON_TEXT = '✅ Blokdan chiqarish';
const PIN_BUTTON_TEXT = '🆘 Favqulodda PIN';
const PINFL_CHECK_BUTTON_TEXT = '🔁 PINFL tekshir';

const mainMenuKeyboard = Markup.keyboard([[QR_BUTTON_TEXT]]).resize();

const adminMenuKeyboard = Markup.keyboard([
  [ADD_STATION_BUTTON_TEXT, SUSPICIOUS_BUTTON_TEXT],
  [BLOCK_BUTTON_TEXT, UNBLOCK_BUTTON_TEXT],
  [PIN_BUTTON_TEXT, PINFL_CHECK_BUTTON_TEXT],
]).resize();

module.exports = {
  QR_BUTTON_TEXT,
  ADD_STATION_BUTTON_TEXT,
  SUSPICIOUS_BUTTON_TEXT,
  BLOCK_BUTTON_TEXT,
  UNBLOCK_BUTTON_TEXT,
  PIN_BUTTON_TEXT,
  PINFL_CHECK_BUTTON_TEXT,
  mainMenuKeyboard,
  adminMenuKeyboard,
};
