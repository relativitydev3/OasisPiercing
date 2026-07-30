/**
 * 20 poemas cortos para clientas. Usa {nombre} como marcador del primer nombre.
 */
const POEMAS_CLIENTAS = [
  '{nombre}, tu cuerpo es lienzo\ny cada joya, una nota de oro.',
  '{nombre}, tu piel es un lienzo\nque se pinta con cada pieza que llevas.',
  '{nombre}, llevas luz donde otros solo ven metal;\ntu piel convierte el brillo en historia.',
  '{nombre}, hay joyas que adornan\ny hay joyas que recuerdan quién eres.',
  '{nombre}, hoy llevas contigo\nun fragmento de confianza bien puesto.',
  '{nombre}, brillar no es presumir:\nes honrar la persona que estás siendo.',
  '{nombre}, en Oasis encontraste más que metal:\nencontraste un reflejo de ti.',
  '{nombre}, la elegancia no se anuncia:\nse nota.',
  '{nombre}, tu estilo es tendencia\nporque nace de ti, no de la vitrina.',
  '{nombre}, en Oasis Piercing cada detalle\nhabla de moda con alma y precisión.',
  
 
  '{nombre}, hoy tu look tiene firma:\ndistinción, intención y un toque de Oasis.',
  '{nombre}, vestir tu piel con arte\nes la elegancia más personal.',
  '{nombre}, Oasis Piercing te acompaña\ncon piezas hechas para destacar sin exceso.',
  '{nombre}, hay looks que impresionan\ny hay looks que se recuerdan; el tuyo es de esos dos.',
  '{nombre}, la tendencia te encuentra\ncuando ya vas un paso adelante.',
  '{nombre}, en cada brillo hay estilo,\nen cada estilo, una versión más fiel de ti.',
  '{nombre}, gracias por elegir Oasis:\nhoy tu belleza también lleva nuestro sello.',
];

function personalizePoema(template, nombre) {
  const n = String(nombre || 'Bella').trim() || 'Bella';
  return String(template).replace(/\{nombre\}/g, n);
}

function pickRandomPoema() {
  const index = Math.floor(Math.random() * POEMAS_CLIENTAS.length);
  return POEMAS_CLIENTAS[index];
}

function pickPoemaForCliente(nombre) {
  return personalizePoema(pickRandomPoema(), nombre);
}

module.exports = {
  POEMAS_CLIENTAS,
  personalizePoema,
  pickRandomPoema,
  pickPoemaForCliente,
};
