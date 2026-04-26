import type { MetadataRoute } from 'next';

const SITE = 'https://refeit.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes = ['', '/login', '/politica-privacidad', '/terminos'];
  const langs = ['es', 'pt'] as const;

  const entries: MetadataRoute.Sitemap = [];

  // Landing localizada
  for (const lang of langs) {
    entries.push({
      url: `${SITE}/${lang}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
      alternates: {
        languages: {
          es: `${SITE}/es`,
          pt: `${SITE}/pt`,
          'x-default': `${SITE}/es`,
        },
      },
    });
  }

  // Otras rutas públicas (sin localización por ahora)
  for (const route of routes.filter((r) => r !== '')) {
    entries.push({
      url: `${SITE}${route}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    });
  }

  return entries;
}
