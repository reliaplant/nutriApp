'use client'

import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Search, Trash2, AlertCircle, ClipboardList, Star, Tag } from 'lucide-react';
import { planService, SavedPlan } from '@/app/shared/firebase';
import { computeTagUsage, computeTagOptions, tagsOf } from '@/app/shared/TagEditor';
import { useAuth } from '@/app/shared/AuthContext';
import { useTranslation } from '@/app/shared/useTranslation';
import PlanDetailModal from './PlanDetailModal';
import TagManagerModal from './TagManagerModal';

const mealsCount = (p: SavedPlan) => p.mealsCount ?? (Array.isArray(p.meals) ? p.meals.length : 0);
const kcalOf = (p: SavedPlan) => Math.round(p.totalNutrition?.calories || 0);

export default function PlanesPage() {
  const { t } = useTranslation();
  const [plans, setPlans] = useState<SavedPlan[]>([]);
  const [tagLibrary, setTagLibrary] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [featuredOnly, setFeaturedOnly] = useState(false);

  const [detailPlan, setDetailPlan] = useState<SavedPlan | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showTagManager, setShowTagManager] = useState(false);

  const { firebaseUser, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    (async () => {
      try {
        if (!firebaseUser) { setLoading(false); return; }
        const [p, lib] = await Promise.all([planService.getPlans(), planService.getTagLibrary()]);
        setPlans(p);
        setTagLibrary(lib);
      } catch (e) {
        console.error(e);
        toast.error(t('plans.loadError'));
      } finally {
        setLoading(false);
      }
    })();
  }, [firebaseUser, authLoading]);

  const tagUsage = useMemo(() => computeTagUsage(plans), [plans]);
  const tagOptions = useMemo(() => computeTagOptions(tagLibrary, plans), [tagLibrary, plans]);

  const handleCreateTag = async (tag: string) => {
    setTagLibrary(lib => (lib.includes(tag) ? lib : [...lib, tag]));
    try { await planService.saveTagLibrary([...new Set([...tagLibrary, tag])]); } catch { /* reintento luego */ }
  };

  const refetch = async () => {
    const [p, lib] = await Promise.all([planService.getPlans(), planService.getTagLibrary()]);
    setPlans(p);
    setTagLibrary(lib);
  };
  const handleRenameTag = async (oldTag: string, newTag: string) => {
    await planService.renameTag(oldTag, newTag);
    if (activeTag === oldTag) setActiveTag(newTag.trim().replace(/\s+/g, ' '));
    await refetch();
  };
  const handleDeleteTag = async (tag: string) => {
    await planService.deleteTag(tag);
    if (activeTag === tag) setActiveTag(null);
    await refetch();
  };

  const featuredCount = useMemo(() => plans.filter(p => p.featured).length, [plans]);

  const processed = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return plans
      .filter(p => !featuredOnly || p.featured)
      .filter(p => !activeTag || tagsOf(p).some(t => t === activeTag))
      .filter(p => !term || p.name?.toLowerCase().includes(term) || tagsOf(p).some(t => t.toLowerCase().includes(term)))
      .sort((a, b) => (Number(!!b.featured) - Number(!!a.featured)) || a.name.localeCompare(b.name, 'es'));
  }, [plans, searchTerm, activeTag, featuredOnly]);

  const toggleFeatured = async (p: SavedPlan) => {
    if (!p.id) return;
    const next = !p.featured;
    setPlans(ps => ps.map(x => (x.id === p.id ? { ...x, featured: next } : x)));
    if (detailPlan?.id === p.id) setDetailPlan({ ...detailPlan, featured: next });
    try { await planService.updatePlan(p.id, { featured: next }); } catch (e) { console.error(e); }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await planService.deletePlan(deleteId);
      setPlans(ps => ps.filter(p => p.id !== deleteId));
      if (detailPlan?.id === deleteId) setDetailPlan(null);
      setDeleteId(null);
    } catch (e) { console.error(e); toast.error(t('plans.deleteError')); }
  };

  return (
    <div className="bg-cream-pattern px-6 py-5 max-w-[1600px] mx-auto flex flex-col" style={{ height: 'calc(100vh - 44px)' }}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4 flex-shrink-0">
        <h1 className="text-base font-semibold text-gray-800 mr-1">{t('plans.title')}</h1>
        <span className="text-[11px] text-gray-400 tabular-nums">
          {processed.length} {processed.length === 1 ? t('plans.planOne') : t('plans.planMany')}
        </span>
        <div className="relative flex-1 max-w-sm ml-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
          <input
            type="text"
            placeholder={t('plans.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs rounded w-full focus:outline-none focus:ring-1 focus:ring-emerald-200 transition-shadow"
            style={{ backgroundColor: '#FFFFFF', border: '1px solid #CCC9C3', color: '#2D2B28' }}
          />
        </div>
      </div>

      {/* Filtros */}
      {!loading && (
        <div className="flex flex-wrap items-center gap-1.5 mb-4 flex-shrink-0">
          <button
            onClick={() => setFeaturedOnly(v => !v)}
            className={`inline-flex items-center gap-1.5 pl-2 pr-1.5 py-0.5 rounded-full text-[11px] font-medium transition-colors ${featuredOnly ? 'bg-amber-100 text-amber-700' : 'bg-[#F0EDE8] text-gray-600 hover:bg-[#E8E5DE]'}`}
          >
            <Star className={`w-3 h-3 ${featuredOnly ? 'text-amber-500' : ''}`} fill={featuredOnly ? 'currentColor' : 'none'} /> {t('plans.featured')}
            <span className={`text-[9px] tabular-nums rounded-full px-1 ${featuredOnly ? 'bg-amber-200/70 text-amber-700' : 'bg-white border border-[#ECE9E3] text-gray-400'}`}>{featuredCount}</span>
          </button>
          <span className="w-px h-4 bg-[#E8E5DE] mx-0.5" />
          <button
            onClick={() => setActiveTag(null)}
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors ${activeTag === null ? 'bg-gray-800 text-white' : 'bg-[#F0EDE8] text-gray-600 hover:bg-[#E8E5DE]'}`}
          >
            {t('plans.all')}
          </button>
          {tagUsage.map(({ tag, count }) => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={`inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-0.5 rounded-full text-[11px] font-medium transition-colors ${activeTag === tag ? 'bg-emerald-600 text-white' : 'bg-[#F0EDE8] text-gray-600 hover:bg-[#E8E5DE]'}`}
            >
              {tag}
              <span className={`text-[9px] tabular-nums rounded-full px-1 ${activeTag === tag ? 'bg-emerald-700/40' : 'bg-white border border-[#ECE9E3] text-gray-400'}`}>{count}</span>
            </button>
          ))}
          <button
            onClick={() => setShowTagManager(true)}
            className="ml-auto inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
          >
            <Tag className="w-3 h-3" /> {t('plans.manageTags')}
          </button>
        </div>
      )}

      {/* Contenido */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        </div>
      ) : processed.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400">
          <ClipboardList className="w-10 h-10 mb-3 opacity-40" />
          <p className="text-sm">{plans.length === 0 ? t('plans.emptyNone') : t('plans.emptyNoResults')}</p>
          {plans.length === 0 && <p className="text-[11px] mt-1">{t('plans.emptyHint')}</p>}
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="bg-white rounded-md overflow-hidden" style={{ border: '1px solid #E8E5DE' }}>
            <table className="w-full">
              <thead style={{ backgroundColor: '#FAF9F7', borderBottom: '1px solid #E8E5DE' }}>
                <tr className="text-left text-[10px] uppercase tracking-wider text-gray-500">
                  <th className="pl-3 pr-1 py-2 w-[34px]"></th>
                  <th className="px-3 py-2 font-semibold">{t('plans.colPlan')}</th>
                  <th className="px-3 py-2 font-semibold">{t('plans.colTags')}</th>
                  <th className="px-2 py-2 font-semibold text-right">{t('plans.colMeals')}</th>
                  <th className="px-3 py-2 font-semibold text-right">{t('plans.colKcal')}</th>
                  <th className="px-2 py-2 font-semibold text-right w-[60px]"></th>
                </tr>
              </thead>
              <tbody>
                {processed.map(p => (
                  <tr
                    key={p.id}
                    onClick={() => setDetailPlan(p)}
                    className="group cursor-pointer transition-colors"
                    style={{ borderTop: '1px solid #F0EDE8' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FAF9F7')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td className="pl-3 pr-1 py-2.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFeatured(p); }}
                        title={p.featured ? t('plans.unmarkFeatured') : t('plans.markFeatured')}
                        className={`p-0.5 rounded transition-colors ${p.featured ? 'text-yellow-500' : 'text-gray-300 opacity-0 group-hover:opacity-100 hover:text-yellow-500'}`}
                      >
                        <Star className="w-3.5 h-3.5" fill={p.featured ? 'currentColor' : 'none'} />
                      </button>
                    </td>
                    <td className="px-3 py-2.5 text-xs font-medium text-gray-800">{p.name}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {tagsOf(p).length === 0 ? (
                          <span className="text-[10px] text-gray-300">—</span>
                        ) : tagsOf(p).map(tag => (
                          <span
                            key={tag}
                            className="px-1.5 py-px rounded-full bg-[#F0EDE8] text-gray-600 text-[10px] font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-2 py-2.5 text-right tabular-nums text-[11px] text-gray-500">{mealsCount(p)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-xs font-semibold text-gray-800">{kcalOf(p)}</td>
                    <td className="px-2 py-2.5 text-right">
                      <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); setDeleteId(p.id!); }} className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Vista previa / edición del plan */}
      {detailPlan && (
        <PlanDetailModal
          plan={detailPlan}
          tagOptions={tagOptions}
          onCreateTag={handleCreateTag}
          onClose={() => setDetailPlan(null)}
          onSaved={(updated) => {
            setPlans(ps => ps.map(p => (p.id === updated.id ? updated : p)));
            setDetailPlan(updated);
          }}
          onRequestDelete={(id) => setDeleteId(id)}
        />
      )}

      {/* Gestionar etiquetas */}
      {showTagManager && (
        <TagManagerModal
          library={tagLibrary}
          plans={plans}
          onClose={() => setShowTagManager(false)}
          onRename={handleRenameTag}
          onDelete={handleDeleteTag}
          onCreate={handleCreateTag}
        />
      )}

      {/* Confirmar eliminación */}
      {deleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white rounded-md shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="px-5 py-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-4 h-4 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900">{t('plans.deleteTitle')}</h3>
                <p className="text-xs text-gray-500 mt-1">{t('plans.deleteIrreversible')}</p>
              </div>
            </div>
            <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2">
              <button onClick={() => setDeleteId(null)} className="text-xs px-3 py-1.5 rounded text-gray-600 hover:bg-gray-100">{t('plans.cancel')}</button>
              <button onClick={confirmDelete} className="text-xs px-4 py-1.5 rounded font-semibold text-white bg-red-600 hover:bg-red-700">{t('plans.delete')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
