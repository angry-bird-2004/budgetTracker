const test = require('node:test');
const assert = require('node:assert/strict');

const { getTransferHistory } = require('../controllers/envelopeController');

test('transfer history controller is available for the dashboard', () => {
  assert.equal(typeof getTransferHistory, 'function');
});
