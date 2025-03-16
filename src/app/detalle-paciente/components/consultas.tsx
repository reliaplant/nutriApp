'use client'

import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { Consultation, consultationService } from '@/app/service/firebase';

interface ConsultasProps {
  patientId: string;
  initialConsultations?: Consultation[];
  onConsultationsChange?: (consultations: Consultation[]) => void;
}

const Consultas: React.FC<ConsultasProps> = ({
  patientId,
  initialConsultations = [],
  onConsultationsChange
}) => {
  const router = useRouter();
  const [consultations, setConsultations] = useState<Consultation[]>(initialConsultations);
  const [showNewAppointmentForm, setShowNewAppointmentForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [editingConsultationId, setEditingConsultationId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    date: '',
    time: ''
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [consultationToDelete, setConsultationToDelete] = useState<string | null>(null);

  // Separate consultations into scheduled and completed
  const scheduledConsultations = consultations.filter(c => c.status === 'scheduled');
  const previousConsultations = consultations.filter(c => c.status === 'completed');
  
  // Check if there's already a scheduled consultation
  const hasScheduledConsultation = scheduledConsultations.length > 0;

  useEffect(() => {
    if (onConsultationsChange) {
      onConsultationsChange(consultations);
    }
  }, [consultations, onConsultationsChange]);

  useEffect(() => {
    if (patientId) {
      fetchConsultations();
    }
  }, [patientId]);

  const fetchConsultations = async () => {
    if (!patientId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const fetchedConsultations = await consultationService.getConsultationsByPatient(patientId);
      setConsultations(fetchedConsultations);
    } catch (err) {
      console.error('Error fetching consultations:', err);
      setError('Error al cargar las consultas');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConsultation = async () => {
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
      
      const newConsultation: Consultation = {
        patientId,
        date: dateWithTime,
        status: 'scheduled',
        highlights: []
      };
      
      const consultationId = await consultationService.createConsultation(newConsultation);
      
      const consultationWithId = {
        ...newConsultation,
        id: consultationId
      };
      
      setConsultations(prev => [consultationWithId, ...prev]);
      
      setFormData({
        date: '',
        time: ''
      });
      
      setShowNewAppointmentForm(false);
    } catch (err) {
      console.error('Error creating consultation:', err);
      setError('Error al crear la consulta');
    } finally {
      setLoading(false);
    }
  };
  
  const handleEditConsultation = async (id: string) => {
    if (!id || !formData.date || !formData.time) {
      setError('Todos los campos son obligatorios');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const dateWithTime = `${formData.date}T${formData.time}:00`;
      
      const consultationToUpdate: Partial<Consultation> = {
        patientId,
        date: dateWithTime,
        status: 'scheduled' as const,
      };
      
      await consultationService.updateConsultation(patientId, id, consultationToUpdate);
      
      setConsultations(prev => prev.map(c => 
        c.id === id ? {...c, ...consultationToUpdate, id} : c
      ));
      
      setFormData({
        date: '',
        time: ''
      });
      
      setEditingConsultationId(null);
    } catch (err) {
      console.error('Error updating consultation:', err);
      setError('Error al actualizar la consulta');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteClick = (consultationId: string) => {
    setConsultationToDelete(consultationId);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!consultationToDelete) return;
    
    try {
      setLoading(true);
      await consultationService.deleteConsultation(patientId, consultationToDelete);
      setConsultations(prev => prev.filter(c => c.id !== consultationToDelete));
      setIsDeleteModalOpen(false);
      setConsultationToDelete(null);
    } catch (err) {
      console.error('Error deleting consultation:', err);
      setError('Error al eliminar la consulta');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const startEditing = (consultation: Consultation) => {
    const datePart = consultation.date.split('T')[0];
    const timePart = consultation.date.includes('T') 
      ? consultation.date.split('T')[1].substring(0, 5) 
      : '00:00';
    
    setFormData({
      date: datePart,
      time: timePart
    });
    
    setEditingConsultationId(consultation.id!);
    setShowNewAppointmentForm(false);
  };
  
  const navigateToConsultationPlan = (consultationId: string) => {
    router.push(`/consulta/${consultationId}?patientId=${patientId}`);
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = parseISO(dateString);
      return format(date, "d 'de' MMMM, yyyy - HH:mm", { locale: es });
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className="mb-6 bg-white border border-gray-300 rounded shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-700">Consultas</h2>
        <div className="relative group">
          <button
        onClick={() => {
          setEditingConsultationId(null);
          setShowNewAppointmentForm(true);
          setFormData({ date: '', time: '' });
        }}
        className={`text-white rounded px-3 py-1 text-sm flex items-center ${
          hasScheduledConsultation || !!editingConsultationId 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-emerald-600 hover:bg-emerald-700'
        }`}
        disabled={!!editingConsultationId || hasScheduledConsultation}
          >
        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Nueva consulta
          </button>
          {(!!editingConsultationId || hasScheduledConsultation) && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          {editingConsultationId ? "Estás editando una consulta" : "Ya existe una consulta programada"}
        </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      {showNewAppointmentForm && !editingConsultationId && (
        <div className="border border-gray-200 p-4 rounded-md mb-4 bg-gray-50">
          <h3 className="font-medium text-gray-800 mb-3">Nueva consulta</h3>
          
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
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    step="900"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowNewAppointmentForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleCreateConsultation}
              className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700"
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar consulta'}
            </button>
          </div>
        </div>
      )}
      
      {editingConsultationId && (
        <div className="border border-gray-200 p-4 rounded-md mb-4 bg-gray-50">
          <h3 className="font-medium text-gray-800 mb-3">Editar consulta</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setEditingConsultationId(null)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => handleEditConsultation(editingConsultationId)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700"
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      )}

      {loading && consultations.length === 0 ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div>
          {/* Scheduled consultations section - hide when editing */}
          {!editingConsultationId && (
            <>
              <h3 className="text-sm font-medium text-gray-700 mb-2 mt-4">Consultas programadas</h3>
              {scheduledConsultations.length > 0 ? (
                <div className="space-y-3 mb-6">
                  {scheduledConsultations.map((consultation) => (
                    <div
                      key={consultation.id}
                      className="border rounded-md p-4 bg-white border-gray-200"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="h-3 w-3 rounded-full mr-2 bg-amber-400"></div>
                          <h3 className="font-medium text-gray-800">
                            {formatDate(consultation.date)}
                          </h3>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => navigateToConsultationPlan(consultation.id!)}
                            className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700 hover:bg-gray-200"
                          >
                            Ir a plan
                          </button>
                          <button
                            onClick={() => startEditing(consultation)}
                            className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteClick(consultation.id!)}
                            className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded hover:bg-red-100"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                      
                      {consultation.weight && (
                        <div className="mt-2 text-sm">
                          <span className="font-medium">Peso:</span> {consultation.weight} kg
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 mb-6">
                  No hay consultas programadas
                </div>
              )}
            </>
          )}

          {/* Previous consultations section - always show */}
          <h3 className="text-sm font-medium text-gray-700 mb-2 mt-4">Consultas previas</h3>
          {previousConsultations.length > 0 ? (
            <div className="space-y-3">
              {previousConsultations.map((consultation) => (
                <div
                  key={consultation.id}
                  className="border rounded-md p-4 bg-gray-50 border-gray-200"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="h-3 w-3 rounded-full mr-2 bg-emerald-500"></div>
                      <h3 className="font-medium text-gray-800">
                        {formatDate(consultation.date)}
                      </h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => navigateToConsultationPlan(consultation.id!)}
                        className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700 hover:bg-gray-200"
                      >
                        Ir a plan
                      </button>
                      <button
                        onClick={() => handleDeleteClick(consultation.id!)}
                        className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded hover:bg-red-100"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                  
                  {consultation.weight && (
                    <div className="mt-2 text-sm">
                      <span className="font-medium">Peso:</span> {consultation.weight} kg
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              No hay consultas previas
            </div>
          )}
          
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-green-50/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow relative">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirmar eliminación</h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que deseas eliminar esta consulta? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setConsultationToDelete(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span>Eliminando...</span>
                  </div>
                ) : (
                  'Eliminar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Consultas;