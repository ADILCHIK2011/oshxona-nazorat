const { Schema, model } = require('mongoose');

const entryLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    qrCode: { type: String, required: true },
    // Favqulodda PIN orqali kirish mahal vaqtidan tashqarida ham
    // (admin qaroriga ko'ra) mumkin — shuning uchun majburiy emas.
    mealWindowId: { type: Schema.Types.ObjectId, ref: 'MealWindow', default: null },
    timestamp: { type: Date, default: Date.now, index: true },
    stationId: { type: Schema.Types.ObjectId, ref: 'CashierStation', required: true },
    method: { type: String, enum: ['qr', 'emergency_pin'], required: true },
  },
  { timestamps: false }
);

module.exports = model('EntryLog', entryLogSchema);
