export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/fg-admin', '/api/admin'],
    },
    sitemap: 'https://fragmentado.com/sitemap.xml',
    host: 'https://fragmentado.com',
  };
}

