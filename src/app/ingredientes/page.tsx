'use client'

import React, { useState, useEffect, useMemo } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { Search, Trash2, PlusCircle, AlertCircle, X, Sparkles } from 'lucide-react';

import { db, authService } from '@/app/shared/firebase';
import { useAuth } from '@/app/shared/AuthContext';
import { inferCategory } from '@/app/consulta/components/portionsHelper';
import { getCommonIngredients, groupLabel } from '@/app/consulta/components/ingredientsData';
import { useTranslation } from '@/app/shared/useTranslation';

type Source = 'refeit' | 'propio';

interface Ingredient {
  name: string;
  quantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  icon?: string;
  grupo?: string;   // L1
  source?: Source;
}

const MAX_INGREDIENTS = 8000;
const INGREDIENTS_DOC_ID = 'all-ingredients';

type SourceFilter = 'all' | 'refeit' | 'propio';

// ── Grupos L1 (orden, etiqueta corta, icono representativo) ──
const L1_GROUPS: { key: string; label: string; icon: string }[] = [
  { key: 'Proteínas', label: 'Proteínas', icon: 'bistec' },
  { key: 'Lácteos y alternativas vegetales', label: 'Lácteos', icon: 'leche' },
  { key: 'Verduras', label: 'Verduras', icon: 'brocoli' },
  { key: 'Frutas', label: 'Frutas', icon: 'manzana' },
  { key: 'Cereales y granos', label: 'Cereales', icon: 'grano' },
  { key: 'Almidones', label: 'Almidones', icon: 'papa' },
  { key: 'Legumbres', label: 'Legumbres', icon: 'frijol' },
  { key: 'Grasas, aceites y frutos secos', label: 'Grasas', icon: 'aceite' },
  { key: 'Bebidas', label: 'Bebidas', icon: 'agua' },
  { key: 'Condimentos y especias', label: 'Condimentos', icon: 'sal' },
  { key: 'Dulces y postres', label: 'Dulces', icon: 'caramelo' },
  { key: 'Harinas y féculas', label: 'Harinas', icon: 'harina' },
  { key: 'Suplementos', label: 'Suplementos', icon: 'suplemento' },
  { key: 'Comida de bebé', label: 'Bebé', icon: 'biberon' },
  { key: 'Otros', label: 'Otros', icon: 'generico' },
];
const L1_META: Record<string, { label: string; icon: string }> =
  Object.fromEntries(L1_GROUPS.map(g => [g.key, { label: g.label, icon: g.icon }]));

// Derivar L1 para ingredientes sin grupo (los propios del usuario).
const deriveL1 = (ing: Ingredient): string => {
  switch (inferCategory(ing)) {
    case 'huevo': case 'carne': case 'ave': case 'pescado': return 'Proteínas';
    case 'lacteo': return 'Lácteos y alternativas vegetales';
    case 'legumbre': return 'Legumbres';
    case 'arroz_pasta': case 'cereal_seco': case 'pan': return 'Cereales y granos';
    case 'tuberculo': return 'Almidones';
    case 'fruta': return 'Frutas';
    case 'verdura': case 'verdura_hoja': return 'Verduras';
    case 'aceite': case 'frutos_secos': case 'semilla': return 'Grasas, aceites y frutos secos';
    case 'azucar': return 'Dulces y postres';
    case 'condimento': return 'Condimentos y especias';
    case 'liquido': return 'Bebidas';
    default: return 'Otros';
  }
};
const groupForIngredient = (ing: Ingredient): string =>
  (ing.grupo && L1_META[ing.grupo]) ? ing.grupo : deriveL1(ing);

const kcalFromMacros = (i: { protein: number; carbs: number; fat: number }) =>
  Math.round((Number(i.protein) || 0) * 4 + (Number(i.carbs) || 0) * 4 + (Number(i.fat) || 0) * 9);

export default function IngredientsPage() {
  const { t, lang } = useTranslation();
  const [propios, setPropios] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [activeGroup, setActiveGroup] = useState<string | null>(null); // null = Todos
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());

  // Modales
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [draft, setDraft] = useState<Ingredient | null>(null);
  const [draftError, setDraftError] = useState('');
  const [deleteName, setDeleteName] = useState<string | null>(null);

  const { firebaseUser, loading: authLoading } = useAuth();

  // Filtros por macro (mismas etiquetas que en Comidas)
  const FILTERS = useMemo(() => ([
    { key: 'prot', label: t('meals.filters.highProtein'), test: (i: Ingredient) => i.calories > 0 && (i.protein * 4) / i.calories >= 0.3 },
    { key: 'carb', label: t('meals.filters.highCarb'), test: (i: Ingredient) => i.calories > 0 && (i.carbs * 4) / i.calories >= 0.5 },
    { key: 'fat', label: t('meals.filters.highFat'), test: (i: Ingredient) => i.calories > 0 && (i.fat * 9) / i.calories >= 0.5 },
  ]), [t]);

  // ── Base Refeit (562 de la BDD curada) — nombres en el idioma de la app ──
  const refeit = useMemo<Ingredient[]>(() => {
    return getCommonIngredients(lang).map((a) => ({
      name: a.name,
      quantity: 100,
      calories: Number(a.calories) || 0,
      protein: Number(a.protein) || 0,
      carbs: Number(a.carbs) || 0,
      fat: Number(a.fat) || 0,
      icon: a.icon,
      grupo: a.grupo,
      source: 'refeit' as const,
    }));
  }, [lang]);

  // ── Carga de propios (Firestore) ──
  useEffect(() => {
    if (authLoading) return;
    (async () => {
      try {
        if (!firebaseUser) { setLoading(false); return; }
        const ref = doc(db, 'ingredients', `${firebaseUser.uid}_${INGREDIENTS_DOC_ID}`);
        const snap = await getDoc(ref);
        if (snap.exists()) setPropios((snap.data().items || []).map((i: Ingredient) => ({ ...i, source: 'propio' as const })));
        else { await setDoc(ref, { items: [] }); setPropios([]); }
      } catch (e) {
        console.error(e);
        toast.error(t('ingredients.loadError'));
      } finally {
        setLoading(false);
      }
    })();
  }, [firebaseUser, authLoading]);

  const persist = async (next: Ingredient[]) => {
    try {
      const u = authService.getCurrentUser();
      if (!u) { toast.error(t('ingredients.mustLogin')); return; }
      const items = next.map(({ source, ...rest }) => rest); // conservamos grupo elegido
      const ref = doc(db, 'ingredients', `${u.uid}_${INGREDIENTS_DOC_ID}`);
      await setDoc(ref, { items });
    } catch (e) {
      console.error(e);
      toast.error(t('ingredients.saveError'));
    }
  };

  // ── Filtrado por origen + búsqueda + filtros macro ──
  const base = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    const active = FILTERS.filter(f => activeFilters.has(f.key));
    let pool: Ingredient[] = [];
    if (sourceFilter === 'refeit') pool = refeit;
    else if (sourceFilter === 'propio') pool = propios;
    else pool = [...propios, ...refeit];
    return pool
      .filter(ing => active.every(f => f.test(ing)))
      .filter(ing => !term || ing.name?.toLowerCase().includes(term))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }, [refeit, propios, searchTerm, sourceFilter, activeFilters, FILTERS]);

  // Conteo por grupo (sobre la base ya filtrada por origen/búsqueda/macro)
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    base.forEach(ing => { const g = groupForIngredient(ing); c[g] = (c[g] || 0) + 1; });
    return c;
  }, [base]);

  const visibleGroups = useMemo(
    () => L1_GROUPS.filter(g => (counts[g.key] || 0) > 0),
    [counts]
  );

  // Lista mostrada (grupo activo o todos)
  const list = useMemo(
    () => activeGroup ? base.filter(ing => groupForIngredient(ing) === activeGroup) : base,
    [base, activeGroup]
  );

  // ── CRUD (solo propios) ──
  const openCreate = () => {
    if (propios.length >= MAX_INGREDIENTS) { toast.error(t('ingredients.limitReached')); return; }
    setEditingName(null);
    setDraft({ name: '', quantity: 100, calories: 0, protein: 0, carbs: 0, fat: 0, grupo: 'Otros', source: 'propio' });
    setDraftError('');
    setEditorOpen(true);
  };

  const openEdit = (ing: Ingredient) => {
    if (ing.source !== 'propio') return; // los de Refeit son de solo lectura
    setEditingName(ing.name);
    setDraft({ ...ing, grupo: groupForIngredient(ing) });
    setDraftError('');
    setEditorOpen(true);
  };

  const closeEditor = () => { setEditorOpen(false); setEditingName(null); setDraft(null); setDraftError(''); };

  const saveDraft = async () => {
    if (!draft) return;
    if (!draft.name.trim()) { setDraftError(t('ingredients.nameRequired')); return; }
    // Normaliza: sin espacios al inicio/fin, un solo espacio entre palabras y
    // primera letra en mayúscula (ej. "  arroz  integral " → "Arroz integral").
    const name = draft.name.trim().replace(/\s+/g, ' ').replace(/^(.)/, (c) => c.toUpperCase());
    const dup = propios.findIndex(i => i.name.toLowerCase() === name.toLowerCase());
    if (dup >= 0 && propios[dup].name !== editingName) { setDraftError(t('ingredients.duplicateName')); return; }
    const clean: Ingredient = { ...draft, name, source: 'propio' };
    let next = [...propios];
    if (editingName === null) next.push(clean);
    else { const idx = next.findIndex(i => i.name === editingName); if (idx >= 0) next[idx] = clean; }
    next.sort((a, b) => a.name.localeCompare(b.name, 'es'));
    setPropios(next);
    await persist(next);
    closeEditor();
  };

  const confirmDelete = async () => {
    if (!deleteName) return;
    const next = propios.filter(i => i.name !== deleteName);
    setPropios(next);
    await persist(next);
    setDeleteName(null);
  };

  const sourceTabs: { key: SourceFilter; label: string }[] = [
    { key: 'all', label: t('ingredients.source.all') },
    { key: 'refeit', label: t('ingredients.source.refeit') },
    { key: 'propio', label: t('ingredients.source.custom') },
  ];

  const toggleFilter = (key: string) =>
    setActiveFilters(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });

  return (
    <div className="bg-cream-pattern px-6 py-5 max-w-[1600px] mx-auto flex flex-col" style={{ height: 'calc(100vh - 44px)' }}>
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-3 mb-3 flex-shrink-0">
        <h1 className="text-base font-semibold text-gray-800 mr-1">{t('ingredients.title')}</h1>
        <span className="text-[11px] text-gray-400 tabular-nums">
          {base.length} {base.length === 1 ? t('ingredients.one') : t('ingredients.many')}
        </span>

        <button
          onClick={openCreate}
          className="ml-2 bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          {t('ingredients.newItem')}
        </button>

        <div className="relative flex-1 max-w-sm ml-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
          <input
            type="text"
            placeholder={t('ingredients.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs rounded w-full focus:outline-none focus:ring-1 focus:ring-emerald-200 transition-shadow"
            style={{ backgroundColor: '#FFFFFF', border: '1px solid #CCC9C3', color: '#2D2B28' }}
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Filtros por macro */}
          {FILTERS.map(f => {
            const on = activeFilters.has(f.key);
            return (
              <button
                key={f.key}
                onClick={() => toggleFilter(f.key)}
                className="text-[10px] px-2 py-1 rounded-full transition-colors"
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
          {/* Toggle de origen */}
          <div className="flex items-center rounded p-0.5 ml-1" style={{ backgroundColor: '#F0EDE8', border: '1px solid #E8E5DE' }}>
            {sourceTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setSourceFilter(tab.key)}
                className={`px-2.5 py-1 text-[11px] rounded transition-colors ${
                  sourceFilter === tab.key ? 'bg-white text-gray-800 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Cuerpo: rail de categorías + lista (estilo biblioteca) ── */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex bg-white rounded-md overflow-hidden" style={{ border: '1px solid #E8E5DE' }}>
          {/* Rail de categorías */}
          <div className="w-72 flex-shrink-0 overflow-y-auto py-2 px-2 space-y-0.5" style={{ borderRight: '1px solid #F0EDE8', backgroundColor: '#FAF9F7' }}>
            <RailItem label={t('ingredients.allGroups')} icon="" count={base.length} active={activeGroup === null} onClick={() => setActiveGroup(null)} />
            {visibleGroups.map(g => (
              <RailItem key={g.key} label={groupLabel(g.key, lang)} icon={g.icon} count={counts[g.key]} active={activeGroup === g.key} onClick={() => setActiveGroup(g.key)} />
            ))}
          </div>

          {/* Lista */}
          <div className="flex-1 min-w-0 overflow-y-auto">
            {list.length === 0 ? (
              <div className="text-center text-xs text-gray-400 py-16">{t('ingredients.noResults')}</div>
            ) : (
              <ul className="divide-y divide-[#F0EDE8]">
                {list.map((ing, idx) => {
                  const isPropio = ing.source === 'propio';
                  return (
                    <li key={`${ing.name}-${idx}`}>
                      <div
                        onClick={() => isPropio && openEdit(ing)}
                        className={`group w-full px-4 py-2 flex items-center gap-3 transition-colors hover:bg-[#FAF9F7] ${isPropio ? 'cursor-pointer' : ''}`}
                      >
                        <div className="w-7 h-7 rounded overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: '#FAF9F7', border: '1px solid #F0EDE8' }}>
                          {ing.icon ? <img src={`/icons/${ing.icon}.svg`} alt="" className="w-5 h-5" /> : <Sparkles className="w-3.5 h-3.5 text-gray-300" />}
                        </div>
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <span className="text-xs text-gray-800 truncate">{ing.name}</span>
                          {isPropio && <span className="text-[8px] uppercase tracking-wider px-1 py-px rounded-sm flex-shrink-0" style={{ backgroundColor: '#ECFDF5', color: '#047857' }}>{t('ingredients.customBadge')}</span>}
                        </div>
                        <span className="flex-shrink-0 text-[10px] tabular-nums text-gray-500">
                          {Math.round(ing.protein || 0)}P · {Math.round(ing.carbs || 0)}C · {Math.round(ing.fat || 0)}G · <span className="font-semibold text-gray-700">{Math.round(ing.calories || 0)}</span> <span className="text-gray-400">kcal</span>
                        </span>
                        {isPropio && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteName(ing.name); }}
                            title={t('ingredients.actions.delete')}
                            className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* ── Modal editor (mejorado) ── */}
      {editorOpen && draft && (
        <IngredientEditor
          draft={draft} setDraft={setDraft}
          editing={editingName !== null}
          error={draftError}
          groups={L1_GROUPS}
          lang={lang}
          onClose={closeEditor}
          onSave={saveDraft}
          onDelete={editingName !== null ? () => { setDeleteName(editingName); closeEditor(); } : undefined}
          t={t}
        />
      )}

      {/* ── Confirmar eliminación ── */}
      {deleteName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteName(null)} />
          <div className="relative bg-white rounded-md shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900">{t('ingredients.deleteTitle')}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('ingredients.deleteConfirm')} <span className="font-medium text-gray-700">{deleteName}</span>?
                  </p>
                </div>
              </div>
            </div>
            <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2">
              <button onClick={() => setDeleteName(null)} className="text-xs px-3 py-1.5 rounded text-gray-600 hover:bg-gray-100 transition-colors">{t('ingredients.actions.cancel')}</button>
              <button onClick={confirmDelete} className="text-xs px-4 py-1.5 rounded font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors">{t('ingredients.actions.delete')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Rail item ────────────────────────────────────────────────────────────────
const RailItem: React.FC<{ label: string; icon: string; count: number; active: boolean; onClick: () => void }> =
  ({ label, icon, count, active, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left px-2.5 py-1.5 rounded-sm text-xs flex items-center gap-2 transition-colors"
      style={{ backgroundColor: active ? '#ECFDF5' : 'transparent', color: active ? '#047857' : '#6B6660', fontWeight: active ? 600 : 400 }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = '#F0EDE8'; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; }}
    >
      {icon ? <img src={`/icons/${icon}.svg`} alt="" className="w-4 h-4 flex-shrink-0" /> : <span className="w-4 h-4 flex-shrink-0" />}
      <span className="flex-1 whitespace-nowrap truncate">{label}</span>
      <span className="text-[10px] tabular-nums flex-shrink-0" style={{ color: active ? '#10B981' : '#C4C0B8' }}>{count}</span>
    </button>
  );

// ─── Editor de ingrediente (modal con más info) ───────────────────────────────
const IngredientEditor: React.FC<{
  draft: Ingredient;
  setDraft: (d: Ingredient) => void;
  editing: boolean;
  error: string;
  groups: { key: string; label: string; icon: string }[];
  lang: 'es' | 'pt';
  onClose: () => void;
  onSave: () => void;
  onDelete?: () => void;
  t: (key: string) => string;
}> = ({ draft, setDraft, editing, error, groups, lang, onClose, onSave, onDelete, t }) => {
  const num = (v: string) => (v === '' ? 0 : Math.max(0, +v));
  const kp = (draft.protein || 0) * 4, kc = (draft.carbs || 0) * 4, kf = (draft.fat || 0) * 9;
  const kt = kp + kc + kf || 1;
  const pP = Math.round((kp / kt) * 100), pC = Math.round((kc / kt) * 100), pF = Math.round((kf / kt) * 100);
  const suggested = kcalFromMacros(draft);
  const calMismatch = suggested > 0 && Math.abs(suggested - (draft.calories || 0)) > Math.max(8, suggested * 0.08);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden flex flex-col" style={{ border: '1px solid #E8E5DE' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#F0EDE8]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FAF9F7', border: '1px solid #F0EDE8' }}>
              {draft.icon ? <img src={`/icons/${draft.icon}.svg`} alt="" className="w-5 h-5" /> : <Sparkles className="w-4 h-4 text-gray-300" />}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-900 truncate">{draft.name.trim() || (editing ? t('ingredients.editItem') : t('ingredients.newItem'))}</div>
              <div className="text-[10px] text-gray-400">{t('ingredients.per100g')}</div>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 transition-colors"><X className="h-4 w-4 text-gray-500" /></button>
        </div>

        <div className="px-5 py-4 space-y-4 overflow-y-auto" style={{ maxHeight: '70vh' }}>
          {/* Nombre + categoría */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 block mb-1.5">{t('ingredients.fields.name')}</label>
              <input
                type="text" autoFocus value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder={t('ingredients.placeholderName')}
                className="w-full h-9 px-3 text-sm rounded-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-white border border-[#E0DCD4] text-gray-800 placeholder:text-gray-400"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 block mb-1.5">{t('ingredients.table.category')}</label>
              <select
                value={draft.grupo || ''}
                onChange={(e) => setDraft({ ...draft, grupo: e.target.value })}
                className="w-full h-9 px-2 text-sm rounded-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-white border border-[#E0DCD4] text-gray-800"
              >
                {groups.map(g => <option key={g.key} value={g.key}>{groupLabel(g.key, lang)}</option>)}
              </select>
            </div>
          </div>

          {/* Macros */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 block mb-1.5">{t('ingredients.macrosPer100')}</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { key: 'protein' as const, label: t('ingredients.fields.protein'), dot: '#EF4444' },
                { key: 'carbs' as const, label: t('ingredients.fields.carbs'), dot: '#F59E0B' },
                { key: 'fat' as const, label: t('ingredients.fields.fat'), dot: '#3B82F6' },
              ]).map(m => (
                <div key={m.key}>
                  <div className="flex items-center gap-1 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: m.dot }} />
                    <span className="text-[10px] text-gray-500">{m.label}</span>
                  </div>
                  <input
                    type="number" min={0} value={draft[m.key] === 0 ? '' : draft[m.key]} placeholder="0"
                    onChange={(e) => setDraft({ ...draft, [m.key]: num(e.target.value) })}
                    className="w-full h-9 px-2 text-sm rounded-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-white border border-[#E0DCD4] text-gray-800 tabular-nums"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Calorías + sugerencia */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 block mb-1.5">{t('ingredients.fields.calories100')}</label>
            <div className="flex items-center gap-2">
              <input
                type="number" min={0} value={draft.calories === 0 ? '' : draft.calories} placeholder="0"
                onChange={(e) => setDraft({ ...draft, calories: num(e.target.value) })}
                className="flex-1 h-9 px-3 text-sm rounded-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-white border border-[#E0DCD4] text-gray-800 tabular-nums"
              />
              {suggested > 0 && (
                <button
                  type="button" onClick={() => setDraft({ ...draft, calories: suggested })}
                  className="text-[11px] px-2.5 py-2 rounded-sm whitespace-nowrap transition-colors"
                  style={{ border: '1px solid #E8E5DE', backgroundColor: calMismatch ? '#FFF7ED' : '#FAF9F7', color: calMismatch ? '#C2410C' : '#6B6660' }}
                  title={t('ingredients.useSuggested')}
                >
                  ≈ {suggested} kcal
                </button>
              )}
            </div>
            {calMismatch && <p className="text-[10px] text-amber-600 mt-1">{t('ingredients.calMismatch')}</p>}
          </div>

          {/* Distribución de macros */}
          <div className="rounded-md px-3 py-2.5" style={{ backgroundColor: '#FAF9F7', border: '1px solid #F0EDE8' }}>
            <div className="flex h-2 rounded-full overflow-hidden mb-2" style={{ backgroundColor: '#F0EDE8' }}>
              <div style={{ width: `${pP}%`, backgroundColor: '#EF4444' }} />
              <div style={{ width: `${pC}%`, backgroundColor: '#F59E0B' }} />
              <div style={{ width: `${pF}%`, backgroundColor: '#3B82F6' }} />
            </div>
            <div className="flex items-center justify-between text-[10px] tabular-nums">
              <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#EF4444' }} /><span className="text-gray-500">{t('plans.proteins')}</span> <span className="font-semibold text-gray-700">{pP}%</span></span>
              <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#F59E0B' }} /><span className="text-gray-500">{t('plans.carbs')}</span> <span className="font-semibold text-gray-700">{pC}%</span></span>
              <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#3B82F6' }} /><span className="text-gray-500">{t('plans.fats')}</span> <span className="font-semibold text-gray-700">{pF}%</span></span>
            </div>
          </div>

          {error && (
            <p className="text-[11px] text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-2">
          {onDelete ? (
            <button onClick={onDelete} className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title={t('ingredients.actions.delete')}>
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          ) : <span />}
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="text-xs px-3 py-1.5 rounded text-gray-600 hover:bg-gray-100 transition-colors">{t('ingredients.actions.cancel')}</button>
            <button onClick={onSave} className="text-xs px-4 py-1.5 rounded font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors">
              {editing ? t('ingredients.actions.save') : t('ingredients.actions.create')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
