'use client'

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { differenceInYears, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import DatosPaciente from '@/app/detalle-paciente/components/datosPaciente';
import Consultas from '@/app/detalle-paciente/components/consultas';
import Evolucion from '@/app/detalle-paciente/components/evolucion';
import Documentos, { PatientDocument } from '@/app/detalle-paciente/components/documentos';
import { patientService, consultationService } from '@/app/shared/firebase';
import { ref, storage } from '@/app/shared/firebase';

// Importar estas bibliotecas adicionales al inicio del archivo
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Registrar los componentes de ChartJS que necesitamos
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

// Definimos la interfaz para los datos del paciente
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
    nutritionistId: string;
}

interface Consultation {
    id?: string;
    patientId: string;
    date: string;
    weight?: number;
    comments?: string;
    status: 'scheduled' | 'completed';
    highlights?: string[];
}

// Función para calcular los límites de peso según el IMC y la altura
function calculateWeightForBMI(bmi: number, heightCm: number): number {
    const heightM = heightCm / 100;
    return bmi * (heightM * heightM);
}

const PatientDetailPage = () => {
    const params = useParams();
    const router = useRouter();
    const patientId = params?.id as string || 'new';

    // Estado para el paciente
    const [patient, setPatient] = useState<Patient>({
        id: patientId,
        name: '',
        email: '',
        phone: '',
        birthDate: '',
        height: 0,
        currentWeight: 0,
        gender: 'other',
        country: '',
        status: 'active',
        nutritionistId: ''
    });

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    
    // Estados para los datos relacionados
    const [consultations, setConsultations] = useState<Consultation[]>([]);
    const [patientDocuments, setPatientDocuments] = useState<PatientDocument[]>([]);
    const [weightHistory, setWeightHistory] = useState<{date: string, weight: number}[]>([]);
    const [weightGoal, setWeightGoal] = useState(0);

    // Cargar datos del paciente si existe
    useEffect(() => {
        const fetchPatientData = async () => {
            if (patientId === 'new') {
                // Si es un paciente nuevo, dejamos el estado predeterminado
                setLoading(false);
                return;
            }
            
            setLoading(true);
            try {
                const fetchedPatient = await patientService.getPatientById(patientId);
                
                if (fetchedPatient) {
                    setPatient(fetchedPatient as Patient);
                    
                    // Aquí podrías cargar también las consultas, documentos, etc.
                    // Por ejemplo:
                    // const fetchedConsultations = await consultationService.getConsultationsByPatient(patientId);
                    // setConsultations(fetchedConsultations);
                    
                    // Por ahora dejamos datos de ejemplo
                    setConsultations([
                        // ... tus consultas de ejemplo
                    ]);
                    
                    setWeightHistory([
                        // ... tu historial de peso de ejemplo
                    ]);
                    
                    // Calcular objetivo de peso inicial (ej. 5% menos que el peso actual)
                    if (fetchedPatient.currentWeight) {
                        setWeightGoal(Math.round(fetchedPatient.currentWeight * 0.95 * 10) / 10);
                    }
                } else {
                    setError('No se encontró el paciente');
                }
            } catch (err) {
                console.error('Error cargando paciente:', err);
                setError('Error al cargar los datos del paciente');
            } finally {
                setLoading(false);
            }
        };
        
        fetchPatientData();
    }, [patientId]);

    // Función para actualizar el paciente
    const handlePatientUpdate = async (updatedPatient: Omit<Patient, 'nutritionistId'> & { nutritionistId?: string }) => {
        try {
            // Ensure nutritionistId is included
            const completePatient: Patient = {
                ...updatedPatient,
                nutritionistId: updatedPatient.nutritionistId || patient.nutritionistId
            };
            
            if (patientId === 'new') {
                // Crear nuevo paciente - pass only the name instead of the full patient object
                const newPatientId = await patientService.createPatient(completePatient.name);
                
                // After getting the ID, update with all fields
                await patientService.updatePatient(newPatientId, completePatient);
                
                alert('Paciente creado con éxito');
                router.push(`/detalle-paciente/${newPatientId}`);
            } else {
                // Actualizar paciente existente
                await patientService.updatePatient(patientId, completePatient);
                setPatient(completePatient);
                alert('Datos del paciente actualizados');
            }
        } catch (err) {
            console.error('Error al guardar paciente:', err);
            // alert('Error al guardar los datos del paciente');
        }
    };

    // Add this function to handle patient deletion
    const handleDeletePatient = async (patientId: string) => {
        try {
            // 1. Get all consultations for this patient
            const patientConsultations = await consultationService.getConsultationsByPatient(patientId);
            
            // 2. Delete each consultation
            for (const consultation of patientConsultations) {
                await consultationService.deleteConsultation(patientId, consultation.id!);
            }
            
            // 3. Delete any files in storage
            // Note: This is a simplified approach - ideally you'd list all files first
            try {
                const storageRef = ref(storage, `patients/${patientId}`);
                // This requires a recursive delete function which Firebase JS SDK doesn't provide directly
                // You might need Cloud Functions for complete cleanup
            } catch (err) {
                console.error('Storage deletion error:', err);
                // Continue with patient deletion even if storage cleanup fails
            }
            
            // 4. Finally delete the patient
            await patientService.deletePatient(patientId);
            
            // 5. Redirect to patients list
            router.push('/pacientes');
        } catch (err) {
            console.error('Error deleting patient:', err);
            throw err; // Re-throw to be caught by the component
        }
    };

    // Obtener el último peso registrado de las consultas
    const getLastRecordedWeight = (): { weight: number | null, date: string | null } => {
        // Filtrar consultas completadas
        const completedConsultations = consultations.filter(c => c.status === 'completed');

        if (completedConsultations.length === 0) {
            return { weight: null, date: null };
        }

        // Ordenar por fecha descendente
        const sortedConsultations = [...completedConsultations].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        // Retornar el peso de la consulta más reciente
        return {
            weight: sortedConsultations[0].weight || null,
            date: sortedConsultations[0].date
        };
    };

    // Función para manejar actualizaciones del objetivo de peso
    const handleWeightGoalUpdate = async (newGoal: number) => {
        setWeightGoal(newGoal);
        // Aquí podrías actualizar el objetivo en la base de datos
    };

    // Callbacks para manejar documentos
    const handleDocumentAdded = (newDoc: PatientDocument) => {
        setPatientDocuments(prev => [newDoc, ...prev]);
        // Aquí podrías hacer llamadas a la API, etc.
    };

    const handleDocumentDeleted = (id: string) => {
        setPatientDocuments(prev => prev.filter(doc => doc.id !== id));
        // Aquí podrías hacer llamadas a la API, etc.
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-red-50 text-red-700 rounded-md">
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="">
            <div className="flex flex-col">

                <div className="flex flex-row">
                    {/* Panel izquierdo - Datos personales */}
                    <DatosPaciente 
                        patient={patient}
                        lastWeight={getLastRecordedWeight()}
                        onPatientUpdate={handlePatientUpdate}
                        onDeletePatient={handleDeletePatient}  // Add this line
                    />
                    
                    {/* Panel derecho */}
                    <div className="w-3/4 p-4 bg-gray10">
                        {patientId !== 'new' ? (
                            <>
                                <Consultas
                                    patientId={patient.id}
                                    initialConsultations={consultations}
                                    onConsultationsChange={(updatedConsultations) => {
                                        setConsultations(updatedConsultations);
                                    }}
                                />

                                <Evolucion
                                    patient={patient}
                                    weightHistory={weightHistory}
                                    initialWeightGoal={weightGoal}
                                    onWeightGoalChange={handleWeightGoalUpdate}
                                />

                                <div className="mt-6">
                                    <Documentos
                                        patientId={patient.id}
                                        initialDocuments={patientDocuments}
                                        onDocumentAdded={handleDocumentAdded}
                                        onDocumentDeleted={handleDocumentDeleted}
                                    />
                                </div>

                            </>
                        ) : (
                            <div className="bg-white p-6 mb-4 border border-gray-300 radius shadow-md">
                                <h2 className="text-xl font-semibold text-gray-700 mb-4">
                                    Instrucciones para nuevo paciente
                                </h2>
                                <p className="text-gray-600">
                                    Para comenzar con este paciente, complete la información personal 
                                    en el panel izquierdo y haga clic en "Guardar".
                                </p>
                                <p className="text-gray-600 mt-3">
                                    Una vez guardado, podrá programar consultas, subir documentos
                                    y hacer seguimiento de la evolución del paciente.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatientDetailPage;