'use client'

import React, { useState, useEffect } from 'react';
import { 
  CheckmarkFilled, 
  TrashCan, 
  Strawberry 
} from '@carbon/icons-react';
import PrintNutritionPlan from '@/app/consulta/components/printPDF';
import { useParams, useSearchParams } from 'next/navigation';
import moment from 'moment';
import Notas from '../components/notas';
import Meals, { Meal } from '../components/meals';
import NutritionalSummary from '../components/NutritionalSummary';
import { patientService, consultationService, authService } from '@/app/shared/firebase';
import { Patient, Consultation } from '@/app/shared/interfaces';

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
  const [meals, setMeals] = useState<Meal[]>([
    
  ]);
  
  const [totalNutrition, setTotalNutrition] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
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

  // Añadir esta función para manejar cambios en los parámetros
  const handleNutritionParamsChange = (updatedParams: any) => {
    console.log("Parámetros actualizados:", updatedParams);
    setNutritionParams(updatedParams);
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

  // Función para manejar cambios en las comidas
  const handleMealsChange = (updatedMeals: Meal[]) => {
    setMeals(updatedMeals);
  };

  // Función para manejar guardado de notas
  const handleSaveNotes = (content: string) => {
    setNotasContent(content);
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
    return <div className="text-center p-10">Cargando datos...</div>;
  }

  if (error) {
    return <div className="text-center p-10 text-red-500">{error}</div>;
  }

  return (
    <div className="flex flex-col">
     

      <div className="flex flex-row">
        {/* Panel lateral sticky con pestañas */}
        <div className="w-1/4 h-[calc(100vh-50px)] sticky top-13 overflow-auto bg-white shadow-md">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('summary')}
              className={`flex-1 py-3 text-sm font-medium ${
                activeTab === 'summary' 
                  ? 'text-emerald-600 border-b-3 border-emerald-600' 
                  : 'text-gray-500 hover:text-emerald-900'
              }`}
            >
              Resumen
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`flex-1 py-3 text-sm font-medium ${
                activeTab === 'notes' 
                  ? 'text-emerald-600 border-b-3 border-emerald-600' 
                  : 'text-gray-500 hover:text-emerald-900'
              }`}
            >
              Notas
            </button>
          </div>
          
          {/* Contenido del panel según la pestaña activa */}
          <div className="overflow-auto">
            {activeTab === 'summary' ? (
              <div className="p-4">
                <NutritionalSummary
                  patientData={patient ? {
                    gender: (patient.gender === 'male' || patient.gender === 'female') ? patient.gender : 'male',
                    age: patient.birthDate ? moment().diff(moment(patient.birthDate, 'YYYY-MM-DD'), 'years') : 30,
                    height: patient.height || 170,
                    weight: nutritionParams.weight || patient.currentWeight || 70,
                    activityLevel: nutritionParams.activityLevel as any,
                    goal: nutritionParams.goal as any,
                    weightGoal: nutritionParams.weightGoal,
                    name: patient.name // Añadir esta línea para pasar el nombre del paciente
                  } : undefined}
                  totalNutrition={totalNutrition}
                  showDetails={true}
                  onNutritionParamsChange={handleNutritionParamsChange}
                  initialMacroDistribution={nutritionParams.macroDistribution}
                />
              </div>
            ) : (
              <Notas 
                initialContent={notasContent}
                onSave={handleSaveNotes}
              />
            )}
          </div>
        </div>

        {/* Contenido principal del plan (a la derecha) */}
        <div className="w-3/4 p-4 flex flex-col gap-4 bg-gray10">
          {/* Integración del componente Meals */}
          <Meals 
            meals={meals}
            commonIngredients={COMMON_INGREDIENTS}
            onMealsChange={handleMealsChange}
          />


<PrintNutritionPlan
  patient={patient}
  consultation={consultation}
  meals={meals}
  totalNutrition={totalNutrition}
  notes={notasContent}
  nutritionistName="Dr. Juan Pérez"
  nutritionistId="CP-12345"
/>

          {/* Botón de guardar */}
          <div className="text-right mb-8">
            <button 
              onClick={savePlan}
              disabled={isSaving}
              className={`bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded flex items-center ml-auto ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSaving ? 'Guardando...' : (
                <>
                  <CheckmarkFilled size={16} className="mr-2" />
                  Guardar Plan Nutricional
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}