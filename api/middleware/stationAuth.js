const bcrypt = require('bcryptjs');
const { CashierStation } = require('../../models');

// Kassir stansiyasi tokeni Bearer sarlavhasida keladi. Har bir faol
// stansiyaning bcrypt xashi bilan solishtiriladi (indekslanadigan
// oddiy token emas — bcrypt bilan solishtirish uchun boshqa yo'l
// yo'q). Mos kelmasa 401, boshqa hech narsa bajarilmaydi (least
// privilege: bu token faqat shu ikkita endpoint uchun, admin/bot
// huquqlariga aloqasi yo'q).
async function stationAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const match = /^Bearer\s+(.+)$/.exec(header);
  if (!match) {
    return res.status(401).json({ ok: false, message: 'Avtorizatsiya talab qilinadi' });
  }
  // Mijoz tomonida nusxalashda tasodifan qo'shilib qolgan bo'shliq/
  // qator ko'chirish belgilariga qarshi himoya qatlami — token hech
  // qachon o'z ichida bo'shliq bo'lmagan hex qator.
  const token = match[1].replace(/\s+/g, '');

  const stations = await CashierStation.find({ isActive: true }).select('name tokenHash').lean();

  for (const station of stations) {
    // eslint-disable-next-line no-await-in-loop
    const matches = await bcrypt.compare(token, station.tokenHash);
    if (matches) {
      req.station = { id: station._id, name: station.name };
      return next();
    }
  }

  return res.status(401).json({ ok: false, message: 'Token noto\'g\'ri' });
}

module.exports = stationAuth;
