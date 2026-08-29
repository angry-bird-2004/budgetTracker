const IncomeEnvelope = require('../models/IncomeEnvelope');
const Transaction = require('../models/Transaction');
const { taxAmountExpr } = require('../utils/taxAmountExpr');
const { recordDeletion } = require('../utils/tombstone');
const { isDuplicateKey, findExistingByClientId, normalizeClientId } = require('../utils/clientId');

const getIncomeEnvelopes = async (req, res) => {
  try {
    const [stats, incomeEnvelopes] = await Promise.all([
      Transaction.aggregate([
        {
          $match: {
            userId: req.user._id,
            incomeSource: { $ne: null },
            type: { $in: ['expense', 'income'] },
          },
        },
        {
          $group: {
            _id: '$incomeSource',
            consumed: {
              $sum: {
                $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0],
              },
            },
            income: {
              $sum: {
                $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0],
              },
            },
            tax: {
              $sum: {
                $cond: [{ $eq: ['$type', 'expense'] }, taxAmountExpr, 0],
              },
            },
          },
        },
      ]),
      IncomeEnvelope.find({ userId: req.user._id })
        .select('name allocatedAmount')
        .lean(),
    ]);

    const statsBySource = new Map(
      stats.map((stat) => [String(stat._id), stat]),
    );

    const result = incomeEnvelopes.map((env) => {
      const stat = statsBySource.get(String(env._id));
      const consumed = stat?.consumed || 0;
      const income = stat?.income || 0;
      return {
        ...env,
        consumed,
        tax: stat?.tax || 0,
        currentBalance: (env.allocatedAmount || 0) + income - consumed,
      };
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createIncomeEnvelope = async (req, res) => {
  try {
    const { name, allocatedAmount } = req.body;
    const clientId = normalizeClientId(req.body.clientId);
    if (clientId) {
      const existing = await findExistingByClientId(IncomeEnvelope, req.user._id, clientId);
      if (existing) return res.status(200).json(existing);
    }
    const incomeEnvelope = await IncomeEnvelope.create({
      userId: req.user._id,
      name,
      allocatedAmount,
      ...(clientId ? { clientId } : {}),
    });
    res.status(201).json(incomeEnvelope);
  } catch (error) {
    if (isDuplicateKey(error)) {
      const existing = await findExistingByClientId(
        IncomeEnvelope,
        req.user._id,
        normalizeClientId(req.body.clientId),
      );
      if (existing) return res.status(200).json(existing);
    }
    res.status(400).json({ message: error.message });
  }
};

const updateIncomeEnvelope = async (req, res) => {
  try {
    const incomeEnvelope = await IncomeEnvelope.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!incomeEnvelope) {
      return res.status(404).json({ message: 'Income envelope not found' });
    }

    incomeEnvelope.name = req.body.name || incomeEnvelope.name;
    incomeEnvelope.allocatedAmount =
      req.body.allocatedAmount !== undefined
        ? req.body.allocatedAmount
        : incomeEnvelope.allocatedAmount;

    const updated = await incomeEnvelope.save();
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteIncomeEnvelope = async (req, res) => {
  try {
    const incomeEnvelope = await IncomeEnvelope.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!incomeEnvelope) {
      return res.status(404).json({ message: 'Income envelope not found' });
    }
    await recordDeletion(req.user._id, 'incomeEnvelope', incomeEnvelope._id);
    res.status(200).json({ message: 'Income envelope deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getIncomeEnvelopes,
  createIncomeEnvelope,
  updateIncomeEnvelope,
  deleteIncomeEnvelope,
};
