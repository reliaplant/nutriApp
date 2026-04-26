'use client'

import React, { useState, useEffect, useMemo } from 'react';
import {
  collection, query, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp
} from 'firebase/firestore';
import {
  getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject
} from 'firebase/storage';
import { db, authService } from '@/app/shared/firebase';
import { useAuth } from '@/app/shared/AuthContext';
import {
  Search, ArrowDown, ArrowUp, Trash2, PlusCircle,
  LayoutGrid, Table as TableIcon, Copy, Image as ImageIcon, Plus,
  Beef, Wheat, Droplet, Sparkles, AlertCircle
} from 'lucide-react';
import MealOptionEditor, { MealOptionValue } from '@/app/consulta/components/MealOptionEditor';
import { COMMON_INGREDIENTS } from '@/app/consulta/components/ingredientsData';
import { categoryIcons, MealCategory } from './constants';
import { SavedMeal } from '@/app/shared/interfaces';
import { useTranslation } from '@/app/shared/useTranslation';

type ViewMode = 'kanban' | 'table';
type MacroFilter = 'all' | 'highProtein' | 'highCarb' | 'highFat';

const ALL_CATEGORIES: MealCategory[] =
  ['desayuno', 'mediaManana', 'almuerzo', 'lunchTarde', 'cena', 'general'];

// % macros (a partir de gramos × 4/4/9 cal)
const macroPercents = (meal: SavedMeal) => {
  const p = (meal.totalNutrition?.protein || 0) * 4;
  const c = (meal.totalNutrition?.carbs   || 0) * 4;
  const f = (meal.totalNutrition?.fat     || 0) * 9;
  const total = p + c + f;
  if (total === 0) return { p: 0, c: 0, f: 0 };
  return { p: (p / total) * 100, c: (c / total) * 100, f: (f / total) * 100 };
};

export default function SavedMealsPage() {
  const { t } = useTranslation();
  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [macroFilter, setMacroFilter] = useState<MacroFilter>('all');
  const [sortBy, setSortBy] = useState<string>('lastUsed');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');

  const [mealToEdit, setMealToEdit] = useState<SavedMeal | null>(null);
  const [mealToDelete, setMealToDelete] = useState<SavedMeal | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Draft del editor (compartido entre crear/editar)
  type EditorDraft = {
    name: string;
    category: MealCategory;
    option: MealOptionValue;
    imageUrl: string | null;
    imageFile: File | null;
    removeExistingImage: boolean;
  };
  const [editorDraft, setEditorDraft] = useState<EditorDraft | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState('');

  const { firebaseUser, loading: authLoading } = useAuth();

  // ─── Carga ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return;
    if (firebaseUser) loadSavedMeals();
    else setLoading(false);
  }, [firebaseUser, authLoading]);

  const loadSavedMeals = async () => {
    setLoading(true);
    setError('');
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        setError(t('meals.loginRequired'));
        setLoading(false);
        return;
      }
      const q = query(
        collection(db, `users/${user.uid}/savedMealOptions`),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const meals: SavedMeal[] = [];
      snapshot.forEach(d => {
        const data = d.data();
        meals.push({
          id: d.id,
          ...data,
          usageCount: data.usageCount || 0,
          lastUsedDate: data.lastUsedDate || data.createdAt
        } as SavedMeal);
      });
      setSavedMeals(meals);
    } catch (err) {
      console.error(err);
      setError(t('meals.loadError'));
    } finally {
      setLoading(false);
    }
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const getTimestamp = (dateField: any): number => {
    if (!dateField) return 0;
    if (typeof dateField.toDate === 'function') return dateField.toDate().getTime();
    if (dateField instanceof Date) return dateField.getTime();
    if (typeof dateField === 'number') return dateField;
    if (typeof dateField === 'string') return new Date(dateField).getTime();
    return 0;
  };

  const calculateRelevanceScore = (_meal: SavedMeal) => 0; // (no longer used)

  // ─── Filtrado + sort transversal ──────────────────────────────────────────
  const processedMeals = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    let arr = savedMeals.filter(meal => {
      const matchesSearch = !term || (
        meal.name?.toLowerCase().includes(term) ||
        meal.mealOption?.content?.toLowerCase().includes(term) ||
        meal.mealOption?.ingredients?.some(i => i.name?.toLowerCase().includes(term))
      );
      let matchesMacro = true;
      if (macroFilter !== 'all') {
        const m = macroPercents(meal);
        if (macroFilter === 'highProtein') matchesMacro = m.p >= 30;
        if (macroFilter === 'highCarb')    matchesMacro = m.c >= 50;
        if (macroFilter === 'highFat')     matchesMacro = m.f >= 35;
      }
      return matchesSearch && matchesMacro;
    });
    arr.sort((a, b) => {
      const dir = sortDirection === 'asc' ? 1 : -1;
      switch (sortBy) {
        case 'name':       return a.name.localeCompare(b.name) * dir;
        case 'calories':   return (a.totalNutrition.calories - b.totalNutrition.calories) * dir;
        case 'usageCount': return ((a.usageCount || 0) - (b.usageCount || 0)) * dir;
        case 'lastUsed':
        default:           return (getTimestamp(a.lastUsedDate) - getTimestamp(b.lastUsedDate)) * dir;
      }
    });
    return arr;
  }, [savedMeals, searchTerm, macroFilter, sortBy, sortDirection]);

  // Agrupar por categoría para kanban
  const mealsByCategory = useMemo(() => {
    const map: Record<MealCategory, SavedMeal[]> = {
      desayuno: [], mediaManana: [], almuerzo: [], lunchTarde: [], cena: [], general: []
    };
    processedMeals.forEach(m => {
      const cat = (ALL_CATEGORIES.includes(m.category as MealCategory) ? m.category : 'general') as MealCategory;
      map[cat].push(m);
    });
    return map;
  }, [processedMeals]);

  const handleSort = (key: string) => {
    if (sortBy === key) setSortDirection(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortBy(key); setSortDirection('desc'); }
  };

  // ─── Acciones ─────────────────────────────────────────────────────────────

  const handleEdit = (meal: SavedMeal) => {
    setMealToEdit(meal);
    setEditorDraft({
      name: meal.name || '',
      category: (meal.category as MealCategory) || 'general',
      option: {
        name: meal.mealOption?.name || meal.name || '',
        content: meal.mealOption?.content || '',
        ingredients: meal.mealOption?.ingredients || [],
        instructions: meal.mealOption?.instructions || '',
      },
      imageUrl: meal.imageUrl || null,
      imageFile: null,
      removeExistingImage: false,
    });
    setIsEditorOpen(true);
  };
  const handleDelete = (meal: SavedMeal) => { setMealToDelete(meal); setIsDeleteConfirmOpen(true); };
  const handleCreate = (preselectCategory?: MealCategory) => {
    setEditorDraft({
      name: '',
      category: preselectCategory || 'general',
      option: { name: '', content: '', ingredients: [], instructions: '' },
      imageUrl: null,
      imageFile: null,
      removeExistingImage: false,
    });
    setIsCreateModalOpen(true);
  };

  const handleDuplicate = async (meal: SavedMeal) => {
    try {
      const user = authService.getCurrentUser();
      if (!user) return;
      const { id, createdAt, lastUsedDate, ...rest } = meal;
      await addDoc(collection(db, `users/${user.uid}/savedMealOptions`), {
        ...rest,
        name: `${meal.name} (${t('meals.copySuffix')})`,
        usageCount: 0,
        createdAt: serverTimestamp(),
        lastUsedDate: serverTimestamp(),
      });
      loadSavedMeals();
    } catch (err) {
      console.error('Error al duplicar comida:', err);
    }
  };

  // ─── Persistencia editor (crear/actualizar) ───────────────────────────────
  const computeTotals = (ingredients: { calories?: number; protein?: number; carbs?: number; fat?: number; quantity?: number }[]) => {
    const sum = (k: 'calories' | 'protein' | 'carbs' | 'fat') =>
      ingredients.reduce((s, i) => s + (Number((i as any)[k] || 0) * Number(i.quantity || 0)) / 100, 0);
    return {
      calories: sum('calories'),
      protein:  sum('protein'),
      carbs:    sum('carbs'),
      fat:      sum('fat'),
    };
  };

  const uploadImageFile = async (file: File): Promise<string | null> => {
    const user = authService.getCurrentUser();
    if (!user) return null;
    const storage = getStorage();
    const id = `meal_${Date.now()}`;
    const ref = storageRef(storage, `users/${user.uid}/mealImages/${id}`);
    await uploadBytes(ref, file);
    return await getDownloadURL(ref);
  };

  const handleSaveEditor = async () => {
    if (!editorDraft) return;
    const user = authService.getCurrentUser();
    if (!user) { setActionError(t('meals.mustLogin')); return; }
    setIsSaving(true);
    setActionError('');
    try {
      // Subir imagen nueva si la hay
      let finalImageUrl: string | null = editorDraft.imageUrl;
      if (editorDraft.imageFile) {
        finalImageUrl = await uploadImageFile(editorDraft.imageFile);
      } else if (editorDraft.removeExistingImage) {
        if (editorDraft.imageUrl) {
          try {
            const storage = getStorage();
            await deleteObject(storageRef(storage, editorDraft.imageUrl));
          } catch (_) { /* ignorar fallo de borrado */ }
        }
        finalImageUrl = null;
      }

      const totalNutrition = computeTotals(editorDraft.option.ingredients || []);
      const payload: any = {
        name: editorDraft.name || editorDraft.option.name || t('meals.noName'),
        category: editorDraft.category,
        imageUrl: finalImageUrl,
        mealOption: {
          name: editorDraft.option.name || '',
          content: editorDraft.option.content || '',
          instructions: editorDraft.option.instructions || '',
          ingredients: editorDraft.option.ingredients || [],
          isSelectedForSummary: true,
        },
        totalNutrition,
      };

      if (mealToEdit) {
        await updateDoc(doc(db, `users/${user.uid}/savedMealOptions`, mealToEdit.id), payload);
      } else {
        await addDoc(collection(db, `users/${user.uid}/savedMealOptions`), {
          ...payload,
          createdAt: serverTimestamp(),
          lastUsedDate: serverTimestamp(),
          usageCount: 0,
        });
      }
      await loadSavedMeals();
      closeEditor();
    } catch (err) {
      console.error('Error al guardar:', err);
      setActionError(t('meals.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!mealToDelete) return;
    const user = authService.getCurrentUser();
    if (!user) return;
    setIsDeleting(true);
    try {
      if (mealToDelete.imageUrl) {
        try {
          const storage = getStorage();
          await deleteObject(storageRef(storage, mealToDelete.imageUrl));
        } catch (_) { /* ignorar */ }
      }
      await deleteDoc(doc(db, `users/${user.uid}/savedMealOptions`, mealToDelete.id));
      await loadSavedMeals();
      setIsDeleteConfirmOpen(false);
      setMealToDelete(null);
    } catch (err) {
      console.error('Error al eliminar:', err);
      setActionError(t('meals.deleteError'));
    } finally {
      setIsDeleting(false);
    }
  };

  const closeEditor = () => {
    setIsEditorOpen(false);
    setIsCreateModalOpen(false);
    setEditorDraft(null);
    setMealToEdit(null);
  };

  const sortOptions = [
    { key: 'lastUsed',   label: t('meals.sortOpts.lastUsed') },
    { key: 'usageCount', label: t('meals.sortOpts.usage') },
    { key: 'calories',   label: t('meals.sortOpts.calories') },
    { key: 'name',       label: t('meals.sortOpts.name') },
  ];

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="bg-cream-pattern px-6 py-5 max-w-[1600px] mx-auto flex flex-col" style={{ height: 'calc(100vh - 44px)' }}>
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-3 mb-5 flex-shrink-0">
        <h1 className="text-base font-semibold text-gray-800 mr-1">{t('meals.title')}</h1>
        <span className="text-[11px] text-gray-400 tabular-nums">
          {processedMeals.length} {processedMeals.length === 1 ? t('meals.mealOne') : t('meals.mealMany')}
        </span>

        <button
          onClick={handleCreate}
          className="ml-2 bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          {t('meals.newMeal')}
        </button>

        <div className="relative flex-1 max-w-sm ml-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
          <input
            type="text"
            placeholder={t('meals.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs rounded w-full focus:outline-none focus:ring-1 focus:ring-emerald-200 transition-shadow"
            style={{ backgroundColor: '#FFFFFF', border: '1px solid #CCC9C3', color: '#2D2B28' }}
          />
        </div>

        {/* Filtros macro */}
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
                    : <ArrowUp className="w-2.5 h-2.5 inline-block ml-0.5" />
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
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm">{error}</div>
      ) : viewMode === 'kanban' ? (
        <KanbanBoard
          mealsByCategory={mealsByCategory}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
          onCreateInCategory={handleCreate}
          t={t}
        />
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <MealsTable
            meals={processedMeals}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            t={t}
          />
        </div>
      )}

      {/* Modal editor (crear o editar) */}
      {(isEditorOpen || isCreateModalOpen) && editorDraft && (
        <MealOptionEditor
          value={editorDraft.option}
          onChange={(opt) => setEditorDraft(d => d ? { ...d, option: opt, name: opt.name || d.name } : d)}
          category={editorDraft.category}
          onCategoryChange={(c) => setEditorDraft(d => d ? { ...d, category: c } : d)}
          imageUrl={editorDraft.removeExistingImage ? null : editorDraft.imageUrl}
          imageFile={editorDraft.imageFile}
          onImageSelect={(f) => setEditorDraft(d => d ? { ...d, imageFile: f, removeExistingImage: false } : d)}
          onImageRemove={() => setEditorDraft(d => d ? { ...d, imageFile: null, removeExistingImage: true } : d)}
          showImageUpload
          commonIngredients={COMMON_INGREDIENTS}
          onClose={closeEditor}
          primaryAction={{
            label: mealToEdit ? t('meals.actions.save') : t('meals.actions.create'),
            onClick: handleSaveEditor,
            loading: isSaving,
            disabled: !editorDraft.option.name && !editorDraft.name,
          }}
          footerLeft={mealToEdit && (
            <button
              onClick={() => { setMealToDelete(mealToEdit); setIsDeleteConfirmOpen(true); }}
              className="p-1.5 rounded transition-colors text-gray-400 hover:text-red-500 hover:bg-red-50"
              title={t('meals.actions.delete')}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        />
      )}

      {/* Confirmar eliminación */}
      {isDeleteConfirmOpen && mealToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !isDeleting && setIsDeleteConfirmOpen(false)} />
          <div className="relative bg-white rounded-md shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900">{t('meals.deleteTitle')}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('meals.deleteConfirm')} <span className="font-medium text-gray-700">{mealToDelete.name || t('meals.deleteThisMeal')}</span>{t('meals.deleteWarning')}
                  </p>
                </div>
              </div>
            </div>
            <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                disabled={isDeleting}
                className="text-xs px-3 py-1.5 rounded text-gray-600 hover:bg-gray-100 transition-colors"
              >
                {t('meals.actions.cancel')}
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="text-xs px-4 py-1.5 rounded font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeleting ? t('meals.actions.deleting') : t('meals.actions.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast de error */}
      {actionError && (
        <div className="fixed bottom-4 right-4 bg-red-50 text-red-700 px-3 py-2 rounded-md shadow-lg text-xs z-50 border border-red-200">
          {actionError}
        </div>
      )}
    </div>
  );
}

// ─── Kanban ─────────────────────────────────────────────────────────────────
const KanbanBoard: React.FC<{
  mealsByCategory: Record<MealCategory, SavedMeal[]>;
  onEdit: (m: SavedMeal) => void;
  onDelete: (m: SavedMeal) => void;
  onDuplicate: (m: SavedMeal) => void;
  onCreateInCategory: (cat: MealCategory) => void;
  t: (k: string) => any;
}> = ({ mealsByCategory, onEdit, onDelete, onDuplicate, onCreateInCategory, t }) => (
  <div className="flex-1 min-h-0 flex gap-3 overflow-x-auto -mx-2 px-2">
    {ALL_CATEGORIES.map(cat => {
      const meals = mealsByCategory[cat];
      return (
        <div
          key={cat}
          className="flex-shrink-0 w-72 rounded-md flex flex-col h-full"
          style={{ backgroundColor: '#F4F2EE', border: '1px solid #E8E5DE' }}
        >
          {/* Header columna — sobrio */}
          <div className="px-3 py-2 flex items-center justify-between border-b flex-shrink-0" style={{ borderColor: '#E8E5DE' }}>
            <div className="flex items-center gap-2 min-w-0">
              <img src={`/icons/${categoryIcons[cat]}.svg`} alt="" className="w-4 h-4 flex-shrink-0" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-700 truncate">
                {t(`meals.categories.${cat}`)}
              </span>
              <span className="text-[10px] text-gray-400 tabular-nums">{meals.length}</span>
            </div>
            <button
              onClick={() => onCreateInCategory(cat)}
              className="p-0.5 rounded text-gray-400 hover:text-gray-700 hover:bg-white/60 transition-colors"
              title={`${t('meals.newIn')} ${t(`meals.categories.${cat}`)}`}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Cards */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {meals.length === 0 ? (
              <button
                onClick={() => onCreateInCategory(cat)}
                className="w-full text-center py-6 text-[10px] uppercase tracking-wider text-gray-400 hover:text-gray-600 border border-dashed rounded-md transition-colors"
                style={{ borderColor: '#D8D4CC' }}
              >
                <Plus className="w-3.5 h-3.5 inline-block mb-0.5" />
                <div>{t('meals.add')}</div>
              </button>
            ) : (
              meals.map(meal => (
                <KanbanCard
                  key={meal.id}
                  meal={meal}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onDuplicate={onDuplicate}
                  t={t}
                />
              ))
            )}
          </div>
        </div>
      );
    })}
  </div>
);

const KanbanCard: React.FC<{
  meal: SavedMeal;
  onEdit: (m: SavedMeal) => void;
  onDelete: (m: SavedMeal) => void;
  onDuplicate: (m: SavedMeal) => void;
  t: (k: string) => any;
}> = ({ meal, onEdit, onDelete, onDuplicate, t }) => {
  const ingCount = meal.mealOption?.ingredients?.length || 0;
  return (
    <div
      onClick={() => onEdit(meal)}
      className="group bg-white rounded-md p-2.5 transition-all cursor-pointer hover:shadow-sm"
      style={{ border: '1px solid #E8E5DE' }}
    >
      <div className="flex items-start gap-2">
        <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: '#FAF9F7', border: '1px solid #F0EDE8' }}>
          {meal.imageUrl ? (
            <img src={meal.imageUrl} alt={meal.name} className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="w-3.5 h-3.5 text-gray-300" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-gray-800 truncate leading-tight" title={meal.name}>
            {meal.name || t('meals.noName')}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mt-1 tabular-nums">
            <span className="font-semibold text-gray-700">{Math.round(meal.totalNutrition?.calories || 0)} <span className="font-normal text-gray-400">kcal</span></span>
            <span className="text-gray-300">·</span>
            <span>{ingCount} ing</span>
            {(meal.usageCount || 0) > 0 && (
              <>
                <span className="text-gray-300">·</span>
                <span className="text-gray-400">{meal.usageCount}×</span>
              </>
            )}
          </div>
        </div>

        {/* Acciones (en hover) */}
        <div className="flex items-center -mr-1 -mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <CardIcon onClick={(e) => { e.stopPropagation(); onDuplicate(meal); }} title={t('meals.actions.duplicate')} icon={<Copy className="w-3 h-3" />} />
          <CardIcon onClick={(e) => { e.stopPropagation(); onDelete(meal); }} title={t('meals.actions.delete')} icon={<Trash2 className="w-3 h-3" />} danger />
        </div>
      </div>
    </div>
  );
};

// ─── Tabla ──────────────────────────────────────────────────────────────────
const MealsTable: React.FC<{
  meals: SavedMeal[];
  onEdit: (m: SavedMeal) => void;
  onDelete: (m: SavedMeal) => void;
  onDuplicate: (m: SavedMeal) => void;
  t: (k: string) => any;
}> = ({ meals, onEdit, onDelete, onDuplicate, t }) => {
  if (meals.length === 0) {
    return (
      <div className="text-center py-16 rounded-md text-xs text-gray-400 border border-dashed" style={{ borderColor: '#E8E5DE', backgroundColor: '#FFFFFF' }}>
        {t('meals.noResults')}
      </div>
    );
  }
  return (
    <div className="bg-white rounded-md overflow-hidden" style={{ border: '1px solid #E8E5DE' }}>
      <table className="w-full">
        <thead style={{ backgroundColor: '#FAF9F7', borderBottom: '1px solid #E8E5DE' }}>
          <tr className="text-left text-[10px] uppercase tracking-wider text-gray-500">
            <th className="px-3 py-2 font-semibold">{t('meals.table.meal')}</th>
            <th className="px-3 py-2 font-semibold">{t('meals.table.category')}</th>
            <th className="px-2 py-2 font-semibold text-center">{t('meals.table.ing')}</th>
            <th className="px-2 py-2 font-semibold text-right">P</th>
            <th className="px-2 py-2 font-semibold text-right">C</th>
            <th className="px-2 py-2 font-semibold text-right">G</th>
            <th className="px-3 py-2 font-semibold text-right">{t('meals.table.kcal')}</th>
            <th className="px-2 py-2 font-semibold text-center">{t('meals.table.use')}</th>
            <th className="px-2 py-2 font-semibold text-right w-[80px]"></th>
          </tr>
        </thead>
        <tbody>
          {meals.map(meal => {
            const ingCount = meal.mealOption?.ingredients?.length || 0;
            return (
              <tr
                key={meal.id}
                onClick={() => onEdit(meal)}
                className="group cursor-pointer transition-colors"
                style={{ borderTop: '1px solid #F0EDE8' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FAF9F7')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: '#FAF9F7', border: '1px solid #F0EDE8' }}>
                      {meal.imageUrl ? (
                        <img src={meal.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-3.5 h-3.5 text-gray-300" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-gray-800 truncate text-xs leading-tight">{meal.name || t('meals.noName')}</div>
                      <div className="text-[10px] text-gray-400 truncate">{meal.mealOption?.content || '—'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <img
                      src={`/icons/${categoryIcons[meal.category as MealCategory] || 'plato'}.svg`}
                      alt=""
                      className="w-3.5 h-3.5"
                    />
                    <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">
                      {t(`meals.categories.${(meal.category as MealCategory) || 'general'}`)}
                    </span>
                  </div>
                </td>
                <td className="px-2 py-2 text-center text-gray-500 tabular-nums text-[11px]">{ingCount}</td>
                <td className="px-2 py-2 text-right tabular-nums text-[11px] text-gray-500">{Math.round(meal.totalNutrition?.protein || 0)}</td>
                <td className="px-2 py-2 text-right tabular-nums text-[11px] text-gray-500">{Math.round(meal.totalNutrition?.carbs   || 0)}</td>
                <td className="px-2 py-2 text-right tabular-nums text-[11px] text-gray-500">{Math.round(meal.totalNutrition?.fat     || 0)}</td>
                <td className="px-3 py-2 text-right tabular-nums text-xs font-semibold text-gray-800">{Math.round(meal.totalNutrition?.calories || 0)}</td>
                <td className="px-2 py-2 text-center text-gray-400 text-[11px]">{meal.usageCount || 0}×</td>
                <td className="px-2 py-2 text-right">
                  <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <CardIcon onClick={(e) => { e.stopPropagation(); onDuplicate(meal); }} title={t('meals.actions.duplicate')} icon={<Copy className="w-3 h-3" />} />
                    <CardIcon onClick={(e) => { e.stopPropagation(); onDelete(meal); }} title={t('meals.actions.delete')} icon={<Trash2 className="w-3 h-3" />} danger />
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

// ─── UI compartida ──────────────────────────────────────────────────────────
const CardIcon: React.FC<{
  onClick: (e: React.MouseEvent) => void;
  title: string;
  icon: React.ReactNode;
  danger?: boolean;
}> = ({ onClick, title, icon, danger }) => (
  <button
    onClick={onClick}
    title={title}
    className={`p-1 rounded text-gray-400 transition-colors ${
      danger ? 'hover:text-red-600 hover:bg-red-50' : 'hover:text-gray-700 hover:bg-gray-100'
    }`}
  >
    {icon}
  </button>
);
