const test = require('node:test');
const assert = require('node:assert/strict');
const { getPeriodRange } = require('./periodRange');

test('financial-year spans July to June in the user timezone', () => {
  const originalNow = Date.now;
  Date.now = () => Date.UTC(2026, 2, 15, 12, 0, 0, 0);
  try {
    const range = getPeriodRange({ period: 'financial-year', tzOffset: -300 });
    assert.equal(range.start.toISOString(), '2025-06-30T19:00:00.000Z');
    assert.equal(range.end.toISOString(), '2026-06-30T18:59:59.999Z');
  } finally {
    Date.now = originalNow;
  }
});

test('today range is the current local calendar day', () => {
  const originalNow = Date.now;
  Date.now = () => Date.UTC(2026, 7, 24, 12, 0, 0, 0);
  try {
    const range = getPeriodRange({ period: 'today', tzOffset: -300 });
    assert.equal(range.start.toISOString(), '2026-08-23T19:00:00.000Z');
    assert.equal(range.end.toISOString(), '2026-08-24T18:59:59.999Z');
  } finally {
    Date.now = originalNow;
  }
});

test('monthly range uses the user timezone calendar month', () => {
  const originalNow = Date.now;
  Date.now = () => Date.UTC(2026, 7, 24, 12, 0, 0, 0);
  try {
    const range = getPeriodRange({ period: 'monthly', tzOffset: -300 });
    assert.equal(range.start.toISOString(), '2026-07-31T19:00:00.000Z');
    assert.equal(range.end.toISOString(), '2026-08-31T18:59:59.999Z');
  } finally {
    Date.now = originalNow;
  }
});

test('invalid year and month fall back to the current local date', () => {
  const originalNow = Date.now;
  Date.now = () => Date.UTC(2026, 7, 24, 12, 0, 0, 0);
  try {
    const range = getPeriodRange({
      period: 'yearly',
      year: 'abc',
      month: '13',
      tzOffset: -300,
    });
    assert.equal(range.start.toISOString(), '2025-12-31T19:00:00.000Z');
    assert.equal(range.end.toISOString(), '2026-12-31T18:59:59.999Z');
  } finally {
    Date.now = originalNow;
  }
});

test('unknown periods return null', () => {
  assert.equal(getPeriodRange({ period: 'all', tzOffset: -300 }), null);
});
