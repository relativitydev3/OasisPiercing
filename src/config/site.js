const env = require('./env');

function normalizeUrl(url) {
  return url.endsWith('/') ? url : `${url}/`;
}

function getAppUrl(req) {
  if (process.env.VERCEL_URL) {
    return normalizeUrl(`https://${process.env.VERCEL_URL}`);
  }
  if (env.appUrl && !env.appUrl.includes('localhost')) {
    return normalizeUrl(env.appUrl);
  }
  if (req) {
    return normalizeUrl(`${req.protocol}://${req.get('host')}`);
  }
  return normalizeUrl(env.appUrl);
}

function getClientConfig(req) {
  const baseUrl = getAppUrl(req);

  return {
    url: baseUrl,
    basePath: '/',
    name: 'Oasis Piercing',
    tagline: 'Alta joyería corporal en Colombia',
    email: 'hola@oasispiercing.co',
    phone: '+57 315 681 9093',
    whatsapp: '573156819093',
    locale: 'es_CO',
    country: 'Colombia',
    priceRange: '$$',
    freeShippingMin: 80000,
    currency: 'COP',
    ogImage: `${baseUrl}images/logo-sin-fondo.png`,
    categories: [
      'Piercings para oreja', 'Piercings para nariz', 'Piercings para ombligo',
      'Piercings para ceja', 'Piercings para labio', 'Piercings industrial',
      'Piercings para lengua', 'Piercings para pesones',
    ],
    keywords: [
      'piercings colombia', 'joyería corporal colombia', 'piercing titanio g23',
      'comprar piercings online', 'piercing helix', 'piercing septum', 'piercing ombligo',
      'piercing industrial', 'piercing lengua', 'acero 316l piercing',
      'envío gratis colombia', 'piercing medellín', 'piercing bogotá',
      'oasis piercing', 'piercings hipoalergénicos',
    ].join(', '),
  };
}

module.exports = { getAppUrl, getClientConfig };
