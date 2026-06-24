/**
 * AppMockups — mockups estáticos (no interactivos) que representan las pantallas
 * reales de refeit para la landing. Pura presentación; sin estado ni lógica.
 *
 * Paleta: crema #FAF9F7 · bordes #E8E5DE/#F0EDE8 · esmeralda #059669/#10B981
 * Macros: proteína #EF4444 · carbos #F59E0B · grasa #3B82F6
 */

import { Users, Calendar, UtensilsCrossed, ClipboardList, Carrot, Search, Plus, Star, FileText } from 'lucide-react';

const C = {
  cream: '#FAF9F7',
  card: '#FFFFFF',
  border: '#E8E5DE',
  border2: '#F0EDE8',
  panel: '#F4F2EE',
  emerald: '#059669',
  emeraldBg: '#ECFDF5',
  ink: '#1F2937',
  sub: '#6B7280',
  prot: '#EF4444',
  carb: '#F59E0B',
  fat: '#3B82F6',
};

/* ─── Marco de pantalla (sin chrome de navegador) ──────────────────────── */
export function ScreenFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl overflow-hidden w-full" style={{ border: `1px solid ${C.border}`, boxShadow: '0 30px 60px -24px rgba(40,30,20,0.28)', background: C.cream }}>
      {children}
    </div>
  );
}

/* ─── Barra de navegación de la app (mini) ─────────────────────────────── */
function AppTopBar({ active }: { active: string }) {
  const items = [
    { k: 'Pacientes', icon: <Users className="w-3 h-3" strokeWidth={1.75} /> },
    { k: 'Calendario', icon: <Calendar className="w-3 h-3" strokeWidth={1.75} /> },
    { k: 'Comidas', icon: <UtensilsCrossed className="w-3 h-3" strokeWidth={1.75} /> },
    { k: 'Planes', icon: <ClipboardList className="w-3 h-3" strokeWidth={1.75} /> },
    { k: 'Ingredientes', icon: <Carrot className="w-3 h-3" strokeWidth={1.75} /> },
  ];
  return (
    <div className="flex items-center gap-4 px-4" style={{ height: 40, background: 'rgba(255,255,255,0.9)', borderBottom: `1px solid ${C.border}` }}>
      <div className="flex items-center gap-1.5">
        <img src="/icons/refeit-logo.svg?v=2" alt="" className="w-5 h-5" />
        <span className="text-[13px] lowercase" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600, letterSpacing: '-0.03em', color: C.ink }}>refeit</span>
      </div>
      <div className="flex items-center gap-3">
        {items.map((it) => {
          const on = it.k === active;
          return (
            <span key={it.k} className="flex items-center gap-1 text-[10px] font-medium" style={{ color: on ? C.emerald : '#9CA3AF' }}>
              {it.icon}{it.k}
            </span>
          );
        })}
      </div>
      <div className="ml-auto w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-semibold text-emerald-700" style={{ background: C.emeraldBg, border: `1px solid ${C.border}` }}>V</div>
    </div>
  );
}

function macroBar(label: string, pct: number, grams: string, color: string) {
  return (
    <div>
      <div className="flex items-center justify-between text-[9px] mb-1" style={{ color: C.sub }}>
        <span className="font-medium" style={{ color: C.ink }}>{label}</span>
        <span className="tabular-nums">{pct}% · {grams}</span>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: C.border2 }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

/* ═══ 1 · PACIENTES (Kanban) ═══════════════════════════════════════════ */
export function PatientsBoardMockup() {
  const cols = [
    { t: 'Con cita esta semana', c: '#10B981', n: 4, cards: [{ n: 'María R.', d: 'Hoy · 10:00', i: 'MR' }, { n: 'Carlos M.', d: 'Mié · 12:30', i: 'CM' }, { n: 'Lucía F.', d: 'Hoy · 16:00', i: 'LF' }, { n: 'Diego H.', d: 'Jue · 09:30', i: 'DH' }] },
    { t: 'Próxima semana', c: '#3B82F6', n: 3, cards: [{ n: 'Andrea P.', d: 'Lun 30', i: 'AP' }, { n: 'Nora V.', d: 'Mar 1 jul', i: 'NV' }, { n: 'Javier T.', d: 'Jue 3 jul', i: 'JT' }] },
    { t: 'Sin cita', c: '#F59E0B', n: 3, cards: [{ n: 'Pedro G.', d: 'hace 12 d', i: 'PG' }, { n: 'Sofía B.', d: 'hace 18 d', i: 'SB' }, { n: 'Marta L.', d: 'hace 25 d', i: 'ML' }] },
    { t: 'De alta', c: '#9CA3AF', n: 2, cards: [{ n: 'Tomás R.', d: 'Alta · 12 may', i: 'TR' }, { n: 'Elena C.', d: 'Alta · 3 may', i: 'EC' }] },
  ];
  return (
    <div>
      <AppTopBar active="Pacientes" />
      <div className="px-4 pt-3 pb-2 flex items-center gap-2">
        <span className="text-[13px] font-semibold" style={{ color: C.ink }}>Pacientes</span>
        <span className="text-[10px]" style={{ color: C.sub }}>12 pacientes</span>
        <span className="ml-1 inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold text-white" style={{ background: C.emerald }}><Plus className="w-2.5 h-2.5" />Nuevo paciente</span>
        <div className="ml-auto flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px]" style={{ background: C.card, border: `1px solid ${C.border}`, color: C.sub }}><Search className="w-2.5 h-2.5" />Buscar…</div>
      </div>
      <div className="px-4 pb-4 grid grid-cols-4 gap-2">
        {cols.map((col) => (
          <div key={col.t} className="rounded-md p-2" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
            <div className="flex items-center gap-1.5 mb-2 px-0.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: col.c }} />
              <span className="text-[8.5px] font-semibold uppercase tracking-wide truncate" style={{ color: '#4B5563' }}>{col.t}</span>
              <span className="text-[8.5px] ml-auto" style={{ color: '#9CA3AF' }}>{col.n}</span>
            </div>
            <div className="space-y-1.5 min-h-[64px]">
              {col.cards.length === 0 && <div className="text-[8.5px] text-center py-5" style={{ color: '#C4BEB4' }}>Vacío</div>}
              {col.cards.map((p) => (
                <div key={p.n} className="rounded p-1.5 flex items-center gap-1.5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-semibold text-emerald-700 flex-shrink-0" style={{ background: C.emeraldBg }}>{p.i}</div>
                  <div className="min-w-0">
                    <div className="text-[9.5px] font-semibold truncate" style={{ color: C.ink }}>{p.n}</div>
                    <div className="text-[8px]" style={{ color: C.sub }}>{p.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══ 2 · CONSULTA ═════════════════════════════════════════════════════ */
export function ConsultaMockup() {
  const ings = [
    { n: 'Avena en hojuelas', q: '40 g', kcal: 152 },
    { n: 'Plátano', q: '1 ud', kcal: 105 },
    { n: 'Leche descremada', q: '200 ml', kcal: 70 },
    { n: 'Mantequilla de maní', q: '15 g', kcal: 94 },
  ];
  return (
    <div>
      <AppTopBar active="Pacientes" />
      <div className="flex" style={{ minHeight: 300 }}>
        {/* Sidebar */}
        <div className="w-[38%] p-3" style={{ background: C.card, borderRight: `1px solid ${C.border}` }}>
          <div className="flex gap-3 mb-3 text-[9px] font-semibold" style={{ borderBottom: `1px solid ${C.border}` }}>
            <span className="pb-1.5" style={{ color: C.emerald, borderBottom: `2px solid ${C.emerald}` }}>Resumen</span>
            <span className="pb-1.5" style={{ color: '#9CA3AF' }}>Notas</span>
            <span className="pb-1.5" style={{ color: '#9CA3AF' }}>Indicaciones</span>
          </div>
          <p className="text-[8px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#9CA3AF' }}>Datos del paciente</p>
          <div className="grid grid-cols-2 gap-y-1 mb-3">
            {[['Nombre', 'María R.'], ['Edad', '34 años'], ['Altura', '165 cm'], ['Peso', '68 kg']].map(([l, v]) => (
              <div key={l}><div className="text-[8px]" style={{ color: '#9CA3AF' }}>{l}</div><div className="text-[9.5px] font-medium" style={{ color: C.ink }}>{v}</div></div>
            ))}
          </div>
          <div className="rounded-md p-2 mb-3" style={{ background: C.cream, border: `1px solid ${C.border2}` }}>
            <div className="flex justify-between text-[9px]"><span style={{ color: C.sub }}>TDEE</span><span className="font-semibold tabular-nums" style={{ color: C.ink }}>2.050 kcal</span></div>
            <div className="flex justify-between text-[9px] mt-0.5"><span style={{ color: C.sub }}>Objetivo</span><span className="font-semibold tabular-nums" style={{ color: C.emerald }}>1.750 kcal/día</span></div>
          </div>
          <p className="text-[8px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#9CA3AF' }}>Distribución de macros</p>
          <div className="space-y-2">
            {macroBar('Proteína', 30, '131 g', C.prot)}
            {macroBar('Carbohidratos', 45, '197 g', C.carb)}
            {macroBar('Grasas', 25, '49 g', C.fat)}
          </div>
        </div>
        {/* Meals */}
        <div className="flex-1 p-3 space-y-2">
          <div className="rounded-lg" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: `1px solid ${C.border2}` }}>
              <span className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#FEF3C7' }}><span className="w-1.5 h-1.5 rounded-full" style={{ background: C.carb }} /></span>
              <span className="text-[11px] font-semibold" style={{ color: C.ink }}>Desayuno</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: C.cream, color: C.sub }}>08:00</span>
              <span className="ml-auto text-[10px] font-semibold tabular-nums" style={{ color: C.ink }}>421 kcal</span>
            </div>
            <div className="px-3 py-2">
              <div className="flex gap-2 mb-2 text-[9px] font-semibold">
                <span className="px-2 py-0.5 rounded" style={{ background: C.emeraldBg, color: C.emerald }}>Opción 1</span>
                <span className="px-2 py-0.5 rounded" style={{ color: '#9CA3AF', background: C.cream }}>Opción 2</span>
              </div>
              {ings.map((g) => (
                <div key={g.n} className="flex items-center gap-2 py-1 text-[9.5px]" style={{ borderBottom: `1px solid ${C.border2}` }}>
                  <span className="flex-1 truncate" style={{ color: C.ink }}>{g.n}</span>
                  <span className="tabular-nums" style={{ color: C.sub }}>{g.q}</span>
                  <span className="tabular-nums w-12 text-right" style={{ color: C.sub }}>{g.kcal} kcal</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg flex items-center gap-2 px-3 py-2" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <span className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#DBEAFE' }}><span className="w-1.5 h-1.5 rounded-full" style={{ background: C.fat }} /></span>
            <span className="text-[11px] font-semibold" style={{ color: C.ink }}>Almuerzo</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: C.cream, color: C.sub }}>13:00</span>
            <span className="ml-auto text-[10px] font-semibold tabular-nums" style={{ color: C.ink }}>610 kcal</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══ 3 · COMIDAS (Kanban de tarjetas) ═════════════════════════════════ */
export function MealsBoardMockup() {
  const cols = [
    { t: 'Desayuno', dot: C.carb, meals: [{ n: 'Avena con frutas', img: 'fresa', k: 320, u: 8 }, { n: 'Huevos revueltos', img: 'huevo', k: 280, u: 5 }] },
    { t: 'Almuerzo', dot: '#10B981', meals: [{ n: 'Bowl de quinoa', img: 'plato', k: 540, u: 12 }, { n: 'Pollo y brócoli', img: 'brocoli', k: 420, u: 9 }] },
    { t: 'Cena', dot: C.fat, meals: [{ n: 'Salmón al horno', img: 'salmon', k: 480, u: 6 }] },
    { t: 'Snack', dot: '#A855F7', meals: [{ n: 'Yogur y nueces', img: 'manzana', k: 210, u: 4 }] },
  ];
  return (
    <div>
      <AppTopBar active="Comidas" />
      <div className="px-4 pt-3 pb-2 flex items-center gap-2">
        <span className="text-[13px] font-semibold" style={{ color: C.ink }}>Comidas</span>
        <span className="ml-1 inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold text-white" style={{ background: C.emerald }}><Plus className="w-2.5 h-2.5" />Nueva comida</span>
        <div className="ml-auto flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px]" style={{ background: C.card, border: `1px solid ${C.border}`, color: C.sub }}><Search className="w-2.5 h-2.5" />Buscar…</div>
      </div>
      <div className="px-4 pb-4 grid grid-cols-4 gap-2">
        {cols.map((col) => (
          <div key={col.t} className="rounded-md p-2" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
            <div className="flex items-center gap-1.5 mb-2 px-0.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: col.dot }} />
              <span className="text-[8.5px] font-semibold uppercase tracking-wide" style={{ color: '#4B5563' }}>{col.t}</span>
            </div>
            <div className="space-y-1.5">
              {col.meals.map((m) => (
                <div key={m.n} className="rounded p-1.5 flex items-center gap-2" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                  <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: C.cream, border: `1px solid ${C.border2}` }}>
                    <img src={`/icons/${m.img}.svg`} alt="" className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[9.5px] font-semibold leading-tight" style={{ color: C.ink }}>{m.n}</div>
                    <div className="text-[8px] tabular-nums" style={{ color: C.sub }}>{m.k} kcal · {m.u}×</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══ 4 · EDITOR DE COMIDA ═════════════════════════════════════════════ */
export function MealEditorMockup() {
  const ings = [
    { n: 'Quinoa cocida', q: '120 g' },
    { n: 'Garbanzos', q: '80 g' },
    { n: 'Aguacate', q: '1/2 ud' },
    { n: 'Tomate cherry', q: '60 g' },
    { n: 'Aceite de oliva', q: '10 ml' },
  ];
  return (
    <div className="p-4">
      <div className="rounded-xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: `1px solid ${C.border2}` }}>
          <span className="text-[12px] font-semibold" style={{ color: C.ink }}>Editar comida</span>
          <span className="text-[10px] px-2 py-1 rounded-md text-white font-semibold" style={{ background: C.emerald }}>Guardar</span>
        </div>
        <div className="grid grid-cols-2 gap-4 p-4">
          <div>
            <div className="rounded-lg flex items-center justify-center mb-3" style={{ height: 120, background: C.cream, border: `1px solid ${C.border2}` }}>
              <img src="/icons/plato.svg" alt="" className="w-16 h-16" />
            </div>
            <div className="text-[8px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#9CA3AF' }}>Nombre</div>
            <div className="text-[12px] font-semibold mb-3" style={{ color: C.ink }}>Bowl de quinoa y garbanzos</div>
            <div className="rounded-md p-2.5" style={{ background: C.cream, border: `1px solid ${C.border2}` }}>
              <div className="flex items-baseline gap-1 mb-2"><span className="text-[16px] font-bold tabular-nums" style={{ color: C.ink }}>540</span><span className="text-[9px]" style={{ color: C.sub }}>kcal</span></div>
              <div className="space-y-1.5">
                {macroBar('Proteína', 24, '32 g', C.prot)}
                {macroBar('Carbohidratos', 43, '58 g', C.carb)}
                {macroBar('Grasas', 33, '18 g', C.fat)}
              </div>
            </div>
          </div>
          <div>
            <div className="text-[8px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#9CA3AF' }}>Ingredientes</div>
            <div className="space-y-1">
              {ings.map((g) => (
                <div key={g.n} className="flex items-center gap-2 rounded-md px-2 py-1.5" style={{ background: C.cream, border: `1px solid ${C.border2}` }}>
                  <Carrot className="w-3 h-3" style={{ color: C.emerald }} />
                  <span className="text-[10px] flex-1 truncate" style={{ color: C.ink }}>{g.n}</span>
                  <span className="text-[9.5px] tabular-nums" style={{ color: C.sub }}>{g.q}</span>
                </div>
              ))}
              <div className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[10px] font-medium" style={{ color: C.emerald, border: `1px dashed ${C.border}` }}>
                <Plus className="w-3 h-3" />Añadir ingrediente
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══ 5 · INGREDIENTES ═════════════════════════════════════════════════ */
export function IngredientsMockup() {
  const groups = [['Proteínas', 'salmon', 142, true], ['Lácteos', 'huevo', 38, false], ['Verduras', 'brocoli', 96, false], ['Frutas', 'fresa', 74, false], ['Cereales', 'arroz', 51, false], ['Legumbres', 'frijol', 23, false]] as const;
  const list = [
    { n: 'Pechuga de pollo', img: 'pechuga_pollo', m: '31P · 0C · 3G · 165 kcal', own: false },
    { n: 'Salmón', img: 'salmon', m: '20P · 0C · 13G · 208 kcal', own: false },
    { n: 'Atún en agua', img: 'atun', m: '26P · 0C · 1G · 116 kcal', own: true },
    { n: 'Huevo', img: 'huevo', m: '13P · 1C · 11G · 155 kcal', own: false },
    { n: 'Lomo de res', img: 'bistec', m: '26P · 0C · 15G · 250 kcal', own: false },
  ];
  return (
    <div>
      <AppTopBar active="Ingredientes" />
      <div className="flex" style={{ minHeight: 280 }}>
        <div className="w-[32%] p-2" style={{ background: C.cream, borderRight: `1px solid ${C.border2}` }}>
          {groups.map(([g, img, n, on]) => (
            <div key={g as string} className="flex items-center gap-1.5 px-2 py-1.5 rounded-md mb-0.5 text-[9.5px]" style={on ? { background: C.emeraldBg, color: C.emerald, fontWeight: 600 } : { color: '#4B5563' }}>
              <img src={`/icons/${img}.svg`} alt="" className="w-3.5 h-3.5" />
              <span className="flex-1 truncate">{g}</span>
              <span className="text-[8.5px] tabular-nums" style={{ color: on ? C.emerald : '#9CA3AF' }}>{n}</span>
            </div>
          ))}
        </div>
        <div className="flex-1 p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[12px] font-semibold" style={{ color: C.ink }}>Ingredientes</span>
            <span className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded-md text-[9.5px] font-semibold text-white" style={{ background: C.emerald }}><Plus className="w-2.5 h-2.5" />Nuevo</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md mb-2 text-[10px]" style={{ background: C.card, border: `1px solid ${C.border}`, color: C.sub }}><Search className="w-3 h-3" />Buscar ingrediente…</div>
          <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
            {list.map((it, i) => (
              <div key={it.n} className="flex items-center gap-2 px-3 py-2" style={{ background: C.card, borderTop: i ? `1px solid ${C.border2}` : undefined }}>
                <img src={`/icons/${it.img}.svg`} alt="" className="w-4 h-4" />
                <span className="text-[10px] font-medium truncate" style={{ color: C.ink }}>{it.n}</span>
                {it.own && <span className="text-[7.5px] font-semibold px-1 py-0.5 rounded" style={{ background: C.emeraldBg, color: C.emerald }}>PROPIO</span>}
                <span className="ml-auto text-[9px] tabular-nums" style={{ color: C.sub }}>{it.m}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══ 6 · PDF del plan ═════════════════════════════════════════════════ */
export function PdfMockup() {
  const ings = [
    ['Avena en hojuelas', '40 g', '152'],
    ['Plátano', '1 ud', '105'],
    ['Leche descremada', '200 ml', '70'],
    ['Mantequilla de maní', '15 g', '94'],
  ];
  return (
    <div className="flex justify-center">
      <div className="w-full max-w-md p-6 rounded-md" style={{ background: '#FFFFFF', boxShadow: '0 30px 60px -22px rgba(40,30,20,0.30)' }}>
        {/* Letterhead */}
        <div className="flex items-start justify-between pb-3 mb-3" style={{ borderBottom: `2px solid ${C.emerald}` }}>
          <div className="flex items-center gap-2">
            <img src="/icons/refeit-logo.svg?v=2" alt="" className="w-7 h-7" />
            <div>
              <div className="text-[11px] font-bold" style={{ color: C.ink }}>Verónica Carvalho</div>
              <div className="text-[8px]" style={{ color: C.sub }}>Nutricionista · Lic. 12345</div>
            </div>
          </div>
          <div className="text-right text-[7.5px]" style={{ color: C.sub }}>
            <div>hola@refeit.com</div>
            <div>+57 300 000 0000</div>
          </div>
        </div>
        <div className="text-[13px] font-bold mb-1" style={{ color: C.ink }}>Plan nutricional</div>
        <div className="grid grid-cols-3 gap-1 mb-4 text-[7.5px]">
          {[['Paciente', 'María R.'], ['Objetivo', '1.750 kcal'], ['Fecha', '23 jun 2026']].map(([l, v]) => (
            <div key={l} className="rounded p-1.5" style={{ background: C.cream }}><div style={{ color: '#9CA3AF' }}>{l}</div><div className="font-semibold" style={{ color: C.ink }}>{v}</div></div>
          ))}
        </div>
        {/* Meal */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: C.emerald }}>Desayuno</span>
          <span className="text-[8px]" style={{ color: C.sub }}>08:00 · 421 kcal</span>
        </div>
        <div className="text-[8px] font-semibold mb-1" style={{ color: C.sub }}>OPCIÓN 1</div>
        <div className="rounded-md overflow-hidden mb-4" style={{ border: `1px solid ${C.border}` }}>
          {ings.map((r, i) => (
            <div key={r[0]} className="flex items-center px-2 py-1 text-[8.5px]" style={{ background: i % 2 ? '#FCFCFB' : '#fff', borderTop: i ? `1px solid ${C.border2}` : undefined }}>
              <span className="flex-1" style={{ color: C.ink }}>{r[0]}</span>
              <span className="tabular-nums w-12 text-right" style={{ color: C.sub }}>{r[1]}</span>
              <span className="tabular-nums w-12 text-right" style={{ color: C.sub }}>{r[2]} kcal</span>
            </div>
          ))}
        </div>
        {/* Signature */}
        <div className="flex justify-end">
          <div className="text-center">
            <div style={{ fontFamily: "'Allura', cursive", fontSize: 22, color: C.ink, lineHeight: 1 }}>Verónica Carvalho</div>
            <div className="text-[7px] mt-1" style={{ color: C.sub }}>Nutricionista</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══ 7 · HISTORIAL DEL PACIENTE ═══════════════════════════════════════ */
export function PatientHistoryMockup() {
  // bandas IMC (de arriba/bajo): bajo peso, normal, sobrepeso, obesidad
  const bands = [
    { y: 0, h: 22, c: '#DBEAFE' },
    { y: 22, h: 46, c: '#DCFCE7' },
    { y: 68, h: 30, c: '#FEF9C3' },
    { y: 98, h: 22, c: '#FFEDD5' },
  ];
  const pts = [[10, 30], [70, 44], [130, 52], [190, 70], [250, 82], [300, 92]];
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join(' ');
  return (
    <div>
      <AppTopBar active="Pacientes" />
      <div className="flex" style={{ minHeight: 280 }}>
        <div className="w-[30%] p-3" style={{ background: C.card, borderRight: `1px solid ${C.border}` }}>
          <div className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-[15px] font-semibold text-emerald-700" style={{ background: C.emeraldBg }}>M</div>
          <div className="text-[11px] font-semibold text-center" style={{ color: C.ink }}>María Rodríguez</div>
          <div className="text-[8.5px] text-center mb-3 inline-flex w-full justify-center"><span className="px-2 py-0.5 rounded-full" style={{ background: C.emeraldBg, color: C.emerald }}>Activo</span></div>
          <div className="space-y-1.5">
            {[['Email', 'maria@email.com'], ['Teléfono', '+57 300 …'], ['Altura', '165 cm'], ['Objetivo', '70 kg']].map(([l, v]) => (
              <div key={l}><div className="text-[8px]" style={{ color: '#9CA3AF' }}>{l}</div><div className="text-[9.5px] font-medium truncate" style={{ color: C.ink }}>{v}</div></div>
            ))}
          </div>
        </div>
        <div className="flex-1 p-3">
          <div className="text-[11px] font-semibold mb-2" style={{ color: C.ink }}>Evolución de peso</div>
          <div className="rounded-lg p-2 mb-3" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <svg viewBox="0 0 320 120" className="w-full" style={{ height: 120 }}>
              {bands.map((b, i) => <rect key={i} x="0" y={b.y} width="320" height={b.h} fill={b.c} opacity="0.6" />)}
              <path d={path} fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="3" fill="#fff" stroke="#10B981" strokeWidth="2" />)}
              <line x1="0" y1="44" x2="320" y2="44" stroke="#EC4899" strokeWidth="1.2" strokeDasharray="4 3" opacity="0.7" />
            </svg>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[['Inicial → actual', '82 → 76 kg'], ['IMC', '24.8 · Normal'], ['Ritmo', '−0,5 kg/sem']].map(([l, v]) => (
              <div key={l} className="rounded-md p-2" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <div className="text-[8px]" style={{ color: '#9CA3AF' }}>{l}</div>
                <div className="text-[10px] font-semibold tabular-nums" style={{ color: C.ink }}>{v}</div>
              </div>
            ))}
          </div>
          {/* Documentos del paciente */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-semibold" style={{ color: C.ink }}>Documentos</span>
            <span className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded-md text-[9.5px] font-semibold" style={{ color: C.emerald, border: `1px solid ${C.border}`, background: C.card }}><Plus className="w-2.5 h-2.5" />Subir archivo</span>
          </div>
          <div className="space-y-1.5">
            {[['Análisis de sangre.pdf', '240 KB'], ['Bioimpedancia.png', '1,2 MB']].map(([n, s]) => (
              <div key={n} className="flex items-center gap-2 rounded-md px-2.5 py-2" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <FileText className="w-3.5 h-3.5" style={{ color: C.emerald }} />
                <span className="text-[10px] font-medium truncate" style={{ color: C.ink }}>{n}</span>
                <span className="ml-auto text-[9px] tabular-nums" style={{ color: C.sub }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══ 8 · PLANES guardados (guardar y reutilizar) ══════════════════════ */
export function PlansLibraryMockup() {
  const plans = [
    { n: 'Pérdida de grasa · 1.500 kcal', tags: ['Déficit', 'Mujer'], d: 'Usado 14×', star: true },
    { n: 'Mantenimiento · 2.000 kcal', tags: ['Balanceado'], d: 'Usado 9×', star: true },
    { n: 'Hipertensión · 1.800 kcal', tags: ['Bajo sodio'], d: 'Usado 6×', star: false },
    { n: 'Ganancia muscular · 2.600 kcal', tags: ['Superávit', 'Alta proteína'], d: 'Usado 5×', star: false },
    { n: 'Keto · 1.700 kcal', tags: ['Keto'], d: 'Usado 3×', star: false },
  ];
  return (
    <div>
      <AppTopBar active="Planes" />
      <div className="px-4 pt-3 pb-2 flex items-center gap-2">
        <span className="text-[13px] font-semibold" style={{ color: C.ink }}>Planes</span>
        <span className="text-[10px]" style={{ color: C.sub }}>5 plantillas</span>
        <span className="ml-1 inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold text-white" style={{ background: C.emerald }}><Plus className="w-2.5 h-2.5" />Guardar plan</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[9.5px] font-medium" style={{ background: '#FEF9C3', color: '#A16207' }}><Star className="w-2.5 h-2.5" fill="#F59E0B" stroke="#F59E0B" />Destacados</span>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px]" style={{ background: C.card, border: `1px solid ${C.border}`, color: C.sub }}><Search className="w-2.5 h-2.5" />Buscar…</div>
        </div>
      </div>
      <div className="px-4 pb-4">
        <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
          {plans.map((p, i) => (
            <div key={p.n} className="flex items-center gap-2 px-3 py-2.5" style={{ background: C.card, borderTop: i ? `1px solid ${C.border2}` : undefined }}>
              <Star className="w-3.5 h-3.5 flex-shrink-0" fill={p.star ? '#F59E0B' : 'none'} stroke={p.star ? '#F59E0B' : '#D1D5DB'} />
              <span className="text-[11px] font-semibold truncate" style={{ color: C.ink }}>{p.n}</span>
              <div className="flex gap-1">
                {p.tags.map((tg) => (
                  <span key={tg} className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: C.emeraldBg, color: C.emerald }}>{tg}</span>
                ))}
              </div>
              <span className="ml-auto text-[9px] tabular-nums" style={{ color: C.sub }}>{p.d}</span>
              <span className="text-[9.5px] font-semibold px-2 py-0.5 rounded-md" style={{ color: C.emerald, border: `1px solid ${C.border}` }}>Reutilizar</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
