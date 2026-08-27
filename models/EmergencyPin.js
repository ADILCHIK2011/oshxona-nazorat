const { Schema, model } = require('mongoose');

const emergencyPinSchema = new Schema(
  {
    // PIN ham ochiq saqlanmaydi — bcryptjs bilan xashlanadi.
    pinHash: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    createdByAdminId: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
    usedAt: { type: Date, default: null },
  },
  { timestamps: false }
);

module.exports = model('EmergencyPin', emergencyPinSchema);
