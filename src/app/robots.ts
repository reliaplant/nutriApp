import type { MetadataRoute } from 'next';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://refeit.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        // Solo las páginas públicas de marketing/legales se indexan.
        allow: ['/', '/es', '/pt', '/politica-privacidad', '/terminos'],
        // El resto (la app detrás de login y las rutas de autenticación) se excluye.
        disallow: [
          '/api/',
          '/login',
          '/onboarding',
          '/pacientes',
          '/calendario',
          '/comidas',
          '/planes',
          '/consulta',
          '/perfil',
          '/antropometria',
          '/ingredientes',
          '/menu',
          '/admin',
          '/detalle-paciente',
        ],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
