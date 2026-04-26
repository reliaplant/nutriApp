import type { Metadata } from 'next';
import LandingPage from './components/LandingPage';
import { t } from '@/app/shared/i18n';

const SITE = 'https://refeit.app';

export const metadata: Metadata = {
  title: t('landing.meta.title', 'es') as string,
  description: t('landing.meta.description', 'es') as string,
  alternates: {
    canonical: `${SITE}/es`,
    languages: {
      'es': `${SITE}/es`,
      'pt': `${SITE}/pt`,
      'x-default': `${SITE}/es`,
    },
  },
};

// '/' actúa como landing por defecto en español. El middleware redirige a /es o /pt
// según Accept-Language, pero si llega aquí mostramos español.
export default function Home() {
  return <LandingPage lang="es" />;
}
import Link from "next/link";
import Pricing from "./components/pricing";
import {
  ArrowRight,
  Sparkles,
  Users,
  Calendar,
  UtensilsCrossed,
  Carrot,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Bookmark,
  FileText,
  Zap,
  Heart,
  Shield,
} from "lucide-react";

export default function Home() {
  return (
    <div style={{ backgroundColor: "#FAF9F7" }} className="min-h-screen text-gray-900 antialiased">
      <Nav />
      <Hero />
      <LogoStrip />
      <Features />
      <MockupSection />
      <RecipeShowcase />
      <Workflow />
      <Stats />
      <PricingWrap />
      <CTA />
      <Footer />
    </div>
  );
}

/* ─── NAV ──────────────────────────────────────────────────────────────── */
function Nav() {
  return (
    <header
      className="sticky top-0 z-40 backdrop-blur-md"
      style={{ backgroundColor: "rgba(250,249,247,0.8)", borderBottom: "1px solid #E8E5DE" }}
    >
      <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <img src="/icons/refeit-logo.svg" alt="" className="h-7 w-7 transition-transform group-hover:scale-105" />
          <span
            className="text-[15px] font-semibold tracking-tight text-gray-900 lowercase"
            style={{ letterSpacing: "-0.02em" }}
          >
            refeit
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-[13px] text-gray-600">
          <a href="#funcionalidades" className="hover:text-gray-900 transition-colors">Funcionalidades</a>
          <a href="#flujo" className="hover:text-gray-900 transition-colors">Cómo funciona</a>
          <a href="#precios" className="hover:text-gray-900 transition-colors">Precios</a>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="text-[13px] text-gray-700 hover:text-gray-900 px-3 py-1.5 transition-colors"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/login"
            className="text-[13px] font-medium text-white bg-gray-900 hover:bg-gray-800 px-3.5 py-1.5 rounded-md transition-colors flex items-center gap-1"
          >
            Empezar gratis
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ─── HERO ─────────────────────────────────────────────────────────────── */
function Hero() {
  // Iconos flotantes de comida
  const floaters = [
    { src: "aguacate", top: "12%", left: "6%", size: 36, rot: -8, delay: "0s" },
    { src: "fresa", top: "22%", right: "8%", size: 30, rot: 12, delay: "0.6s" },
    { src: "brocoli", bottom: "18%", left: "10%", size: 38, rot: 6, delay: "1.2s" },
    { src: "manzana", top: "60%", left: "3%", size: 28, rot: -14, delay: "0.3s" },
    { src: "zanahoria", bottom: "10%", right: "6%", size: 32, rot: 18, delay: "0.9s" },
    { src: "huevo", top: "8%", right: "20%", size: 24, rot: 4, delay: "1.5s" },
    { src: "salmon", bottom: "30%", right: "3%", size: 34, rot: -10, delay: "0.4s" },
    { src: "naranja", top: "70%", right: "18%", size: 26, rot: 8, delay: "1.1s" },
  ];

  return (
    <section className="relative overflow-hidden">
      {/* Floaters absolutos */}
      <div className="absolute inset-0 pointer-events-none hidden md:block">
        {floaters.map((f, i) => (
          <img
            key={i}
            src={`/icons/${f.src}.svg`}
            alt=""
            className="absolute opacity-60 animate-float"
            style={{
              top: f.top as any,
              left: f.left as any,
              right: f.right as any,
              bottom: f.bottom as any,
              width: f.size,
              height: f.size,
              transform: `rotate(${f.rot}deg)`,
              animationDelay: f.delay,
            }}
          />
        ))}
      </div>

      {/* CSS de la animación */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(var(--r,0deg)); }
          50% { transform: translateY(-8px) rotate(var(--r,0deg)); }
        }
        .animate-float { animation: float 5s ease-in-out infinite; }
      `}</style>

      <div className="max-w-5xl mx-auto px-5 pt-16 md:pt-24 pb-12 text-center relative">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium text-emerald-700 mb-6"
          style={{ backgroundColor: "#F0FDF4", border: "1px solid #BBF7D0" }}
        >
          <Sparkles className="w-3 h-3" />
          Nuevo · Generación de planes con IA
        </div>

        <h1
          className="text-4xl md:text-6xl font-semibold tracking-tight text-gray-900 leading-[1.05]"
          style={{ letterSpacing: "-0.03em" }}
        >
          La consulta del nutricionista,<br />
          <span className="text-gray-500">finalmente bien hecha.</span>
        </h1>

        <p className="mt-6 text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Pacientes, planes nutricionales, recetario y seguimiento — en una sola herramienta diseñada
          para que dediques tu tiempo a lo que importa: tus pacientes.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/login"
            className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-md text-[13px] font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            Empezar gratis
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="#funcionalidades"
            className="bg-white hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-md text-[13px] font-medium transition-colors"
            style={{ border: "1px solid #E8E5DE" }}
          >
            Ver funcionalidades
          </Link>
        </div>

        <p className="mt-4 text-[11px] text-gray-500">
          Sin tarjeta de crédito · Configuración en menos de 2 minutos
        </p>
      </div>

      {/* Mockup principal */}
      <div className="max-w-6xl mx-auto px-5 pb-20 relative">
        <HeroMockup />
      </div>
    </section>
  );
}

/* ─── HERO MOCKUP ──────────────────────────────────────────────────────── */
function HeroMockup() {
  return (
    <div
      className="relative rounded-xl overflow-hidden mx-auto"
      style={{
        border: "1px solid #E8E5DE",
        boxShadow:
          "0 32px 64px -20px rgba(0,0,0,0.18), 0 12px 24px -8px rgba(0,0,0,0.08)",
        background: "white",
      }}
    >
      {/* Browser chrome */}
      <div
        className="flex items-center gap-1.5 px-3 py-2"
        style={{ backgroundColor: "#FAF9F7", borderBottom: "1px solid #E8E5DE" }}
      >
        <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
        <div
          className="ml-3 px-3 py-0.5 rounded text-[10px] text-gray-500 mx-auto bg-white"
          style={{ border: "1px solid #E8E5DE" }}
        >
          refeit.app/consulta
        </div>
      </div>

      {/* App nav */}
      <div className="flex items-center gap-1 px-4 h-11 bg-white" style={{ borderBottom: "1px solid #E8E5DE" }}>
        <div className="flex items-center gap-2 mr-6">
          <img src="/icons/refeit-logo.svg" className="h-5 w-5" alt="" />
          <span className="text-[12px] font-semibold lowercase" style={{ letterSpacing: "-0.02em" }}>refeit</span>
        </div>
        {[
          { l: "Pacientes", active: true, icon: <Users className="w-3 h-3" /> },
          { l: "Calendario", icon: <Calendar className="w-3 h-3" /> },
          { l: "Comidas", icon: <UtensilsCrossed className="w-3 h-3" /> },
          { l: "Ingredientes", icon: <Carrot className="w-3 h-3" /> },
        ].map((it, i) => (
          <div
            key={i}
            className={`relative flex items-center gap-1 px-2.5 py-2.5 text-[10px] font-medium ${
              it.active ? "text-emerald-700" : "text-gray-500"
            }`}
          >
            <span className={it.active ? "text-emerald-700" : "text-gray-400"}>{it.icon}</span>
            {it.l}
            {it.active && <span className="absolute left-2 right-2 -bottom-px h-[2px] bg-emerald-600 rounded-full" />}
          </div>
        ))}
      </div>

      {/* Body grid: sidebar + main */}
      <div className="grid grid-cols-12 min-h-[420px]" style={{ backgroundColor: "#FAF9F7" }}>
        {/* Sidebar resumen */}
        <div className="col-span-4 p-4" style={{ borderRight: "1px solid #E8E5DE", backgroundColor: "white" }}>
          <div className="text-[9px] font-semibold uppercase tracking-wider text-gray-500 mb-2">Paciente</div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-semibold text-emerald-700" style={{ backgroundColor: "#F0FDF4" }}>
              MR
            </div>
            <div>
              <div className="text-[12px] font-semibold text-gray-900 leading-tight">María Rodríguez</div>
              <div className="text-[10px] text-gray-500">32 años · 64 kg</div>
            </div>
          </div>

          <div className="text-[9px] font-semibold uppercase tracking-wider text-gray-500 mb-2">Objetivo</div>
          <div className="rounded-md p-2.5 mb-3" style={{ backgroundColor: "#FAF9F7", border: "1px solid #F0EDE8" }}>
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-[10px] text-gray-500">Calorías</span>
              <span className="text-[11px] font-semibold tabular-nums">1,840 kcal</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#F0EDE8" }}>
              <div className="h-full bg-emerald-500" style={{ width: "82%" }} />
            </div>
            <div className="text-[9px] text-gray-500 mt-1 tabular-nums">1,508 / 1,840 kcal</div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 mb-3">
            {[
              { l: "Prot", v: "118g", c: "bg-red-400" },
              { l: "Carb", v: "172g", c: "bg-amber-400" },
              { l: "Grasa", v: "58g", c: "bg-blue-400" },
            ].map((m, i) => (
              <div key={i} className="rounded-md p-1.5" style={{ backgroundColor: "#FAF9F7", border: "1px solid #F0EDE8" }}>
                <div className="flex items-center gap-1 mb-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${m.c}`} />
                  <span className="text-[9px] text-gray-500">{m.l}</span>
                </div>
                <div className="text-[10px] font-semibold tabular-nums">{m.v}</div>
              </div>
            ))}
          </div>

          <div className="text-[9px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Próxima cita</div>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-700">
            <Calendar className="w-3 h-3 text-gray-400" />
            <span className="tabular-nums">Mar 28 abr · 16:30</span>
          </div>
        </div>

        {/* Main: meals */}
        <div className="col-span-8 p-4 space-y-2 overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-[12px] font-semibold text-gray-900">Plan nutricional</h3>
            <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              Generado con IA
            </div>
          </div>

          {[
            { name: "Desayuno", time: "07:30", icon: "huevo", cals: 412, items: ["Avena con frutos rojos", "Yogur griego", "Café"] },
            { name: "Almuerzo", time: "13:00", icon: "plato", cals: 568, items: ["Pollo a la plancha", "Quinoa con verduras", "Aguacate"] },
            { name: "Merienda", time: "17:00", icon: "manzana", cals: 220, items: ["Manzana con almendras"] },
            { name: "Cena", time: "20:30", icon: "salmon", cals: 480, items: ["Salmón al horno", "Brócoli salteado"] },
          ].map((meal, i) => (
            <div
              key={i}
              className="bg-white rounded-md p-2.5 flex items-center gap-3"
              style={{ border: "1px solid #E8E5DE" }}
            >
              <div className="w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#FAF9F7" }}>
                <img src={`/icons/${meal.icon}.svg`} className="w-5 h-5" alt="" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-[11px] font-semibold text-gray-900">{meal.name}</span>
                  <span className="text-[9px] text-gray-400 tabular-nums">{meal.time}</span>
                </div>
                <div className="text-[10px] text-gray-500 truncate">{meal.items.join(" · ")}</div>
              </div>
              <div className="text-[11px] font-semibold text-gray-700 tabular-nums flex-shrink-0">
                {meal.cals}
                <span className="text-[9px] font-normal text-gray-400 ml-0.5">kcal</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── LOGO STRIP / SOCIAL PROOF ────────────────────────────────────────── */
function LogoStrip() {
  return (
    <section className="border-y" style={{ borderColor: "#E8E5DE", backgroundColor: "#F4F2EE" }}>
      <div className="max-w-5xl mx-auto px-5 py-8 text-center">
        <p className="text-[11px] font-medium uppercase tracking-wider text-gray-500 mb-4">
          Confían en nosotros nutricionistas de
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
          <span>+ 200 consultas</span>
        </div>
      </div>
    </section>
  );
}

/* ─── FEATURES ─────────────────────────────────────────────────────────── */
function Features() {
  const items = [
    {
      icon: <Users className="w-4 h-4" strokeWidth={1.75} />,
      title: "Gestión de pacientes",
      desc: "Historial clínico, antropometría, fotos de evolución y notas — todo en un perfil limpio.",
      tag: "Kanban + tabla",
    },
    {
      icon: <UtensilsCrossed className="w-4 h-4" strokeWidth={1.75} />,
      title: "Planes con opciones",
      desc: "Cada comida con varias alternativas equivalentes. Tu paciente elige, tú controlas los macros.",
      tag: "Multi-opción",
    },
    {
      icon: <Sparkles className="w-4 h-4" strokeWidth={1.75} />,
      title: "Generación con IA",
      desc: "Un objetivo calórico, un par de preferencias, y la app arma el plan completo en segundos.",
      tag: "Nuevo",
      highlight: true,
    },
    {
      icon: <Bookmark className="w-4 h-4" strokeWidth={1.75} />,
      title: "Recetario reutilizable",
      desc: "Guarda recetas con sus macros calculados y reutilízalas en cualquier consulta. Búsqueda por ingrediente.",
    },
    {
      icon: <Calendar className="w-4 h-4" strokeWidth={1.75} />,
      title: "Calendario integrado",
      desc: "Citas, recordatorios y sincronización. Evita huecos y dobles bookings sin esfuerzo.",
    },
    {
      icon: <FileText className="w-4 h-4" strokeWidth={1.75} />,
      title: "PDF profesional",
      desc: "Exporta el plan listo para enviar al paciente — con tu logo, fotos de las recetas y macros.",
    },
    {
      icon: <Carrot className="w-4 h-4" strokeWidth={1.75} />,
      title: "Base de ingredientes",
      desc: "Más de 1.000 alimentos con sus macros. Crea los tuyos y agrúpalos como prefieras.",
    },
    {
      icon: <TrendingUp className="w-4 h-4" strokeWidth={1.75} />,
      title: "Seguimiento de evolución",
      desc: "Gráficos de peso, medidas y adherencia. Detecta lo que funciona en cada paciente.",
    },
  ];

  return (
    <section id="funcionalidades" className="py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-5">
        <div className="max-w-2xl mb-14">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 mb-3">
            Funcionalidades
          </p>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-gray-900" style={{ letterSpacing: "-0.02em" }}>
            Todo lo que tu consulta necesita.
            <br />
            <span className="text-gray-400">Nada que sobre.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
          {items.map((it, i) => (
            <div
              key={i}
              className="bg-white rounded-lg p-5 transition-all hover:shadow-md group relative"
              style={{ border: "1px solid #E8E5DE" }}
            >
              {it.tag && (
                <span
                  className={`absolute top-3 right-3 text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    it.highlight ? "text-emerald-700 bg-emerald-50" : "text-gray-500 bg-gray-100"
                  }`}
                >
                  {it.tag}
                </span>
              )}
              <div
                className="w-8 h-8 rounded-md flex items-center justify-center mb-3 text-emerald-700"
                style={{ backgroundColor: "#F0FDF4" }}
              >
                {it.icon}
              </div>
              <h3 className="text-[13px] font-semibold text-gray-900 mb-1.5">{it.title}</h3>
              <p className="text-[12px] text-gray-600 leading-relaxed">{it.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── MOCKUP SECTION (kanban) ──────────────────────────────────────────── */
function MockupSection() {
  return (
    <section className="py-24 md:py-32" style={{ backgroundColor: "#F4F2EE" }}>
      <div className="max-w-6xl mx-auto px-5">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 mb-3">Vista Kanban</p>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-gray-900 mb-5" style={{ letterSpacing: "-0.02em" }}>
              Tus pacientes,<br />
              <span className="text-gray-400">organizados como un Trello.</span>
            </h2>
            <p className="text-[14px] text-gray-600 leading-relaxed mb-6">
              Visualiza de un vistazo qué pacientes tienen consulta hoy, esta semana, o han dejado de venir.
              Arrastra, busca, filtra. Sin perderte en una agenda interminable.
            </p>
            <ul className="space-y-2.5">
              {[
                "Filtros por estado, próxima cita, adherencia",
                "Búsqueda instantánea por nombre o teléfono",
                "Vista tabla cuando necesitas exportar",
              ].map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-[13px] text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Kanban mock */}
          <div
            className="rounded-lg p-3 bg-white"
            style={{
              border: "1px solid #E8E5DE",
              boxShadow: "0 24px 48px -16px rgba(0,0,0,0.12)",
            }}
          >
            <div className="grid grid-cols-3 gap-2">
              {[
                { title: "Hoy", subtitle: "3 citas", color: "#10B981", patients: [
                  { n: "María R.", t: "10:00", initials: "MR" },
                  { n: "Carlos M.", t: "12:30", initials: "CM" },
                  { n: "Lucía F.", t: "16:00", initials: "LF" },
                ]},
                { title: "Esta semana", subtitle: "5 citas", color: "#3B82F6", patients: [
                  { n: "Andrea P.", t: "Mar 28", initials: "AP" },
                  { n: "Diego H.", t: "Mié 29", initials: "DH" },
                ]},
                { title: "Sin agendar", subtitle: "8 pacientes", color: "#F59E0B", patients: [
                  { n: "Pedro G.", t: "hace 12d", initials: "PG" },
                  { n: "Sofía B.", t: "hace 18d", initials: "SB" },
                ]},
              ].map((col, i) => (
                <div key={i} className="rounded-md p-2" style={{ backgroundColor: "#FAF9F7", border: "1px solid #F0EDE8" }}>
                  <div className="flex items-center gap-1.5 mb-2 px-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: col.color }} />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-700">{col.title}</span>
                    <span className="text-[9px] text-gray-400 ml-auto">{col.subtitle}</span>
                  </div>
                  <div className="space-y-1.5">
                    {col.patients.map((p, j) => (
                      <div key={j} className="bg-white rounded p-2 flex items-center gap-2" style={{ border: "1px solid #E8E5DE" }}>
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-semibold text-emerald-700 flex-shrink-0" style={{ backgroundColor: "#F0FDF4" }}>
                          {p.initials}
                        </div>
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

/* ─── RECIPE SHOWCASE ─────────────────────────────────────────────────── */
function RecipeShowcase() {
  const recipes = [
    { name: "Bowl de quinoa", icon: "plato", cat: "Almuerzo", kcal: 540, p: 32, c: 58, f: 18 },
    { name: "Salmón al horno", icon: "salmon", cat: "Cena", kcal: 480, p: 38, c: 12, f: 28 },
    { name: "Avena con frutos", icon: "fresa", cat: "Desayuno", kcal: 320, p: 12, c: 48, f: 8 },
    { name: "Pollo + brócoli", icon: "brocoli", cat: "Almuerzo", kcal: 420, p: 42, c: 22, f: 14 },
  ];

  return (
    <section className="py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-5">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Recipes grid mock */}
          <div className="order-2 lg:order-1">
            <div
              className="rounded-lg p-4 bg-white"
              style={{ border: "1px solid #E8E5DE", boxShadow: "0 24px 48px -16px rgba(0,0,0,0.10)" }}
            >
              <div className="flex items-center justify-between mb-3 pb-2" style={{ borderBottom: "1px solid #F0EDE8" }}>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: "#F0FDF4" }}>
                    <Bookmark className="w-3 h-3 text-emerald-700" />
                  </div>
                  <span className="text-[12px] font-semibold text-gray-900">Recetario</span>
                </div>
                <span className="text-[10px] text-gray-500 tabular-nums">128 recetas</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {recipes.map((r, i) => (
                  <div key={i} className="rounded-md p-3" style={{ border: "1px solid #E8E5DE" }}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <img src={`/icons/${r.icon}.svg`} className="w-3.5 h-3.5" alt="" />
                        <span className="text-[9px] font-medium text-gray-500 uppercase tracking-wider">{r.cat}</span>
                      </div>
                    </div>
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
            <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 mb-3">Recetario</p>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-gray-900 mb-5" style={{ letterSpacing: "-0.02em" }}>
              Construye una vez,<br />
              <span className="text-gray-400">reutiliza para siempre.</span>
            </h2>
            <p className="text-[14px] text-gray-600 leading-relaxed mb-6">
              Cada receta guarda sus ingredientes, gramajes y macros calculados.
              Búscala por nombre o por ingrediente y arrástrala al plan en un clic.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { i: <Zap className="w-4 h-4" />, t: "Cálculo automático", d: "Macros recalculados al cambiar gramaje" },
                { i: <Heart className="w-4 h-4" />, t: "Categorización", d: "Por momento del día o tipo de plato" },
              ].map((b, i) => (
                <div key={i} className="rounded-md p-3 bg-white" style={{ border: "1px solid #E8E5DE" }}>
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
function Workflow() {
  const steps = [
    { n: "01", title: "Crea el paciente", desc: "Datos básicos, antropometría inicial y objetivo. 30 segundos.", icon: <Users className="w-4 h-4" /> },
    { n: "02", title: "Define el objetivo", desc: "Calorías totales y distribución de macros. Usa un preset o personalízalo.", icon: <TrendingUp className="w-4 h-4" /> },
    { n: "03", title: "Arma el plan", desc: "A mano o con IA. Cada comida con sus opciones intercambiables.", icon: <Sparkles className="w-4 h-4" /> },
    { n: "04", title: "Comparte y haz seguimiento", desc: "PDF profesional, calendario de citas y registro de evolución.", icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <section id="flujo" className="py-24 md:py-32" style={{ backgroundColor: "#1A1815", color: "#FAF9F7" }}>
      <div className="max-w-6xl mx-auto px-5">
        <div className="max-w-2xl mb-14">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400 mb-3">Cómo funciona</p>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight" style={{ letterSpacing: "-0.02em" }}>
            De cero a plan entregado<br />
            <span className="text-gray-500">en 5 minutos.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((s, i) => (
            <div key={i} className="relative">
              <div
                className="rounded-lg p-5 h-full"
                style={{ backgroundColor: "#252320", border: "1px solid #3A3733" }}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-semibold tracking-wider text-emerald-400">{s.n}</span>
                  <div className="w-7 h-7 rounded-md flex items-center justify-center text-emerald-400" style={{ backgroundColor: "#1A2E22" }}>
                    {s.icon}
                  </div>
                </div>
                <h3 className="text-[14px] font-semibold mb-1.5">{s.title}</h3>
                <p className="text-[12px] text-gray-400 leading-relaxed">{s.desc}</p>
              </div>
              {i < steps.length - 1 && (
                <ChevronRight className="hidden lg:block absolute top-1/2 -right-3 -translate-y-1/2 w-4 h-4 text-gray-600" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── STATS ────────────────────────────────────────────────────────────── */
function Stats() {
  return (
    <section className="py-20" style={{ backgroundColor: "#FAF9F7" }}>
      <div className="max-w-5xl mx-auto px-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { v: "200+", l: "Nutricionistas activos" },
            { v: "12k", l: "Pacientes gestionados" },
            { v: "1.000+", l: "Recetas en biblioteca" },
            { v: "98%", l: "Recomendarían refeit" },
          ].map((s, i) => (
            <div key={i}>
              <div className="text-3xl md:text-4xl font-semibold text-gray-900 tabular-nums" style={{ letterSpacing: "-0.02em" }}>
                {s.v}
              </div>
              <div className="text-[11px] text-gray-500 uppercase tracking-wider mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── PRICING ─────────────────────────────────────────────────────────── */
function PricingWrap() {
  return (
    <section id="precios" className="py-24 md:py-32" style={{ backgroundColor: "#F4F2EE" }}>
      <div className="max-w-6xl mx-auto px-5">
        <div className="text-center mb-14 max-w-2xl mx-auto">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 mb-3">Precios</p>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-gray-900" style={{ letterSpacing: "-0.02em" }}>
            Empieza gratis.<br />
            <span className="text-gray-400">Crece cuando lo necesites.</span>
          </h2>
          <p className="mt-5 text-[15px] text-gray-600 leading-relaxed">
            Sin tarjeta de crédito para empezar. Cancela cuando quieras.
            Todos los planes incluyen actualizaciones y soporte.
          </p>
        </div>
        <Pricing />
      </div>
    </section>
  );
}

/* ─── CTA ──────────────────────────────────────────────────────────────── */
function CTA() {
  return (
    <section className="py-24 md:py-32">
      <div className="max-w-4xl mx-auto px-5">
        <div
          className="relative rounded-2xl p-10 md:p-16 text-center overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
            boxShadow: "0 24px 48px -16px rgba(5,150,105,0.35)",
          }}
        >
          {/* iconitos decorativos */}
          <img src="/icons/aguacate.svg" className="absolute top-6 left-6 w-7 h-7 opacity-30" alt="" />
          <img src="/icons/zanahoria.svg" className="absolute top-6 right-8 w-6 h-6 opacity-30" alt="" />
          <img src="/icons/manzana.svg" className="absolute bottom-6 left-10 w-6 h-6 opacity-30" alt="" />
          <img src="/icons/brocoli.svg" className="absolute bottom-8 right-6 w-7 h-7 opacity-30" alt="" />

          <Shield className="w-7 h-7 text-white/80 mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-semibold text-white tracking-tight" style={{ letterSpacing: "-0.02em" }}>
            ¿Listo para ordenar tu consulta?
          </h2>
          <p className="text-emerald-50 mt-4 max-w-lg mx-auto text-[14px]">
            Empieza gratis. Sin tarjeta. Cancela cuando quieras.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 mt-7 bg-white hover:bg-gray-50 text-emerald-700 px-6 py-3 rounded-md text-[13px] font-semibold transition-colors shadow-lg"
          >
            Empezar gratis
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── FOOTER ──────────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer style={{ borderTop: "1px solid #E8E5DE" }}>
      <div className="max-w-6xl mx-auto px-5 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <img src="/icons/refeit-logo.svg" className="h-7 w-7" alt="" />
              <span className="text-[15px] font-semibold tracking-tight text-gray-900 lowercase" style={{ letterSpacing: "-0.02em" }}>
                refeit
              </span>
            </Link>
            <p className="text-[12px] text-gray-500 max-w-sm leading-relaxed">
              La herramienta para que los nutricionistas dediquen su tiempo a sus pacientes,
              no a la administración.
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-700 mb-3">Producto</p>
            <ul className="space-y-2 text-[12px] text-gray-500">
              <li><a href="#funcionalidades" className="hover:text-gray-900">Funcionalidades</a></li>
              <li><a href="#precios" className="hover:text-gray-900">Precios</a></li>
              <li><Link href="/login" className="hover:text-gray-900">Iniciar sesión</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-700 mb-3">Legal</p>
            <ul className="space-y-2 text-[12px] text-gray-500">
              <li><Link href="/politica-privacidad" className="hover:text-gray-900">Privacidad</Link></li>
              <li><Link href="/terminos" className="hover:text-gray-900">Términos de uso</Link></li>
              <li><a href="mailto:hola@refeit.app" className="hover:text-gray-900">Contacto</a></li>
            </ul>
          </div>
        </div>
        <div className="flex items-center justify-between pt-6" style={{ borderTop: "1px solid #F0EDE8" }}>
          <p className="text-[11px] text-gray-400">© {new Date().getFullYear()} refeit · Todos los derechos reservados</p>
          <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Todos los sistemas operativos
          </div>
        </div>
      </div>
    </footer>
  );
}
