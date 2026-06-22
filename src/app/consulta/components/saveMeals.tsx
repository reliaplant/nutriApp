import React, { useState, useRef, useEffect, useMemo } from 'react';
import { X, Save, Bookmark, Check } from 'lucide-react';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db, authService } from '@/app/shared/firebase';
import { MealOption } from '@/app/consulta/components/meals';
import { categoryLabels, categoryColors, categoryIcons, MealCategory } from '@/app/comidas/constants';
import { useTranslation } from '@/app/shared/useTranslation';

interface SaveMealOptionProps {
  mealName: string;
  option: MealOption;
  onSaveSuccess?: () => void;
}

const SaveMealOption: React.FC<SaveMealOptionProps> = ({ mealName, option, onSaveSuccess }) => {
  const { t, ti } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [savedName, setSavedName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const getInitialCategory = (): MealCategory => {
    const lowerName = (mealName || '').toLowerCase();
    if (lowerName.includes('desayun')) return 'desayuno';
    if (lowerName.includes('almuerz') || lowerName.includes('comida')) return 'almuerzo';
    if (lowerName.includes('cena')) return 'cena';
    return 'snack';
  };

  const [category, setCategory] = useState<MealCategory>(getInitialCategory());
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [justSaved, setJustSaved] = useState(false);

  // Initial name suggestion based on content
  useEffect(() => {
    if (isOpen) {
      const suggested = option.name?.trim() || (option.content || '').split(/[.,\n]/)[0]?.trim().slice(0, 60) || '';
      setSavedName(suggested);
      setCategory(getInitialCategory());
      setError('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Cálculo de totales nutricionales — POR PORCIÓN (cantidad real)
  const totalNutrition = useMemo(() => ({
    calories: option.ingredients.reduce((s, i) => s + (Number(i.calories || 0) * Number(i.quantity || 0) / 100), 0),
    protein:  option.ingredients.reduce((s, i) => s + (Number(i.protein  || 0) * Number(i.quantity || 0) / 100), 0),
    carbs:    option.ingredients.reduce((s, i) => s + (Number(i.carbs    || 0) * Number(i.quantity || 0) / 100), 0),
    fat:      option.ingredients.reduce((s, i) => s + (Number(i.fat      || 0) * Number(i.quantity || 0) / 100), 0),
  }), [option.ingredients]);

  const macroPct = useMemo(() => {
    const pCal = totalNutrition.protein * 4;
    const cCal = totalNutrition.carbs * 4;
    const fCal = totalNutrition.fat * 9;
    const total = pCal + cCal + fCal || 1;
    return {
      p: (pCal / total) * 100,
      c: (cCal / total) * 100,
      f: (fCal / total) * 100,
    };
  }, [totalNutrition]);

  const hasValidIngredients = option.ingredients?.length > 0 && option.ingredients.every(ing => ing.name.trim() !== '');
  const canSave = hasValidIngredients && savedName.trim().length > 0;

  const handleSave = async () => {
    if (!canSave) {
      setError(!hasValidIngredients ? t('consultation.saveMeal.needIng') : t('consultation.saveMeal.needName'));
      return;
    }
    setError('');
    setIsSaving(true);
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        setError(t('consultation.saveMeal.mustLogin'));
        setIsSaving(false);
        return;
      }
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      // Firestore no acepta `undefined`: limpiamos en profundidad (JSON drop) el mealOption.
      const cleanOption = JSON.parse(JSON.stringify({ ...option, name: savedName.trim() }));
      await setDoc(doc(db, `users/${user.uid}/savedMealOptions`, id), {
        name: savedName.trim(),
        category,
        mealOption: cleanOption,
        totalNutrition,
        createdAt: Timestamp.now(),
      });
      setJustSaved(true);
      setTimeout(() => {
        setJustSaved(false);
        setIsOpen(false);
        if (onSaveSuccess) onSaveSuccess();
      }, 1300);
    } catch (err) {
      console.error('Error al guardar opción:', err);
      setError(t('consultation.saveMeal.error'));
    } finally {
      setIsSaving(false);
    }
  };

  const categories = Object.entries(categoryLabels) as [MealCategory, string][];

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors text-gray-600 bg-white hover:text-emerald-700 hover:bg-emerald-50"
        style={{ border: '1px solid #E8E5DE' }}
        title={t('consultation.saveMeal.btnTitle')}
      >
        <Bookmark className="w-3 h-3" />
        {t('consultation.saveMeal.btn')}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => !isSaving && setIsOpen(false)}>
          <div
            className="relative bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
            style={{ border: '1px solid #E8E5DE' }}
            onClick={(e) => e.stopPropagation()}
          >
            <style>{`@keyframes nutriLoadBar{0%{left:-45%}100%{left:100%}}@keyframes nutriPop{0%{transform:scale(0.6);opacity:0}60%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}`}</style>

            {/* Estado de éxito: el modal se vuelve un check */}
            {justSaved && (
              <div className="absolute inset-0 z-10 bg-white flex flex-col items-center justify-center text-center px-6">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#059669', animation: 'nutriPop 0.35s ease-out' }}>
                  <Check className="w-8 h-8 text-white" strokeWidth={3} />
                </div>
                <h3 className="text-base font-semibold text-gray-900">{t('consultation.saveMeal.saved')}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  <span className="font-medium text-gray-700">{savedName.trim()}</span> · {t('consultation.saveMeal.subtitle')}
                </p>
              </div>
            )}
            {/* Header — minimalista */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: '#F0FDF4' }}>
                  <Bookmark className="w-3.5 h-3.5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 leading-tight">{t('consultation.saveMeal.title')}</h3>
                  <p className="text-[10px] text-gray-500 leading-tight">{t('consultation.saveMeal.subtitle')}</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                disabled={isSaving}
                className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Barra de carga al guardar */}
            {isSaving && (
              <div className="relative h-1 overflow-hidden" style={{ backgroundColor: '#E8E5DE' }}>
                <div className="absolute top-0 h-full rounded-full" style={{ width: '45%', backgroundColor: '#059669', animation: 'nutriLoadBar 0.9s ease-in-out infinite' }} />
              </div>
            )}

            {/* Body */}
            <div className="px-5 pb-4 space-y-4">
              {/* Nombre */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5 block">{t('consultation.saveMeal.name')}</label>
                <input
                  ref={inputRef}
                  type="text"
                  className="w-full py-2 px-3 bg-white border border-gray-300 rounded-md text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 placeholder:text-gray-400"
                  value={savedName}
                  onChange={(e) => setSavedName(e.target.value)}
                  placeholder={t('consultation.saveMeal.namePh')}
                  onKeyDown={(e) => { if (e.key === 'Enter' && canSave) handleSave(); }}
                />
              </div>

              {/* Categoría — pills */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5 block">{t('consultation.saveMeal.category')}</label>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map(([id, name]) => {
                    const isActive = category === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setCategory(id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                          isActive
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-gray-600 hover:border-emerald-400 hover:text-emerald-700'
                        }`}
                        style={{ border: isActive ? undefined : '1px solid #E8E5DE' }}
                      >
                        <img src={`/icons/${categoryIcons[id]}.svg`} alt="" className={`w-3.5 h-3.5 ${isActive ? '' : 'opacity-80'}`} />
                        {t(`meals.categories.${id}`)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preview de la receta */}
              <div className="rounded-md p-3" style={{ backgroundColor: '#FAF9F7', border: '1px solid #F0EDE8' }}>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{t('consultation.saveMeal.nutritionSummary')}</span>
                  <span className="text-[10px] text-gray-500 tabular-nums">{option.ingredients.length} {option.ingredients.length === 1 ? t('consultation.saveMeal.ingOne') : t('consultation.saveMeal.ingMany')}</span>
                </div>
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <div className="text-2xl font-bold text-gray-900 tabular-nums leading-none">{Math.round(totalNutrition.calories)}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{t('consultation.saveMeal.perPortion')}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-right">
                    <div>
                      <div className="text-[10px] text-gray-500 font-medium">{t('consultation.saveMeal.protShort')}</div>
                      <div className="text-xs font-semibold text-gray-800 tabular-nums">{totalNutrition.protein.toFixed(0)}g</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 font-medium">{t('consultation.saveMeal.carbShort')}</div>
                      <div className="text-xs font-semibold text-gray-800 tabular-nums">{totalNutrition.carbs.toFixed(0)}g</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 font-medium">{t('consultation.saveMeal.fatShort')}</div>
                      <div className="text-xs font-semibold text-gray-800 tabular-nums">{totalNutrition.fat.toFixed(0)}g</div>
                    </div>
                  </div>
                </div>
                {/* Distribución macros */}
                <div className="flex h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#F0EDE8' }}>
                  <div className="bg-red-400" style={{ width: `${macroPct.p}%` }} />
                  <div className="bg-amber-400" style={{ width: `${macroPct.c}%` }} />
                  <div className="bg-blue-400" style={{ width: `${macroPct.f}%` }} />
                </div>
                <div className="flex justify-between text-[9px] text-gray-500 mt-1 tabular-nums">
                  <span>{macroPct.p.toFixed(0)}{t('consultation.saveMeal.pctProt')}</span>
                  <span>{macroPct.c.toFixed(0)}{t('consultation.saveMeal.pctCarb')}</span>
                  <span>{macroPct.f.toFixed(0)}{t('consultation.saveMeal.pctFat')}</span>
                </div>
              </div>

              {/* Ingredientes preview */}
              {option.ingredients.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {option.ingredients.slice(0, 6).map((ing, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-gray-700 bg-white" style={{ border: '1px solid #E8E5DE' }}>
                        {ing.icon && <img src={`/icons/${ing.icon}.svg`} alt="" className="w-3 h-3" />}
                        {ing.name}
                      </span>
                    ))}
                    {option.ingredients.length > 6 && (
                      <span className="text-[10px] text-gray-500">{ti('consultation.saveMeal.moreSuffix', [option.ingredients.length - 6])}</span>
                    )}
                  </div>
                </div>
              )}

              {error && (
                <div className="px-3 py-2 bg-red-50 text-red-700 rounded text-[11px] border border-red-200">
                  {error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 px-5 py-3 bg-gray-50" style={{ borderTop: '1px solid #E8E5DE' }}>
              <button
                type="button"
                className="px-3 py-1.5 border border-gray-300 rounded text-gray-700 bg-white hover:bg-gray-100 text-[12px] font-medium transition-colors"
                onClick={() => setIsOpen(false)}
                disabled={isSaving}
              >
                {t('consultation.saveMeal.cancel')}
              </button>
              <button
                type="button"
                className={`px-4 py-1.5 rounded text-[12px] font-semibold flex items-center gap-1.5 transition-colors ${
                  justSaved
                    ? 'bg-emerald-600 text-white'
                    : canSave && !isSaving
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                onClick={handleSave}
                disabled={!canSave || isSaving}
              >
                {justSaved ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    {t('consultation.saveMeal.saved')}
                  </>
                ) : isSaving ? (
                  <>
                    <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t('consultation.saveMeal.saving')}
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    {t('consultation.saveMeal.saveBtn')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SaveMealOption;
