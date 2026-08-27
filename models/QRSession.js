const { Schema, model } = require('mongoose');

const qrSessionSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, index: true }, // crypto.randomUUID()
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    mealWindowId: { type: Schema.Types.ObjectId, ref: 'MealWindow', required: true },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ['active', 'used', 'expired'],
      default: 'active',
      index: true,
    },
    usedAt: { type: Date, default: null },
    scannedByStationId: { type: Schema.Types.ObjectId, ref: 'CashierStation', default: null },
  },
  { timestamps: false }
);

// MUHIM: bu kolleksiyada status yangilash (masalan active -> used)
// FAQAT atomik findOneAndUpdate orqali bajarilishi kerak — hech qachon
// find() bilan topib, keyin alohida save() qilish orqali emas. Aks
// holda parallel skanerlashda race condition yuzaga kelib, bitta QR
// ikki marta ishlatilishi mumkin.

module.exports = model('QRSession', qrSessionSchema);
