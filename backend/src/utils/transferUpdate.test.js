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
const originalTransferCreate = Transfer.create;

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

test('invalid transfer type or date does not alter envelope balances', async () => {
  const transfer = {
    _id: 't-invalid',
    userId: 'u1',
    type: 'expense',
    fromEnvelopeId: 'e1',
    toEnvelopeId: 'e2',
    amount: 100,
    date: new Date('2024-01-10T00:00:00.000Z'),
    save: async () => {
      throw new Error('invalid transfer should not be saved');
    },
  };
  let balanceUpdates = 0;
  Transfer.findOne = async () => transfer;
  Envelope.findOneAndUpdate = async () => {
    balanceUpdates += 1;
  };

  const makeResponse = () => ({
    status(code) {
      this.code = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  });
  const request = {
    user: { _id: 'u1' },
    params: { id: 't-invalid' },
  };

  const invalidTypeResponse = makeResponse();
  await controller.updateTransferFunds({
    ...request,
    body: { type: 'unknown', fromId: 'e1', toId: 'e2', amount: 100 },
  }, invalidTypeResponse);
  assert.equal(invalidTypeResponse.code, 400);

  const invalidDateResponse = makeResponse();
  await controller.updateTransferFunds({
    ...request,
    body: { type: 'expense', fromId: 'e1', toId: 'e2', amount: 100, date: 'not-a-date' },
  }, invalidDateResponse);
  assert.equal(invalidDateResponse.code, 400);
  assert.equal(balanceUpdates, 0);
});

test('reversing a same-amount transfer applies the net balance changes', async () => {
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
  Envelope.findOne = ({ _id }) => {
    if (String(_id) === 'a') {
      return makeLeanDoc({
        _id: 'a',
        userId: 'u1',
        name: 'A',
        allocatedAmount: 500,
      });
    }
    if (String(_id) === 'b') {
      return makeLeanDoc({
        _id: 'b',
        userId: 'u1',
        name: 'B',
        allocatedAmount: 1500,
      });
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

  assert.deepEqual(
    updates.map(({ query, update }) => ({
      id: query._id,
      delta: update.$inc.allocatedAmount,
    })),
    [
      { id: 'a', delta: 1000 },
      { id: 'b', delta: -1000 },
    ],
  );
  assert.equal(res.code, 200);
  assert.equal(res.payload.message, 'Transfer updated');
  assert.equal(res.payload.transfer.fromEnvelopeId, 'b');
  assert.equal(res.payload.transfer.toEnvelopeId, 'a');
});

test('creating a transfer preserves its purpose and date', async () => {
  const savedTransfers = [];
  Envelope.findOne = ({ _id }) => ({
    lean: async () => ({
      _id,
      userId: 'u1',
      name: _id === 'e1' ? 'Food' : 'Travel',
      allocatedAmount: 500,
    }),
  });
  Envelope.findOneAndUpdate = async ({ _id }) => ({
    _id,
    userId: 'u1',
    allocatedAmount: _id === 'e1' ? 400 : 300,
  });
  Transaction.aggregate = async () => [];
  Transfer.create = async (transfer) => {
    savedTransfers.push(transfer);
    return transfer;
  };

  const date = '2026-10-29T07:00:00.000Z';
  const req = {
    user: { _id: 'u1' },
    body: {
      type: 'expense',
      fromId: 'e1',
      toId: 'e2',
      amount: 100,
      purpose: 'Move budget for travel',
      date,
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

  await controller.transferFunds(req, res);

  assert.equal(res.code, 200);
  assert.equal(savedTransfers.length, 1);
  assert.equal(savedTransfers[0].purpose, 'Move budget for travel');
  assert.equal(savedTransfers[0].date.toISOString(), date);
});

test('a failed transfer record creation restores both envelope balances', async () => {
  const updates = [];
  Envelope.findOne = ({ _id }) => ({
    lean: async () => ({
      _id,
      userId: 'u1',
      name: _id === 'e1' ? 'Food' : 'Travel',
      allocatedAmount: 500,
    }),
  });
  Envelope.findOneAndUpdate = async (query, update) => {
    updates.push({ id: query._id, delta: update.$inc.allocatedAmount });
    return { _id: query._id };
  };
  Transaction.aggregate = async () => [];
  Transfer.create = async () => {
    throw new Error('transfer insert failed');
  };

  const req = {
    user: { _id: 'u1' },
    body: { type: 'expense', fromId: 'e1', toId: 'e2', amount: 100 },
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

  await controller.transferFunds(req, res);

  assert.equal(res.code, 400);
  assert.deepEqual(updates, [
    { id: 'e1', delta: -100 },
    { id: 'e2', delta: 100 },
    { id: 'e1', delta: 100 },
    { id: 'e2', delta: -100 },
  ]);
});

test.after(() => {
  Envelope.findOne = originalEnvelopeFindOne;
  Envelope.findOneAndUpdate = originalEnvelopeFindOneAndUpdate;
  Transaction.aggregate = originalTransactionAggregate;
  Transfer.findOne = originalTransferFindOne;
  Transfer.create = originalTransferCreate;
});
