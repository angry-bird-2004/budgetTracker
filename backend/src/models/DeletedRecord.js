const mongoose = require('mongoose');

const deletedRecordSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  entity: {
    type: String,
    enum: ['envelope', 'incomeEnvelope', 'transaction'],
    required: true,
  },
  recordId: { type: String, required: true },
  deletedAt: { type: Date, default: Date.now },
});

deletedRecordSchema.index({ userId: 1, deletedAt: -1 });
deletedRecordSchema.index({ userId: 1, entity: 1, recordId: 1 });

module.exports = mongoose.model('DeletedRecord', deletedRecordSchema);
