const Envelope = require('../models/Envelope');
const IncomeEnvelope = require('../models/IncomeEnvelope');
const Transaction = require('../models/Transaction');
const Setting = require('../models/Setting');
const DeletedRecord = require('../models/DeletedRecord');

const {
  DEFAULT_TRANSACTION_PAGE_SIZE,
} = Setting;

const parseSince = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const sinceFilter = (since, dateField = 'updatedAt') => {
  if (!since) return {};
  return {
    $or: [
      { [dateField]: { $gte: since } },
      { [dateField]: { $exists: false } },
    ],
  };
};

const getSync = async (req, res) => {
  try {
    const since = parseSince(req.query.updatedSince);
    const userFilter = { userId: req.user._id };

    const [envelopes, incomeEnvelopes, transactions, settings, deleted] = await Promise.all([
      Envelope.find({ ...userFilter, ...sinceFilter(since) }).lean(),
      IncomeEnvelope.find({ ...userFilter, ...sinceFilter(since) }).lean(),
      Transaction.find({ ...userFilter, ...sinceFilter(since) })
        .populate('envelopeId', 'name clientId')
        .populate('incomeSource', 'name allocatedAmount clientId')
        .lean(),
      Setting.findOne(userFilter).lean(),
      DeletedRecord.find({
        ...userFilter,
        ...(since ? { deletedAt: { $gte: since } } : {}),
      }).lean(),
    ]);

    const deletedIds = {
      envelopes: [],
      incomeEnvelopes: [],
      transactions: [],
    };

    deleted.forEach((row) => {
      if (row.entity === 'envelope') deletedIds.envelopes.push(row.recordId);
      if (row.entity === 'incomeEnvelope') deletedIds.incomeEnvelopes.push(row.recordId);
      if (row.entity === 'transaction') deletedIds.transactions.push(row.recordId);
    });

    res.status(200).json({
      serverTime: new Date().toISOString(),
      envelopes,
      incomeEnvelopes,
      transactions,
      settings: {
        transactionPageSize: settings?.transactionPageSize ?? DEFAULT_TRANSACTION_PAGE_SIZE,
      },
      deletedIds,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getSync };
