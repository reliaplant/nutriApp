'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { getLang, setLang as setLangStored, t as translate, ti as translateI, type Lang, DEFAULT_LANG } from '@/app/shared/i18n';

/**
 * Hook que devuelve el idioma activo + función `t` reactiva al cambio.
 *
 * Prioridad para detectar idioma:
 *   1. Prefijo en URL (/es o /pt) — para páginas públicas SEO
 *   2. localStorage `refeit:lang` — preferencia del usuario
 *   3. DEFAULT_LANG ('es')
 */
export function useTranslation() {
  const pathname = usePathname() || '';
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);

  useEffect(() => {
    const m = pathname.match(/^\/(es|pt)(?:\/|$)/);
    if (m) {
      setLangState(m[1] as Lang);
      return;
    }
    setLangState(getLang());
  }, [pathname]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as Lang;
      setLangState(detail);
    };
    window.addEventListener('refeit:lang-change', handler);
    return () => window.removeEventListener('refeit:lang-change', handler);
  }, []);

  const t = useCallback((key: string) => translate(key, lang), [lang]);
  const ti = useCallback((key: string, args: (string | number)[]) => translateI(key, lang, args), [lang]);
  const setLang = useCallback((newLang: Lang) => setLangStored(newLang), []);

  return { lang, setLang, t, ti };
}
