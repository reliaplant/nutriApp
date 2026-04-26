import type { MetadataRoute } from 'next';

const SITE = 'https://refeit.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/es', '/pt', '/login', '/politica-privacidad', '/terminos'],
        disallow: [
          '/api/',
          '/pacientes',
          '/calendario',
          '/comidas',
          '/consulta',
          '/perfil',
          '/antropometria',
          '/ingredientes',
          '/menu',
          '/detalle-paciente',
        ],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
