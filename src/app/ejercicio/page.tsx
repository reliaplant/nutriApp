'use client'
import { useState } from 'react';

// Definición de tipos
interface Exercise {
  id: string;
  name: string;
  muscle: string;
  sets: number;
  reps: string;
  rest: number;
  notes?: string;
}

interface WorkoutDay {
  id: string;
  name: string;
  exercises: Exercise[];
}

interface WorkoutPlan {
  id: string;
  name: string;
  patientId: string;
  days: WorkoutDay[];
}

// Base de datos de ejercicios comunes
const COMMON_EXERCISES = [
  // Pecho
  { id: 'e1', name: 'Press de banca', muscle: 'Pecho' },
  { id: 'e2', name: 'Fondos en paralelas', muscle: 'Pecho' },
  { id: 'e3', name: 'Aperturas con mancuernas', muscle: 'Pecho' },
  { id: 'e4', name: 'Press inclinado', muscle: 'Pecho' },
  
  // Espalda
  { id: 'e5', name: 'Dominadas', muscle: 'Espalda' },
  { id: 'e6', name: 'Remo con barra', muscle: 'Espalda' },
  { id: 'e7', name: 'Remo con mancuerna', muscle: 'Espalda' },
  { id: 'e8', name: 'Jalón al pecho', muscle: 'Espalda' },
  
  // Piernas
  { id: 'e9', name: 'Sentadilla', muscle: 'Piernas' },
  { id: 'e10', name: 'Prensa de piernas', muscle: 'Piernas' },
  { id: 'e11', name: 'Extensión de cuádriceps', muscle: 'Piernas' },
  { id: 'e12', name: 'Curl de isquiotibiales', muscle: 'Piernas' },
  { id: 'e13', name: 'Elevación de gemelos', muscle: 'Piernas' },
  
  // Hombros
  { id: 'e14', name: 'Press militar', muscle: 'Hombros' },
  { id: 'e15', name: 'Elevaciones laterales', muscle: 'Hombros' },
  { id: 'e16', name: 'Elevaciones frontales', muscle: 'Hombros' },
  { id: 'e17', name: 'Remo al mentón', muscle: 'Hombros' },
  
  // Brazos
  { id: 'e18', name: 'Curl de bíceps con barra', muscle: 'Bíceps' },
  { id: 'e19', name: 'Curl de bíceps con mancuernas', muscle: 'Bíceps' },
  { id: 'e20', name: 'Press francés', muscle: 'Tríceps' },
  { id: 'e21', name: 'Extensión de tríceps con polea', muscle: 'Tríceps' },
  
  // Core
  { id: 'e22', name: 'Crunch abdominal', muscle: 'Abdominales' },
  { id: 'e23', name: 'Plancha', muscle: 'Core' },
  { id: 'e24', name: 'Russian twist', muscle: 'Abdominales' },
  { id: 'e25', name: 'Elevación de piernas', muscle: 'Abdominales' },
  
  // Cardio
  { id: 'e26', name: 'Carrera continua', muscle: 'Cardio' },
  { id: 'e27', name: 'HIIT', muscle: 'Cardio' },
  { id: 'e28', name: 'Bicicleta', muscle: 'Cardio' },
  { id: 'e29', name: 'Elíptica', muscle: 'Cardio' },
  { id: 'e30', name: 'Salto a la comba', muscle: 'Cardio' },
];

// Lista de pacientes simulados
const PATIENTS = [
  { id: 'p1', name: 'María García' },
  { id: 'p2', name: 'Juan López' },
  { id: 'p3', name: 'Ana Martínez' },
  { id: 'p4', name: 'Carlos Rodríguez' }
];

// Categoría de músculos para filtrar
const MUSCLE_CATEGORIES = [
  'Todos',
  'Pecho',
  'Espalda',
  'Piernas',
  'Hombros',
  'Bíceps',
  'Tríceps',
  'Abdominales',
  'Core',
  'Cardio'
];

export default function WorkoutPlanPage() {
  // Estado para el plan de entrenamiento actual
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan>({
    id: 'wp1',
    name: 'Nueva Rutina',
    patientId: '',
    days: [
      {
        id: 'd1',
        name: 'Día 1',
        exercises: []
      }
    ]
  });
  
  // Estado para planes guardados
  const [savedPlans, setSavedPlans] = useState<WorkoutPlan[]>([]);
  
  // Estado para mostrar/ocultar el selector de ejercicios
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  
  // Estado para filtrar ejercicios
  const [filterMuscle, setFilterMuscle] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Obtener ejercicios filtrados
  const getFilteredExercises = () => {
    return COMMON_EXERCISES.filter(exercise => {
      const matchesMuscle = filterMuscle === 'Todos' || exercise.muscle === filterMuscle;
      const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesMuscle && matchesSearch;
    });
  };
  
  // Añadir día de entrenamiento
  const addWorkoutDay = () => {
    const newDay: WorkoutDay = {
      id: `d${Date.now()}`,
      name: `Día ${workoutPlan.days.length + 1}`,
      exercises: []
    };
    
    setWorkoutPlan({
      ...workoutPlan,
      days: [...workoutPlan.days, newDay]
    });
  };
  
  // Eliminar día de entrenamiento
  const removeWorkoutDay = (dayIndex: number) => {
    const updatedDays = [...workoutPlan.days];
    updatedDays.splice(dayIndex, 1);
    
    setWorkoutPlan({
      ...workoutPlan,
      days: updatedDays
    });
  };
  
  // Renombrar día de entrenamiento
  const renameWorkoutDay = (dayIndex: number, newName: string) => {
    const updatedDays = [...workoutPlan.days];
    updatedDays[dayIndex] = {
      ...updatedDays[dayIndex],
      name: newName
    };
    
    setWorkoutPlan({
      ...workoutPlan,
      days: updatedDays
    });
  };
  
  // Abrir selector de ejercicios
  const openExerciseSelector = (dayIndex: number) => {
    setCurrentDayIndex(dayIndex);
    setShowExerciseSelector(true);
  };
  
  // Añadir ejercicio al día seleccionado
  const addExerciseToDay = (exercise: { id: string; name: string; muscle: string }): void => {
    const updatedDays = [...workoutPlan.days];
    updatedDays[currentDayIndex].exercises.push({
      id: `${exercise.id}-${Date.now()}`,
      name: exercise.name,
      muscle: exercise.muscle,
      sets: 3,
      reps: '10-12',
      rest: 60
    });
    
    setWorkoutPlan({
      ...workoutPlan,
      days: updatedDays
    });
  };
  
  // Añadir ejercicio personalizado
  const addCustomExercise = () => {
    const customExercise: Exercise = {
      id: `custom-${Date.now()}`,
      name: 'Nuevo ejercicio',
      muscle: 'Otro',
      sets: 3,
      reps: '10',
      rest: 60
    };
    
    const updatedDays = [...workoutPlan.days];
    updatedDays[currentDayIndex].exercises.push(customExercise);
    
    setWorkoutPlan({
      ...workoutPlan,
      days: updatedDays
    });
    
    setShowExerciseSelector(false);
  };
  
  // Eliminar ejercicio
  const removeExercise = (dayIndex: number, exerciseIndex: number) => {
    const updatedDays = [...workoutPlan.days];
    updatedDays[dayIndex].exercises.splice(exerciseIndex, 1);
    
    setWorkoutPlan({
      ...workoutPlan,
      days: updatedDays
    });
  };
  
  // Actualizar datos de ejercicio
  const updateExercise = (dayIndex: number, exerciseIndex: number, field: string, value: any) => {
    const updatedDays = [...workoutPlan.days];
    updatedDays[dayIndex].exercises[exerciseIndex] = {
      ...updatedDays[dayIndex].exercises[exerciseIndex],
      [field]: value
    };
    
    setWorkoutPlan({
      ...workoutPlan,
      days: updatedDays
    });
  };
  
  // Mover ejercicio hacia arriba
  const moveExerciseUp = (dayIndex: number, exerciseIndex: number) => {
    if (exerciseIndex === 0) return;
    
    const updatedDays = [...workoutPlan.days];
    const exercises = updatedDays[dayIndex].exercises;
    const temp = exercises[exerciseIndex];
    exercises[exerciseIndex] = exercises[exerciseIndex - 1];
    exercises[exerciseIndex - 1] = temp;
    
    setWorkoutPlan({
      ...workoutPlan,
      days: updatedDays
    });
  };
  
  // Mover ejercicio hacia abajo
  const moveExerciseDown = (dayIndex: number, exerciseIndex: number) => {
    const updatedDays = [...workoutPlan.days];
    const exercises = updatedDays[dayIndex].exercises;
    
    if (exerciseIndex === exercises.length - 1) return;
    
    const temp = exercises[exerciseIndex];
    exercises[exerciseIndex] = exercises[exerciseIndex + 1];
    exercises[exerciseIndex + 1] = temp;
    
    setWorkoutPlan({
      ...workoutPlan,
      days: updatedDays
    });
  };
  
  // Actualizar datos del plan
  const updatePlanInfo = (field: string, value: string) => {
    setWorkoutPlan({
      ...workoutPlan,
      [field]: value
    });
  };
  
  // Guardar plan completo
  const savePlan = () => {
    if (!workoutPlan.name || !workoutPlan.patientId) {
      alert('Por favor, complete el nombre de la rutina y seleccione un paciente');
      return;
    }
    
    // Crear copia con ID único
    const planToSave = {
      ...workoutPlan,
      id: `wp${Date.now()}`
    };
    
    setSavedPlans([...savedPlans, planToSave]);
    
    // Reiniciar formulario
    setWorkoutPlan({
      id: `wp${Date.now() + 1}`,
      name: 'Nueva Rutina',
      patientId: '',
      days: [
        {
          id: `d${Date.now() + 1}`,
          name: 'Día 1',
          exercises: []
        }
      ]
    });
  };
  
  // Cargar plan guardado
  const loadPlan = (plan: WorkoutPlan) => {
    setWorkoutPlan({...plan});
  };
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Programa de Entrenamiento</h1>
      
      {/* Planes guardados */}
      {savedPlans.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Rutinas Guardadas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedPlans.map((plan, index) => (
              <div 
                key={plan.id} 
                className="bg-white p-4 rounded-lg shadow border cursor-pointer hover:border-blue-500"
                onClick={() => loadPlan(plan)}
              >
                <h3 className="font-semibold">{plan.name}</h3>
                <p className="text-gray-600 text-sm">
                  Paciente: {PATIENTS.find(p => p.id === plan.patientId)?.name}
                </p>
                <p className="text-gray-600 text-sm">
                  {plan.days.length} días, {plan.days.reduce((acc, day) => acc + day.exercises.length, 0)} ejercicios
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Información del plan */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow border">
        <h2 className="text-xl font-semibold mb-4">Información del plan</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la rutina
            </label>
            <input
              type="text"
              value={workoutPlan.name}
              onChange={(e) => updatePlanInfo('name', e.target.value)}
              className="p-2 border rounded w-full"
              placeholder="Ej: Rutina full-body, Hipertrofia, etc."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Paciente
            </label>
            <select
              value={workoutPlan.patientId}
              onChange={(e) => updatePlanInfo('patientId', e.target.value)}
              className="p-2 border rounded w-full"
            >
              <option value="">Seleccionar paciente</option>
              {PATIENTS.map(patient => (
                <option key={patient.id} value={patient.id}>
                  {patient.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Días de entrenamiento */}
      {workoutPlan.days.map((day, dayIndex) => (
        <div key={day.id} className="mb-6 bg-white p-4 rounded-lg shadow border">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={day.name}
                onChange={(e) => renameWorkoutDay(dayIndex, e.target.value)}
                className="text-xl font-semibold bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none"
              />
            </div>
            
            <div>
              <button 
                onClick={() => removeWorkoutDay(dayIndex)}
                disabled={workoutPlan.days.length <= 1}
                className="text-red-500 p-1 disabled:opacity-50"
                title="Eliminar día"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Lista de ejercicios */}
          <div className="mb-4">
            {day.exercises.length === 0 ? (
              <div className="text-center py-8 border border-dashed rounded-lg">
                <p className="text-gray-500">Aún no hay ejercicios para este día</p>
                <button
                  onClick={() => openExerciseSelector(dayIndex)}
                  className="mt-2 text-blue-500 underline"
                >
                  Añadir ejercicio
                </button>
              </div>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-2 text-left">Ejercicio</th>
                    <th className="p-2 text-left">Series</th>
                    <th className="p-2 text-left">Repeticiones</th>
                    <th className="p-2 text-left">Descanso (s)</th>
                    <th className="p-2 text-left">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {day.exercises.map((exercise, exerciseIndex) => (
                    <tr key={exercise.id} className="border-b">
                      <td className="p-2">
                        <div>
                          <input
                            type="text"
                            value={exercise.name}
                            onChange={(e) => updateExercise(dayIndex, exerciseIndex, 'name', e.target.value)}
                            className="w-full border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                          />
                          <div className="text-xs text-gray-500">{exercise.muscle}</div>
                        </div>
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={exercise.sets}
                          onChange={(e) => updateExercise(dayIndex, exerciseIndex, 'sets', parseInt(e.target.value) || 0)}
                          className="w-16 p-1 border rounded"
                          min="1"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={exercise.reps}
                          onChange={(e) => updateExercise(dayIndex, exerciseIndex, 'reps', e.target.value)}
                          className="w-20 p-1 border rounded"
                          placeholder="10-12"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={exercise.rest}
                          onChange={(e) => updateExercise(dayIndex, exerciseIndex, 'rest', parseInt(e.target.value) || 0)}
                          className="w-16 p-1 border rounded"
                          min="0"
                        />
                      </td>
                      <td className="p-2">
                        <div className="flex gap-1">
                          <button 
                            onClick={() => moveExerciseUp(dayIndex, exerciseIndex)}
                            disabled={exerciseIndex === 0}
                            className="text-gray-500 p-1 disabled:opacity-30"
                            title="Mover arriba"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => moveExerciseDown(dayIndex, exerciseIndex)}
                            disabled={exerciseIndex === day.exercises.length - 1}
                            className="text-gray-500 p-1 disabled:opacity-30"
                            title="Mover abajo"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => removeExercise(dayIndex, exerciseIndex)}
                            className="text-red-500 p-1"
                            title="Eliminar"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          <div className="text-right">
            <button
              onClick={() => openExerciseSelector(dayIndex)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm flex items-center ml-auto"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Añadir ejercicio
            </button>
          </div>
        </div>
      ))}
      
      {/* Botón para añadir día */}
      <div className="mb-6">
        <button
          onClick={addWorkoutDay}
          className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Añadir otro día
        </button>
      </div>
      
      {/* Botón de guardar */}
      <div className="text-right mb-10">
        <button
          onClick={savePlan}
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-md"
        >
          Guardar rutina
        </button>
      </div>
      
      {/* Modal de selección de ejercicios */}
      {showExerciseSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-medium">Añadir ejercicio a {workoutPlan.days[currentDayIndex].name}</h3>
              <button 
                onClick={() => setShowExerciseSelector(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4 border-b">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Buscar ejercicio
                  </label>
                  <input
                    type="text"
                    placeholder="Nombre del ejercicio..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="p-2 border rounded w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grupo muscular
                  </label>
                  <select
                    value={filterMuscle}
                    onChange={(e) => setFilterMuscle(e.target.value)}
                    className="p-2 border rounded w-full"
                  >
                    {MUSCLE_CATEGORIES.map(muscle => (
                      <option key={muscle} value={muscle}>
                        {muscle}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {getFilteredExercises().map(exercise => (
                  <div 
                    key={exercise.id}
                    className="p-3 border rounded hover:bg-blue-50 cursor-pointer"
                    onClick={() => {
                      addExerciseToDay(exercise);
                      setShowExerciseSelector(false);
                    }}
                  >
                    <div className="font-medium">{exercise.name}</div>
                    <div className="text-sm text-gray-500">{exercise.muscle}</div>
                  </div>
                ))}
              </div>
              
              {getFilteredExercises().length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No se encontraron ejercicios</p>
                  <button
                    onClick={addCustomExercise}
                    className="mt-2 text-blue-500 underline"
                  >
                    Añadir ejercicio personalizado
                  </button>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t bg-gray-50 flex justify-between">
              <button
                onClick={() => setShowExerciseSelector(false)}
                className="text-gray-600 hover:text-gray-800 px-4 py-2"
              >
                Cancelar
              </button>
              <button
                onClick={addCustomExercise}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                Ejercicio personalizado
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}