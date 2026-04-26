'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  format, parseISO, isToday, isSameMonth,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addMonths, subMonths, eachDayOfInterval
} from 'date-fns';
import { es, ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { patientService } from '@/app/shared/firebase';
import { useAuth } from '@/app/shared/AuthContext';
import { Patient } from '@/app/shared/interfaces';
import { useTranslation } from '@/app/shared/useTranslation';

export default function CalendarioPage() {
  const { firebaseUser, loading: authLoading } = useAuth();
  const { t, lang } = useTranslation();
  const dfLocale = lang === 'pt' ? ptBR : es;
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const fetchPatients = useCallback(async () => {
    if (!firebaseUser) return;
    setLoading(true);
    try {
      const fetched = await patientService.getAllPatients();
      setPatients(fetched);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    if (authLoading) return;
    if (firebaseUser) fetchPatients();
    else setLoading(false);
  }, [firebaseUser, authLoading, fetchPatients]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(calendarMonth);
    const monthEnd   = endOfMonth(calendarMonth);
    const calStart   = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd     = endOfWeek(monthEnd,   { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [calendarMonth]);

  const appointmentsByDay = useMemo(() => {
    const map = new Map<string, Patient[]>();
    patients.forEach(p => {
      if (p.nextAppointmentDate && p.status === 'active') {
        const key = format(parseISO(p.nextAppointmentDate), 'yyyy-MM-dd');
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(p);
      }
    });
    return map;
  }, [patients]);

  const totalCitas = useMemo(
    () => Array.from(appointmentsByDay.values()).reduce((s, arr) => s + arr.length, 0),
    [appointmentsByDay]
  );

  const PatientChip = ({ patient }: { patient: Patient }) => {
    const dateObj = patient.nextAppointmentDate ? parseISO(patient.nextAppointmentDate) : null;
    const time = dateObj ? format(dateObj, 'HH:mm') : '';
    const completed = dateObj ? dateObj.getTime() < Date.now() : false;
    return (
      <Link
        href={`/detalle-paciente/${patient.id}`}
        className="flex items-center gap-1.5 px-1.5 py-1 rounded bg-white hover:shadow-md transition-all group"
        style={{ border: '1px solid #E8E5DE', boxShadow: '0 1px 2px rgba(0,0,0,0.06), 0 1px 1px rgba(0,0,0,0.04)' }}
        title={`${time} · ${patient.name} · ${completed ? t('calendar.completed') : t('calendar.pending')}`}
      >
        {completed ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-white flex-shrink-0" fill="#059669" strokeWidth={2.5} />
        ) : (
          <AlertCircle className="w-3.5 h-3.5 text-white flex-shrink-0" fill="#F59E0B" strokeWidth={2.5} />
        )}
        <span className="text-[10px] font-semibold text-gray-700 tabular-nums flex-shrink-0">{time}</span>
        <span className="text-[10px] text-gray-700 font-medium truncate flex-1">{patient.name}</span>
      </Link>
    );
  };

  return (
    <div className="bg-cream-pattern px-6 py-5 max-w-[1600px] mx-auto" style={{ minHeight: '100vh' }}>
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <h1 className="text-base font-semibold text-gray-800 mr-1">{t('calendar.title')}</h1>
        <span className="text-[11px] text-gray-400 tabular-nums">
          {totalCitas} {totalCitas === 1 ? t('calendar.apptOne') : t('calendar.apptMany')} {t('calendar.thisMonth')}
        </span>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setCalendarMonth(prev => subMonths(prev, 1))}
            className="p-1 rounded hover:bg-white border border-transparent hover:border-gray-200 transition-colors"
            title={t('calendar.prevMonth')}
          >
            <ChevronLeft className="w-3.5 h-3.5 text-gray-500" />
          </button>
          <span className="text-xs font-medium text-gray-700 capitalize tabular-nums min-w-[110px] text-center">
            {format(calendarMonth, 'MMMM yyyy', { locale: dfLocale })}
          </span>
          <button
            onClick={() => setCalendarMonth(prev => addMonths(prev, 1))}
            className="p-1 rounded hover:bg-white border border-transparent hover:border-gray-200 transition-colors"
            title={t('calendar.nextMonth')}
          >
            <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
          </button>
          <button
            onClick={() => setCalendarMonth(new Date())}
            className="ml-1 px-2.5 py-1 text-[11px] rounded transition-colors text-gray-600 hover:text-gray-900 bg-white border border-gray-200 hover:border-gray-300"
          >
            {t('calendar.today')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-60">
          <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-md overflow-hidden" style={{ border: '1px solid #E8E5DE' }}>
          {/* Day headers */}
          <div className="grid grid-cols-7" style={{ backgroundColor: '#FAF9F7', borderBottom: '1px solid #E8E5DE' }}>
            {(t('calendar.weekdaysShort') as string[]).map(day => (
              <div key={day} className="text-center py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                {day}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, idx) => {
              const key = format(day, 'yyyy-MM-dd');
              const dayPatients = appointmentsByDay.get(key) || [];
              const isCurrentMonth = isSameMonth(day, calendarMonth);
              const today = isToday(day);

              return (
                <div
                  key={idx}
                  className="min-h-[120px] p-1.5 flex flex-col"
                  style={{
                    borderRight: (idx % 7 !== 6) ? '1px solid #F0EDE8' : 'none',
                    borderTop: idx >= 7 ? '1px solid #F0EDE8' : 'none',
                    backgroundColor: today ? '#F0FDF4' : !isCurrentMonth ? '#FAF9F7' : '#FFFFFF',
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    {today ? (
                      <span className="bg-emerald-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-semibold tabular-nums">
                        {format(day, 'd')}
                      </span>
                    ) : (
                      <span className={`text-[11px] tabular-nums font-medium ${isCurrentMonth ? 'text-gray-700' : 'text-gray-300'}`}>
                        {format(day, 'd')}
                      </span>
                    )}
                    {dayPatients.length > 0 && (
                      <span className="text-[9px] text-gray-400 font-semibold tabular-nums">{dayPatients.length}</span>
                    )}
                  </div>
                  <div className="space-y-1 flex-1">
                    {dayPatients.slice(0, 3).map(p => (
                      <PatientChip key={p.id} patient={p} />
                    ))}
                    {dayPatients.length > 3 && (
                      <p className="text-[10px] text-gray-500 font-medium px-1">+{dayPatients.length - 3} {t('calendar.more')}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!loading && totalCitas === 0 && (
        <div className="mt-4 text-center py-10 rounded-md text-xs text-gray-400 border border-dashed flex flex-col items-center gap-2"
          style={{ borderColor: '#E8E5DE', backgroundColor: '#FFFFFF' }}>
          <CalendarIcon className="w-5 h-5 text-gray-300" />
          {t('calendar.empty')}
        </div>
      )}
    </div>
  );
}
