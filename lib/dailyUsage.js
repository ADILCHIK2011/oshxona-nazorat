const { User } = require('../models');

/**
 * Foydalanuvchining kunlik QR limitini BITTA atomik MongoDB
 * operatsiyasida tekshiradi va yozadi (aggregation-pipeline update):
 * - shu mahal (mealWindowId) bugun ALLAQACHON ishlatilgan bo'lsa,
 * - YOKI bugungi ishlatilgan mahallar soni dailyLimit'ga yetgan bo'lsa,
 * hujjat mos kelmaydi va `null` qaytariladi (rad etildi).
 *
 * Ikki parallel so'rov bir vaqtda kelsa ham, MongoDB bitta hujjatga
 * bir vaqtning o'zida faqat bitta findOneAndUpdate'ni bajaradi —
 * shuning uchun limitdan oshib ketish mumkin emas (race condition
 * yo'q).
 */
async function recordDailyUsage(userId, mealWindowId, today, dailyLimit) {
  const filter = {
    _id: userId,
    $expr: {
      $let: {
        vars: {
          todayEntry: {
            $first: {
              $filter: {
                input: { $ifNull: ['$dailyUsage', []] },
                cond: { $eq: ['$$this.date', today] },
              },
            },
          },
        },
        in: {
          $and: [
            {
              $not: {
                $in: [mealWindowId, { $ifNull: ['$$todayEntry.mealWindowIds', []] }],
              },
            },
            {
              $lt: [{ $size: { $ifNull: ['$$todayEntry.mealWindowIds', []] } }, dailyLimit],
            },
          ],
        },
      },
    },
  };

  const update = [
    {
      $set: {
        dailyUsage: {
          $cond: [
            { $in: [today, { $ifNull: ['$dailyUsage.date', []] }] },
            {
              $map: {
                input: '$dailyUsage',
                as: 'd',
                in: {
                  $cond: [
                    { $eq: ['$$d.date', today] },
                    {
                      date: '$$d.date',
                      mealWindowIds: { $concatArrays: ['$$d.mealWindowIds', [mealWindowId]] },
                    },
                    '$$d',
                  ],
                },
              },
            },
            {
              $concatArrays: [
                { $ifNull: ['$dailyUsage', []] },
                [{ date: today, mealWindowIds: [mealWindowId] }],
              ],
            },
          ],
        },
      },
    },
  ];

  return User.findOneAndUpdate(filter, update, { new: true });
}

module.exports = { recordDailyUsage };
