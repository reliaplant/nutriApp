'use client'

import React, { useMemo, useState, useRef, useLayoutEffect } from 'react';
import { X, Pencil, Trash2, ClipboardList, Star } from 'lucide-react';
import Meals, { Meal, sortMealsByTime } from '@/app/consulta/components/meals';
import { getCommonIngredients } from '@/app/consulta/components/ingredientsData';
import { useTranslation } from '@/app/shared/useTranslation';
import { categoryLabels, categoryColors, normalizeCategory } from '@/app/comidas/constants';
import { TagEditor, TagUsage, tagsOf } from '@/app/shared/TagEditor';
import { planService, SavedPlan } from '@/app/shared/firebase';

function computeTotals(meals: Meal[]) {
  const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  meals.forEach(meal => {
    if (meal.isActive === false) return;
    meal.options.forEach(option => {
      if (!option.isSelectedForSummary) return;
      option.ingredients.forEach(ing => {
        const q = Number(ing.quantity || 0);
        totals.calories += (Number(ing.calories || 0) * q) / 100;
        totals.protein += (Number(ing.protein || 0) * q) / 100;
        totals.carbs += (Number(ing.carbs || 0) * q) / 100;
        totals.fat += (Number(ing.fat || 0) * q) / 100;
      });
    });
  });
  return totals;
}

export default function PlanDetailModal({ plan, tagOptions, onCreateTag, onClose, onSaved, onRequestDelete }: {
  plan: SavedPlan;
  tagOptions: TagUsage[];
  onCreateTag: (tag: string) => void;
  onClose: () => void;
  onSaved: (updated: SavedPlan) => void;
  onRequestDelete: (id: string) => void;
}) {
  const { t, lang } = useTranslation();
  const commonIngredients = useMemo(() => getCommonIngredients(lang), [lang]);

  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [name, setName] = useState(plan.name);
  const [tags, setTags] = useState<string[]>(tagsOf(plan));
  const [indicaciones, setIndicaciones] = useState(plan.indicaciones || '');
  const [meals, setMeals] = useState<Meal[]>(() => JSON.parse(JSON.stringify(plan.meals || [])) as Meal[]);
  const [saving, setSaving] = useState(false);

  const indicacionesRef = useRef<HTMLTextAreaElement>(null);
  const autoGrowIndicaciones = () => {
    const el = indicacionesRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };
  useLayoutEffect(() => { if (mode === 'edit') autoGrowIndicaciones(); }, [mode, indicaciones]);

  const totals = useMemo(() => computeTotals(meals), [meals]);
  const activeMeals = sortMealsByTime(meals.filter(m => m.isActive !== false));

  // Métricas nutricionales (mismas fórmulas que la consulta)
  const metrics = useMemo(() => {
    let grams = 0;
    meals.forEach(m => {
      if (m.isActive === false) return;
      m.options.forEach(o => {
        if (!o.isSelectedForSummary) return;
        o.ingredients.forEach(i => { grams += Number(i.quantity || 0); });
      });
    });
    const { calories, protein, carbs, fat } = totals;
    // Distribución por aporte calórico: P y C = 4 kcal/g, G = 9 kcal/g
    const kp = protein * 4, kc = carbs * 4, kf = fat * 9, kt = kp + kc + kf || 1;
    const pPct = Math.round((kp / kt) * 100), cPct = Math.round((kc / kt) * 100), fPct = Math.round((kf / kt) * 100);
    // Densidad energética (kcal/g)
    const density = grams > 0 ? calories / grams : 0;
    const densCat = density <= 1.5 ? 'baja' : density <= 2.5 ? 'media' : 'alta';
    const densFrac = Math.min(density / 3, 1) * 100;
    const densColor = density <= 1.5 ? '#16A34A' : density <= 2.5 ? '#D97706' : '#DC2626';
    const densBg = density <= 1.5 ? '#ECFDF5' : density <= 2.5 ? '#FFF7ED' : '#FEF2F2';
    // Calidad proteica (g proteína / 100 kcal)
    const protPer100 = calories > 0 ? (protein / calories) * 100 : 0;
    const protCat = protPer100 >= 9 ? 'alta' : protPer100 >= 5 ? 'media' : 'baja';
    const protFrac = Math.min(protPer100 / 13, 1) * 100;
    const protColor = protPer100 >= 9 ? '#16A34A' : protPer100 >= 5 ? '#D97706' : '#DC2626';
    const protBg = protPer100 >= 9 ? '#ECFDF5' : protPer100 >= 5 ? '#FFF7ED' : '#FEF2F2';
    return { pPct, cPct, fPct, density, densCat, densFrac, densColor, densBg, protPer100, protCat, protFrac, protColor, protBg };
  }, [meals, totals]);

  const enterEdit = () => {
    setName(plan.name);
    setTags(tagsOf(plan));
    setIndicaciones(plan.indicaciones || '');
    setMeals(JSON.parse(JSON.stringify(plan.meals || [])) as Meal[]);
    setMode('edit');
  };

  const toggleFeatured = async () => {
    if (!plan.id) return;
    const next = !plan.featured;
    onSaved({ ...plan, featured: next });
    try { await planService.updatePlan(plan.id, { featured: next }); } catch (e) { console.error(e); }
  };

  const save = async () => {
    if (!plan.id) return;
    setSaving(true);
    const t = computeTotals(meals);
    const patch: Partial<SavedPlan> = {
      name: name.trim() || plan.name,
      tags,
      group: undefined,
      indicaciones: indicaciones.trim() || undefined,
      meals: meals as unknown[],
      totalNutrition: t,
      mealsCount: meals.length,
    };
    try {
      await planService.updatePlan(plan.id, patch);
      onSaved({ ...plan, ...patch });
      setMode('view');
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => mode === 'view' && onClose()} />
      <div className="relative bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden" style={{ border: '1px solid #E8E5DE', width: '90vw', maxWidth: '1400px', height: '90vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-5 py-3 border-b border-[#E8E5DE] flex-shrink-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-gray-900 truncate">{mode === 'edit' ? (name.trim() || t('plans.noName')) : plan.name}</h2>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {mode === 'view' && (
              <>
                <button
                  onClick={toggleFeatured}
                  className={`flex items-center justify-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium transition-colors ${plan.featured ? 'text-yellow-600 hover:bg-yellow-50' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
                >
                  <Star className="w-3.5 h-3.5" fill={plan.featured ? 'currentColor' : 'none'} />
                  {plan.featured ? t('plans.unmarkFeatured') : t('plans.markFeatured')}
                </button>
                <button onClick={enterEdit} className="flex items-center justify-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors">
                  <Pencil className="w-3.5 h-3.5" /> {t('plans.edit')}
                </button>
                <button onClick={() => plan.id && onRequestDelete(plan.id)} className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
            <button onClick={onClose} className="p-1.5 rounded hover:bg-gray-100"><X className="h-4 w-4 text-gray-500" /></button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto" style={{ backgroundColor: mode === 'edit' ? '#FAF9F7' : '#FFFFFF' }}>
          {/* Resumen nutricional — etiqueta al ras (alineada con las demás secciones) */}
          <div className="px-5 pt-4">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{t('plans.macroDistribution')}</p>
              <div className="text-[11px] tabular-nums">
                <span className="font-semibold text-gray-800">{Math.round(totals.calories)}</span>
                <span className="text-gray-400 ml-1">kcal · {activeMeals.length} {t('plans.mealsSuffix')}</span>
              </div>
            </div>
            <div className="rounded-lg px-4 py-3.5" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E5DE' }}>
              <div className="space-y-2 text-[11px]">
                {[
                  { label: t('plans.proteins'), g: totals.protein, pct: metrics.pPct, color: 'bg-red-400' },
                  { label: t('plans.carbs'), g: totals.carbs, pct: metrics.cPct, color: 'bg-amber-400' },
                  { label: t('plans.fats'), g: totals.fat, pct: metrics.fPct, color: 'bg-blue-400' },
                ].map(m => (
                  <div key={m.label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-700">{m.label}</span>
                      <div className="tabular-nums">
                        <span className="font-medium text-gray-800">{Math.round(m.g)} g</span>
                        <span className="ml-1.5 text-gray-400">{m.pct}%</span>
                      </div>
                    </div>
                    <div className="w-full rounded-full h-1.5" style={{ backgroundColor: '#F0EDE8' }}>
                      <div className={`${m.color} h-1.5 rounded-full`} style={{ width: `${m.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {mode === 'view' ? (
            <div className="px-5 pt-4 pb-4 space-y-4">
              {/* Etiquetas */}
              {tagsOf(plan).length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tagsOf(plan).map(tag => (
                    <span key={tag} className="px-2 py-0.5 rounded-full bg-[#F0EDE8] text-gray-600 text-[11px] font-medium">{tag}</span>
                  ))}
                </div>
              )}

              {/* Comidas (solo lectura) */}
              {activeMeals.length === 0 ? (
                <div className="py-10 flex flex-col items-center text-gray-400">
                  <ClipboardList className="w-8 h-8 mb-2 opacity-40" />
                  <p className="text-xs">Este plan no tiene comidas.</p>
                </div>
              ) : activeMeals.map((meal, mi) => {
                const cat = normalizeCategory(meal.category);
                const catColor = categoryColors[cat];
                // Promedio de macros entre opciones (igual que la consulta)
                const optTotals = meal.options.map(o => ({
                  cal: o.ingredients.reduce((s, i) => s + (Number(i.calories || 0) * Number(i.quantity || 0)) / 100, 0),
                  prot: o.ingredients.reduce((s, i) => s + (Number(i.protein || 0) * Number(i.quantity || 0)) / 100, 0),
                  carbs: o.ingredients.reduce((s, i) => s + (Number(i.carbs || 0) * Number(i.quantity || 0)) / 100, 0),
                  fat: o.ingredients.reduce((s, i) => s + (Number(i.fat || 0) * Number(i.quantity || 0)) / 100, 0),
                }));
                const n = optTotals.length || 1;
                const avg = {
                  cal: optTotals.reduce((s, o) => s + o.cal, 0) / n,
                  prot: optTotals.reduce((s, o) => s + o.prot, 0) / n,
                  carbs: optTotals.reduce((s, o) => s + o.carbs, 0) / n,
                  fat: optTotals.reduce((s, o) => s + o.fat, 0) / n,
                };
                return (
                  <div key={mi} className="rounded-md overflow-hidden bg-white" style={{ border: '1px solid #E8E5DE' }}>
                    {/* Header de la comida */}
                    <div className="px-3 py-2 flex items-center justify-between" style={{ borderBottom: '1px solid #F0EDE8' }}>
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: catColor.dark }} />
                        <span className="text-[11px] font-semibold text-gray-800 truncate">{meal.name?.trim() || categoryLabels[cat]}</span>
                        {meal.time && <><span className="text-xs text-gray-400">·</span><span className="text-[11px] text-gray-500 tabular-nums">{meal.time} {t('consultation.meals.hourSuffix')}</span></>}
                      </div>
                      {meal.options.length > 0 && (
                        <div className="hidden sm:flex items-center text-[10px] tabular-nums">
                          <span className="font-semibold text-gray-800 w-16 text-right">{Math.round(avg.cal)} <span className="font-normal text-gray-500">kcal</span></span>
                          <span className="font-medium text-gray-500 w-12 text-right">{avg.prot.toFixed(0)}g P</span>
                          <span className="font-medium text-gray-500 w-12 text-right">{avg.carbs.toFixed(0)}g C</span>
                          <span className="font-medium text-gray-500 w-12 text-right">{avg.fat.toFixed(0)}g G</span>
                        </div>
                      )}
                    </div>

                    {/* Opciones */}
                    <div className="p-2 flex flex-col gap-1.5" style={{ backgroundColor: '#FAF9F7' }}>
                      {meal.options.map((opt, oi) => {
                        const oc = optTotals[oi];
                        const hasContent = opt.ingredients.length > 0 || !!opt.content;
                        return (
                          <div key={oi} className="rounded-md bg-white" style={{ border: '1px solid #E8E5DE' }}>
                            {/* Header de la opción */}
                            <div className="px-2.5 py-1.5 flex items-center justify-between" style={hasContent ? { borderBottom: '1px solid #F0EDE8' } : undefined}>
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <div className="w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#F4F2EE', border: '1px solid #E8E5DE' }}>
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-gray-400">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="9" cy="9" r="1.5" fill="currentColor" stroke="none" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                                  </svg>
                                </div>
                                <span className="text-[10px] font-bold text-gray-400 flex-shrink-0 uppercase tracking-wider">{t('plans.option')} {oi + 1}</span>
                                <span className="text-xs font-medium text-gray-800 truncate">{opt.name?.trim() || `${t('plans.option')} ${oi + 1}`}</span>
                              </div>
                              {hasContent && (
                                <div className="hidden sm:flex items-center text-[10px] tabular-nums flex-shrink-0">
                                  <span className="font-semibold text-gray-700 w-16 text-right">{oc.cal.toFixed(0)} <span className="font-normal text-gray-500">kcal</span></span>
                                  <span className="font-medium text-gray-500 w-12 text-right">{oc.prot.toFixed(0)}g P</span>
                                  <span className="font-medium text-gray-500 w-12 text-right">{oc.carbs.toFixed(0)}g C</span>
                                  <span className="font-medium text-gray-500 w-12 text-right">{oc.fat.toFixed(0)}g G</span>
                                </div>
                              )}
                            </div>

                            {/* Cuerpo de la opción */}
                            {hasContent && (
                              <div className="px-4 py-2">
                                {opt.content?.trim() && (
                                  <div className="mb-3 px-3 py-2 rounded-r-sm" style={{ backgroundColor: '#FBF7E8', borderLeft: '2px solid #E8DCB0' }}>
                                    <p className="text-[11px] text-gray-700 leading-relaxed italic first-letter:uppercase">{opt.content}</p>
                                  </div>
                                )}
                                {opt.ingredients.length > 0 && (
                                  <ul className="divide-y divide-[#F0EDE8]">
                                    {opt.ingredients.map((ing, ii) => {
                                      const q = Number(ing.quantity || 0);
                                      const u = ing.unit;
                                      const measure = u && u.label !== 'g' && u.g ? `${+(q / u.g).toFixed(2)} ${u.label}` : `${q}g`;
                                      return (
                                        <li key={ii} className="flex items-center justify-between py-1 text-[11px]">
                                          <div className="flex items-center gap-1.5 truncate">
                                            {ing.icon && <img src={`/icons/${ing.icon}.svg`} alt="" className="w-4 h-4 flex-shrink-0" />}
                                            <span className="truncate text-gray-700">{ing.name}</span>
                                          </div>
                                          <div className="flex items-center gap-3 flex-shrink-0 text-gray-500 tabular-nums">
                                            <span>{measure}</span>
                                            <span className="font-medium text-gray-700 w-12 text-right">{Math.round((Number(ing.calories || 0) * q) / 100)} cal</span>
                                          </div>
                                        </li>
                                      );
                                    })}
                                  </ul>
                                )}
                              </div>
                            )}
                            {!hasContent && <p className="px-4 py-2 text-[10px] text-gray-300 italic">{t('plans.noIngredients')}</p>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Indicaciones */}
              <div className="rounded-md border border-[#E8E5DE] overflow-hidden">
                <div className="px-3 py-1.5 bg-[#FAF9F7] border-b border-[#F0EDE8]">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{t('plans.indications')}</span>
                </div>
                {plan.indicaciones?.trim() ? (
                  <p className="px-3 py-2 text-[11px] text-gray-600 whitespace-pre-wrap leading-snug">{plan.indicaciones}</p>
                ) : (
                  <p className="px-3 py-2 text-[11px] text-gray-400 italic">{t('plans.noIndications')}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 block mb-1.5">{t('plans.name')}</label>
                <input
                  value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-white border border-[#E0DCD4] text-gray-800"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 block mb-1.5">{t('plans.tags')}</label>
                <TagEditor value={tags} onChange={setTags} options={tagOptions} onCreate={onCreateTag} />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 block mb-1.5">{t('plans.meals')}</label>
                {/* El componente Meals añade su propio padding (p-2.5); lo compensamos para alinear las tarjetas al ras */}
                <div className="-mx-2.5">
                  <Meals meals={meals} commonIngredients={commonIngredients} onMealsChange={setMeals} />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 block mb-1.5">{t('plans.indications')}</label>
                <textarea
                  ref={indicacionesRef}
                  value={indicaciones}
                  onChange={(e) => { setIndicaciones(e.target.value); autoGrowIndicaciones(); }}
                  placeholder={t('plans.indicationsPlaceholder')}
                  style={{ minHeight: '96px' }}
                  className="w-full px-3 py-2 text-sm rounded-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-white border border-[#E0DCD4] text-gray-800 placeholder:text-gray-400 resize-none overflow-hidden"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer (solo en edición) */}
        {mode === 'edit' && (
          <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2 flex-shrink-0">
            <button onClick={() => setMode('view')} disabled={saving} className="text-xs px-3 py-1.5 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-50">{t('plans.cancel')}</button>
            <button onClick={save} disabled={saving} className="text-xs px-4 py-1.5 rounded font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5">
              {saving && <span className="inline-block w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
              {t('plans.saveChanges')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
