const mongoose = require('mongoose');

const MIN_TRANSACTION_PAGE_SIZE = 1;
const MAX_TRANSACTION_PAGE_SIZE = 100;
const DEFAULT_TRANSACTION_PAGE_SIZE = 50;

const settingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  transactionPageSize: {
    type: Number,
    default: DEFAULT_TRANSACTION_PAGE_SIZE,
    min: MIN_TRANSACTION_PAGE_SIZE,
    max: MAX_TRANSACTION_PAGE_SIZE,
  },
}, { timestamps: true });

const Setting = mongoose.model('Setting', settingSchema);

Setting.MIN_TRANSACTION_PAGE_SIZE = MIN_TRANSACTION_PAGE_SIZE;
Setting.MAX_TRANSACTION_PAGE_SIZE = MAX_TRANSACTION_PAGE_SIZE;
Setting.DEFAULT_TRANSACTION_PAGE_SIZE = DEFAULT_TRANSACTION_PAGE_SIZE;

module.exports = Setting;
