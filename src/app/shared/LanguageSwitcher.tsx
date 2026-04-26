'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslation } from '@/app/shared/useTranslation';
import { SUPPORTED_LANGS, type Lang } from '@/app/shared/i18n';
import { Check } from 'lucide-react';

type Variant = 'app' | 'public';

/**
 * LanguageSwitcher — cambia el idioma activo.
 *
 * variant='app'    → solo cambia localStorage + cookie (admin/dashboard)
 * variant='public' → además navega entre /es y /pt para SEO
 */
export default function LanguageSwitcher({
  variant = 'app',
  align = 'right',
}: {
  variant?: Variant;
  align?: 'left' | 'right';
}) {
  const { lang, setLang } = useTranslation();
  const router = useRouter();
  const pathname = usePathname() || '/';
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const change = (newLang: Lang) => {
    setLang(newLang);
    setOpen(false);

    if (variant === 'public') {
      // Reescribe el prefijo del path
      const stripped = pathname.replace(/^\/(es|pt)(?=\/|$)/, '') || '/';
      const target = `/${newLang}${stripped === '/' ? '' : stripped}`;
      router.push(target);
    }
  };

  const current = SUPPORTED_LANGS.find((l) => l.code === lang) || SUPPORTED_LANGS[0];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[12px] text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
        aria-haspopup="listbox"
        aria-expanded={open}
        title={current.label}
      >
        <span className="text-[14px] leading-none" aria-hidden="true">{current.flag}</span>
        <span className="hidden sm:inline tabular-nums uppercase tracking-wider text-[11px] font-medium">
          {current.code}
        </span>
      </button>

      {open && (
        <div
          className={`absolute mt-1 ${align === 'right' ? 'right-0' : 'left-0'} w-44 rounded-md bg-white z-50 overflow-hidden`}
          style={{
            border: '1px solid #E8E5DE',
            boxShadow: '0 12px 32px -8px rgba(0,0,0,0.12), 0 4px 12px -4px rgba(0,0,0,0.06)',
          }}
        >
          {SUPPORTED_LANGS.map((l) => {
            const active = l.code === lang;
            return (
              <button
                key={l.code}
                onClick={() => change(l.code)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-[12px] hover:bg-[#FAF9F7] transition-colors ${
                  active ? 'text-emerald-700 font-semibold' : 'text-gray-700'
                }`}
              >
                <span className="text-base leading-none">{l.flag}</span>
                <span className="flex-1 text-left">{l.label}</span>
                {active && <Check className="w-3.5 h-3.5" strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
