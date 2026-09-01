const mongoose = require('mongoose');

const transferSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['expense', 'income'], required: true },
    fromEnvelopeId: { type: mongoose.Schema.Types.ObjectId, required: true },
    toEnvelopeId: { type: mongoose.Schema.Types.ObjectId, required: true },
    fromName: { type: String, default: '' },
    toName: { type: String, default: '' },
    amount: { type: Number, required: true, min: 0 },
    purpose: { type: String, default: 'Envelope transfer' },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

transferSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('Transfer', transferSchema);
