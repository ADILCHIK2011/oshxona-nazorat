const { BOT_TOKEN } = require('../config/env');

const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;
const FILE_BASE = `https://api.telegram.org/file/bot${BOT_TOKEN}`;

// Ushbu modul Telegram Bot API bilan xom (Telegraf'siz) ishlaydi —
// api/ jarayoni bot/ jarayonidan alohida ishga tushirilishi mumkin,
// shuning uchun ikkalasi ham faqat BOT_TOKEN orqali, mustaqil holda
// Telegramga murojaat qiladi.

async function sendMessage(chatId, text) {
  const res = await fetch(`${API_BASE}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  const data = await res.json();
  if (!data.ok) {
    throw new Error(`Telegram sendMessage xato: ${data.description}`);
  }
  return data.result;
}

async function getFilePath(fileId) {
  const res = await fetch(`${API_BASE}/getFile?file_id=${encodeURIComponent(fileId)}`);
  const data = await res.json();
  if (!data.ok) {
    throw new Error(`Telegram getFile xato: ${data.description}`);
  }
  return data.result.file_path;
}

async function downloadFile(filePath) {
  const res = await fetch(`${FILE_BASE}/${filePath}`);
  if (!res.ok) {
    throw new Error(`Telegram fayl yuklab olinmadi: ${res.status}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  const contentType = res.headers.get('content-type') || 'application/octet-stream';
  return { buffer: Buffer.from(arrayBuffer), contentType };
}

module.exports = { sendMessage, getFilePath, downloadFile };
