'use client'

import React, { useState, useEffect } from 'react';
import { Consultation, consultationService, db } from '@/app/shared/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

interface CreateConsultationProps {
  patientId: string;
  isOpen: boolean;
  onClose: () => void;
  onConsultationCreated: (consultation: Consultation) => void;
  isEditing?: boolean;
  consultationToEdit?: Consultation | null;
}

const CreateConsultation: React.FC<CreateConsultationProps> = ({
  patientId,
  isOpen,
  onClose,
  onConsultationCreated,
  isEditing = false,
  consultationToEdit = null
}) => {
  // Usar useEffect para actualizar el estado cuando cambian las props
  const [formData, setFormData] = useState({
    date: '',
    time: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lista de horas permitidas en formato militar (00:00 a 23:30) con intervalos de 30 minutos
  const availableTimeSlots = Array.from({ length: 48 }).map((_, index) => {
    const hour = Math.floor(index / 2);
    const minutes = index % 2 === 0 ? '00' : '30';
    return `${hour.toString().padStart(2, '0')}:${minutes}`;
  });

  // Actualizar el formData cuando cambia consultationToEdit o isOpen
  useEffect(() => {
    if (isOpen && isEditing && consultationToEdit) {
      // Extraer fecha y hora del formato ISO
      const dateString = consultationToEdit.date.split('T')[0];
      const timeString = consultationToEdit.date.includes('T') ? 
        consultationToEdit.date.split('T')[1].substring(0, 5) : 
        '00:00';
      
      console.log("Precargando datos para edición:", { dateString, timeString });
      
      setFormData({
        date: dateString,
        time: timeString
      });
    } else if (isOpen && !isEditing) {
      // Resetear el formulario si se está creando una nueva consulta
      setFormData({
        date: '',
        time: ''
      });
    }
  }, [isOpen, isEditing, consultationToEdit]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.date) {
      setError('La fecha es obligatoria');
      return;
    }

    if (!formData.time) {
      setError('La hora es obligatoria');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const dateWithTime = `${formData.date}T${formData.time}:00`;
      
      if (isEditing && consultationToEdit?.id) {
        // Actualizar consulta existente
        const consultationToUpdate: Partial<Consultation> = {
          date: dateWithTime,
          status: 'scheduled',
        };
        
        await consultationService.updateConsultation(
          patientId, 
          consultationToEdit.id, 
          consultationToUpdate
        );
        
        // También actualizar el nextAppointmentDate del paciente si es necesario
        const patientRef = doc(db, "patients", patientId);
        await updateDoc(patientRef, {
          nextAppointmentDate: dateWithTime,
          updatedAt: serverTimestamp()
        });
        
        onConsultationCreated({
          ...consultationToEdit,
          ...consultationToUpdate,
        });
      } else {
        // Crear nueva consulta
        const newConsultation: Consultation = {
          patientId,
          date: dateWithTime,
          status: 'scheduled',
          highlights: []
        };
        
        const consultationId = await consultationService.createConsultation(newConsultation);
        
        onConsultationCreated({
          ...newConsultation,
          id: consultationId
        });
      }
      
      // Reset form and close modal
      setFormData({ date: '', time: '' });
      onClose();
    } catch (err) {
      console.error('Error saving consultation:', err);
      setError(`Error al ${isEditing ? 'actualizar' : 'crear'} la consulta`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-800/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow">
        <h2 className="text-xl font-semibold mb-4">
          {isEditing ? 'Editar consulta' : 'Nueva consulta'}
        </h2>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
            {error}
          </div>
        )}
        
        <div className="mb-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
              <select
                name="time"
                value={formData.time}
                onChange={handleInputChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md"
              >
                <option value="">Selecciona una hora</option>
                {availableTimeSlots.map(timeSlot => (
                  <option key={timeSlot} value={timeSlot}>
                    {timeSlot}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700"
            disabled={loading}
          >
            {loading ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Guardar consulta'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateConsultation;