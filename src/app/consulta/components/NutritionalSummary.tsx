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
}

interface NutritionSummaryProps {
  patientData?: PatientData;
  totalNutrition?: any;
  showDetails?: boolean;
  onSaveChanges?: (data: any) => void;
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
  onSaveChanges
}: NutritionSummaryProps) => {
  // Estados
  const [editableData, setEditableData] = useState({
    weight: patientData.weight,
    activityLevel: patientData.activityLevel,
    goal: patientData.goal,
    weightGoal: patientData.weightGoal || 2
  });

  const [useCustomMacros, setUseCustomMacros] = useState(false);
  const [customMacros, setCustomMacros] = useState(DEFAULT_MACROS);
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
    const macros = useCustomMacros ? customMacros : DEFAULT_MACROS;
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
      const finalTotal = numValue + otherFields.reduce((total, field) => total + updatedMacros[field], 0);

      if (finalTotal !== 100 && otherFields.length > 0) {
        updatedMacros[otherFields[0] as keyof typeof updatedMacros] += (100 - finalTotal);
      }
    }

    setCustomMacros(updatedMacros);
  };

  // Actualizar cálculos cuando cambian los inputs
  useEffect(() => {
    calculateTheoreticalValues();
  }, [patientData, editableData, customMacros, useCustomMacros]);

  return (
    <div className="p-1">
      {/* Título */}
      <div className="mb-3 flex justify-between items-center">
        <div>
          <span className="ml-1 font-bold">Andrés Enrique Leonza
            <span className='pl-2 text-gray50 font-light'>
              ({patientData.gender === 'male' ? 'Masculino' : 'Femenino'})</span>
          </span>
        </div>
      </div>

      {/* Datos del paciente con campos editables inline */}
      <div className="p-1 rounded-md mb-3">
        <div className="text-sm">

        <div className=''>
          <span className="text-gray-500">Altura:</span>
          <span className="ml-1 font-medium">{patientData.height} cm</span>
        </div>
        <div className='mt-1.5'>
          <span className="text-gray-500">Edad:</span>
          <span className="ml-1 font-medium">{patientData.age} años</span>
        </div>


          <div className="mt-1">
        <div className="flex items-center">
          <span className="text-gray-500">Peso:</span>
          <select
            name="weight"
            value={editableData.weight}
            onChange={handleInputChange}
            className="ml-1 p-0.5 text-sm bg-transparent inline-flex items-center font-medium focus:outline-none focus:text-blue-600 w-auto"
            style={{ width: 'auto' }}
          >
            {Array.from({ length: 80 }, (_, i) => i + 50).map(weight => (
            <option key={weight} value={weight}>{weight}</option>
            ))}
          </select>
          <span className="ml-1">kg</span>
        </div>
          </div>
          <div className="col-span-2 mt-1">
        <span className="text-gray-500">Actividad:</span>
        <div className="inline-block relative">
          <select
            name="activityLevel"
            value={editableData.activityLevel}
            onChange={handleInputChange}
            className="ml-1 p-0.5 text-sm bg-transparent inline-flex items-center font-medium focus:outline-none focus:text-blue-600 w-auto"
            style={{ width: 'auto' }}
          >
            {Object.entries(ACTIVITY_LEVELS).map(([value, { label }]) => (
          <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
          </div>
          <div className="col-span-2 mt-1">
        <span className="text-gray-500">Objetivo:</span>
        <div className="inline-block relative">
          <select
            value={getGoalSelectValue()}
            onChange={handleGoalChange}
            className="ml-1 p-0.5 text-sm bg-transparent inline-flex items-center font-medium focus:outline-none focus:text-blue-600 w-auto"
            style={{ width: 'auto' }}
          >
            {GOAL_OPTIONS.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
          </div>
        </div>
      </div>

      {/* Información calórica y macronutrientes */}
      <div className="rounded-md mb-3">
        <h3 className="text-sm mb-2 font-bold  mt-6">Requerimientos Energéticos</h3>

        <div className="flex flex-col gap-1.5 text-sm">
          <div>
            <span className="text-gray-500">Metabolismo basal:</span>
            <span className="ml-1 font-medium">{theoreticalValues.bmr} kcal</span>
          </div>
          <div>
            <span className="text-gray-500">Gasto total:</span>
            <span className="ml-1 font-medium">{theoreticalValues.tdee} kcal</span>
          </div>
          <div className="col-span-2">
            <span className="text-gray-500">Calorías objetivo:</span>
            <span className="ml-1 font-medium">{theoreticalValues.dailyCalories} kcal/día</span>
          </div>

          {theoreticalValues.dailyDeficit !== 0 && (
            <div className="rounded text-xs text-red50">
              {theoreticalValues.dailyDeficit > 0 ? (
                <span>Para perder {editableData.weightGoal} kg/mes se necesita un déficit de aprox. {theoreticalValues.dailyDeficit} kcal/día</span>
              ) : (
                <span>Para ganar {editableData.weightGoal} kg/mes se necesita un superávit de aprox. {-theoreticalValues.dailyDeficit} kcal/día</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Distribución de macronutrientes */}
      <div className="mt-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-bold">Distribución de Macros</h3>
          <div className="flex items-center">
            <span
              className="text-xs text-blue-600 cursor-pointer hover:underline"
              onClick={() => setUseCustomMacros(!useCustomMacros)}
            >
              {useCustomMacros ? 'Confirmar' : 'Personalizar'}
            </span>
          </div>
        </div>

        <div className="flex space-x-2 text-xs">
          <div className="flex-1 border border-gray-200 rounded border overflow-hidden text-center">
            <div className="bg-red-100/50 px-2 py-1 border-b border-red-200">
              <span className="font-medium text-red-700">Proteínas</span>
            </div>
            <div className="p-2 text-center">
              {useCustomMacros ? (
                <div className="flex justify-center items-center">
                  <input 
                    type="number" 
                    name="protein"
                    value={customMacros.protein}
                    onChange={handleMacroChange}
                    className="w-12 text-center border border-gray-200 rounded p-0.5 text-center"
                    min="10"
                    max="60"
                  />
                  <span className="ml-0.5">%</span>
                </div>
              ) : (
                <div className="font">{customMacros.protein}%</div>
              )}
              <div className="mt-1 font-bold text-sm">{theoreticalValues.protein}g</div>
            </div>
          </div>
          
          <div className="flex-1 border border-gray-200 rounded border overflow-hidden text-center">
            <div className="bg-amber-100/50 px-2 py-1 border-b border-amber-200">
              <span className="font-medium text-amber-700">Carbos</span>
            </div>
            <div className="p-2 text-center">
              {useCustomMacros ? (
                <div className="flex justify-center items-center">
                  <input 
                    type="number" 
                    name="carbs"
                    value={customMacros.carbs}
                    onChange={handleMacroChange}
                    className="w-12 text-center border border-gray-200 rounded p-0.5"
                    min="10"
                    max="70"
                  />
                  <span className="ml-0.5">%</span>
                </div>
              ) : (
                <div className="font">{customMacros.carbs}%</div>
              )}
              <div className="mt-1 font-bold text-sm">{theoreticalValues.carbs}g</div>
            </div>
          </div>
          
          <div className="flex-1 border border-gray-200 rounded border overflow-hidden">
            <div className="bg-blue-100/50 px-2 py-1 border-b border-blue-200">
              <span className="font-medium text-blue-700">Grasas</span>
            </div>
            <div className="p-2 text-center">
              {useCustomMacros ? (
                <div className="flex justify-center items-center">
                  <input 
                    type="number" 
                    name="fat"
                    value={customMacros.fat}
                    onChange={handleMacroChange}
                    className="w-12 text-center border border-gray-200 rounded p-0.5"
                    min="10"
                    max="60"
                  />
                  <span className="ml-0.5">%</span>
                </div>
              ) : (
                <div className="font">{customMacros.fat}%</div>
              )}
              <div className="mt-1 font-bold text-sm">{theoreticalValues.fat}g</div>
            </div>
          </div>
        </div>
      </div>

      {/* Comparación con el plan actual - Solo si hay datos del plan */}
      {totalNutrition && showDetails && (
        <div className="mt-6">
          <h3 className="text-sm font-bold mb-2">Plan actual vs. Objetivo</h3>

          <div className="space-y-2 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span>Calorías</span>
                <div>
                  <span className="font-medium">{totalNutrition.calories || 0}</span>
                  <span className="mx-1 text-gray-400">/</span>
                  <span className="text-gray-500">{theoreticalValues.dailyCalories}</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-green-500 h-1.5 rounded-full"
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
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-red-500 h-1.5 rounded-full"
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
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-amber-500 h-1.5 rounded-full"
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
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-blue-500 h-1.5 rounded-full"
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