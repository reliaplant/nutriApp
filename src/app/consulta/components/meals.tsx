'use client'

import React, { useState } from 'react';
import { 
  TrashCan, 
  CalculatorCheck, 
  Strawberry, 
  Save 
} from '@carbon/icons-react';
import IngredientTypeahead, { Ingredient } from '@/app/consulta/components/IngredientTypeahead';
import { getDefaultGramsForIngredient } from '@/app/consulta/components/portionsHelper';
import MealOptionEditor from '@/app/consulta/components/MealOptionEditor';
import { ChevronDown, ChevronUp, X, Plus, Pencil } from 'lucide-react';
import SaveMealOption from '@/app/consulta/components/saveMeals';
import LoadSavedMeal from './LoadSavedMeal';
import { categoryLabels, categoryColors, categoryIcons, MealCategory } from '@/app/comidas/constants';
import ConfirmDialog from '@/app/components/confirmDialog';
import { useTranslation } from '@/app/shared/useTranslation';

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
  const { t } = useTranslation();
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
            {t(`meals.categories.${category}`)}
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
              {meal.time ? meal.time.split(':')[0] + t('consultation.meals.hourSuffix') : t('consultation.meals.noTime')}
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
            <p className="text-[11px] mb-2 text-gray-500">{t('consultation.meals.noOptions')}</p>
            <button
              onClick={() => addMealOption(mealIndex)}
              className="px-3 py-1 text-[11px] font-medium rounded transition-colors text-emerald-700 bg-white border border-emerald-200 hover:bg-emerald-50"
            >
              {t('consultation.meals.addOption')}
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
                    <span className="text-[10px] font-bold text-gray-400 flex-shrink-0 uppercase tracking-wider">{t('consultation.meals.option')} {optionIndex + 1}</span>
                    <span className="text-xs font-medium text-gray-800 truncate">
                      {option.name || `${t('consultation.meals.option')} ${optionIndex + 1}`}
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
                        title={t('consultation.meals.edit')}
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
                    {/* ===== MODO VISTA — lista plana sin cajas anidadas ===== */}
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
                          {t('consultation.meals.clickEdit')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* ===== MODO EDICIÓN — modal compartido (MealOptionEditor) ===== */}
                {editingOptionIndex === optionIndex && (
                  <MealOptionEditor
                    value={{
                      name: option.name || '',
                      content: option.content || '',
                      ingredients: option.ingredients,
                      instructions: option.instructions,
                    }}
                    onChange={(newVal) => {
                      const updatedMeals = [...meals];
                      const meal = { ...updatedMeals[mealIndex] };
                      const options = [...meal.options];
                      options[optionIndex] = {
                        ...options[optionIndex],
                        name: newVal.name,
                        content: newVal.content,
                        ingredients: newVal.ingredients,
                        instructions: newVal.instructions,
                      };
                      meal.options = options;
                      updatedMeals[mealIndex] = meal;
                      onMealsChange(updatedMeals);
                    }}
                    category={category}
                    optionLabel={`${t('consultation.meals.option')} ${optionIndex + 1}`}
                    onClose={() => setEditingOptionIndex(null)}
                    primaryAction={{
                      label: t('consultation.meals.done'),
                      onClick: () => setEditingOptionIndex(null),
                    }}
                    footerLeft={
                      <>
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
                              ingredients: savedOption.ingredients.map((ingredient: Ingredient) => ({
                                name: ingredient.name || '',
                                quantity: Number(ingredient.quantity),
                                calories: Number(ingredient.calories),
                                protein: Number(ingredient.protein),
                                carbs: Number(ingredient.carbs),
                                fat: Number(ingredient.fat),
                                icon: ingredient.icon,
                                portions: ingredient.portions,
                                preparations: ingredient.preparations,
                                baseName: ingredient.baseName,
                                prepKey: ingredient.prepKey,
                              })),
                            };
                            updatedMeals[mealIndex].options[optionIndex] = newOption;
                            onMealsChange(updatedMeals);
                          }}
                        />
                        <button
                          className="p-1.5 rounded transition-colors text-gray-400 hover:text-red-500 hover:bg-red-50"
                          onClick={() => setDeleteOptionIndex(optionIndex)}
                          title={t('consultation.meals.deleteOption')}
                        >
                          <TrashCan size={14} />
                        </button>
                      </>
                    }
                    commonIngredients={commonIngredients}
                  />
                )}
              </div>
            );
          })}

          {/* Botón añadir opción — solo visible en hover */}
          <div 
            onClick={() => addMealOption(mealIndex)}
            className="flex items-center justify-center py-1 cursor-pointer opacity-0 group-hover/meal:opacity-100 transition-opacity text-gray-500 hover:text-emerald-700"
          >
            <span className="text-[11px]">{t('consultation.meals.addOption')}</span>
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
        title={t('consultation.meals.deleteOption')}
        message={t('consultation.meals.deleteOptionConfirm')}
        confirmText={t('consultation.meals.delete')}
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
  const { t } = useTranslation();
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
      icon: ingredientData.icon,
      portions: ingredientData.portions,
      preparations: ingredientData.preparations,
      baseName: ingredientData.baseName ?? ingredientData.name,
      prepKey: ingredientData.prepKey,
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
        {t('consultation.meals.addMeal')}
      </button>
    </div>
  );
};
export default Meals;
