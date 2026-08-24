const test = require('node:test');
const assert = require('node:assert/strict');
const { getPeriodRange } = require('./periodRange');

test('financial-year spans July to June in the user timezone', () => {
  // 2026-03-15 12:00 UTC, PKT is UTC+5 so tzOffset = -300
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
