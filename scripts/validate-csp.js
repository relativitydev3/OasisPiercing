/**
 * Verifica CSP con nonces + strict-dynamic en rutas clave.
 * Uso: node scripts/validate-csp.js [baseUrl]
 */
const http = require('http');
const https = require('https');

const baseUrl = process.argv[2] || 'http://localhost:3000';

function fetch(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    }).on('error', reject);
  });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function checkPage(path, { minNonces = 0, mustHaveStrictDynamic = true } = {}) {
  const { status, headers, body } = await fetch(`${baseUrl}${path}`);
  const csp = headers['content-security-policy'] || '';
  const scriptSrc = (csp.match(/script-src[^;]*/i) || [''])[0];
  assert(status === 200, `${path} status ${status}`);
  assert(scriptSrc.includes("'unsafe-inline'"), `${path} missing unsafe-inline fallback`);
  assert(scriptSrc.includes('https:'), `${path} missing https: fallback`);
  assert(scriptSrc.includes('http:'), `${path} missing http: fallback`);
  assert(!csp.includes('cdnjs.cloudflare.com'), `${path} CSP should not rely on cdnjs host allowlist`);
  if (mustHaveStrictDynamic) {
    assert(csp.includes("'strict-dynamic'"), `${path} missing strict-dynamic`);
    assert(/'nonce-[^']+'/.test(csp), `${path} missing nonce in CSP header`);
  }
  assert(csp.includes('require-trusted-types-for'), `${path} missing require-trusted-types-for`);
  assert(csp.includes('trusted-types'), `${path} missing trusted-types directive`);
  if (baseUrl.startsWith('https://')) {
    const hsts = headers['strict-transport-security'] || '';
    assert(hsts.includes('max-age='), `${path} missing HSTS max-age`);
    assert(hsts.includes('preload'), `${path} missing HSTS preload`);
    assert(hsts.includes('includeSubDomains'), `${path} missing HSTS includeSubDomains`);
  }
  const nonceCount = (body.match(/nonce="/g) || []).length;
  assert(nonceCount >= minNonces, `${path} expected >= ${minNonces} nonce attrs, got ${nonceCount}`);
  return { path, csp, nonceCount };
}

async function main() {
  const checks = [
    checkPage('/', { minNonces: 6 }),
    checkPage('/registro', { minNonces: 2 }),
    checkPage('/login', { minNonces: 1 }),
  ];

  for (const path of ['/js/trusted-types.js', '/js/oasis-config.js', '/js/oasis-boot.js', '/js/oasis-piercing.js']) {
    const { status } = await fetch(`${baseUrl}${path}`);
    assert(status === 200, `${path} static JS status ${status}`);
  }

  const results = await Promise.all(checks);
  console.log('CSP validation OK');
  results.forEach((r) => console.log(`  ${r.path}: ${r.nonceCount} script nonce(s)`));
}

main().catch((err) => {
  console.error('CSP validation FAILED:', err.message);
  process.exit(1);
});
