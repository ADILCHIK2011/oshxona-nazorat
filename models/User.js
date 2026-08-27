const { Schema, model } = require('mongoose');

const dailyUsageSchema = new Schema(
  {
    date: { type: String, required: true }, // "YYYY-MM-DD"
    mealWindowIds: [{ type: Schema.Types.ObjectId, ref: 'MealWindow' }],
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    telegramId: { type: Number, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: { type: String, required: true },

    // PINFL ochiq matn holida HECH QACHON saqlanmaydi.
    pinflEncrypted: { type: String, required: true },
    pinflHash: { type: String, required: true, unique: true, index: true },

    position: { type: String, required: true },

    // Selfie rasm o'zida saqlanmaydi — faqat Telegram file_id.
    photoFileId: { type: String, required: true },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    registeredAt: { type: Date, default: Date.now },
    approvedAt: { type: Date, default: null },
    isBlocked: { type: Boolean, default: false },
    trustedSince: { type: Date, default: null },

    dailyUsage: { type: [dailyUsageSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = model('User', userSchema);
