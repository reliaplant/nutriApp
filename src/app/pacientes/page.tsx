'use client'

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { format, parseISO, isAfter, isBefore, isToday, isPast, isFuture, addDays, startOfWeek, endOfWeek, addWeeks } from 'date-fns';
import { es } from 'date-fns/locale';
import { patientService } from '@/app/shared/firebase';
import { useRouter } from 'next/navigation';
import { Patient } from '@/app/shared/interfaces';
import { useAuth } from '@/app/shared/AuthContext';


const PatientsKanbanPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { firebaseUser, loading: authLoading } = useAuth();
  const [newPatientName, setNewPatientName] = useState('');
  const [creatingPatient, setCreatingPatient] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const router = useRouter();

  const fetchPatients = useCallback(async () => {
    if (!firebaseUser) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const fetchedPatients = await patientService.getAllPatients();
      setPatients(fetchedPatients);
    } catch (err) {
      console.error('Error fetching patients:', err);
      setError('Error al cargar los pacientes. Por favor, intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    if (authLoading) return;
    
    if (firebaseUser) {
      fetchPatients();
    } else {
      setIsLoading(false);
      setPatients([]);
    }
  }, [firebaseUser, authLoading, fetchPatients]);

  // Función para formatear fechas
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'No programada';
    return format(parseISO(dateString), "d 'de' MMMM, yyyy - HH:mm", { locale: es });
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
    
    const shouldShowAppointment = patient.status === 'active';

    return (
      <Link href={`/detalle-paciente/${patient.id}`} className="block mb-1.5">
        <div className="bg-white rounded-sm border border-gray-200 p-2.5 hover:border-emerald-200 transition-colors">
          <div className="flex items-center">
            <div className="w-7 h-7 rounded-full overflow-hidden mr-2 flex-shrink-0">
              {patient.photoUrl ? (
                <Image
                  src={patient.photoUrl}
                  alt={patient.name}
                  width={28}
                  height={28}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full bg-emerald-50 flex items-center justify-center">
                  <span className="text-[10px] font-medium text-emerald-600">
                    {patient.name?.charAt(0)?.toUpperCase() || 'P'}
                  </span>
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-800 truncate">{patient.name}</p>
              <p className="text-[10px] text-gray-400 truncate">{patient.email || 'Sin correo'}</p>
            </div>
            {isPendingAppointment && (
              <span className="text-[9px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-sm ml-1 flex-shrink-0">Pendiente</span>
            )}
            {isTodayAppointment && (
              <span className="text-[9px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-sm ml-1 flex-shrink-0">Hoy</span>
            )}
          </div>

          {shouldShowAppointment && patient.nextAppointmentDate && (
            <p className="mt-1.5 text-[10px] text-gray-400 truncate">
              {formatDate(patient.nextAppointmentDate)}
            </p>
          )}
        </div>
      </Link>
    );
  };

  return (
    <div>
      <div className="flex flex-row justify-between items-center px-4 py-2 bg-gray-100 border-b border-gray-200">
        <div className="flex flex-row items-center gap-6">
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-gray-400">Pacientes</p>

          <div className="relative">
            <input
              type="text"
              placeholder="Buscar..."
              className="pl-7 pr-3 py-1 text-xs rounded-sm border border-gray-300 bg-white focus:outline-none focus:border-emerald-300 w-48"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg
              className="absolute left-2 top-1.5 h-3.5 w-3.5 text-gray-300"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <button 
          className="bg-emerald-600 text-[11px] text-white px-3 py-1 rounded-sm hover:bg-emerald-700 transition flex items-center gap-1"
          onClick={() => setIsModalOpen(true)}
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo paciente
        </button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-emerald-600 border-t-transparent"></div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="text-red-600 bg-red-50 p-3 m-3 rounded-sm text-xs">
          <p>{error}</p>
          <button 
            onClick={fetchPatients}
            className="mt-1 text-emerald-600 hover:underline text-[11px]"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Kanban Board - only show when not loading and no error */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-5 overflow-x-auto">
          {/* Columna: En Atención */}
          <div className="bg-gray-50 border-r border-gray-200" style={{ minHeight: 'calc(100vh - 82px)', minWidth: '200px' }}>
            <div className="px-3 py-2 border-b-2 border-emerald-500">
              <div className="flex items-center">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-gray-500">En Atención</span>
                <span className="ml-1.5 text-[10px] text-gray-300">{columns.inAttention.length}</span>
              </div>
            </div>
            <div className="p-1.5">
              {columns.inAttention.map((patient) => (
                <PatientCard key={patient.id} patient={patient} />
              ))}
              {columns.inAttention.length === 0 && (
                <p className="text-center py-8 text-[10px] text-gray-300">No hay pacientes en atención</p>
              )}
            </div>
          </div>

          {/* Columna: Con Citas */}
          <div className="bg-gray-50 border-r border-gray-200" style={{ minHeight: 'calc(100vh - 82px)', minWidth: '200px' }}>
            <div className="px-3 py-2 border-b-2 border-emerald-600">
              <div className="flex items-center">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 mr-1.5"></span>
                <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-gray-500">Con Citas</span>
                <span className="ml-1.5 text-[10px] text-gray-300">
                  {columns.scheduled.thisWeek.length + columns.scheduled.nextWeek.length + columns.scheduled.later.length}
                </span>
              </div>
            </div>
            <div className="p-1.5">
              {columns.scheduled.thisWeek.length === 0 && 
               columns.scheduled.nextWeek.length === 0 && 
               columns.scheduled.later.length === 0 ? (
                <p className="text-center py-8 text-[10px] text-gray-300">No hay pacientes con cita</p>
              ) : (
                <>
                  {columns.scheduled.thisWeek.length > 0 && (
                    <>
                      <p className="text-[9px] font-medium uppercase tracking-[0.1em] text-gray-400 bg-gray-100 px-2 py-0.5 mb-1 rounded-sm">Esta semana</p>
                      {columns.scheduled.thisWeek.map((patient) => (
                        <PatientCard key={patient.id} patient={patient} />
                      ))}
                    </>
                  )}
                  {columns.scheduled.nextWeek.length > 0 && (
                    <>
                      <p className="text-[9px] font-medium uppercase tracking-[0.1em] text-gray-400 bg-gray-100 px-2 py-0.5 mt-2 mb-1 rounded-sm">Próxima semana</p>
                      {columns.scheduled.nextWeek.map((patient) => (
                        <PatientCard key={patient.id} patient={patient} />
                      ))}
                    </>
                  )}
                  {columns.scheduled.later.length > 0 && (
                    <>
                      <p className="text-[9px] font-medium uppercase tracking-[0.1em] text-gray-400 bg-gray-100 px-2 py-0.5 mt-2 mb-1 rounded-sm">Más adelante</p>
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
          <div className="bg-gray-50 border-r border-gray-200" style={{ minHeight: 'calc(100vh - 82px)', minWidth: '200px' }}>
            <div className="px-3 py-2 border-b-2 border-gray-400">
              <div className="flex items-center">
                <span className="h-1.5 w-1.5 rounded-full bg-gray-400 mr-1.5"></span>
                <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-gray-500">Sin Cita</span>
                <span className="ml-1.5 text-[10px] text-gray-300">{columns.noAppointment.length}</span>
              </div>
            </div>
            <div className="p-1.5">
              {columns.noAppointment.map((patient) => (
                <PatientCard key={patient.id} patient={patient} />
              ))}
              {columns.noAppointment.length === 0 && (
                <p className="text-center py-8 text-[10px] text-gray-300">No hay pacientes sin cita</p>
              )}
            </div>
          </div>

          {/* Columna: Dados de Alta */}
          <div className="bg-gray-50 border-r border-gray-200" style={{ minHeight: 'calc(100vh - 82px)', minWidth: '200px' }}>
            <div className="px-3 py-2 border-b-2 border-gray-300">
              <div className="flex items-center">
                <span className="h-1.5 w-1.5 rounded-full bg-gray-300 mr-1.5"></span>
                <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-gray-500">Alta</span>
                <span className="ml-1.5 text-[10px] text-gray-300">{columns.discharged.length}</span>
              </div>
            </div>
            <div className="p-1.5">
              {columns.discharged.map((patient) => (
                <PatientCard key={patient.id} patient={patient} />
              ))}
              {columns.discharged.length === 0 && (
                <p className="text-center py-8 text-[10px] text-gray-300">No hay pacientes dados de alta</p>
              )}
            </div>
          </div>

          {/* Columna: Pacientes Perdidos */}
          <div className="bg-gray-50" style={{ minHeight: 'calc(100vh - 82px)', minWidth: '200px' }}>
            <div className="px-3 py-2 border-b-2 border-gray-200">
              <div className="flex items-center">
                <span className="h-1.5 w-1.5 rounded-full bg-gray-200 mr-1.5"></span>
                <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-gray-500">Perdidos</span>
                <span className="ml-1.5 text-[10px] text-gray-300">{columns.lost.length}</span>
              </div>
            </div>
            <div className="p-1.5">
              {columns.lost.map((patient) => (
                <PatientCard key={patient.id} patient={patient} />
              ))}
              {columns.lost.length === 0 && (
                <p className="text-center py-8 text-[10px] text-gray-300">No hay pacientes perdidos</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Patient creation modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/35 flex items-center justify-center z-50">
          <div className="bg-white rounded-sm p-5 w-full max-w-sm border border-gray-200">
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-gray-400 mb-3">Nuevo paciente</p>

            {createError && (
              <p className="mb-3 text-[11px] text-red-500">{createError}</p>
            )}

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!newPatientName.trim()) { setCreateError('El nombre es obligatorio'); return; }
              setCreatingPatient(true);
              setCreateError(null);
              try {
                const id = await patientService.createPatient(newPatientName.trim());
                setNewPatientName('');
                setIsModalOpen(false);
                fetchPatients();
                router.push(`/detalle-paciente/${id}`);
              } catch {
                setCreateError('Error al crear el paciente.');
              } finally {
                setCreatingPatient(false);
              }
            }}>
              <input
                type="text"
                value={newPatientName}
                onChange={(e) => setNewPatientName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-sm focus:outline-none focus:border-emerald-400"
                placeholder="Nombre completo"
                disabled={creatingPatient}
                autoFocus
              />
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => { setIsModalOpen(false); setCreateError(null); setNewPatientName(''); }} className="text-[11px] text-gray-400 hover:text-gray-600" disabled={creatingPatient}>Cancelar</button>
                <button type="submit" className="bg-emerald-600 text-[11px] text-white px-3 py-1 rounded-sm hover:bg-emerald-700 disabled:opacity-50" disabled={creatingPatient}>
                  {creatingPatient ? 'Creando...' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PatientsKanbanPage;