const { Schema, model } = require('mongoose');

const auditLogSchema = new Schema(
  {
    actorType: { type: String, enum: ['admin', 'system'], required: true },
    actorId: { type: String, required: true },
    action: { type: String, required: true },
    targetId: { type: String, default: null },
    details: { type: Schema.Types.Mixed, default: null },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

// Audit yozuvlari o'chirilmaydi/tahrirlanmaydi — kod darajasida hech
// qanday update/remove yordamchi funksiya taqdim etilmaydi, faqat yozish.

module.exports = model('AuditLog', auditLogSchema);
