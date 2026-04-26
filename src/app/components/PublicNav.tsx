'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { t, type Lang } from '@/app/shared/i18n';
import LanguageSwitcher from '@/app/shared/LanguageSwitcher';

export default function PublicNav({ lang }: { lang: Lang }) {
  const home = `/${lang}`;
  return (
    <header
      className="sticky top-0 z-40 backdrop-blur-md"
      style={{ backgroundColor: 'rgba(250,249,247,0.8)', borderBottom: '1px solid #E8E5DE' }}
    >
      <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
        <Link href={home} className="flex items-center gap-2 group">
          <img src="/icons/refeit-logo.svg" alt="" className="h-7 w-7 transition-transform group-hover:scale-105" />
          <span className="text-[15px] font-semibold tracking-tight text-gray-900 lowercase" style={{ letterSpacing: '-0.02em' }}>refeit</span>
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-[13px] text-gray-600">
          <a href="#funcionalidades" className="hover:text-gray-900 transition-colors">{t('publicNav.features', lang)}</a>
          <a href="#flujo" className="hover:text-gray-900 transition-colors">{t('publicNav.howItWorks', lang)}</a>
          <a href="#precios" className="hover:text-gray-900 transition-colors">{t('publicNav.pricing', lang)}</a>
        </nav>

        <div className="flex items-center gap-1.5">
          <LanguageSwitcher variant="public" />
          <Link href="/login" className="text-[13px] text-gray-700 hover:text-gray-900 px-3 py-1.5 transition-colors">
            {t('publicNav.login', lang)}
          </Link>
          <Link href="/login" className="text-[13px] font-medium text-white bg-gray-900 hover:bg-gray-800 px-3.5 py-1.5 rounded-md transition-colors flex items-center gap-1">
            {t('publicNav.signup', lang)}
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </header>
  );
}
