'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from '@/app/shared/useTranslation';

export interface LegalSection {
  id: string;
  title: string;
}

interface LegalLayoutProps {
  title: string;
  subtitle?: string;
  lastUpdated?: string;
  sections: LegalSection[];
  children: React.ReactNode;
}

export default function LegalLayout({ title, subtitle, lastUpdated, sections, children }: LegalLayoutProps) {
  const { t } = useTranslation();
  const [activeId, setActiveId] = useState<string>(sections[0]?.id || '');

  // Highlight active section while scrolling
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the first entry that's intersecting (closest to top)
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 }
    );

    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF9F7' }}>
      {/* Top bar */}
      <header
        className="sticky top-0 z-30 backdrop-blur-md"
        style={{ backgroundColor: 'rgba(250,249,247,0.85)', borderBottom: '1px solid #E8E5DE' }}
      >
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <img src="/icons/refeit-logo.svg" alt="" className="h-7 w-7 transition-transform group-hover:scale-105" />
            <span
              className="text-[15px] font-semibold tracking-tight text-gray-900 lowercase"
              style={{ letterSpacing: '-0.02em' }}
            >
              refeit
            </span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-[12px] text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t('legal.backHome')}
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-5 py-12">
        <div className="grid lg:grid-cols-[220px_1fr] gap-10">
          {/* Sidebar TOC */}
          <aside className="lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-100px)] lg:overflow-y-auto">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-3">
              {t('legal.onThisPage')}
            </p>
            <nav className="space-y-0.5">
              {sections.map((s) => {
                const isActive = activeId === s.id;
                return (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className={`block text-[12px] py-1.5 pl-3 transition-all relative ${
                      isActive
                        ? 'text-emerald-700 font-semibold'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <span
                      className={`absolute left-0 top-0 bottom-0 w-[2px] rounded-full transition-all ${
                        isActive ? 'bg-emerald-600' : 'bg-transparent'
                      }`}
                    />
                    {s.title}
                  </a>
                );
              })}
            </nav>
          </aside>

          {/* Content */}
          <main className="min-w-0">
            <div className="mb-10 pb-8" style={{ borderBottom: '1px solid #E8E5DE' }}>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 mb-3">Legal</p>
              <h1
                className="text-3xl md:text-4xl font-semibold tracking-tight text-gray-900"
                style={{ letterSpacing: '-0.02em' }}
              >
                {title}
              </h1>
              {subtitle && <p className="mt-3 text-[14px] text-gray-600 leading-relaxed">{subtitle}</p>}
              {lastUpdated && (
                <p className="mt-4 text-[11px] text-gray-500 tabular-nums">{t('legal.lastUpdated')}: {lastUpdated}</p>
              )}
            </div>

            <div className="legal-prose">{children}</div>
          </main>
        </div>
      </div>

      <style>{`
        .legal-prose section { scroll-margin-top: 80px; margin-bottom: 2.5rem; }
        .legal-prose h2 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
          margin-bottom: 0.75rem;
          letter-spacing: -0.01em;
        }
        .legal-prose h3 {
          font-size: 0.95rem;
          font-weight: 600;
          color: #1F2937;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
        }
        .legal-prose p {
          font-size: 0.875rem;
          color: #4B5563;
          line-height: 1.7;
          margin-bottom: 0.875rem;
        }
        .legal-prose ul {
          list-style: disc;
          padding-left: 1.25rem;
          margin-bottom: 0.875rem;
        }
        .legal-prose li {
          font-size: 0.875rem;
          color: #4B5563;
          line-height: 1.7;
          margin-bottom: 0.4rem;
        }
        .legal-prose strong { color: #111827; font-weight: 600; }
        .legal-prose a { color: #047857; text-decoration: underline; text-underline-offset: 2px; }
        .legal-prose a:hover { color: #065F46; }
      `}</style>
    </div>
  );
}
