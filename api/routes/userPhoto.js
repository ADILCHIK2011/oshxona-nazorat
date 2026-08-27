const { User } = require('../../models');
const { getFilePath, downloadFile } = require('../../lib/telegramApi');

const OBJECT_ID_RE = /^[a-f0-9]{24}$/;

// Foydalanuvchi selfie'si HECH QACHON diskda/ochiq URL orqali
// saqlanmagan (faqat Telegram file_id) — shu sabab bu yerda har safar
// Telegram Bot API orqali real vaqtda olib, TOKEN talab qiluvchi
// (stationAuth) endpoint orqaligina uzatiladi.
async function userPhotoHandler(req, res) {
  const { userId } = req.params;
  if (!OBJECT_ID_RE.test(userId)) {
    return res.status(404).json({ ok: false, message: 'Topilmadi' });
  }

  const user = await User.findById(userId).select('photoFileId').lean();
  if (!user) {
    return res.status(404).json({ ok: false, message: 'Topilmadi' });
  }

  const filePath = await getFilePath(user.photoFileId);
  const { buffer, contentType } = await downloadFile(filePath);

  res.set('Content-Type', contentType);
  res.set('Cache-Control', 'no-store');
  return res.send(buffer);
}

module.exports = userPhotoHandler;
