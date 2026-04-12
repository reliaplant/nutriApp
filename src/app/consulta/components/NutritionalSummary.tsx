import React, { useState, useEffect } from 'react';

// Interfaces
interface PatientData {
  gender: 'male' | 'female';
  age: number;
  height: number; // in cm
  weight: number; // in kg
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active';
  goal: 'lose' | 'maintain' | 'gain';
  weightGoal?: number; // kg per month
  name?: string; // Añade esta propiedad
}

interface NutritionSummaryProps {
  patientData?: PatientData;
  totalNutrition?: any;
  showDetails?: boolean;
  onSaveChanges?: (data: any) => void;
  onNutritionParamsChange?: (params: {
    weight: number;
    activityLevel: string;
    goal: string;
    weightGoal: number;
    macroDistribution: {
      protein: number;
      carbs: number;
      fat: number;
    };
    bmr: number;
    tdee: number;
  }) => void;
  initialMacroDistribution?: {
    protein: number;
    carbs: number;
    fat: number;
  };
}

// Constantes
const ACTIVITY_LEVELS = {
  'sedentary': { label: 'Sedentario', factor: 1.2 },
  'light': { label: 'Ligeramente activo', factor: 1.375 },
  'moderate': { label: 'Moderadamente activo', factor: 1.55 },
  'active': { label: 'Muy activo', factor: 1.725 },
  'very-active': { label: 'Extremadamente activo', factor: 1.9 }
};

// Opciones predefinidas para objetivos de peso
const GOAL_OPTIONS = [
  { value: 'lose-4', label: 'Perder 4kg/mes', goal: 'lose', weightGoal: 4 },
  { value: 'lose-3', label: 'Perder 3kg/mes', goal: 'lose', weightGoal: 3 },
  { value: 'lose-2', label: 'Perder 2kg/mes', goal: 'lose', weightGoal: 2 },
  { value: 'lose-1', label: 'Perder 1kg/mes', goal: 'lose', weightGoal: 1 },
  { value: 'maintain', label: 'Mantener peso', goal: 'maintain', weightGoal: 0 },
  { value: 'gain-1', label: 'Ganar 1kg/mes', goal: 'gain', weightGoal: 1 },
  { value: 'gain-2', label: 'Ganar 2kg/mes', goal: 'gain', weightGoal: 2 },
  { value: 'gain-3', label: 'Ganar 3kg/mes', goal: 'gain', weightGoal: 3 },
];

const DEFAULT_PATIENT_DATA: PatientData = {
  gender: 'male',
  age: 35,
  height: 175,
  weight: 75,
  activityLevel: 'moderate',
  goal: 'lose',
  weightGoal: 2 // kg per month
};

const DEFAULT_MACROS = {
  protein: 30,
  carbs: 40,
  fat: 30
};

const NutritionalSummary = ({
  patientData = DEFAULT_PATIENT_DATA,
  totalNutrition,
  showDetails = false,
  onSaveChanges,
  onNutritionParamsChange,
  initialMacroDistribution
}: NutritionSummaryProps) => {
  // Estados
  const [editableData, setEditableData] = useState({
    weight: patientData.weight,
    activityLevel: patientData.activityLevel,
    goal: patientData.goal,
    weightGoal: patientData.weightGoal || 2
  });

  const [customMacros, setCustomMacros] = useState(DEFAULT_MACROS);
  const [macrosAreCustomized, setMacrosAreCustomized] = useState(false);
  const [isEditingMacros, setIsEditingMacros] = useState(false);
  const [theoreticalValues, setTheoreticalValues] = useState({
    bmr: 0,
    tdee: 0,
    dailyCalories: 0,
    dailyDeficit: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  });

  // Obtener el valor combinado para el selector de objetivo
  const getGoalSelectValue = () => {
    if (editableData.goal === 'maintain') return 'maintain';
    return `${editableData.goal}-${editableData.weightGoal}`;
  };

  // Manejar cambios en el selector de objetivo
  const handleGoalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOption = GOAL_OPTIONS.find(option => option.value === e.target.value);

    if (selectedOption) {
      setEditableData(prev => ({
        ...prev,
        goal: selectedOption.goal as 'lose' | 'maintain' | 'gain',
        weightGoal: selectedOption.weightGoal
      }));
    }
  };

  // Calcular valores teóricos basados en los datos del paciente
  const calculateTheoreticalValues = () => {
    // Usar patientData para datos no editables y editableData para los editables
    const calculationData = {
      ...patientData,
      weight: editableData.weight,
      activityLevel: editableData.activityLevel,
      goal: editableData.goal,
      weightGoal: editableData.weightGoal
    };

    // Calcular BMR utilizando la ecuación de Mifflin-St Jeor
    let bmr;
    if (calculationData.gender === 'male') {
      bmr = 10 * calculationData.weight + 6.25 * calculationData.height - 5 * calculationData.age + 5;
    } else {
      bmr = 10 * calculationData.weight + 6.25 * calculationData.height - 5 * calculationData.age - 161;
    }

    // Calcular TDEE (Total Daily Energy Expenditure)
    const activityFactor = ACTIVITY_LEVELS[calculationData.activityLevel].factor;
    const tdee = bmr * activityFactor;

    // Calcular calorías diarias según el objetivo
    let dailyCalories = tdee;

    // Ajustar para pérdida/ganancia de peso (si aplica)
    let dailyDeficit = 0;
    if (calculationData.goal === 'lose' && calculationData.weightGoal) {
      // 1 kg de grasa = 7700 kcal
      // Para perder X kg en un mes, necesitamos un déficit de X * 7700 / 30 kcal por día
      dailyDeficit = Math.round((calculationData.weightGoal * 7700) / 30);
      dailyCalories = tdee - dailyDeficit;
    } else if (calculationData.goal === 'gain' && calculationData.weightGoal) {
      // Similar para ganar peso
      dailyDeficit = -Math.round((calculationData.weightGoal * 7700) / 30);
      dailyCalories = tdee - dailyDeficit;
    }

    // Calcular macronutrientes
    const macros = macrosAreCustomized ? customMacros : DEFAULT_MACROS;
    const protein = Math.round((dailyCalories * (macros.protein / 100)) / 4); // 4 kcal/g
    const carbs = Math.round((dailyCalories * (macros.carbs / 100)) / 4);     // 4 kcal/g
    const fat = Math.round((dailyCalories * (macros.fat / 100)) / 9);         // 9 kcal/g

    setTheoreticalValues({
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      dailyCalories: Math.round(dailyCalories),
      dailyDeficit,
      protein,
      carbs,
      fat
    });

    // Si hay función de guardar, notificar los cambios
    if (onSaveChanges) {
      onSaveChanges(calculationData);
    }

    // Notificar al componente padre de los cambios
    if (onNutritionParamsChange) {
      const macros = macrosAreCustomized ? customMacros : DEFAULT_MACROS;
      
      onNutritionParamsChange({
        weight: editableData.weight,
        activityLevel: editableData.activityLevel,
        goal: editableData.goal,
        weightGoal: editableData.weightGoal,
        macroDistribution: macros,
        bmr: Math.round(bmr),
        tdee: Math.round(tdee)
      });
    }
  };

  // Manejo de cambios en inputs editables
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'weight') {
      const numValue = parseFloat(value) || editableData.weight;
      setEditableData(prev => ({ ...prev, weight: numValue }));
    } else {
      setEditableData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Manejo de cambios en distribución de macros
  const handleMacroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseInt(value, 10) || 0;
    const updatedMacros = { ...customMacros, [name]: numValue };

    // Asegurar que la suma sea 100%
    const sum = Object.values(updatedMacros).reduce((a, b) => a + b, 0);

    if (sum !== 100) {
      const otherFields = Object.keys(updatedMacros).filter(key => key !== name);
      const finalTotal = numValue + otherFields.reduce((total, field) => total + updatedMacros[field as keyof typeof updatedMacros], 0);

      if (finalTotal !== 100 && otherFields.length > 0) {
        updatedMacros[otherFields[0] as keyof typeof updatedMacros] += (100 - finalTotal);
      }
    }

    setCustomMacros(updatedMacros);
  };

  // Actualizar cálculos cuando cambian los inputs
  useEffect(() => {
    if (initialMacroDistribution) {
      setCustomMacros(initialMacroDistribution);
      setMacrosAreCustomized(true); // Indica que son personalizados
      // Pero NO activamos automáticamente el modo edición
    }
  }, [initialMacroDistribution]);

  useEffect(() => {
    // Solo calcular cuando los inputs cambien, no cuando se actualizan los valores teóricos
    const timer = setTimeout(() => {
      calculateTheoreticalValues();
    }, 300); // debounce para evitar cálculos excesivos
    
    return () => clearTimeout(timer);
  }, [patientData, editableData.weight, editableData.activityLevel, 
      editableData.goal, editableData.weightGoal, macrosAreCustomized, customMacros]);

  // Función para activar el modo edición
  const handleCustomizeMacros = () => {
    setIsEditingMacros(true);
  };

  // Función para guardar los cambios
  const handleSaveMacros = () => {
    setMacrosAreCustomized(true);
    setIsEditingMacros(false);
    calculateTheoreticalValues(); // Actualizar valores con macros personalizados
  };

  // Función para cancelar edición
  const handleCancelMacros = () => {
    setIsEditingMacros(false);
    if (!macrosAreCustomized) {
      // Si no había macros personalizados antes, volver a los valores predeterminados
      setCustomMacros(DEFAULT_MACROS);
    }
  };

  return (
    <div className="p-0.5">
      {/* Título */}
      <div className="mb-3">
        <p className="text-xs font-semibold text-gray-800">
          {patientData.name || 'Paciente'}
          <span className="pl-1.5 text-[10px] text-gray-400 font-normal">
            ({patientData.gender === 'male' ? 'Masculino' : 'Femenino'})
          </span>
        </p>
      </div>

      {/* Datos del paciente con campos editables inline */}
      <div className="mb-3">
        <div className="text-[11px] space-y-1.5">

        <div>
          <span className="text-gray-400">Altura:</span>
          <span className="ml-1 font-medium text-gray-700">{patientData.height} cm</span>
        </div>
        <div>
          <span className="text-gray-400">Edad:</span>
          <span className="ml-1 font-medium text-gray-700">{patientData.age} años</span>
        </div>

          <div className="flex items-center">
            <span className="text-gray-400">Peso:</span>
            <select
              name="weight"
              value={editableData.weight}
              onChange={handleInputChange}
              className="ml-1 p-0 text-[11px] bg-transparent font-medium text-gray-700 focus:outline-none w-auto"
              style={{ width: 'auto' }}
            >
              {Array.from({ length: 80 }, (_, i) => i + 50).map(weight => (
              <option key={weight} value={weight}>{weight}</option>
              ))}
            </select>
            <span className="ml-0.5 text-gray-400">kg</span>
          </div>
          <div>
            <span className="text-gray-400">Actividad:</span>
            <select
              name="activityLevel"
              value={editableData.activityLevel}
              onChange={handleInputChange}
              className="ml-1 p-0 text-[11px] bg-transparent font-medium text-gray-700 focus:outline-none w-auto"
              style={{ width: 'auto' }}
            >
              {Object.entries(ACTIVITY_LEVELS).map(([value, { label }]) => (
              <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <span className="text-gray-400">Objetivo:</span>
            <select
              value={getGoalSelectValue()}
              onChange={handleGoalChange}
              className="ml-1 p-0 text-[11px] bg-transparent font-medium text-gray-700 focus:outline-none w-auto"
              style={{ width: 'auto' }}
            >
              {GOAL_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Información calórica y macronutrientes */}
      <div className="mb-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-gray-400 mb-2 mt-5">Requerimientos Energéticos</p>

        <div className="space-y-1 text-[11px]">
          <div>
            <span className="text-gray-400">Metabolismo basal:</span>
            <span className="ml-1 font-medium text-gray-700">{theoreticalValues.bmr} kcal</span>
          </div>
          <div>
            <span className="text-gray-400">Gasto total:</span>
            <span className="ml-1 font-medium text-gray-700">{theoreticalValues.tdee} kcal</span>
          </div>
          <div>
            <span className="text-gray-400">Calorías objetivo:</span>
            <span className="ml-1 font-medium text-gray-700">{theoreticalValues.dailyCalories} kcal/día</span>
          </div>

          {theoreticalValues.dailyDeficit !== 0 && (
            <div className="text-[10px] text-red-400 mt-1">
              {theoreticalValues.dailyDeficit > 0 ? (
                <span>Déficit necesario: ~{theoreticalValues.dailyDeficit} kcal/día ({editableData.weightGoal} kg/mes)</span>
              ) : (
                <span>Superávit necesario: ~{-theoreticalValues.dailyDeficit} kcal/día ({editableData.weightGoal} kg/mes)</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Distribución de macronutrientes */}
      <div className="mt-4">
        <div className="flex justify-between items-center mb-2">
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-gray-400">Distribución de macronutrientes</p>
          
          {!isEditingMacros ? (
            <button
              onClick={handleCustomizeMacros}
              className="text-[10px] text-emerald-600 hover:underline"
            >
              {macrosAreCustomized ? "Editar" : "Editar"}
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleSaveMacros}
                className="text-[10px] text-emerald-600 hover:underline"
              >
                Guardar
              </button>
              <button
                onClick={handleCancelMacros}
                className="text-[10px] text-gray-400 hover:text-gray-600"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
        
        {/* Mostrar información de macros o controles de edición */}
        {isEditingMacros ? (
          <div className="flex space-x-1.5 text-[10px]">
            <div className="flex-1 border border-gray-200 rounded-sm overflow-hidden text-center">
              <div className="bg-red-50 px-1.5 py-0.5 border-b border-red-100">
                <span className="font-medium text-red-600 text-[10px]">Proteínas</span>
              </div>
              <div className="p-1.5 text-center">
                <div className="flex justify-center items-center">
                  <input 
                    type="number" 
                    name="protein"
                    value={customMacros.protein}
                    onChange={handleMacroChange}
                    className="w-10 text-center border border-gray-200 rounded-sm p-0.5 text-[10px]"
                    min="10"
                    max="60"
                  />
                  <span className="ml-0.5 text-gray-400">%</span>
                </div>
                <div className="mt-0.5 font-semibold text-xs text-gray-800">{theoreticalValues.protein}g</div>
              </div>
            </div>
            
            <div className="flex-1 border border-gray-200 rounded-sm overflow-hidden text-center">
              <div className="bg-amber-50 px-1.5 py-0.5 border-b border-amber-100">
                <span className="font-medium text-amber-600 text-[10px]">Carbos</span>
              </div>
              <div className="p-1.5 text-center">
                <div className="flex justify-center items-center">
                  <input 
                    type="number" 
                    name="carbs"
                    value={customMacros.carbs}
                    onChange={handleMacroChange}
                    className="w-10 text-center border border-gray-200 rounded-sm p-0.5 text-[10px]"
                    min="10"
                    max="70"
                  />
                  <span className="ml-0.5 text-gray-400">%</span>
                </div>
                <div className="mt-0.5 font-semibold text-xs text-gray-800">{theoreticalValues.carbs}g</div>
              </div>
            </div>
            
            <div className="flex-1 border border-gray-200 rounded-sm overflow-hidden">
              <div className="bg-blue-50 px-1.5 py-0.5 border-b border-blue-100">
                <span className="font-medium text-blue-600 text-[10px]">Grasas</span>
              </div>
              <div className="p-1.5 text-center">
                <div className="flex justify-center items-center">
                  <input 
                    type="number" 
                    name="fat"
                    value={customMacros.fat}
                    onChange={handleMacroChange}
                    className="w-10 text-center border border-gray-200 rounded-sm p-0.5 text-[10px]"
                    min="10"
                    max="60"
                  />
                  <span className="ml-0.5 text-gray-400">%</span>
                </div>
                <div className="mt-0.5 font-semibold text-xs text-gray-800">{theoreticalValues.fat}g</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-[10px] text-gray-400">Proteínas</p>
              <p className="text-xs font-medium text-gray-800">{macrosAreCustomized ? customMacros.protein : DEFAULT_MACROS.protein}%</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400">Carbohidratos</p>
              <p className="text-xs font-medium text-gray-800">{macrosAreCustomized ? customMacros.carbs : DEFAULT_MACROS.carbs}%</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400">Grasas</p>
              <p className="text-xs font-medium text-gray-800">{macrosAreCustomized ? customMacros.fat : DEFAULT_MACROS.fat}%</p>
            </div>
          </div>
        )}
      </div>

      {/* Comparación con el plan actual - Solo si hay datos del plan */}
      {totalNutrition && showDetails && (
        <div className="mt-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-gray-400 mb-2">Plan actual vs. Objetivo</p>

          <div className="space-y-2 text-[11px]">
            <div>
              <div className="flex justify-between mb-1">
                <span>Calorías</span>
                <div>
                  <span className="font-medium">{totalNutrition.calories || 0}</span>
                  <span className="mx-1 text-gray-400">/</span>
                  <span className="text-gray-500">{theoreticalValues.dailyCalories}</span>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1">
                <div
                  className="bg-emerald-500 h-1 rounded-full"
                  style={{
                    width: `${Math.min(100, (totalNutrition.calories || 0) / theoreticalValues.dailyCalories * 100)}%`
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span>Proteínas</span>
                <div>
                  <span className="font-medium">{totalNutrition.protein || 0}g</span>
                  <span className="mx-1 text-gray-400">/</span>
                  <span className="text-gray-500">{theoreticalValues.protein}g</span>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1">
                <div
                  className="bg-red-400 h-1 rounded-full"
                  style={{
                    width: `${Math.min(100, (totalNutrition.protein || 0) / theoreticalValues.protein * 100)}%`
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span>Carbohidratos</span>
                <div>
                  <span className="font-medium">{totalNutrition.carbs || 0}g</span>
                  <span className="mx-1 text-gray-400">/</span>
                  <span className="text-gray-500">{theoreticalValues.carbs}g</span>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1">
                <div
                  className="bg-amber-400 h-1 rounded-full"
                  style={{
                    width: `${Math.min(100, (totalNutrition.carbs || 0) / theoreticalValues.carbs * 100)}%`
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span>Grasas</span>
                <div>
                  <span className="font-medium">{Math.round(totalNutrition.fat || 0)}g</span>
                  <span className="mx-1 text-gray-400">/</span>
                  <span className="text-gray-500">{theoreticalValues.fat}g</span>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1">
                <div
                  className="bg-blue-400 h-1 rounded-full"
                  style={{
                    width: `${Math.min(100, (totalNutrition.fat || 0) / theoreticalValues.fat * 100)}%`
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NutritionalSummary;