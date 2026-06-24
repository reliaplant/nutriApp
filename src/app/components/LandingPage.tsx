/**
 * LandingPage — página pública traducible.
 *
 * Recibe `lang` por prop, traduce todo el contenido server-side
 * con `t(key, lang)`. Cada string vive en src/app/shared/i18n.ts.
 *
 * Se renderiza desde:
 *   - app/page.tsx        (lang por defecto)
 *   - app/es/page.tsx     (lang="es")
 *   - app/pt/page.tsx     (lang="pt")
 */

import Link from 'next/link';
import { ArrowRight, Sparkles, Shield } from 'lucide-react';
import { t, type Lang } from '@/app/shared/i18n';
import Pricing from './pricing';
import PublicNav from './PublicNav';
import {
  ScreenFrame, PatientsBoardMockup, ConsultaMockup, MealsBoardMockup,
  MealEditorMockup, IngredientsMockup, PdfMockup, PatientHistoryMockup, PlansLibraryMockup,
} from './AppMockups';

type Props = { lang: Lang };

const CREAM = '#FAF9F7';
const PANEL = '#F4F2EE';

export default function LandingPage({ lang }: Props) {
  return (
    <div style={{ backgroundColor: CREAM }} className="min-h-screen text-gray-900 antialiased">
      <PublicNav lang={lang} />
      <Hero lang={lang} />

      {/* Showcases de pantallas reales */}
      <Showcase lang={lang} itemKey="plans" bg={PANEL} id="funcionalidades">
        <ConsultaMockup />
      </Showcase>
      <Showcase lang={lang} itemKey="savedPlans" bg={CREAM} reversed>
        <PlansLibraryMockup />
      </Showcase>
      <Showcase lang={lang} itemKey="recipes" bg={PANEL}>
        <MealsBoardMockup />
      </Showcase>
      <Showcase lang={lang} itemKey="ai" bg={CREAM} reversed>
        <MealEditorMockup />
      </Showcase>
      <Showcase lang={lang} itemKey="ingredients" bg={PANEL}>
        <IngredientsMockup />
      </Showcase>
      <Showcase lang={lang} itemKey="pdf" bg={CREAM} reversed noFrame>
        <PdfMockup />
      </Showcase>
      <Showcase lang={lang} itemKey="tracking" bg={PANEL}>
        <PatientHistoryMockup />
      </Showcase>

      <PricingWrap lang={lang} />
      <CTA lang={lang} />
      <Footer lang={lang} />
    </div>
  );
}

/* ─── HERO ─────────────────────────────────────────────────────────────── */
function Hero({ lang }: Props) {
  const floaters = [
    { src: 'aguacate', top: '14%', left: '5%', size: 34, rot: -8, delay: '0s' },
    { src: 'fresa', top: '20%', right: '7%', size: 28, rot: 12, delay: '0.6s' },
    { src: 'brocoli', bottom: '24%', left: '8%', size: 34, rot: 6, delay: '1.2s' },
    { src: 'zanahoria', top: '62%', right: '5%', size: 30, rot: 18, delay: '0.9s' },
    { src: 'huevo', top: '10%', right: '22%', size: 22, rot: 4, delay: '1.5s' },
    { src: 'salmon', bottom: '12%', right: '14%', size: 30, rot: -10, delay: '0.4s' },
  ];

  return (
    <section className="relative overflow-hidden">
      {/* glow suave */}
      <div className="absolute inset-x-0 top-0 h-[480px] pointer-events-none" style={{ background: 'radial-gradient(60% 60% at 50% 0%, rgba(16,185,129,0.10) 0%, rgba(250,249,247,0) 70%)' }} />
      <div className="absolute inset-0 pointer-events-none hidden md:block">
        {floaters.map((f, i) => (
          <img key={i} src={`/icons/${f.src}.svg`} alt="" className="absolute opacity-50 animate-float"
            style={{
              top: f.top as any, left: f.left as any, right: f.right as any, bottom: f.bottom as any,
              width: f.size, height: f.size, transform: `rotate(${f.rot}deg)`, animationDelay: f.delay,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0) rotate(var(--r,0deg));} 50%{transform:translateY(-8px) rotate(var(--r,0deg));} }
        .animate-float { animation: float 5s ease-in-out infinite; }
      `}</style>

      <div className="max-w-5xl mx-auto px-5 pt-16 md:pt-24 pb-10 text-center relative">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium text-emerald-700 mb-6"
          style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
          <Sparkles className="w-3 h-3" />
          {t('landing.hero.badge', lang)}
        </div>

        <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-gray-900 leading-[1.05]" style={{ letterSpacing: '-0.03em' }}>
          {t('landing.hero.title1', lang)}<br />
          <span className="text-gray-500">{t('landing.hero.title2', lang)}</span>
        </h1>

        <p className="mt-6 text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          {t('landing.hero.subtitle', lang)}
        </p>

        <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
          <Link href="/login" className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-md text-[13px] font-semibold flex items-center gap-1.5 transition-colors shadow-sm">
            {t('landing.hero.ctaPrimary', lang)}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <p className="mt-4 text-[11px] text-gray-500">{t('landing.hero.microCopy', lang)}</p>
      </div>

      {/* Mockup hero: gestión de pacientes */}
      <div className="max-w-6xl mx-auto px-5 pb-16 md:pb-24 relative">
        <ScreenFrame>
          <PatientsBoardMockup />
        </ScreenFrame>
      </div>
    </section>
  );
}

/* ─── SHOWCASE (texto + mockup) ────────────────────────────────────────── */
function Showcase({
  lang, itemKey, children, reversed, bg, noFrame, id,
}: Props & { itemKey: string; children: React.ReactNode; reversed?: boolean; bg: string; noFrame?: boolean; id?: string }) {
  const item = t(`landing.features.items.${itemKey}`, lang) as { title: string; desc: string; tag?: string };
  return (
    <section id={id} className="py-16 md:py-24 overflow-hidden" style={{ backgroundColor: bg }}>
      <div className="max-w-[1360px] mx-auto px-5 md:px-8 grid lg:grid-cols-5 gap-8 lg:gap-12 items-center">
        <div className={`lg:col-span-2 ${reversed ? 'lg:order-2' : ''}`}>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 mb-3">{item.tag ?? t('landing.features.eyebrow', lang)}</p>
          <h2 className="text-2xl md:text-4xl font-semibold tracking-tight text-gray-900 mb-4" style={{ letterSpacing: '-0.02em' }}>
            {item.title}
          </h2>
          <p className="text-[14px] md:text-[15px] text-gray-600 leading-relaxed">{item.desc}</p>
        </div>
        <div className={`lg:col-span-3 ${reversed ? 'lg:order-1' : ''}`}>
          {noFrame ? children : <ScreenFrame>{children}</ScreenFrame>}
        </div>
      </div>
    </section>
  );
}

/* ─── PRICING WRAP ─────────────────────────────────────────────────────── */
function PricingWrap({ lang }: Props) {
  return (
    <section id="precios" className="py-24 md:py-32" style={{ backgroundColor: PANEL }}>
      <div className="max-w-6xl mx-auto px-5">
        <div className="text-center mb-10 max-w-2xl mx-auto">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 mb-3">{t('landing.pricing.eyebrow', lang)}</p>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-gray-900" style={{ letterSpacing: '-0.02em' }}>
            {t('landing.pricing.title1', lang)}<br />
            <span className="text-gray-400">{t('landing.pricing.title2', lang)}</span>
          </h2>
          <p className="mt-5 text-[15px] text-gray-600 leading-relaxed">{t('landing.pricing.desc', lang)}</p>
          <div className="mt-5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium text-emerald-800" style={{ backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {t('landing.pricing.beta', lang)}
          </div>
        </div>
        <Pricing lang={lang} />
      </div>
    </section>
  );
}

/* ─── CTA ──────────────────────────────────────────────────────────────── */
function CTA({ lang }: Props) {
  return (
    <section className="py-24 md:py-32">
      <div className="max-w-4xl mx-auto px-5">
        <div className="relative rounded-2xl p-10 md:p-16 text-center overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', boxShadow: '0 24px 48px -16px rgba(5,150,105,0.35)' }}>
          <img src="/icons/aguacate.svg" className="absolute top-6 left-6 w-7 h-7 opacity-30" alt="" />
          <img src="/icons/zanahoria.svg" className="absolute top-6 right-8 w-6 h-6 opacity-30" alt="" />
          <img src="/icons/manzana.svg" className="absolute bottom-6 left-10 w-6 h-6 opacity-30" alt="" />
          <img src="/icons/brocoli.svg" className="absolute bottom-8 right-6 w-7 h-7 opacity-30" alt="" />

          <Shield className="w-7 h-7 text-white/80 mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-semibold text-white tracking-tight" style={{ letterSpacing: '-0.02em' }}>
            {t('landing.cta.title', lang)}
          </h2>
          <p className="text-emerald-50 mt-4 max-w-lg mx-auto text-[14px]">{t('landing.cta.desc', lang)}</p>
          <Link href="/login" className="inline-flex items-center gap-1.5 mt-7 bg-white hover:bg-gray-50 text-emerald-700 px-6 py-3 rounded-md text-[13px] font-semibold transition-colors shadow-lg">
            {t('landing.cta.button', lang)}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── FOOTER ──────────────────────────────────────────────────────────── */
function Footer({ lang }: Props) {
  const homeHref = `/${lang}`;
  return (
    <footer style={{ borderTop: '1px solid #E8E5DE' }}>
      <div className="max-w-6xl mx-auto px-5 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <Link href={homeHref} className="flex items-center gap-2 mb-3">
              <img src="/icons/refeit-logo.svg?v=2" className="h-7 w-7" alt="" />
              <span className="text-[16px] text-gray-900 lowercase" style={{ fontFamily: "'Sora', ui-sans-serif, system-ui, sans-serif", fontWeight: 600, letterSpacing: '-0.03em' }}>refeit</span>
            </Link>
            <p className="text-[12px] text-gray-500 max-w-sm leading-relaxed">{t('landing.footer.tagline', lang)}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-700 mb-3">{t('landing.footer.product', lang)}</p>
            <ul className="space-y-2 text-[12px] text-gray-500">
              <li><a href="#funcionalidades" className="hover:text-gray-900">{t('publicNav.features', lang)}</a></li>
              <li><a href="#precios" className="hover:text-gray-900">{t('publicNav.pricing', lang)}</a></li>
              <li><Link href="/blog" className="hover:text-gray-900">Blog</Link></li>
              <li><Link href="/login" className="hover:text-gray-900">{t('publicNav.login', lang)}</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-700 mb-3">{t('landing.footer.legal', lang)}</p>
            <ul className="space-y-2 text-[12px] text-gray-500">
              <li><Link href="/politica-privacidad" className="hover:text-gray-900">{t('landing.footer.privacy', lang)}</Link></li>
              <li><Link href="/terminos" className="hover:text-gray-900">{t('landing.footer.terms', lang)}</Link></li>
              <li><a href="mailto:hola@refeit.com" className="hover:text-gray-900">{t('landing.footer.contact', lang)}</a></li>
            </ul>
          </div>
        </div>
        <div className="flex items-center justify-between pt-6" style={{ borderTop: '1px solid #F0EDE8' }}>
          <p className="text-[11px] text-gray-400">© {new Date().getFullYear()} refeit · {t('landing.footer.copyright', lang)}</p>
          <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {t('landing.footer.status', lang)}
          </div>
        </div>
      </div>
    </footer>
  );
}
