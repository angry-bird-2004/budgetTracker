const Setting = require('../models/Setting');

const {
  MIN_TRANSACTION_PAGE_SIZE,
  MAX_TRANSACTION_PAGE_SIZE,
  DEFAULT_TRANSACTION_PAGE_SIZE,
} = Setting;

const toPublicSettings = (doc) => ({
  transactionPageSize: doc?.transactionPageSize ?? DEFAULT_TRANSACTION_PAGE_SIZE,
});

const normalizeTransactionPageSize = (value) => {
  const parsed = parseInt(value, 10);
  if (!Number.isFinite(parsed)) return null;
  return Math.min(
    Math.max(parsed, MIN_TRANSACTION_PAGE_SIZE),
    MAX_TRANSACTION_PAGE_SIZE,
  );
};

const getSettings = async (req, res) => {
  try {
    const setting = await Setting.findOne({ userId: req.user._id }).lean();
    res.status(200).json(toPublicSettings(setting));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateSettings = async (req, res) => {
  try {
    const updates = {};

    if (req.body.transactionPageSize !== undefined) {
      const size = normalizeTransactionPageSize(req.body.transactionPageSize);
      if (size === null) {
        return res.status(400).json({
          message: `transactionPageSize must be a number between ${MIN_TRANSACTION_PAGE_SIZE} and ${MAX_TRANSACTION_PAGE_SIZE}`,
        });
      }
      updates.transactionPageSize = size;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No valid settings provided' });
    }

    const setting = await Setting.findOneAndUpdate(
      { userId: req.user._id },
      { $set: { userId: req.user._id, ...updates } },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true },
    ).lean();

    res.status(200).json(toPublicSettings(setting));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getSettings, updateSettings };
