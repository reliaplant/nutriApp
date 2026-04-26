'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  CheckmarkFilled, 
  TrashCan, 
  Strawberry 
} from '@carbon/icons-react';
import PrintNutritionPlan from '@/app/consulta/components/printPDF';
import { ChevronLeft } from 'lucide-react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import moment from 'moment';
import Meals, { Meal } from '../components/meals';
import { COMMON_INGREDIENTS } from '../components/ingredientsData';
import { patientService, consultationService, authService } from '@/app/shared/firebase';
import { useAuth } from '@/app/shared/AuthContext';
import { Patient, Consultation } from '@/app/shared/interfaces';
import { MealCategory } from '@/app/comidas/constants';

// Comidas por defecto
const DEFAULT_MEALS: { category: MealCategory; time: string }[] = [
  { category: 'desayuno', time: '07:00' },
  { category: 'mediaManana', time: '10:00' },
  { category: 'almuerzo', time: '12:30' },
  { category: 'lunchTarde', time: '16:00' },
  { category: 'cena', time: '19:30' },
];

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

const MACRO_PRESETS = [
  { label: 'Balanceada', protein: 30, carbs: 40, fat: 30 },
  { label: 'Alta Proteína', protein: 40, carbs: 35, fat: 25 },
  { label: 'Low Carb', protein: 35, carbs: 20, fat: 45 },
  { label: 'Keto', protein: 25, carbs: 5, fat: 70 },
  { label: 'Alta en Carbos', protein: 20, carbs: 60, fat: 20 },
];

export default function CrearPlan() {
  // Obtener IDs de paciente y consulta
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { userData } = useAuth();
  const consultationId = params?.id && typeof params.id === 'string' ? params.id : '';
  const patientId = searchParams?.get('patientId') || '';

  // Estados
  const [activeTab, setActiveTab] = useState('summary');
  const [notasContent, setNotasContent] = useState('');
  const [indicacionesContent, setIndicacionesContent] = useState('');
  const [patient, setPatient] = useState<Patient | null>(null);
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [finalizingConsultation, setFinalizingConsultation] = useState(false);
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);
  const [currentStep, setCurrentStep] = useState<'setup' | 'plan'>('setup');
  const [setupStep, setSetupStep] = useState(1);
  const [editingPatientBase, setEditingPatientBase] = useState(false);
  const [setupPatientData, setSetupPatientData] = useState({
    height: 170,
    birthDate: '',
    gender: 'male' as 'male' | 'female' | 'other',
  });
  const isFirstConsultation = !patient?.height || !patient?.birthDate;

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

  const handleMacroInput = (name: keyof typeof customMacros, value: number) => {
    const clamped = Math.max(0, Math.min(100, value));
    const updated = { ...customMacros, [name]: clamped };
    // Calcular grasas como el restante
    if (name !== 'fat') {
      updated.fat = Math.max(0, 100 - updated.protein - updated.carbs);
    } else {
      updated.carbs = Math.max(0, 100 - updated.protein - updated.fat);
    }
    setCustomMacros(updated);
    setMacrosAreCustomized(true);
  };

  const applyMacroPreset = (preset: typeof MACRO_PRESETS[number]) => {
    setCustomMacros({ protein: preset.protein, carbs: preset.carbs, fat: preset.fat });
    setMacrosAreCustomized(true);
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
          setSetupPatientData({
            height: patientData.height || 170,
            birthDate: patientData.birthDate || '',
            gender: patientData.gender || 'male',
          });
          if (!patientData.height || !patientData.birthDate) {
            setEditingPatientBase(true);
          }
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

          // Si ya existe un plan nutricional con objetivos definidos, ir directo al plan
          if (consultationData.nutritionPlan?.objectivesSet) {
            setCurrentStep('plan');
            if (consultationData.nutritionPlan.meals) {
              setMeals(consultationData.nutritionPlan.meals);
            }
            if (consultationData.nutritionPlan.notes) {
              setNotasContent(consultationData.nutritionPlan.notes);
            }
            if (consultationData.nutritionPlan.indicaciones) {
              setIndicacionesContent(consultationData.nutritionPlan.indicaciones);
            }
            if (consultationData.nutritionPlan.nutritionParams) {
              console.log("Cargando parámetros guardados:", consultationData.nutritionPlan.nutritionParams);
              setNutritionParams(consultationData.nutritionPlan.nutritionParams);
            }
          } else {
            // Crear comidas por defecto para consulta nueva — todas activas y con una opción inicial
            const defaultMeals: Meal[] = DEFAULT_MEALS.map(m => ({
              name: '',
              time: m.time,
              category: m.category,
              isActive: true,
              options: [{
                name: '',
                content: '',
                ingredients: [],
                isSelectedForSummary: true,
                instructions: '',
              }],
              activeOptionIndex: 0,
              selectedOptionForSummary: 0,
            }));
            setMeals(defaultMeals);
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
        if (meal.isActive === false) return;
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

  // Sync editableData when patient and nutritionParams load
  useEffect(() => {
    if (patient && nutritionParams) {
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
  }, [patient, nutritionParams]);

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
    if (!patientId || !consultationId) return;

    try {
      setSaveStatus('saving');
      
      const nutritionPlan = {
        meals: meals,
        notes: notasContent,
        indicaciones: indicacionesContent,
        totalNutrition: totalNutrition,
        nutritionParams: nutritionParams,
        lastUpdated: new Date().toISOString()
      };

      await consultationService.updateConsultation(
        patientId, 
        consultationId, 
        { nutritionPlan }
      );
      
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error("Error al guardar el plan:", err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2500);
    }
  };

  // Finalizar consulta
  const finalizeConsultation = async () => {
    if (!patientId || !consultationId) return;
    setFinalizingConsultation(true);
    try {
      // Primero guardar el plan
      await savePlan();
      // Luego marcar como completada
      await consultationService.completeConsultation(
        patientId,
        consultationId,
        editableData.weight
      );
      router.push(`/detalle-paciente/${patientId}`);
    } catch (err) {
      console.error('Error al finalizar consulta:', err);
      setFinalizingConsultation(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-cream-pattern flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-emerald-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return <div className="m-4 p-3 bg-red-50 text-red-700 rounded-md text-xs" style={{ border: '1px solid #FECACA' }}>{error}</div>;
  }

  return (
    <div className="bg-cream-pattern flex flex-col">
      {/* Subheader fijo */}
      <div className="sticky top-0 z-10 bg-white flex items-center justify-between" style={{ borderBottom: '1px solid #E8E5DE' }}>
        <div className="flex items-center">
          <Link href={`/detalle-paciente/${patientId}`} className="flex items-center gap-1 text-[11px] text-gray-600 hover:text-emerald-700 transition-colors px-4 py-1.5" style={{ borderRight: '1px solid #E8E5DE' }}>
            <ChevronLeft className="h-3.5 w-3.5" />
            Regresar
          </Link>
          <div className="flex items-center gap-2 px-4 py-1.5">
            <span className="text-xs font-semibold text-gray-800">{patient?.name}</span>
            <span className="text-gray-300">›</span>
            <span className="text-xs text-gray-500">{currentStep === 'setup' ? 'Objetivos' : 'Consulta'}</span>
            {consultation?.date && (
              <span className="text-[10px] text-gray-400 ml-1 tabular-nums">
                {moment(consultation.date).format('DD MMM YYYY')}
              </span>
            )}
          </div>
        </div>
        {currentStep === 'plan' && (
        <div className="flex items-center gap-2 px-4">
          <PrintNutritionPlan
            patient={patient}
            consultation={consultation}
            meals={meals}
            totalNutrition={totalNutrition}
            notes={notasContent}
            nutritionistName={userData?.displayName || 'Nutricionista'}
            nutritionistId={userData?.professionalId || ''}
            nutritionistAvatarUrl={userData?.avatarUrl}
            nutritionistLogoUrl={userData?.logoUrl}
            nutritionistSignatureUrl={userData?.signatureUrl}
            nutritionistSpecialization={userData?.specialization}
            nutritionistPhone={userData?.phone}
            nutritionistEmail={userData?.email}
          />
          <button 
            onClick={savePlan}
            disabled={saveStatus === 'saving'}
            className={`px-2.5 py-1 rounded text-[11px] font-medium flex items-center justify-center transition-all duration-300 ${
              saveStatus === 'saved'
                ? 'bg-emerald-600 text-white'
                : saveStatus === 'error'
                ? 'bg-red-600 text-white'
                : saveStatus === 'saving'
                ? 'bg-emerald-600/70 text-white cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {saveStatus === 'saving' ? (
              <>
                <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1.5" />
                Guardando...
              </>
            ) : saveStatus === 'saved' ? (
              <>
                <CheckmarkFilled size={14} className="mr-1.5" />
                Guardado
              </>
            ) : saveStatus === 'error' ? (
              'Error al guardar'
            ) : (
              <>
                <CheckmarkFilled size={14} className="mr-1.5" />
                Guardar
              </>
            )}
          </button>
          {consultation?.status !== 'completed' && (
            <button
              onClick={() => setShowFinalizeConfirm(true)}
              disabled={finalizingConsultation}
              className="px-2.5 py-1 rounded text-[11px] font-medium border border-emerald-600 text-emerald-700 hover:bg-emerald-50 transition-colors"
            >
              Finalizar consulta
            </button>
          )}
          {consultation?.status === 'completed' && (
            <span className="text-[10px] text-gray-500 flex items-center gap-1">
              <CheckmarkFilled size={12} className="text-emerald-600" />
              Completada
            </span>
          )}
        </div>
        )}
      </div>

      {/* Modal de confirmación para finalizar */}
      {showFinalizeConfirm && (
        <div className="fixed inset-0 bg-black/35 flex items-center justify-center z-50">
          <div className="bg-white rounded-md w-full max-w-sm overflow-hidden" style={{ border: '1px solid #E8E5DE', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            <div className="px-5 py-3 border-b border-gray-100">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Consulta</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">¿Terminaste la consulta?</p>
            </div>
            <div className="px-5 py-4">
              <p className="text-[12px] text-gray-600">
                Se marcará como completada y se guardará el plan. Si quieres seguir editando después, puedes reabrirla.
              </p>
            </div>
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setShowFinalizeConfirm(false)}
                className="px-3 py-1 border border-gray-300 rounded text-[11px] text-gray-700 hover:bg-white transition-colors"
                disabled={finalizingConsultation}
              >
                Cancelar
              </button>
              <button
                onClick={() => { setShowFinalizeConfirm(false); finalizeConsultation(); }}
                className="px-3 py-1 bg-emerald-600 text-white rounded text-[11px] font-medium hover:bg-emerald-700 transition-colors"
                disabled={finalizingConsultation}
              >
                {finalizingConsultation ? 'Finalizando...' : 'Sí, finalizar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === SETUP WIZARD === */}
      {currentStep === 'setup' && (
        <div className="bg-cream-pattern flex items-start justify-center min-h-[calc(100vh-2.25rem)]">
          <div className="w-full max-w-lg pt-10 pb-16 px-6">

            {/* Stepper */}
            <div className="flex items-center justify-center gap-3 mb-10">
              {[1, 2].map((step) => (
                <div key={step} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold transition-all ${
                    setupStep === step 
                      ? 'bg-emerald-600 text-white' 
                      : setupStep > step 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-white text-gray-400'
                  }`} style={setupStep !== step && setupStep <= step ? { border: '1px solid #E8E5DE' } : undefined}>
                    {setupStep > step ? '✓' : step}
                  </div>
                  {step < 2 && (
                    <div className={`w-16 h-0.5 rounded-full transition-colors ${setupStep > 1 ? 'bg-emerald-400' : ''}`} style={setupStep > 1 ? undefined : { backgroundColor: '#E8E5DE' }} />
                  )}
                </div>
              ))}
            </div>

            {/* Step 1: Datos del paciente */}
            {setupStep === 1 && (
              <div>
                <p className="text-base font-semibold text-gray-800 text-center mb-6">¿Cómo está {patient?.name?.split(' ')[0]}?</p>

                <div className="bg-white rounded-md p-5 mb-5" style={{ border: '1px solid #E8E5DE' }}>
                  <div className="space-y-4">
                    {/* Datos base: sexo, edad, altura */}
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Datos del paciente</p>
                      {!editingPatientBase && (
                        <button onClick={() => setEditingPatientBase(true)} className="text-[11px] text-emerald-700 hover:underline">Editar</button>
                      )}
                    </div>
                    {editingPatientBase ? (
                      <>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 block mb-1">Sexo</label>
                            <select value={setupPatientData.gender} onChange={(e) => setSetupPatientData(prev => ({ ...prev, gender: e.target.value as 'male' | 'female' | 'other' }))}
                              className="w-full px-2 py-1.5 text-[12px] bg-white border border-gray-300 rounded-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400">
                              <option value="male">Masculino</option>
                              <option value="female">Femenino</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 block mb-1">Fecha de nacimiento</label>
                            <input type="date" value={setupPatientData.birthDate} onChange={(e) => setSetupPatientData(prev => ({ ...prev, birthDate: e.target.value }))}
                              className="w-full px-2 py-1.5 text-[12px] bg-white border border-gray-300 rounded-sm font-medium text-gray-700 tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400" />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 block mb-1">Altura</label>
                            <input type="number" min={100} max={220} value={setupPatientData.height}
                              onChange={(e) => setSetupPatientData(prev => ({ ...prev, height: parseInt(e.target.value) || 170 }))}
                              className="w-full px-2 py-1.5 text-[12px] bg-white border border-gray-300 rounded-sm font-medium text-gray-700 tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400" />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex gap-6 text-[12px] text-gray-700 tabular-nums">
                        <span><span className="text-gray-500">Sexo:</span> {setupPatientData.gender === 'male' ? 'Masculino' : 'Femenino'}</span>
                        <span><span className="text-gray-500">Edad:</span> {setupPatientData.birthDate ? `${moment().diff(moment(setupPatientData.birthDate, 'YYYY-MM-DD'), 'years')} años` : '—'}</span>
                        <span><span className="text-gray-500">Altura:</span> {setupPatientData.height} cm</span>
                      </div>
                    )}

                    <div style={{ borderTop: '1px solid #F0EDE8' }} className="pt-4"></div>

                    {/* Datos de la consulta */}
                    <div>
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 block mb-1">Peso actual</label>
                      <select name="weight" value={editableData.weight} onChange={handleEditableChange}
                        className="w-full px-2 py-1.5 text-[12px] bg-white border border-gray-300 rounded-sm font-medium text-gray-700 tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400">
                        {Array.from({ length: 80 }, (_, i) => i + 50).map(w => <option key={w} value={w}>{w} kg</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 block mb-1">Nivel de actividad</label>
                      <select name="activityLevel" value={editableData.activityLevel} onChange={handleEditableChange}
                        className="w-full px-2 py-1.5 text-[12px] bg-white border border-gray-300 rounded-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400">
                        {Object.entries(ACTIVITY_LEVELS).map(([val, { label }]) => <option key={val} value={val}>{label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 block mb-1">Objetivo</label>
                      <select value={getGoalSelectValue()} onChange={handleGoalChange}
                        className="w-full px-2 py-1.5 text-[12px] bg-white border border-gray-300 rounded-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400">
                        {GOAL_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Resumen energético */}
                <div className="grid grid-cols-3 gap-2 mb-6">
                  <div className="bg-white rounded-md p-3 text-center" style={{ border: '1px solid #E8E5DE' }}>
                    <p className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider">TMB</p>
                    <p className="text-sm font-bold text-gray-800 mt-0.5 tabular-nums">{theoreticalValues.bmr}</p>
                  </div>
                  <div className="bg-white rounded-md p-3 text-center" style={{ border: '1px solid #E8E5DE' }}>
                    <p className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider">TDEE</p>
                    <p className="text-sm font-bold text-gray-800 mt-0.5 tabular-nums">{theoreticalValues.tdee}</p>
                  </div>
                  <div className={`rounded-md p-3 text-center ${
                    theoreticalValues.dailyCalories > 0 && theoreticalValues.dailyCalories < theoreticalValues.bmr
                      ? 'bg-red-50 border border-red-200'
                      : 'bg-emerald-50 border border-emerald-200'
                  }`}>
                    <p className={`text-[9px] font-semibold uppercase tracking-wider ${
                      theoreticalValues.dailyCalories > 0 && theoreticalValues.dailyCalories < theoreticalValues.bmr
                        ? 'text-red-600' : 'text-emerald-700'
                    }`}>Objetivo</p>
                    <p className={`text-sm font-bold mt-0.5 tabular-nums ${
                      theoreticalValues.dailyCalories > 0 && theoreticalValues.dailyCalories < theoreticalValues.bmr
                        ? 'text-red-700' : 'text-emerald-800'
                    }`}>{theoreticalValues.dailyCalories}</p>
                    {theoreticalValues.dailyCalories > 0 && theoreticalValues.dailyCalories < theoreticalValues.bmr && (
                      <p className="text-[9px] text-red-500 mt-1">Debajo del TMB</p>
                    )}
                  </div>
                </div>
                {theoreticalValues.dailyDeficit !== 0 && (
                  <p className="text-[10px] text-gray-500 text-center mb-6 tabular-nums">
                    {theoreticalValues.dailyDeficit > 0
                      ? `Déficit diario: ~${theoreticalValues.dailyDeficit} kcal`
                      : `Superávit diario: ~${-theoreticalValues.dailyDeficit} kcal`}
                  </p>
                )}

                <div className="flex gap-3">
                  <Link href={`/detalle-paciente/${patientId}`}
                    className="flex-1 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors text-center"
                  >
                    Regresar
                  </Link>
                  <button
                    onClick={async () => {
                      if (patient) {
                        await patientService.updatePatient(patient.id, {
                          height: setupPatientData.height,
                          birthDate: setupPatientData.birthDate,
                          gender: setupPatientData.gender,
                        });
                        setPatient({ ...patient, height: setupPatientData.height, birthDate: setupPatientData.birthDate, gender: setupPatientData.gender });
                      }
                      setSetupStep(2);
                    }}
                    className="flex-[2] py-2 bg-emerald-600 text-white text-xs font-medium rounded hover:bg-emerald-700 transition-colors"
                  >
                    Continuar
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Macronutrientes */}
            {setupStep === 2 && (
              <div>
                <p className="text-base font-semibold text-gray-800 text-center mb-1">Distribución de macros</p>
                <p className="text-[11px] text-gray-400 text-center mb-8">Elige un preset o ajusta manualmente</p>

                <div className="flex justify-center gap-2 mb-6">
                  {MACRO_PRESETS.map((preset) => {
                    const isActive = customMacros.protein === preset.protein && customMacros.carbs === preset.carbs && customMacros.fat === preset.fat;
                    return (
                      <button key={preset.label} onClick={() => applyMacroPreset(preset)}
                        className={`flex-1 py-1.5 rounded-full text-[11px] font-medium transition-all whitespace-nowrap ${
                          isActive 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-white border border-gray-300 text-gray-600 hover:border-emerald-400 hover:text-emerald-700'
                        }`}>
                        {preset.label}
                      </button>
                    );
                  })}
                </div>

                <div className="bg-white rounded-md p-5 mb-6" style={{ border: '1px solid #E8E5DE' }}>
                  <div className="space-y-4">
                    {[
                      { name: 'protein' as const, label: 'Proteínas', color: 'bg-red-400', grams: theoreticalValues.protein },
                      { name: 'carbs' as const, label: 'Carbohidratos', color: 'bg-amber-400', grams: theoreticalValues.carbs },
                      { name: 'fat' as const, label: 'Grasas', color: 'bg-blue-400', grams: theoreticalValues.fat, auto: true },
                    ].map((macro) => (
                      <div key={macro.name}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-medium text-gray-700">{macro.label}</span>
                          <span className="text-[10px] text-gray-500 tabular-nums">{macro.grams}g{macro.auto ? ' · auto' : ''}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 rounded-full h-2 overflow-hidden" style={{ backgroundColor: '#F0EDE8' }}>
                            <div className={`${macro.color} h-2 rounded-full transition-all`} style={{ width: `${customMacros[macro.name]}%` }} />
                          </div>
                          <div className="flex items-center gap-1">
                            <input type="number" min={0} max={100}
                              value={customMacros[macro.name]}
                              onChange={(e) => handleMacroInput(macro.name, parseInt(e.target.value, 10) || 0)}
                              className="w-12 px-1 py-0.5 text-[11px] text-center bg-white border border-gray-300 rounded-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400"
                            />
                            <span className="text-[10px] text-gray-500">%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {(customMacros.protein + customMacros.carbs + customMacros.fat) !== 100 && (
                    <p className="text-[10px] text-red-500 mt-3 text-center">Total: {customMacros.protein + customMacros.carbs + customMacros.fat}% (debe ser 100%)</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setSetupStep(1)}
                    className="flex-1 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                  >
                    Atrás
                  </button>
                  <button
                    onClick={async () => {
                      setMacrosAreCustomized(true);
                      calculateTheoreticalValues();
                      setCurrentStep('plan');
                      // Guardar objetivos en Firebase para que al recargar se salte el setup
                      if (patientId && consultationId) {
                        try {
                          await consultationService.updateConsultation(patientId, consultationId, {
                            nutritionPlan: {
                              objectivesSet: true,
                              nutritionParams: nutritionParams,
                              meals: meals,
                              notes: notasContent,
                              indicaciones: indicacionesContent,
                              totalNutrition: totalNutrition,
                              lastUpdated: new Date().toISOString(),
                            }
                          });
                        } catch (err) {
                          console.error('Error guardando objetivos:', err);
                        }
                      }
                    }}
                    className="flex-[2] py-2 bg-emerald-600 text-white text-xs font-medium rounded hover:bg-emerald-700 transition-colors"
                  >
                    Armar plan →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* === PASO 2: Plan completo (sidebar + meals) === */}
      {currentStep === 'plan' && (
      <div className="flex flex-row">
        {/* Panel lateral sticky con pestañas */}
        <div className="w-1/4 h-[calc(100vh-2.25rem)] sticky top-[2.25rem] overflow-auto bg-white" style={{ borderRight: '1px solid #E8E5DE' }}>
          <div className="flex" style={{ borderBottom: '1px solid #E8E5DE' }}>
            <button
              onClick={() => setActiveTab('summary')}
              className={`flex-1 py-2 text-[11px] font-medium transition-colors ${
                activeTab === 'summary' 
                  ? 'text-emerald-700 border-b-2 border-emerald-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Resumen
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`flex-1 py-2 text-[11px] font-medium transition-colors ${
                activeTab === 'notes' 
                  ? 'text-emerald-700 border-b-2 border-emerald-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Notas
            </button>
            <button
              onClick={() => setActiveTab('indicaciones')}
              className={`flex-1 py-2 text-[11px] font-medium transition-colors ${
                activeTab === 'indicaciones' 
                  ? 'text-emerald-700 border-b-2 border-emerald-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Indicaciones
            </button>
          </div>
          
          {/* Contenido del panel según la pestaña activa */}
          <div>
            {activeTab === 'summary' ? (
              <div>
                {/* Datos del paciente */}
                <div className="px-5 py-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Datos del paciente</p>
                    {!isEditingData ? (
                      <button onClick={() => setIsEditingData(true)} className="text-[11px] text-emerald-700 hover:underline">Editar</button>
                    ) : (
                      <button onClick={() => { setMacrosAreCustomized(true); setIsEditingData(false); calculateTheoreticalValues(); }} className="text-[11px] text-emerald-700 hover:underline">Listo</button>
                    )}
                  </div>
                  <div className="text-[11px] space-y-1.5 tabular-nums">
                    <div>
                      <span className="text-gray-500">Nombre:</span>
                      <span className="ml-1 font-medium text-gray-700">{patient?.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Sexo:</span>
                      <span className="ml-1 font-medium text-gray-700">{patient?.gender === 'male' ? 'Masculino' : 'Femenino'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Altura:</span>
                      <span className="ml-1 font-medium text-gray-700">{patient?.height || 170} cm</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Edad:</span>
                      <span className="ml-1 font-medium text-gray-700">{patient?.birthDate ? moment().diff(moment(patient.birthDate, 'YYYY-MM-DD'), 'years') : 30} años</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-500">Peso:</span>
                      {isEditingData ? (
                        <>
                          <select name="weight" value={editableData.weight} onChange={handleEditableChange}
                            className="ml-1 p-0 text-[11px] bg-transparent font-medium text-gray-700 focus:outline-none w-auto" style={{ width: 'auto' }}>
                            {Array.from({ length: 80 }, (_, i) => i + 50).map(w => <option key={w} value={w}>{w}</option>)}
                          </select>
                          <span className="ml-0.5 text-gray-500">kg</span>
                        </>
                      ) : (
                        <span className="ml-1 font-medium text-gray-700">{editableData.weight} kg</span>
                      )}
                    </div>
                    <div>
                      <span className="text-gray-500">Actividad:</span>
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
                      <span className="text-gray-500">Objetivo:</span>
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

                <div style={{ borderTop: '1px solid #F0EDE8' }}></div>

                {/* Requerimientos Energéticos */}
                <div className="px-5 py-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2">Requerimientos energéticos</p>
                  <div className="space-y-1 text-[11px] tabular-nums">
                    <div><span className="text-gray-500">Metabolismo basal:</span><span className="ml-1 font-medium text-gray-700">{theoreticalValues.bmr} kcal</span></div>
                    <div><span className="text-gray-500">Gasto total:</span><span className="ml-1 font-medium text-gray-700">{theoreticalValues.tdee} kcal</span></div>
                    <div><span className="text-gray-500">Calorías objetivo:</span><span className="ml-1 font-medium text-gray-700">{theoreticalValues.dailyCalories} kcal/día</span></div>
                    {theoreticalValues.dailyDeficit !== 0 && (
                      <div className="text-[10px] text-red-500 mt-1">
                        {theoreticalValues.dailyDeficit > 0
                          ? <span>Déficit necesario: ~{theoreticalValues.dailyDeficit} kcal/día ({editableData.weightGoal} kg/mes)</span>
                          : <span>Superávit necesario: ~{-theoreticalValues.dailyDeficit} kcal/día ({editableData.weightGoal} kg/mes)</span>}
                      </div>
                    )}
                  </div>
                </div>

                {/* Distribución de macronutrientes */}
                <div style={{ borderTop: '1px solid #F0EDE8' }}></div>
                <div className="px-5 pb-3 pt-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2">Distribución de macronutrientes</p>
                  {isEditingData ? (
                    <div className="space-y-3">
                      {/* Presets */}
                      <div className="flex flex-wrap gap-1.5">
                        {MACRO_PRESETS.map((preset) => {
                          const isActive = customMacros.protein === preset.protein && customMacros.carbs === preset.carbs && customMacros.fat === preset.fat;
                          return (
                            <button key={preset.label} onClick={() => applyMacroPreset(preset)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${
                                isActive ? 'bg-emerald-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:border-emerald-400 hover:text-emerald-700'
                              }`}>
                              {preset.label}
                            </button>
                          );
                        })}
                      </div>
                      {/* Inputs */}
                      {[
                        { name: 'protein' as const, label: 'Proteínas', color: 'text-red-500', grams: theoreticalValues.protein },
                        { name: 'carbs' as const, label: 'Carbohidratos', color: 'text-amber-600', grams: theoreticalValues.carbs },
                        { name: 'fat' as const, label: 'Grasas', color: 'text-blue-500', grams: theoreticalValues.fat, auto: true },
                      ].map((macro) => (
                        <div key={macro.name} className="flex items-center gap-2">
                          <span className={`text-[10px] w-24 ${macro.color} font-medium`}>{macro.label}</span>
                          <div className="flex items-center gap-1">
                            <input type="number" min={0} max={100}
                              value={customMacros[macro.name]}
                              onChange={(e) => handleMacroInput(macro.name, parseInt(e.target.value, 10) || 0)}
                              className="w-14 px-1.5 py-0.5 text-[11px] text-center bg-white border border-gray-300 rounded-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400"
                            />
                            <span className="text-[10px] text-gray-500">%</span>
                          </div>
                          <span className="text-[10px] text-gray-500 ml-auto tabular-nums">{macro.grams}g</span>
                          {macro.auto && <span className="text-[9px] text-gray-400">(auto)</span>}
                        </div>
                      ))}
                      {(customMacros.protein + customMacros.carbs + customMacros.fat) !== 100 && (
                        <p className="text-[10px] text-red-500">Total: {customMacros.protein + customMacros.carbs + customMacros.fat}% (debe ser 100%)</p>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400"></span><div><p className="text-[10px] text-gray-500">Proteínas</p><p className="text-xs font-medium text-gray-800 tabular-nums">{customMacros.protein}%</p></div></div>
                      <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400"></span><div><p className="text-[10px] text-gray-500">Carbos</p><p className="text-xs font-medium text-gray-800 tabular-nums">{customMacros.carbs}%</p></div></div>
                      <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400"></span><div><p className="text-[10px] text-gray-500">Grasas</p><p className="text-xs font-medium text-gray-800 tabular-nums">{customMacros.fat}%</p></div></div>
                    </div>
                  )}
                </div>

                {/* Plan actual vs. Objetivo */}
                <div className="px-5 py-4" style={{ borderTop: '1px solid #F0EDE8' }}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2">Plan actual vs. objetivo</p>
                  <div className="space-y-2 text-[11px]">
                    {[
                      { label: 'Calorías', actual: Math.round(totalNutrition.calories), target: theoreticalValues.dailyCalories, color: 'bg-emerald-500', unit: '' },
                      { label: 'Proteínas', actual: Math.round(totalNutrition.protein), target: theoreticalValues.protein, color: 'bg-red-400', unit: 'g' },
                      { label: 'Carbohidratos', actual: Math.round(totalNutrition.carbs), target: theoreticalValues.carbs, color: 'bg-amber-400', unit: 'g' },
                      { label: 'Grasas', actual: Math.round(totalNutrition.fat), target: theoreticalValues.fat, color: 'bg-blue-400', unit: 'g' },
                    ].map((item) => {
                      const over = (item.actual || 0) > (item.target || 0) && (item.target || 0) > 0;
                      return (
                      <div key={item.label}>
                        <div className="flex justify-between mb-1">
                          <span className={over ? 'text-red-600 font-medium' : 'text-gray-700'}>{item.label}</span>
                          <div className="tabular-nums">
                            <span className={`font-medium ${over ? 'text-red-600' : 'text-gray-800'}`}>{item.actual || 0}{item.unit}</span>
                            <span className="mx-1 text-gray-400">/</span>
                            <span className="text-gray-500">{item.target}{item.unit}</span>
                            {over && <span className="ml-1 text-red-500">↑</span>}
                          </div>
                        </div>
                        <div className="w-full rounded-full h-1" style={{ backgroundColor: '#F0EDE8' }}>
                          <div className={`${over ? 'bg-red-400' : item.color} h-1 rounded-full`} style={{ width: `${Math.min(100, (item.actual || 0) / (item.target || 1) * 100)}%` }}></div>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : activeTab === 'notes' ? (
              /* Notas tab */
              <div className="p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-0.5">Notas</p>
                <p className="text-[10px] text-gray-400 mb-2">Notas durante la consulta. No saldrán en el plan final.</p>
                <textarea
                  value={notasContent}
                  onChange={(e) => setNotasContent(e.target.value)}
                  placeholder="Escribe tus notas aquí..."
                  className="w-full min-h-[calc(100vh-200px)] px-2 py-1.5 text-xs text-gray-700 bg-white border border-gray-300 rounded-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 placeholder:text-gray-400"
                />
              </div>
            ) : (
              /* Indicaciones tab */
              <div className="p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-0.5">Indicaciones para la dieta</p>
                <p className="text-[10px] text-gray-400 mb-2">Estas indicaciones saldrán en el plan del paciente.</p>
                <textarea
                  value={indicacionesContent}
                  onChange={(e) => setIndicacionesContent(e.target.value)}
                  placeholder="Ej: Tomar 2L de agua al día, evitar azúcares refinados, comer cada 3 horas..."
                  className="w-full min-h-[calc(100vh-200px)] px-2 py-1.5 text-xs text-gray-700 bg-white border border-gray-300 rounded-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 placeholder:text-gray-400"
                />
              </div>
            )}
          </div>
        </div>

        {/* Contenido principal del plan (a la derecha) */}
        <div className="w-3/4 p-4 flex flex-col gap-3" style={{ backgroundColor: '#FAF9F7' }}>
          <Meals 
            meals={meals}
            commonIngredients={COMMON_INGREDIENTS}
            onMealsChange={handleMealsChange}
          />
        </div>
      </div>
      )}
    </div>
  );
}