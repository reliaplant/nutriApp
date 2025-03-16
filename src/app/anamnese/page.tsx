'use client'
import { useState } from 'react';

interface Patient {
  id: string;
  name: string;
}

interface AnamnesisData {
  // Datos personales
  patientId: string;
  date: string;
  
  // Antropometría
  weight: number;
  height: number;
  bmi?: number; // Calculado
  waistCircumference?: number;
  hipCircumference?: number;
  bodyFatPercentage?: number;
  
  // Historia clínica
  medicalHistory: string;
  currentMedications: string;
  allergies: string;
  surgeries: string;
  
  // Historia familiar
  familyHistory: string;
  
  // Hábitos
  sleepHours: number;
  physicalActivity: string;
  activityFrequency: string;
  alcoholConsumption: string;
  smoking: string;
  waterIntake: number;
  
  // Hábitos alimentarios
  mealsPerDay: number;
  eatingOut: string;
  foodPreferences: string;
  foodRestrictions: string;
  weightHistory: string;
  previousDiets: string;
  
  // Objetivos
  nutritionalGoals: string;
}

const emptyAnamnesis: Omit<AnamnesisData, 'patientId'> = {
  date: new Date().toISOString().split('T')[0],
  weight: 0,
  height: 0,
  medicalHistory: '',
  currentMedications: '',
  allergies: '',
  surgeries: '',
  familyHistory: '',
  sleepHours: 8,
  physicalActivity: '',
  activityFrequency: '',
  alcoholConsumption: '',
  smoking: '',
  waterIntake: 0,
  mealsPerDay: 3,
  eatingOut: '',
  foodPreferences: '',
  foodRestrictions: '',
  weightHistory: '',
  previousDiets: '',
  nutritionalGoals: ''
};

export default function AnamnesisPage() {
  // Lista simulada de pacientes
  const [patients, setPatients] = useState<Patient[]>([
    { id: '1', name: 'María García' },
    { id: '2', name: 'Juan López' },
    { id: '3', name: 'Ana Martínez' },
    { id: '4', name: 'Carlos Rodríguez' }
  ]);

  // Estado para formulario de anamnesis
  const [anamnesis, setAnamnesis] = useState<AnamnesisData>({
    ...emptyAnamnesis,
    patientId: ''
  });
  
  // Estado para resultados guardados
  const [savedResults, setSavedResults] = useState<AnamnesisData[]>([]);
  
  // Estado para visualizar anamnesis existente
  const [viewingAnamnesis, setViewingAnamnesis] = useState<AnamnesisData | null>(null);

  // Calcular IMC
  const calculateBMI = (weight: number, height: number): number => {
    if (!weight || !height) return 0;
    const heightInMeters = height / 100;
    return weight / (heightInMeters * heightInMeters);
  };
  
  // Manejar cambios en el formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setAnamnesis(prev => {
      const updatedAnamnesis = { ...prev, [name]: value };
      
      // Recalcular IMC si se cambia peso o altura
      if (name === 'weight' || name === 'height') {
        updatedAnamnesis.bmi = calculateBMI(
          name === 'weight' ? parseFloat(value) : prev.weight,
          name === 'height' ? parseFloat(value) : prev.height
        );
      }
      
      return updatedAnamnesis;
    });
  };

  // Guardar anamnesis
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que haya un paciente seleccionado
    if (!anamnesis.patientId) {
      alert('Por favor, seleccione un paciente');
      return;
    }
    
    // Añadir a resultados guardados
    setSavedResults([...savedResults, { ...anamnesis }]);
    
    // Reiniciar formulario
    setAnamnesis({
      ...emptyAnamnesis,
      patientId: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  // Ver anamnesis existente
  const viewAnamnesis = (anamnesisData: AnamnesisData) => {
    setViewingAnamnesis(anamnesisData);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Anamnesis Nutricional</h1>
      
      {viewingAnamnesis ? (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              Anamnesis de {patients.find(p => p.id === viewingAnamnesis.patientId)?.name} ({viewingAnamnesis.date})
            </h2>
            <button 
              className="bg-gray-300 px-3 py-1 rounded"
              onClick={() => setViewingAnamnesis(null)}
            >
              Volver
            </button>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <h3 className="font-medium">Datos Antropométricos</h3>
                <p>Peso: {viewingAnamnesis.weight} kg</p>
                <p>Altura: {viewingAnamnesis.height} cm</p>
                <p>IMC: {viewingAnamnesis.bmi?.toFixed(2)}</p>
                {viewingAnamnesis.waistCircumference && <p>Circunferencia de cintura: {viewingAnamnesis.waistCircumference} cm</p>}
                {viewingAnamnesis.hipCircumference && <p>Circunferencia de cadera: {viewingAnamnesis.hipCircumference} cm</p>}
              </div>
              
              <div>
                <h3 className="font-medium">Historia Clínica</h3>
                <p>Antecedentes: {viewingAnamnesis.medicalHistory || 'Ninguno'}</p>
                <p>Medicamentos: {viewingAnamnesis.currentMedications || 'Ninguno'}</p>
                <p>Alergias: {viewingAnamnesis.allergies || 'Ninguna'}</p>
              </div>
            </div>
            
            <div className="mb-4">
              <h3 className="font-medium">Hábitos</h3>
              <p>Actividad física: {viewingAnamnesis.physicalActivity}, {viewingAnamnesis.activityFrequency}</p>
              <p>Horas de sueño: {viewingAnamnesis.sleepHours}</p>
              <p>Consumo de alcohol: {viewingAnamnesis.alcoholConsumption || 'No'}</p>
              <p>Tabaquismo: {viewingAnamnesis.smoking || 'No'}</p>
              <p>Consumo de agua: {viewingAnamnesis.waterIntake} litros/día</p>
            </div>
            
            <div className="mb-4">
              <h3 className="font-medium">Hábitos Alimentarios</h3>
              <p>Comidas al día: {viewingAnamnesis.mealsPerDay}</p>
              <p>Come fuera: {viewingAnamnesis.eatingOut}</p>
              <p>Preferencias: {viewingAnamnesis.foodPreferences}</p>
              <p>Restricciones: {viewingAnamnesis.foodRestrictions || 'Ninguna'}</p>
            </div>
            
            <div>
              <h3 className="font-medium">Objetivos</h3>
              <p>{viewingAnamnesis.nutritionalGoals}</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Sección de anamnesis anteriores */}
          {savedResults.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-3">Anamnesis Anteriores</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 text-left">Paciente</th>
                      <th className="p-2 text-left">Fecha</th>
                      <th className="p-2 text-left">Peso</th>
                      <th className="p-2 text-left">IMC</th>
                      <th className="p-2 text-left">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {savedResults.map((result, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">
                          {patients.find(p => p.id === result.patientId)?.name}
                        </td>
                        <td className="p-2">{result.date}</td>
                        <td className="p-2">{result.weight} kg</td>
                        <td className="p-2">{result.bmi?.toFixed(2)}</td>
                        <td className="p-2">
                          <button 
                            onClick={() => viewAnamnesis(result)}
                            className="bg-blue-500 text-white px-3 py-1 rounded"
                          >
                            Ver
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Formulario de anamnesis */}
          <form onSubmit={handleSubmit}>
            <div className="mb-6 bg-white p-4 rounded-lg shadow border">
              <h2 className="text-xl font-semibold mb-4">Datos generales</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Paciente*
                  </label>
                  <select 
                    name="patientId"
                    value={anamnesis.patientId}
                    onChange={handleChange}
                    className="p-2 border rounded w-full"
                    required
                  >
                    <option value="">Seleccionar paciente</option>
                    {patients.map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={anamnesis.date}
                    onChange={handleChange}
                    className="p-2 border rounded w-full"
                  />
                </div>
              </div>
            </div>
            
            <div className="mb-6 bg-white p-4 rounded-lg shadow border">
              <h2 className="text-xl font-semibold mb-4">Datos antropométricos</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Peso (kg)*
                  </label>
                  <input
                    type="number"
                    name="weight"
                    value={anamnesis.weight || ''}
                    onChange={handleChange}
                    step="0.1"
                    className="p-2 border rounded w-full"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Altura (cm)*
                  </label>
                  <input
                    type="number"
                    name="height"
                    value={anamnesis.height || ''}
                    onChange={handleChange}
                    step="0.1"
                    className="p-2 border rounded w-full"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    IMC
                  </label>
                  <input
                    type="number"
                    value={anamnesis.bmi?.toFixed(2) || ''}
                    className="p-2 border rounded w-full bg-gray-50"
                    readOnly
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Circunferencia de cintura (cm)
                  </label>
                  <input
                    type="number"
                    name="waistCircumference"
                    value={anamnesis.waistCircumference || ''}
                    onChange={handleChange}
                    step="0.1"
                    className="p-2 border rounded w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Circunferencia de cadera (cm)
                  </label>
                  <input
                    type="number"
                    name="hipCircumference"
                    value={anamnesis.hipCircumference || ''}
                    onChange={handleChange}
                    step="0.1"
                    className="p-2 border rounded w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Porcentaje de grasa corporal
                  </label>
                  <input
                    type="number"
                    name="bodyFatPercentage"
                    value={anamnesis.bodyFatPercentage || ''}
                    onChange={handleChange}
                    step="0.1"
                    className="p-2 border rounded w-full"
                  />
                </div>
              </div>
            </div>
            
            <div className="mb-6 bg-white p-4 rounded-lg shadow border">
              <h2 className="text-xl font-semibold mb-4">Historia clínica</h2>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Antecedentes médicos
                  </label>
                  <textarea
                    name="medicalHistory"
                    value={anamnesis.medicalHistory}
                    onChange={handleChange}
                    className="p-2 border rounded w-full"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Medicamentos actuales
                  </label>
                  <textarea
                    name="currentMedications"
                    value={anamnesis.currentMedications}
                    onChange={handleChange}
                    className="p-2 border rounded w-full"
                    rows={2}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alergias e intolerancias
                  </label>
                  <textarea
                    name="allergies"
                    value={anamnesis.allergies}
                    onChange={handleChange}
                    className="p-2 border rounded w-full"
                    rows={2}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cirugías
                  </label>
                  <textarea
                    name="surgeries"
                    value={anamnesis.surgeries}
                    onChange={handleChange}
                    className="p-2 border rounded w-full"
                    rows={2}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Antecedentes familiares
                  </label>
                  <textarea
                    name="familyHistory"
                    value={anamnesis.familyHistory}
                    onChange={handleChange}
                    className="p-2 border rounded w-full"
                    rows={2}
                  />
                </div>
              </div>
            </div>
            
            <div className="mb-6 bg-white p-4 rounded-lg shadow border">
              <h2 className="text-xl font-semibold mb-4">Hábitos</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Horas de sueño
                  </label>
                  <input
                    type="number"
                    name="sleepHours"
                    value={anamnesis.sleepHours || ''}
                    onChange={handleChange}
                    className="p-2 border rounded w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de actividad física
                  </label>
                  <select
                    name="physicalActivity"
                    value={anamnesis.physicalActivity}
                    onChange={handleChange}
                    className="p-2 border rounded w-full"
                  >
                    <option value="">Seleccionar</option>
                    <option value="Sedentario">Sedentario</option>
                    <option value="Ligero">Ligero</option>
                    <option value="Moderado">Moderado</option>
                    <option value="Activo">Activo</option>
                    <option value="Muy activo">Muy activo</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frecuencia de actividad física
                  </label>
                  <select
                    name="activityFrequency"
                    value={anamnesis.activityFrequency}
                    onChange={handleChange}
                    className="p-2 border rounded w-full"
                  >
                    <option value="">Seleccionar</option>
                    <option value="Nunca">Nunca</option>
                    <option value="1-2 veces/semana">1-2 veces/semana</option>
                    <option value="3-4 veces/semana">3-4 veces/semana</option>
                    <option value="5-7 veces/semana">5-7 veces/semana</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Consumo de alcohol
                  </label>
                  <select
                    name="alcoholConsumption"
                    value={anamnesis.alcoholConsumption}
                    onChange={handleChange}
                    className="p-2 border rounded w-full"
                  >
                    <option value="">Seleccionar</option>
                    <option value="Nunca">Nunca</option>
                    <option value="Ocasional">Ocasional</option>
                    <option value="Frecuente">Frecuente</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tabaquismo
                  </label>
                  <select
                    name="smoking"
                    value={anamnesis.smoking}
                    onChange={handleChange}
                    className="p-2 border rounded w-full"
                  >
                    <option value="">Seleccionar</option>
                    <option value="No fumador">No fumador</option>
                    <option value="Exfumador">Exfumador</option>
                    <option value="Fumador">Fumador</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Consumo de agua (litros/día)
                  </label>
                  <input
                    type="number"
                    name="waterIntake"
                    value={anamnesis.waterIntake || ''}
                    onChange={handleChange}
                    step="0.1"
                    className="p-2 border rounded w-full"
                  />
                </div>
              </div>
            </div>
            
            <div className="mb-6 bg-white p-4 rounded-lg shadow border">
              <h2 className="text-xl font-semibold mb-4">Hábitos alimentarios</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de comidas al día
                  </label>
                  <input
                    type="number"
                    name="mealsPerDay"
                    value={anamnesis.mealsPerDay || ''}
                    onChange={handleChange}
                    className="p-2 border rounded w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frecuencia de comidas fuera de casa
                  </label>
                  <select
                    name="eatingOut"
                    value={anamnesis.eatingOut}
                    onChange={handleChange}
                    className="p-2 border rounded w-full"
                  >
                    <option value="">Seleccionar</option>
                    <option value="Nunca">Nunca</option>
                    <option value="1-3 veces/mes">1-3 veces/mes</option>
                    <option value="1-2 veces/semana">1-2 veces/semana</option>
                    <option value="3-5 veces/semana">3-5 veces/semana</option>
                    <option value="Diariamente">Diariamente</option>
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preferencias alimentarias
                  </label>
                  <textarea
                    name="foodPreferences"
                    value={anamnesis.foodPreferences}
                    onChange={handleChange}
                    className="p-2 border rounded w-full"
                    rows={2}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Restricciones alimentarias
                  </label>
                  <textarea
                    name="foodRestrictions"
                    value={anamnesis.foodRestrictions}
                    onChange={handleChange}
                    className="p-2 border rounded w-full"
                    rows={2}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Historial de peso
                  </label>
                  <textarea
                    name="weightHistory"
                    value={anamnesis.weightHistory}
                    onChange={handleChange}
                    className="p-2 border rounded w-full"
                    rows={2}
                    placeholder="Cambios de peso anteriores, fluctuaciones, etc."
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dietas anteriores
                  </label>
                  <textarea
                    name="previousDiets"
                    value={anamnesis.previousDiets}
                    onChange={handleChange}
                    className="p-2 border rounded w-full"
                    rows={2}
                  />
                </div>
              </div>
            </div>
            
            <div className="mb-6 bg-white p-4 rounded-lg shadow border">
              <h2 className="text-xl font-semibold mb-4">Objetivos nutricionales</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Objetivos del paciente
                </label>
                <textarea
                  name="nutritionalGoals"
                  value={anamnesis.nutritionalGoals}
                  onChange={handleChange}
                  className="p-2 border rounded w-full"
                  rows={3}
                  placeholder="Pérdida de peso, ganancia de masa muscular, control de enfermedades, etc."
                />
              </div>
            </div>
            
            <div className="mt-6">
              <button
                type="submit"
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded font-medium"
              >
                Guardar Anamnesis
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}