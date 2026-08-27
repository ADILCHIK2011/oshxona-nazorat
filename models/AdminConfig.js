const { Schema, model } = require('mongoose');

// Singleton hujjat: har doim bitta yozuv bo'ladi (masalan _id: "singleton"
// bilan yaratiladi). Sozlamalarning aksariyati kodga hardcode
// qilinmaydi — admin bularni bot ichidan o'zgartiradi.
//
// ESLATMA: adminChatIds ATAYIN bu yerda YO'Q — u `config/admins.js`da
// qo'lda saqlanadi (sabab shu faylda izohlangan: haqiqiy admin texnik
// odam emas, bot ichidan boshqarishni talab qilmaydi).
const adminConfigSchema = new Schema(
  {
    _id: { type: String, default: 'singleton' },
    closedWeekdays: { type: [Number], default: [] }, // 0=Yakshanba ... 6=Shanba
    holidayDates: { type: [String], default: [] }, // "YYYY-MM-DD"
    dailyReportTime: { type: String, default: '20:00' },
    trustedStatusMonths: { type: Number, default: 3 },
    qrValiditySeconds: { type: Number, default: 60 },
    dailyQrLimit: { type: Number, default: 3 },
  },
  { timestamps: true, _id: false }
);

module.exports = model('AdminConfig', adminConfigSchema);
