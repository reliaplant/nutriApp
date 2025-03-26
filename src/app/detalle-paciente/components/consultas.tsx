'use client'

import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { Consultation, consultationService, db } from '@/app/shared/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import CreateConsultation from './createConsultation';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para modales y gestión de consultas
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [consultationToDelete, setConsultationToDelete] = useState<string | null>(null);
  const [consultationToEdit, setConsultationToEdit] = useState<Consultation | null>(null);

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

  const handleConsultationCreated = (newConsultation: Consultation) => {
    if (consultationToEdit) {
      // Si estábamos editando, actualizamos la consulta existente
      setConsultations(prev => prev.map(c => 
        c.id === newConsultation.id ? newConsultation : c
      ));
      setConsultationToEdit(null);
    } else {
      // Si era nueva, la añadimos al listado
      setConsultations(prev => [newConsultation, ...prev]);
    }
  };
  
  const handleEditClick = (consultation: Consultation) => {
    setConsultationToEdit(consultation);
    setShowCreateModal(true);
  };
  
  const handleDeleteClick = (consultationId: string) => {
    setConsultationToDelete(consultationId);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!consultationToDelete) {
      console.error("No hay consulta seleccionada para eliminar");
      return;
    }
    
    setLoading(true);
    try {
      console.log(`Eliminando consulta ${consultationToDelete} para paciente ${patientId}`);
      
      // Verificar que la consulta existe antes de intentar eliminarla
      const consultationExists = consultations.some(c => c.id === consultationToDelete);
      if (!consultationExists) {
        console.error(`La consulta ${consultationToDelete} no existe en el estado local`);
        setError("La consulta que intentas eliminar no existe");
        setLoading(false);
        return;
      }
      
      // Guardar el estado de la consulta antes de eliminarla
      const consultationToDeleteData = consultations.find(c => c.id === consultationToDelete);
      const wasScheduled = consultationToDeleteData?.status === 'scheduled';
      
      // Eliminar la consulta en Firestore
      await consultationService.deleteConsultation(patientId, consultationToDelete);
      
      // Si la consulta era programada, actualizar manualmente nextAppointmentDate
      if (wasScheduled) {
        console.log("Era una consulta programada, actualizando nextAppointmentDate manualmente");
        
        // Obtener consultas restantes después de la eliminación
        const remainingConsultations = consultations.filter(c => c.id !== consultationToDelete);
        const scheduledConsultations = remainingConsultations
          .filter(c => c.status === 'scheduled')
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        // Actualizar directamente el campo nextAppointmentDate del paciente
        const patientRef = doc(db, "patients", patientId);
        
        if (scheduledConsultations.length > 0) {
          console.log(`Próxima consulta programada: ${scheduledConsultations[0].date}`);
          await updateDoc(patientRef, {
            nextAppointmentDate: scheduledConsultations[0].date,
            updatedAt: serverTimestamp()
          });
        } else {
          console.log("No hay más consultas programadas");
          await updateDoc(patientRef, {
            nextAppointmentDate: null,
            updatedAt: serverTimestamp()
          });
        }
      }
      
      // Actualizar el estado local después de la eliminación exitosa
      const updatedConsultations = consultations.filter(c => c.id !== consultationToDelete);
      setConsultations(updatedConsultations);
      
      // Notificar al componente padre si es necesario
      if (onConsultationsChange) {
        onConsultationsChange(updatedConsultations);
      }
      
      // Cerrar modal de confirmación
      setIsDeleteModalOpen(false);
      setConsultationToDelete(null);
      
      console.log("Consulta eliminada exitosamente");
    } catch (error) {
      console.error("Error al eliminar consulta:", error);
      
      // Mensaje de error más descriptivo
      if (error instanceof Error) {
        setError(`Error al eliminar consulta: ${error.message}`);
      } else {
        setError("Error desconocido al eliminar la consulta");
      }
      
      // Si el error es "Consulta no encontrada", actualicemos el estado local de todas formas
      if (error instanceof Error && error.message.includes("Consulta no encontrada")) {
        console.log("La consulta no se encontró en Firestore, actualizando estado local");
        
        // Actualizar el estado local aunque falle en Firestore
        const updatedConsultations = consultations.filter(c => c.id !== consultationToDelete);
        setConsultations(updatedConsultations);
        
        // Notificar al componente padre
        if (onConsultationsChange) {
          onConsultationsChange(updatedConsultations);
        }
        
        // Cerrar modal
        setIsDeleteModalOpen(false);
        setConsultationToDelete(null);
      }
    } finally {
      setLoading(false);
    }
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
              setConsultationToEdit(null);
              setShowCreateModal(true);
            }}
            className={`text-white rounded px-3 py-1 text-sm flex items-center ${
              hasScheduledConsultation 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
            disabled={hasScheduledConsultation}
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nueva consulta
          </button>
          {hasScheduledConsultation && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              Ya existe una consulta programada
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      {loading && consultations.length === 0 ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div>
          {/* Scheduled consultations section */}
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
                        onClick={() => handleEditClick(consultation)}
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

          {/* Previous consultations section */}
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

      {/* Modales */}
      <CreateConsultation
        patientId={patientId}
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setConsultationToEdit(null);
        }}
        onConsultationCreated={handleConsultationCreated}
        isEditing={!!consultationToEdit}
        consultationToEdit={consultationToEdit}
      />

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
                onClick={handleDeleteConfirm}
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