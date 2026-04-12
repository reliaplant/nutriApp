'use client'

import React, { useState } from 'react';
import { 
  TrashCan, 
  CalculatorCheck, 
  Strawberry, 
  ArrowUpRight,
  Save 
} from '@carbon/icons-react';
import IngredientTypeahead, { Ingredient } from '@/app/consulta/components/IngredientTypeahead';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import SaveMealOption from '@/app/consulta/components/saveMeals';
import LoadSavedMeal from './LoadSavedMeal';
import { categoryLabels, categoryColors, MealCategory } from '@/app/comidas/constants';

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
  handleInstructionsChange
}) => {
  // Estados del componente
  const [isMinimized, setIsMinimized] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  // Función para manejar la selección de una opción guardada
  const handleSelectSavedOption = async (savedOption: MealOption) => {
    console.log('Iniciando carga de opción guardada:', savedOption);
    
    try {
      // Crear una copia completa de las comidas
      const updatedMeals = JSON.parse(JSON.stringify(meals));
      
      // Obtener el índice de la opción activa
      const activeOptionIndex = updatedMeals[mealIndex].activeOptionIndex;
      
      // Actualizar el nombre de la comida
      updatedMeals[mealIndex].name = savedOption.name;
      
      // Crear la nueva opción
      const newOption: MealOption = {
        name: savedOption.name,
        content: savedOption.content || '',
        instructions: savedOption.instructions || '',
        isSelectedForSummary: updatedMeals[mealIndex].options[activeOptionIndex]?.isSelectedForSummary || false,
        ingredients: savedOption.ingredients.map(ingredient => ({
          name: ingredient.name || '',
          quantity: Number(ingredient.quantity),
          calories: Number(ingredient.calories),
          protein: Number(ingredient.protein),
          carbs: Number(ingredient.carbs),
          fat: Number(ingredient.fat)
        }))
      };
      
      // Asignar la nueva opción
      updatedMeals[mealIndex].options[activeOptionIndex] = newOption;
      
      // Forzar actualización del estado
      onMealsChange(updatedMeals);

    } catch (error) {
      console.error('Error al cargar la opción guardada:', error);
    }
  };

  const getDefaultCategory = (): MealCategory => {
    const hour = parseInt(meal.time?.split(':')[0] || '0');
    if (hour >= 6 && hour < 10) return 'desayuno';
    if (hour >= 10 && hour < 12) return 'mediaManana';
    if (hour >= 12 && hour < 15) return 'almuerzo';
    if (hour >= 15 && hour < 18) return 'lunchTarde';
    if (hour >= 18 && hour < 23) return 'cena';
    return 'general';
  };

  const handleNameChange = (mealIndex: number, optionIndex: number, name: string) => {
    const updatedMeals = [...meals];
    const meal = { ...updatedMeals[mealIndex] };
    
    // Actualizar tanto el nombre de la comida como el nombre de la opción
    meal.name = name; // Añadir esta línea para actualizar el nombre de la comida
    
    const options = [...meal.options];
    options[optionIndex] = { ...options[optionIndex], name };
    meal.options = options;
    
    updatedMeals[mealIndex] = meal;
    onMealsChange(updatedMeals);
  };

  // Obtener la opción activa actualmente
  const activeOption = meal.options[meal.activeOptionIndex] || { content: '', ingredients: [], name: '' };

  // Objeto para generar tabla de IA (similar a mealsBiblioteca)
  const generateTableFromAI = async () => {
    if (!activeOption?.content) return;

    try {
      const response = await fetch('/api/analyze-meal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: activeOption.content
        }),
      });

      if (!response.ok) throw new Error('API request failed');

      const ingredients = await response.json();
      
      const updatedMeals = [...meals];
      const updatedMeal = { ...updatedMeals[mealIndex] };
      const updatedOptions = [...updatedMeal.options];
      updatedOptions[meal.activeOptionIndex] = { 
        ...updatedOptions[meal.activeOptionIndex], 
        ingredients: ingredients 
      };
      updatedMeal.options = updatedOptions;
      updatedMeals[mealIndex] = updatedMeal;
      
      onMealsChange(updatedMeals);
    } catch (error) {
      console.error('Error generating table:', error);
    }
  };

  return (
    <div className="border border-gray-200 bg-white rounded-sm overflow-hidden">
      {/* Header: Categoría + Hora */}
      <div className="px-3 py-1.5 border-b border-gray-100 flex items-center justify-between">
        <span className={`text-[11px] font-medium ${categoryColors[getDefaultCategory()].text}`}>
          {categoryLabels[getDefaultCategory()]}
          {meal.time && (
            <>
              <span className="text-gray-300 mx-1.5">•</span>
              <span className="text-gray-500 text-[11px]">{meal.time}</span>
            </>
          )}
        </span>
        
        <button
          className="text-emerald-600 hover:text-emerald-700 text-[10px] flex items-center cursor-pointer hover:bg-emerald-50 p-1 rounded-sm"
          onClick={() => setIsMinimized(!isMinimized)}
        >
          {isMinimized ? (
            <>
              <ChevronDown className="h-3 w-3 mr-0.5" />
              Expandir
            </>
          ) : (
            <>
              <ChevronUp className="h-3 w-3 mr-0.5" />
              Minimizar
            </>
          )}
        </button>
      </div>

      {/* Options tabs */}
      {!isMinimized && (
        <div className="px-3 pt-2 pb-0 border-b border-gray-100">
          <div className="flex flex-row gap-1.5 overflow-x-auto pb-2">
            {meal.options.map((option, optionIndex) => (
              <button
                key={optionIndex}
                className={`flex items-center px-3 py-1 text-[11px] font-medium rounded-sm border transition-all ${
                  meal.activeOptionIndex === optionIndex
                    ? 'bg-emerald-600 text-white border-emerald-700'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'
                }`}
                onClick={() => setActiveOption(mealIndex, optionIndex)}
              >
                Opción {optionIndex + 1} 
                <span className="mx-1 opacity-60">|</span> 
                <span>
                  {option.ingredients.reduce((sum, ingredient) => sum + (Number(ingredient.calories || 0) * Number(ingredient.quantity || 0) / 100), 0).toFixed(0)} kcal
                </span>
                {option.isSelectedForSummary && (
                  <CalculatorCheck
                    size={13}
                    className={`ml-1.5 ${meal.activeOptionIndex === optionIndex ? "text-white" : "text-emerald-700"}`}
                  />
                )}
              </button>
            ))}

            <button 
              onClick={() => addMealOption(mealIndex)}
              className="px-2.5 py-1 text-[11px] text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-sm border border-gray-200 flex items-center"
            >
              + Añadir opción
            </button>
          </div>
        </div>
      )}

      {/* Content section */}
      {!isMinimized && (
        <div className="p-3">
          {/* Controls and nutrition summary */}
          {meal.options.length > 0 && (
            <div className="flex gap-2 items-center mb-4 flex-wrap">
              {/* Switch para incluir en resumen nutricional */}
              <div className="flex items-center bg-gray-50 p-1 px-2 rounded-sm hover:bg-emerald-50 transition-colors group">
                <div className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id={`use-for-summary-${mealIndex}-${meal.activeOptionIndex}`}
                    checked={meal.options[meal.activeOptionIndex]?.isSelectedForSummary || false}
                    onChange={() => setSelectedOptionForSummary(mealIndex, meal.activeOptionIndex)}
                    className="sr-only peer"
                  />
                  <label
                    htmlFor={`use-for-summary-${mealIndex}-${meal.activeOptionIndex}`}
                    className="w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer-checked:bg-emerald-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white block cursor-pointer"
                  ></label>
                </div>
                <label className="text-[11px] text-gray-600 ml-1.5 group-hover:text-emerald-700">
                  Para resumen nutricional
                </label>
                <CalculatorCheck size={13} className="text-emerald-600 ml-1" />
              </div>

              {/* Botón para guardar la opción actual */}
              <SaveMealOption 
                mealName={meals[mealIndex].name || ''} // Asegurar que siempre hay un valor
                option={{
                  ...activeOption,
                  name: meals[mealIndex].name || '' // Asegurar que siempre hay un valor
                }}
                onSaveSuccess={() => {
                  alert('Opción de comida guardada correctamente');
                }}
              />

              {/* Botón para cargar opción guardada */}
              <LoadSavedMeal 
                onSelect={(option) => {
                  handleSelectSavedOption(option);
                }}
              />

              {/* Eliminar opción actual si hay más de una */}
              {meal.options.length > 1 && (
                <button
                  className="text-red-400 hover:text-red-600 text-[11px] flex items-center cursor-pointer hover:bg-red-50 p-1.5 rounded-sm"
                  onClick={() => removeMealOption(mealIndex, meal.activeOptionIndex)}
                >
                  <TrashCan size={13} className="mr-1" />
                  Eliminar opción
                </button>
              )}
            </div>
          )}

          {/* Campos alineados con MealsBiblioteca */}
          <div className="space-y-4">
            {/* Información básica */}
            <div className="flex flex-col md:flex-row gap-3 items-start">
              {/* Nombre de la comida */}
              <div className="flex-grow">
                <label className="block text-[10px] font-medium uppercase tracking-[0.12em] text-gray-400 mb-1">Nombre de la receta</label>
                <input
                  type="text"
                  className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-sm focus:outline-none focus:border-emerald-400"
                  value={meals[mealIndex].name}
                  onChange={(e) => {
                    // Modificar directamente el estado primario
                    const newMeals = [...meals];
                    newMeals[mealIndex].name = e.target.value;
                    
                    // También actualizar la opción activa para mantener consistencia
                    const activeOptionIndex = newMeals[mealIndex].activeOptionIndex;
                    newMeals[mealIndex].options[activeOptionIndex].name = e.target.value;
                    
                    // Actualizar estado
                    onMealsChange(newMeals);
                  }}
                  placeholder="Ej: Pollo con arroz y vegetales"
                />
              </div>

              {/* Categoría */}
              <div className="w-36">
                <label className="block text-[10px] font-medium uppercase tracking-[0.12em] text-gray-400 mb-1">Categoría</label>
                <div className="relative">
                  <select
                    className="w-full px-2 py-1.5 pl-7 text-xs appearance-none rounded-sm font-medium cursor-pointer focus:outline-none"
                    value={meal.category || getDefaultCategory()}
                    onChange={(e) => {
                      const updatedMeals = [...meals];
                      updatedMeals[mealIndex] = {
                        ...updatedMeals[mealIndex],
                        category: e.target.value as MealCategory
                      };
                      onMealsChange(updatedMeals);
                    }}
                    style={{
                      backgroundColor: categoryColors[meal.category || getDefaultCategory()]?.light || categoryColors.general.light,
                      color: categoryColors[meal.category || getDefaultCategory()]?.dark || categoryColors.general.dark
                    }}
                  >
                    {Object.entries(categoryLabels).map(([value, label]) => (
                      <option 
                        key={value} 
                        value={value}
                        style={{
                          backgroundColor: categoryColors[value as keyof typeof categoryColors]?.light || categoryColors.general.light,
                          color: categoryColors[value as keyof typeof categoryColors]?.dark || categoryColors.general.dark
                        }}
                      >
                        {label}
                      </option>
                    ))}
                  </select>
                  <div 
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full"
                    style={{
                      backgroundColor: categoryColors[meal.category || getDefaultCategory()]?.dark || categoryColors.general.dark
                    }}
                  ></div>
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                    <ChevronDown 
                      className="h-4 w-4" 
                      style={{
                        color: categoryColors[meal.category || getDefaultCategory()]?.dark || categoryColors.general.dark
                      }} 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-[10px] font-medium uppercase tracking-[0.12em] text-gray-400 mb-1">Descripción</label>
              <textarea
                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-sm focus:outline-none focus:border-emerald-400"
                value={activeOption.content || ''}
                onChange={(e) => handleContentChange(mealIndex, meal.activeOptionIndex, e.target.value)}
                placeholder="Describe los ingredientes y cantidades detalladamente..."
                rows={2}
              />
            </div>

            {/* Instrucciones */}
            <div>
              <div 
                className="flex items-center cursor-pointer text-emerald-600 hover:text-emerald-700 mb-1" 
                onClick={() => setShowInstructions(!showInstructions)}
              >
                <h3 className="text-[11px] font-medium mr-1.5">Instrucciones de preparación</h3>
                {showInstructions ? 
                  <ChevronDown className="h-4 w-4" /> : 
                  <ArrowUpRight className="h-4 w-4" />
                }
              </div>
              
              {showInstructions && (
                <textarea
                  className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-sm focus:outline-none focus:border-emerald-400"
                  placeholder="Añade instrucciones de preparación para esta comida"
                  value={activeOption.instructions || ''}
                  onChange={(e) => handleInstructionsChange(mealIndex, meal.activeOptionIndex, e.target.value)}
                  rows={4}
                />
              )}
            </div>

            {/* Ingredientes */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <h3 className="text-[10px] font-medium uppercase tracking-[0.12em] text-gray-400">Ingredientes</h3>
                <div className="flex space-x-1.5">
                  <button 
                    onClick={() => addIngredient(mealIndex, meal.activeOptionIndex)}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] px-2 py-0.5 rounded-sm flex items-center"
                  >
                    <Strawberry size={13} className="mr-1" />
                    Añadir ingrediente
                  </button>
                  <button 
                    onClick={generateTableFromAI}
                    className={`
                        text-[11px] px-2 py-0.5 rounded-sm flex items-center relative group
                        ${activeOption?.content 
                            ? 'bg-purple-50 text-purple-700 hover:bg-purple-100' 
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }
                    `}
                    disabled={!activeOption?.content}
                  >
                    {/* Icon */}
                    <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        className="w-4 h-4 mr-2"
                    >
                        <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48 2.83-2.83" />
                    </svg>
                    Crear tabla con IA
                    
                    {/* Tooltip */}
                    {!activeOption?.content && (
                      <div className={`
                        absolute bottom-full right-0 mb-2 
                        w-60 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg 
                        transition-opacity duration-200 pointer-events-none
                        opacity-0 group-hover:opacity-100
                      `}>
                        La descripción no puede estar vacia 
                        <div className="absolute top-full right-4 border-[6px] border-transparent border-t-gray-800" />
                      </div>
                    )}
                  </button>
                </div>
              </div>

              {/* Tabla de ingredientes */}
              <div className="border border-gray-200 rounded-sm overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100 relative">
                  <thead className="bg-gray-50">
                    <tr>
                      {["Ingrediente", "Cant(g)", "Cal", "Prot(g)", "Carbs(g)", "Grasas(g)", ""].map((header, i) => (
                        <th key={i} className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-400 uppercase tracking-[0.1em]">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {activeOption.ingredients.map((ingredient, ingredientIndex) => (
                      <tr key={ingredientIndex} className="hover:bg-gray-50">
                        <td className="py-1 px-2 min-w-[160px] relative w-1/2" style={{ position: 'static' }}>
                          <div className="relative">
                            <IngredientTypeahead
                              value={ingredient.name}
                              onChange={(value) => handleIngredientNameChange(mealIndex, ingredientIndex, value)}
                              onSelectIngredient={(selectedIngredient) =>
                                handleSelectIngredient(mealIndex, ingredientIndex, selectedIngredient)
                              }
                              ingredients={commonIngredients}
                            />
                          </div>
                        </td>
                        
                        {/* Cantidad (editable) */}
                        <td className="px-2 py-1">
                          <input
                            className="w-14 p-0.5 text-xs border border-gray-200 rounded-sm text-center"
                            type="number"
                            value={ingredient.quantity === 0 ? '' : ingredient.quantity || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              // Use undefined for empty value to allow clearing the field
                              const numValue = value === '' ? 0 : Number(value);
                              handleIngredientChange(
                                mealIndex,
                                ingredientIndex,
                                'quantity',
                                numValue
                              );
                            }}
                            step="1"
                            min="0"
                          />
                        </td>
                        
                        {/* Valores calculados según la cantidad */}
                        <td className="px-2 py-1 text-center text-xs text-gray-600">
                          {Math.round((Number(ingredient.calories) * Number(ingredient.quantity)) / 100)}
                        </td>
                        <td className="px-2 py-1 text-center text-xs text-gray-600">
                          {((Number(ingredient.protein) * Number(ingredient.quantity)) / 100).toFixed(1)}
                        </td>
                        <td className="px-2 py-1 text-center text-xs text-gray-600">
                          {((Number(ingredient.carbs) * Number(ingredient.quantity)) / 100).toFixed(1)}
                        </td>
                        <td className="px-2 py-1 text-center text-xs text-gray-600">
                          {((Number(ingredient.fat) * Number(ingredient.quantity)) / 100).toFixed(1)}
                        </td>
                        
                        {/* Botón eliminar */}
                        <td className="px-2 py-1 text-center">
                          <button
                            onClick={() => removeIngredient(mealIndex, meal.activeOptionIndex, ingredientIndex)} 
                            className="text-red-400 hover:text-red-600 p-0.5 hover:bg-red-50 rounded-sm"
                          >
                            <TrashCan size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {activeOption.ingredients.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-2 py-3 text-center text-gray-400 text-[11px]">
                          No hay ingredientes. Añade uno para comenzar.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  
                  {/* Total de nutrientes */}
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td className="px-2 py-1.5 text-xs font-medium" colSpan={2}>Total:</td>
                      <td className="px-2 py-1.5 text-xs font-medium text-center">
                        {Math.round(activeOption.ingredients
                          .reduce((sum, i) => sum + (Number(i.calories || 0) * Number(i.quantity || 0) / 100), 0))}
                      </td>
                      <td className="px-2 py-1.5 text-xs font-medium text-center">
                        {activeOption.ingredients
                          .reduce((sum, i) => sum + (Number(i.protein || 0) * Number(i.quantity || 0) / 100), 0)
                          .toFixed(1)}g
                      </td>
                      <td className="px-2 py-1.5 text-xs font-medium text-center">
                        {activeOption.ingredients
                          .reduce((sum, i) => sum + (Number(i.carbs || 0) * Number(i.quantity || 0) / 100), 0)
                          .toFixed(1)}g
                      </td>
                      <td className="px-2 py-1.5 text-xs font-medium text-center">
                        {activeOption.ingredients
                          .reduce((sum, i) => sum + (Number(i.fat || 0) * Number(i.quantity || 0) / 100), 0)
                          .toFixed(1)}g
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
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
    
    // Asegurarse de que los valores numéricos son números y no undefined
    const newIngredient: Ingredient = ingredientData ? {
      name: ingredientData.name || '',
      quantity: typeof ingredientData.quantity === 'number' ? ingredientData.quantity : 0,
      calories: typeof ingredientData.calories === 'number' ? ingredientData.calories : 0,
      protein: typeof ingredientData.protein === 'number' ? ingredientData.protein : 0,
      carbs: typeof ingredientData.carbs === 'number' ? ingredientData.carbs : 0,
      fat: typeof ingredientData.fat === 'number' ? ingredientData.fat : 0
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
    <div className="w-full p-3 flex flex-col gap-3 bg-gray-50">
      {/* Usar el componente MealItem para cada comida */}
      {meals.map((meal, mealIndex) => (
        <MealItem
          key={mealIndex}
          meal={meal}
          mealIndex={mealIndex}
          meals={meals} // Agregar esta prop
          onMealsChange={onMealsChange} // Agregar esta prop
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
        />
      ))}
      
      {/* Botón para añadir nueva comida */}
      <button 
        onClick={addMeal}
        className="bg-white rounded-sm border border-gray-200 hover:bg-gray-50 cursor-pointer text-gray-500 text-[11px] px-3 py-2 flex items-center justify-center transition-colors"
      >
        <Strawberry size={14} className="mr-1.5 text-emerald-600" />
        Añadir nueva comida
      </button>
    </div>
  );
};
export default Meals;