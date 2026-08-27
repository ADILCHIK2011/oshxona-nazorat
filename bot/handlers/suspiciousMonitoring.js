const { SuspiciousAttempt, CashierStation, User } = require('../../models');
const { formatDateTime } = require('../../lib/time');
const adminOnly = require('../middleware/adminOnly');
const { SUSPICIOUS_BUTTON_TEXT } = require('../keyboards');

const REASON_LABELS = {
  not_found: 'topilmadi',
  already_used: 'allaqachon ishlatilgan',
  expired: 'muddati o\'tgan',
  unknown: 'noma\'lum',
};

async function listSuspicious(ctx) {
  const attempts = await SuspiciousAttempt.find({}).sort({ timestamp: -1 }).limit(20).lean();

  if (attempts.length === 0) {
    return ctx.reply('✅ Shubhali urinishlar qayd etilmagan.');
  }

  const stationIds = [...new Set(attempts.map((a) => a.stationId).filter(Boolean).map(String))];
  const userIds = [...new Set(attempts.map((a) => a.userId).filter(Boolean).map(String))];

  const [stations, users] = await Promise.all([
    CashierStation.find({ _id: { $in: stationIds } }).select('name').lean(),
    User.find({ _id: { $in: userIds } }).select('firstName lastName').lean(),
  ]);
  const stationMap = new Map(stations.map((s) => [String(s._id), s.name]));
  const userMap = new Map(users.map((u) => [String(u._id), `${u.firstName} ${u.lastName}`]));

  const lines = attempts.map((a) => {
    const time = formatDateTime(a.timestamp);
    const reason = REASON_LABELS[a.reason] || a.reason;
    const station = a.stationId ? stationMap.get(String(a.stationId)) || '?' : '-';
    const user = a.userId ? userMap.get(String(a.userId)) || '?' : '-';
    return `${time} | ${reason} | kassa: ${station} | foydalanuvchi: ${user}`;
  });

  await ctx.reply(`🔎 So'nggi shubhali urinishlar (oxirgi ${attempts.length} ta):\n\n${lines.join('\n')}`);
}

function registerSuspiciousMonitoring(bot) {
  bot.hears(SUSPICIOUS_BUTTON_TEXT, adminOnly, listSuspicious);
}

module.exports = registerSuspiciousMonitoring;
