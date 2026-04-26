'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Check, Minus, Sparkles, ArrowRight, Building2, Leaf, Zap } from 'lucide-react';
import { t, ti, type Lang } from '@/app/shared/i18n';

type PlanKey = 'free' | 'pro' | 'enterprise';

interface PlanConfig {
  key: PlanKey;
  icon: React.ReactNode;
  priceMonthly: number;
  priceAnnual: number;
  ctaHref: string;
  highlight?: boolean;
}

const PLANS: PlanConfig[] = [
  { key: 'free',       icon: <Leaf     className="w-3.5 h-3.5" strokeWidth={1.75} />, priceMonthly: 0,   priceAnnual: 0,  ctaHref: '/login' },
  { key: 'pro',        icon: <Zap      className="w-3.5 h-3.5" strokeWidth={1.75} />, priceMonthly: 24,  priceAnnual: 19, ctaHref: '/login', highlight: true },
  { key: 'enterprise', icon: <Building2 className="w-3.5 h-3.5" strokeWidth={1.75} />, priceMonthly: 109, priceAnnual: 89, ctaHref: 'mailto:hola@refeit.app' },
];

const COMP_ROWS: { key: string; freeBool?: boolean; proBool?: boolean; entBool?: boolean }[] = [
  { key: 'patients' },
  { key: 'ai',        freeBool: false, proBool: true,  entBool: true },
  { key: 'recipes' },
  { key: 'charts',    freeBool: false, proBool: true,  entBool: true },
  { key: 'multiuser', freeBool: false, proBool: false, entBool: true },
  { key: 'api',       freeBool: false, proBool: false, entBool: true },
  { key: 'support' },
];

export default function Pricing({ lang = 'es' as Lang }: { lang?: Lang }) {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <div>
      {/* Toggle */}
      <div className="flex items-center justify-center gap-3 mb-12">
        <button
          onClick={() => setIsAnnual(false)}
          className={`px-3 py-1.5 text-[12px] font-semibold rounded-md transition-all ${
            !isAnnual ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
          }`}
          style={!isAnnual ? { border: '1px solid #E8E5DE' } : undefined}
        >
          {t('pricing.monthly', lang)}
        </button>
        <button
          onClick={() => setIsAnnual(true)}
          className={`px-3 py-1.5 text-[12px] font-semibold rounded-md transition-all flex items-center gap-1.5 ${
            isAnnual ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
          }`}
          style={isAnnual ? { border: '1px solid #E8E5DE' } : undefined}
        >
          {t('pricing.annual', lang)}
          <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-700">−20%</span>
        </button>
      </div>

      {/* Cards */}
      <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto">
        {PLANS.map((p) => {
          const data = t(`pricing.plans.${p.key}`, lang) as { name: string; tagline: string; cta: string; features: string[] };
          const price = isAnnual ? p.priceAnnual : p.priceMonthly;
          const isHighlighted = p.highlight;

          return (
            <div key={p.key} className="relative rounded-xl bg-white flex flex-col transition-all hover:-translate-y-0.5"
              style={{
                border: isHighlighted ? '1.5px solid #047857' : '1px solid #E8E5DE',
                boxShadow: isHighlighted ? '0 16px 40px -12px rgba(4, 120, 87, 0.18)' : '0 1px 2px rgba(0,0,0,0.02)',
              }}>
              {isHighlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider text-white bg-emerald-700 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" strokeWidth={2} />
                  {t('pricing.mostPopular', lang)}
                </div>
              )}

              <div className="p-6 pb-5">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded ${isHighlighted ? 'bg-emerald-50 text-emerald-700' : 'text-gray-400'}`}
                    style={!isHighlighted ? { backgroundColor: '#F4F2EE' } : undefined}>
                    {p.icon}
                  </span>
                  <h3 className="text-[15px] font-semibold text-gray-900 tracking-tight" style={{ letterSpacing: '-0.01em' }}>
                    {data.name}
                  </h3>
                </div>
                <p className="text-[12px] text-gray-500 mb-5">{data.tagline}</p>

                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-4xl font-semibold text-gray-900 tabular-nums" style={{ letterSpacing: '-0.03em' }}>
                    €{price}
                  </span>
                  {price > 0 && <span className="text-[12px] text-gray-500">{t('pricing.perMonth', lang)}</span>}
                </div>
                <p className="text-[11px] text-gray-500 tabular-nums">
                  {price === 0
                    ? t('pricing.noCost', lang)
                    : isAnnual
                      ? ti('pricing.annualBilling', lang, [price * 12])
                      : t('pricing.monthlyBilling', lang)}
                </p>

                <Link href={p.ctaHref}
                  className={`mt-5 w-full py-2.5 px-4 rounded-md text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    isHighlighted ? 'bg-emerald-700 text-white hover:bg-emerald-800' : 'bg-white text-gray-900 hover:bg-gray-50'
                  }`}
                  style={!isHighlighted ? { border: '1px solid #E8E5DE' } : undefined}>
                  {data.cta}
                  <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
                </Link>
              </div>

              <div className="px-6 pt-5 pb-6 mt-auto" style={{ borderTop: '1px solid #F0EDE8' }}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-3">{t('pricing.includes', lang)}</p>
                <ul className="space-y-2">
                  {data.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${isHighlighted ? 'text-emerald-700' : 'text-gray-400'}`} strokeWidth={2.5} />
                      <span className="text-[12.5px] text-gray-700 leading-snug">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparison table */}
      <div className="mt-20 max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">{t('pricing.comparison', lang)}</p>
          <h3 className="text-2xl font-semibold tracking-tight text-gray-900" style={{ letterSpacing: '-0.02em' }}>
            {t('pricing.whatsIncluded', lang)}
          </h3>
        </div>

        <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E8E5DE' }}>
          <table className="w-full text-[13px]">
            <thead>
              <tr style={{ borderBottom: '1px solid #E8E5DE', backgroundColor: '#FAF9F7' }}>
                <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                  {t('pricing.function', lang)}
                </th>
                {PLANS.map((p) => {
                  const name = (t(`pricing.plans.${p.key}.name`, lang) as string);
                  return (
                    <th key={p.key} className={`text-center px-4 py-3 text-[11px] font-semibold ${p.highlight ? 'text-emerald-700' : 'text-gray-700'}`}>
                      {name}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {COMP_ROWS.map((row, i) => {
                const rowData = t(`pricing.compRows.${row.key}`, lang) as { label: string; free?: string; pro?: string; enterprise?: string };
                const cells: (string | boolean)[] = [
                  row.freeBool !== undefined ? row.freeBool : (rowData.free ?? ''),
                  row.proBool  !== undefined ? row.proBool  : (rowData.pro  ?? ''),
                  row.entBool  !== undefined ? row.entBool  : (rowData.enterprise ?? ''),
                ];
                return (
                  <tr key={row.key} style={{ borderBottom: i < COMP_ROWS.length - 1 ? '1px solid #F0EDE8' : undefined }}>
                    <td className="px-5 py-3 text-gray-700">{rowData.label}</td>
                    {cells.map((cell, j) => (
                      <td key={j} className="text-center px-4 py-3 tabular-nums">
                        {cell === true ? (
                          <Check className="w-4 h-4 inline-block text-emerald-700" strokeWidth={2.5} />
                        ) : cell === false ? (
                          <Minus className="w-4 h-4 inline-block text-gray-300" strokeWidth={2} />
                        ) : (
                          <span className="text-gray-700 text-[12.5px]">{cell as string}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQs */}
      <div className="mt-20 max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">{t('pricing.faqEyebrow', lang)}</p>
          <h3 className="text-2xl font-semibold tracking-tight text-gray-900" style={{ letterSpacing: '-0.02em' }}>
            {t('pricing.faqTitle', lang)}
          </h3>
        </div>
        <div className="space-y-3">
          {(t('pricing.faqs', lang) as { q: string; a: string }[]).map((item, i) => (
            <details key={i} className="group bg-white rounded-lg overflow-hidden transition-all" style={{ border: '1px solid #E8E5DE' }}>
              <summary className="px-5 py-3.5 flex items-center justify-between cursor-pointer text-[13px] font-medium text-gray-900 hover:bg-[#FAF9F7] transition-colors list-none">
                {item.q}
                <span className="text-gray-400 group-open:rotate-45 transition-transform text-lg leading-none">+</span>
              </summary>
              <div className="px-5 pb-4 text-[12.5px] text-gray-600 leading-relaxed">{item.a}</div>
            </details>
          ))}
        </div>

        <p className="mt-10 text-center text-[12px] text-gray-500">
          {t('pricing.anotherQuestion', lang)}{' '}
          <a href="mailto:hola@refeit.app" className="text-emerald-700 hover:text-emerald-800 underline underline-offset-2 font-medium">
            {t('pricing.writeUs', lang)}
          </a>.
        </p>
      </div>
    </div>
  );
}
