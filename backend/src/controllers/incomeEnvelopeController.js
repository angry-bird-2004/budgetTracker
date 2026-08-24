const IncomeEnvelope = require('../models/IncomeEnvelope');
const Transaction = require('../models/Transaction');

const getIncomeEnvelopes = async (req, res) => {
  try {
    const [stats, incomeEnvelopes] = await Promise.all([
      Transaction.aggregate([
        { $match: { userId: req.user._id, type: 'expense', incomeSource: { $ne: null } } },
        { $group: { _id: '$incomeSource', consumed: { $sum: '$amount' } } },
      ]),
      IncomeEnvelope.find({ userId: req.user._id })
        .select('name allocatedAmount')
        .lean(),
    ]);

    const consumedBySource = new Map(
      stats.map((stat) => [String(stat._id), stat.consumed]),
    );

    const result = incomeEnvelopes.map((env) => {
      const consumed = consumedBySource.get(String(env._id)) || 0;
      return {
        ...env,
        consumed,
        currentBalance: (env.allocatedAmount || 0) - consumed,
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
    const incomeEnvelope = await IncomeEnvelope.create({
      userId: req.user._id,
      name,
      allocatedAmount,
    });
    res.status(201).json(incomeEnvelope);
  } catch (error) {
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