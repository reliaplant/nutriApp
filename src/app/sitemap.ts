import type { MetadataRoute } from 'next';
import blogIndex from '@/content/blog/index.json';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://refeit.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes = ['', '/politica-privacidad', '/terminos'];
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

  // Blog: índice + cada artículo
  entries.push({
    url: `${SITE}/blog`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  });
  for (const article of blogIndex.articles) {
    entries.push({
      url: `${SITE}/blog/${article.slug}`,
      lastModified: new Date(article.updated || article.date),
      changeFrequency: 'monthly',
      priority: 0.7,
    });
  }

  return entries;
}
