'use client'

import React, { useState } from 'react';
import { 
  TrashCan, 
  CalculatorCheck, 
  Strawberry, 
  Save 
} from '@carbon/icons-react';
import IngredientTypeahead, { Ingredient } from '@/app/consulta/components/IngredientTypeahead';
import { getPortionsForIngredient, getDefaultGramsForIngredient } from '@/app/consulta/components/portionsHelper';
import PortionPicker from '@/app/consulta/components/PortionPicker';
import { ChevronDown, ChevronUp, X, Plus, Pencil } from 'lucide-react';
import SaveMealOption from '@/app/consulta/components/saveMeals';
import LoadSavedMeal from './LoadSavedMeal';
import { categoryLabels, categoryColors, categoryIcons, MealCategory } from '@/app/comidas/constants';
import ConfirmDialog from '@/app/components/confirmDialog';

export interface MealOption {
  name: string;     // Nombre corto de la receta
  content: string;  // Descripción detallada
  ingredients: Ingredient[];
  isSelectedForSummary?: boolean;
  instructions?: string; // Campo para instrucciones
}

export interface Meal {
  name: string;
  time: string;
  options: MealOption[];
  activeOptionIndex: number;
  selectedOptionForSummary: number;
  category?: MealCategory;
  isActive?: boolean;
}

type IngredientNumericField = 'quantity' | 'calories' | 'protein' | 'carbs' | 'fat';

// Componente para un item de comida individual
interface MealItemProps {
  meal: Meal;
  mealIndex: number;
  meals: Meal[];
  onMealsChange: (meals: Meal[]) => void;
  handleMealChange: (index: number, field: keyof Meal, value: string) => void;
  handleContentChange: (mealIndex: number, optionIndex: number, content: string) => void;
  setActiveOption: (mealIndex: number, optionIndex: number) => void;
  setSelectedOptionForSummary: (mealIndex: number, optionIndex: number) => void;
  addMealOption: (mealIndex: number) => void;
  removeMealOption: (mealIndex: number, optionIndex: number) => void;
  addIngredient: (mealIndex: number, optionIndex?: number, ingredientData?: Ingredient) => void;
  removeIngredient: (mealIndex: number, optionIndex: number, ingredientIndex: number) => void;
  handleIngredientNameChange: (mealIndex: number, ingredientIndex: number, value: string) => void;
  handleSelectIngredient: (mealIndex: number, ingredientIndex: number, ingredient: Ingredient) => void;
  handleIngredientChange: (mealIndex: number, ingredientIndex: number, field: IngredientNumericField, value: number) => void;
  removeMeal: (index: number) => void;
  commonIngredients: any[];
  handleInstructionsChange: (mealIndex: number, optionIndex: number, instructions: string) => void;
  onToggleActive: () => void;
}

const MealItem: React.FC<MealItemProps> = ({ 
  meal, 
  mealIndex,
  meals,
  onMealsChange,
  handleMealChange,
  handleContentChange,
  setActiveOption,
  setSelectedOptionForSummary,
  addMealOption,
  removeMealOption,                          
  addIngredient,
  removeIngredient,
  handleIngredientNameChange,
  handleSelectIngredient,
  handleIngredientChange,
  removeMeal,
  commonIngredients,
  handleInstructionsChange,
  onToggleActive
}) => {
  // Estados del componente
  const [showInstructionsMap, setShowInstructionsMap] = useState<Record<number, boolean>>({});
  const [deleteOptionIndex, setDeleteOptionIndex] = useState<number | null>(null);
  const [expandedOptions, setExpandedOptions] = useState<number | null>(null);
  const [editingOptionIndex, setEditingOptionIndex] = useState<number | null>(null);
  const [editingTime, setEditingTime] = useState(false);
  const [tempTime, setTempTime] = useState(meal.time || '');

  const toggleOptionExpanded = (optionIndex: number) => {
    setExpandedOptions(prev => prev === optionIndex ? null : optionIndex);
  };

  const getDefaultCategory = (): MealCategory => {
    if (meal.category) return meal.category;
    const hour = parseInt(meal.time?.split(':')[0] || '0');
    if (hour >= 6 && hour < 10) return 'desayuno';
    if (hour >= 10 && hour < 12) return 'mediaManana';
    if (hour >= 12 && hour < 15) return 'almuerzo';
    if (hour >= 15 && hour < 18) return 'lunchTarde';
    if (hour >= 18 && hour < 23) return 'cena';
    return 'general';
  };

  const commitTime = () => {
    if (tempTime && /^\d{2}:\d{2}$/.test(tempTime)) {
      handleMealChange(mealIndex, 'time', tempTime);
    } else {
      setTempTime(meal.time || '');
    }
    setEditingTime(false);
  };

  const category = getDefaultCategory();
  const catColor = categoryColors[category];
  const catIcon = categoryIcons[category];

  return (
    <div className={`group/meal rounded-md overflow-hidden transition-all duration-300 ease-in-out ${meal.isActive === false ? 'opacity-60' : 'bg-white'}`} style={{ border: '1px solid #E8E5DE', backgroundColor: meal.isActive === false ? '#F4F2EE' : undefined }}>
      {/* Header */}
      <div className={`px-3 py-2 flex items-center justify-between`} style={meal.isActive === false ? undefined : { borderBottom: '1px solid #F0EDE8' }}>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="relative inline-flex items-center cursor-pointer flex-shrink-0" onClick={(e) => { e.stopPropagation(); onToggleActive(); }}>
            <input type="checkbox" checked={meal.isActive !== false} onChange={() => {}} className="sr-only peer" />
            <div className="w-7 h-4 rounded-full peer-checked:after:translate-x-3 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all after:shadow-sm cursor-pointer transition-colors"
              style={{ backgroundColor: meal.isActive !== false ? catColor.dark : '#D1D5DB' }}
            ></div>
          </div>
          <div className="w-7 h-7 flex items-center justify-center flex-shrink-0">
            <img src={`/icons/${catIcon}.svg`} alt="" className="w-6 h-6" />
          </div>
          <span className="text-[11px] font-semibold flex-shrink-0 text-gray-800">
            {categoryLabels[category]}
          </span>
          <span className="text-xs text-gray-400">·</span>
          {editingTime ? (
            <input
              type="time"
              className="text-[11px] border border-gray-300 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-emerald-200 w-20 text-gray-700 bg-white"
              value={tempTime}
              autoFocus
              onChange={(e) => setTempTime(e.target.value)}
              onBlur={() => commitTime()}
              onKeyDown={(e) => { if (e.key === 'Enter') commitTime(); }}
            />
          ) : (
            <span
              className="text-[11px] cursor-pointer hover:opacity-70 transition-opacity text-gray-500"
              onDoubleClick={() => { setTempTime(meal.time || ''); setEditingTime(true); }}
            >
              {meal.time ? meal.time.split(':')[0] + 'h' : 'Sin hora'}
            </span>
          )}
        </div>
        {/* Macros */}
        {meal.isActive !== false && meal.options.length > 0 && (() => {
          const optionTotals = meal.options.map(opt => ({
            cal: opt.ingredients.reduce((s, i) => s + (Number(i.calories || 0) * Number(i.quantity || 0) / 100), 0),
            prot: opt.ingredients.reduce((s, i) => s + (Number(i.protein || 0) * Number(i.quantity || 0) / 100), 0),
            carbs: opt.ingredients.reduce((s, i) => s + (Number(i.carbs || 0) * Number(i.quantity || 0) / 100), 0),
            fat: opt.ingredients.reduce((s, i) => s + (Number(i.fat || 0) * Number(i.quantity || 0) / 100), 0),
          }));
          const n = optionTotals.length;
          const avg = {
            cal: optionTotals.reduce((s, o) => s + o.cal, 0) / n,
            prot: optionTotals.reduce((s, o) => s + o.prot, 0) / n,
            carbs: optionTotals.reduce((s, o) => s + o.carbs, 0) / n,
            fat: optionTotals.reduce((s, o) => s + o.fat, 0) / n,
          };
          return (
            <div className="flex items-center text-[10px] tabular-nums">
              <span className="font-semibold text-gray-800 w-16 text-right">{Math.round(avg.cal)} <span className="font-normal text-gray-500">kcal</span></span>
              <span className="font-medium text-gray-500 w-12 text-right">{avg.prot.toFixed(0)}g P</span>
              <span className="font-medium text-gray-500 w-12 text-right">{avg.carbs.toFixed(0)}g C</span>
              <span className="font-medium text-gray-500 w-12 text-right">{avg.fat.toFixed(0)}g G</span>
              {/* Spacer invisible para alinear con los iconos de las opciones (52px de acciones + 12px ml-3 + ~7px de borde/padding extra de la card) */}
              <span className="w-[71px] flex-shrink-0" aria-hidden="true" />
            </div>
          );
        })()}
      </div>

      {/* Content with transition */}
      <div className={`grid transition-all duration-300 ease-in-out ${meal.isActive === false ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'}`}>
        <div className="overflow-hidden">
        {meal.options.length === 0 ? (
          <div className="px-3 py-5 flex flex-col items-center justify-center text-center" style={{ backgroundColor: '#FAF9F7' }}>
            <div className="w-10 h-10 flex items-center justify-center mb-2">
              <img src={`/icons/${catIcon}.svg`} alt="" className="w-8 h-8 opacity-50" />
            </div>
            <p className="text-[11px] mb-2 text-gray-500">Sin opciones de comida</p>
            <button
              onClick={() => addMealOption(mealIndex)}
              className="px-3 py-1 text-[11px] font-medium rounded transition-colors text-emerald-700 bg-white border border-emerald-200 hover:bg-emerald-50"
            >
              + Añadir opción
            </button>
          </div>
        ) : (
        <>
        {/* Options */}
        <div className="p-2 flex flex-col gap-1.5" style={{ backgroundColor: '#FAF9F7' }}>
          {meal.options.map((option, optionIndex) => {
            const optionCalories = option.ingredients.reduce((sum, ing) => sum + (Number(ing.calories || 0) * Number(ing.quantity || 0) / 100), 0);
            const optionProtein = option.ingredients.reduce((sum, i) => sum + (Number(i.protein || 0) * Number(i.quantity || 0) / 100), 0);
            const optionCarbs = option.ingredients.reduce((sum, i) => sum + (Number(i.carbs || 0) * Number(i.quantity || 0) / 100), 0);
            const optionFat = option.ingredients.reduce((sum, i) => sum + (Number(i.fat || 0) * Number(i.quantity || 0) / 100), 0);
            const isExpanded = expandedOptions === optionIndex;
            const showInstructions = showInstructionsMap[optionIndex] ?? false;
            const hasContent = option.ingredients.length > 0 || !!option.content;

            return (
              <div key={optionIndex} className="rounded-md transition-all bg-white" style={{ border: '1px solid #E8E5DE' }}>
                {/* Option header — fila compacta con macros visibles */}
                <div
                  className={`px-2.5 py-1.5 flex items-center justify-between cursor-pointer transition-colors group/option`}
                  style={isExpanded && hasContent ? { borderBottom: '1px solid #F0EDE8' } : undefined}
                  onClick={() => hasContent && toggleOptionExpanded(optionIndex)}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {/* Placeholder de imagen de la receta */}
                    <div className="w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ backgroundColor: '#F4F2EE', border: '1px solid #E8E5DE' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-gray-400">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="9" cy="9" r="1.5" fill="currentColor" stroke="none" />
                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                      </svg>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 flex-shrink-0 uppercase tracking-wider">Opción {optionIndex + 1}</span>
                    <span className="text-xs font-medium text-gray-800 truncate">
                      {option.name || `Opción ${optionIndex + 1}`}
                    </span>
                  </div>
                  <div className="flex items-center flex-shrink-0">
                    {/* Macros inline — alineadas con el header de la comida */}
                    {hasContent && (
                      <div className="hidden sm:flex items-center text-[10px] tabular-nums">
                        <span className="font-semibold text-gray-700 w-16 text-right">{optionCalories.toFixed(0)} <span className="font-normal text-gray-500">kcal</span></span>
                        <span className="font-medium text-gray-500 w-12 text-right">{optionProtein.toFixed(0)}g P</span>
                        <span className="font-medium text-gray-500 w-12 text-right">{optionCarbs.toFixed(0)}g C</span>
                        <span className="font-medium text-gray-500 w-12 text-right">{optionFat.toFixed(0)}g G</span>
                      </div>
                    )}
                    {/* Bloque de acciones con ancho fijo que coincide con el spacer del header de la comida */}
                    <div className="flex items-center justify-end gap-0.5 w-[52px] flex-shrink-0 ml-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingOptionIndex(optionIndex); }}
                        className="p-1 rounded text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors opacity-0 group-hover/option:opacity-100"
                        title="Editar comida"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      {hasContent && (
                        isExpanded ? (
                          <ChevronUp className="h-3.5 w-3.5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                        )
                      )}
                    </div>
                  </div>
                </div>

                {/* Sub-card content (collapsible) */}
                <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                  <div className="overflow-hidden">
                    {editingOptionIndex === optionIndex ? (
                    /* ===== MODO EDICIÓN — POPUP ===== */
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditingOptionIndex(null)} />
                      <div className="relative bg-white rounded-md shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col" style={{ border: '1px solid #E8E5DE' }}>

                        {/* ─── Encabezado: solo categoría + cerrar ─── */}
                        <div className="flex items-center justify-between px-5 py-2.5 flex-shrink-0" style={{ borderBottom: '1px solid #E8E5DE' }}>
                          <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                            <img src={`/icons/${catIcon}.svg`} alt="" className="w-4 h-4" />
                            <span>{categoryLabels[category]} · Opción {optionIndex + 1}</span>
                          </div>
                          <button
                            onClick={() => setEditingOptionIndex(null)}
                            className="p-1 rounded hover:bg-gray-100 transition-colors flex-shrink-0"
                            title="Cerrar"
                          >
                            <X className="h-4 w-4 text-gray-500" />
                          </button>
                        </div>

                        {/* ─── Cuerpo desplazable ─── */}
                        <div className="overflow-auto flex-1 px-5 py-4 space-y-4">
                          {/* Imagen + Nombre + Descripción */}
                          <div className="flex gap-3">
                            {/* Placeholder imagen */}
                            <button
                              type="button"
                              className="w-28 h-28 rounded-sm flex-shrink-0 flex items-center justify-center text-gray-400 transition-colors self-start hover:bg-gray-50"
                              style={{ backgroundColor: '#F4F2EE', border: '1px solid #E8E5DE' }}
                              title="Añadir imagen"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <circle cx="9" cy="9" r="2" />
                                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                              </svg>
                            </button>

                            <div className="flex-1 min-w-0 space-y-3">
                              {/* Nombre */}
                              <div>
                                <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 block mb-1.5">Nombre</label>
                                <input
                                  type="text"
                                  className="w-full px-3 py-2 text-sm rounded-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-white border border-gray-300 text-gray-800 placeholder:text-gray-400"
                                  value={option.name}
                                  onChange={(e) => {
                                    const updatedMeals = [...meals];
                                    updatedMeals[mealIndex].options[optionIndex].name = e.target.value;
                                    onMealsChange(updatedMeals);
                                  }}
                                  placeholder="Nombre de la receta…"
                                  autoFocus
                                />
                              </div>

                              {/* Descripción + IA */}
                              <div>
                                <div className="flex items-center justify-between mb-1.5">
                                  <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Descripción</label>
                                  <button 
                                    onClick={async () => {
                                      if (!option?.content) return;
                                      try {
                                        const response = await fetch('/api/analyze-meal', {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ description: option.content }),
                                        });
                                        if (!response.ok) throw new Error('API request failed');
                                        const ingredients = await response.json();
                                        const updatedMeals = [...meals];
                                        const updatedMeal = { ...updatedMeals[mealIndex] };
                                        const updatedOptions = [...updatedMeal.options];
                                        updatedOptions[optionIndex] = { ...updatedOptions[optionIndex], ingredients };
                                        updatedMeal.options = updatedOptions;
                                        updatedMeals[mealIndex] = updatedMeal;
                                        onMealsChange(updatedMeals);
                                      } catch (error) {
                                        console.error('Error generating table:', error);
                                      }
                                    }}
                                    className={`text-[11px] px-2 py-1 rounded inline-flex items-center gap-1.5 font-medium transition-colors ${option?.content ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'text-gray-300 cursor-not-allowed'}`}
                                    disabled={!option?.content}
                                    title={!option?.content ? 'Escribe una descripción primero' : ''}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-3.5 h-3.5">
                                      <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48 2.83-2.83" />
                                    </svg>
                                    Generar con IA
                                  </button>
                                </div>
                                <textarea
                                  className="w-full px-3 py-2 text-xs rounded-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 resize-none transition-shadow bg-white border border-gray-300 text-gray-800 placeholder:text-gray-400"
                                  value={option.content || ''}
                                  onChange={(e) => handleContentChange(mealIndex, optionIndex, e.target.value)}
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
                              {option.ingredients.length > 0 && (
                                <span className="text-[10px] text-gray-400">{option.ingredients.length} {option.ingredients.length === 1 ? 'ingrediente' : 'ingredientes'}</span>
                              )}
                            </div>

                            {/* Buscador */}
                            <div className="mb-2">
                              <IngredientTypeahead
                                value=""
                                onChange={() => {}}
                                onSelectIngredient={(selectedIngredient) => {
                                  addIngredient(mealIndex, optionIndex, selectedIngredient);
                                }}
                                ingredients={commonIngredients}
                              />
                            </div>

                            {/* Lista plana de ingredientes */}
                            {option.ingredients.length === 0 ? (
                              <div className="px-3 py-6 text-center text-[11px] text-gray-500 rounded-sm" style={{ backgroundColor: '#FAF9F7', border: '1px dashed #E8E5DE' }}>
                                Busca y añade ingredientes arriba, o usa <span className="font-medium text-emerald-700">Generar con IA</span> para auto-completar.
                              </div>
                            ) : (
                              <div className="rounded-sm overflow-hidden" style={{ border: '1px solid #E8E5DE' }}>
                                <ul className="divide-y" style={{ borderColor: '#F0EDE8' }}>
                                  {option.ingredients.map((ingredient, ingredientIndex) => {
                                    const q = Number(ingredient.quantity || 0);
                                    const p = (Number(ingredient.protein || 0) * q) / 100;
                                    const c = (Number(ingredient.carbs || 0) * q) / 100;
                                    const f = (Number(ingredient.fat || 0) * q) / 100;
                                    const kcal = (Number(ingredient.calories || 0) * q) / 100;
                                    return (
                                    <li key={ingredientIndex} className="flex items-center gap-2 px-3 py-1.5 hover:bg-[#FAF9F7] transition-colors group">
                                      {ingredient.icon ? (
                                        <img src={`/icons/${ingredient.icon}.svg`} alt="" className="w-5 h-5 flex-shrink-0" />
                                      ) : (
                                        <div className="w-5 h-5 flex-shrink-0" />
                                      )}
                                      <div className="flex-1 min-w-0 text-xs font-medium truncate text-gray-800">{ingredient.name}</div>
                                      <div className="flex items-center gap-1 flex-shrink-0">
                                        <PortionPicker
                                          ingredient={ingredient}
                                          grams={Number(ingredient.quantity || 0)}
                                          onChange={(g) => handleIngredientChange(mealIndex, ingredientIndex, 'quantity', g)}
                                        />
                                      </div>
                                      <div className="flex items-center gap-3 text-[11px] tabular-nums text-gray-500 flex-shrink-0">
                                        <span className="w-9 text-right">{p.toFixed(0)}<span className="text-[9px] text-gray-400">P</span></span>
                                        <span className="w-9 text-right">{c.toFixed(0)}<span className="text-[9px] text-gray-400">C</span></span>
                                        <span className="w-9 text-right">{f.toFixed(0)}<span className="text-[9px] text-gray-400">G</span></span>
                                        <span className="w-14 text-right text-xs font-semibold text-gray-700">{Math.round(kcal)}<span className="text-[9px] font-normal ml-0.5 text-gray-400">cal</span></span>
                                      </div>
                                      <button
                                        onClick={() => removeIngredient(mealIndex, optionIndex, ingredientIndex)} 
                                        className="p-1 rounded transition-all opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 hover:bg-red-50"
                                        title="Quitar ingrediente"
                                      >
                                        <X className="h-3.5 w-3.5" />
                                      </button>
                                    </li>
                                    );
                                  })}
                                </ul>
                                {/* Total dentro de la misma tabla */}
                                <div className="flex items-center gap-2 px-3 py-2" style={{ backgroundColor: '#FAF9F7', borderTop: '1px solid #E8E5DE' }}>
                                  <div className="w-5 flex-shrink-0" />
                                  <div className="flex-1 min-w-0 text-[10px] uppercase tracking-wider font-semibold text-gray-500">Total</div>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <div className="w-12" />
                                    <div className="w-3" />
                                  </div>
                                  <div className="flex items-center gap-3 text-[11px] tabular-nums flex-shrink-0">
                                    <span className="w-9 text-right font-semibold text-gray-800">{option.ingredients.reduce((s,i)=>s+(Number(i.protein||0)*Number(i.quantity||0)/100),0).toFixed(0)}<span className="text-[9px] font-normal text-gray-500">P</span></span>
                                    <span className="w-9 text-right font-semibold text-gray-800">{option.ingredients.reduce((s,i)=>s+(Number(i.carbs||0)*Number(i.quantity||0)/100),0).toFixed(0)}<span className="text-[9px] font-normal text-gray-500">C</span></span>
                                    <span className="w-9 text-right font-semibold text-gray-800">{option.ingredients.reduce((s,i)=>s+(Number(i.fat||0)*Number(i.quantity||0)/100),0).toFixed(0)}<span className="text-[9px] font-normal text-gray-500">G</span></span>
                                    <span className="w-14 text-right text-xs font-bold text-gray-900">{Math.round(option.ingredients.reduce((s,i)=>s+(Number(i.calories||0)*Number(i.quantity||0)/100),0))}<span className="text-[9px] font-normal ml-0.5 text-gray-500">cal</span></span>
                                  </div>
                                  <div className="w-[22px] flex-shrink-0" />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Instrucciones (colapsable) */}
                          <div>
                            <button 
                              type="button"
                              className="flex items-center gap-1 text-[11px] font-medium text-gray-600 hover:text-gray-800 transition-colors" 
                              onClick={() => setShowInstructionsMap(prev => ({ ...prev, [optionIndex]: !prev[optionIndex] }))}
                            >
                              {showInstructions ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5 rotate-180" />}
                              Instrucciones de preparación
                              {option.instructions && !showInstructions && <span className="text-[10px] text-gray-400 ml-1">(añadidas)</span>}
                            </button>
                            {showInstructions && (
                              <textarea
                                className="mt-1.5 w-full px-3 py-2 text-xs rounded-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 resize-none transition-shadow bg-white border border-gray-300 text-gray-800 placeholder:text-gray-400"
                                placeholder="Cómo preparar esta comida…"
                                value={option.instructions || ''}
                                onChange={(e) => handleInstructionsChange(mealIndex, optionIndex, e.target.value)}
                                rows={3}
                              />
                            )}
                          </div>
                        </div>

                        {/* ─── Footer con acciones ─── */}
                        <div className="bg-gray-50 flex-shrink-0" style={{ borderTop: '1px solid #E8E5DE' }}>
                          {/* Acciones */}
                          <div className="px-5 py-2.5 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <SaveMealOption 
                                mealName={option.name || ''} 
                                option={{ ...option, name: option.name || '' }}
                                onSaveSuccess={() => { alert('Opción de comida guardada correctamente'); }}
                              />
                              <LoadSavedMeal 
                                onSelect={(savedOption) => {
                                  const updatedMeals = JSON.parse(JSON.stringify(meals));
                                  const newOption: MealOption = {
                                    name: savedOption.name,
                                    content: savedOption.content || '',
                                    instructions: savedOption.instructions || '',
                                    isSelectedForSummary: option.isSelectedForSummary || false,
                                    ingredients: savedOption.ingredients.map(ingredient => ({
                                      name: ingredient.name || '',
                                      quantity: Number(ingredient.quantity),
                                      calories: Number(ingredient.calories),
                                      protein: Number(ingredient.protein),
                                      carbs: Number(ingredient.carbs),
                                      fat: Number(ingredient.fat)
                                    }))
                                  };
                                  updatedMeals[mealIndex].options[optionIndex] = newOption;
                                  onMealsChange(updatedMeals);
                                }}
                              />
                              <button
                                className="p-1.5 rounded transition-colors text-gray-400 hover:text-red-500 hover:bg-red-50"
                                onClick={() => setDeleteOptionIndex(optionIndex)}
                                title="Eliminar opción"
                              >
                                <TrashCan size={14} />
                              </button>
                            </div>
                            <button
                              onClick={() => setEditingOptionIndex(null)}
                              className="text-xs px-4 py-1.5 rounded font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
                            >
                              Listo
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    ) : (
                    /* ===== MODO VISTA — lista plana sin cajas anidadas ===== */
                    <div className="px-4 py-2">
                      {/* Descripción estilo nota */}
                      {option.content && (
                        <div className="mb-3 px-3 py-2 rounded-r-sm" style={{ backgroundColor: '#FBF7E8', borderLeft: '2px solid #E8DCB0' }}>
                          <p className="text-[11px] text-gray-700 leading-relaxed italic first-letter:uppercase">{option.content}</p>
                        </div>
                      )}

                      {/* Ingredientes en modo vista — fila simple */}
                      {option.ingredients.length > 0 && (
                        <ul className="divide-y" style={{ borderColor: '#F0EDE8' }}>
                          {option.ingredients.map((ingredient, ingredientIndex) => (
                            <li key={ingredientIndex} className="flex items-center justify-between py-1 text-[11px]">
                              <div className="flex items-center gap-1.5 truncate">
                                {ingredient.icon && (
                                  <img src={`/icons/${ingredient.icon}.svg`} alt="" className="w-4 h-4 flex-shrink-0" />
                                )}
                                <span className="truncate text-gray-700">{ingredient.name}</span>
                              </div>
                              <div className="flex items-center gap-3 flex-shrink-0 text-gray-500 tabular-nums">
                                <span>{ingredient.quantity}g</span>
                                <span className="font-medium text-gray-700 w-12 text-right">{Math.round((Number(ingredient.calories) * Number(ingredient.quantity)) / 100)} cal</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}

                      {!option.content && option.ingredients.length === 0 && (
                        <button
                          onClick={() => setEditingOptionIndex(optionIndex)}
                          className="w-full text-[11px] text-emerald-700 hover:text-emerald-800 italic py-1"
                        >
                          Click en "Editar" para añadir ingredientes
                        </button>
                      )}
                    </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Botón añadir opción — solo visible en hover */}
          <div 
            onClick={() => addMealOption(mealIndex)}
            className="flex items-center justify-center py-1 cursor-pointer opacity-0 group-hover/meal:opacity-100 transition-opacity text-gray-500 hover:text-emerald-700"
          >
            <span className="text-[11px]">+ Añadir opción</span>
          </div>
        </div>
        </>
        )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteOptionIndex !== null}
        onClose={() => setDeleteOptionIndex(null)}
        onConfirm={() => {
          if (deleteOptionIndex !== null) {
            removeMealOption(mealIndex, deleteOptionIndex);
            setDeleteOptionIndex(null);
          }
        }}
        title="Eliminar opción"
        message="¿Estás seguro de que deseas eliminar esta opción?"
        confirmText="Eliminar"
        variant="danger"
      />
    </div>
  );
};

// Props del componente principal Meals
interface MealsProps {
  meals: Meal[];
  commonIngredients: any[];
  onMealsChange: (meals: Meal[]) => void;
}

// Componente principal Meals
const Meals: React.FC<MealsProps> = ({
  meals,
  commonIngredients,
  onMealsChange
}) => {
  // Eliminamos el useEffect que crea comidas por defecto
  // ya que lo hemos movido al componente padre
  
  console.log("Meals rendering with:", meals);

  // Funciones de manejo de meals
  const handleMealChange = (index: number, field: keyof Meal, value: string) => {
    const updatedMeals = [...meals];
    updatedMeals[index] = { ...updatedMeals[index], [field]: value };
    onMealsChange(updatedMeals);
  };

  const addMeal = () => {
    const updatedMeals = [
      ...meals,
      {
        name: '',
        time: '',
        options: [{ name: '', content: '', ingredients: [], isSelectedForSummary: true }],
        activeOptionIndex: 0,
        selectedOptionForSummary: 0
      }
    ];
    onMealsChange(updatedMeals);
  };

  const removeMeal = (index: number) => {
    const updatedMeals = [...meals];
    updatedMeals.splice(index, 1);
    onMealsChange(updatedMeals);
  };

  // Resto de funciones para manejar opciones e ingredientes (igual que antes)
  const handleContentChange = (mealIndex: number, optionIndex: number, content: string) => {
    const updatedMeals = [...meals];
    const meal = { ...updatedMeals[mealIndex] };
    const options = [...meal.options];
    options[optionIndex] = { ...options[optionIndex], content };
    meal.options = options;
    updatedMeals[mealIndex] = meal;
    onMealsChange(updatedMeals);
  };

  const setActiveOption = (mealIndex: number, optionIndex: number) => {
    const updatedMeals = [...meals];
    updatedMeals[mealIndex] = {
      ...updatedMeals[mealIndex],
      activeOptionIndex: optionIndex
    };
    onMealsChange(updatedMeals);
  };

  const setSelectedOptionForSummary = (mealIndex: number, optionIndex: number) => {
    const updatedMeals = [...meals];
    const meal = { ...updatedMeals[mealIndex] };
    const options = [...meal.options];
    
    // Desmarcar todas las opciones primero
    options.forEach((option, idx) => {
      options[idx] = { 
        ...option, 
        isSelectedForSummary: false 
      };
    });
    
    // Marcar la opción seleccionada (toggle)
    const isCurrentlySelected = options[optionIndex].isSelectedForSummary;
    options[optionIndex] = { 
      ...options[optionIndex], 
      isSelectedForSummary: !isCurrentlySelected
    };
    
    meal.options = options;
    updatedMeals[mealIndex] = meal;
    onMealsChange(updatedMeals);
  };

  const addMealOption = (mealIndex: number) => {
    const updatedMeals = [...meals];
    const meal = { ...updatedMeals[mealIndex] };
    
    // Añadir nueva opción
    meal.options = [
      ...meal.options,
      { name: '', content: '', ingredients: [] }
    ];
    
    // Establecer la nueva opción como activa
    meal.activeOptionIndex = meal.options.length - 1;
    
    updatedMeals[mealIndex] = meal;
    onMealsChange(updatedMeals);
  };

  const removeMealOption = (mealIndex: number, optionIndex: number) => {
    // Implementación como antes
    const updatedMeals = [...meals];
    const meal = { ...updatedMeals[mealIndex] };
    const options = [...meal.options];
    options.splice(optionIndex, 1);
    meal.options = options;
    
    if (meal.activeOptionIndex >= options.length) {
      meal.activeOptionIndex = Math.max(0, options.length - 1);
    }
    
    updatedMeals[mealIndex] = meal;
    onMealsChange(updatedMeals);
  };

  const addIngredient = (mealIndex: number, optionIndex?: number, ingredientData?: Ingredient) => {
    // Fix: Don't access 'meal' before it's defined
    console.log("Adding ingredient to meal", mealIndex, "option", optionIndex !== undefined ? optionIndex : "active option", "data:", ingredientData);
    
    const updatedMeals = [...meals];
    const meal = { ...updatedMeals[mealIndex] };
    const options = [...meal.options];
    const activeOptionIndex = optionIndex !== undefined ? optionIndex : meal.activeOptionIndex;
    
    console.log("Active option index:", activeOptionIndex);
    
    const activeOption = { ...options[activeOptionIndex] };
    
    // Asegurarse de que los valores numéricos son números y no undefined.
    // Cuando el ingrediente viene del typeahead trae quantity: 100 (la base nutricional
    // del JSON USDA). Lo sustituimos por la porción típica inferida (1 huevo = 50g,
    // 1 cda de aceite = 14g, etc.) para que el nutricionista no tenga que tipear.
    const newIngredient: Ingredient = ingredientData ? {
      name: ingredientData.name || '',
      quantity: getDefaultGramsForIngredient(ingredientData),
      calories: typeof ingredientData.calories === 'number' ? ingredientData.calories : 0,
      protein: typeof ingredientData.protein === 'number' ? ingredientData.protein : 0,
      carbs: typeof ingredientData.carbs === 'number' ? ingredientData.carbs : 0,
      fat: typeof ingredientData.fat === 'number' ? ingredientData.fat : 0,
      icon: ingredientData.icon
    } : {
      name: '',
      quantity: 0,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    };
    
    // Usar concat para crear un nuevo array en lugar de modificar el existente
    activeOption.ingredients = activeOption.ingredients.concat(newIngredient);
    
    options[activeOptionIndex] = activeOption;
    meal.options = options;
    updatedMeals[mealIndex] = meal;
    
    console.log("Updated meals after adding ingredient:", updatedMeals);
    onMealsChange(updatedMeals);
  };

  const removeIngredient = (mealIndex: number, optionIndex: number, ingredientIndex: number) => {
    console.log("Removing ingredient", ingredientIndex, "from meal", mealIndex, "option", optionIndex);
    
    const updatedMeals = [...meals];
    const meal = { ...updatedMeals[mealIndex] };
    const options = [...meal.options];
    const activeOption = { ...options[optionIndex] };
    
    // Crear una nueva lista de ingredientes sin el que queremos eliminar
    activeOption.ingredients = activeOption.ingredients.filter((_, idx) => idx !== ingredientIndex);
    
    options[optionIndex] = activeOption;
    meal.options = options;
    updatedMeals[mealIndex] = meal;
    
    console.log("Updated meals after removing ingredient:", updatedMeals);
    onMealsChange(updatedMeals);
  };

  const handleIngredientNameChange = (mealIndex: number, ingredientIndex: number, value: string) => {
    // Implementación como antes
    const updatedMeals = [...meals];
    const meal = { ...updatedMeals[mealIndex] };
    const options = [...meal.options];
    const activeOption = { ...options[meal.activeOptionIndex] };
    const ingredients = [...activeOption.ingredients];
    
    ingredients[ingredientIndex] = {
      ...ingredients[ingredientIndex],
      name: value
    };
    
    activeOption.ingredients = ingredients;
    options[meal.activeOptionIndex] = activeOption;
    meal.options = options;
    updatedMeals[mealIndex] = meal;
    onMealsChange(updatedMeals);
  };

  const handleSelectIngredient = (mealIndex: number, ingredientIndex: number, ingredient: Ingredient) => {
    // Implementación como antes
    const updatedMeals = [...meals];
    const meal = { ...updatedMeals[mealIndex] };
    const options = [...meal.options];
    const activeOption = { ...options[meal.activeOptionIndex] };
    const ingredients = [...activeOption.ingredients];
    
    ingredients[ingredientIndex] = {
      ...ingredients[ingredientIndex],
      ...ingredient
    };
    
    activeOption.ingredients = ingredients;
    options[meal.activeOptionIndex] = activeOption;
    meal.options = options;
    updatedMeals[mealIndex] = meal;
    onMealsChange(updatedMeals);
  };

  const handleIngredientChange = (
    mealIndex: number,
    ingredientIndex: number,
    field: IngredientNumericField,
    value: number
  ) => {
    // Implementación como antes
    const updatedMeals = [...meals];
    const meal = { ...updatedMeals[mealIndex] };
    const options = [...meal.options];
    const activeOption = { ...options[meal.activeOptionIndex] };
    const ingredients = [...activeOption.ingredients];
    
    ingredients[ingredientIndex] = {
      ...ingredients[ingredientIndex],
      [field]: value
    };
    
    activeOption.ingredients = ingredients;
    options[meal.activeOptionIndex] = activeOption;
    meal.options = options;
    updatedMeals[mealIndex] = meal;
    onMealsChange(updatedMeals);
  };

  const handleInstructionsChange = (mealIndex: number, optionIndex: number, instructions: string) => {
    const updatedMeals = [...meals];
    const meal = { ...updatedMeals[mealIndex] };
    const options = [...meal.options];
    options[optionIndex] = { ...options[optionIndex], instructions };
    meal.options = options;
    updatedMeals[mealIndex] = meal;
    onMealsChange(updatedMeals);
  };

  return (
    <div className="w-full p-2.5 flex flex-col gap-2" style={{ backgroundColor: '#FAF9F7' }}>
      {/* Usar el componente MealItem para cada comida */}
      {meals.map((meal, mealIndex) => (
        <MealItem
          key={mealIndex}
          meal={meal}
          mealIndex={mealIndex}
          meals={meals}
          onMealsChange={onMealsChange}
          handleMealChange={handleMealChange}
          handleContentChange={handleContentChange}
          setActiveOption={setActiveOption}
          setSelectedOptionForSummary={setSelectedOptionForSummary}
          addMealOption={addMealOption}
          removeMealOption={removeMealOption}
          addIngredient={addIngredient}
          removeIngredient={removeIngredient}
          handleIngredientNameChange={handleIngredientNameChange}
          handleSelectIngredient={handleSelectIngredient}
          handleIngredientChange={handleIngredientChange}
          removeMeal={removeMeal}
          commonIngredients={commonIngredients}
          handleInstructionsChange={handleInstructionsChange}
          onToggleActive={() => {
            const updatedMeals = [...meals];
            updatedMeals[mealIndex] = { ...updatedMeals[mealIndex], isActive: updatedMeals[mealIndex].isActive === false ? true : false };
            onMealsChange(updatedMeals);
          }}
        />
      ))}
      
      {/* Botón para añadir nueva comida */}
      <button 
        onClick={addMeal}
        className="rounded-md cursor-pointer text-xs px-3 py-2.5 flex items-center justify-center gap-1.5 transition-colors text-gray-600 bg-white hover:bg-[#FAF9F7] hover:text-emerald-700"
        style={{ border: '1px dashed #E8E5DE' }}
      >
        <Plus className="h-3.5 w-3.5" />
        Añadir nueva comida
      </button>
    </div>
  );
};
export default Meals;