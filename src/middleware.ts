import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SUPPORTED = ['es', 'pt'] as const;
type Lang = typeof SUPPORTED[number];

/**
 * Detecta el idioma preferido a partir del header Accept-Language.
 * Devuelve 'pt' si pt-* aparece antes que es-*, en cualquier otro caso 'es'.
 */
function detectLang(acceptLanguage: string | null): Lang {
  if (!acceptLanguage) return 'es';
  const langs = acceptLanguage
    .split(',')
    .map((part) => {
      const [lang, qStr] = part.trim().split(';q=');
      return { lang: lang.toLowerCase(), q: qStr ? parseFloat(qStr) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const { lang } of langs) {
    if (lang.startsWith('pt')) return 'pt';
    if (lang.startsWith('es')) return 'es';
  }
  return 'es';
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Solo redirige el path raíz exacto. Las rutas de la app (/pacientes, /login, etc.)
  // y las localizadas (/es, /pt) pasan tal cual.
  if (pathname === '/') {
    // Permite override por cookie si el usuario ya eligió idioma.
    const cookieLang = request.cookies.get('refeit_lang')?.value as Lang | undefined;
    const lang: Lang = (cookieLang && SUPPORTED.includes(cookieLang))
      ? cookieLang
      : detectLang(request.headers.get('accept-language'));

    const url = request.nextUrl.clone();
    url.pathname = `/${lang}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icons|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)',
  ],
};
