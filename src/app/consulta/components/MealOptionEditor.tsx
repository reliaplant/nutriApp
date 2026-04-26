'use client'

import React, { useRef, useState } from 'react';
import { ChevronDown, ChevronUp, X, Upload, Image as ImageIcon } from 'lucide-react';
import { TrashCan } from '@carbon/icons-react';
import IngredientTypeahead, { Ingredient } from './IngredientTypeahead';
import PortionPicker from './PortionPicker';
import { getDefaultGramsForIngredient } from './portionsHelper';
import { categoryLabels, categoryIcons, MealCategory } from '@/app/comidas/constants';

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
  const [showInstructions, setShowInstructions] = useState(!!value.instructions);
  const [catOpen, setCatOpen] = useState(false);
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

  // Mutaciones de ingredientes
  const addIngredient = (ing: Ingredient) => {
    const grams = getDefaultGramsForIngredient(ing);
    update({
      ingredients: [
        ...ingredients,
        {
          name: ing.name,
          quantity: grams,
          calories: Number(ing.calories) || 0,
          protein:  Number(ing.protein)  || 0,
          carbs:    Number(ing.carbs)    || 0,
          fat:      Number(ing.fat)      || 0,
          icon: ing.icon,
        },
      ],
    });
  };

  const removeIngredient = (idx: number) => {
    const arr = [...ingredients];
    arr.splice(idx, 1);
    update({ ingredients: arr });
  };

  const setIngredientGrams = (idx: number, g: number) => {
    const arr = [...ingredients];
    arr[idx] = { ...arr[idx], quantity: g };
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

  const catIcon = categoryIcons[category];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-md shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col">

        {/* ─── Encabezado ─── */}
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-gray-400 font-medium">
            <img src={`/icons/${catIcon}.svg`} alt="" className="w-4 h-4" />
            {onCategoryChange ? (
              <div className="relative">
                <button
                  onClick={() => setCatOpen(o => !o)}
                  className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                >
                  <span>{categoryLabels[category]}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
                {catOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setCatOpen(false)} />
                    <div className="absolute top-full left-0 mt-1 z-20 bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-[140px]">
                      {(Object.keys(categoryLabels) as MealCategory[]).map(c => (
                        <button
                          key={c}
                          onClick={() => { onCategoryChange(c); setCatOpen(false); }}
                          className={`w-full text-left px-3 py-1.5 text-[11px] uppercase tracking-wider flex items-center gap-2 hover:bg-gray-50 transition-colors ${c === category ? 'text-gray-900 font-semibold bg-gray-50' : 'text-gray-600'}`}
                        >
                          <img src={`/icons/${categoryIcons[c]}.svg`} alt="" className="w-3.5 h-3.5" />
                          {categoryLabels[c]}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <span>{categoryLabels[category]}{optionLabel ? ` · ${optionLabel}` : ''}</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 transition-colors flex-shrink-0"
            title="Cerrar"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {/* ─── Cuerpo ─── */}
        <div className="overflow-auto flex-1 px-5 py-4 space-y-4">
          {/* Imagen + Nombre + Descripción */}
          <div className="flex gap-3">
            {showImageUpload ? (
              <div className="relative w-28 h-28 flex-shrink-0">
                <button
                  type="button"
                  onClick={triggerFile}
                  className="w-full h-full rounded-sm bg-gray-100 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 flex items-center justify-center text-gray-400 transition-colors overflow-hidden"
                  title={previewSrc ? 'Cambiar imagen' : 'Añadir imagen'}
                >
                  {previewSrc ? (
                    <img src={previewSrc} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-7 h-7" />
                  )}
                </button>
                {previewSrc && onImageRemove && (
                  <button
                    type="button"
                    onClick={onImageRemove}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                    title="Quitar imagen"
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
              </div>
            ) : (
              <button
                type="button"
                className="w-28 h-28 rounded-sm flex-shrink-0 bg-gray-100 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 flex items-center justify-center text-gray-400 transition-colors self-start"
                title="Añadir imagen"
              >
                <ImageIcon className="w-7 h-7" />
              </button>
            )}

            <div className="flex-1 min-w-0 space-y-3">
              {/* Nombre */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 block mb-1.5">Nombre</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm rounded-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-white border border-gray-300 text-gray-800 placeholder:text-gray-400"
                  value={value.name}
                  onChange={(e) => update({ name: e.target.value })}
                  placeholder="Nombre de la receta…"
                  autoFocus
                />
              </div>

              {/* Descripción + IA */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Descripción</label>
                  <button
                    onClick={generateFromAI}
                    className={`text-[11px] px-2 py-1 rounded inline-flex items-center gap-1.5 font-medium transition-colors ${value.content ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'text-gray-300 cursor-not-allowed'}`}
                    disabled={!value.content}
                    title={!value.content ? 'Escribe una descripción primero' : ''}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-3.5 h-3.5">
                      <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48 2.83-2.83" />
                    </svg>
                    Generar con IA
                  </button>
                </div>
                <textarea
                  className="w-full px-3 py-2 text-xs rounded-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 resize-none transition-shadow bg-gray-50 border border-gray-200 text-gray-800 placeholder:text-gray-400"
                  value={value.content || ''}
                  onChange={(e) => update({ content: e.target.value })}
                  placeholder="Ej: Pollo a la plancha 150g, arroz integral 80g, ensalada con tomate y aceite de oliva…"
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Ingredientes */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Ingredientes</label>
              {ingredients.length > 0 && (
                <span className="text-[10px] text-gray-400">{ingredients.length} {ingredients.length === 1 ? 'ingrediente' : 'ingredientes'}</span>
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
              <div className="px-3 py-6 text-center text-[11px] text-gray-400 bg-gray-50 rounded-sm border border-dashed border-gray-200">
                Busca y añade ingredientes arriba, o usa <span className="font-medium text-emerald-700">Generar con IA</span> para auto-completar.
              </div>
            ) : (
              <div className="border border-gray-200 rounded-sm overflow-hidden">
                <ul className="divide-y divide-gray-100">
                  {ingredients.map((ing, idx) => {
                    const q = Number(ing.quantity || 0);
                    const p = (Number(ing.protein  || 0) * q) / 100;
                    const c = (Number(ing.carbs    || 0) * q) / 100;
                    const f = (Number(ing.fat      || 0) * q) / 100;
                    const kcal = (Number(ing.calories || 0) * q) / 100;
                    return (
                      <li key={idx} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 transition-colors group">
                        {ing.icon ? (
                          <img src={`/icons/${ing.icon}.svg`} alt="" className="w-5 h-5 flex-shrink-0" />
                        ) : (
                          <div className="w-5 h-5 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0 text-xs font-medium truncate text-gray-800">{ing.name}</div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <PortionPicker
                            ingredient={ing}
                            grams={q}
                            onChange={(g) => setIngredientGrams(idx, g)}
                          />
                        </div>
                        <div className="flex items-center gap-3 text-[11px] tabular-nums text-gray-500 flex-shrink-0">
                          <span className="w-9 text-right">{p.toFixed(0)}<span className="text-[9px] text-gray-400">P</span></span>
                          <span className="w-9 text-right">{c.toFixed(0)}<span className="text-[9px] text-gray-400">C</span></span>
                          <span className="w-9 text-right">{f.toFixed(0)}<span className="text-[9px] text-gray-400">G</span></span>
                          <span className="w-14 text-right text-xs font-semibold text-gray-700">{Math.round(kcal)}<span className="text-[9px] font-normal ml-0.5 text-gray-400">cal</span></span>
                        </div>
                        <button
                          onClick={() => removeIngredient(idx)}
                          className="p-1 rounded transition-all opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 hover:bg-red-50"
                          title="Quitar ingrediente"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
                {/* Total */}
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-t border-gray-200">
                  <div className="w-5 flex-shrink-0" />
                  <div className="flex-1 min-w-0 text-[10px] uppercase tracking-wider font-semibold text-gray-500">Total</div>
                  <div className="flex items-center gap-3 text-[11px] tabular-nums flex-shrink-0">
                    <span className="w-9 text-right font-semibold text-gray-800">{totals.p.toFixed(0)}<span className="text-[9px] font-normal text-gray-500">P</span></span>
                    <span className="w-9 text-right font-semibold text-gray-800">{totals.c.toFixed(0)}<span className="text-[9px] font-normal text-gray-500">C</span></span>
                    <span className="w-9 text-right font-semibold text-gray-800">{totals.f.toFixed(0)}<span className="text-[9px] font-normal text-gray-500">G</span></span>
                    <span className="w-14 text-right text-xs font-bold text-gray-900">{Math.round(totals.cal)}<span className="text-[9px] font-normal ml-0.5 text-gray-500">cal</span></span>
                  </div>
                  <div className="w-[22px] flex-shrink-0" />
                </div>
              </div>
            )}
          </div>

          {/* Instrucciones */}
          <div>
            <button
              type="button"
              className="flex items-center gap-1 text-[11px] font-medium text-gray-600 hover:text-gray-800 transition-colors"
              onClick={() => setShowInstructions(s => !s)}
            >
              {showInstructions ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5 rotate-180" />}
              Instrucciones de preparación
              {value.instructions && !showInstructions && <span className="text-[10px] text-gray-400 ml-1">(añadidas)</span>}
            </button>
            {showInstructions && (
              <textarea
                className="mt-1.5 w-full px-3 py-2 text-xs rounded-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 resize-none transition-shadow bg-gray-50 border border-gray-200 text-gray-800 placeholder:text-gray-400"
                placeholder="Cómo preparar esta comida…"
                value={value.instructions || ''}
                onChange={(e) => update({ instructions: e.target.value })}
                rows={3}
              />
            )}
          </div>
        </div>

        {/* ─── Footer ─── */}
        <div className="border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="px-5 py-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">{footerLeft}</div>
            {primaryAction && (
              <button
                onClick={primaryAction.onClick}
                disabled={primaryAction.disabled || primaryAction.loading}
                className="text-xs px-4 py-1.5 rounded font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {primaryAction.loading ? 'Guardando…' : primaryAction.label}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealOptionEditor;
