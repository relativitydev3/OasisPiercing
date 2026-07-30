const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  POEMAS_CLIENTAS,
  personalizePoema,
  pickRandomPoema,
  pickPoemaForCliente,
} = require('../src/data/poemasClientas');

describe('poemasClientas', () => {
  it('tiene exactamente 20 poemas', () => {
    assert.equal(POEMAS_CLIENTAS.length, 20);
  });

  it('personalizePoema reemplaza {nombre}', () => {
    const poema = personalizePoema('Hola, {nombre}.', 'Laura');
    assert.equal(poema, 'Hola, Laura.');
  });

  it('pickRandomPoema devuelve un poema de la lista', () => {
    const poema = pickRandomPoema();
    assert.ok(POEMAS_CLIENTAS.includes(poema));
  });

  it('pickPoemaForCliente incluye el nombre de la clienta', () => {
    const poema = pickPoemaForCliente('Valentina');
    assert.match(poema, /Valentina/);
    assert.doesNotMatch(poema, /\{nombre\}/);
  });
});
