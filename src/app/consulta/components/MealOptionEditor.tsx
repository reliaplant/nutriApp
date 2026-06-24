'use client'

import React, { useRef, useState } from 'react';
import { ChevronDown, X, Upload, Image as ImageIcon, Sparkles, Wand2, ListPlus, FileText } from 'lucide-react';
import { TrashCan } from '@carbon/icons-react';
import IngredientTypeahead, { Ingredient } from './IngredientTypeahead';
import PortionPicker from './PortionPicker';
import PrepSelector from './PrepSelector';
import { getDefaultGramsForIngredient, getPortionsForIngredient, parsePortion, pickReasonablePortion } from './portionsHelper';
import { categoryLabels, categoryIcons, MealCategory, normalizeCategory } from '@/app/comidas/constants';
import CountryTypeahead from '@/app/shared/CountryTypeahead';
import { useTranslation } from '@/app/shared/useTranslation';

export interface MealOptionValue {
  name: string;
  content: string;
  ingredients: Ingredient[];
  instructions?: string;
}

interface MealOptionEditorProps {
  value: MealOptionValue;
  onChange: (value: MealOptionValue) => void;

  category: MealCategory;
  onCategoryChange?: (cat: MealCategory) => void;

  // País típico (opcional) — solo se muestra el selector si se pasa onCountryChange
  country?: string | null;
  onCountryChange?: (code: string | null) => void;

  // Imagen (opcional)
  imageUrl?: string | null;
  imageFile?: File | null;
  onImageSelect?: (file: File | null) => void;
  onImageRemove?: () => void;

  // UI
  optionLabel?: string;       // ej: "Opción 1"
  showImageUpload?: boolean;  // default false (consulta) — true en /comidas

  // Acciones
  onClose: () => void;
  primaryAction?: {
    label: string;
    onClick: () => void;
    loading?: boolean;
    disabled?: boolean;
  };
  footerLeft?: React.ReactNode;

  commonIngredients: Ingredient[];
}

const MealOptionEditor: React.FC<MealOptionEditorProps> = ({
  value,
  onChange,
  category,
  onCategoryChange,
  country,
  onCountryChange,
  imageUrl,
  imageFile,
  onImageSelect,
  onImageRemove,
  optionLabel,
  showImageUpload = false,
  onClose,
  primaryAction,
  footerLeft,
  commonIngredients,
}) => {
  const { t } = useTranslation();
  const [catOpen, setCatOpen] = useState(false);
  const [showAIMenu, setShowAIMenu] = useState(false);
  const [descFocused, setDescFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = (patch: Partial<MealOptionValue>) => onChange({ ...value, ...patch });

  const ingredients = value.ingredients || [];

  // Totales
  const totals = ingredients.reduce(
    (acc, i) => {
      const q = Number(i.quantity || 0);
      acc.cal += (Number(i.calories || 0) * q) / 100;
      acc.p   += (Number(i.protein  || 0) * q) / 100;
      acc.c   += (Number(i.carbs    || 0) * q) / 100;
      acc.f   += (Number(i.fat      || 0) * q) / 100;
      return acc;
    },
    { cal: 0, p: 0, c: 0, f: 0 }
  );

  // Distribución de macros (por kcal) y densidad energética (kcal/g).
  const totalGrams = ingredients.reduce((s, i) => s + Number(i.quantity || 0), 0);
  const density = totalGrams > 0 ? totals.cal / totalGrams : 0;
  const kp = totals.p * 4, kc = totals.c * 4, kf = totals.f * 9;
  const kt = kp + kc + kf || 1;
  const pP = (kp / kt) * 100, pC = (kc / kt) * 100, pF = (kf / kt) * 100;
  const densCat = density <= 1.5 ? 'baja' : density <= 2.5 ? 'media' : 'alta';
  const densFrac = Math.min(density / 3, 1) * 100;
  const densColor = density <= 1.5 ? '#16A34A' : density <= 2.5 ? '#D97706' : '#DC2626';
  const densBg = density <= 1.5 ? '#ECFDF5' : density <= 2.5 ? '#FFF7ED' : '#FEF2F2';
  // Calidad proteica: g de proteína por cada 100 kcal (saciedad / dieta).
  const protPer100 = totals.cal > 0 ? (totals.p / totals.cal) * 100 : 0;
  const protCat = protPer100 >= 9 ? 'alta' : protPer100 >= 5 ? 'media' : 'baja';
  const protFrac = Math.min(protPer100 / 13, 1) * 100;
  const protColor = protPer100 >= 9 ? '#16A34A' : protPer100 >= 5 ? '#D97706' : '#DC2626';
  const protBg = protPer100 >= 9 ? '#ECFDF5' : protPer100 >= 5 ? '#FFF7ED' : '#FEF2F2';

  // Mutaciones de ingredientes
  const addIngredient = (ing: Ingredient) => {
    // Default: si hay medidas caseras, arranca con la más razonable como UNIDAD
    // (ej. "1 filete", "1 rebanada"); si no, en gramos.
    let grams: number;
    let unit: { label: string; g: number } = { label: ing.baseUnit === 'ml' ? 'ml' : 'g', g: 1 };
    if (ing.quantity && ing.quantity !== 100) {
      grams = ing.quantity; // el typeahead ya resolvió gramos explícitos
    } else {
      const rec = pickReasonablePortion(getPortionsForIngredient(ing));
      if (rec) {
        const parsed = parsePortion({ label: rec.label, gramos: rec.gramos });
        grams = rec.gramos;
        unit = { label: parsed.label, g: parsed.perUnit };
      } else {
        grams = getDefaultGramsForIngredient(ing);
      }
    }
    update({
      ingredients: [
        ...ingredients,
        {
          name: ing.name,
          quantity: grams,
          unit,
          calories: Number(ing.calories) || 0,
          protein:  Number(ing.protein)  || 0,
          carbs:    Number(ing.carbs)    || 0,
          fat:      Number(ing.fat)      || 0,
          icon: ing.icon,
          baseUnit: ing.baseUnit,
          portions: ing.portions,
          preparations: ing.preparations,
          baseName: ing.baseName ?? ing.name,
          prepKey: ing.prepKey,
        },
      ],
    });
  };

  const removeIngredient = (idx: number) => {
    const arr = [...ingredients];
    arr.splice(idx, 1);
    update({ ingredients: arr });
  };

  const setIngredientPortion = (idx: number, g: number, unit: { label: string; g: number }) => {
    const arr = [...ingredients];
    arr[idx] = { ...arr[idx], quantity: g, unit };
    update({ ingredients: arr });
  };

  // Cambiar el modo de preparación de un ingrediente:
  // intercambia macros + portions y conserva los gramos actuales.
  const setIngredientPrep = (idx: number, prepKey: string) => {
    const arr = [...ingredients];
    const cur = arr[idx];
    const prep = cur.preparations?.find((p) => p.key === prepKey);
    if (!prep) return;
    arr[idx] = {
      ...cur,
      prepKey: prep.key,
      calories: prep.calories,
      protein: prep.protein,
      carbs: prep.carbs,
      fat: prep.fat,
      portions: prep.portions,
    };
    update({ ingredients: arr });
  };

  // IA
  const generateFromAI = async () => {
    if (!value.content) return;
    try {
      const res = await fetch('/api/analyze-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: value.content }),
      });
      if (!res.ok) throw new Error('API error');
      const newIngredients = await res.json();
      update({ ingredients: newIngredients });
    } catch (e) {
      console.error('AI generation failed', e);
    }
  };

  // Imagen
  const previewSrc = imageFile ? URL.createObjectURL(imageFile) : (imageUrl || null);
  const triggerFile = () => fileInputRef.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    if (f && onImageSelect) onImageSelect(f);
  };

  const catIcon = categoryIcons[normalizeCategory(category)];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-md shadow-2xl w-full max-w-5xl h-[90vh] max-h-[94vh] overflow-hidden flex flex-col" style={{ border: '1px solid #E8E5DE' }}>
        {descFocused && (
          <div
            className="absolute inset-0 z-50"
            style={{ backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)', backgroundColor: 'rgba(255,255,255,0.05)' }}
            onMouseDown={() => setDescFocused(false)}
          />
        )}

        {/* ─── Encabezado ─── */}
        <div className="flex items-center gap-3 px-5 py-2.5 flex-shrink-0" style={{ borderBottom: '1px solid #E8E5DE' }}>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-[#A8A29E] font-semibold">
            <img src={`/icons/${catIcon}.svg`} alt="" className="w-4 h-4" />
            {onCategoryChange ? (
              <div className="relative">
                <button
                  onClick={() => setCatOpen(o => !o)}
                  className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                >
                  <span>{t(`meals.categories.${category}`)}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
                {catOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setCatOpen(false)} />
                    <div className="absolute top-full left-0 mt-1 z-20 bg-white rounded-md shadow-lg py-1 min-w-[140px]" style={{ border: '1px solid #E8E5DE' }}>
                      {(Object.keys(categoryLabels) as MealCategory[]).map(c => (
                        <button
                          key={c}
                          onClick={() => { onCategoryChange(c); setCatOpen(false); }}
                          className={`w-full text-left px-3 py-1.5 text-[11px] uppercase tracking-wider flex items-center gap-2 hover:bg-gray-50 transition-colors ${c === category ? 'text-gray-900 font-semibold bg-gray-50' : 'text-gray-600'}`}
                        >
                          <img src={`/icons/${categoryIcons[c]}.svg`} alt="" className="w-3.5 h-3.5" />
                          {t(`meals.categories.${c}`)}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <span>{t(`meals.categories.${category}`)}{optionLabel ? ` · ${optionLabel}` : ''}</span>
            )}
          </div>
          {onCountryChange && (
            <div className="w-52">
              <CountryTypeahead value={country ?? null} onChange={onCountryChange} placeholder="País típico (opcional)…" />
            </div>
          )}
          <button
            onClick={onClose}
            className="ml-auto p-1 rounded hover:bg-gray-100 transition-colors flex-shrink-0"
            title={t('consultation.editor.close')}
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {/* ─── Cuerpo ─── */}
        <div className="overflow-auto flex-1 px-5 py-4 space-y-4">
          {/* Imagen + Nombre + Descripción */}
          <div className="flex items-start gap-3">
            {/* Columna foto: spacer = alto del label para alinear con el input */}
            <div className="flex-shrink-0 flex flex-col">
              <div className="h-[21px] flex-shrink-0" />
              <div className="relative w-[136px] h-[136px]">
                {showImageUpload ? (
                  <>
                    <button
                      type="button"
                      onClick={triggerFile}
                      className="group/img w-full h-full rounded-sm relative flex items-center justify-center text-gray-400 transition-colors overflow-hidden"
                      style={{ backgroundColor: '#F4F2EE', border: '1px solid #E8E5DE' }}
                      title={previewSrc ? t('consultation.editor.changeImage') : t('consultation.editor.addImage')}
                    >
                      {previewSrc ? (
                        <img src={previewSrc} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="9" cy="9" r="2" />
                          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                        </svg>
                      )}
                      {/* Overlay de hover: indica que se puede cargar/cambiar */}
                      <span className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/45 text-white opacity-0 group-hover/img:opacity-100 transition-opacity">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
                          <path d="M12 16V4m0 0L8 8m4-4 4 4" /><path d="M20 16v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2" />
                        </svg>
                        <span className="text-[10px] font-semibold px-2 text-center leading-tight">{previewSrc ? t('consultation.editor.changeImage') : t('consultation.editor.addImage')}</span>
                      </span>
                    </button>
                    {previewSrc && onImageRemove && (
                      <button
                        type="button"
                        onClick={onImageRemove}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                        style={{ border: '1px solid #E8E5DE' }}
                        title={t('consultation.editor.removeImage')}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </>
                ) : (
                  <button
                    type="button"
                    className="w-full h-full rounded-sm flex items-center justify-center text-gray-400 transition-colors hover:bg-gray-50"
                    style={{ backgroundColor: '#F4F2EE', border: '1px solid #E8E5DE' }}
                    title={t('consultation.editor.addImage')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="9" cy="9" r="2" />
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              {/* Nombre */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-[#A8A29E] block mb-1.5">{t('consultation.editor.name')}</label>
                <input
                  type="text"
                  className="w-full px-3 py-1 text-sm rounded-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-white border border-[#E0DCD4] text-gray-800 placeholder:text-gray-400"
                  value={value.name}
                  onChange={(e) => update({ name: e.target.value })}
                  placeholder={t('consultation.editor.namePh')}
                  autoFocus
                />
              </div>

              {/* Descripción + IA */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-[#A8A29E]">{t('consultation.editor.descLabel')}</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowAIMenu((s) => !s)}
                      className="text-[11px] px-2.5 py-1 rounded-md inline-flex items-center gap-1.5 font-medium text-white transition-opacity hover:opacity-90"
                      style={{ backgroundImage: 'linear-gradient(90deg, #8B5CF6, #7C3AED)' }}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {t('consultation.editor.aiGenerate')}
                      <ChevronDown className="w-3 h-3 opacity-80" />
                    </button>
                    {showAIMenu && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowAIMenu(false)} />
                        <div className="absolute right-0 mt-1 z-50 w-64 rounded-md bg-white py-1 shadow-lg" style={{ border: '1px solid #E8E5DE' }}>
                          <div className="px-3 py-1 text-[9px] font-semibold uppercase tracking-wider" style={{ color: '#A8A29E' }}>{t('consultation.editor.aiMenuTitle')}</div>
                          <button
                            type="button"
                            onClick={() => { generateFromAI(); setShowAIMenu(false); }}
                            disabled={!value.content}
                            className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 text-gray-700 hover:bg-[#FAF9F7] disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <ListPlus className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
                            {t('consultation.editor.aiCreateFromDesc')}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setShowAIMenu(false); }}
                            className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 text-gray-700 hover:bg-[#FAF9F7]"
                          >
                            <FileText className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
                            {t('consultation.editor.aiGenerateDesc')}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setShowAIMenu(false); }}
                            className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 text-gray-700 hover:bg-[#FAF9F7]"
                          >
                            <Wand2 className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
                            {t('consultation.editor.aiCreateBoth')}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                {/* Al enfocar crece en su lugar (z alto) sobre el resto oscurecido. */}
                <div className="relative" style={{ minHeight: '74px' }}>
                  <textarea
                    onFocus={() => setDescFocused(true)}
                    onBlur={() => setDescFocused(false)}
                    className={`w-full px-3 py-2 text-xs rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-200 resize-none overflow-y-auto bg-white border border-[#E0DCD4] text-gray-800 placeholder:text-gray-400 ${descFocused ? 'absolute top-0 left-0 right-0 z-[60]' : 'relative'}`}
                    style={descFocused ? { height: 'min(440px, 52vh)', boxShadow: '0 16px 40px -14px rgba(0,0,0,0.25), 0 4px 12px -6px rgba(0,0,0,0.15)' } : undefined}
                    value={value.content || ''}
                    onChange={(e) => update({ content: e.target.value })}
                    placeholder={t('consultation.editor.descriptionPh')}
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Ingredientes */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-[#A8A29E]">{t('consultation.editor.ingredients')}</label>
              {ingredients.length > 0 && (
                <span className="text-[10px] text-gray-400">{ingredients.length} {ingredients.length === 1 ? t('consultation.editor.ingredientOne') : t('consultation.editor.ingredientMany')}</span>
              )}
            </div>

            <div className="mb-2">
              <IngredientTypeahead
                value=""
                onChange={() => {}}
                onSelectIngredient={addIngredient}
                ingredients={commonIngredients}
              />
            </div>

            {ingredients.length === 0 ? (
              <div className="px-3 py-6 text-center text-[11px] text-gray-500 rounded-sm" style={{ backgroundColor: '#FAF9F7', border: '1px dashed #E8E5DE' }}>
                {t('consultation.editor.emptyIngredients')}
              </div>
            ) : (
              <>
              <div className="rounded-md overflow-hidden" style={{ border: '1px solid #E8E5DE' }}>
                {/* Header */}
                <div className="flex items-center gap-2 px-3 py-2" style={{ backgroundColor: '#FCFBF9', borderBottom: '1px solid #E8E5DE' }}>
                  <div className="w-5 flex-shrink-0" />
                  <div className="flex-1 min-w-0 text-[9px] uppercase tracking-wider font-semibold" style={{ color: '#A8A29E' }}>Alimento</div>
                  <div className="flex items-center gap-3 text-[9px] uppercase tracking-wider font-semibold flex-shrink-0" style={{ color: '#A8A29E' }}>
                    <span className="w-9 text-right">Prot</span>
                    <span className="w-9 text-right">Carb</span>
                    <span className="w-9 text-right">Gras</span>
                    <span className="w-14 text-right">kcal</span>
                  </div>
                  <div className="w-[22px] flex-shrink-0" />
                </div>
                <ul className="divide-y divide-[#F0EDE8]">
                  {ingredients.map((ing, idx) => {
                    const q = Number(ing.quantity || 0);
                    const p = (Number(ing.protein  || 0) * q) / 100;
                    const c = (Number(ing.carbs    || 0) * q) / 100;
                    const f = (Number(ing.fat      || 0) * q) / 100;
                    const kcal = (Number(ing.calories || 0) * q) / 100;
                    return (
                      <li key={idx} className="flex items-center gap-2 px-3 py-2 hover:bg-[#FAF9F7] transition-colors group">
                        {ing.icon ? (
                          <img src={`/icons/${ing.icon}.svg`} alt="" className="w-5 h-5 flex-shrink-0" />
                        ) : (
                          <div className="w-5 h-5 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0 text-xs font-medium truncate text-gray-800">
                          {ing.baseName ?? ing.name}
                        </div>
                        {ing.preparations && ing.preparations.length > 1 && (
                          <PrepSelector
                            preparations={ing.preparations}
                            value={ing.prepKey}
                            onChange={(k) => setIngredientPrep(idx, k)}
                          />
                        )}
                        <div className="flex items-center justify-end flex-shrink-0">
                          <PortionPicker
                            ingredient={ing}
                            grams={q}
                            unit={ing.unit}
                            onChange={(g, u) => setIngredientPortion(idx, g, u)}
                          />
                        </div>
                        <div className="flex items-center gap-3 text-[11px] tabular-nums flex-shrink-0 text-gray-600">
                          <span className="w-9 text-right">{p.toFixed(0)}</span>
                          <span className="w-9 text-right">{c.toFixed(0)}</span>
                          <span className="w-9 text-right">{f.toFixed(0)}</span>
                          <span className="w-14 text-right text-xs font-semibold text-gray-800">{Math.round(kcal)}</span>
                        </div>
                        <button
                          onClick={() => removeIngredient(idx)}
                          className="p-1 rounded transition-all opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 hover:bg-red-50"
                          title={t('consultation.editor.removeIngredient')}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
                {/* Total */}
                <div className="flex items-center gap-2 px-3 py-2" style={{ backgroundColor: '#FCFBF9', borderTop: '1px solid #E8E5DE' }}>
                  <div className="w-5 flex-shrink-0" />
                  <div className="flex-1 min-w-0 text-[10px] uppercase tracking-wider font-semibold text-gray-500">{t('consultation.editor.total')}</div>
                  <div className="flex items-center gap-3 text-[11px] tabular-nums flex-shrink-0 text-gray-700">
                    <span className="w-9 text-right font-semibold">{totals.p.toFixed(0)}</span>
                    <span className="w-9 text-right font-semibold">{totals.c.toFixed(0)}</span>
                    <span className="w-9 text-right font-semibold">{totals.f.toFixed(0)}</span>
                    <span className="w-14 text-right text-xs font-bold text-gray-900">{Math.round(totals.cal)}</span>
                  </div>
                  <div className="w-[22px] flex-shrink-0" />
                </div>
              </div>

              {/* Indicadores */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                {/* Macros — barra apilada */}
                <div className="rounded-lg p-3.5 flex flex-col" style={{ backgroundColor: '#FAF9F7', border: '1px solid #E8E5DE' }}>
                  <div className="text-[9px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#A8A29E' }}>Distribución</div>
                  <div className="flex items-baseline gap-1.5 h-6">
                    <span className="text-lg font-semibold tabular-nums leading-none" style={{ color: '#2D2B28' }}>{Math.round(totals.cal)}</span>
                    <span className="text-[10px]" style={{ color: '#A8A29E' }}>kcal</span>
                  </div>
                  <div className="mt-3">
                    <div className="flex h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#E8E5DE' }}>
                      <div style={{ width: `${pP}%`, backgroundColor: '#EF4444' }} />
                      <div style={{ width: `${pC}%`, backgroundColor: '#F59E0B' }} />
                      <div style={{ width: `${pF}%`, backgroundColor: '#3B82F6' }} />
                    </div>
                    <div className="flex items-center justify-between mt-1.5 text-[10px]">
                      <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#EF4444' }} /><span style={{ color: '#A8A29E' }}>Prot</span> <span className="font-semibold tabular-nums" style={{ color: '#2D2B28' }}>{Math.round(pP)}%</span></span>
                      <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#F59E0B' }} /><span style={{ color: '#A8A29E' }}>Carb</span> <span className="font-semibold tabular-nums" style={{ color: '#2D2B28' }}>{Math.round(pC)}%</span></span>
                      <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#3B82F6' }} /><span style={{ color: '#A8A29E' }}>Grasa</span> <span className="font-semibold tabular-nums" style={{ color: '#2D2B28' }}>{Math.round(pF)}%</span></span>
                    </div>
                  </div>
                </div>

                {/* Densidad energética — valor + escala */}
                <div className="rounded-lg p-3.5 flex flex-col" style={{ backgroundColor: '#FAF9F7', border: '1px solid #E8E5DE' }}>
                  <div className="text-[9px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#A8A29E' }}>Densidad energética</div>
                  <div className="flex items-baseline gap-1.5 h-6">
                    <span className="text-lg font-semibold tabular-nums leading-none" style={{ color: '#2D2B28' }}>{density.toFixed(1)}</span>
                    <span className="text-[10px]" style={{ color: '#A8A29E' }}>kcal/g</span>
                    <span className="ml-auto text-[10px] font-semibold capitalize" style={{ color: densColor }}>{densCat}</span>
                  </div>
                  <div className="mt-3">
                    <div className="relative">
                      <div className="h-1.5 rounded-full overflow-hidden flex">
                        <div className="h-full" style={{ width: '50%', backgroundColor: '#34D399' }} />
                        <div className="h-full" style={{ width: '33.34%', backgroundColor: '#FBBF24' }} />
                        <div className="h-full" style={{ width: '16.66%', backgroundColor: '#EF4444' }} />
                      </div>
                      <div className="absolute top-1/2 -translate-y-1/2 h-3 w-0.5 bg-gray-800 rounded-sm" style={{ left: `calc(${densFrac}% - 1px)`, boxShadow: '0 0 0 1.5px #FAF9F7' }} />
                    </div>
                    <div className="flex justify-between mt-1.5 text-[8px] uppercase tracking-wide" style={{ color: '#A8A29E' }}><span>Baja</span><span>Media</span><span>Alta</span></div>
                  </div>
                </div>

                {/* Calidad proteica — valor + escala */}
                <div className="rounded-lg p-3.5 flex flex-col" style={{ backgroundColor: '#FAF9F7', border: '1px solid #E8E5DE' }}>
                  <div className="text-[9px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#A8A29E' }}>Calidad proteica</div>
                  <div className="flex items-baseline gap-1.5 h-6">
                    <span className="text-lg font-semibold tabular-nums leading-none" style={{ color: '#2D2B28' }}>{protPer100.toFixed(1)}</span>
                    <span className="text-[10px]" style={{ color: '#A8A29E' }}>g/100kcal</span>
                    <span className="ml-auto text-[10px] font-semibold capitalize" style={{ color: protColor }}>{protCat}</span>
                  </div>
                  <div className="mt-3">
                    <div className="relative">
                      <div className="h-1.5 rounded-full overflow-hidden flex">
                        <div className="h-full" style={{ width: '38.5%', backgroundColor: '#EF4444' }} />
                        <div className="h-full" style={{ width: '30.7%', backgroundColor: '#FBBF24' }} />
                        <div className="h-full" style={{ width: '30.8%', backgroundColor: '#34D399' }} />
                      </div>
                      <div className="absolute top-1/2 -translate-y-1/2 h-3 w-0.5 bg-gray-800 rounded-sm" style={{ left: `calc(${protFrac}% - 1px)`, boxShadow: '0 0 0 1.5px #FAF9F7' }} />
                    </div>
                    <div className="flex justify-between mt-1.5 text-[8px] uppercase tracking-wide" style={{ color: '#A8A29E' }}><span>Baja</span><span>Media</span><span>Alta</span></div>
                  </div>
                </div>
              </div>
              </>
            )}
          </div>
        </div>

        {/* ─── Footer ─── */}
        <div className="bg-gray-50 flex-shrink-0" style={{ borderTop: '1px solid #E8E5DE' }}>
          <div className="px-5 py-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">{footerLeft}</div>
            {primaryAction && (
              <button
                onClick={primaryAction.onClick}
                disabled={primaryAction.disabled || primaryAction.loading}
                className="text-xs px-4 py-1.5 rounded font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {primaryAction.loading ? t('consultation.saveMeal.saving') : primaryAction.label}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealOptionEditor;
