const test = require('node:test');
const assert = require('node:assert/strict');
const { parseExplicitDateRange } = require('./explicitDateRange');

test('explicit date ranges parse valid ISO timestamps', () => {
  const result = parseExplicitDateRange(
    '2026-04-01T00:00:00.000Z',
    '2026-10-29T13:00:00.000Z',
  );

  assert.equal(result.error, null);
  assert.equal(result.range.start.toISOString(), '2026-04-01T00:00:00.000Z');
  assert.equal(result.range.end.toISOString(), '2026-10-29T13:00:00.000Z');
});

test('explicit date ranges are optional when both bounds are omitted', () => {
  assert.deepEqual(parseExplicitDateRange(undefined, undefined), {
    range: null,
    error: null,
  });
});

test('explicit date ranges reject incomplete, invalid, and reversed bounds', () => {
  assert.match(
    parseExplicitDateRange('2026-01-01T00:00:00.000Z', undefined).error,
    /Both startDate and endDate/,
  );
  assert.match(parseExplicitDateRange('not-a-date', '2026-02-01').error, /invalid date/);
  assert.match(
    parseExplicitDateRange('2026-02-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z').error,
    /before end date/,
  );
});
