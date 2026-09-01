const Envelope = require('../models/Envelope');
const IncomeEnvelope = require('../models/IncomeEnvelope');
const Transaction = require('../models/Transaction');
const Transfer = require('../models/Transfer');
const { getPeriodRange } = require('../utils/periodRange');

const getConsumed = async (userId, type, envelopeId) => {
  const match =
    type === 'income'
      ? { userId, incomeSource: envelopeId, type: { $in: ['expense', 'income'] } }
      : { userId, envelopeId, type: { $in: ['expense', 'income'] } };

  const stats = await Transaction.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        net: {
          $sum: {
            $cond: [
              { $eq: ['$type', 'expense'] },
              '$amount',
              { $multiply: ['$amount', -1] },
            ],
          },
        },
      },
    },
  ]);

  return stats[0]?.net || 0;
};

const getTransferHistory = async (req, res) => {
  try {
    const { period } = req.query;
    const range = getPeriodRange({ period, tzOffset: req.query.tzOffset });

    const query = { userId: req.user._id };
    if (range) {
      query.date = { $gte: range.start, $lte: range.end };
    }

    const transfers = await Transfer.find(query)
      .sort({ date: -1, createdAt: -1 })
      .lean();

    res.status(200).json(transfers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getEnvelopes = async (req, res) => {
  try {
    const [stats, envelopes] = await Promise.all([
      Transaction.aggregate([
        {
          $match: {
            userId: req.user._id,
            envelopeId: { $ne: null },
            type: { $in: ['expense', 'income'] },
          },
        },
        {
          $group: {
            _id: '$envelopeId',
            consumed: {
              $sum: {
                $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0],
              },
            },
            credited: {
              $sum: {
                $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0],
              },
            },
          },
        },
      ]),
      Envelope.find({ userId: req.user._id }).lean(),
    ]);

    const statsByEnvelope = new Map(
      stats.map((stat) => [String(stat._id), stat]),
    );

    const result = envelopes.map((env) => {
      const stat = statsByEnvelope.get(String(env._id));
      const consumed = stat?.consumed || 0;
      const credited = stat?.credited || 0;
      return {
        ...env,
        consumed,
        currentBalance: (env.allocatedAmount || 0) - consumed + credited,
      };
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createEnvelope = async (req, res) => {
  try {
    const { name, allocatedAmount } = req.body;
    const envelope = await Envelope.create({ userId: req.user._id, name, allocatedAmount });
    res.status(201).json(envelope);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateEnvelope = async (req, res) => {
  try {
    const update = {};
    if (req.body.name !== undefined) update.name = req.body.name;
    if (req.body.allocatedAmount !== undefined) {
      update.allocatedAmount = req.body.allocatedAmount;
    }

    const envelope = await Envelope.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: update },
      { new: true }
    ).lean();
    if (!envelope) return res.status(404).json({ message: 'Envelope not found' });
    res.status(200).json(envelope);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const transferFunds = async (req, res) => {
  try {
    const { type = 'expense', fromId, toId, amount } = req.body;
    const parsedAmount = Number(amount);

    if (type !== 'income' && type !== 'expense') {
      return res.status(400).json({ message: 'Transfer type must be income or expense' });
    }
    if (!fromId || !toId) {
      return res.status(400).json({ message: 'Source and destination envelopes are required' });
    }
    if (String(fromId) === String(toId)) {
      return res.status(400).json({ message: 'Source and destination envelopes cannot be the same' });
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ message: 'Transfer amount must be a positive number' });
    }

    const Model = type === 'income' ? IncomeEnvelope : Envelope;
    const [source, destination] = await Promise.all([
      Model.findOne({ _id: fromId, userId: req.user._id }).lean(),
      Model.findOne({ _id: toId, userId: req.user._id }).lean(),
    ]);

    if (!source || !destination) {
      return res.status(404).json({ message: 'Envelope not found' });
    }

    const consumed = await getConsumed(
      req.user._id,
      type === 'income' ? 'income' : 'expense',
      source._id,
    );
    const remaining = Number(source.allocatedAmount || 0) - consumed;
    if (parsedAmount > remaining) {
      return res.status(400).json({ message: 'Transfer exceeds remaining funds in the source envelope' });
    }

    const minAllocated = consumed + parsedAmount;
    const updatedSource = await Model.findOneAndUpdate(
      {
        _id: fromId,
        userId: req.user._id,
        allocatedAmount: { $gte: minAllocated },
      },
      { $inc: { allocatedAmount: -parsedAmount } },
      { new: true },
    );

    if (!updatedSource) {
      return res.status(409).json({
        message: 'Transfer could not be completed because the source envelope changed. Please retry.',
      });
    }

    try {
      const updatedDestination = await Model.findOneAndUpdate(
        { _id: toId, userId: req.user._id },
        { $inc: { allocatedAmount: parsedAmount } },
        { new: true },
      );

      if (!updatedDestination) {
        await Model.findOneAndUpdate(
          { _id: fromId, userId: req.user._id },
          { $inc: { allocatedAmount: parsedAmount } },
        );
        return res.status(404).json({ message: 'Envelope not found' });
      }

      const transferRecord = await Transfer.create({
        userId: req.user._id,
        type,
        fromEnvelopeId: source._id,
        toEnvelopeId: destination._id,
        fromName: source.name,
        toName: destination.name,
        amount: parsedAmount,
        purpose: `${source.name} → ${destination.name}`,
        date: new Date(),
      });

      return res.status(200).json({
        from: updatedSource,
        to: updatedDestination,
        transfer: transferRecord,
      });
    } catch (error) {
      await Model.findOneAndUpdate(
        { _id: fromId, userId: req.user._id },
        { $inc: { allocatedAmount: parsedAmount } },
      );
      throw error;
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteTransfer = async (req, res) => {
  try {
    const transfer = await Transfer.findOne({ _id: req.params.id, userId: req.user._id }).lean();
    if (!transfer) {
      return res.status(404).json({ message: 'Transfer not found' });
    }

    const Model = transfer.type === 'income' ? IncomeEnvelope : Envelope;

    const source = await Model.findOne({ _id: transfer.fromEnvelopeId, userId: req.user._id });
    const destination = await Model.findOne({ _id: transfer.toEnvelopeId, userId: req.user._id });

    if (source) {
      await Model.findOneAndUpdate(
        { _id: transfer.fromEnvelopeId, userId: req.user._id },
        { $inc: { allocatedAmount: transfer.amount } },
        { new: true },
      );
    }

    if (destination) {
      await Model.findOneAndUpdate(
        { _id: transfer.toEnvelopeId, userId: req.user._id },
        { $inc: { allocatedAmount: -transfer.amount } },
        { new: true },
      );
    }

    await Transfer.deleteOne({ _id: req.params.id, userId: req.user._id });
    res.status(200).json({ message: 'Transfer deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateTransferFunds = async (req, res) => {
  try {
    const transfer = await Transfer.findOne({ _id: req.params.id, userId: req.user._id });
    if (!transfer) {
      return res.status(404).json({ message: 'Transfer not found' });
    }

    const oldType = transfer.type;
    const oldFromId = String(transfer.fromEnvelopeId);
    const oldToId = String(transfer.toEnvelopeId);
    const oldAmount = Number(transfer.amount) || 0;

    const { type = oldType, fromId = oldFromId, toId = oldToId, amount } = req.body;
    const parsedAmount = Number(amount);
    const newFromId = String(fromId);
    const newToId = String(toId);

    if (!newFromId || !newToId) {
      return res.status(400).json({ message: 'Source and destination envelopes are required' });
    }
    if (newFromId === newToId) {
      return res.status(400).json({ message: 'Source and destination envelopes cannot be the same' });
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ message: 'Transfer amount must be a positive number' });
    }

    const newType = type || oldType;
    const oldModel = oldType === 'income' ? IncomeEnvelope : Envelope;
    const newModel = newType === 'income' ? IncomeEnvelope : Envelope;

    const resolveDocument = async (docOrQuery) => {
      if (!docOrQuery) return null;
      if (typeof docOrQuery.lean === 'function') {
        return await docOrQuery.lean();
      }
      return docOrQuery;
    };

    const [sourceQuery, destinationQuery, oldSourceQuery, oldDestinationQuery] = await Promise.all([
      newModel.findOne({ _id: newFromId, userId: req.user._id }),
      newModel.findOne({ _id: newToId, userId: req.user._id }),
      oldModel.findOne({ _id: oldFromId, userId: req.user._id }),
      oldModel.findOne({ _id: oldToId, userId: req.user._id }),
    ]);

    const [source, destination, oldSource, oldDestination] = await Promise.all([
      resolveDocument(sourceQuery),
      resolveDocument(destinationQuery),
      resolveDocument(oldSourceQuery),
      resolveDocument(oldDestinationQuery),
    ]);

    if (!source || !destination) {
      return res.status(404).json({ message: 'Envelope not found' });
    }

    const isExactNoOp =
      String(oldType) === String(newType) &&
      oldFromId === newFromId &&
      oldToId === newToId &&
      oldAmount === parsedAmount;

    if (isExactNoOp) {
      transfer.type = newType;
      transfer.fromEnvelopeId = newFromId;
      transfer.toEnvelopeId = newToId;
      transfer.fromName = source?.name || transfer.fromName || '';
      transfer.toName = destination?.name || transfer.toName || '';
      transfer.amount = parsedAmount;
      transfer.purpose = req.body.purpose || `${transfer.fromName || 'Envelope'} → ${transfer.toName || 'Destination'}`;
      transfer.date = req.body.date ? new Date(req.body.date) : new Date();
      await transfer.save();

      return res.status(200).json({
        message: 'Transfer unchanged',
        transfer,
      });
    }

    const applyNetChanges = new Map();
    const addNetChange = (envId, delta) => {
      if (!envId || Number(delta) === 0) return;
      const key = String(envId);
      applyNetChanges.set(key, (applyNetChanges.get(key) || 0) + Number(delta));
    };

    const sameEnvelopes = oldFromId === newFromId && oldToId === newToId && String(oldType) === String(newType);

    if (sameEnvelopes) {
      const difference = parsedAmount - oldAmount;
      addNetChange(newFromId, -difference);
      addNetChange(newToId, difference);
    } else {
      addNetChange(oldFromId, oldAmount);
      addNetChange(oldToId, -oldAmount);
      addNetChange(newFromId, -parsedAmount);
      addNetChange(newToId, parsedAmount);
    }

    for (const [envId, delta] of applyNetChanges.entries()) {
      if (Number(delta) === 0) continue;

      const envModel =
        String(envId) === oldFromId || String(envId) === oldToId
          ? oldModel
          : newModel;

      const env = await envModel.findOne({ _id: envId, userId: req.user._id }).lean();
      if (!env) {
        return res.status(404).json({ message: 'Envelope not found' });
      }
      if (delta < 0 && Number(env.allocatedAmount || 0) + delta < 0) {
        return res.status(400).json({
          message: 'Transfer exceeds the available balance for one of the envelopes.',
        });
      }
    }

    const updateOperations = [];
    for (const [envId, delta] of applyNetChanges.entries()) {
      if (Number(delta) === 0) continue;

      const envModel =
        String(envId) === oldFromId || String(envId) === oldToId
          ? oldModel
          : newModel;

      updateOperations.push(
        envModel.findOneAndUpdate(
          { _id: envId, userId: req.user._id },
          { $inc: { allocatedAmount: delta } },
          { new: true },
        ),
      );
    }

    const updatedEnvelopes = await Promise.all(updateOperations);
    const updatedFrom = updatedEnvelopes.find((env) => env && String(env._id) === newFromId);
    const updatedTo = updatedEnvelopes.find((env) => env && String(env._id) === newToId);

    transfer.type = newType;
    transfer.fromEnvelopeId = newFromId;
    transfer.toEnvelopeId = newToId;
    transfer.fromName = source.name;
    transfer.toName = destination.name;
    transfer.amount = parsedAmount;
    transfer.purpose = req.body.purpose || `${source.name} → ${destination.name}`;
    transfer.date = req.body.date ? new Date(req.body.date) : new Date();
    await transfer.save();

    res.status(200).json({
      message: 'Transfer updated',
      transfer,
      from: updatedFrom,
      to: updatedTo,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteEnvelope = async (req, res) => {
  try {
    const envelope = await Envelope.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!envelope) return res.status(404).json({ message: 'Envelope not found' });
    res.status(200).json({ message: 'Envelope deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTransferHistory,
  getEnvelopes,
  createEnvelope,
  updateEnvelope,
  deleteEnvelope,
  transferFunds,
  deleteTransfer,
  updateTransferFunds,
};