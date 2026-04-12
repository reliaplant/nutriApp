'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  CheckmarkFilled, 
  TrashCan, 
  Strawberry 
} from '@carbon/icons-react';
import PrintNutritionPlan from '@/app/consulta/components/printPDF';
import { useParams, useSearchParams } from 'next/navigation';
import moment from 'moment';
import Meals, { Meal } from '../components/meals';
import { patientService, consultationService, authService } from '@/app/shared/firebase';
import { Patient, Consultation } from '@/app/shared/interfaces';

// Constantes nutricionales
const ACTIVITY_LEVELS: Record<string, { label: string; factor: number }> = {
  'sedentary': { label: 'Sedentario', factor: 1.2 },
  'light': { label: 'Ligeramente activo', factor: 1.375 },
  'moderate': { label: 'Moderadamente activo', factor: 1.55 },
  'active': { label: 'Muy activo', factor: 1.725 },
  'very-active': { label: 'Extremadamente activo', factor: 1.9 }
};

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

const DEFAULT_MACROS = { protein: 30, carbs: 40, fat: 30 };

export default function CrearPlan() {
  // Obtener IDs de paciente y consulta
  const params = useParams();
  const searchParams = useSearchParams();
  const consultationId = params?.id && typeof params.id === 'string' ? params.id : '';
  const patientId = searchParams?.get('patientId') || '';

  // Estados
  const [activeTab, setActiveTab] = useState('summary');
  const [notasContent, setNotasContent] = useState('');
  const [patient, setPatient] = useState<Patient | null>(null);
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Estado de las comidas y nutrición total
  const [meals, setMeals] = useState<Meal[]>([]);
  
  const [totalNutrition, setTotalNutrition] = useState({
    calories: 0, protein: 0, carbs: 0, fat: 0
  });

  // Estados del resumen nutricional (inline)
  const [editableData, setEditableData] = useState({
    weight: 70, activityLevel: 'moderate', goal: 'maintain', weightGoal: 0
  });
  const [customMacros, setCustomMacros] = useState(DEFAULT_MACROS);
  const [macrosAreCustomized, setMacrosAreCustomized] = useState(false);
  const [isEditingData, setIsEditingData] = useState(false);
  const [theoreticalValues, setTheoreticalValues] = useState({
    bmr: 0, tdee: 0, dailyCalories: 0, dailyDeficit: 0, protein: 0, carbs: 0, fat: 0
  });

  // Lista de ingredientes comunes
  const COMMON_INGREDIENTS = [
    { name: "Pan integral", quantity: 30, calories: 80, protein: 4, carbs: 14, fat: 1 },
    { name: "Avena", quantity: 40, calories: 150, protein: 5, carbs: 27, fat: 3 },
    { name: "Huevo", quantity: 50, calories: 70, protein: 6, carbs: 0, fat: 5 },
    { name: "Pollo", quantity: 100, calories: 165, protein: 31, carbs: 0, fat: 3.6 },
    { name: "Arroz", quantity: 100, calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
    // Más ingredientes...
  ];

  // Añadir este estado para los parámetros nutricionales
  const [nutritionParams, setNutritionParams] = useState({
    weight: patient?.currentWeight || 70,
    activityLevel: 'moderate',
    goal: 'maintain',
    weightGoal: 0,
    macroDistribution: { protein: 30, carbs: 40, fat: 30 },
    bmr: 0,
    tdee: 0
  });

  // Helper: valor combinado para el selector de objetivo
  const getGoalSelectValue = () => {
    if (editableData.goal === 'maintain') return 'maintain';
    return `${editableData.goal}-${editableData.weightGoal}`;
  };

  // Calcular valores teóricos
  const calculateTheoreticalValues = () => {
    const gender = (patient?.gender === 'male' || patient?.gender === 'female') ? patient.gender : 'male';
    const age = patient?.birthDate ? moment().diff(moment(patient.birthDate, 'YYYY-MM-DD'), 'years') : 30;
    const height = patient?.height || 170;
    const weight = editableData.weight;
    const activityLevel = editableData.activityLevel;
    const goal = editableData.goal;
    const weightGoal = editableData.weightGoal;

    let bmr = gender === 'male'
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161;

    const activityFactor = ACTIVITY_LEVELS[activityLevel]?.factor || 1.55;
    const tdee = bmr * activityFactor;
    let dailyCalories = tdee;
    let dailyDeficit = 0;

    if (goal === 'lose' && weightGoal) {
      dailyDeficit = Math.round((weightGoal * 7700) / 30);
      dailyCalories = tdee - dailyDeficit;
    } else if (goal === 'gain' && weightGoal) {
      dailyDeficit = -Math.round((weightGoal * 7700) / 30);
      dailyCalories = tdee - dailyDeficit;
    }

    const macros = macrosAreCustomized ? customMacros : DEFAULT_MACROS;
    const protein = Math.round((dailyCalories * (macros.protein / 100)) / 4);
    const carbs = Math.round((dailyCalories * (macros.carbs / 100)) / 4);
    const fat = Math.round((dailyCalories * (macros.fat / 100)) / 9);

    setTheoreticalValues({
      bmr: Math.round(bmr), tdee: Math.round(tdee),
      dailyCalories: Math.round(dailyCalories), dailyDeficit, protein, carbs, fat
    });

    setNutritionParams({
      weight, activityLevel, goal, weightGoal,
      macroDistribution: macros,
      bmr: Math.round(bmr), tdee: Math.round(tdee)
    });
  };

  // Manejo de cambios editables
  const handleEditableChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'weight') {
      setEditableData(prev => ({ ...prev, weight: parseFloat(value) || prev.weight }));
    } else {
      setEditableData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleGoalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const opt = GOAL_OPTIONS.find(o => o.value === e.target.value);
    if (opt) setEditableData(prev => ({ ...prev, goal: opt.goal, weightGoal: opt.weightGoal }));
  };

  const handleMacroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseInt(value, 10) || 0;
    const updated = { ...customMacros, [name]: numValue };
    const sum = Object.values(updated).reduce((a, b) => a + b, 0);
    if (sum !== 100) {
      const others = Object.keys(updated).filter(k => k !== name);
      const finalTotal = numValue + others.reduce((t, f) => t + updated[f as keyof typeof updated], 0);
      if (finalTotal !== 100 && others.length > 0) {
        updated[others[0] as keyof typeof updated] += (100 - finalTotal);
      }
    }
    setCustomMacros(updated);
  };

  // Cargar datos del paciente y consulta
  useEffect(() => {
    const loadData = async () => {
      if (!patientId || !consultationId) {
        setError("No se proporcionó ID del paciente o consulta");
        setLoading(false);
        return;
      }

      try {
        // CAMBIO IMPORTANTE: Esperar a que la autenticación esté lista
        const user = await authService.getAuthStatePromise();
        
        if (!user) {
          console.error("Usuario no autenticado");
          setError("Necesitas iniciar sesión para ver este contenido");
          setLoading(false);
          return;
        }

        // Cargar datos del paciente con mejor manejo de errores
        try {
          const patientData = await patientService.getPatientById(patientId);
          if (!patientData) {
            setError("Paciente no encontrado");
            setLoading(false);
            return;
          }
          setPatient(patientData);
        } catch (patientError) {
          console.error("Error al cargar datos del paciente:", patientError);
          setError("Error al cargar datos del paciente");
          setLoading(false);
          return;
        }

        // Cargar datos de la consulta con mejor manejo de errores
        try {
          const consultationData = await consultationService.getConsultationById(patientId, consultationId);
          if (!consultationData) {
            setError("Consulta no encontrada");
            setLoading(false);
            return;
          }
          setConsultation(consultationData);

          // Si ya existe un plan nutricional, cargarlo
          if (consultationData.nutritionPlan) {
            if (consultationData.nutritionPlan.meals) {
              setMeals(consultationData.nutritionPlan.meals);
            }
            if (consultationData.nutritionPlan.notes) {
              setNotasContent(consultationData.nutritionPlan.notes);
            }
            // AÑADIR ESTO:
            if (consultationData.nutritionPlan.nutritionParams) {
              console.log("Cargando parámetros guardados:", consultationData.nutritionPlan.nutritionParams);
              setNutritionParams(consultationData.nutritionPlan.nutritionParams);
            }
          }
        } catch (consultationError) {
          console.error("Error al cargar datos de la consulta:", consultationError);
          setError("Error al cargar datos de la consulta");
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error("Error general al cargar datos:", err);
        setError("Error al cargar los datos. Por favor, inicia sesión nuevamente.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [patientId, consultationId]);

  // Calcular totales nutricionales cuando cambian las comidas
  useEffect(() => {
    const calculateTotalNutrition = () => {
      const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
      
      meals.forEach(meal => {
        meal.options.forEach(option => {
          if (option.isSelectedForSummary) {
            option.ingredients.forEach(ingredient => {
              totals.calories += ingredient.calories || 0;
              totals.protein += ingredient.protein || 0;
              totals.carbs += ingredient.carbs || 0;
              totals.fat += ingredient.fat || 0;
            });
          }
        });
      });
      
      setTotalNutrition(totals);
    };
    
    calculateTotalNutrition();
  }, [meals]);

  // Sync editableData when patient loads
  useEffect(() => {
    if (patient) {
      setEditableData(prev => ({
        ...prev,
        weight: nutritionParams.weight || patient.currentWeight || 70,
        activityLevel: nutritionParams.activityLevel || 'moderate',
        goal: nutritionParams.goal || 'maintain',
        weightGoal: nutritionParams.weightGoal || 0
      }));
      if (nutritionParams.macroDistribution) {
        setCustomMacros(nutritionParams.macroDistribution);
        setMacrosAreCustomized(true);
      }
    }
  }, [patient]);

  // Recalcular cuando cambian datos editables
  useEffect(() => {
    if (!patient) return;
    const timer = setTimeout(() => calculateTheoreticalValues(), 300);
    return () => clearTimeout(timer);
  }, [patient, editableData.weight, editableData.activityLevel,
      editableData.goal, editableData.weightGoal, macrosAreCustomized, customMacros]);

  // Función para manejar cambios en las comidas
  const handleMealsChange = (updatedMeals: Meal[]) => {
    setMeals(updatedMeals);
  };

  // Guardar plan nutricional en Firebase
  const savePlan = async () => {
    if (!patientId || !consultationId) {
      alert("No se puede guardar: falta ID del paciente o consulta");
      return;
    }

    try {
      setIsSaving(true);
      
      // Preparar los datos del plan nutricional
      const nutritionPlan = {
        meals: meals,
        notes: notasContent,
        totalNutrition: totalNutrition,
        nutritionParams: nutritionParams, // Añadir esta línea
        lastUpdated: new Date().toISOString()
      };

      console.log("Guardando plan con parámetros:", nutritionPlan);

      // Actualizar la consulta con el plan nutricional
      await consultationService.updateConsultation(
        patientId, 
        consultationId, 
        { nutritionPlan }
      );
      
      alert("Plan nutricional guardado correctamente");
    } catch (err) {
      console.error("Error al guardar el plan:", err);
      alert("Error al guardar el plan");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-emerald-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return <div className="p-4 bg-red-50 text-red-600 rounded-sm text-xs">{error}</div>;
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-row">
        {/* Panel lateral sticky con pestañas */}
        <div className="w-1/4 h-[calc(100vh-40px)] sticky top-10 overflow-auto bg-white border-r border-gray-200">
          {/* Header del paciente */}
          {patient && (
            <div>
              <div className="px-3 pt-2 pb-1">
                <Link href={`/detalle-paciente/${patientId}`} className="text-[10px] text-emerald-600 hover:underline">
                  ← Perfil del paciente
                </Link>
              </div>
              <div className="px-3 pb-2 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-semibold text-emerald-700">
                    {patient.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <p className="text-xs font-semibold text-gray-800">
                  {patient.name}
                  <span className="pl-1 text-[10px] text-gray-400 font-normal">
                    ({patient.gender === 'male' ? 'Masculino' : 'Femenino'})
                  </span>
                </p>
              </div>
            </div>
          )}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('summary')}
              className={`flex-1 py-2 text-[11px] font-medium transition-colors ${
                activeTab === 'summary' 
                  ? 'text-emerald-600 border-b-2 border-emerald-600' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Resumen
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`flex-1 py-2 text-[11px] font-medium transition-colors ${
                activeTab === 'notes' 
                  ? 'text-emerald-600 border-b-2 border-emerald-600' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Notas
            </button>
          </div>
          
          {/* Contenido del panel según la pestaña activa */}
          <div>
            {activeTab === 'summary' ? (
              <div>
                <div className="border-t border-gray-200"></div>

                {/* Datos del paciente */}
                <div className="px-3 py-2.5">
                  <div className="flex justify-between items-center mb-1.5">
                    <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-gray-400">Datos del paciente</p>
                    {!isEditingData ? (
                      <button onClick={() => setIsEditingData(true)} className="text-[10px] text-emerald-600 hover:underline">Editar</button>
                    ) : (
                      <button onClick={() => { setMacrosAreCustomized(true); setIsEditingData(false); calculateTheoreticalValues(); }} className="text-[10px] text-emerald-600 hover:underline">Listo</button>
                    )}
                  </div>
                  <div className="text-[11px] space-y-1.5">
                    <div>
                      <span className="text-gray-400">Altura:</span>
                      <span className="ml-1 font-medium text-gray-700">{patient?.height || 170} cm</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Edad:</span>
                      <span className="ml-1 font-medium text-gray-700">{patient?.birthDate ? moment().diff(moment(patient.birthDate, 'YYYY-MM-DD'), 'years') : 30} años</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-400">Peso:</span>
                      {isEditingData ? (
                        <>
                          <select name="weight" value={editableData.weight} onChange={handleEditableChange}
                            className="ml-1 p-0 text-[11px] bg-transparent font-medium text-gray-700 focus:outline-none w-auto" style={{ width: 'auto' }}>
                            {Array.from({ length: 80 }, (_, i) => i + 50).map(w => <option key={w} value={w}>{w}</option>)}
                          </select>
                          <span className="ml-0.5 text-gray-400">kg</span>
                        </>
                      ) : (
                        <span className="ml-1 font-medium text-gray-700">{editableData.weight} kg</span>
                      )}
                    </div>
                    <div>
                      <span className="text-gray-400">Actividad:</span>
                      {isEditingData ? (
                        <select name="activityLevel" value={editableData.activityLevel} onChange={handleEditableChange}
                          className="ml-1 p-0 text-[11px] bg-transparent font-medium text-gray-700 focus:outline-none w-auto" style={{ width: 'auto' }}>
                          {Object.entries(ACTIVITY_LEVELS).map(([val, { label }]) => <option key={val} value={val}>{label}</option>)}
                        </select>
                      ) : (
                        <span className="ml-1 font-medium text-gray-700">{ACTIVITY_LEVELS[editableData.activityLevel]?.label}</span>
                      )}
                    </div>
                    <div>
                      <span className="text-gray-400">Objetivo:</span>
                      {isEditingData ? (
                        <select value={getGoalSelectValue()} onChange={handleGoalChange}
                          className="ml-1 p-0 text-[11px] bg-transparent font-medium text-gray-700 focus:outline-none w-auto" style={{ width: 'auto' }}>
                          {GOAL_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                      ) : (
                        <span className="ml-1 font-medium text-gray-700">
                          {GOAL_OPTIONS.find(o => o.value === getGoalSelectValue())?.label || 'Mantener peso'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200"></div>

                {/* Requerimientos Energéticos */}
                <div className="px-3 py-2.5">
                  <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-gray-400 mb-2">Requerimientos Energéticos</p>
                  <div className="space-y-1 text-[11px]">
                    <div><span className="text-gray-400">Metabolismo basal:</span><span className="ml-1 font-medium text-gray-700">{theoreticalValues.bmr} kcal</span></div>
                    <div><span className="text-gray-400">Gasto total:</span><span className="ml-1 font-medium text-gray-700">{theoreticalValues.tdee} kcal</span></div>
                    <div><span className="text-gray-400">Calorías objetivo:</span><span className="ml-1 font-medium text-gray-700">{theoreticalValues.dailyCalories} kcal/día</span></div>
                    {theoreticalValues.dailyDeficit !== 0 && (
                      <div className="text-[10px] text-red-400 mt-1">
                        {theoreticalValues.dailyDeficit > 0
                          ? <span>Déficit necesario: ~{theoreticalValues.dailyDeficit} kcal/día ({editableData.weightGoal} kg/mes)</span>
                          : <span>Superávit necesario: ~{-theoreticalValues.dailyDeficit} kcal/día ({editableData.weightGoal} kg/mes)</span>}
                      </div>
                    )}
                  </div>
                </div>

                {/* Distribución de macronutrientes */}
                <div className="px-3 pb-2.5">
                  <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-gray-400 mb-2">Distribución de macronutrientes</p>
                  {isEditingData ? (
                    <div className="space-y-2">
                      {[
                        { name: 'protein' as const, label: 'Proteínas', color: 'red', value: customMacros.protein, grams: theoreticalValues.protein },
                        { name: 'carbs' as const, label: 'Carbohidratos', color: 'amber', value: customMacros.carbs, grams: theoreticalValues.carbs },
                        { name: 'fat' as const, label: 'Grasas', color: 'blue', value: customMacros.fat, grams: theoreticalValues.fat },
                      ].map((macro) => (
                        <div key={macro.name} className="flex items-center gap-2">
                          <span className={`text-[10px] w-20 text-${macro.color}-500 font-medium`}>{macro.label}</span>
                          <input type="range" name={macro.name} min="5" max="70" value={macro.value} onChange={handleMacroChange}
                            className="flex-1 h-1 bg-gray-200 rounded-full appearance-none cursor-pointer accent-emerald-600" />
                          <span className="text-[11px] font-medium text-gray-700 w-8 text-right">{macro.value}%</span>
                          <span className="text-[10px] text-gray-400 w-10 text-right">{macro.grams}g</span>
                        </div>
                      ))}
                      {(customMacros.protein + customMacros.carbs + customMacros.fat) !== 100 && (
                        <p className="text-[10px] text-red-400">Total: {customMacros.protein + customMacros.carbs + customMacros.fat}% (debe ser 100%)</p>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      <div><p className="text-[10px] text-gray-400">Proteínas</p><p className="text-xs font-medium text-gray-800">{customMacros.protein}%</p></div>
                      <div><p className="text-[10px] text-gray-400">Carbohidratos</p><p className="text-xs font-medium text-gray-800">{customMacros.carbs}%</p></div>
                      <div><p className="text-[10px] text-gray-400">Grasas</p><p className="text-xs font-medium text-gray-800">{customMacros.fat}%</p></div>
                    </div>
                  )}
                </div>

                {/* Plan actual vs. Objetivo */}
                <div className="px-3 py-2.5 border-t border-gray-200">
                  <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-gray-400 mb-2">Plan actual vs. Objetivo</p>
                  <div className="space-y-2 text-[11px]">
                    {[
                      { label: 'Calorías', actual: totalNutrition.calories, target: theoreticalValues.dailyCalories, color: 'bg-emerald-500', unit: '' },
                      { label: 'Proteínas', actual: totalNutrition.protein, target: theoreticalValues.protein, color: 'bg-red-400', unit: 'g' },
                      { label: 'Carbohidratos', actual: totalNutrition.carbs, target: theoreticalValues.carbs, color: 'bg-amber-400', unit: 'g' },
                      { label: 'Grasas', actual: Math.round(totalNutrition.fat), target: theoreticalValues.fat, color: 'bg-blue-400', unit: 'g' },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex justify-between mb-1">
                          <span>{item.label}</span>
                          <div>
                            <span className="font-medium">{item.actual || 0}{item.unit}</span>
                            <span className="mx-1 text-gray-400">/</span>
                            <span className="text-gray-500">{item.target}{item.unit}</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1">
                          <div className={`${item.color} h-1 rounded-full`} style={{ width: `${Math.min(100, (item.actual || 0) / (item.target || 1) * 100)}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Notas tab */
              <div className="p-3">
                <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-gray-400 mb-2">Notas</p>
                <textarea
                  defaultValue={notasContent}
                  onChange={(e) => setNotasContent(e.target.value)}
                  placeholder="Escribe tus notas aquí..."
                  className="w-full min-h-[calc(100vh-200px)] p-2 text-xs text-gray-700 border border-gray-200 rounded-sm resize-none focus:outline-none focus:border-emerald-300 placeholder:text-gray-300"
                />
              </div>
            )}
          </div>

          {/* Acciones: Imprimir + Guardar */}
          <div className="border-t border-gray-200 px-3 py-2.5 flex flex-col gap-2">
            <PrintNutritionPlan
              patient={patient}
              consultation={consultation}
              meals={meals}
              totalNutrition={totalNutrition}
              notes={notasContent}
              nutritionistName="Dr. Juan Pérez"
              nutritionistId="CP-12345"
            />
            <button 
              onClick={savePlan}
              disabled={isSaving}
              className={`w-full bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-sm text-[11px] flex items-center justify-center transition-colors ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSaving ? 'Guardando...' : (
                <>
                  <CheckmarkFilled size={14} className="mr-1.5" />
                  Guardar Plan
                </>
              )}
            </button>
          </div>
        </div>

        {/* Contenido principal del plan (a la derecha) */}
        <div className="w-3/4 p-4 flex flex-col gap-3 bg-gray-50">
          <Meals 
            meals={meals}
            commonIngredients={COMMON_INGREDIENTS}
            onMealsChange={handleMealsChange}
          />
        </div>
      </div>
    </div>
  );
}