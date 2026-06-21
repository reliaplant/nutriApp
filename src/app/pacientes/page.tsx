'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { usePersistedView } from '@/app/shared/usePersistedView';
import Image from 'next/image';
import Link from 'next/link';
import { format, parseISO, isToday, isPast, isWithinInterval, startOfWeek, endOfWeek, addWeeks } from 'date-fns';
import { es, ptBR } from 'date-fns/locale';
import { patientService } from '@/app/shared/firebase';
import { useRouter } from 'next/navigation';
import { Patient } from '@/app/shared/interfaces';
import { useAuth } from '@/app/shared/AuthContext';
import { useTranslation } from '@/app/shared/useTranslation';
import {
  Search, LayoutGrid, Table as TableIcon, PlusCircle, ChevronRight,
  AlertCircle, CheckCircle2,
  Mail, Phone
} from 'lucide-react';

type ViewMode = 'list' | 'kanban';
type StatusFilter = 'all' | 'active' | 'discharged' | 'lost';

const PatientsPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [viewMode, setViewMode] = usePersistedView<ViewMode>('nutri.view.pacientes', 'list');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [creatingPatient, setCreatingPatient] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const { firebaseUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { t, lang } = useTranslation();
  const dfLocale = lang === 'pt' ? ptBR : es;

  const fetchPatients = useCallback(async () => {
    if (!firebaseUser) return;
    setIsLoading(true);
    setError(null);
    try {
      const fetched = await patientService.getAllPatients();
      setPatients(fetched);
    } catch (err) {
      console.error(err);
      setError(t('patients.loadError'));
    } finally {
      setIsLoading(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    if (authLoading) return;
    if (firebaseUser) fetchPatients();
    else { setIsLoading(false); setPatients([]); }
  }, [firebaseUser, authLoading, fetchPatients]);

  // ─── Helpers ─────────────────────────────────────────────────────────────
  const formatDate = (s: string | null | undefined): string => {
    if (!s) return t('patients.noAppointment');
    return format(parseISO(s), "d MMM · HH:mm", { locale: dfLocale });
  };

  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [patients, searchTerm, statusFilter]);

  const sortedPatients = useMemo(() => {
    const statusRank = (s?: string) => {
      if (s === 'active') return 0;
      if (s === 'discharged') return 1;
      if (s === 'lost') return 2;
      return 3;
    };
    return [...filteredPatients].sort((a, b) => {
      const sr = statusRank(a.status) - statusRank(b.status);
      if (sr !== 0) return sr;
      if (a.nextAppointmentDate && !b.nextAppointmentDate) return -1;
      if (!a.nextAppointmentDate && b.nextAppointmentDate) return 1;
      if (a.nextAppointmentDate && b.nextAppointmentDate) {
        return parseISO(a.nextAppointmentDate).getTime() - parseISO(b.nextAppointmentDate).getTime();
      }
      return a.name.localeCompare(b.name);
    });
  }, [filteredPatients]);

  const getStatusBadge = (patient: Patient) => {
    if (patient.status === 'active') {
      return <span className="text-[10px] uppercase tracking-wider text-emerald-700 font-semibold">{t('patients.status.active')}</span>;
    }
    if (patient.status === 'discharged') {
      return <span className="text-[10px] uppercase tracking-wider text-blue-600 font-medium">{t('patients.status.discharged')}</span>;
    }
    if (patient.status === 'lost') {
      return <span className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">{t('patients.status.lost')}</span>;
    }
    return null;
  };

  // ─── Kanban columns ──────────────────────────────────────────────────────
  type KanbanCol = { key: string; label: string; subtitle?: string; iconSvg: string; patients: Patient[] };
  const kanbanColumns: KanbanCol[] = useMemo(() => {
    const search = patients.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const now = new Date();
    const thisWeekStart = startOfWeek(now,        { weekStartsOn: 1 });
    const thisWeekEnd   = endOfWeek(now,          { weekStartsOn: 1 });
    const nextWeekStart = startOfWeek(addWeeks(now, 1), { weekStartsOn: 1 });
    const nextWeekEnd   = endOfWeek(addWeeks(now, 1),   { weekStartsOn: 1 });

    const inThisWeek = (s: string) => isWithinInterval(parseISO(s), { start: thisWeekStart, end: thisWeekEnd });
    const inNextWeek = (s: string) => isWithinInterval(parseISO(s), { start: nextWeekStart, end: nextWeekEnd });
    const isOverdue = (s: string) => parseISO(s).getTime() < now.getTime() && !inThisWeek(s);

    const fmtRange = (a: Date, b: Date) => {
      const sameMonth = a.getMonth() === b.getMonth();
      return sameMonth
        ? `${format(a, 'd', { locale: dfLocale })}–${format(b, "d 'de' MMM", { locale: dfLocale })}`
        : `${format(a, 'd MMM', { locale: dfLocale })} – ${format(b, 'd MMM', { locale: dfLocale })}`;
    };

    return [
      {
        key: 'overdue', label: t('patients.kanban.overdue') !== 'patients.kanban.overdue' ? t('patients.kanban.overdue') : 'Con citas vencidas', iconSvg: 'chile',
        patients: search.filter(p => p.status === 'active' && p.nextAppointmentDate && isOverdue(p.nextAppointmentDate)),
      },
      {
        key: 'thisWeek', label: t('patients.kanban.thisWeek'), subtitle: fmtRange(thisWeekStart, thisWeekEnd), iconSvg: 'manzana',
        patients: search.filter(p => p.status === 'active' && p.nextAppointmentDate && inThisWeek(p.nextAppointmentDate)),
      },
      {
        key: 'nextWeek', label: t('patients.kanban.nextWeek'), subtitle: fmtRange(nextWeekStart, nextWeekEnd), iconSvg: 'zanahoria',
        patients: search.filter(p => p.status === 'active' && p.nextAppointmentDate && inNextWeek(p.nextAppointmentDate)),
      },
      {
        key: 'noAppointment', label: t('patients.kanban.noAppt'), iconSvg: 'galleta',
        patients: search.filter(p => p.status === 'active' && (
          !p.nextAppointmentDate ||
          (!isOverdue(p.nextAppointmentDate) && !inThisWeek(p.nextAppointmentDate) && !inNextWeek(p.nextAppointmentDate))
        )),
      },
      {
        key: 'discharged', label: t('patients.kanban.discharged'), iconSvg: 'lechuga',
        patients: search.filter(p => p.status === 'discharged'),
      },
      {
        key: 'lost', label: t('patients.kanban.lost'), iconSvg: 'platano',
        patients: search.filter(p => p.status === 'lost'),
      },
    ];
  }, [patients, searchTerm, t, dfLocale]);

  // ─── Avatar ──────────────────────────────────────────────────────────────
  const PatientAvatar = ({ patient, size = 28 }: { patient: Patient; size?: number }) => (
    <div
      className="rounded-full overflow-hidden flex-shrink-0"
      style={{ width: size, height: size, backgroundColor: '#F4F2EE', border: '1px solid #E8E5DE' }}
    >
      {patient.photoUrl ? (
        <Image src={patient.photoUrl} alt={patient.name} width={size} height={size} className="object-cover w-full h-full" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <span className="font-semibold text-gray-500" style={{ fontSize: size * 0.38 }}>
            {patient.name?.charAt(0)?.toUpperCase() || 'P'}
          </span>
        </div>
      )}
    </div>
  );

  const statusFilters: { key: StatusFilter; label: string }[] = [
    { key: 'all',        label: t('patients.filters.all') },
    { key: 'active',     label: t('patients.filters.active') },
    { key: 'discharged', label: t('patients.filters.discharged') },
    { key: 'lost',       label: t('patients.filters.lost') },
  ];

  // ─── Kanban Card ─────────────────────────────────────────────────────────
  const KanbanCard = ({ patient }: { patient: Patient }) => (
    <Link href={`/detalle-paciente/${patient.id}`} className="block">
      <div
        className="bg-white rounded-md p-2.5 transition-all hover:shadow-sm"
        style={{ border: '1px solid #E8E5DE' }}
      >
        <div className="flex items-center gap-2">
          <PatientAvatar patient={patient} size={28} />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-gray-800 truncate leading-tight">{patient.name}</p>
            <p className="text-[10px] text-gray-400 truncate mt-0.5">
              {patient.status === 'active' && patient.nextAppointmentDate
                ? formatDate(patient.nextAppointmentDate)
                : (patient.email || patient.phone || t('patients.noContact'))}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="bg-cream-pattern px-6 py-5 max-w-[1600px] mx-auto flex flex-col" style={{ height: 'calc(100vh - 44px)' }}>
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-3 mb-5 flex-shrink-0">
        <h1 className="text-base font-semibold text-gray-800 mr-1">{t('patients.title')}</h1>
        <span className="text-[11px] text-gray-400 tabular-nums">
          {sortedPatients.length} {sortedPatients.length === 1 ? t('patients.countOne') : t('patients.countMany')}
        </span>

        <button
          onClick={() => setIsModalOpen(true)}
          className="ml-2 bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          {t('patients.newPatient')}
        </button>

        <div className="relative flex-1 max-w-sm ml-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
          <input
            type="text"
            placeholder={t('patients.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs rounded w-full focus:outline-none focus:ring-1 focus:ring-emerald-200 transition-shadow"
            style={{ backgroundColor: '#FFFFFF', border: '1px solid #CCC9C3', color: '#2D2B28' }}
          />
        </div>

        {/* Filtros de estado */}
        <div className="flex items-center gap-1">
          {statusFilters.map(f => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`px-2 py-1 text-[11px] rounded transition-colors ${
                statusFilter === f.key
                  ? 'text-gray-900 font-medium bg-white border border-gray-200'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-3">
          {/* Toggle vista */}
          <div className="flex items-center rounded p-0.5" style={{ backgroundColor: '#F0EDE8', border: '1px solid #E8E5DE' }}>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1 rounded transition-colors ${viewMode === 'list' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              title={t('patients.view.list')}
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1 rounded transition-colors ${viewMode === 'kanban' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              title={t('patients.view.kanban')}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Contenido ── */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-md text-sm border border-red-200">
          <p>{error}</p>
          <button onClick={fetchPatients} className="mt-2 text-emerald-600 hover:underline text-xs">
            {t('patients.retry')}
          </button>
        </div>
      ) : patients.length === 0 ? (
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="relative w-full max-w-md text-center py-14">
            {/* Decorative scattered icons */}
            <div className="relative mx-auto mb-7 h-32 w-full max-w-xs">
              {/* eslint-disable @next/next/no-img-element */}
              <img src="/icons/aguacate.svg" alt="" className="absolute left-2 top-3 w-9 h-9 opacity-60 -rotate-12 select-none pointer-events-none" />
              <img src="/icons/fresa.svg"    alt="" className="absolute left-12 bottom-1 w-8 h-8 opacity-50 rotate-6 select-none pointer-events-none" />
              <img src="/icons/zanahoria.svg" alt="" className="absolute right-10 bottom-2 w-9 h-9 opacity-55 -rotate-6 select-none pointer-events-none" />
              <img src="/icons/brocoli.svg" alt="" className="absolute right-2 top-4 w-8 h-8 opacity-50 rotate-12 select-none pointer-events-none" />
              {/* Centerpiece — el plato */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center" style={{ boxShadow: '0 8px 24px -8px rgba(4, 120, 87, 0.25)' }}>
                <img src="/icons/manzana.svg" alt="" className="w-14 h-14" />
              </div>
              {/* eslint-enable @next/next/no-img-element */}
            </div>

            <h2 className="text-xl font-semibold text-gray-900 tracking-tight" style={{ letterSpacing: '-0.02em' }}>
              {t('patients.emptyTitle')}
            </h2>
            <p className="mt-2 text-[13px] text-gray-500 max-w-sm mx-auto leading-relaxed">
              {t('patients.emptySubtitle')}
            </p>

            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-6 inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-md text-[13px] font-semibold transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              {t('patients.emptyCta')}
            </button>
          </div>
        </div>
      ) : viewMode === 'list' ? (
        sortedPatients.length === 0 ? (
          <div className="text-center py-16 rounded-md text-xs text-gray-400 border border-dashed" style={{ borderColor: '#E8E5DE', backgroundColor: '#FFFFFF' }}>
            {t('patients.noResults')}
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="bg-white rounded-md overflow-hidden" style={{ border: '1px solid #E8E5DE' }}>
            <table className="w-full">
              <thead style={{ backgroundColor: '#FAF9F7', borderBottom: '1px solid #E8E5DE' }}>
                <tr className="text-left text-[10px] uppercase tracking-wider text-gray-500">
                  <th className="px-4 py-2.5 font-semibold">{t('patients.table.patient')}</th>
                  <th className="px-3 py-2.5 font-semibold">{t('patients.table.email')}</th>
                  <th className="px-3 py-2.5 font-semibold">{t('patients.table.phone')}</th>
                  <th className="px-3 py-2.5 font-semibold">{t('patients.table.nextAppt')}</th>
                  <th className="px-3 py-2.5 font-semibold">{t('patients.table.status')}</th>
                  <th className="px-3 py-2.5 w-[24px]"></th>
                </tr>
              </thead>
              <tbody>
                {sortedPatients.map(patient => {
                  const apptDate = patient.nextAppointmentDate ? parseISO(patient.nextAppointmentDate) : null;
                  const apptPast = apptDate ? apptDate.getTime() < Date.now() : false;
                  return (
                    <tr
                      key={patient.id}
                      onClick={() => router.push(`/detalle-paciente/${patient.id}`)}
                      className="group cursor-pointer transition-colors"
                      style={{ borderTop: '1px solid #F0EDE8' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FAF9F7')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <PatientAvatar patient={patient} size={32} />
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-800 truncate text-xs leading-tight">{patient.name}</p>
                            {patient.birthDate && (
                              <p className="text-[10px] text-gray-400 mt-0.5 tabular-nums">
                                {Math.floor((Date.now() - parseISO(patient.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25))} {t('patients.years')}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-[11px] text-gray-500">
                        {patient.email ? (
                          <span className="inline-flex items-center gap-1.5 truncate">
                            <Mail className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{patient.email}</span>
                          </span>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-3 py-2.5 text-[11px] text-gray-500 tabular-nums">
                        {patient.phone ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            {patient.phone}
                          </span>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-3 py-2.5">
                        {patient.status === 'active' && apptDate ? (
                          <span className="inline-flex items-center gap-1.5">
                            {apptPast
                              ? <AlertCircle className="w-3.5 h-3.5 text-white flex-shrink-0" fill="#F59E0B" strokeWidth={2.5} />
                              : <CheckCircle2 className="w-3.5 h-3.5 text-white flex-shrink-0" fill="#059669" strokeWidth={2.5} />}
                            <span className="text-[11px] text-gray-700 tabular-nums">{formatDate(patient.nextAppointmentDate)}</span>
                          </span>
                        ) : <span className="text-[11px] text-gray-300">—</span>}
                      </td>
                      <td className="px-3 py-2.5">{getStatusBadge(patient)}</td>
                      <td className="px-3 py-2.5 text-right">
                        <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition-colors inline-block" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
        )
      ) : (
        <div className="flex-1 min-h-0 flex gap-3 overflow-x-auto -mx-2 px-2">
          {kanbanColumns.filter(col => col.key !== 'overdue' || col.patients.length > 0).map(col => {
            const isOverdueCol = col.key === 'overdue';
            return (
            <div
              key={col.key}
              className="flex-shrink-0 w-72 rounded-md flex flex-col h-full"
              style={{ backgroundColor: isOverdueCol ? '#FEF3E2' : '#F4F2EE', border: `1px solid ${isOverdueCol ? '#F5D5A8' : '#E8E5DE'}` }}
            >
              <div className="px-3 py-2 flex items-center justify-between border-b flex-shrink-0" style={{ borderColor: isOverdueCol ? '#F5D5A8' : '#E8E5DE' }}>
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <img src={`/icons/${col.iconSvg}.svg`} alt="" className="w-5 h-5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[11px] font-semibold uppercase tracking-wider truncate ${isOverdueCol ? 'text-amber-800' : 'text-gray-700'}`}>
                        {col.label}
                      </span>
                      <span className={`text-[10px] tabular-nums ${isOverdueCol ? 'text-amber-700 font-semibold' : 'text-gray-400'}`}>{col.patients.length}</span>
                    </div>
                    {col.subtitle && (
                      <p className="text-[10px] text-gray-400 tabular-nums mt-0.5 leading-tight">{col.subtitle}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                {col.patients.length === 0 ? (
                  <div className="text-center py-6 text-[10px] uppercase tracking-wider text-gray-400">
                    {t('patients.empty')}
                  </div>
                ) : (
                  col.patients.map(p => <KanbanCard key={p.id} patient={p} />)
                )}
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* ── Modal nuevo paciente ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !creatingPatient && setIsModalOpen(false)} />
          <div className="relative bg-white rounded-md shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">{t('patients.modal.title')}</span>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newPatientName.trim()) { setCreateError(t('patients.modal.nameRequired')); return; }
                setCreatingPatient(true);
                setCreateError(null);
                try {
                  const id = await patientService.createPatient(newPatientName.trim());
                  setNewPatientName('');
                  setIsModalOpen(false);
                  fetchPatients();
                  router.push(`/detalle-paciente/${id}`);
                } catch {
                  setCreateError(t('patients.modal.createError'));
                } finally {
                  setCreatingPatient(false);
                }
              }}
              className="px-5 py-4 space-y-3"
            >
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 block mb-1.5">{t('patients.modal.nameLabel')}</label>
                <input
                  type="text"
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-white border border-gray-300 text-gray-800 placeholder:text-gray-400"
                  placeholder={t('patients.modal.namePlaceholder')}
                  disabled={creatingPatient}
                  autoFocus
                />
              </div>

              {createError && (
                <p className="text-[11px] text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {createError}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 -mx-5 px-5 -mb-4 py-2.5 border-t border-gray-200 bg-gray-50">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setCreateError(null); setNewPatientName(''); }}
                  disabled={creatingPatient}
                  className="text-xs px-3 py-1.5 rounded text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  {t('patients.modal.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={creatingPatient}
                  className="text-xs px-4 py-1.5 rounded font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {creatingPatient ? t('patients.modal.creating') : t('patients.modal.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientsPage;
