import test from 'node:test';
import assert from 'node:assert/strict';

import { toLocalDateInput, fromLocalDateInput } from './dates.js';

test('local date inputs round-trip without UTC day shift', () => {
  const parsed = fromLocalDateInput('2026-08-24');
  assert.equal(parsed.getFullYear(), 2026);
  assert.equal(parsed.getMonth(), 7);
  assert.equal(parsed.getDate(), 24);
  assert.equal(toLocalDateInput(parsed), '2026-08-24');
});

test('toLocalDateInput uses the local calendar date, not UTC', () => {
  const evening = new Date(2026, 7, 24, 2, 0, 0, 0);
  assert.equal(toLocalDateInput(evening), '2026-08-24');
});
