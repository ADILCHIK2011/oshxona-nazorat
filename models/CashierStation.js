const { Schema, model } = require('mongoose');

const cashierStationSchema = new Schema(
  {
    name: { type: String, required: true },
    // Token o'zi faqat generatsiya qilingan paytda bir marta ko'rsatiladi,
    // bazada faqat uning bcryptjs xashi saqlanadi (least privilege:
    // bu token faqat skanerlash huquqiga ega, admin huquqlariga ega emas).
    tokenHash: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: false }
);

module.exports = model('CashierStation', cashierStationSchema);
