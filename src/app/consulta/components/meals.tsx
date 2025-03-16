'use client'

import React, { useState } from 'react';
import { 
  CheckmarkFilled, 
  TrashCan, 
  CalculatorCheck, 
  Edit, 
  Strawberry, 
  ChevronDown, 
  ArrowUpRight 
} from '@carbon/icons-react';
import IngredientTypeahead, { Ingredient } from '@/app/consulta/components/IngredientTypeahead';
import { ChevronUp } from 'lucide-react';
import SaveMealOption from '@/app/consulta/components/saveMeals';
import LoadSavedMeal from './LoadSavedMeal';

export interface MealOption {
  content: string;
  ingredients: Ingredient[];
  isSelectedForSummary?: boolean;
  instructions?: string; // Nuevo campo para instrucciones
}

export interface Meal {
  name: string;
  time: string;
  options: MealOption[];
  activeOptionIndex: number;
  selectedOptionForSummary: number;
}

type IngredientNumericField = 'quantity' | 'calories' | 'protein' | 'carbs' | 'fat';

// Componente para un item de comida individual
interface MealItemProps {
  meal: Meal;
  mealIndex: number;
  handleMealChange: (index: number, field: keyof Meal, value: string) => void;
  handleContentChange: (mealIndex: number, optionIndex: number, content: string) => void;
  setActiveOption: (mealIndex: number, optionIndex: number) => void;
  setSelectedOptionForSummary: (mealIndex: number, optionIndex: number) => void;
  addMealOption: (mealIndex: number) => void;
  removeMealOption: (mealIndex: number, optionIndex: number) => void;
  addIngredient: (mealIndex: number) => void;
  removeIngredient: (mealIndex: number, ingredientIndex: number) => void;
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
  // Aquí es seguro usar useState porque está en el nivel superior del componente
  const [isMinimized, setIsMinimized] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  // Función para manejar la selección de una opción guardada
  const handleSelectSavedOption = (savedOption: MealOption) => {
    // Actualizamos la opción activa con la opción guardada
    handleContentChange(mealIndex, meal.activeOptionIndex, savedOption.content || '');
    
    // Si hay instrucciones, las actualizamos también
    if (savedOption.instructions) {
      handleInstructionsChange(mealIndex, meal.activeOptionIndex, savedOption.instructions);
    }
    
    // Reemplazamos ingredientes (primero eliminamos todos los existentes)
    const updatedMeals = [...meals];
    const updatedMeal = { ...updatedMeals[mealIndex] };
    const updatedOptions = [...updatedMeal.options];
    updatedOptions[updatedMeal.activeOptionIndex] = {
      ...updatedOptions[updatedMeal.activeOptionIndex],
      ingredients: [...savedOption.ingredients]
    };
    updatedMeal.options = updatedOptions;
    updatedMeals[mealIndex] = updatedMeal;
    onMealsChange(updatedMeals);
  };

  return (
    <div className="border border-gray-300 bg-white rounded shadow-md overflow-hidden">
      <div className={`p-6 py-4 ${isMinimized ? 'pb-0' : 'pb-2'}`}>

        <div className={`flex justify-between items-center ${isMinimized ? 'mb-0' : 'mb-4'}`}>
          {/* Display meal time and name */}
          <div id={`display-meal-${mealIndex}`}
            className="text-xl font-semibold cursor-pointer group relative flex items-center p-1 hover:bg-gray-100 rounded"
            onClick={() => {
              const editingMeal = document.getElementById(`editing-meal-${mealIndex}`);
              const displayMeal = document.getElementById(`display-meal-${mealIndex}`);
              if (editingMeal && displayMeal) {
                editingMeal.classList.remove('hidden');
                displayMeal.classList.add('hidden');
              }
            }}
          >
            <span>{meal.time ? `${meal.time} - ` : ''}{meal.name || 'Nueva Comida'}</span>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 text-blue-500">
              <Edit size={26} className="text-green50" />
            </div>
          </div>

          {/* Edit fields that appear on click with same styling */}
          <div id={`editing-meal-${mealIndex}`} className="hidden">
            <div className="flex items-center">
              <div className='flex items-center border border-gray-200 rounded'>
                <input
                  className="p-2 border-r border-gray-200 text-md font-semibold bg-gray-50 w-24"
                  placeholder="HH:MM"
                  value={meal.time}
                  onChange={(e) => handleMealChange(mealIndex, "time", e.target.value)}
                  list={`time-options-meal-${mealIndex}`}
                  autoComplete="off"
                />
                <input
                  className="p-2 text-md font-semibold bg-gray-50 flex-grow"
                  placeholder="Nombre de la comida"
                  value={meal.name}
                  onChange={(e) => handleMealChange(mealIndex, "name", e.target.value)}
                />
              </div>
              <button
                className="ml-2 text-green-600 hover:text-green-800 rounded-full p-1 bg-gray-100 hover:bg-gray-200"
                onClick={() => {
                  document.getElementById(`editing-meal-${mealIndex}`)?.classList.add('hidden');
                  document.getElementById(`display-meal-${mealIndex}`)?.classList.remove('hidden');
                }}
              >
                <CheckmarkFilled size={24} className='cursor-pointer' />
              </button>
            </div>
            <datalist id={`time-options-meal-${mealIndex}`}>
              {Array.from({ length: 24 }, (_, hour) => [
                `${hour.toString().padStart(2, '0')}:00`,
                `${hour.toString().padStart(2, '0')}:30`
              ]).flat().map((time) => (
                <option key={time} value={time} />
              ))}
            </datalist>
          </div>

          <button onClick={() => removeMeal(mealIndex)} className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded cursor-pointer">
            <TrashCan size={16} />
          </button>
        </div>
      </div>

      {/* Options tabs */}
      {!isMinimized && (
        <div className="">
          <div className="pl-6 flex flex-row gap-2.5">
            {meal.options.map((option, optionIndex) => (
              <div key={optionIndex} className="">
                <button
                  className={`border rounded-full flex flex-row gap-2 items-center px-4 py-2 text-sm focus:outline-none ${meal.activeOptionIndex === optionIndex
                    ? 'text-white bg-green50'
                    : 'border-gray-200 text-green60 bg-green10 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  onClick={() => setActiveOption(mealIndex, optionIndex)}
                >
                  Opción {optionIndex + 1} <span className='px-0.5'>|</span> {option.ingredients.reduce((sum, ingredient) => sum + (ingredient.calories || 0), 0).toFixed(0)} kcal
                  {option.isSelectedForSummary && (
                    <CalculatorCheck
                      size={16}
                      className={meal.activeOptionIndex === optionIndex ? "text-white" : "text-green60"}
                    />
                  )}
                </button>
              </div>
            ))}

            <button onClick={() => addMealOption(mealIndex)}
              className="rounded-full border-gray-200 border hover:bg-gray-100 cursor-pointer text-gray70 text-xs px-3 py-2 rounded flex items-center hover:bg-gray20">
              Añadir opción
            </button>
          </div>
        </div>
      )}

      {/* Active option content */}
      <div className="p-6">
        {/* Controls for option management */}
        {meal.options.length > 0 && !isMinimized && (
            <div className="flex gap-4 items-center mb-4">
            <div className="flex items-center bg-gray10 p-1.5 px-2 rounded-lg hover:bg-green20 transition-colors">
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
              className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer-checked:bg-green-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white block cursor-pointer"
              ></label>
              </div>
              <label className="text-xs font-medium text-gray-700 ml-2">
              Para resumen nutricional
              </label>
              <CalculatorCheck size={16} className="text-green60 ml-1" />
            </div>

            {/* Nuevo botón para guardar la opción actual */}
            <SaveMealOption 
              mealName={meal.name}
              option={meal.options[meal.activeOptionIndex]}
              onSaveSuccess={() => {
                // Puedes mostrar alguna notificación o mensaje de éxito
                alert('Opción de comida guardada correctamente');
              }}
            />

            {/* Nuevo botón para cargar opción guardada */}
            <LoadSavedMeal 
              onSelect={(option) => {
                handleSelectSavedOption(option);
              }}
            />

            {meal.options.length > 1 && (
              <button
              className="text-red-500 hover:text-red-700 text-xs flex items-center cursor-pointer hover:bg-red-50 p-2 rounded-lg"
              onClick={() => removeMealOption(mealIndex, meal.activeOptionIndex)}
              >
              <TrashCan size={16} className="mr-1 " />
              Eliminar opción
              </button>
            )}
            </div>
        )}
        {/* Show all options when minimized */}
        {isMinimized && (
          <div className=" mb-0">
            {meal.options.map((option, idx) => (
              <div
                key={idx}
                className={`mb-2 p-3 text-sm pr-8 rounded-lg flex items-center justify-between ${meal.activeOptionIndex === idx ? 'bg-gray10 ' : 'bg-gray10'
                  }`}
              >
                <div className="flex-grow">
                  <div className="flex items-center mb-1">
                    <span className="text-sm font-medium mr-2">Opción {idx + 1}</span>
                    {option.isSelectedForSummary && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full flex items-center">
                        <CalculatorCheck size={14} className="mr-1" />
                        Para resumen
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700">
                    {option.content || 'Sin descripción'}
                  </p>
                </div>
                <div className="text-right text-sm font-medium text-gray-500">
                  {option.ingredients.reduce((sum, ingredient) => sum + (ingredient.calories || 0), 0).toFixed(0)} kcal
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Show full content when not minimized */}
        {!isMinimized && (
          <>
            <div className="mt-8 mb-6">
              <h3 className="text-sm mb-4 text-green60">Descripción</h3>
              <textarea
                className="w-full p-4 py-2 border border-gray-200 rounded focus:shadow-sm focus:outline-none"
                placeholder="Describe los alimentos que componen esta comida"
                value={meal.options[meal.activeOptionIndex]?.content || ''}
                onChange={(e) => handleContentChange(mealIndex, meal.activeOptionIndex, e.target.value)}
                rows={2}
              />
            </div>

            <div className="mt-4 mb-6">
              <div 
                className="flex items-center cursor-pointer text-green60 hover:text-green-700" 
                onClick={() => setShowInstructions(!showInstructions)}
              >
                <h3 className="text-sm mr-2">Instrucciones de preparación</h3>
                {showInstructions ? 
                  <ChevronDown size={16} /> : 
                  <ArrowUpRight size={16} />
                }
              </div>
              
              {showInstructions && (
                <textarea
                  className="w-full p-4 py-2 border border-gray-200 rounded mt-2 focus:shadow-sm focus:outline-none"
                  placeholder="Añade instrucciones de preparación para esta comida"
                  value={meal.options[meal.activeOptionIndex]?.instructions || ''}
                  onChange={(e) => handleInstructionsChange(mealIndex, meal.activeOptionIndex, e.target.value)}
                  rows={4}
                />
              )}
            </div>

            {/* Ingredients table */}
            <div className="mt-2 flex justify-between items-center">
              <h3 className="text-sm mb-2 text-green60">Ingredientes</h3>
              <button onClick={() => addIngredient(mealIndex)}
                className="rounded border-gray-200 border hover:bg-gray-100 cursor-pointer text-gray70 text-xs px-2 py-1 mb-2 rounded flex items-center hover:bg-gray20">
                <Strawberry size={20} className="mr-2 text-teal50" />
                Añadir ingrediente
              </button>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded">
              <table className="min-w-full divide-y divide-gray-200 ">
                <thead className="bg-green-50">
                  <tr>
                    {["Ingrediente", "Cant(g)", "Calorías", "Prot(g)", "Carbs(g)", "Grasas(g)", ""].map((header, i) => (
                      <th key={i} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {meal.options[meal.activeOptionIndex]?.ingredients.map((ingredient, ingredientIndex) => (
                    <tr key={ingredientIndex} className="group">
                      <td className="">
                        <IngredientTypeahead
                          value={ingredient.name}
                          onChange={(value) => handleIngredientNameChange(mealIndex, ingredientIndex, value)}
                          onSelectIngredient={(selectedIngredient) =>
                            handleSelectIngredient(mealIndex, ingredientIndex, selectedIngredient)
                          }
                          ingredients={commonIngredients}
                        />
                      </td>
                      {['quantity', 'calories', 'protein', 'carbs', 'fat'].map((field, idx) => (
                        <td key={idx} className="px-3 ">
                          {field === 'quantity' ? (
                            <input
                              className="w-16 pl-4 py-2 bg-gray10 group-hover:bg-gray-100 text-center text-sm"
                              type="number"
                              value={ingredient[field as keyof Ingredient]}
                              onChange={(e) =>
                                handleIngredientChange(
                                  mealIndex,
                                  ingredientIndex,
                                  field as IngredientNumericField,
                                  Number(e.target.value)
                                )
                              }
                              step="1"
                            />
                          ) : (
                            <span className="w-16 p-1 text-center text-sm block">
                              {ingredient[field as keyof Ingredient]}
                            </span>
                          )}
                        </td>
                      ))}
                      <td className="px-3">
                        <TrashCan size={16} className="bg-gray300 text-blue90 cursor-pointer " onClick={() => removeIngredient(mealIndex, ingredientIndex)} />
                      </td>
                    </tr>
                  ))}
                </tbody>

                <tfoot className="bg-gray10">
                  <tr>
                    <td className="px-3 py-2 font-medium" colSpan={2}>Total:</td>
                    {['calories', 'protein', 'carbs', 'fat'].map((field, idx) => (
                      <td key={idx} className="px-3 py-2 font-medium">
                        {meal.options[meal.activeOptionIndex]?.ingredients
                          .reduce((sum, i) => sum + Number(i[field as keyof Ingredient]), 0)
                          .toFixed(field === 'calories' ? 0 : 1)}
                        {field !== 'calories' && 'g'}
                      </td>
                    ))}
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>
      <button
        className="mr-4 mb-3 ml-auto text-emerald-600 hover:text-emerald-700 text-xs flex items-center cursor-pointer hover:bg-green-50 p-2 rounded"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        {isMinimized ? (
          <>
            <ChevronDown size={16} className="mr-1" />
            Expandir
          </>
        ) : (
          <>
            <ChevronUp size={16} className="mr-1" />
            Minimizar
          </>
        )}
      </button>
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
        options: [{ content: '', ingredients: [], isSelectedForSummary: true }],
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
    
    options[optionIndex] = { 
      ...options[optionIndex], 
      isSelectedForSummary: !options[optionIndex].isSelectedForSummary 
    };
    
    meal.options = options;
    updatedMeals[mealIndex] = meal;
    onMealsChange(updatedMeals);
  };

  const addMealOption = (mealIndex: number) => {
    // Implementación como antes
    const updatedMeals = [...meals];
    const meal = { ...updatedMeals[mealIndex] };
    meal.options = [
      ...meal.options,
      { content: '', ingredients: [] }
    ];
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

  const addIngredient = (mealIndex: number) => {
    // Implementación como antes
    const updatedMeals = [...meals];
    const meal = { ...updatedMeals[mealIndex] };
    const options = [...meal.options];
    const activeOption = { ...options[meal.activeOptionIndex] };
    
    activeOption.ingredients = [
      ...activeOption.ingredients,
      { name: '', quantity: 0, calories: 0, protein: 0, carbs: 0, fat: 0 }
    ];
    
    options[meal.activeOptionIndex] = activeOption;
    meal.options = options;
    updatedMeals[mealIndex] = meal;
    onMealsChange(updatedMeals);
  };

  const removeIngredient = (mealIndex: number, ingredientIndex: number) => {
    // Implementación como antes
    const updatedMeals = [...meals];
    const meal = { ...updatedMeals[mealIndex] };
    const options = [...meal.options];
    const activeOption = { ...options[meal.activeOptionIndex] };
    const ingredients = [...activeOption.ingredients];
    
    ingredients.splice(ingredientIndex, 1);
    
    activeOption.ingredients = ingredients;
    options[meal.activeOptionIndex] = activeOption;
    meal.options = options;
    updatedMeals[mealIndex] = meal;
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
    <div className="w-full p-4 flex flex-col gap-4 bg-gray10">
      {/* Usar el componente MealItem para cada comida */}
      {meals.map((meal, mealIndex) => (
        <MealItem
          key={mealIndex}
          meal={meal}
          mealIndex={mealIndex}
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
      <button onClick={addMeal}
        className="rounded-full border-gray-200 border hover:bg-gray-100 cursor-pointer text-gray70 text-sm px-4 py-3 flex items-center justify-center hover:bg-gray20">
        <Strawberry size={20} className="mr-2 text-teal50" />
        Añadir Nueva Comida
      </button>
    </div>
  );
};

export default Meals;