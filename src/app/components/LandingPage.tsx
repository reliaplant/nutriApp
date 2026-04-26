/**
 * LandingPage — página pública traducible.
 *
 * Recibe `lang` por prop, traduce todo el contenido server-side
 * con `t(key, lang)`. Cada strings en src/app/shared/i18n.ts.
 *
 * Se renderiza desde:
 *   - app/page.tsx        (lang por defecto)
 *   - app/es/page.tsx     (lang="es")
 *   - app/pt/page.tsx     (lang="pt")
 */

import Link from 'next/link';
import {
  ArrowRight, Sparkles, Users, Calendar, UtensilsCrossed, Carrot,
  CheckCircle2, ChevronRight, TrendingUp, Bookmark, FileText, Zap, Heart, Shield,
} from 'lucide-react';
import { t, type Lang } from '@/app/shared/i18n';
import Pricing from './pricing';
import PublicNav from './PublicNav';

type Props = { lang: Lang };

export default function LandingPage({ lang }: Props) {
  return (
    <div style={{ backgroundColor: '#FAF9F7' }} className="min-h-screen text-gray-900 antialiased">
      <PublicNav lang={lang} />
      <Hero lang={lang} />
      <LogoStrip lang={lang} />
      <Features lang={lang} />
      <MockupSection lang={lang} />
      <RecipeShowcase lang={lang} />
      <Workflow lang={lang} />
      <Stats lang={lang} />
      <PricingWrap lang={lang} />
      <CTA lang={lang} />
      <Footer lang={lang} />
    </div>
  );
}

/* ─── HERO ─────────────────────────────────────────────────────────────── */
function Hero({ lang }: Props) {
  const floaters = [
    { src: 'aguacate', top: '12%', left: '6%', size: 36, rot: -8, delay: '0s' },
    { src: 'fresa', top: '22%', right: '8%', size: 30, rot: 12, delay: '0.6s' },
    { src: 'brocoli', bottom: '18%', left: '10%', size: 38, rot: 6, delay: '1.2s' },
    { src: 'manzana', top: '60%', left: '3%', size: 28, rot: -14, delay: '0.3s' },
    { src: 'zanahoria', bottom: '10%', right: '6%', size: 32, rot: 18, delay: '0.9s' },
    { src: 'huevo', top: '8%', right: '20%', size: 24, rot: 4, delay: '1.5s' },
    { src: 'salmon', bottom: '30%', right: '3%', size: 34, rot: -10, delay: '0.4s' },
    { src: 'naranja', top: '70%', right: '18%', size: 26, rot: 8, delay: '1.1s' },
  ];

  const loginHref = `/login`;

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none hidden md:block">
        {floaters.map((f, i) => (
          <img key={i} src={`/icons/${f.src}.svg`} alt="" className="absolute opacity-60 animate-float"
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

      <div className="max-w-5xl mx-auto px-5 pt-16 md:pt-24 pb-12 text-center relative">
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
          <Link href={loginHref} className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-md text-[13px] font-semibold flex items-center gap-1.5 transition-colors shadow-sm">
            {t('landing.hero.ctaPrimary', lang)}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <a href="#funcionalidades" className="bg-white hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-md text-[13px] font-medium transition-colors" style={{ border: '1px solid #E8E5DE' }}>
            {t('landing.hero.ctaSecondary', lang)}
          </a>
        </div>
        <p className="mt-4 text-[11px] text-gray-500">{t('landing.hero.microCopy', lang)}</p>
      </div>
    </section>
  );
}

/* ─── LOGO STRIP ───────────────────────────────────────────────────────── */
function LogoStrip({ lang }: Props) {
  return (
    <section className="border-y" style={{ borderColor: '#E8E5DE', backgroundColor: '#F4F2EE' }}>
      <div className="max-w-5xl mx-auto px-5 py-8 text-center">
        <p className="text-[11px] font-medium uppercase tracking-wider text-gray-500 mb-4">
          {t('landing.logoStrip.title', lang)}
        </p>
        <div className="flex items-center justify-center gap-8 md:gap-12 flex-wrap text-gray-400 text-[13px] font-semibold">
          <span>Clínica Nutrivital</span>
          <span className="opacity-30">·</span>
          <span>Centro Bienestar</span>
          <span className="opacity-30">·</span>
          <span>NutriPlus</span>
          <span className="opacity-30">·</span>
          <span>Vida Sana</span>
          <span className="opacity-30">·</span>
          <span>{t('landing.logoStrip.more', lang)}</span>
        </div>
      </div>
    </section>
  );
}

/* ─── FEATURES ─────────────────────────────────────────────────────────── */
function Features({ lang }: Props) {
  const items = [
    { key: 'patients',    icon: <Users className="w-4 h-4" strokeWidth={1.75} /> },
    { key: 'plans',       icon: <UtensilsCrossed className="w-4 h-4" strokeWidth={1.75} /> },
    { key: 'ai',          icon: <Sparkles className="w-4 h-4" strokeWidth={1.75} />, highlight: true },
    { key: 'recipes',     icon: <Bookmark className="w-4 h-4" strokeWidth={1.75} /> },
    { key: 'calendar',    icon: <Calendar className="w-4 h-4" strokeWidth={1.75} /> },
    { key: 'pdf',         icon: <FileText className="w-4 h-4" strokeWidth={1.75} /> },
    { key: 'ingredients', icon: <Carrot className="w-4 h-4" strokeWidth={1.75} /> },
    { key: 'tracking',    icon: <TrendingUp className="w-4 h-4" strokeWidth={1.75} /> },
  ];

  return (
    <section id="funcionalidades" className="py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-5">
        <div className="max-w-2xl mb-14">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 mb-3">{t('landing.features.eyebrow', lang)}</p>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-gray-900" style={{ letterSpacing: '-0.02em' }}>
            {t('landing.features.title1', lang)}<br />
            <span className="text-gray-400">{t('landing.features.title2', lang)}</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
          {items.map((it) => {
            const item = t(`landing.features.items.${it.key}`, lang) as { title: string; desc: string; tag?: string };
            return (
              <div key={it.key} className="bg-white rounded-lg p-5 transition-all hover:shadow-md group relative" style={{ border: '1px solid #E8E5DE' }}>
                {item.tag && (
                  <span className={`absolute top-3 right-3 text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    it.highlight ? 'text-emerald-700 bg-emerald-50' : 'text-gray-500 bg-gray-100'
                  }`}>
                    {item.tag}
                  </span>
                )}
                <div className="w-8 h-8 rounded-md flex items-center justify-center mb-3 text-emerald-700" style={{ backgroundColor: '#F0FDF4' }}>
                  {it.icon}
                </div>
                <h3 className="text-[13px] font-semibold text-gray-900 mb-1.5">{item.title}</h3>
                <p className="text-[12px] text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── KANBAN MOCKUP ────────────────────────────────────────────────────── */
function MockupSection({ lang }: Props) {
  const bullets = t('landing.kanban.bullets', lang) as string[];
  return (
    <section className="py-24 md:py-32" style={{ backgroundColor: '#F4F2EE' }}>
      <div className="max-w-6xl mx-auto px-5">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 mb-3">{t('landing.kanban.eyebrow', lang)}</p>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-gray-900 mb-5" style={{ letterSpacing: '-0.02em' }}>
              {t('landing.kanban.title1', lang)}<br />
              <span className="text-gray-400">{t('landing.kanban.title2', lang)}</span>
            </h2>
            <p className="text-[14px] text-gray-600 leading-relaxed mb-6">{t('landing.kanban.desc', lang)}</p>
            <ul className="space-y-2.5">
              {bullets.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-[13px] text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg p-3 bg-white" style={{ border: '1px solid #E8E5DE', boxShadow: '0 24px 48px -16px rgba(0,0,0,0.12)' }}>
            <div className="grid grid-cols-3 gap-2">
              {[
                { title: t('landing.kanban.colToday', lang),    subtitle: `3 ${t('landing.kanban.appts', lang)}`,    color: '#10B981', patients: [{ n: 'María R.', t: '10:00', i: 'MR' }, { n: 'Carlos M.', t: '12:30', i: 'CM' }, { n: 'Lucía F.', t: '16:00', i: 'LF' }] },
                { title: t('landing.kanban.colThisWeek', lang), subtitle: `5 ${t('landing.kanban.appts', lang)}`,    color: '#3B82F6', patients: [{ n: 'Andrea P.', t: 'Mar 28', i: 'AP' }, { n: 'Diego H.', t: 'Mié 29', i: 'DH' }] },
                { title: t('landing.kanban.colNoAppt', lang),   subtitle: `8 ${t('landing.kanban.patients', lang)}`, color: '#F59E0B', patients: [{ n: 'Pedro G.', t: '12d', i: 'PG' }, { n: 'Sofía B.', t: '18d', i: 'SB' }] },
              ].map((col, i) => (
                <div key={i} className="rounded-md p-2" style={{ backgroundColor: '#FAF9F7', border: '1px solid #F0EDE8' }}>
                  <div className="flex items-center gap-1.5 mb-2 px-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: col.color }} />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-700">{col.title as string}</span>
                    <span className="text-[9px] text-gray-400 ml-auto">{col.subtitle as string}</span>
                  </div>
                  <div className="space-y-1.5">
                    {col.patients.map((p, j) => (
                      <div key={j} className="bg-white rounded p-2 flex items-center gap-2" style={{ border: '1px solid #E8E5DE' }}>
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-semibold text-emerald-700 flex-shrink-0" style={{ backgroundColor: '#F0FDF4' }}>{p.i}</div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] font-semibold text-gray-900 truncate">{p.n}</div>
                          <div className="text-[9px] text-gray-500">{p.t}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── RECIPES ──────────────────────────────────────────────────────────── */
function RecipeShowcase({ lang }: Props) {
  const recipes = [
    { name: 'Bowl quinoa', icon: 'plato', kcal: 540, p: 32, c: 58, f: 18 },
    { name: 'Salmón',      icon: 'salmon', kcal: 480, p: 38, c: 12, f: 28 },
    { name: 'Avena',       icon: 'fresa', kcal: 320, p: 12, c: 48, f: 8 },
    { name: 'Pollo',       icon: 'brocoli', kcal: 420, p: 42, c: 22, f: 14 },
  ];
  const b1 = t('landing.recipes.bullet1', lang) as { t: string; d: string };
  const b2 = t('landing.recipes.bullet2', lang) as { t: string; d: string };
  return (
    <section className="py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-5">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <div className="rounded-lg p-4 bg-white" style={{ border: '1px solid #E8E5DE', boxShadow: '0 24px 48px -16px rgba(0,0,0,0.10)' }}>
              <div className="flex items-center justify-between mb-3 pb-2" style={{ borderBottom: '1px solid #F0EDE8' }}>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: '#F0FDF4' }}>
                    <Bookmark className="w-3 h-3 text-emerald-700" />
                  </div>
                  <span className="text-[12px] font-semibold text-gray-900">{t('landing.recipes.eyebrow', lang)}</span>
                </div>
                <span className="text-[10px] text-gray-500 tabular-nums">128</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {recipes.map((r, i) => (
                  <div key={i} className="rounded-md p-3" style={{ border: '1px solid #E8E5DE' }}>
                    <div className="flex items-center gap-1.5 mb-2"><img src={`/icons/${r.icon}.svg`} className="w-3.5 h-3.5" alt="" /></div>
                    <h4 className="text-[12px] font-semibold text-gray-900 mb-2">{r.name}</h4>
                    <div className="flex items-baseline gap-2">
                      <span className="text-[15px] font-bold text-gray-900 tabular-nums">{r.kcal}</span>
                      <span className="text-[9px] text-gray-500">kcal</span>
                    </div>
                    <div className="flex gap-2 text-[9px] text-gray-500 mt-1 tabular-nums">
                      <span><span className="text-red-500">●</span> {r.p}g</span>
                      <span><span className="text-amber-500">●</span> {r.c}g</span>
                      <span><span className="text-blue-500">●</span> {r.f}g</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 mb-3">{t('landing.recipes.eyebrow', lang)}</p>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-gray-900 mb-5" style={{ letterSpacing: '-0.02em' }}>
              {t('landing.recipes.title1', lang)}<br />
              <span className="text-gray-400">{t('landing.recipes.title2', lang)}</span>
            </h2>
            <p className="text-[14px] text-gray-600 leading-relaxed mb-6">{t('landing.recipes.desc', lang)}</p>
            <div className="grid grid-cols-2 gap-3">
              {[{ i: <Zap className="w-4 h-4" />, ...b1 }, { i: <Heart className="w-4 h-4" />, ...b2 }].map((b, i) => (
                <div key={i} className="rounded-md p-3 bg-white" style={{ border: '1px solid #E8E5DE' }}>
                  <div className="text-emerald-700 mb-1.5">{b.i}</div>
                  <div className="text-[12px] font-semibold text-gray-900">{b.t}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">{b.d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── WORKFLOW ─────────────────────────────────────────────────────────── */
function Workflow({ lang }: Props) {
  const steps = t('landing.workflow.steps', lang) as { title: string; desc: string }[];
  const icons = [<Users className="w-4 h-4" />, <TrendingUp className="w-4 h-4" />, <Sparkles className="w-4 h-4" />, <FileText className="w-4 h-4" />];
  return (
    <section id="flujo" className="py-24 md:py-32" style={{ backgroundColor: '#1A1815', color: '#FAF9F7' }}>
      <div className="max-w-6xl mx-auto px-5">
        <div className="max-w-2xl mb-14">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400 mb-3">{t('landing.workflow.eyebrow', lang)}</p>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight" style={{ letterSpacing: '-0.02em' }}>
            {t('landing.workflow.title1', lang)}<br />
            <span className="text-gray-500">{t('landing.workflow.title2', lang)}</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((s, i) => (
            <div key={i} className="relative">
              <div className="rounded-lg p-5 h-full" style={{ backgroundColor: '#252320', border: '1px solid #3A3733' }}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-semibold tracking-wider text-emerald-400">{String(i + 1).padStart(2, '0')}</span>
                  <div className="w-7 h-7 rounded-md flex items-center justify-center text-emerald-400" style={{ backgroundColor: '#1A2E22' }}>
                    {icons[i]}
                  </div>
                </div>
                <h3 className="text-[14px] font-semibold mb-1.5">{s.title}</h3>
                <p className="text-[12px] text-gray-400 leading-relaxed">{s.desc}</p>
              </div>
              {i < steps.length - 1 && <ChevronRight className="hidden lg:block absolute top-1/2 -right-3 -translate-y-1/2 w-4 h-4 text-gray-600" />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── STATS ────────────────────────────────────────────────────────────── */
function Stats({ lang }: Props) {
  const stats = t('landing.stats', lang) as { v: string; l: string }[];
  return (
    <section className="py-20" style={{ backgroundColor: '#FAF9F7' }}>
      <div className="max-w-5xl mx-auto px-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map((s, i) => (
            <div key={i}>
              <div className="text-3xl md:text-4xl font-semibold text-gray-900 tabular-nums" style={{ letterSpacing: '-0.02em' }}>{s.v}</div>
              <div className="text-[11px] text-gray-500 uppercase tracking-wider mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── PRICING WRAP ─────────────────────────────────────────────────────── */
function PricingWrap({ lang }: Props) {
  return (
    <section id="precios" className="py-24 md:py-32" style={{ backgroundColor: '#F4F2EE' }}>
      <div className="max-w-6xl mx-auto px-5">
        <div className="text-center mb-14 max-w-2xl mx-auto">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 mb-3">{t('landing.pricing.eyebrow', lang)}</p>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-gray-900" style={{ letterSpacing: '-0.02em' }}>
            {t('landing.pricing.title1', lang)}<br />
            <span className="text-gray-400">{t('landing.pricing.title2', lang)}</span>
          </h2>
          <p className="mt-5 text-[15px] text-gray-600 leading-relaxed">{t('landing.pricing.desc', lang)}</p>
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
              <img src="/icons/refeit-logo.svg" className="h-7 w-7" alt="" />
              <span className="text-[15px] font-semibold tracking-tight text-gray-900 lowercase" style={{ letterSpacing: '-0.02em' }}>refeit</span>
            </Link>
            <p className="text-[12px] text-gray-500 max-w-sm leading-relaxed">{t('landing.footer.tagline', lang)}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-700 mb-3">{t('landing.footer.product', lang)}</p>
            <ul className="space-y-2 text-[12px] text-gray-500">
              <li><a href="#funcionalidades" className="hover:text-gray-900">{t('publicNav.features', lang)}</a></li>
              <li><a href="#precios" className="hover:text-gray-900">{t('publicNav.pricing', lang)}</a></li>
              <li><Link href="/login" className="hover:text-gray-900">{t('publicNav.login', lang)}</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-700 mb-3">{t('landing.footer.legal', lang)}</p>
            <ul className="space-y-2 text-[12px] text-gray-500">
              <li><Link href="/politica-privacidad" className="hover:text-gray-900">{t('landing.footer.privacy', lang)}</Link></li>
              <li><Link href="/terminos" className="hover:text-gray-900">{t('landing.footer.terms', lang)}</Link></li>
              <li><a href="mailto:hola@refeit.app" className="hover:text-gray-900">{t('landing.footer.contact', lang)}</a></li>
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
