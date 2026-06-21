'use client'

import React, { useState, useEffect, useMemo } from 'react';
import { usePersistedView } from '@/app/shared/usePersistedView';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import {
  Search, ArrowDown, ArrowUp, Trash2, PlusCircle,
  LayoutGrid, Table as TableIcon, Sparkles,
  AlertCircle, Plus, X
} from 'lucide-react';

import { db, authService } from '@/app/shared/firebase';
import { useAuth } from '@/app/shared/AuthContext';
import { inferCategory } from '@/app/consulta/components/portionsHelper';
import { useTranslation } from '@/app/shared/useTranslation';

interface Ingredient {
  name: string;
  quantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  icon?: string;
}

const MAX_INGREDIENTS = 8000;
const INGREDIENTS_DOC_ID = 'all-ingredients';

type ViewMode = 'kanban' | 'table';
type MacroFilter = 'all' | 'highProtein' | 'highCarb' | 'highFat';
type GroupKey = 'proteina' | 'carbohidrato' | 'grasa' | 'vegetal' | 'otro';

const GROUP_LABELS: Record<GroupKey, string> = {
  proteina:     'proteina',
  carbohidrato: 'carbohidrato',
  grasa:        'grasa',
  vegetal:      'vegetal',
  otro:         'otro',
};
const GROUP_ICONS: Record<GroupKey, string> = {
  proteina:     'bistec',
  carbohidrato: 'arroz',
  grasa:        'aceite',
  vegetal:      'lechuga',
  otro:         'generico',
};
const ALL_GROUPS: GroupKey[] = ['proteina', 'carbohidrato', 'grasa', 'vegetal', 'otro'];

const groupForIngredient = (ing: Ingredient): GroupKey => {
  const cat = inferCategory(ing);
  switch (cat) {
    case 'huevo': case 'carne': case 'ave': case 'pescado': case 'lacteo': case 'legumbre':
      return 'proteina';
    case 'arroz_pasta': case 'cereal_seco': case 'pan': case 'tuberculo': case 'fruta': case 'azucar':
      return 'carbohidrato';
    case 'aceite': case 'frutos_secos': case 'semilla':
      return 'grasa';
    case 'verdura': case 'verdura_hoja':
      return 'vegetal';
    default:
      return 'otro';
  }
};

// % macros (cal de cada macro / cal totales)
const macroPercents = (ing: Ingredient) => {
  const p = (Number(ing.protein) || 0) * 4;
  const c = (Number(ing.carbs)   || 0) * 4;
  const f = (Number(ing.fat)     || 0) * 9;
  const total = p + c + f;
  if (total === 0) return { p: 0, c: 0, f: 0 };
  return { p: (p / total) * 100, c: (c / total) * 100, f: (f / total) * 100 };
};

export default function IngredientsPage() {
  const { t } = useTranslation();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [macroFilter, setMacroFilter] = useState<MacroFilter>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = usePersistedView<ViewMode>('nutri.view.ingredientes', 'kanban');

  // Modales
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<Ingredient | null>(null);
  const [draftError, setDraftError] = useState('');

  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  const { firebaseUser, loading: authLoading } = useAuth();

  // ─── Carga ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return;
    (async () => {
      try {
        if (!firebaseUser) {
          toast.error(t('ingredients.mustLogin'));
          setLoading(false);
          return;
        }
        const ref = doc(db, 'ingredients', `${firebaseUser.uid}_${INGREDIENTS_DOC_ID}`);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setIngredients(snap.data().items || []);
        } else {
          await setDoc(ref, { items: [] });
          setIngredients([]);
        }
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
      const ref = doc(db, 'ingredients', `${u.uid}_${INGREDIENTS_DOC_ID}`);
      await setDoc(ref, { items: next });
    } catch (e) {
      console.error(e);
      toast.error(t('ingredients.saveError'));
    }
  };

  // ─── Filtrado + sort ──────────────────────────────────────────────────────
  const processed = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    let arr = ingredients.filter(ing => {
      const matchesSearch = !term || ing.name?.toLowerCase().includes(term);
      let matchesMacro = true;
      if (macroFilter !== 'all') {
        const m = macroPercents(ing);
        if (macroFilter === 'highProtein') matchesMacro = m.p >= 30;
        if (macroFilter === 'highCarb')    matchesMacro = m.c >= 50;
        if (macroFilter === 'highFat')     matchesMacro = m.f >= 35;
      }
      return matchesSearch && matchesMacro;
    });
    arr.sort((a, b) => {
      const dir = sortDirection === 'asc' ? 1 : -1;
      switch (sortBy) {
        case 'calories': return ((a.calories || 0) - (b.calories || 0)) * dir;
        case 'protein':  return ((a.protein  || 0) - (b.protein  || 0)) * dir;
        case 'carbs':    return ((a.carbs    || 0) - (b.carbs    || 0)) * dir;
        case 'fat':      return ((a.fat      || 0) - (b.fat      || 0)) * dir;
        case 'name':
        default:         return a.name.localeCompare(b.name) * dir;
      }
    });
    return arr;
  }, [ingredients, searchTerm, macroFilter, sortBy, sortDirection]);

  const grouped = useMemo(() => {
    const map: Record<GroupKey, Ingredient[]> = {
      proteina: [], carbohidrato: [], grasa: [], vegetal: [], otro: [],
    };
    processed.forEach(ing => map[groupForIngredient(ing)].push(ing));
    return map;
  }, [processed]);

  const handleSort = (key: string) => {
    if (sortBy === key) setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(key); setSortDirection(key === 'name' ? 'asc' : 'desc'); }
  };

  // ─── CRUD editor ──────────────────────────────────────────────────────────
  const openCreate = () => {
    if (ingredients.length >= MAX_INGREDIENTS) { toast.error(t('ingredients.limitReached')); return; }
    setEditingIndex(null);
    setDraft({ name: '', quantity: 100, calories: 0, protein: 0, carbs: 0, fat: 0 });
    setDraftError('');
    setEditorOpen(true);
  };

  const openEdit = (ing: Ingredient) => {
    const idx = ingredients.findIndex(i => i.name === ing.name);
    if (idx < 0) return;
    setEditingIndex(idx);
    setDraft({ ...ing });
    setDraftError('');
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditingIndex(null);
    setDraft(null);
    setDraftError('');
  };

  const saveDraft = async () => {
    if (!draft) return;
    if (!draft.name.trim()) { setDraftError(t('ingredients.nameRequired')); return; }
    const dup = ingredients.findIndex(i =>
      i.name.toLowerCase() === draft.name.trim().toLowerCase()
    );
    if (dup >= 0 && dup !== editingIndex) { setDraftError(t('ingredients.duplicateName')); return; }
    const next = [...ingredients];
    if (editingIndex === null) next.push({ ...draft, name: draft.name.trim() });
    else next[editingIndex] = { ...draft, name: draft.name.trim() };
    setIngredients(next);
    await persist(next);
    closeEditor();
  };

  const confirmDelete = async () => {
    if (deleteIndex === null) return;
    const next = ingredients.filter((_, i) => i !== deleteIndex);
    setIngredients(next);
    await persist(next);
    setDeleteIndex(null);
  };

  // ─── UI ───────────────────────────────────────────────────────────────────
  const sortOptions = [
    { key: 'name',     label: t('ingredients.sortOpts.name') },
    { key: 'calories', label: t('ingredients.sortOpts.calories') },
    { key: 'protein',  label: t('ingredients.sortOpts.protein') },
    { key: 'carbs',    label: t('ingredients.sortOpts.carbs') },
    { key: 'fat',      label: t('ingredients.sortOpts.fat') },
  ];

  return (
    <div className="bg-cream-pattern px-6 py-5 max-w-[1600px] mx-auto flex flex-col" style={{ height: 'calc(100vh - 44px)' }}>
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-3 mb-5 flex-shrink-0">
        <h1 className="text-base font-semibold text-gray-800 mr-1">{t('ingredients.title')}</h1>
        <span className="text-[11px] text-gray-400 tabular-nums">
          {processed.length} {processed.length === 1 ? t('ingredients.one') : t('ingredients.many')}
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

        {/* Macro filter chips */}
        <div className="flex items-center gap-1">
          {([
            { key: 'all',         label: t('meals.filters.all'),         iconSvg: 'generico' },
            { key: 'highProtein', label: t('meals.filters.highProtein'),  iconSvg: 'bistec'   },
            { key: 'highCarb',    label: t('meals.filters.highCarb'),     iconSvg: 'arroz'    },
            { key: 'highFat',     label: t('meals.filters.highFat'),      iconSvg: 'aceite'   },
          ] as { key: MacroFilter; label: string; iconSvg: string }[]).map(({ key, label, iconSvg }) => (
            <button
              key={key}
              onClick={() => setMacroFilter(key)}
              className={`px-2 py-1 text-[11px] rounded transition-colors flex items-center gap-1.5 ${
                macroFilter === key
                  ? 'text-gray-900 font-medium bg-white border border-gray-200'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <img src={`/icons/${iconSvg}.svg`} alt="" className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-3">
          {/* Sort */}
          <div className="flex items-center gap-0.5">
            <span className="text-[10px] uppercase tracking-wider text-gray-400 mr-1.5 font-semibold">{t('meals.sort')}</span>
            {sortOptions.map(o => (
              <button
                key={o.key}
                onClick={() => handleSort(o.key)}
                className={`px-1.5 py-1 text-[11px] rounded transition-colors ${
                  sortBy === o.key ? 'text-gray-900 font-medium bg-white border border-gray-200' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {o.label}
                {sortBy === o.key && (
                  sortDirection === 'desc'
                    ? <ArrowDown className="w-2.5 h-2.5 inline-block ml-0.5" />
                    : <ArrowUp   className="w-2.5 h-2.5 inline-block ml-0.5" />
                )}
              </button>
            ))}
          </div>

          {/* Toggle vista */}
          <div className="flex items-center rounded p-0.5" style={{ backgroundColor: '#F0EDE8', border: '1px solid #E8E5DE' }}>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1 rounded transition-colors ${viewMode === 'kanban' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              title={t('meals.view.kanban')}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1 rounded transition-colors ${viewMode === 'table' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              title={t('meals.view.table')}
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Contenido ── */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        </div>
      ) : viewMode === 'kanban' ? (
        <KanbanBoard
          grouped={grouped}
          onEdit={openEdit}
          onDelete={(ing) => setDeleteIndex(ingredients.findIndex(i => i.name === ing.name))}
          onCreate={openCreate}
          t={t}
        />
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <IngredientsTable
            ingredients={processed}
            onEdit={openEdit}
            onDelete={(ing) => setDeleteIndex(ingredients.findIndex(i => i.name === ing.name))}
            t={t}
          />
        </div>
      )}

      {/* ── Modal editor ── */}
      {editorOpen && draft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={closeEditor} />
          <div className="relative bg-white rounded-md shadow-2xl w-full max-w-md overflow-hidden flex flex-col">

            <div className="flex items-center justify-between px-5 py-2.5 border-b border-gray-200">
              <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
                {editingIndex === null ? t('ingredients.newItem') : t('ingredients.editItem')}
              </span>
              <button onClick={closeEditor} className="p-1 rounded hover:bg-gray-100 transition-colors">
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 block mb-1.5">{t('ingredients.fields.name')}</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm rounded-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-white border border-gray-300 text-gray-800 placeholder:text-gray-400"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder={t('ingredients.placeholderName')}
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 block mb-1.5">{t('ingredients.fields.calories100')}</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 text-sm rounded-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-white border border-gray-300 text-gray-800 tabular-nums"
                  value={draft.calories === 0 ? '' : draft.calories}
                  placeholder="0"
                  onChange={(e) => setDraft({ ...draft, calories: e.target.value === '' ? 0 : +e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 block mb-1.5">{t('ingredients.fields.protein')}</label>
                  <input
                    type="number"
                    className="w-full px-2 py-2 text-sm rounded-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-white border border-gray-300 text-gray-800 tabular-nums"
                    value={draft.protein === 0 ? '' : draft.protein}
                    placeholder="0"
                    onChange={(e) => setDraft({ ...draft, protein: e.target.value === '' ? 0 : +e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 block mb-1.5">{t('ingredients.fields.carbs')}</label>
                  <input
                    type="number"
                    className="w-full px-2 py-2 text-sm rounded-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-white border border-gray-300 text-gray-800 tabular-nums"
                    value={draft.carbs === 0 ? '' : draft.carbs}
                    placeholder="0"
                    onChange={(e) => setDraft({ ...draft, carbs: e.target.value === '' ? 0 : +e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 block mb-1.5">{t('ingredients.fields.fat')}</label>
                  <input
                    type="number"
                    className="w-full px-2 py-2 text-sm rounded-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-white border border-gray-300 text-gray-800 tabular-nums"
                    value={draft.fat === 0 ? '' : draft.fat}
                    placeholder="0"
                    onChange={(e) => setDraft({ ...draft, fat: e.target.value === '' ? 0 : +e.target.value })}
                  />
                </div>
              </div>

              {draftError && (
                <p className="text-[11px] text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {draftError}
                </p>
              )}
            </div>

            <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-2">
              {editingIndex !== null ? (
                <button
                  onClick={() => { setDeleteIndex(editingIndex); closeEditor(); }}
                  className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title={t('ingredients.actions.delete')}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              ) : <span />}
              <div className="flex items-center gap-2">
                <button onClick={closeEditor} className="text-xs px-3 py-1.5 rounded text-gray-600 hover:bg-gray-100 transition-colors">{t('ingredients.actions.cancel')}</button>
                <button onClick={saveDraft} className="text-xs px-4 py-1.5 rounded font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors">
                  {editingIndex === null ? t('ingredients.actions.create') : t('ingredients.actions.save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmar eliminación ── */}
      {deleteIndex !== null && ingredients[deleteIndex] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteIndex(null)} />
          <div className="relative bg-white rounded-md shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900">{t('ingredients.deleteTitle')}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('ingredients.deleteConfirm')} <span className="font-medium text-gray-700">{ingredients[deleteIndex].name}</span>?
                  </p>
                </div>
              </div>
            </div>
            <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2">
              <button onClick={() => setDeleteIndex(null)} className="text-xs px-3 py-1.5 rounded text-gray-600 hover:bg-gray-100 transition-colors">{t('ingredients.actions.cancel')}</button>
              <button onClick={confirmDelete} className="text-xs px-4 py-1.5 rounded font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors">{t('ingredients.actions.delete')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Kanban ─────────────────────────────────────────────────────────────────
const KanbanBoard: React.FC<{
  grouped: Record<GroupKey, Ingredient[]>;
  onEdit: (i: Ingredient) => void;
  onDelete: (i: Ingredient) => void;
  onCreate: () => void;
  t: (k: string) => any;
}> = ({ grouped, onEdit, onDelete, onCreate, t }) => (
  <div className="flex-1 min-h-0 flex gap-3 overflow-x-auto -mx-2 px-2">
    {ALL_GROUPS.map(g => {
      const items = grouped[g];
      const iconSvg = GROUP_ICONS[g];
      return (
        <div
          key={g}
          className="flex-shrink-0 w-72 rounded-md flex flex-col h-full"
          style={{ backgroundColor: '#F4F2EE', border: '1px solid #E8E5DE' }}
        >
          <div className="px-3 py-2 flex items-center justify-between border-b flex-shrink-0" style={{ borderColor: '#E8E5DE' }}>
            <div className="flex items-center gap-2 min-w-0">
              <img src={`/icons/${iconSvg}.svg`} alt="" className="w-5 h-5 flex-shrink-0" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-700 truncate">
                {t(`ingredients.groups.${g}`)}
              </span>
              <span className="text-[10px] text-gray-400 tabular-nums">{items.length}</span>
            </div>
            <button
              onClick={onCreate}
              className="p-0.5 rounded text-gray-400 hover:text-gray-700 hover:bg-white/60 transition-colors"
              title={t('ingredients.newItem')}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {items.length === 0 ? (
              <div className="text-center py-6 text-[10px] uppercase tracking-wider text-gray-400">
                {t('ingredients.empty')}
              </div>
            ) : (
              items.map((ing, idx) => (
                <KanbanCard key={`${ing.name}-${idx}`} ingredient={ing} onEdit={onEdit} onDelete={onDelete} t={t} />
              ))
            )}
          </div>
        </div>
      );
    })}
  </div>
);

const KanbanCard: React.FC<{
  ingredient: Ingredient;
  onEdit: (i: Ingredient) => void;
  onDelete: (i: Ingredient) => void;
  t: (k: string) => any;
}> = ({ ingredient: ing, onEdit, onDelete, t }) => (
  <div
    onClick={() => onEdit(ing)}
    className="group bg-white rounded-md p-2.5 transition-all cursor-pointer hover:shadow-sm"
    style={{ border: '1px solid #E8E5DE' }}
  >
    <div className="flex items-start gap-2">
      <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: '#FAF9F7', border: '1px solid #F0EDE8' }}>
        {ing.icon ? (
          <img src={`/icons/${ing.icon}.svg`} alt="" className="w-5 h-5" />
        ) : (
          <Sparkles className="w-3.5 h-3.5 text-gray-300" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-gray-800 truncate leading-tight" title={ing.name}>{ing.name}</div>
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mt-1 tabular-nums">
          <span className="font-semibold text-gray-700">{Math.round(ing.calories || 0)} <span className="font-normal text-gray-400">kcal</span></span>
          <span className="text-gray-300">·</span>
          <span>{Math.round(ing.protein || 0)}P</span>
          <span className="text-gray-300">·</span>
          <span>{Math.round(ing.carbs || 0)}C</span>
          <span className="text-gray-300">·</span>
          <span>{Math.round(ing.fat || 0)}G</span>
        </div>
      </div>
      <div className="flex items-center -mr-1 -mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(ing); }}
          title="Eliminar"
          className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  </div>
);

// ─── Tabla ──────────────────────────────────────────────────────────────────
const IngredientsTable: React.FC<{
  ingredients: Ingredient[];
  onEdit: (i: Ingredient) => void;
  onDelete: (i: Ingredient) => void;
}> = ({ ingredients, onEdit, onDelete }) => {
  if (ingredients.length === 0) {
    return (
      <div className="text-center py-16 rounded-md text-xs text-gray-400 border border-dashed" style={{ borderColor: '#E8E5DE', backgroundColor: '#FFFFFF' }}>
        No hay ingredientes que mostrar
      </div>
    );
  }
  return (
    <div className="bg-white rounded-md overflow-hidden" style={{ border: '1px solid #E8E5DE' }}>
      <table className="w-full">
        <thead style={{ backgroundColor: '#FAF9F7', borderBottom: '1px solid #E8E5DE' }}>
          <tr className="text-left text-[10px] uppercase tracking-wider text-gray-500">
            <th className="px-3 py-2 font-semibold">{t('ingredients.table.ingredient')}</th>
            <th className="px-3 py-2 font-semibold">{t('ingredients.table.category')}</th>
            <th className="px-2 py-2 font-semibold text-right">P</th>
            <th className="px-2 py-2 font-semibold text-right">C</th>
            <th className="px-2 py-2 font-semibold text-right">G</th>
            <th className="px-3 py-2 font-semibold text-right">{t('meals.table.kcal')}</th>
            <th className="px-2 py-2 font-semibold text-right w-[60px]"></th>
          </tr>
        </thead>
        <tbody>
          {ingredients.map((ing, idx) => {
            const g = groupForIngredient(ing);
            const iconSvg = GROUP_ICONS[g];
            return (
              <tr
                key={`${ing.name}-${idx}`}
                onClick={() => onEdit(ing)}
                className="group cursor-pointer transition-colors"
                style={{ borderTop: '1px solid #F0EDE8' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FAF9F7')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: '#FAF9F7', border: '1px solid #F0EDE8' }}>
                      {ing.icon ? (
                        <img src={`/icons/${ing.icon}.svg`} alt="" className="w-4 h-4" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-gray-300" />
                      )}
                    </div>
                    <span className="font-medium text-gray-800 truncate text-xs">{ing.name}</span>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <img src={`/icons/${iconSvg}.svg`} alt="" className="w-4 h-4" />
                    <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">
                      {t(`ingredients.groups.${g}`)}
                    </span>
                  </div>
                </td>
                <td className="px-2 py-2 text-right tabular-nums text-[11px] text-gray-500">{Math.round(ing.protein || 0)}</td>
                <td className="px-2 py-2 text-right tabular-nums text-[11px] text-gray-500">{Math.round(ing.carbs   || 0)}</td>
                <td className="px-2 py-2 text-right tabular-nums text-[11px] text-gray-500">{Math.round(ing.fat     || 0)}</td>
                <td className="px-3 py-2 text-right tabular-nums text-xs font-semibold text-gray-800">{Math.round(ing.calories || 0)}</td>
                <td className="px-2 py-2 text-right">
                  <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(ing); }}
                      title={t('ingredients.actions.delete')}
                      className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
