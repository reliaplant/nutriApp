'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { dailyTrackingService, db } from '@/app/shared/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const PatientTrackingPage: React.FC = () => {
  const { patientId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [patientName, setPatientName] = useState<string>('');
  const [formData, setFormData] = useState({
    dietCompliance: 'complete',
    hungerLevel: 'none',
    anxietyLevel: 'none',
    exerciseDone: false,
    exerciseDuration: '',
    exerciseType: '',
    notes: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    weight: '' // Añadir campo para el peso
  });

  useEffect(() => {
    const loadPatientName = async () => {
      if (!patientId) {
        setError("ID de paciente no válido");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        console.log(`Cargando información para paciente: ${patientId}`);
        
        // Verificar si el paciente existe
        const exists = await dailyTrackingService.checkPatientExists(patientId as string);
        
        if (!exists) {
          console.log(`Paciente no encontrado: ${patientId}`);
          setPatientName('Paciente');
          setLoading(false);
          return;
        }
        
        // Obtener solo el nombre, sin realizar validaciones adicionales
        const name = await dailyTrackingService.getPatientName(patientId as string);
        if (name) {
          setPatientName(name);
          console.log(`Nombre de paciente cargado: ${name}`);
        } else {
          setPatientName('Paciente');
          console.log('Usando nombre genérico: Paciente');
        }
      } catch (err) {
        console.error('Error cargando información del paciente:', err);
        setPatientName('Paciente');
      } finally {
        setLoading(false);
      }
    };

    loadPatientName();
  }, [patientId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      console.log(`Enviando seguimiento para paciente: ${patientId}`);
      
      if (!patientId) {
        throw new Error("ID de paciente no válido");
      }
      
      // Preparar datos para guardar
      const trackingData = {
        patientId: patientId as string,
        date: formData.date,
        dietCompliance: formData.dietCompliance as 'complete' | 'partial' | 'none',
        hungerLevel: formData.hungerLevel as 'none' | 'little' | 'moderate' | 'high',
        anxietyLevel: formData.anxietyLevel as 'none' | 'little' | 'moderate' | 'high',
        exerciseDone: formData.exerciseDone,
        exerciseDuration: formData.exerciseDone && formData.exerciseDuration ? parseInt(formData.exerciseDuration) : undefined,
        exerciseType: formData.exerciseDone ? formData.exerciseType : undefined,
        notes: formData.notes.trim() || undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined // Añadir peso al objeto
      };
      
      // Guardar registro
      console.log("Datos a guardar:", trackingData);
      const trackingId = await dailyTrackingService.createTracking(trackingData);
      console.log(`Seguimiento guardado con ID: ${trackingId}`);
      
      // Si hay peso, actualizar también el peso actual del paciente
      if (trackingData.weight) {
        try {
          const patientRef = doc(db, "patients", patientId as string);
          await updateDoc(patientRef, {
            currentWeight: trackingData.weight,
            updatedAt: serverTimestamp()
          });
          console.log(`Peso del paciente actualizado: ${trackingData.weight}kg`);
        } catch (err) {
          // Ignoramos este error, no es crítico
          console.log("Error al actualizar peso del paciente (no crítico):", err);
        }
      }
      
      // Resetear formulario y mostrar mensaje de éxito
      setFormData({
        dietCompliance: 'complete',
        hungerLevel: 'none',
        anxietyLevel: 'none',
        exerciseDone: false,
        exerciseDuration: '',
        exerciseType: '',
        notes: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        weight: '' // Resetear peso
      });
      
      setSuccess(true);
      console.log("Formulario enviado con éxito");
      
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    } catch (err) {
      console.error('Error al guardar seguimiento:', err);
      // Mensaje de error más claro y específico
      setError(err instanceof Error ? 
        `Error: ${err.message}` : 
        'Error al guardar el seguimiento. Inténtalo nuevamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading && !error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <div className="text-red-500 text-center">
            <svg className="h-12 w-12 mx-auto text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-medium mt-2">{error}</h2>
            <p className="mt-2">El enlace puede no ser válido o ha expirado.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-emerald-500 p-4 text-white">
            <h1 className="text-xl font-semibold">Seguimiento Diario</h1>
            {patientName && <p>Hola, {patientName} 👋</p>}
          </div>
          
          <form onSubmit={handleSubmit} className="p-6">
            {success && (
              <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                <div className="flex">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>¡Gracias! Tu seguimiento ha sido registrado correctamente.</span>
                </div>
              </div>
            )}
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            {/* Añadir campo de peso después de la fecha */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Peso actual (kg)
              </label>
              <input
                type="number"
                name="weight"
                step="0.1"
                min="0"
                max="500"
                value={formData.weight}
                onChange={handleInputChange}
                placeholder="Ej: 70.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ¿Cómo has cumplido con tu plan alimenticio hoy?
              </label>
              <select
                name="dietCompliance"
                value={formData.dietCompliance}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="complete">Lo he seguido completamente</option>
                <option value="partial">Lo he seguido parcialmente</option>
                <option value="none">No lo he seguido</option>
              </select>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ¿Has sentido hambre fuera de las comidas?
              </label>
              <select
                name="hungerLevel"
                value={formData.hungerLevel}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="none">Nada de hambre</option>
                <option value="little">Un poco de hambre</option>
                <option value="moderate">Hambre moderada</option>
                <option value="high">Mucha hambre</option>
              </select>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ¿Has sentido ansiedad por comer?
              </label>
              <select
                name="anxietyLevel"
                value={formData.anxietyLevel}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="none">Nada de ansiedad</option>
                <option value="little">Un poco de ansiedad</option>
                <option value="moderate">Ansiedad moderada</option>
                <option value="high">Mucha ansiedad</option>
              </select>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="exerciseDone"
                  id="exerciseDone"
                  checked={formData.exerciseDone}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-emerald-600 rounded"
                />
                <label htmlFor="exerciseDone" className="ml-2 text-sm font-medium text-gray-700">
                  ¿Has hecho ejercicio hoy?
                </label>
              </div>
              
              {formData.exerciseDone && (
                <div className="mt-3 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ¿Qué tipo de ejercicio?
                    </label>
                    <input
                      type="text"
                      name="exerciseType"
                      value={formData.exerciseType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Ej: Caminar, Correr, Ciclismo, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ¿Cuántos minutos?
                    </label>
                    <input
                      type="number"
                      name="exerciseDuration"
                      value={formData.exerciseDuration}
                      onChange={handleInputChange}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas adicionales (opcional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="¿Algo más que quieras comentar sobre tu día?"
              ></textarea>
            </div>
            
            <button 
              type="submit" 
              className="w-full bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 transition-colors"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Enviando...
                </span>
              ) : 'Enviar Seguimiento'}
            </button>
          </form>
        </div>
        <div className="mt-4 text-center text-sm text-gray-500">
          Gracias por completar tu seguimiento diario. Esto ayudará a tu nutricionista a personalizar mejor tu plan.
        </div>
      </div>
    </div>
  );
};

export default PatientTrackingPage;
