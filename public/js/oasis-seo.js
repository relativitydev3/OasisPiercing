/* Oasis Piercing — meta tags y datos estructurados (Schema.org) */
window.OasisSEO = (function () {
  const FAQ = [
    ['¿Qué materiales usan en sus piercings?', 'Trabajamos exclusivamente con Acero Quirúrgico 316L y Oro PVD 18k. Todos nuestros materiales son hipoalergénicos, libres de níquel y cumplen con los estándares ASTM F136 para joyería corporal.'],
    ['¿Cuánto tiempo tarda el envío?', 'Enviamos a toda Colombia en 2–5 días hábiles. Ciudades principales reciben en 2–3 días. El envío es gratis en pedidos desde $80.000 COP. Cada pedido incluye número de seguimiento y empaque discreto.'],
    ['¿Cuáles son los métodos de pago?', 'Aceptamos Nequi, Daviplata, transferencias bancarias (Bancolombia, Davivienda, Banco de Bogotá) y pago contra entrega en ciudades principales. Coordinamos todo por WhatsApp.'],
    ['¿Tienen garantía sus productos?', 'Todos nuestros piercings tienen garantía de 30 días contra defectos de fabricación. Si algo falla, lo cambiamos sin costo adicional con el empaque original.'],
    ['¿Me asesoran para elegir el tamaño correcto?', 'Nuestro equipo te guía por WhatsApp para elegir el gauge, diámetro y estilo correcto según la zona. Solo envíanos una foto y te recomendamos la mejor opción gratis.'],
    ['¿Hacen pedidos personalizados?', 'Aceptamos pedidos por encargo para diseños especiales, colores o medidas específicas. Entrega en 7–15 días hábiles. Escríbenos por WhatsApp para cotizar.']
  ];

  function cfg() { return window.OASIS_CONFIG || {}; }

  function pageUrl() {
    const c = cfg();
    if (c.url) return c.url.replace(/\/$/, '');
    return (window.location.origin + window.location.pathname).replace(/\/$/, '');
  }

  function metaDescription() {
    const name = cfg().name || 'Oasis Piercing';
    const count = window.OASIS_CATALOG?.productCount || cfg().productCount;
    const countText = count ? `${count} diseños` : 'catálogo premium';
    return `${name}: piercings en Acero Quirúrgico 316L. ${countText}, envío gratis en Colombia desde $80.000 COP. Asesoría por WhatsApp y garantía 30 días.`;
  }

  function metaTitle() {
    return 'Oasis Piercing | Piercings Acero Quirúrgico 316L — Envío Gratis Colombia';
  }

  function setMeta(attr, key, value) {
    if (!value) return;
    let el = document.querySelector(`meta[${attr}="${key}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute('content', value);
  }

  function setLink(rel, href, extra = {}) {
    if (!href) return;
    const sel = extra.hreflang
      ? `link[rel="${rel}"][hreflang="${extra.hreflang}"]`
      : `link[rel="${rel}"]:not([hreflang])`;
    let el = document.querySelector(sel);
    if (!el) {
      el = document.createElement('link');
      el.setAttribute('rel', rel);
      document.head.appendChild(el);
    }
    el.setAttribute('href', href);
    Object.entries(extra).forEach(([k, v]) => el.setAttribute(k, v));
  }

  function buildSchemas() {
    const c = cfg();
    const url = pageUrl();
    const name = c.name || 'Oasis Piercing';
    const desc = metaDescription();
    const image = c.ogImage || `${url}/og-image.png`;
    const wa = `https://wa.me/${c.whatsapp || '573156819093'}`;

    const store = {
      '@context': 'https://schema.org',
      '@type': 'JewelryStore',
      '@id': `${url}#store`,
      name,
      description: desc,
      url,
      image,
      email: c.email,
      telephone: c.phone,
      priceRange: c.priceRange || '$$',
      currenciesAccepted: 'COP',
      paymentAccepted: 'Nequi, Daviplata, Transferencia bancaria, Pago contra entrega',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'CO',
        addressRegion: c.country || 'Colombia'
      },
      areaServed: { '@type': 'Country', name: 'Colombia' },
      sameAs: [wa],
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Catálogo Oasis Piercing',
        itemListElement: (c.categories || []).map((cat, i) => ({
          '@type': 'Offer',
          position: i + 1,
          itemOffered: {
            '@type': 'Product',
            name: cat,
            category: 'Joyería corporal'
          }
        }))
      }
    };

    const website = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${url}#website`,
      name,
      url,
      description: desc,
      inLanguage: 'es-CO',
      publisher: { '@id': `${url}#store` }
    };

    const webPage = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': `${url}#webpage`,
      url,
      name: metaTitle(),
      description: desc,
      inLanguage: 'es-CO',
      isPartOf: { '@id': `${url}#website` },
      about: { '@id': `${url}#store` },
      primaryImageOfPage: image
    };

    const faqPage = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      '@id': `${url}#faq`,
      mainEntity: FAQ.map(([q, a]) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a }
      }))
    };

    const breadcrumb = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: url },
        { '@type': 'ListItem', position: 2, name: 'Catálogo', item: `${url}#productos` }
      ]
    };

    const shippingOffer = {
      '@context': 'https://schema.org',
      '@type': 'Offer',
      '@id': `${url}#free-shipping`,
      name: 'Envío gratis en Colombia',
      description: 'Envío gratuito a todo Colombia en pedidos desde $80.000 COP',
      eligibleRegion: { '@type': 'Country', name: 'Colombia' },
      price: '0',
      priceCurrency: 'COP',
      seller: { '@id': `${url}#store` }
    };

    return [store, website, webPage, faqPage, breadcrumb, shippingOffer];
  }

  function injectSchemas(schemas) {
    document.querySelectorAll('script[data-oasis-schema]').forEach(n => n.remove());
    schemas.forEach((data, i) => {
      const s = document.createElement('script');
      s.type = 'application/ld+json';
      s.setAttribute('data-oasis-schema', String(i));
      s.textContent = JSON.stringify(data);
      document.head.appendChild(s);
    });
  }

  function apply() {
    const c = cfg();
    const url = pageUrl();
    const title = metaTitle();
    const desc = metaDescription();
    const image = c.ogImage || `${url}/og-image.png`;
    const keywords = c.keywords || '';

    document.title = title;
    setMeta('name', 'description', desc);
    setMeta('name', 'keywords', keywords);
    setMeta('name', 'robots', 'index, follow, max-image-preview:large');
    setMeta('name', 'author', c.name);
    setMeta('name', 'theme-color', '#050507');
    setMeta('name', 'geo.region', 'CO');
    setMeta('name', 'geo.placename', c.country || 'Colombia');
    setMeta('name', 'format-detection', 'telephone=yes');

    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:site_name', c.name);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', desc);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:locale', c.locale || 'es_CO');
    setMeta('property', 'og:image', image);
    setMeta('property', 'og:image:width', '1200');
    setMeta('property', 'og:image:height', '630');
    setMeta('property', 'og:image:alt', `${c.name} — Piercings premium en Colombia`);

    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', desc);
    setMeta('name', 'twitter:image', image);

    setLink('canonical', url);
    setLink('alternate', url, { hreflang: 'es' });
    setLink('alternate', url, { hreflang: 'x-default' });

    injectSchemas(buildSchemas());
  }

  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', apply);
    } else {
      apply();
    }
  }

  return { init, apply };
})();

OasisSEO.init();
