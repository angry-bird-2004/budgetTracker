const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { normalizeClientId, isDuplicateKey } = require('./clientId');

describe('clientId helpers', () => {
  it('trims and rejects empty client ids', () => {
    assert.equal(normalizeClientId('  abc  '), 'abc');
    assert.equal(normalizeClientId(''), undefined);
    assert.equal(normalizeClientId('   '), undefined);
    assert.equal(normalizeClientId(null), undefined);
  });

  it('detects mongo duplicate key errors', () => {
    assert.equal(isDuplicateKey({ code: 11000 }), true);
    assert.equal(isDuplicateKey({ code: 1 }), false);
    assert.equal(isDuplicateKey(null), false);
  });
});
