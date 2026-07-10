import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { SlidersHorizontal, Search, X, Layers } from 'lucide-react';
import { useTranslation } from '@/app/shared/useTranslation';

// Definición de tipos
export interface IngredientPortion {
  label: string;
  grams: number;
}

export interface IngredientPrep {
  key: string;
  label: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  portions: IngredientPortion[];
}

export interface Ingredient {
  /** id estable del alimento en la BDD (para matchear con resultados de IA). */
  id?: string;
  name: string;
  quantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  icon?: string;
  /** Porciones caseras provenientes de la BDD (gramos exactos). */
  portions?: IngredientPortion[];
  /** Modos de preparación disponibles (cuando aplica). */
  preparations?: IngredientPrep[];
  /** Nombre base del concepto (sin sufijo de preparación). */
  baseName?: string;
  /** Nombre visual personalizado (solo display; no cambia macros ni id). */
  displayName?: string;
  /** Clave de la preparación actualmente seleccionada. */
  prepKey?: string;
  /** Unidad de medida elegida para la cantidad (g por defecto). quantity siempre en gramos. */
  unit?: { label: string; g: number };
  /** Unidad base del alimento: 'g' (sólidos) o 'ml' (líquidos). quantity siempre en gramos. */
  baseUnit?: 'g' | 'ml';
  /** Sinónimos/variantes regionales para el buscador (no se muestran). */
  keywords?: string[];
  /** Grupo (L1) y subgrupo (L2) para la biblioteca navegable. */
  grupo?: string;
  /** Etiqueta de grupo (L1) ya traducida al idioma activo (para mostrar). */
  grupoLabel?: string;
  subgrupo?: string;
  /** Etiqueta del subgrupo traducida al idioma del paciente (para los chips). */
  subgrupoLabel?: string;
  /** Metadatos para filtros del buscador (no se guardan al seleccionar). */
  grupoIntercambio?: string;
  macroDominante?: string;
  ig?: { valor: number | null; categoria: string };
  flags?: Record<string, boolean>;
  alergenos?: string[];
}

// Grupos (L1) cuyos chips de ayuda se muestran por SUBGRUPO (ej. Proteínas →
// Pollo, Res, Cerdo, Pescados…). El resto de grupos se muestra por grupo (L1).
const CHIP_BY_SUBGROUP = new Set<string>(['Proteínas', 'Lácteos y alternativas vegetales']);

// Filtros clínicos disponibles en el buscador.
// Cada uno define un predicado sobre el ingrediente.
type FilterDef = { key: string; label: string; test: (i: Ingredient) => boolean };
const FILTERS: FilterDef[] = [
  { key: 'apto_diabetico', label: 'Apto diabético', test: (i) => !!i.flags?.apto_diabetico },
  { key: 'ig_bajo', label: 'IG bajo', test: (i) => i.ig?.categoria === 'bajo' || i.ig?.categoria === 'no_aplica' },
  { key: 'sin_gluten', label: 'Sin gluten', test: (i) => !!i.flags?.sin_gluten },
  { key: 'sin_lactosa', label: 'Sin lactosa', test: (i) => !!i.flags?.sin_lactosa },
  { key: 'vegano', label: 'Vegano', test: (i) => !!i.flags?.vegano },
  { key: 'vegetariano', label: 'Vegetariano', test: (i) => !!i.flags?.vegetariano },
  { key: 'keto', label: 'Keto', test: (i) => !!i.flags?.keto },
  { key: 'alto_proteina', label: 'Alto proteína', test: (i) => !!i.flags?.alto_proteina },
  { key: 'bajo_carbo', label: 'Bajo carbo', test: (i) => !!i.flags?.bajo_carbo },
  { key: 'bajo_sodio', label: 'Bajo sodio', test: (i) => !!i.flags?.bajo_sodio },
  { key: 'alto_fibra', label: 'Alto fibra', test: (i) => !!i.flags?.alto_fibra },
];

// Color por grupo (L1): {bg claro, borde, texto} para inactivo; {dark} para activo.
const GROUP_COLORS: Record<string, { bg: string; border: string; text: string; dark: string }> = {
  'Proteínas': { bg: '#FEE2E2', border: '#FCA5A5', text: '#B91C1C', dark: '#DC2626' },
  'Lácteos y alternativas vegetales': { bg: '#DBEAFE', border: '#93C5FD', text: '#1D4ED8', dark: '#2563EB' },
  'Verduras': { bg: '#DCFCE7', border: '#86EFAC', text: '#15803D', dark: '#16A34A' },
  'Frutas': { bg: '#FCE7F3', border: '#F9A8D4', text: '#BE185D', dark: '#DB2777' },
  'Cereales y granos': { bg: '#FEF3C7', border: '#FCD34D', text: '#B45309', dark: '#D97706' },
  'Almidones': { bg: '#FFEDD5', border: '#FDBA74', text: '#C2410C', dark: '#EA580C' },
  'Legumbres': { bg: '#ECFCCB', border: '#BEF264', text: '#4D7C0F', dark: '#65A30D' },
  'Grasas, aceites y frutos secos': { bg: '#FEF9C3', border: '#FDE047', text: '#A16207', dark: '#CA8A04' },
  'Bebidas': { bg: '#CFFAFE', border: '#67E8F9', text: '#0E7490', dark: '#0891B2' },
  'Condimentos y especias': { bg: '#F3E8FF', border: '#D8B4FE', text: '#7E22CE', dark: '#9333EA' },
  'Dulces y postres': { bg: '#FFE4E6', border: '#FDA4AF', text: '#BE123C', dark: '#E11D48' },
  'Harinas y féculas': { bg: '#EFEBE9', border: '#D7CCC8', text: '#6D4C41', dark: '#8D6E63' },
  'Suplementos': { bg: '#EDE9FE', border: '#C4B5FD', text: '#6D28D9', dark: '#7C3AED' },
  'Comida de bebé': { bg: '#CCFBF1', border: '#5EEAD4', text: '#0F766E', dark: '#0D9488' },
};
const groupColor = (l1?: string) => GROUP_COLORS[l1 || ''] || { bg: '#ECFDF5', border: '#6EE7B7', text: '#047857', dark: '#059669' };

interface IngredientTypeaheadProps {
  value: string;
  onChange: (value: string) => void;
  onSelectIngredient: (ingredient: Ingredient) => void;
  ingredients: Ingredient[];
}

const IngredientTypeahead = ({
  value,
  onChange,
  onSelectIngredient,
  ingredients,
}: IngredientTypeaheadProps) => {
  const { t } = useTranslation();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Ingredient[]>([]);
  const [localValue, setLocalValue] = useState(value);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [libQuery, setLibQuery] = useState('');
  const [libGroup, setLibGroup] = useState('');
  // Chip de grupo sugerido + grupo activo (explorando un grupo desde el typeahead).
  type GroupChip = { kind: 'sub' | 'l1'; value: string; label: string; l1: string; icono?: string };
  const [groupChips, setGroupChips] = useState<GroupChip[]>([]);
  const [activeGroup, setActiveGroup] = useState<{ kind: 'sub' | 'l1'; value: string; label: string; l1: string; icono?: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, maxHeight: 320 });

  const toggleFilter = (key: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  // Búsqueda multi-palabra sin orden: cada token debe ser prefijo de alguna
  // palabra del nombre o de las keywords. Ej: "pollo pechuga" → "Pechuga de pollo".
  useEffect(() => {
    const norm = (s: string) =>
      s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const splitWords = (s: string) => norm(s).split(/[^\p{L}\p{N}]+/u).filter(Boolean);
    const q = norm(localValue).trim();
    const qtokens = q.split(/\s+/).filter(Boolean);
    const hasQuery = q.length >= 2;
    const active = FILTERS.filter((f) => activeFilters.has(f.key));
    const passFilters = (ing: Ingredient) => active.length === 0 || active.every((f) => f.test(ing));

    // Explorando un grupo (chip activo): mostrar todo el grupo.
    if (activeGroup) {
      const items = ingredients
        .filter((ing) => passFilters(ing) &&
          (activeGroup.kind === 'sub' ? ing.subgrupo === activeGroup.value : ing.grupo === activeGroup.value))
        .sort((a, b) => a.name.localeCompare(b.name));
      setSuggestions(items.slice(0, 80));
      return;
    }

    if (!hasQuery && active.length === 0) { setSuggestions([]); setGroupChips([]); return; }

    const scored: { ing: Ingredient; score: number }[] = [];
    for (const ing of ingredients) {
      if (!passFilters(ing)) continue;
      if (!hasQuery) { scored.push({ ing, score: 4 }); continue; }

      const name = norm(ing.name);
      const nameWords = splitWords(ing.name);
      const kwWords = (ing.keywords || []).flatMap(splitWords);
      const allWords = [...nameWords, ...kwWords];

      // Todos los tokens deben coincidir (como prefijo) con alguna palabra.
      const everyInName = qtokens.every((tok) => nameWords.some((w) => w.startsWith(tok)));
      const everyInAll = qtokens.every((tok) => allWords.some((w) => w.startsWith(tok)));
      if (!everyInAll) continue;

      // Ranking: coincidencias en el NOMBRE pesan más que en sinónimos/keywords.
      let score: number;
      if (name === q) score = 0;                                              // nombre exacto
      else if (name.startsWith(q)) score = 1;                                 // nombre empieza con
      else if (qtokens.every((tok) => nameWords.includes(tok))) score = 2;    // palabra exacta en nombre
      else if (everyInName) score = 3;                                        // prefijo de palabra del nombre
      else score = 5;                                                         // solo en keyword/grupo
      scored.push({ ing, score });
    }
    // Empate: nombre más corto primero (más relevante), luego alfabético.
    scored.sort((a, b) =>
      a.score - b.score ||
      a.ing.name.length - b.ing.name.length ||
      a.ing.name.localeCompare(b.ing.name)
    );

    // Chips de grupo: filtros de ayuda a partir de los resultados.
    // Algunos grupos (L1) se filtran por SUBGRUPO (ej. Proteínas → Pollo, Res, Cerdo,
    // Pescados…); el resto se filtra solo por GRUPO (Verduras, Dulces, Frutas…).
    if (hasQuery) {
      const cnt: Record<string, number> = {};
      const meta: Record<string, GroupChip> = {};
      for (const { ing } of scored) {
        const useSub = !!(ing.grupo && CHIP_BY_SUBGROUP.has(ing.grupo) && ing.subgrupo);
        if (useSub) {
          const key = 'sub:' + ing.subgrupo;
          cnt[key] = (cnt[key] || 0) + 1;
          if (!meta[key]) meta[key] = { kind: 'sub', value: ing.subgrupo!, label: ing.subgrupoLabel || ing.subgrupo!, l1: ing.grupo!, icono: ing.icon };
        } else if (ing.grupo) {
          const key = 'l1:' + ing.grupo;
          cnt[key] = (cnt[key] || 0) + 1;
          if (!meta[key]) meta[key] = { kind: 'l1', value: ing.grupo, label: ing.grupoLabel || ing.grupo, l1: ing.grupo, icono: ing.icon };
        }
      }
      const chips = Object.entries(cnt)
        .filter(([, c]) => c >= 2)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([k]) => meta[k]);
      setGroupChips(chips);
    } else {
      setGroupChips([]);
    }

    setSuggestions(scored.slice(0, hasQuery ? 30 : 40).map((s) => s.ing));
  }, [localValue, ingredients, activeFilters, activeGroup]);

  // Sync external value
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (!showSuggestions) return;
    const update = () => {
      if (!inputRef.current) return;
      const rect = inputRef.current.getBoundingClientRect();
      // position: fixed → coordenadas relativas al viewport (sin scrollY).
      // Limitar alto al espacio disponible debajo del input para no salirse del viewport.
      const below = window.innerHeight - rect.bottom - 12;
      setPosition({ top: rect.bottom, left: rect.left, width: rect.width, maxHeight: Math.max(below, 160) });
    };
    update();
    // Reposicionar al hacer scroll (incluido el del modal) o resize.
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [showSuggestions, suggestions.length]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current && !containerRef.current.contains(event.target as Node) &&
        inputRef.current && !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Al elegir un concepto: si tiene preparaciones, aplicamos la primera por defecto.
  const handlePickConcept = (concept: Ingredient) => {
    let resolved: Ingredient = concept;
    if (concept.preparations && concept.preparations.length > 0) {
      const first = concept.preparations[0];
      resolved = {
        name: concept.name,
        baseName: concept.name,
        prepKey: first.key,
        quantity: 100,
        calories: first.calories,
        protein: first.protein,
        carbs: first.carbs,
        fat: first.fat,
        icon: concept.icon,
        portions: first.portions,
        preparations: concept.preparations,
      };
    } else {
      resolved = { ...concept, baseName: concept.name };
    }
    onSelectIngredient(resolved);
    onChange(resolved.name);
    setLocalValue('');
    setShowSuggestions(false);
    setActiveGroup(null);
    setGroupChips([]);
  };

  // Subraya en el nombre las partes que coinciden con cada palabra buscada.
  // fold() mapea cada carácter a su base (sin acentos) conservando la longitud.
  const fold = (s: string) => Array.from(s).map((c) => c.normalize('NFD')[0]).join('');
  const highlightWith = (text: string, rawQuery: string) => {
    const tokens = fold(rawQuery.trim()).toLowerCase().split(/\s+/).filter((t) => t.length >= 2);
    if (tokens.length === 0) return text;
    const ft = fold(text).toLowerCase();
    const mask = new Array(text.length).fill(false);
    for (const tok of tokens) {
      let from = 0;
      while (from <= ft.length) {
        const idx = ft.indexOf(tok, from);
        if (idx < 0) break;
        for (let i = idx; i < idx + tok.length; i++) mask[i] = true;
        from = idx + tok.length;
      }
    }
    if (!mask.some(Boolean)) return text;
    // Agrupar caracteres consecutivos según estén o no resaltados.
    const parts: { on: boolean; text: string }[] = [];
    for (let i = 0; i < text.length; i++) {
      const on = mask[i];
      if (parts.length && parts[parts.length - 1].on === on) parts[parts.length - 1].text += text[i];
      else parts.push({ on, text: text[i] });
    }
    return (
      <>
        {parts.map((p, i) =>
          p.on ? (
            <span key={i} style={{ backgroundColor: '#D1FAE5', color: '#065F46', borderRadius: '2px' }}>{p.text}</span>
          ) : (
            <React.Fragment key={i}>{p.text}</React.Fragment>
          )
        )}
      </>
    );
  };
  const highlightMatch = (text: string) => highlightWith(text, localValue);

  const renderSuggestions = () => {
    const hasChips = groupChips.length > 0 || !!activeGroup;
    if (!showSuggestions || (suggestions.length === 0 && !hasChips)) return null;
    return createPortal(
      <div
        ref={containerRef}
        className="fixed rounded-sm overflow-y-auto z-[9999]"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          width: `${position.width}px`,
          maxHeight: `${position.maxHeight}px`,
          backgroundColor: '#FFFFFF',
          border: '1px solid #E8E5DE',
          boxShadow: '0 12px 32px -4px rgba(0, 0, 0, 0.12), 0 4px 8px -2px rgba(0, 0, 0, 0.06)',
        }}
      >
        {hasChips && (
          <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1.5 px-2.5 py-2" style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #F0EDE8' }}>
            <span className="text-[9px] uppercase tracking-wider" style={{ color: '#A8A29E' }}>Grupos</span>
            {activeGroup ? (() => {
              const c = groupColor(activeGroup.l1);
              return (
                <button
                  type="button"
                  onClick={() => setActiveGroup(null)}
                  className="inline-flex items-center gap-1.5 text-[10px] pl-1 pr-2 py-0.5 rounded-full font-medium shadow-sm"
                  style={{ border: `1px solid ${c.dark}`, backgroundImage: `linear-gradient(135deg, ${c.dark}, ${c.text})`, color: '#FFFFFF' }}
                >
                  {activeGroup.icono
                    ? <img src={`/icons/${activeGroup.icono}.svg`} alt="" className="w-4 h-4 rounded-full bg-white/80 p-px" />
                    : <Layers className="w-3 h-3" />}
                  {activeGroup.label}
                  <X className="w-3 h-3" />
                </button>
              );
            })() : (
              groupChips.map((ch) => {
                const c = groupColor(ch.l1);
                return (
                  <button
                    key={`${ch.kind}:${ch.value}`}
                    type="button"
                    onClick={() => setActiveGroup({ kind: ch.kind, value: ch.value, label: ch.label, l1: ch.l1, icono: ch.icono })}
                    className="inline-flex items-center gap-1.5 text-[10px] pl-1 pr-2 py-0.5 rounded-full font-medium transition-all hover:shadow-sm"
                    style={{ border: `1px solid ${c.border}`, backgroundImage: `linear-gradient(135deg, #FFFFFF, ${c.bg})`, color: c.text }}
                  >
                    {ch.icono
                      ? <img src={`/icons/${ch.icono}.svg`} alt="" className="w-4 h-4" />
                      : <Layers className="w-3 h-3" />}
                    {ch.label}
                  </button>
                );
              })
            )}
          </div>
        )}
        {suggestions.map((suggestion, idx) => {
          return (
            <div
              key={idx}
              className="px-2.5 py-1.5 cursor-pointer transition-colors flex items-center gap-2"
              style={{ borderTop: idx > 0 ? '1px solid #F0EDE8' : 'none' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FAF9F7')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              onClick={() => handlePickConcept(suggestion)}
            >
              {suggestion.icon && (
                <img src={`/icons/${suggestion.icon}.svg`} alt="" className="w-5 h-5 flex-shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium flex items-center gap-1.5" style={{ color: '#2D2B28' }}>
                  <span className="truncate">{highlightMatch(suggestion.name)}</span>
                </div>
                <div className="text-[10px]" style={{ color: '#8B8680' }}>
                  <span>{Math.round(suggestion.protein)}P</span>
                  {' · '}<span>{Math.round(suggestion.carbs)}C</span>
                  {' · '}<span>{Math.round(suggestion.fat)}G</span>
                  {' · '}{Math.round(suggestion.calories)} cal
                </div>
              </div>
            </div>
          );
        })}
      </div>,
      document.body
    );
  };

  // Biblioteca navegable: agrupa todos los ingredientes por grupo (L1).
  const GROUP_ORDER = [
    'Proteínas', 'Lácteos', 'Verduras', 'Frutas', 'Cereales y granos', 'Cereales',
    'Almidones', 'Leguminosas', 'Legumbres',
    'Grasas y aceites', 'Grasas', 'Frutos secos', 'Bebidas',
    'Condimentos y especias', 'Condimentos', 'Dulces y postres', 'Dulces',
    'Suplementos', 'Otros',
  ];

  const renderLibrary = () => {
    if (!showLibrary) return null;
    const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const qtokens = norm(libQuery).trim().split(/\s+/).filter(Boolean);
    const active = FILTERS.filter((f) => activeFilters.has(f.key));

    // Filtra por búsqueda (multi-palabra) + filtros activos (todos los grupos).
    const base = ingredients.filter((ing) => {
      if (active.length > 0 && !active.every((f) => f.test(ing))) return false;
      if (qtokens.length === 0) return true;
      const words = norm(`${ing.name} ${(ing.keywords || []).join(' ')} ${ing.subgrupo || ''}`)
        .split(/[^\p{L}\p{N}]+/u).filter(Boolean);
      return qtokens.every((tok) => words.some((w) => w.startsWith(tok)));
    });

    const counts: Record<string, number> = {};
    const groupLabelMap: Record<string, string> = {};
    for (const ing of base) {
      const g = ing.grupo || 'Otros';
      counts[g] = (counts[g] || 0) + 1;
      if (!groupLabelMap[g]) groupLabelMap[g] = ing.grupoLabel || g;
    }
    const groupNames = Object.keys(counts).sort((a, b) => {
      const ia = GROUP_ORDER.indexOf(a); const ib = GROUP_ORDER.indexOf(b);
      return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib) || a.localeCompare(b);
    });

    const list = (libGroup ? base.filter((i) => (i.grupo || 'Otros') === libGroup) : base)
      .sort((a, b) => a.name.localeCompare(b.name));

    const railItem = (label: string, count: number, key: string) => {
      const on = libGroup === key;
      return (
        <button
          key={key || 'all'}
          type="button"
          onClick={() => setLibGroup(key)}
          className="w-full text-left px-3 py-1.5 rounded-sm text-xs flex items-center justify-between gap-2 transition-colors"
          style={{ backgroundColor: on ? '#ECFDF5' : 'transparent', color: on ? '#047857' : '#6B6660', fontWeight: on ? 600 : 400 }}
          onMouseEnter={(e) => { if (!on) e.currentTarget.style.backgroundColor = '#FAF9F7'; }}
          onMouseLeave={(e) => { if (!on) e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          <span className="truncate">{label}</span>
          <span className="text-[10px] tabular-nums" style={{ color: on ? '#10B981' : '#C4C0B8' }}>{count}</span>
        </button>
      );
    };

    return createPortal(
      <div
        className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(45,43,40,0.35)' }}
        onMouseDown={() => setShowLibrary(false)}
      >
        <div
          className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[86vh] flex flex-col"
          style={{ border: '1px solid #E8E5DE' }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid #F0EDE8' }}>
            <span className="text-sm font-semibold" style={{ color: '#2D2B28' }}>Biblioteca de ingredientes</span>
            <span className="text-[11px] text-gray-400">{base.length}</span>
            <button type="button" onClick={() => setShowLibrary(false)} className="ml-auto p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Buscador + filtros */}
          <div className="px-4 pt-3 pb-2 space-y-2 flex-shrink-0" style={{ borderBottom: '1px solid #F0EDE8' }}>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                autoFocus
                value={libQuery}
                onChange={(e) => setLibQuery(e.target.value)}
                placeholder="Buscar en la biblioteca…"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-sm focus:outline-none focus:ring-1 focus:ring-emerald-200"
                style={{ border: '1px solid #E0DCD4', color: '#2D2B28' }}
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {FILTERS.map((f) => {
                const on = activeFilters.has(f.key);
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => toggleFilter(f.key)}
                    className="text-[10px] px-2 py-0.5 rounded-full transition-colors"
                    style={{
                      border: on ? '1px solid #6EE7B7' : '1px solid #E8E5DE',
                      backgroundColor: on ? '#ECFDF5' : '#FAF9F7',
                      color: on ? '#047857' : '#6B6660',
                    }}
                  >
                    {f.label}
                  </button>
                );
              })}
              {activeFilters.size > 0 && (
                <button type="button" onClick={() => setActiveFilters(new Set())} className="text-[10px] px-2 py-0.5 text-gray-400">limpiar</button>
              )}
            </div>
          </div>

          {/* Cuerpo: rail de categorías + lista */}
          <div className="flex flex-1 min-h-0">
            <div className="w-48 flex-shrink-0 overflow-auto py-2 px-2 space-y-0.5" style={{ borderRight: '1px solid #F0EDE8' }}>
              {railItem('Todos', base.length, '')}
              {groupNames.map((gn) => railItem(groupLabelMap[gn] || gn, counts[gn], gn))}
            </div>

            <div className="flex-1 min-w-0 overflow-auto">
              {list.length === 0 ? (
                <div className="text-center text-xs text-gray-400 py-12">Sin resultados</div>
              ) : (
                <ul className="divide-y divide-[#F0EDE8]">
                  {list.map((ing, i) => {
                    const p = Math.round(ing.protein);
                    const c = Math.round(ing.carbs);
                    const f = Math.round(ing.fat);
                    const kcal = Math.round(ing.calories);
                    return (
                      <li key={i}>
                        <button
                          type="button"
                          onClick={() => handlePickConcept(ing)}
                          className="w-full text-left px-4 py-1.5 flex items-center gap-2.5 transition-colors hover:bg-[#FAF9F7]"
                        >
                          {ing.icon ? (
                            <img src={`/icons/${ing.icon}.svg`} alt="" className="w-5 h-5 flex-shrink-0" />
                          ) : (
                            <span className="w-5 h-5 flex-shrink-0" />
                          )}
                          <span className="flex-1 min-w-0 text-xs truncate text-gray-800">{highlightWith(ing.name, libQuery)}</span>
                          <span className="flex-shrink-0 text-[10px] tabular-nums text-gray-500">
                            {p}P · {c}C · {f}G · <span className="font-semibold text-gray-700">{kcal}</span> <span className="text-gray-400">kcal</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          className="flex-1 px-2.5 py-1.5 text-xs rounded-sm focus:outline-none focus:ring-1 focus:ring-emerald-200 transition-shadow"
          style={{ backgroundColor: '#FFFFFF', border: '1px solid #E0DCD4', color: '#2D2B28' }}
          value={localValue}
          onChange={(e) => {
            setLocalValue(e.target.value);
            onChange(e.target.value);
            if (activeGroup) setActiveGroup(null);
          }}
          onFocus={() => setShowSuggestions(true)}
          placeholder={t('consultation.typeahead.placeholder')}
        />
        <button
          type="button"
          onClick={() => setShowLibrary(true)}
          className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-sm transition-colors flex-shrink-0"
          style={{ border: '1px solid #E8E5DE', backgroundColor: '#FFFFFF', color: '#6B6660' }}
          title="Explorar biblioteca de ingredientes"
        >
          <Search className="w-3.5 h-3.5" />
          Biblioteca
        </button>
        <button
          type="button"
          onClick={() => setShowFilters((s) => !s)}
          className="flex items-center gap-1 text-[11px] px-2 py-1.5 rounded-sm transition-colors flex-shrink-0"
          style={{
            border: '1px solid #E8E5DE',
            backgroundColor: activeFilters.size > 0 ? '#ECFDF5' : '#FFFFFF',
            color: activeFilters.size > 0 ? '#047857' : '#6B6660',
          }}
          title="Filtros"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          {activeFilters.size > 0 && (
            <span className="text-[10px] font-semibold">{activeFilters.size}</span>
          )}
        </button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {FILTERS.map((f) => {
            const on = activeFilters.has(f.key);
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => toggleFilter(f.key)}
                className="text-[10px] px-2 py-0.5 rounded-full transition-colors"
                style={{
                  border: on ? '1px solid #6EE7B7' : '1px solid #E8E5DE',
                  backgroundColor: on ? '#ECFDF5' : '#FAF9F7',
                  color: on ? '#047857' : '#6B6660',
                }}
              >
                {f.label}
              </button>
            );
          })}
          {activeFilters.size > 0 && (
            <button
              type="button"
              onClick={() => setActiveFilters(new Set())}
              className="text-[10px] px-2 py-0.5 rounded-full transition-colors"
              style={{ color: '#9CA3AF' }}
            >
              limpiar
            </button>
          )}
        </div>
      )}

      {renderSuggestions()}
      {renderLibrary()}
    </div>
  );
};

export default IngredientTypeahead;
