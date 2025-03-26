'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { patientService, authService } from '@/app/shared/firebase';
import { Patient } from '@/app/shared/interfaces';

interface PatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPatientCreated: () => void;
}

const PatientModal: React.FC<PatientModalProps> = ({ isOpen, onClose, onPatientCreated }) => {
  const [patientName, setPatientName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!patientName.trim()) {
      setError('El nombre del paciente es obligatorio');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Ya no necesitamos crear un objeto Patient aquí,
      // simplemente usar el método actualizado de patientService
      const patientId = await patientService.createPatient(patientName.trim());
      
      setPatientName('');
      onPatientCreated();
      onClose();
      
      // Optional: navigate to the new patient's detail page
      router.push(`/detalle-paciente/${patientId}`);
    } catch (err) {
      console.error('Error creating patient:', err);
      setError('Ha ocurrido un error al crear el paciente. Por favor, intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-green-50/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow">
        <h2 className="text-xl font-semibold mb-4">Crear nuevo paciente</h2>
        
        {error && (
          <div className="mb-4 p-2 bg-red-50 border border-red-200 text-red-600 rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="patientName" className="block text-gray-700 mb-2">
              Nombre del paciente
            </label>
            <input
              id="patientName"
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Nombre completo"
              disabled={isLoading}
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Creando...' : 'Crear paciente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientModal;