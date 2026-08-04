const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  isDatabaseError,
  parseDatabaseError,
  formatDatabaseErrorBrief,
} = require('../src/utils/databaseErrors');

describe('databaseErrors', () => {
  it('detecta código PostgreSQL 28P01', () => {
    const err = { code: '28P01', message: 'password authentication failed for user "x"' };
    assert.equal(isDatabaseError(err), true);
    const p = parseDatabaseError(err);
    assert.match(p.message, /Autenticación fallida/i);
    assert.equal(p.code, '28P01');
    assert.ok(p.hint);
  });

  it('detecta DATABASE_URL no configurada', () => {
    const err = new Error('Base de datos no configurada. Revisa DATABASE_URL');
    assert.equal(isDatabaseError(err), true);
    assert.match(formatDatabaseErrorBrief(err), /DATABASE_URL/);
  });

  it('detecta ECONNREFUSED', () => {
    const err = { code: 'ECONNREFUSED', message: 'connect ECONNREFUSED 127.0.0.1:5432' };
    assert.equal(isDatabaseError(err), true);
    const p = parseDatabaseError(err);
    assert.equal(p.code, 'ECONNREFUSED');
  });
});
