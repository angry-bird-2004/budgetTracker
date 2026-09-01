const test = require('node:test');
const assert = require('node:assert/strict');

const Envelope = require('../models/Envelope');
const Transaction = require('../models/Transaction');
const Transfer = require('../models/Transfer');
const controller = require('../controllers/envelopeController');

const originalEnvelopeFindOne = Envelope.findOne;
const originalEnvelopeFindOneAndUpdate = Envelope.findOneAndUpdate;
const originalTransactionAggregate = Transaction.aggregate;
const originalTransferFindOne = Transfer.findOne;

const makeLeanDoc = (doc) => ({
  ...doc,
  lean: () => ({ ...doc }),
});

test('updateTransferFunds does not re-transfer when the edit is a no-op', async () => {
  const transfer = {
    _id: 't1',
    userId: 'u1',
    type: 'expense',
    fromEnvelopeId: 'e1',
    toEnvelopeId: 'e2',
    fromName: 'Food',
    toName: 'Bills',
    amount: 100,
    purpose: 'Food → Bills',
    date: new Date('2024-01-10T00:00:00.000Z'),
    save: async () => {},
  };

  Envelope.findOne = async ({ _id }) => {
    if (String(_id) === 'e1') {
      return {
        _id: 'e1',
        userId: 'u1',
        name: 'Food',
        allocatedAmount: 500,
        lean: async () => ({ _id: 'e1', userId: 'u1', name: 'Food', allocatedAmount: 500 }),
      };
    }
    if (String(_id) === 'e2') {
      return {
        _id: 'e2',
        userId: 'u1',
        name: 'Bills',
        allocatedAmount: 250,
        lean: async () => ({ _id: 'e2', userId: 'u1', name: 'Bills', allocatedAmount: 250 }),
      };
    }
    return null;
  };

  Envelope.findOneAndUpdate = async () => {
    throw new Error('no-op update should not mutate envelope balances');
  };

  Transaction.aggregate = async () => [];
  Transfer.findOne = async () => transfer;

  const req = {
    user: { _id: 'u1' },
    params: { id: 't1' },
    body: {
      type: 'expense',
      fromId: 'e1',
      toId: 'e2',
      amount: 100,
      purpose: 'Food → Bills',
      date: new Date('2024-01-10T00:00:00.000Z'),
    },
  };
  const res = {
    status(code) {
      this.code = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };

  await controller.updateTransferFunds(req, res);

  assert.equal(res.code, 200);
  assert.equal(res.payload.message, 'Transfer unchanged');
  assert.equal(res.payload.transfer._id, 't1');
});

test('reversing a transfer with the same amount updates only the record, not the balances', async () => {
  const transfer = {
    _id: 't2',
    userId: 'u1',
    type: 'expense',
    fromEnvelopeId: 'a',
    toEnvelopeId: 'b',
    fromName: 'A',
    toName: 'B',
    amount: 500,
    purpose: 'A → B',
    date: new Date('2024-01-10T00:00:00.000Z'),
    save: async () => {},
  };

  const updates = [];
  Envelope.findOne = async ({ _id }) => {
    if (String(_id) === 'a') {
      return {
        _id: 'a',
        userId: 'u1',
        name: 'A',
        allocatedAmount: 500,
        lean: async () => ({ _id: 'a', userId: 'u1', name: 'A', allocatedAmount: 500 }),
      };
    }
    if (String(_id) === 'b') {
      return {
        _id: 'b',
        userId: 'u1',
        name: 'B',
        allocatedAmount: 1500,
        lean: async () => ({ _id: 'b', userId: 'u1', name: 'B', allocatedAmount: 1500 }),
      };
    }
    return null;
  };

  Envelope.findOneAndUpdate = async (query, update) => {
    updates.push({ query, update });
    return { _id: query._id, userId: 'u1', name: query._id === 'a' ? 'A' : 'B', allocatedAmount: 0 };
  };

  Transaction.aggregate = async () => [];
  Transfer.findOne = async () => transfer;

  const req = {
    user: { _id: 'u1' },
    params: { id: 't2' },
    body: {
      type: 'expense',
      fromId: 'b',
      toId: 'a',
      amount: 500,
      purpose: 'B → A',
      date: new Date('2024-01-10T00:00:00.000Z'),
    },
  };
  const res = {
    status(code) {
      this.code = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };

  await controller.updateTransferFunds(req, res);

  assert.deepEqual(updates, []);
  assert.equal(res.code, 200);
  assert.equal(res.payload.message, 'Transfer updated');
  assert.equal(res.payload.transfer.fromEnvelopeId, 'b');
  assert.equal(res.payload.transfer.toEnvelopeId, 'a');
});

test.after(() => {
  Envelope.findOne = originalEnvelopeFindOne;
  Envelope.findOneAndUpdate = originalEnvelopeFindOneAndUpdate;
  Transaction.aggregate = originalTransactionAggregate;
  Transfer.findOne = originalTransferFindOne;
});
