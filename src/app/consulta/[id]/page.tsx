'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { 
  CheckmarkFilled, 
  TrashCan, 
  Strawberry 
} from '@carbon/icons-react';
import PrintNutritionPlan from '@/app/consulta/components/printPDF';
import { ChevronLeft, ChevronDown, Star, FolderOpen, X, Search, ClipboardList, AlertTriangle } from 'lucide-react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import moment from 'moment';
import 'moment/locale/pt-br';
import 'moment/locale/es';
import Meals, { Meal } from '../components/meals';
import { getCommonIngredients } from '../components/ingredientsData';
import { patientService, consultationService, authService, planService, SavedPlan } from '@/app/shared/firebase';
import { TagEditor, computeTagOptions, tagsOf, TagUsage } from '@/app/shared/TagEditor';
import { useAuth } from '@/app/shared/AuthContext';
import { Patient, Consultation } from '@/app/shared/interfaces';
import { MealCategory } from '@/app/comidas/constants';
import { useTranslation } from '@/app/shared/useTranslation';

// Comidas por defecto
const DEFAULT_MEALS: { name: string; category: MealCategory; time: string }[] = [
  { name: 'Desayuno', category: 'desayuno', time: '07:00' },
  { name: 'Snack de la mañana', category: 'snack', time: '10:00' },
  { name: 'Almuerzo', category: 'almuerzo', time: '12:30' },
  { name: 'Snack de la tarde', category: 'snack', time: '16:00' },
  { name: 'Cena', category: 'cena', time: '19:30' },
];

// Constantes nutricionales
const ACTIVITY_LEVELS: Record<string, { factor: number }> = {
  'sedentary': { factor: 1.2 },
  'light': { factor: 1.375 },
  'moderate': { factor: 1.55 },
  'active': { factor: 1.725 },
  'very-active': { factor: 1.9 }
};

const ACTIVITY_KEY_MAP: Record<string, string> = {
  'sedentary': 'sedentary',
  'light': 'light',
  'moderate': 'moderate',
  'active': 'active',
  'very-active': 'veryActive',
};

const GOAL_OPTIONS = [
  { value: 'lose-4', goal: 'lose', weightGoal: 4 },
  { value: 'lose-3.5', goal: 'lose', weightGoal: 3.5 },
  { value: 'lose-3', goal: 'lose', weightGoal: 3 },
  { value: 'lose-2.5', goal: 'lose', weightGoal: 2.5 },
  { value: 'lose-2', goal: 'lose', weightGoal: 2 },
  { value: 'lose-1.5', goal: 'lose', weightGoal: 1.5 },
  { value: 'lose-1', goal: 'lose', weightGoal: 1 },
  { value: 'lose-0.5', goal: 'lose', weightGoal: 0.5 },
  { value: 'maintain', goal: 'maintain', weightGoal: 0 },
  { value: 'gain-0.5', goal: 'gain', weightGoal: 0.5 },
  { value: 'gain-1', goal: 'gain', weightGoal: 1 },
  { value: 'gain-1.5', goal: 'gain', weightGoal: 1.5 },
  { value: 'gain-2', goal: 'gain', weightGoal: 2 },
  { value: 'gain-2.5', goal: 'gain', weightGoal: 2.5 },
  { value: 'gain-3', goal: 'gain', weightGoal: 3 },
];

const GOAL_KEY_MAP: Record<string, string> = {
  'lose-4': 'lose4', 'lose-3': 'lose3', 'lose-2': 'lose2', 'lose-1': 'lose1',
  'maintain': 'maintain', 'gain-1': 'gain1', 'gain-2': 'gain2', 'gain-3': 'gain3',
};

const DEFAULT_MACROS = { protein: 30, carbs: 40, fat: 30 };

const MACRO_PRESETS = [
  { key: 'balanced', protein: 30, carbs: 40, fat: 30 },
  { key: 'highProtein', protein: 40, carbs: 35, fat: 25 },
  { key: 'lowCarb', protein: 35, carbs: 20, fat: 45 },
  { key: 'keto', protein: 25, carbs: 5, fat: 70 },
  { key: 'highCarb', protein: 20, carbs: 60, fat: 20 },
];

export default function CrearPlan() {
  const { t, lang } = useTranslation();
  // Helpers de etiquetas i18n
  const activityLabel = (k: string) => t(`consultation.activityLevels.${ACTIVITY_KEY_MAP[k] || k}`);
  const goalLabel = (v: string) => {
    if (v === 'maintain') return t('consultation.goalOptions.maintain');
    const opt = GOAL_OPTIONS.find(o => o.value === v);
    if (!opt) return v;
    const verb = opt.goal === 'lose' ? t('consultation.goalOptions.loseVerb') : t('consultation.goalOptions.gainVerb');
    return `${verb} ${opt.weightGoal} kg/${t('consultation.goalOptions.monthShort')}`;
  };
  const presetLabel = (k: string) => t(`consultation.macroPresets.${k}`);
  // Obtener IDs de paciente y consulta
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { userData } = useAuth();
  const consultationId = params?.id && typeof params.id === 'string' ? params.id : '';
  const patientId = searchParams?.get('patientId') || '';

  useEffect(() => { moment.locale(lang === 'pt' ? 'pt-br' : 'es'); }, [lang]);

  // Estados
  const [activeTab, setActiveTab] = useState('summary');
  const [notasContent, setNotasContent] = useState('');
  const [indicacionesContent, setIndicacionesContent] = useState('');
  // Medidas corporales tomadas en esta consulta (opcional)
  type MeasureKey = 'waist' | 'hip' | 'neck' | 'tricipital' | 'subescapular' | 'suprailiaco' | 'arm' | 'calf' | 'wrist';
  const [measurements, setMeasurements] = useState<{
    waist: number; hip: number; neck: number;
    tricipital: number; subescapular: number; suprailiaco: number;
    arm: number; calf: number; wrist: number;
    focused: MeasureKey | null;
  }>({ waist: 0, hip: 0, neck: 0, tricipital: 0, subescapular: 0, suprailiaco: 0, arm: 0, calf: 0, wrist: 0, focused: null });
  const [patient, setPatient] = useState<Patient | null>(null);
  // Idioma de los nombres de alimentos = idioma del paciente (cae al de la app si no tiene).
  const commonIngredientsList = useMemo(() => getCommonIngredients(patient?.language || lang), [patient?.language, lang]);
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [dirty, setDirty] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [finalizingConsultation, setFinalizingConsultation] = useState(false);
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);
  const [currentStep, setCurrentStep] = useState<'setup' | 'plan'>('setup');
  const [setupStep, setSetupStep] = useState(1);
  const [editingPatientBase, setEditingPatientBase] = useState(false);
  const [setupErrors, setSetupErrors] = useState<{ birthDate?: boolean; height?: boolean; weight?: boolean; activityLevel?: boolean; goal?: boolean; gender?: boolean; targetWeight?: boolean }>({});
  const [setupPatientData, setSetupPatientData] = useState<{
    height: number;
    birthDate: string;
    gender: '' | 'male' | 'female' | 'other';
    targetWeight: number;
  }>({
    height: 0,
    birthDate: '',
    gender: '',
    targetWeight: 0,
  });
  const isFirstConsultation = !patient?.height || !patient?.birthDate;

  // Estado de las comidas y nutrición total
  const [meals, setMeals] = useState<Meal[]>([]);
  
  const [totalNutrition, setTotalNutrition] = useState({
    calories: 0, protein: 0, carbs: 0, fat: 0
  });

  // Estados del resumen nutricional (inline)
  const [editableData, setEditableData] = useState({
    weight: 0, activityLevel: '', goal: '', weightGoal: 0
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
        setError(t('consultation.errors.noIds'));
        setLoading(false);
        return;
      }

      try {
        // CAMBIO IMPORTANTE: Esperar a que la autenticación esté lista
        const user = await authService.getAuthStatePromise();
        
        if (!user) {
          console.error("Usuario no autenticado");
          setError(t('consultation.errors.mustLogin'));
          setLoading(false);
          return;
        }

        // Cargar datos del paciente con mejor manejo de errores
        try {
          const patientData = await patientService.getPatientById(patientId);
          if (!patientData) {
            setError(t('consultation.errors.patientNotFound'));
            setLoading(false);
            return;
          }
          setPatient(patientData);
          setSetupPatientData({
            height: patientData.height || 0,
            birthDate: patientData.birthDate || '',
            gender: patientData.gender || '',
            targetWeight: patientData.targetWeight || 0,
          });
          if (!patientData.height || !patientData.birthDate || !patientData.gender || !patientData.targetWeight) {
            setEditingPatientBase(true);
          }
        } catch (patientError) {
          console.error("Error al cargar datos del paciente:", patientError);
          setError(t('consultation.errors.loadPatient'));
          setLoading(false);
          return;
        }

        // Cargar datos de la consulta con mejor manejo de errores
        try {
          const consultationData = await consultationService.getConsultationById(patientId, consultationId);
          if (!consultationData) {
            setError(t('consultation.errors.consultNotFound'));
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
            if ((consultationData.nutritionPlan as any).measurements) {
              const m = (consultationData.nutritionPlan as any).measurements;
              setMeasurements({
                waist: m.waist ?? 0, hip: m.hip ?? 0, neck: m.neck ?? 0,
                tricipital: m.tricipital ?? 0, subescapular: m.subescapular ?? 0, suprailiaco: m.suprailiaco ?? 0,
                arm: m.arm ?? 0, calf: m.calf ?? 0, wrist: m.wrist ?? 0,
                focused: null,
              });
            }
            if (consultationData.nutritionPlan.nutritionParams) {
              console.log("Cargando parámetros guardados:", consultationData.nutritionPlan.nutritionParams);
              setNutritionParams(consultationData.nutritionPlan.nutritionParams);
            }
          } else {
            // Si hay borrador parcial (paso 1 completado), restaurar valores y saltar a paso 3 (macros)
            if (consultationData.nutritionPlan?.nutritionParams) {
              const np = consultationData.nutritionPlan.nutritionParams;
              setNutritionParams(np);
              if (np.weight && np.activityLevel && np.goal) {
                setEditableData({
                  weight: np.weight,
                  activityLevel: np.activityLevel,
                  goal: np.goal,
                  weightGoal: np.weightGoal || 0,
                });
                setSetupStep(3);
              }
              if (np.macroDistribution) {
                setCustomMacros(np.macroDistribution);
                setMacrosAreCustomized(true);
              }
            }
            // Crear comidas por defecto para consulta nueva — todas activas y con una opción inicial
            const defaultMeals: Meal[] = DEFAULT_MEALS.map(m => ({
              name: m.name,
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
          setError(t('consultation.errors.loadConsult'));
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error("Error general al cargar datos:", err);
        setError(`${t('consultation.errors.generalLoad')}. ${t('consultation.errors.sessionExpired')}`);
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
              const q = Number(ingredient.quantity || 0);
              totals.calories += (Number(ingredient.calories || 0) * q) / 100;
              totals.protein  += (Number(ingredient.protein  || 0) * q) / 100;
              totals.carbs    += (Number(ingredient.carbs    || 0) * q) / 100;
              totals.fat      += (Number(ingredient.fat      || 0) * q) / 100;
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
      // Solo prellenar cuando el plan ya fue confirmado (objectivesSet=true → currentStep='plan')
      const hasSavedParams = currentStep === 'plan' && !!nutritionParams.activityLevel && !!nutritionParams.goal && !!nutritionParams.weight;
      if (hasSavedParams) {
        setEditableData(prev => ({
          ...prev,
          weight: nutritionParams.weight,
          activityLevel: nutritionParams.activityLevel,
          goal: nutritionParams.goal,
          weightGoal: nutritionParams.weightGoal || 0
        }));
      }
      if (nutritionParams.macroDistribution) {
        setCustomMacros(nutritionParams.macroDistribution);
        setMacrosAreCustomized(true);
      }
    }
  }, [patient, nutritionParams, currentStep]);

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
      
      // Firestore no acepta `undefined` (p.ej. unit/prepKey en ingredientes):
      // limpiamos en profundidad con un round-trip JSON.
      const nutritionPlan = JSON.parse(JSON.stringify({
        objectivesSet: true,
        meals: meals,
        notes: notasContent,
        indicaciones: indicacionesContent,
        measurements: {
          waist: measurements.waist, hip: measurements.hip, neck: measurements.neck,
          tricipital: measurements.tricipital, subescapular: measurements.subescapular, suprailiaco: measurements.suprailiaco,
          arm: measurements.arm, calf: measurements.calf, wrist: measurements.wrist,
        },
        totalNutrition: totalNutrition,
        nutritionParams: nutritionParams,
        lastUpdated: new Date().toISOString()
      }));

      await consultationService.updateConsultation(
        patientId, 
        consultationId, 
        { nutritionPlan }
      );
      
      setDirty(false);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error("Error al guardar el plan:", err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2500);
    }
  };

  // ── Planes reutilizables (guardar / cargar plantilla completa) ──
  const [showSavePlan, setShowSavePlan] = useState(false);
  const [planName, setPlanName] = useState('');
  const [planTags, setPlanTags] = useState<string[]>([]);
  const [savingPlan, setSavingPlan] = useState(false);
  const [planSaved, setPlanSaved] = useState(false);
  const [tagSuggestions, setTagSuggestions] = useState<TagUsage[]>([]);
  const [tagLibrary, setTagLibrary] = useState<string[]>([]);

  const [showLoadPlan, setShowLoadPlan] = useState(false);
  const [loadablePlans, setLoadablePlans] = useState<SavedPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [planSearch, setPlanSearch] = useState('');
  const [loadPlanIndicaciones, setLoadPlanIndicaciones] = useState(true);
  const [pendingPlan, setPendingPlan] = useState<SavedPlan | null>(null);

  const planHasContent = useMemo(
    () => meals.some(m => Array.isArray((m as Meal).options) && (m as Meal).options.length > 0),
    [meals]
  );

  const handleCreateTag = async (tag: string) => {
    setTagLibrary(lib => (lib.includes(tag) ? lib : [...lib, tag]));
    setTagSuggestions(opts => (opts.some(o => o.tag === tag) ? opts : [...opts, { tag, count: 0 }]));
    try { await planService.saveTagLibrary([...new Set([...tagLibrary, tag])]); } catch { /* se reintenta luego */ }
  };

  const openSavePlan = async () => {
    setPlanName(patient?.name ? t('plans.planOfName').replace('{name}', patient.name) : t('plans.newPlanName'));
    setPlanTags([]);
    setPlanSaved(false);
    setShowSavePlan(true);
    try {
      const [all, lib] = await Promise.all([planService.getPlans(), planService.getTagLibrary()]);
      setTagLibrary(lib);
      setTagSuggestions(computeTagOptions(lib, all));
    } catch { /* sin etiquetas previas */ }
  };

  const doSavePlan = async () => {
    const name = planName.trim();
    if (!name) return;
    setSavingPlan(true);
    try {
      await planService.createPlan({
        name,
        tags: planTags.length ? planTags : undefined,
        meals: meals as unknown[],
        indicaciones: indicacionesContent.trim() || undefined,
        totalNutrition: totalNutrition,
        targetCalories: theoreticalValues?.dailyCalories,
        mealsCount: meals.length,
      });
      setPlanSaved(true);
      setTimeout(() => { setShowSavePlan(false); setPlanSaved(false); }, 1100);
    } catch (err) {
      console.error('Error al guardar el plan:', err);
    } finally {
      setSavingPlan(false);
    }
  };

  const openLoadPlan = async () => {
    setPlanSearch('');
    setLoadPlanIndicaciones(true);
    setShowLoadPlan(true);
    setLoadingPlans(true);
    try {
      setLoadablePlans(await planService.getPlans());
    } catch (err) {
      console.error('Error al cargar planes:', err);
    } finally {
      setLoadingPlans(false);
    }
  };

  const requestLoadPlan = (plan: SavedPlan) => {
    if (planHasContent) {
      setPendingPlan(plan);
    } else {
      applyPlan(plan);
    }
  };

  const applyPlan = (plan: SavedPlan) => {
    const planMeals = JSON.parse(JSON.stringify(plan.meals || [])) as Meal[];
    setMeals(planMeals);
    if (loadPlanIndicaciones && typeof plan.indicaciones === 'string' && plan.indicaciones.trim()) {
      setIndicacionesContent(plan.indicaciones);
    }
    if (typeof plan.id === 'string') {
      planService.updatePlan(plan.id, { usageCount: (plan.usageCount || 0) + 1, lastUsedDate: new Date().toISOString() } as Partial<SavedPlan>).catch(() => {});
    }
    setPendingPlan(null);
    setShowLoadPlan(false);
  };

  // ── Autoguardado con debounce ──
  // Mucha gente olvida guardar; guardamos solos 2 s después del último cambio.
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (loading) return;
    if (!hydratedRef.current) { hydratedRef.current = true; return; } // saltar primer render tras cargar
    if (!patientId || !consultationId) return;
    setDirty(true);
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => { savePlan(); }, 2000);
    return () => { if (autosaveTimer.current) clearTimeout(autosaveTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meals, notasContent, indicacionesContent, measurements, nutritionParams]);

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

  // Marcar como completada SIN salir de la página (se sigue pudiendo editar / reabrir).
  const markCompleted = async () => {
    if (!patientId || !consultationId) return;
    try {
      setFinalizingConsultation(true);
      await savePlan();
      await consultationService.completeConsultation(patientId, consultationId, editableData.weight);
      setConsultation(c => (c ? { ...c, status: 'completed' } : c));
    } catch (err) {
      console.error('Error al marcar como completada:', err);
    } finally {
      setFinalizingConsultation(false);
    }
  };

  // Reabrir una consulta completada (volver a "en progreso")
  const reopenConsultation = async () => {
    if (!patientId || !consultationId) return;
    try {
      await consultationService.reopenConsultation(patientId, consultationId);
      setConsultation(c => (c ? { ...c, status: 'scheduled' } : c));
    } catch (err) {
      console.error('Error al reabrir consulta:', err);
    }
  };

  // Guardar y salir sin finalizar (terminar luego)
  const [finishingLater, setFinishingLater] = useState(false);
  const finishLater = async () => {
    if (!patientId || !consultationId) return;
    setFinishingLater(true);
    try {
      await savePlan();
      router.push(`/detalle-paciente/${patientId}`);
    } catch (err) {
      console.error('Error al guardar para continuar luego:', err);
      setFinishingLater(false);
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
            {t('consultation.breadcrumb.back')}
          </Link>
          <div className="flex items-center gap-2 px-4 py-1.5">
            <span className="text-xs font-semibold text-gray-800">{patient?.name}</span>
            <span className="text-gray-300">›</span>
            <span className="text-xs text-gray-500">{currentStep === 'setup' ? t('consultation.breadcrumb.goals') : t('consultation.breadcrumb.consult')}</span>
            {consultation?.date && (
              <span className="text-[10px] text-gray-400 ml-1 tabular-nums">
                {moment(consultation.date).format('DD MMM YYYY')}
              </span>
            )}
          </div>
        </div>
        {currentStep === 'plan' && (
        <div className="flex items-center gap-2 px-4">
          {/* Guardar / cargar plan completo (reutilizable) — UI por ahora */}
          <button
            onClick={openSavePlan}
            title={t('plans.savePlanBtnTitle')}
            className="group flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
          >
            <Star size={13} className="transition-colors group-hover:text-yellow-400 group-hover:fill-yellow-400" />
            {t('plans.savePlanBtn')}
          </button>
          <button
            onClick={openLoadPlan}
            title={t('plans.loadPlanBtnTitle')}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
          >
            <FolderOpen size={13} />
            {t('plans.loadPlanBtn')}
          </button>
          <span className="w-px h-4 bg-gray-200" />
          <PrintNutritionPlan
            patient={patient}
            consultation={consultation}
            meals={meals}
            totalNutrition={totalNutrition}
            notes={notasContent}
            indicaciones={indicacionesContent}
            targetCalories={theoreticalValues.dailyCalories}
            nutritionistName={userData?.displayName || 'Nutricionista'}
            nutritionistId={userData?.professionalId || ''}
            nutritionistAvatarUrl={userData?.avatarUrl}
            nutritionistLogoUrl={userData?.logoUrl}
            nutritionistSignatureUrl={userData?.signatureUrl}
            nutritionistTextSignature={userData?.textSignature}
            nutritionistUseRealSignature={userData?.useRealSignature}
            nutritionistSignatureFont={userData?.signatureFont}
            nutritionistSpecialization={userData?.specialization}
            nutritionistPhone={userData?.phone}
            nutritionistEmail={userData?.email}
            nutritionistWebsite={userData?.website}
            nutritionistAddress={userData?.officeAddress}
            nutritionistCredentials={userData?.credentials}
          />
          {/* Indicador de autoguardado (sin botón: se guarda solo) */}
          <div className="px-2 py-1 text-[11px] font-medium flex items-center gap-1.5 select-none">
            {saveStatus === 'saving' ? (
              <>
                <span className="inline-block w-3 h-3 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
                <span className="text-gray-500">{t('consultation.saveStatus.saving')}</span>
              </>
            ) : saveStatus === 'error' ? (
              <span className="text-red-600">{t('consultation.saveStatus.error')}</span>
            ) : dirty ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span className="text-red-600">Cambios sin guardar</span>
              </>
            ) : (
              <>
                <CheckmarkFilled size={14} className="text-emerald-600" />
                <span className="text-gray-500">Cambios guardados</span>
              </>
            )}
          </div>
          {consultation?.status !== 'completed' && (
            <button
              onClick={finishLater}
              disabled={finishingLater || finalizingConsultation || saveStatus === 'saving'}
              className="px-2.5 py-1 rounded text-[11px] font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              title={t('consultation.finishLater')}
            >
              {finishingLater ? t('consultation.finishingLater') : t('consultation.finishLater')}
            </button>
          )}

          {/* Estado de la dieta — select redondeado (en progreso ⇄ completada) */}
          {(() => {
            const isCompleted = consultation?.status === 'completed';
            return (
              <div className="relative">
                <button
                  onClick={() => setStatusMenuOpen(o => !o)}
                  disabled={finalizingConsultation || finishingLater}
                  className="inline-flex items-center gap-1.5 pl-2.5 pr-2 py-1 rounded-full text-[11px] font-medium border transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  style={isCompleted
                    ? { borderColor: '#6EE7B7', backgroundColor: '#ECFDF5', color: '#047857' }
                    : { borderColor: '#E8D9A8', backgroundColor: '#FBF7E8', color: '#9A7B1F' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isCompleted ? '#059669' : '#D9A21B' }} />
                  {isCompleted ? 'Completada' : 'En progreso'}
                  <ChevronDown className="w-3 h-3 opacity-70" />
                </button>
                {statusMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setStatusMenuOpen(false)} />
                    <div className="absolute right-0 mt-1.5 z-50 w-56 rounded-lg bg-white py-1 shadow-lg" style={{ border: '1px solid #E8E5DE' }}>
                      <div className="px-3 py-1 text-[9px] font-semibold uppercase tracking-wider" style={{ color: '#A8A29E' }}>Estado de la dieta</div>
                      <button
                        type="button"
                        onClick={() => { setStatusMenuOpen(false); if (isCompleted) reopenConsultation(); }}
                        className="w-full text-left px-3 py-1.5 text-xs flex items-center justify-between gap-2 text-gray-700 hover:bg-[#FAF9F7]"
                      >
                        <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#D9A21B' }} />En progreso</span>
                        {!isCompleted && <CheckmarkFilled size={12} className="text-emerald-600" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setStatusMenuOpen(false); if (!isCompleted) markCompleted(); }}
                        className="w-full text-left px-3 py-1.5 text-xs flex items-center justify-between gap-2 text-gray-700 hover:bg-[#FAF9F7]"
                      >
                        <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#059669' }} />Completada</span>
                        {isCompleted && <CheckmarkFilled size={12} className="text-emerald-600" />}
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })()}
        </div>
        )}
      </div>

      {/* === SETUP WIZARD === */}
      {currentStep === 'setup' && (
        <div className="bg-cream-pattern flex items-start justify-center min-h-[calc(100vh-2.25rem)]">
          <div className="w-full max-w-lg pt-10 pb-16 px-6">

            {/* Stepper */}
            <div className="flex items-center justify-center gap-3 mb-10">
              {[1, 2, 3].map((step) => (
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
                  {step < 3 && (
                    <div className={`w-12 h-0.5 rounded-full transition-colors ${setupStep > step ? 'bg-emerald-400' : ''}`} style={setupStep > step ? undefined : { backgroundColor: '#E8E5DE' }} />
                  )}
                </div>
              ))}
            </div>

            {/* Step 1: Datos del paciente */}
            {setupStep === 1 && (
              <div>
                <p className="text-base font-semibold text-gray-800 text-center mb-1">{patient?.name?.split(' ')[0]}</p>
                <p className="text-[11px] text-gray-400 text-center mb-8">{t('consultation.setup.step1Hint') !== 'consultation.setup.step1Hint' ? t('consultation.setup.step1Hint') : 'Datos básicos del paciente'}</p>

                <div className="bg-white rounded-md p-5 mb-5" style={{ border: '1px solid #E8E5DE' }}>
                  {(() => {
                    const showEdit = editingPatientBase;
                    return (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{t('consultation.setup.patientData')}</p>
                          {!showEdit && (
                            <button onClick={() => setEditingPatientBase(true)} className="text-[11px] text-emerald-700 hover:underline">{t('consultation.setup.edit')}</button>
                          )}
                        </div>
                        {showEdit ? (
                          <>
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 block mb-1">{t('consultation.setup.gender')}</label>
                                <select value={setupPatientData.gender} onChange={(e) => { setSetupPatientData(prev => ({ ...prev, gender: e.target.value as '' | 'male' | 'female' | 'other' })); if (e.target.value) setSetupErrors(p => ({ ...p, gender: false })); }}
                                  className={`w-full px-2 py-1.5 text-[12px] bg-white border rounded-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 ${setupErrors.gender ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-300'} ${setupPatientData.gender ? 'text-gray-700' : 'text-gray-400'}`}>
                                  <option value="" disabled>Selecciona…</option>
                                  <option value="male">{t('consultation.setup.male')}</option>
                                  <option value="female">{t('consultation.setup.female')}</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 block mb-1">{t('consultation.setup.birthDate')}</label>
                                <input type="date" value={setupPatientData.birthDate} onChange={(e) => { setSetupPatientData(prev => ({ ...prev, birthDate: e.target.value })); if (e.target.value) setSetupErrors(p => ({ ...p, birthDate: false })); }}
                                  className={`w-full px-2 py-1.5 text-[12px] bg-white border rounded-sm font-medium text-gray-700 tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 ${setupErrors.birthDate ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-300'}`} />
                              </div>
                              <div>
                                <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 block mb-1">{t('consultation.setup.height')}</label>
                                <input type="number" min={100} max={220} placeholder="170" value={setupPatientData.height || ''}
                                  onChange={(e) => { const v = parseInt(e.target.value) || 0; setSetupPatientData(prev => ({ ...prev, height: v })); if (v >= 100) setSetupErrors(p => ({ ...p, height: false })); }}
                                  className={`w-full px-2 py-1.5 text-[12px] bg-white border rounded-sm font-medium tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 ${setupErrors.height ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-300'} ${setupPatientData.height ? 'text-gray-700' : 'text-gray-400 placeholder-gray-400'}`} />
                              </div>
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 block mb-1">{t('consultation.setup.targetWeight')}</label>
                              <input type="number" min={5} max={300} step={0.1} placeholder="—" value={setupPatientData.targetWeight || ''}
                                onChange={(e) => { const v = parseFloat(e.target.value) || 0; setSetupPatientData(prev => ({ ...prev, targetWeight: v })); if (v >= 5) setSetupErrors(p => ({ ...p, targetWeight: false })); }}
                                className={`w-full px-2 py-1.5 text-[12px] bg-white border rounded-sm font-medium tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 ${setupErrors.targetWeight ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-300'} ${setupPatientData.targetWeight ? 'text-gray-700' : 'text-gray-400 placeholder-gray-400'}`} />
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-wrap gap-x-6 gap-y-1 text-[12px] text-gray-700 tabular-nums">
                            <span><span className="text-gray-500">{t('consultation.setup.gender')}:</span> {setupPatientData.gender === 'male' ? t('consultation.setup.male') : t('consultation.setup.female')}</span>
                            <span><span className="text-gray-500">{t('consultation.setup.age')}:</span> {moment().diff(moment(setupPatientData.birthDate, 'YYYY-MM-DD'), 'years')} {t('consultation.setup.years')}</span>
                            <span><span className="text-gray-500">{t('consultation.setup.height')}:</span> {setupPatientData.height} cm</span>
                            <span><span className="text-gray-500">{t('consultation.setup.targetWeight')}:</span> {setupPatientData.targetWeight} kg</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {(setupErrors.birthDate || setupErrors.height || setupErrors.gender || setupErrors.targetWeight) && (
                  <div className="mb-4 px-3 py-2 rounded-sm text-[11px] text-red-700 flex items-center gap-2" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}>
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" /></svg>
                    Completa los campos resaltados para continuar.
                  </div>
                )}

                <div className="flex gap-3">
                  <Link href={`/detalle-paciente/${patientId}`}
                    className="flex-1 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors text-center"
                  >
                    {t('consultation.breadcrumb.back')}
                  </Link>
                  <button
                    onClick={async () => {
                      const errs: typeof setupErrors = {};
                      const ageMonths = setupPatientData.birthDate
                        ? moment().diff(moment(setupPatientData.birthDate, 'YYYY-MM-DD'), 'months')
                        : -1;
                      if (!setupPatientData.gender) errs.gender = true;
                      if (!setupPatientData.birthDate || ageMonths < 1 || ageMonths > 1440) errs.birthDate = true;
                      if (!setupPatientData.height || setupPatientData.height < 100) errs.height = true;
                      if (!setupPatientData.targetWeight || setupPatientData.targetWeight < 5) errs.targetWeight = true;
                      if (Object.keys(errs).length > 0) {
                        setSetupErrors(errs);
                        setEditingPatientBase(true);
                        return;
                      }
                      setSetupErrors({});
                      if (patient) {
                        try {
                          await patientService.updatePatient(patient.id, {
                            height: setupPatientData.height,
                            birthDate: setupPatientData.birthDate,
                            gender: setupPatientData.gender as 'male' | 'female' | 'other',
                            targetWeight: setupPatientData.targetWeight,
                          });
                          setPatient({ ...patient, height: setupPatientData.height, birthDate: setupPatientData.birthDate, gender: setupPatientData.gender as 'male' | 'female' | 'other', targetWeight: setupPatientData.targetWeight });
                        } catch (err) {
                          console.error('Error guardando datos del paciente:', err);
                        }
                      }
                      setEditingPatientBase(false);
                      setSetupStep(2);
                    }}
                    className="flex-[2] py-2 bg-emerald-600 text-white text-xs font-medium rounded hover:bg-emerald-700 transition-colors"
                  >
                    {t('consultation.setup.continue')}
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Estado actual */}
            {setupStep === 2 && (
              <div>
                <p className="text-base font-semibold text-gray-800 text-center mb-1">{t('consultation.setup.step2Title') !== 'consultation.setup.step2Title' ? t('consultation.setup.step2Title') : 'Estado actual'}</p>
                <p className="text-[11px] text-gray-400 text-center mb-8">{t('consultation.setup.step2Hint') !== 'consultation.setup.step2Hint' ? t('consultation.setup.step2Hint') : 'Peso actual, actividad y objetivo de esta consulta'}</p>

                <div className="bg-white rounded-md p-5 mb-5" style={{ border: '1px solid #E8E5DE' }}>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 block mb-1">{t('consultation.setup.currentWeight')}</label>
                      <select name="weight" value={editableData.weight || ''} onChange={(e) => { handleEditableChange(e); if (e.target.value) setSetupErrors(p => ({ ...p, weight: false })); }}
                        className={`w-full px-2 py-1.5 text-[12px] bg-white border rounded-sm font-medium tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 ${setupErrors.weight ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-300'} ${editableData.weight ? 'text-gray-700' : 'text-gray-400'}`}>
                        <option value="" disabled>Selecciona…</option>
                        {Array.from({ length: 80 }, (_, i) => i + 50).map(w => <option key={w} value={w}>{w} kg</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 block mb-1">{t('consultation.setup.activityLevel')}</label>
                      <select name="activityLevel" value={editableData.activityLevel} onChange={(e) => { handleEditableChange(e); if (e.target.value) setSetupErrors(p => ({ ...p, activityLevel: false })); }}
                        className={`w-full px-2 py-1.5 text-[12px] bg-white border rounded-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 ${setupErrors.activityLevel ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-300'} ${editableData.activityLevel ? 'text-gray-700' : 'text-gray-400'}`}>
                        <option value="" disabled>Selecciona…</option>
                        {Object.keys(ACTIVITY_LEVELS).map(val => <option key={val} value={val}>{activityLabel(val)}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 block mb-1">{t('consultation.setup.goal')}</label>
                      <select value={editableData.goal ? getGoalSelectValue() : ''} onChange={(e) => { handleGoalChange(e); if (e.target.value) setSetupErrors(p => ({ ...p, goal: false })); }}
                        className={`w-full px-2 py-1.5 text-[12px] bg-white border rounded-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 ${setupErrors.goal ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-300'} ${editableData.goal ? 'text-gray-700' : 'text-gray-400'}`}>
                        <option value="" disabled>Selecciona…</option>
                        {GOAL_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{goalLabel(opt.value)}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Resumen energético (solo cuando hay datos completos) */}
                {(editableData.weight && editableData.activityLevel && editableData.goal) ? (
                <>
                <div className="grid grid-cols-3 gap-2 mb-6">
                  <div className="bg-white rounded-md p-3 text-center relative group" style={{ border: '1px solid #E8E5DE' }}>
                    <div className="flex items-center justify-center gap-1">
                      <p className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider">{t('consultation.setup.bmr')}</p>
                      <span className="inline-flex items-center justify-center w-3 h-3 rounded-full bg-gray-200 text-gray-500 text-[8px] font-bold cursor-help">i</span>
                    </div>
                    <p className="text-sm font-bold text-gray-800 mt-0.5 tabular-nums">{theoreticalValues.bmr}</p>
                    <div className="invisible group-hover:visible absolute left-1/2 -translate-x-1/2 bottom-full mb-1 z-20 w-44 px-2 py-1.5 text-[10px] leading-snug text-white bg-gray-800 rounded shadow-lg pointer-events-none">
                      <span className="font-semibold">Tasa Metabólica Basal:</span> calorías que el cuerpo quema en reposo absoluto para mantener funciones vitales (respirar, latir, etc.).
                    </div>
                  </div>
                  <div className="bg-white rounded-md p-3 text-center relative group" style={{ border: '1px solid #E8E5DE' }}>
                    <div className="flex items-center justify-center gap-1">
                      <p className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider">{t('consultation.setup.tdee')}</p>
                      <span className="inline-flex items-center justify-center w-3 h-3 rounded-full bg-gray-200 text-gray-500 text-[8px] font-bold cursor-help">i</span>
                    </div>
                    <p className="text-sm font-bold text-gray-800 mt-0.5 tabular-nums">{theoreticalValues.tdee}</p>
                    <div className="invisible group-hover:visible absolute left-1/2 -translate-x-1/2 bottom-full mb-1 z-20 w-44 px-2 py-1.5 text-[10px] leading-snug text-white bg-gray-800 rounded shadow-lg pointer-events-none">
                      <span className="font-semibold">Gasto Energético Total Diario:</span> TMB multiplicado por el factor de actividad. Calorías para mantener el peso actual.
                    </div>
                  </div>
                  {(() => {
                    const cal = theoreticalValues.dailyCalories;
                    const bmr = theoreticalValues.bmr;
                    const severity: 'severe' | 'warning' | 'ok' =
                      cal > 0 && cal < bmr * 0.85 ? 'severe'
                      : cal > 0 && cal < bmr ? 'warning'
                      : 'ok';
                    const styles = {
                      severe: { card: 'bg-red-50 border border-red-200', label: 'text-red-600', value: 'text-red-700', badge: 'bg-red-200 text-red-700', note: 'text-red-500', msgKey: 'consultation.setup.belowBmrSevere' },
                      warning: { card: 'bg-amber-50 border border-amber-200', label: 'text-amber-700', value: 'text-amber-800', badge: 'bg-amber-200 text-amber-800', note: 'text-amber-600', msgKey: 'consultation.setup.belowBmrWarning' },
                      ok: { card: 'bg-emerald-50 border border-emerald-200', label: 'text-emerald-700', value: 'text-emerald-800', badge: 'bg-emerald-200 text-emerald-700', note: '', msgKey: '' },
                    }[severity];
                    return (
                      <div className={`rounded-md p-3 text-center relative group ${styles.card}`}>
                        <div className="flex items-center justify-center gap-1">
                          <p className={`text-[9px] font-semibold uppercase tracking-wider ${styles.label}`}>{t('consultation.setup.target')}</p>
                          <span className={`inline-flex items-center justify-center w-3 h-3 rounded-full text-[8px] font-bold cursor-help ${styles.badge}`}>i</span>
                        </div>
                        <p className={`text-sm font-bold mt-0.5 tabular-nums ${styles.value}`}>{cal}</p>
                        {severity !== 'ok' && (
                          <p className={`text-[9px] mt-1 leading-tight ${styles.note}`}>{t(styles.msgKey)}</p>
                        )}
                        <div className="invisible group-hover:visible absolute left-1/2 -translate-x-1/2 bottom-full mb-1 z-20 w-44 px-2 py-1.5 text-[10px] leading-snug text-white bg-gray-800 rounded shadow-lg pointer-events-none">
                          <span className="font-semibold">Objetivo calórico:</span> calorías diarias recomendadas según el objetivo (déficit para perder, superávit para ganar, mantenimiento).
                        </div>
                      </div>
                    );
                  })()}
                </div>
                {theoreticalValues.dailyDeficit !== 0 && (
                  <p className="text-[10px] text-gray-500 text-center mb-6 tabular-nums">
                    {theoreticalValues.dailyDeficit > 0
                      ? `${t('consultation.setup.deficitLabel')}: ~${theoreticalValues.dailyDeficit} ${t('consultation.setup.kcalDay')}`
                      : `${t('consultation.setup.surplusLabel')}: ~${-theoreticalValues.dailyDeficit} ${t('consultation.setup.kcalDay')}`}
                  </p>
                )}
                </>
                ) : (
                  <div className="mb-6 px-3 py-4 rounded-md text-center text-[11px] text-gray-400" style={{ backgroundColor: '#FAF9F7', border: '1px dashed #E8E5DE' }}>
                    Completa peso, nivel de actividad y objetivo para ver el cálculo energético.
                  </div>
                )}

                {(setupErrors.weight || setupErrors.activityLevel || setupErrors.goal) && (
                  <div className="mb-4 px-3 py-2 rounded-sm text-[11px] text-red-700 flex items-center gap-2" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}>
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" /></svg>
                    Completa los campos resaltados para continuar.
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setSetupStep(1)}
                    className="flex-1 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                  >
                    {t('consultation.setup.backStep')}
                  </button>
                  <button
                    onClick={async () => {
                      const errs: typeof setupErrors = {};
                      if (!editableData.weight) errs.weight = true;
                      if (!editableData.activityLevel) errs.activityLevel = true;
                      if (!editableData.goal) errs.goal = true;
                      if (Object.keys(errs).length > 0) {
                        setSetupErrors(errs);
                        return;
                      }
                      setSetupErrors({});
                      // Guardar borrador parcial
                      if (patientId && consultationId) {
                        try {
                          calculateTheoreticalValues();
                          await consultationService.updateConsultation(patientId, consultationId, {
                            nutritionPlan: {
                              objectivesSet: false,
                              nutritionParams: {
                                weight: editableData.weight,
                                activityLevel: editableData.activityLevel,
                                goal: editableData.goal,
                                weightGoal: editableData.weightGoal,
                                macroDistribution: customMacros,
                                bmr: theoreticalValues.bmr,
                                tdee: theoreticalValues.tdee,
                              },
                              lastUpdated: new Date().toISOString(),
                            }
                          });
                        } catch (err) {
                          console.error('Error guardando borrador paso 2:', err);
                        }
                      }
                      setSetupStep(3);
                    }}
                    className="flex-[2] py-2 bg-emerald-600 text-white text-xs font-medium rounded hover:bg-emerald-700 transition-colors"
                  >
                    {t('consultation.setup.continue')}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Macronutrientes */}
            {setupStep === 3 && (
              <div>
                <p className="text-base font-semibold text-gray-800 text-center mb-1">{t('consultation.setup.macros')}</p>
                <p className="text-[11px] text-gray-400 text-center mb-8">{t('consultation.setup.macrosHint')}</p>

                <div className="flex justify-center gap-2 mb-6">
                  {MACRO_PRESETS.map((preset) => {
                    const isActive = customMacros.protein === preset.protein && customMacros.carbs === preset.carbs && customMacros.fat === preset.fat;
                    return (
                      <button key={preset.key} onClick={() => applyMacroPreset(preset)}
                        className={`flex-1 py-1.5 rounded-full text-[11px] font-medium transition-all whitespace-nowrap ${
                          isActive 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-white border border-gray-300 text-gray-600 hover:border-emerald-400 hover:text-emerald-700'
                        }`}>
                        {presetLabel(preset.key)}
                      </button>
                    );
                  })}
                </div>

                <div className="bg-white rounded-md p-5 mb-6" style={{ border: '1px solid #E8E5DE' }}>
                  <div className="space-y-4">
                    {[
                      { name: 'protein' as const, label: t('consultation.setup.proteins'), color: 'bg-red-400', grams: theoreticalValues.protein },
                      { name: 'carbs' as const, label: t('consultation.setup.carbs'), color: 'bg-amber-400', grams: theoreticalValues.carbs },
                      { name: 'fat' as const, label: t('consultation.setup.fats'), color: 'bg-blue-400', grams: theoreticalValues.fat, auto: true },
                    ].map((macro) => (
                      <div key={macro.name}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-medium text-gray-700">{macro.label}</span>
                          <span className="text-[10px] text-gray-500 tabular-nums">{macro.grams}g{macro.auto ? ` · ${t('consultation.setup.auto')}` : ''}</span>
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
                    <p className="text-[10px] text-red-500 mt-3 text-center">Total: {customMacros.protein + customMacros.carbs + customMacros.fat}% ({t('consultation.setup.must100')})</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setSetupStep(2)}
                    className="flex-1 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                  >
                    {t('consultation.setup.backStep')}
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
                    {t('consultation.setup.armPlan')}
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
              {t('consultation.tabs.summary')}
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`flex-1 py-2 text-[11px] font-medium transition-colors ${
                activeTab === 'notes' 
                  ? 'text-emerald-700 border-b-2 border-emerald-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('consultation.tabs.notes')}
            </button>
            <button
              onClick={() => setActiveTab('indicaciones')}
              className={`flex-1 py-2 text-[11px] font-medium transition-colors ${
                activeTab === 'indicaciones' 
                  ? 'text-emerald-700 border-b-2 border-emerald-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('consultation.tabs.indications')}
            </button>
            <button
              onClick={() => setActiveTab('measurements')}
              className={`flex-1 py-2 text-[11px] font-medium transition-colors ${
                activeTab === 'measurements'
                  ? 'text-emerald-700 border-b-2 border-emerald-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('consultation.tabs.measurements')}
            </button>
          </div>
          
          {/* Contenido del panel según la pestaña activa */}
          <div>
            {activeTab === 'summary' ? (
              <div>
                {/* Datos del paciente */}
                <div className="px-5 py-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{t('consultation.setup.patientData')}</p>
                    {!isEditingData ? (
                      <button onClick={() => setIsEditingData(true)} className="text-[11px] text-emerald-700 hover:underline">{t('consultation.setup.edit')}</button>
                    ) : (
                      <button onClick={() => { setMacrosAreCustomized(true); setIsEditingData(false); calculateTheoreticalValues(); }} className="text-[11px] text-emerald-700 hover:underline">{t('consultation.setup.ready')}</button>
                    )}
                  </div>
                  <div className="text-[11px] space-y-1.5 tabular-nums">
                    <div>
                      <span className="text-gray-500">{t('consultation.setup.name')}:</span>
                      <span className="ml-1 font-medium text-gray-700">{patient?.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">{t('consultation.setup.gender')}:</span>
                      <span className="ml-1 font-medium text-gray-700">{patient?.gender === 'male' ? t('consultation.setup.male') : t('consultation.setup.female')}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">{t('consultation.setup.height')}:</span>
                      <span className="ml-1 font-medium text-gray-700">{patient?.height || 170} cm</span>
                    </div>
                    <div>
                      <span className="text-gray-500">{t('consultation.setup.age')}:</span>
                      <span className="ml-1 font-medium text-gray-700">{patient?.birthDate ? moment().diff(moment(patient.birthDate, 'YYYY-MM-DD'), 'years') : 30} {t('consultation.setup.years')}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-500">{t('consultation.setup.weight')}:</span>
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
                      <span className="text-gray-500">{t('consultation.setup.activity')}:</span>
                      {isEditingData ? (
                        <select name="activityLevel" value={editableData.activityLevel} onChange={handleEditableChange}
                          className="ml-1 p-0 text-[11px] bg-transparent font-medium text-gray-700 focus:outline-none w-auto" style={{ width: 'auto' }}>
                          {Object.keys(ACTIVITY_LEVELS).map((val) => <option key={val} value={val}>{activityLabel(val)}</option>)}
                        </select>
                      ) : (
                        <span className="ml-1 font-medium text-gray-700">{activityLabel(editableData.activityLevel)}</span>
                      )}
                    </div>
                    <div>
                      <span className="text-gray-500">{t('consultation.setup.goal')}:</span>
                      {isEditingData ? (
                        <select value={getGoalSelectValue()} onChange={handleGoalChange}
                          className="ml-1 p-0 text-[11px] bg-transparent font-medium text-gray-700 focus:outline-none w-auto" style={{ width: 'auto' }}>
                          {GOAL_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{goalLabel(opt.value)}</option>)}
                        </select>
                      ) : (
                        <span className="ml-1 font-medium text-gray-700">
                          {goalLabel(getGoalSelectValue() || 'maintain')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #F0EDE8' }}></div>

                {/* Requerimientos Energéticos */}
                <div className="px-5 py-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2">{t('consultation.setup.requirements')}</p>
                  <div className="space-y-1 text-[11px] tabular-nums">
                    <div><span className="text-gray-500">{t('consultation.setup.bmrLabel')}:</span><span className="ml-1 font-medium text-gray-700">{theoreticalValues.bmr} kcal</span></div>
                    <div><span className="text-gray-500">{t('consultation.setup.tdeeLabel')}:</span><span className="ml-1 font-medium text-gray-700">{theoreticalValues.tdee} kcal</span></div>
                    <div><span className="text-gray-500">{t('consultation.setup.targetCalLabel')}:</span><span className="ml-1 font-medium text-gray-700">{theoreticalValues.dailyCalories} {t('consultation.setup.kcalDay')}</span></div>
                    {theoreticalValues.dailyDeficit !== 0 && (
                      <div className="text-[10px] text-red-500 mt-1">
                        {theoreticalValues.dailyDeficit > 0
                          ? <span>{t('consultation.setup.deficitLabel')}: ~{theoreticalValues.dailyDeficit} {t('consultation.setup.kcalDay')} ({editableData.weightGoal} kg/{t('consultation.setup.month')})</span>
                          : <span>{t('consultation.setup.surplusLabel')}: ~{-theoreticalValues.dailyDeficit} {t('consultation.setup.kcalDay')} ({editableData.weightGoal} kg/{t('consultation.setup.month')})</span>}
                      </div>
                    )}
                  </div>
                </div>

                {/* Distribución de macronutrientes */}
                <div style={{ borderTop: '1px solid #F0EDE8' }}></div>
                <div className="px-5 pb-3 pt-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2">{t('consultation.setup.macrosDistribution')}</p>
                  {isEditingData ? (
                    <div className="space-y-3">
                      {/* Presets */}
                      <div className="flex flex-wrap gap-1.5">
                        {MACRO_PRESETS.map((preset) => {
                          const isActive = customMacros.protein === preset.protein && customMacros.carbs === preset.carbs && customMacros.fat === preset.fat;
                          return (
                            <button key={preset.key} onClick={() => applyMacroPreset(preset)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${
                                isActive ? 'bg-emerald-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:border-emerald-400 hover:text-emerald-700'
                              }`}>
                              {presetLabel(preset.key)}
                            </button>
                          );
                        })}
                      </div>
                      {/* Inputs */}
                      {[
                        { name: 'protein' as const, label: t('consultation.setup.proteins'), color: 'text-red-500', grams: theoreticalValues.protein },
                        { name: 'carbs' as const, label: t('consultation.setup.carbs'), color: 'text-amber-600', grams: theoreticalValues.carbs },
                        { name: 'fat' as const, label: t('consultation.setup.fats'), color: 'text-blue-500', grams: theoreticalValues.fat, auto: true },
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
                          {macro.auto && <span className="text-[9px] text-gray-400">({t('consultation.setup.auto')})</span>}
                        </div>
                      ))}
                      {(customMacros.protein + customMacros.carbs + customMacros.fat) !== 100 && (
                        <p className="text-[10px] text-red-500">Total: {customMacros.protein + customMacros.carbs + customMacros.fat}% ({t('consultation.setup.must100')})</p>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400"></span><div><p className="text-[10px] text-gray-500">{t('consultation.setup.proteins')}</p><p className="text-xs font-medium text-gray-800 tabular-nums">{customMacros.protein}%</p></div></div>
                      <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400"></span><div><p className="text-[10px] text-gray-500">{t('consultation.setup.carbsShort')}</p><p className="text-xs font-medium text-gray-800 tabular-nums">{customMacros.carbs}%</p></div></div>
                      <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400"></span><div><p className="text-[10px] text-gray-500">{t('consultation.setup.fats')}</p><p className="text-xs font-medium text-gray-800 tabular-nums">{customMacros.fat}%</p></div></div>
                    </div>
                  )}
                </div>

                {/* Plan actual vs. Objetivo */}
                <div className="px-5 py-4" style={{ borderTop: '1px solid #F0EDE8' }}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2">{t('consultation.setup.planVsGoal')}</p>
                  <div className="space-y-2 text-[11px]">
                    {[
                      { label: t('consultation.setup.calories'), actual: Math.round(totalNutrition.calories), target: theoreticalValues.dailyCalories, color: 'bg-emerald-500', unit: '' },
                      { label: t('consultation.setup.proteins'), actual: Math.round(totalNutrition.protein), target: theoreticalValues.protein, color: 'bg-red-400', unit: 'g' },
                      { label: t('consultation.setup.carbs'), actual: Math.round(totalNutrition.carbs), target: theoreticalValues.carbs, color: 'bg-amber-400', unit: 'g' },
                      { label: t('consultation.setup.fats'), actual: Math.round(totalNutrition.fat), target: theoreticalValues.fat, color: 'bg-blue-400', unit: 'g' },
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
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-0.5">{t('consultation.notesTab.notesTitle')}</p>
                <p className="text-[10px] text-gray-400 mb-2">{t('consultation.notesTab.notesSubtitle')}</p>
                <textarea
                  value={notasContent}
                  onChange={(e) => setNotasContent(e.target.value)}
                  placeholder={t('consultation.notesTab.notesPh')}
                  className="w-full min-h-[calc(100vh-200px)] px-2 py-1.5 text-xs text-gray-700 bg-white border border-gray-300 rounded-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 placeholder:text-gray-400"
                />
              </div>
            ) : activeTab === 'indicaciones' ? (
              /* Indicaciones tab */
              <div className="p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-0.5">{t('consultation.notesTab.indicationsTitle')}</p>
                <p className="text-[10px] text-gray-400 mb-2">{t('consultation.notesTab.indicationsSubtitle')}</p>
                <textarea
                  value={indicacionesContent}
                  onChange={(e) => setIndicacionesContent(e.target.value)}
                  placeholder={t('consultation.notesTab.indicationsPh')}
                  className="w-full min-h-[calc(100vh-200px)] px-2 py-1.5 text-xs text-gray-700 bg-white border border-gray-300 rounded-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 placeholder:text-gray-400"
                />
              </div>
            ) : (
              /* Medidas tab — todo en uno */
              <div className="p-4 space-y-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-0.5">Medidas corporales</p>
                  <p className="text-[10px] text-gray-400">Todo lo que necesites — los avanzados son opcionales.</p>
                </div>

                {/* Circunferencias */}
                <div className="space-y-2">
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-400">Circunferencias</p>
                  {([
                    { key: 'waist' as const, label: 'Cintura (cm)', max: 250 },
                    { key: 'hip' as const, label: 'Cadera (cm)', max: 250 },
                    { key: 'neck' as const, label: 'Cuello (cm)', max: 80 },
                  ]).map((row) => (
                    <MeasureInputRow key={row.key} row={row} measurements={measurements} setMeasurements={setMeasurements} />
                  ))}
                </div>

                {/* Pliegues cutáneos */}
                <div className="space-y-2 pt-3 border-t border-stone-200">
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-400">Pliegues cutáneos</p>
                    <p className="text-[9px] text-amber-700 italic">Requieren plicómetro · opcionales</p>
                  </div>
                  {([
                    { key: 'tricipital' as const, label: 'Tricipital (mm)', max: 80 },
                    { key: 'subescapular' as const, label: 'Subescapular (mm)', max: 80 },
                    { key: 'suprailiaco' as const, label: 'Suprailíaco (mm)', max: 80 },
                  ]).map((row) => (
                    <MeasureInputRow key={row.key} row={row} measurements={measurements} setMeasurements={setMeasurements} />
                  ))}
                </div>

                {/* Perímetros */}
                <div className="space-y-2 pt-3 border-t border-stone-200">
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-400">Perímetros</p>
                  {([
                    { key: 'arm' as const, label: 'Brazo (cm)', max: 80 },
                    { key: 'calf' as const, label: 'Pantorrilla (cm)', max: 80 },
                    { key: 'wrist' as const, label: 'Muñeca (cm)', max: 30 },
                  ]).map((row) => (
                    <MeasureInputRow key={row.key} row={row} measurements={measurements} setMeasurements={setMeasurements} />
                  ))}
                </div>

                {(measurements.waist > 0 && measurements.hip > 0) && (
                  <MeasurementResults
                    measurements={measurements}
                    height={setupPatientData.height}
                    weight={editableData.weight}
                    age={(() => { try { return setupPatientData.birthDate ? Math.floor((Date.now() - new Date(setupPatientData.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25)) : 30; } catch { return 30; } })()}
                    gender={(patient?.gender === 'male' || patient?.gender === 'female') ? patient.gender : 'male'}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Contenido principal del plan (a la derecha) */}
        <div className="w-3/4 p-4 flex flex-col gap-3" style={{ backgroundColor: '#FAF9F7' }}>
          <Meals 
            meals={meals}
            commonIngredients={commonIngredientsList}
            onMealsChange={handleMealsChange}
          />
        </div>
      </div>
      )}

      {/* ── Modal: Guardar plan como plantilla ── */}
      {showSavePlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !savingPlan && setShowSavePlan(false)} />
          <div className="relative bg-white rounded-md shadow-2xl w-full max-w-md overflow-hidden" style={{ border: '1px solid #E8E5DE' }}>
            {planSaved ? (
              <div className="px-6 py-10 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center mb-3">
                  <CheckmarkFilled size={24} className="text-white" />
                </div>
                <p className="text-sm font-semibold text-gray-800">{t('plans.saved')}</p>
                <p className="text-[11px] text-gray-500 mt-1">{t('plans.savedHint')}</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between px-5 py-2.5 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <Star size={14} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">{t('plans.savePlanTitle')}</span>
                  </div>
                  <button onClick={() => setShowSavePlan(false)} className="p-1 rounded hover:bg-gray-100"><X className="h-4 w-4 text-gray-500" /></button>
                </div>
                <div className="px-5 py-4 space-y-3">
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 block mb-1.5">{t('plans.name')}</label>
                    <input
                      type="text" autoFocus value={planName} onChange={(e) => setPlanName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') doSavePlan(); }}
                      className="w-full px-3 py-2 text-sm rounded-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-white border border-[#E0DCD4] text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 block mb-1.5">{t('plans.tags')} <span className="text-gray-300 normal-case font-normal">{t('plans.tagsOptional')}</span></label>
                    <TagEditor value={planTags} onChange={setPlanTags} options={tagSuggestions} onCreate={handleCreateTag} />
                  </div>
                  <p className="text-[10px] text-gray-400">{t('plans.saveFullHint').replace('{n}', String(meals.length))}</p>
                </div>
                <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2">
                  <button onClick={() => setShowSavePlan(false)} className="text-xs px-3 py-1.5 rounded text-gray-600 hover:bg-gray-100">{t('plans.cancel')}</button>
                  <button onClick={doSavePlan} disabled={savingPlan || !planName.trim()} className="text-xs px-4 py-1.5 rounded font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5">
                    {savingPlan && <span className="inline-block w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                    {t('plans.save')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Modal: Cargar plan guardado ── */}
      {showLoadPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowLoadPlan(false)} />
          <div className="relative bg-white rounded-md shadow-2xl w-full max-w-md overflow-hidden flex flex-col" style={{ border: '1px solid #E8E5DE', maxHeight: '80vh' }}>
            <div className="flex items-center justify-between px-5 py-2.5 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center gap-2">
                <FolderOpen size={14} className="text-gray-500" />
                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">{t('plans.loadPlanTitle')}</span>
              </div>
              <button onClick={() => setShowLoadPlan(false)} className="p-1 rounded hover:bg-gray-100"><X className="h-4 w-4 text-gray-500" /></button>
            </div>
            <div className="px-4 pt-3 pb-2 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                <input
                  type="text" placeholder={t('plans.searchPlan')} value={planSearch} onChange={(e) => setPlanSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded w-full focus:outline-none focus:ring-1 focus:ring-emerald-200 bg-white border border-[#CCC9C3] text-gray-800"
                />
              </div>
              <button
                type="button"
                onClick={() => setLoadPlanIndicaciones(v => !v)}
                className="mt-2 w-full flex items-center justify-between gap-3 rounded-sm px-3 py-1.5 border border-[#E8E5DE] bg-[#FAF9F7]"
              >
                <span className="text-[11px] font-medium text-gray-600">{t('plans.importIndications')}</span>
                <span className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full transition-colors ${loadPlanIndicaciones ? 'bg-emerald-600' : 'bg-gray-300'}`}>
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${loadPlanIndicaciones ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {loadingPlans ? (
                <div className="py-10 flex items-center justify-center">
                  <span className="inline-block w-6 h-6 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
                </div>
              ) : (() => {
                const term = planSearch.toLowerCase().trim();
                const list = loadablePlans.filter(p => !term || p.name?.toLowerCase().includes(term) || (p.group || '').toLowerCase().includes(term));
                if (list.length === 0) {
                  return (
                    <div className="py-10 flex flex-col items-center justify-center text-center text-gray-400">
                      <ClipboardList className="w-8 h-8 mb-2 opacity-40" />
                      <p className="text-xs">{loadablePlans.length === 0 ? t('plans.emptyNone') : t('plans.emptyNoResults')}</p>
                    </div>
                  );
                }
                return (
                  <div className="space-y-1.5">
                    {list.map(p => (
                      <button
                        key={p.id} onClick={() => requestLoadPlan(p)}
                        className="w-full text-left bg-white rounded-md p-2.5 transition-all hover:shadow-sm hover:border-emerald-300"
                        style={{ border: '1px solid #E8E5DE' }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-semibold text-gray-800 truncate">{p.name}</span>
                              {tagsOf(p).map(tag => (
                                <span key={tag} className="px-1.5 py-px rounded-full bg-[#F0EDE8] text-gray-600 text-[9px] font-medium">{tag}</span>
                              ))}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mt-0.5 tabular-nums">
                              <span>{p.mealsCount ?? (Array.isArray(p.meals) ? p.meals.length : 0)} {t('plans.mealsSuffix')}</span>
                              <span className="text-gray-300">·</span>
                              <span className="font-semibold text-gray-700">{Math.round(p.totalNutrition?.calories || 0)} kcal</span>
                              {p.indicaciones?.trim() && <span className="ml-1 px-1.5 py-px rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-medium normal-case tracking-normal">{t('plans.indicationsBadge')}</span>}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmar reemplazo del plan actual ── */}
      {pendingPlan && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setPendingPlan(null)} />
          <div className="relative bg-white rounded-md shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="px-5 py-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900">{t('plans.replaceTitle')}</h3>
                <p className="text-xs text-gray-500 mt-1">{t('plans.replaceBody').replace('{name}', pendingPlan.name)}</p>
              </div>
            </div>
            <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2">
              <button onClick={() => setPendingPlan(null)} className="text-xs px-3 py-1.5 rounded text-gray-600 hover:bg-gray-100">{t('plans.cancel')}</button>
              <button onClick={() => applyPlan(pendingPlan)} className="text-xs px-4 py-1.5 rounded font-semibold text-white bg-emerald-600 hover:bg-emerald-700">{t('plans.replace')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Tipo compartido para fila de medición
type MeasureKey = 'waist' | 'hip' | 'neck' | 'tricipital' | 'subescapular' | 'suprailiaco' | 'arm' | 'calf' | 'wrist';
type MeasurementsState = {
  waist: number; hip: number; neck: number;
  tricipital: number; subescapular: number; suprailiaco: number;
  arm: number; calf: number; wrist: number;
  focused: MeasureKey | null;
};

function MeasureInputRow({ row, measurements, setMeasurements }: {
  row: { key: MeasureKey; label: string; max: number };
  measurements: MeasurementsState;
  setMeasurements: React.Dispatch<React.SetStateAction<MeasurementsState>>;
}) {
  const active = measurements.focused === row.key;
  return (
    <div className="flex items-start gap-3">
      <div className={`w-12 h-12 flex-shrink-0 rounded-lg flex items-center justify-center transition-colors p-1.5 ${active ? 'bg-emerald-50 border border-emerald-200' : 'bg-stone-50 border border-stone-200'}`}>
        <MiniBodyIcon kind={row.key} active={active} />
      </div>
      <div className="flex-1 min-w-0">
        <label className={`block text-[11px] font-medium mb-1 ${active ? 'text-emerald-700' : 'text-gray-600'}`}>{row.label}</label>
        <input
          type="number"
          value={measurements[row.key] || ''}
          min={0}
          max={row.max}
          step={0.1}
          onChange={(e) => setMeasurements(m => ({ ...m, [row.key]: parseFloat(e.target.value) || 0 }))}
          onFocus={() => setMeasurements(m => ({ ...m, focused: row.key }))}
          onBlur={() => setMeasurements(m => ({ ...m, focused: null }))}
          className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded-sm text-xs focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 tabular-nums"
        />
      </div>
    </div>
  );
}

// Mini-icono SVG por tipo de medida
function MiniBodyIcon({ kind, active }: { kind: MeasureKey; active: boolean }) {
  const base = '#F5F3EE';
  const stroke = '#D6D3D1';
  const accent = active ? '#059669' : '#9CA3AF';
  const sw = active ? 1.8 : 1.1;
  const dash = active ? '0' : '2 2';
  const common = { width: '100%', height: '100%', viewBox: '0 0 70 70', 'aria-hidden': true } as const;
  switch (kind) {
    case 'waist':
      return (
        <svg {...common}>
          <path d="M 22 8 Q 20 18 18 26 Q 14 36 18 46 Q 22 56 24 62 L 46 62 Q 48 56 52 46 Q 56 36 52 26 Q 50 18 48 8 Q 35 5 22 8 Z" fill={base} stroke={stroke} strokeWidth={1} />
          <ellipse cx={35} cy={36} rx={19} ry={3} fill="none" stroke={accent} strokeWidth={sw} strokeDasharray={dash} />
        </svg>
      );
    case 'hip':
      return (
        <svg {...common}>
          <path d="M 26 8 L 26 28 Q 14 36 12 50 Q 12 60 22 64 L 48 64 Q 58 60 58 50 Q 56 36 44 28 L 44 8 Z" fill={base} stroke={stroke} strokeWidth={1} />
          <ellipse cx={35} cy={48} rx={23} ry={3.5} fill="none" stroke={accent} strokeWidth={sw} strokeDasharray={dash} />
        </svg>
      );
    case 'neck':
      return (
        <svg {...common}>
          <circle cx={35} cy={20} r={11} fill={base} stroke={stroke} strokeWidth={1} />
          <path d="M 28 30 L 28 42 Q 22 46 22 56 L 48 56 Q 48 46 42 42 L 42 30 Z" fill={base} stroke={stroke} strokeWidth={1} />
          <ellipse cx={35} cy={36} rx={9} ry={2.5} fill="none" stroke={accent} strokeWidth={sw} strokeDasharray={dash} />
        </svg>
      );
    case 'tricipital':
      return (
        <svg {...common}>
          <path d="M 30 8 Q 28 30 30 52 Q 31 60 28 64 L 42 64 Q 39 60 40 52 Q 42 30 40 8 Z" fill={base} stroke={stroke} strokeWidth={1} />
          <line x1={28} y1={32} x2={16} y2={26} stroke={accent} strokeWidth={sw} />
          <line x1={28} y1={40} x2={16} y2={46} stroke={accent} strokeWidth={sw} />
          <circle cx={16} cy={36} r={2.5} fill={accent} />
        </svg>
      );
    case 'subescapular':
      return (
        <svg {...common}>
          <path d="M 14 12 L 14 56 Q 16 62 22 64 L 48 64 Q 54 62 56 56 L 56 12 Q 35 6 14 12 Z" fill={base} stroke={stroke} strokeWidth={1} />
          <path d="M 22 18 L 32 30 L 18 26 Z" fill="none" stroke="#E0DDD5" strokeWidth={0.8} />
          <line x1={32} y1={34} x2={44} y2={32} stroke={accent} strokeWidth={sw} />
          <line x1={32} y1={40} x2={44} y2={42} stroke={accent} strokeWidth={sw} />
          <circle cx={46} cy={37} r={2.5} fill={accent} />
        </svg>
      );
    case 'suprailiaco':
      return (
        <svg {...common}>
          <path d="M 18 8 Q 16 28 14 42 Q 14 56 22 64 L 48 64 Q 56 56 56 42 Q 54 28 52 8 Z" fill={base} stroke={stroke} strokeWidth={1} />
          <path d="M 16 42 Q 35 36 54 42" fill="none" stroke="#E0DDD5" strokeWidth={0.8} />
          <line x1={42} y1={38} x2={54} y2={34} stroke={accent} strokeWidth={sw} />
          <line x1={42} y1={44} x2={54} y2={48} stroke={accent} strokeWidth={sw} />
          <circle cx={56} cy={41} r={2.5} fill={accent} />
        </svg>
      );
    case 'arm':
      return (
        <svg {...common}>
          <path d="M 28 6 Q 26 30 28 50 Q 29 60 26 64 L 44 64 Q 41 60 42 50 Q 44 30 42 6 Z" fill={base} stroke={stroke} strokeWidth={1} />
          <ellipse cx={35} cy={32} rx={9} ry={2.5} fill="none" stroke={accent} strokeWidth={sw} strokeDasharray={dash} />
        </svg>
      );
    case 'calf':
      return (
        <svg {...common}>
          <path d="M 26 6 L 26 28 Q 18 36 20 50 Q 22 60 26 64 L 44 64 Q 48 60 50 50 Q 52 36 44 28 L 44 6 Z" fill={base} stroke={stroke} strokeWidth={1} />
          <ellipse cx={35} cy={42} rx={15} ry={3} fill="none" stroke={accent} strokeWidth={sw} strokeDasharray={dash} />
        </svg>
      );
    case 'wrist':
      return (
        <svg {...common}>
          <rect x={10} y={28} width={28} height={14} rx={3} fill={base} stroke={stroke} strokeWidth={1} />
          <path d="M 38 26 L 56 22 Q 60 28 60 35 Q 60 42 56 48 L 38 44 Z" fill={base} stroke={stroke} strokeWidth={1} />
          <ellipse cx={38} cy={35} rx={2.5} ry={9} fill="none" stroke={accent} strokeWidth={sw} strokeDasharray={dash} />
        </svg>
      );
  }
}

// Resultados derivados de las medidas corporales (consulta)
function MeasurementResults({ measurements, height, weight, age, gender }: {
  measurements: MeasurementsState; height: number; weight: number; age: number; gender: 'male' | 'female';
}) {
  const { waist, hip, neck, tricipital, subescapular, suprailiaco, arm, calf, wrist } = measurements;
  const isM = gender === 'male';
  // ICA (cintura/altura)
  const wht = height > 0 ? waist / height : 0;
  const whtClass = wht < 0.5 ? { label: 'Saludable', color: '#10B981', bg: '#ECFDF5' }
    : wht < 0.6 ? { label: 'Sobrepeso', color: '#F59E0B', bg: '#FFFBEB' }
    : { label: 'Obesidad', color: '#EF4444', bg: '#FEF2F2' };

  // ICC (cintura/cadera)
  const whr = hip > 0 ? waist / hip : 0;
  const whrClass = isM
    ? (whr < 0.90 ? { label: 'Bajo', color: '#10B981', bg: '#ECFDF5' } : whr < 1.0 ? { label: 'Moderado', color: '#F59E0B', bg: '#FFFBEB' } : { label: 'Alto', color: '#EF4444', bg: '#FEF2F2' })
    : (whr < 0.80 ? { label: 'Bajo', color: '#10B981', bg: '#ECFDF5' } : whr < 0.85 ? { label: 'Moderado', color: '#F59E0B', bg: '#FFFBEB' } : { label: 'Alto', color: '#EF4444', bg: '#FEF2F2' });
  const distrib = (isM ? whr >= 0.95 : whr >= 0.85) ? { emoji: '🍎', label: 'Androide (manzana)' } : { emoji: '🍐', label: 'Ginoide (pera)' };

  // % grasa US Navy (requiere cuello)
  let bodyFat = 0;
  if (neck > 0 && height > 0) {
    if (isM && waist > neck) {
      bodyFat = 86.010 * Math.log10(waist - neck) - 70.041 * Math.log10(height) + 36.76;
    } else if (!isM && (waist + hip) > neck) {
      bodyFat = 163.205 * Math.log10(waist + hip - neck) - 97.684 * Math.log10(height) - 78.387;
    }
    bodyFat = Math.max(0, Math.min(60, bodyFat));
  }
  const bfClass = (() => {
    if (!bodyFat) return { label: '—', color: '#9CA3AF' };
    if (isM) {
      if (bodyFat < 6) return { label: 'Esencial', color: '#3B82F6' };
      if (bodyFat < 14) return { label: 'Atlético', color: '#10B981' };
      if (bodyFat < 18) return { label: 'Fitness', color: '#10B981' };
      if (bodyFat < 25) return { label: 'Normal', color: '#F59E0B' };
      return { label: 'Alto', color: '#EF4444' };
    } else {
      if (bodyFat < 14) return { label: 'Esencial', color: '#3B82F6' };
      if (bodyFat < 21) return { label: 'Atlético', color: '#10B981' };
      if (bodyFat < 25) return { label: 'Fitness', color: '#10B981' };
      if (bodyFat < 32) return { label: 'Normal', color: '#F59E0B' };
      return { label: 'Alto', color: '#EF4444' };
    }
  })();
  const fatMass = weight > 0 && bodyFat > 0 ? weight * bodyFat / 100 : 0;
  const leanMass = weight > 0 && bodyFat > 0 ? weight - fatMass : 0;

  // % grasa Jackson-Pollock 3 pliegues (más preciso que US Navy si hay plicómetro)
  let bodyFatJP = 0;
  if (tricipital > 0 && subescapular > 0 && suprailiaco > 0 && age > 0) {
    const sum = tricipital + subescapular + suprailiaco;
    // Densidad corporal — Jackson-Pollock 3 sites
    const density = isM
      ? 1.10938 - 0.0008267 * sum + 0.0000016 * sum * sum - 0.0002574 * age
      : 1.0994921 - 0.0009929 * sum + 0.0000023 * sum * sum - 0.0001392 * age;
    // Siri
    bodyFatJP = (495 / density) - 450;
    bodyFatJP = Math.max(0, Math.min(60, bodyFatJP));
  }
  const fatMassJP = weight > 0 && bodyFatJP > 0 ? weight * bodyFatJP / 100 : 0;
  const leanMassJP = weight > 0 && bodyFatJP > 0 ? weight - fatMassJP : 0;

  // Circunferencia muscular del brazo (CMB) = brazo - π × tricipital(cm)
  const cmb = (arm > 0 && tricipital > 0) ? arm - (Math.PI * tricipital / 10) : 0;

  // Sarcopenia por pantorrilla (corte SARC-F: <31cm sospecha)
  const calfRisk = calf > 0 ? (calf < 31 ? { label: 'Riesgo sarcopenia', color: '#EF4444' } : { label: 'Normal', color: '#10B981' }) : null;

  // Complexión ósea por muñeca (índice = altura/muñeca)
  let complexion: { label: string; color: string } | null = null;
  if (wrist > 0 && height > 0) {
    const idx = height / wrist;
    if (isM) {
      complexion = idx > 10.4 ? { label: 'Pequeña', color: '#3B82F6' } : idx >= 9.6 ? { label: 'Mediana', color: '#10B981' } : { label: 'Grande', color: '#F59E0B' };
    } else {
      complexion = idx > 11.0 ? { label: 'Pequeña', color: '#3B82F6' } : idx >= 10.1 ? { label: 'Mediana', color: '#10B981' } : { label: 'Grande', color: '#F59E0B' };
    }
  }

  // Riesgo cardiovascular por cintura (OMS)
  const waistRisk = isM
    ? (waist < 94 ? { label: 'Bajo', color: '#10B981', pct: (waist / 110) * 100 }
      : waist < 102 ? { label: 'Aumentado', color: '#F59E0B', pct: (waist / 110) * 100 }
      : { label: 'Muy alto', color: '#EF4444', pct: Math.min(100, (waist / 110) * 100) })
    : (waist < 80 ? { label: 'Bajo', color: '#10B981', pct: (waist / 95) * 100 }
      : waist < 88 ? { label: 'Aumentado', color: '#F59E0B', pct: (waist / 95) * 100 }
      : { label: 'Muy alto', color: '#EF4444', pct: Math.min(100, (waist / 95) * 100) });

  return (
    <div className="mt-4 space-y-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Resultados</p>

      {/* KPIs ICA · ICC · %grasa */}
      <div className="grid grid-cols-3 gap-2">
        <ResultKpi label="ICA" value={wht > 0 ? wht.toFixed(2) : '—'} sub={whtClass.label} color={whtClass.color} bg={whtClass.bg} />
        <ResultKpi label="ICC" value={whr > 0 ? whr.toFixed(2) : '—'} sub={whrClass.label} color={whrClass.color} bg={whrClass.bg} />
        <ResultKpi label="% Grasa" value={bodyFat > 0 ? bodyFat.toFixed(1) + '%' : '—'} sub={bfClass.label} color={bfClass.color} bg="#F9FAFB" />
      </div>

      {/* Riesgo por cintura */}
      <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg">
        <div className="flex justify-between items-baseline mb-1.5">
          <span className="text-[11px] text-gray-600">Cintura — riesgo cardiovascular</span>
          <span className="text-[11px] font-semibold tabular-nums" style={{ color: waistRisk.color }}>{waistRisk.label}</span>
        </div>
        <div className="relative w-full h-2 rounded-full overflow-hidden" style={{ background: 'linear-gradient(90deg, #D1FAE5 0%, #D1FAE5 ' + (isM ? '55%' : '50%') + ', #FEF3C7 ' + (isM ? '55%' : '50%') + ', #FEF3C7 ' + (isM ? '75%' : '70%') + ', #FECACA ' + (isM ? '75%' : '70%') + ', #FECACA 100%)' }}>
          <div className="absolute top-1/2 -translate-y-1/2 w-1 h-3 bg-gray-800 rounded-full" style={{ left: `${Math.min(100, waistRisk.pct)}%`, transform: 'translate(-50%, -50%)' }} />
        </div>
        <div className="flex justify-between text-[9px] text-gray-400 mt-1 tabular-nums">
          <span>{isM ? '<94' : '<80'}</span>
          <span>{isM ? '94–101' : '80–87'}</span>
          <span>{isM ? '≥102' : '≥88'}</span>
        </div>
      </div>

      {/* Distribución */}
      {whr > 0 && (
        <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg flex items-center gap-3">
          <span className="text-2xl">{distrib.emoji}</span>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-500">Distribución</p>
            <p className="text-[12px] font-semibold text-gray-800">{distrib.label}</p>
          </div>
        </div>
      )}

      {/* Composición corporal (solo si hay %grasa y peso) */}
      {bodyFat > 0 && weight > 0 && (
        <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-gray-500">Composición corporal (US Navy)</p>
          <div className="flex justify-between text-[11px]">
            <span className="text-gray-600">Masa magra</span>
            <span className="font-semibold text-gray-800 tabular-nums">{leanMass.toFixed(1)} kg</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-gray-600">Masa grasa</span>
            <span className="font-semibold text-gray-800 tabular-nums">{fatMass.toFixed(1)} kg</span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden flex">
            <div className="h-full bg-emerald-400" style={{ width: `${100 - bodyFat}%` }} />
            <div className="h-full bg-amber-400" style={{ width: `${bodyFat}%` }} />
          </div>
          <div className="flex justify-between text-[9px] text-gray-400 tabular-nums">
            <span>{(100 - bodyFat).toFixed(1)}% magra</span>
            <span>{bodyFat.toFixed(1)}% grasa</span>
          </div>
        </div>
      )}

      {/* % grasa Jackson-Pollock (más preciso, requiere 3 pliegues) */}
      {bodyFatJP > 0 && (
        <div className="p-3 rounded-lg space-y-2 border" style={{ backgroundColor: '#F5F3FF', borderColor: '#DDD6FE' }}>
          <div className="flex items-baseline justify-between">
            <p className="text-[10px] uppercase tracking-wider text-purple-700 font-semibold">Jackson-Pollock 3 pliegues</p>
            <span className="text-[9px] text-purple-500">+ preciso</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] text-gray-700">% grasa</span>
            <span className="text-[16px] font-bold tabular-nums text-purple-700">{bodyFatJP.toFixed(1)}%</span>
          </div>
          {weight > 0 && (
            <>
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-600">Masa magra</span>
                <span className="font-semibold text-gray-800 tabular-nums">{leanMassJP.toFixed(1)} kg</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-600">Masa grasa</span>
                <span className="font-semibold text-gray-800 tabular-nums">{fatMassJP.toFixed(1)} kg</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Indicadores avanzados (CMB · sarcopenia · complexión) */}
      {(cmb > 0 || calfRisk || complexion) && (
        <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-gray-500">Indicadores avanzados</p>
          {cmb > 0 && (
            <div className="flex justify-between text-[11px]">
              <span className="text-gray-600">CMB <span className="text-gray-400">(masa muscular brazo)</span></span>
              <span className="font-semibold text-gray-800 tabular-nums">{cmb.toFixed(1)} cm</span>
            </div>
          )}
          {calfRisk && (
            <div className="flex justify-between text-[11px]">
              <span className="text-gray-600">Pantorrilla <span className="text-gray-400">(sarcopenia)</span></span>
              <span className="font-semibold tabular-nums" style={{ color: calfRisk.color }}>{calfRisk.label}</span>
            </div>
          )}
          {complexion && (
            <div className="flex justify-between text-[11px]">
              <span className="text-gray-600">Complexión ósea</span>
              <span className="font-semibold tabular-nums" style={{ color: complexion.color }}>{complexion.label}</span>
            </div>
          )}
        </div>
      )}

      {neck === 0 && (
        <p className="text-[10px] text-gray-400 italic px-1">Añade el cuello para calcular % grasa (US Navy).</p>
      )}
    </div>
  );
}

function ResultKpi({ label, value, sub, color, bg }: { label: string; value: string; sub: string; color: string; bg: string }) {
  return (
    <div className="rounded-lg p-2 border" style={{ backgroundColor: bg, borderColor: color + '33' }}>
      <p className="text-[9px] uppercase tracking-wider text-gray-500">{label}</p>
      <p className="text-[14px] font-bold tabular-nums leading-tight" style={{ color }}>{value}</p>
      <p className="text-[9px] font-medium" style={{ color }}>{sub}</p>
    </div>
  );
}