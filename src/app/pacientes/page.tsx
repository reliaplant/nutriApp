'use client'

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { format, parseISO, isAfter, isBefore, isToday, isPast, isFuture, addDays, startOfWeek, endOfWeek, addWeeks } from 'date-fns';
import { es } from 'date-fns/locale';
import { Patient, patientService, authService } from '../service/firebase';
import PatientModal from '../pacientes/components/crearPaciente';

const PatientsKanbanPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Fetch patients from Firebase
  const fetchPatients = async () => {
    if (!authInitialized) return; // Don't fetch if auth isn't ready yet
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Make sure user is signed in before fetching
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        setError("Debes iniciar sesión para ver tus pacientes");
        setPatients([]);
        return;
      }
      
      const fetchedPatients = await patientService.getAllPatients();
      setPatients(fetchedPatients);
    } catch (err) {
      console.error('Error fetching patients:', err);
      // Don't show an error if it's just because user isn't authenticated
      if ((err as any)?.message === "Debes iniciar sesión para ver tus pacientes") {
        setPatients([]);
      } else {
        setError('Error al cargar los pacientes. Por favor, intenta nuevamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Wait for Firebase Auth to initialize before fetching data
  useEffect(() => {
    const unsubscribe = authService.getAuth().onAuthStateChanged((user) => {
      setAuthInitialized(true);
      if (user) {
        fetchPatients();
      } else {
        setIsLoading(false);
        setPatients([]);
        // Don't show an error - just show empty state
      }
    });

    return () => unsubscribe();
  }, []);

  // Other useEffect to refresh data when needed
  useEffect(() => {
    if (authInitialized) {
      fetchPatients();
    }
  }, [authInitialized]);

  // Función para formatear fechas
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'No programada';
    return format(parseISO(dateString), "d 'de' MMMM, yyyy", { locale: es });
  };

  // Filtrar pacientes según criterios de búsqueda
  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Función para clasificar pacientes para el Kanban
  const getKanbanColumns = () => {
    const now = new Date();
    const startThisWeek = startOfWeek(now, { weekStartsOn: 1 }); // Lunes
    const endThisWeek = endOfWeek(now, { weekStartsOn: 1 }); // Domingo
    const startNextWeek = addDays(endThisWeek, 1); // Siguiente lunes
    const endNextWeek = endOfWeek(addWeeks(now, 1), { weekStartsOn: 1 }); // Siguiente domingo

    return {
      // En atención: citas de hoy o pasadas (pendientes)
      inAttention: filteredPatients.filter(patient =>
        patient.status === 'active' &&
        patient.nextAppointmentDate &&
        (isToday(parseISO(patient.nextAppointmentDate)) ||
          isPast(parseISO(patient.nextAppointmentDate)))
      ),

      // Con citas programadas para el futuro, divididas por semana
      scheduled: {
        thisWeek: filteredPatients.filter(patient =>
          patient.status === 'active' &&
          patient.nextAppointmentDate &&
          isFuture(parseISO(patient.nextAppointmentDate)) &&
          isAfter(parseISO(patient.nextAppointmentDate), startThisWeek) &&
          isBefore(parseISO(patient.nextAppointmentDate), endThisWeek)
        ),
        nextWeek: filteredPatients.filter(patient =>
          patient.status === 'active' &&
          patient.nextAppointmentDate &&
          isAfter(parseISO(patient.nextAppointmentDate), startNextWeek) &&
          isBefore(parseISO(patient.nextAppointmentDate), endNextWeek)
        ),
        later: filteredPatients.filter(patient =>
          patient.status === 'active' &&
          patient.nextAppointmentDate &&
          isAfter(parseISO(patient.nextAppointmentDate), endNextWeek)
        ),
      },

      // Sin cita
      noAppointment: filteredPatients.filter(patient =>
        patient.status === 'active' &&
        !patient.nextAppointmentDate
      ),

      // Dados de alta
      discharged: filteredPatients.filter(patient =>
        patient.status === 'discharged'
      ),

      // Perdidos
      lost: filteredPatients.filter(patient =>
        patient.status === 'lost'
      ),
    };
  };

  const columns = getKanbanColumns();

  // Componente de tarjeta de paciente simplificado
  const PatientCard = ({ patient }: { patient: Patient }) => {
    const isPendingAppointment = patient.nextAppointmentDate &&
      isPast(parseISO(patient.nextAppointmentDate)) &&
      !isToday(parseISO(patient.nextAppointmentDate));

    const isTodayAppointment = patient.nextAppointmentDate &&
      isToday(parseISO(patient.nextAppointmentDate));

    return (
      <div className="mb-2 bg-white rounded border border-gray-200 p-4 shadow hover:shadow-md transition-shadow">
        <div className="flex items-center mb-2">
          <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
            {patient.photoUrl ? (
              <Image
                src={patient.photoUrl}
                alt={patient.name}
                width={40}
                height={40}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full bg-emerald-100 flex items-center justify-center">
                <svg 
                  className="h-5 w-5 text-emerald-600" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                  />
                </svg>
              </div>
            )}
          </div>
          <div>
            <h4 className="font-medium text-gray-800">{patient.name}</h4>
            <p className="text-xs text-gray-500">{patient.email || 'Sin correo'}</p>
          </div>
        </div>

        {/* Estado indicators */}
        {isPendingAppointment && (
          <div className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-md mb-2 inline-block">
            Pendiente
          </div>
        )}

        {isTodayAppointment && (
          <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-md mb-2 inline-block">
            ¡Hoy!
          </div>
        )}

        {/* Appointment info and action button */}
        <div className="mt-3 flex justify-between items-center">
          <span className="text-xs text-gray-600">
            <span className="font-medium">Cita:</span> {formatDate(patient.nextAppointmentDate)}
          </span>
          
            <Link
            href={`/detalle-paciente/${patient.id}`}
            className="text-xs bg-gray-100 hover:bg-emerald-200 text-gray-700 hover:text-emerald-700 px-3 py-1 rounded transition-colors"
            >
            Ver
            </Link>
        </div>
      </div>
    );
  };

  return (
    <div className="">
      <div className="flex flex-row justify-between items-center p-2 bg-gray10 border-b border-b-gray-300">
        <div className='flex flex-row items-center gap-8 w-1/2'>
          <div className="ml-4 text font text-gray-800 mb-0 pt-1">Gestión de Pacientes</div>

          <div className="flex flex-col gap-4">
            <div className="relative w-full">
              <input
              type="text"
              placeholder="Buscar pacientes..."
              className="w-full pl-10 bg-white text-md pr-4 py-1.5 rounded-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              />
              <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        <button 
          className='bg-emerald-600 text-sm text-white px-4 py-1 rounded mr-4 hover:bg-emerald-700 transition flex items-center gap-2'
          onClick={() => setIsModalOpen(true)}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 4v16m8-8H4" 
            />
          </svg>
          Nuevo paciente
        </button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray90"></div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="text-red-600 bg-red-50 p-4 m-4 rounded">
          <p>{error}</p>
          <button 
            onClick={fetchPatients}
            className="mt-2 text-blue-600 hover:text-blue-800 underline"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Kanban Board - only show when not loading and no error */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-5 overflow-x-auto pb-4">
          {/* Columna: En Atención */}
          <div className="bg-gray10 border-r border-r-gray-300" style={{ minHeight: 'calc(100vh - 120px)', minWidth: '250px' }}>
            <div className="px-4 py-3 border-b-4 border-b-emerald-500 ">
              <h3 className="font-medium text-gray80 flex items-center">
                <span className="h-3 w-3 rounded-full bg-emerald-500 mr-2"></span>
                En Atención
                <span className="ml-2 text-sm bg-gray10 rounded px-2">
                  {columns.inAttention.length}
                </span>
              </h3>
            </div>
            <div className="p-2 h-full">
              {columns.inAttention.map((patient) => (
                <PatientCard key={patient.id} patient={patient} />
              ))}
              {columns.inAttention.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No hay pacientes en atención
                </div>
              )}
            </div>
          </div>

          {/* Columna: Con Citas */}
            <div className="bg-gray10 border-r border-r-gray-300" style={{ minHeight: 'calc(100vh - 120px)', minWidth: '250px' }}>
            <div className="px-4 py-3 border-b-4 border-b-emerald-600">
              <h3 className="font-medium text-gray80 flex items-center">
              <span className="h-3 w-3 rounded-full bg-emerald-600 mr-2"></span>
              Con Citas
              <span className="ml-2 text-sm bg-gray10 rounded px-2">
                {columns.scheduled.thisWeek.length + columns.scheduled.nextWeek.length + columns.scheduled.later.length}
              </span>
              </h3>
            </div>
            <div className="p-2 h-full">
              {columns.scheduled.thisWeek.length === 0 && 
               columns.scheduled.nextWeek.length === 0 && 
               columns.scheduled.later.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No hay pacientes con cita
                </div>
              ) : (
                <>
                  {/* Esta semana */}
                  {columns.scheduled.thisWeek.length > 0 && (
                    <>
                      <div className="text-xs font-medium bg-gray20 px-2 py-1 mb-2">Esta semana</div>
                      {columns.scheduled.thisWeek.map((patient) => (
                        <PatientCard key={patient.id} patient={patient} />
                      ))}
                    </>
                  )}

                  {/* Próxima semana */}
                  {columns.scheduled.nextWeek.length > 0 && (
                    <>
                      <div className="text-xs font-medium bg-gray20 px-2 py-1 mt-3 mb-2">Próxima semana</div>
                      {columns.scheduled.nextWeek.map((patient) => (
                        <PatientCard key={patient.id} patient={patient} />
                      ))}
                    </>
                  )}

                  {/* Más adelante */}
                  {columns.scheduled.later.length > 0 && (
                    <>
                      <div className="text-xs font-medium bg-gray20 px-2 py-1 mt-3 mb-2">Más adelante</div>
                      {columns.scheduled.later.map((patient) => (
                        <PatientCard key={patient.id} patient={patient} />
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Columna: Sin Cita */}
          <div className="bg-gray10 border-r border-r-gray-300 min-h-[500px] min-w-[250px]">
            <div className="px-4 py-3 border-b-4 border-b-gray-500">
              <h3 className="font-medium text-gray80 flex items-center">
                <span className="h-3 w-3 rounded-full bg-gray-500 mr-2"></span>
                Sin Cita
                <span className="ml-2 text-sm bg-gray10 rounded px-2">
                  {columns.noAppointment.length}
                </span>
              </h3>
            </div>
            <div className="p-2 h-full">
              {columns.noAppointment.map((patient) => (
                <PatientCard key={patient.id} patient={patient} />
              ))}
              {columns.noAppointment.length === 0 && (
                <div className="text`-center py-8 text-gray-500 text-sm text-center">
                  No hay pacientes sin cita
                </div>
              )}
            </div>
          </div>

          {/* Columna: Dados de Alta */}
          <div className="bg-gray10 border-r border-r-gray-300 min-h-[500px] min-w-[250px]">
            <div className="px-4 py-3 border-b-4 border-b-gray-400">
              <h3 className="font-medium text-gray80 flex items-center">
                <span className="h-3 w-3 rounded-full bg-gray-400 mr-2"></span>
                Dados de Alta
                <span className="ml-2 text-sm bg-gray10 rounded px-2">
                  {columns.discharged.length}
                </span>
              </h3>
            </div>
            <div className="p-2 h-full">
              {columns.discharged.map((patient) => (
                <PatientCard key={patient.id} patient={patient} />
              ))}
              {columns.discharged.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No hay pacientes dados de alta
                </div>
              )}
            </div>
          </div>

          {/* Columna: Pacientes Perdidos */}
          <div className="bg-gray10 border-r border-r-gray-300 min-h-[500px] min-w-[250px]">
            <div className="px-4 py-3 border-b-4 border-b-gray-300 ">
              <h3 className="font-medium text-gray80 flex items-center">
                <span className="h-3 w-3 rounded-full bg-gray-300 mr-2"></span>
                Pacientes Perdidos
                <span className="ml-2 text-sm bg-gray10 rounded px-2">
                  {columns.lost.length}
                </span>
              </h3>
            </div>
            <div className="p-2 h-full">
              {columns.lost.map((patient) => (
                <PatientCard key={patient.id} patient={patient} />
              ))}
              {columns.lost.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No hay pacientes perdidos
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Patient creation modal */}
      <PatientModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onPatientCreated={fetchPatients}
      />
    </div>
  );
}

export default PatientsKanbanPage;