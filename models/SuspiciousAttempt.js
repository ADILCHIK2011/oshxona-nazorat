const { Schema, model } = require('mongoose');

const suspiciousAttemptSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    code: { type: String, default: null },
    reason: { type: String, required: true },
    timestamp: { type: Date, default: Date.now, index: true },
    stationId: { type: Schema.Types.ObjectId, ref: 'CashierStation', default: null },
  },
  { timestamps: false }
);

module.exports = model('SuspiciousAttempt', suspiciousAttemptSchema);
