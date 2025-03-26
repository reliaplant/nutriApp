'use client';

import React, { useState, useEffect } from 'react';
import { dailyTrackingService } from '@/app/shared/firebase';
import { DailyTracking } from '@/app/shared/interfaces';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface TrackingSummaryProps {
  patientId: string;
}

const TrackingSummary: React.FC<TrackingSummaryProps> = ({ patientId }) => {
  const [trackings, setTrackings] = useState<DailyTracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchTrackings = async () => {
      if (!patientId) return;
      
      try {
        setLoading(true);
        const fetchedTrackings = await dailyTrackingService.getTrackingsByPatient(patientId);
        setTrackings(fetchedTrackings);
      } catch (err) {
        console.error('Error fetching trackings:', err);
        setError('Error al cargar los seguimientos');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTrackings();
  }, [patientId]);
  
  const formatDate = (dateString: string): string => {
    try {
      return format(parseISO(dateString), "d 'de' MMMM, yyyy", { locale: es });
    } catch (error) {
      return dateString;
    }
  };
  
  const getStatusTag = (tracking: DailyTracking) => {
    const tags: Record<string, { color: string, text: string }> = {
      complete: { color: 'bg-green-100 text-green-800', text: 'Completo' },
      partial: { color: 'bg-yellow-100 text-yellow-800', text: 'Parcial' },
      none: { color: 'bg-red-100 text-red-800', text: 'No cumplido' }
    };
    
    return tags[tracking.dietCompliance] || { color: 'bg-gray-100 text-gray-800', text: 'Desconocido' };
  };

  return (
    <div className="mb-6 bg-white border border-gray-300 rounded shadow-md p-6">
      <h3 className="text-lg font-medium mb-4">Registro de Seguimiento Diario</h3>
      
      {loading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-3 rounded-md">
          {error}
        </div>
      ) : trackings.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          <p>El paciente aún no ha registrado ningún seguimiento diario.</p>
          <p className="text-sm mt-2">Comparte el enlace para que pueda comenzar a registrar su progreso.</p>
        </div>
      ) : (
        <div className="space-y-4 mt-4">
          {trackings.slice(0, 5).map((tracking) => {
            const statusTag = getStatusTag(tracking);
            
            return (
              <div key={tracking.id} className="border rounded-md p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-gray-500 text-sm">Fecha: {formatDate(tracking.date)}</span>
                    <div className="mt-1">
                      <span className={`text-xs px-2 py-1 rounded ${statusTag.color}`}>
                        {statusTag.text}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {tracking.weight && (
                      <div className="text-sm font-medium mb-1">
                        <span className="text-emerald-600">{tracking.weight} kg</span>
                      </div>
                    )}
                    <div className="text-sm">
                      <span className="text-gray-600">Hambre: </span>
                      <span className="font-medium">{tracking.hungerLevel === 'none' ? 'No' : tracking.hungerLevel}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Ansiedad: </span>
                      <span className="font-medium">{tracking.anxietyLevel === 'none' ? 'No' : tracking.anxietyLevel}</span>
                    </div>
                  </div>
                </div>
                
                {tracking.exerciseDone && (
                  <div className="mt-2 text-sm">
                    <span className="text-gray-600">Ejercicio: </span>
                    <span className="font-medium">{tracking.exerciseType} ({tracking.exerciseDuration} min)</span>
                  </div>
                )}
                
                {tracking.notes && (
                  <div className="mt-2 text-sm">
                    <span className="text-gray-600">Notas: </span>
                    <span>{tracking.notes}</span>
                  </div>
                )}
              </div>
            );
          })}
          
          {trackings.length > 5 && (
            <div className="text-center pt-2">
              <button className="text-emerald-600 hover:text-emerald-800 text-sm">
                Ver todos los seguimientos ({trackings.length})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TrackingSummary;
