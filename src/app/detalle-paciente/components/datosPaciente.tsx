'use client'

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { format, parseISO, differenceInYears } from 'date-fns';
import { es } from 'date-fns/locale';
import { storage } from '@/app/service/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter } from 'next/navigation';

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  birthDate: string;
  height: number;
  currentWeight: number;
  gender: 'male' | 'female' | 'other';
  country: string;
  status: 'active' | 'discharged' | 'lost';
  photoUrl?: string; // Add this field to match your firebase.ts interface
}

interface LastWeight {
  weight: number | null;
  date: string | null;
}

// Actualizar la interfaz para aceptar una función asíncrona
interface DatosPacienteProps {
  patient: Patient;
  lastWeight: LastWeight;
  onPatientUpdate: (updatedPatient: Patient) => void | Promise<void>; // Modificar aquí para aceptar Promise
  onDeletePatient?: (patientId: string) => void | Promise<void>; // También aquí si es necesario
}

// Patient avatar component with upload functionality
const PatientAvatar = ({ patient, onImageUpdate }: { 
  patient: Patient, 
  onImageUpdate: (photoUrl: string) => void 
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleImageClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !patient.id) return;
    
    const file = files[0];
    setIsUploading(true);
    
    try {
      const storageRef = ref(storage, `patients/${patient.id}/avatar`);
      await uploadBytes(storageRef, file);
      const photoUrl = await getDownloadURL(storageRef);
      
      // Update the parent component with new URL
      onImageUpdate(photoUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error al subir la imagen. Intente nuevamente.');
    } finally {
      setIsUploading(false);
      // Clear the input so the same file can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };
  
  return (
    <div 
      className="relative w-20 h-20 cursor-pointer" 
      onClick={handleImageClick}
    >
      {patient.photoUrl ? (
        // Show actual photo if available
        <img
          src={patient.photoUrl}
          alt={patient.name}
          className="w-20 h-20 rounded-full object-cover border-2 border-emerald-200"
        />
      ) : (
        // Show placeholder if no photo
        <div className="w-20 h-20 rounded-full border-2 border-emerald-200 bg-emerald-100 flex items-center justify-center">
          <svg 
            className="h-10 w-10 text-emerald-600" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      )}
      
      {/* Overlay with camera icon - only visible on hover */}
      <div className="absolute inset-0 rounded-full flex items-center justify-center bg-gray60/70 bg-opacity-50 hover:bg-opacity-30 transition-all opacity-0 hover:opacity-100">
        <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      
      {/* Loading overlay - only visible when uploading */}
      {isUploading && (
        <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black bg-opacity-50">
          <div className="animate-spin h-8 w-8 border-4 border-white rounded-full border-t-transparent"></div>
        </div>
      )}
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};

const DatosPaciente: React.FC<DatosPacienteProps> = ({
  patient,
  lastWeight,
  onPatientUpdate,
  onDeletePatient
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: patient.name || '',
    email: patient.email || '',
    phone: patient.phone || '',
    birthDate: patient.birthDate || '',
    height: patient.height || 0,
    gender: patient.gender || 'other',
    country: patient.country || '',
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Actualizar el formulario cuando cambian los datos del paciente
    setEditForm({
      name: patient.name || '',
      email: patient.email || '',
      phone: patient.phone || '',
      birthDate: patient.birthDate || '',
      height: patient.height || 0,
      gender: patient.gender || 'other',
      country: patient.country || '',
    });
  }, [patient]);

  // Función para formatear fechas
  const formatDate = (dateString?: string | null): string => {
    if (!dateString) {
      return 'No disponible';
    }
    try {
      return format(parseISO(dateString), "d 'de' MMMM, yyyy", { locale: es });
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return 'Fecha inválida';
    }
  };

  // Función para calcular la edad
  const calculateAge = (birthDate?: string | null): number | null => {
    if (!birthDate) {
      return null;
    }
    try {
      return differenceInYears(new Date(), new Date(birthDate));
    } catch (error) {
      console.error('Error al calcular edad:', error);
      return null;
    }
  };

  // Manejar cambio de estado
  const handleStatusChange = (newStatus: 'active' | 'discharged' | 'lost') => {
    onPatientUpdate({ ...patient, status: newStatus });
  };

  // Manejar cambios en el formulario
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: name === 'height' ? Number(value) : value
    }));
  };

  // Guardar cambios
  const handleSaveChanges = () => {
    const updatedPatient = {
      ...patient,
      name: editForm.name,
      email: editForm.email,
      phone: editForm.phone,
      birthDate: editForm.birthDate,
      height: editForm.height,
      gender: editForm.gender as 'male' | 'female' | 'other',
      country: editForm.country
    };
    
    onPatientUpdate(updatedPatient);
    setIsEditing(false);
  };

  // Handle photo updates
  const handleImageUpdate = (photoUrl: string) => {
    // Update the patient with new photo URL immediately
    onPatientUpdate({
      ...patient,
      photoUrl
    });
  };

  // Simplified patient deletion handler
const handleDeletePatient = async () => {
  if (!patient.id) return;
  
  try {
    setIsDeleting(true);
    console.log("Starting patient deletion process:", patient.id);
    
    // Import necessary services directly
    const { patientService, consultationService, storage, ref, deleteObject, listAll } = await import('@/app/service/firebase');
    
    // 1. Delete consultations manually with proper service
    try {
      console.log("Fetching consultations...");
      const consultations = await consultationService.getConsultationsByPatient(patient.id);
      console.log(`Found ${consultations.length} consultations to delete`);
      
      for (const consultation of consultations) {
        if (consultation.id) {
          await consultationService.deleteConsultation(patient.id, consultation.id);
          console.log(`Deleted consultation ${consultation.id}`);
        }
      }
    } catch (err) {
      console.error("Error deleting consultations:", err);
      // Continue with deletion process
    }
    
    // 2. Delete storage files manually
    try {
      console.log("Deleting files from storage...");
      const storageRef = ref(storage, `patients/${patient.id}`);
      const filesList = await listAll(storageRef);
      
      // Delete files one by one
      for (const item of filesList.items) {
        await deleteObject(item);
        console.log(`Deleted file: ${item.fullPath}`);
      }
    } catch (err) {
      console.error("Error deleting files:", err);
      // Continue with deletion process
    }
    
    // 3. Finally delete the patient document
    console.log("Deleting patient document...");
    await patientService.deletePatient(patient.id);
    console.log("Patient deleted successfully");
    
    // Navigate back to patients list
    router.push('/pacientes');
    
  } catch (err) {
    console.error('Error deleting patient:', err);
    alert('Error al eliminar paciente. Por favor intenta nuevamente.');
  } finally {
    setIsDeleting(false);
    setIsDeleteModalOpen(false);
  }
};

  return (
    <div className="w-full md:w-1/4 bg-white border-r border-r-gray-200 p-6">
      <div className="flex items-center mb-6">
        <div className="mr-4 relative">
          <PatientAvatar 
            patient={patient} 
            onImageUpdate={handleImageUpdate} 
          />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{patient.name}</h1>
          <div className="mt-2">
            <select
              id="status"
              value={patient.status}
              onChange={(e) => handleStatusChange(e.target.value as 'active' | 'discharged' | 'lost')}
              className={`p-1 !pr-6 rounded text-xs focus:outline-none ${
                patient.status === 'active' ? 'bg-green-100 text-green-800' :
                patient.status === 'discharged' ? 'bg-blue-100 text-blue-800' :
                'bg-red-100 text-red-800'
              }`}
            >
              <option value="active">Estatus del paciente: Activo</option>
              <option value="discharged">Estatus del paciente: Alta</option>
              <option value="lost">Estatus del paciente: Perdido</option>
            </select>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-700">
            {isEditing ? "Editar información" : "Información Personal"}
          </h2>

          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-emerald-600 hover:underline text-sm"
            >
              Editar
            </button>
          )}
        </div>

        {isEditing ? (
          // Formulario de edición
          <form className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs text-gray-500">Nombre completo</label>
              <input
                id="name"
                name="name"
                type="text"
                value={editForm.name}
                onChange={handleFormChange}
                className="w-full px-2 p-1.5 bg-white border border-gray-300 rounded mt-1"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs text-gray-500">Correo electrónico</label>
              <input
                id="email"
                name="email"
                type="email"
                value={editForm.email}
                onChange={handleFormChange}
                className="w-full px-2 p-1.5 bg-white border border-gray-300 rounded mt-1"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-xs text-gray-500">Teléfono</label>
              <input
                id="phone"
                name="phone"
                type="text"
                value={editForm.phone}
                onChange={handleFormChange}
                className="w-full px-2 p-1.5 bg-white border border-gray-300 rounded mt-1"
              />
            </div>

            <div>
              <label htmlFor="country" className="block text-xs text-gray-500">País</label>
              <input
                id="country"
                name="country"
                type="text"
                value={editForm.country}
                onChange={handleFormChange}
                className="w-full px-2 p-1.5 bg-white border border-gray-300 rounded mt-1"
              />
            </div>

            <div>
              <label htmlFor="birthDate" className="block text-xs text-gray-500">Fecha de nacimiento</label>
              <input
                id="birthDate"
                name="birthDate"
                type="date"
                value={editForm.birthDate}
                onChange={handleFormChange}
                className="w-full px-2 p-1.5 bg-white border border-gray-300 rounded mt-1"
              />
            </div>

            <div>
              <label htmlFor="height" className="block text-xs text-gray-500">Altura (cm)</label>
              <input
                id="height"
                name="height"
                type="number"
                value={editForm.height}
                onChange={handleFormChange}
                className="w-full px-2 p-1.5 bg-white border border-gray-300 rounded mt-1"
              />
            </div>

            <div>
              <label htmlFor="gender" className="block text-xs text-gray-500">Género</label>
              <select
                id="gender"
                name="gender"
                value={editForm.gender}
                onChange={handleFormChange}
                className="w-full p-2 border border-gray-300 rounded mt-1 bg-white"
              >
                <option value="male">Masculino</option>
                <option value="female">Femenino</option>
                <option value="other">Otro</option>
              </select>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 py-1.5 border border-gray-300 bg-gray20 rounded hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveChanges}
                className="flex-1 bg-gray90 text-white py-1.5 hover:bg-gray-800 transition shadow-sm"
              >
                Guardar
              </button>
            </div>
          </form>
        ) : (
          // Información del paciente en modo visualización
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="w-6 h-8 flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-gray50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Correo electrónico</p>
                <p className="text-gray-800 text-sm">{patient.email}</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="w-6 h-8 flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-gray50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Teléfono</p>
                <p className="text-gray-800 text-sm">{patient.phone}</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="w-6 h-8 flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-gray50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">País</p>
                <p className="text-gray-800 text-sm">{patient.country}</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="w-6 h-8 flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-gray50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Fecha de nacimiento</p>
                {patient.birthDate ? (
                  <p className="text-gray-800 text-sm">
                    {formatDate(patient.birthDate)} 
                    {calculateAge(patient.birthDate) !== null && `(${calculateAge(patient.birthDate)} años)`}
                  </p>
                ) : (
                  <p className="text-gray-500 text-sm italic">No registrada</p>
                )}
              </div>
            </div>

            <div className="flex items-start">
              <div className="w-6 h-8 flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-gray50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Género</p>
                <p className="text-gray-800 text-sm">
                  {patient.gender === 'male' ? 'Masculino' :
                   patient.gender === 'female' ? 'Femenino' : 'Otro'}
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="w-6 h-8 flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-gray50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Altura</p>
                <p className="text-gray-800 text-sm">{patient.height} cm</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="w-6 h-8 flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-gray50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Último peso</p>
                {lastWeight.weight ? (
                  <>
                    <p className="text-gray-800 text-sm">{lastWeight.weight} kg</p>
                    <p className="text-xs text-gray-500">
                      Tomado el {format(parseISO(lastWeight.date!), "d 'de' MMMM, yyyy", { locale: es })}
                    </p>
                  </>
                ) : (
                  <p className="text-gray-500 text-sm italic">
                    Se registrará en la primera consulta
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="border-t border-gray-200 mt-8 pt-4">
        <button
          onClick={() => setIsDeleteModalOpen(true)}
          className="text-xs text-gray-400 hover:text-red-600 transition-colors"
        >
          Eliminar paciente
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirmar eliminación</h3>
            <p className="text-gray-600 mb-2">
              ¿Estás seguro de que deseas eliminar a este paciente? Esta acción eliminará:
            </p>
            <ul className="list-disc pl-5 mb-4 text-gray-600 text-sm">
              <li>Datos personales del paciente</li>
              <li>Historial completo de consultas</li>
              <li>Documentos y archivos asociados</li>
              <li>Planes nutricionales creados</li>
              <li>Fotografías y evolución registrada</li>
            </ul>
            <p className="text-gray-600 mb-6 font-medium text-sm">
              Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeletePatient}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span>Eliminando...</span>
                  </div>
                ) : (
                  'Eliminar permanentemente'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatosPaciente;