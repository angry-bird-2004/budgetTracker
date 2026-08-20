import test from 'node:test';
import assert from 'node:assert/strict';

import { toBaseAmount, fromBaseAmount } from './amounts.js';

test('PKR amounts stay constant when stored in PKR base', () => {
  assert.equal(toBaseAmount(25000, 'PKR', 278), 25000);
  assert.equal(fromBaseAmount(25000, 'PKR', 278), 25000);
});

test('USD inputs are converted to PKR for storage, but displayed in USD only on demand', () => {
  assert.equal(toBaseAmount(100, 'USD', 278), 27800);
  assert.equal(fromBaseAmount(27800, 'USD', 278), 100);
});

test('USD display conversion does not rewrite the underlying PKR value', () => {
  const storedValue = 25000;
  const usdValue = fromBaseAmount(storedValue, 'USD', 278);
  assert.ok(Math.abs(usdValue - 89.92805755395683) < 1e-9);
  assert.equal(storedValue, 25000);
});
