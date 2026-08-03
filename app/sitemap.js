export default function sitemap() {
  return [
    {
      url: 'https://fragmentado.com',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: 'https://fragmentado.com/lanzamiento',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];
}
