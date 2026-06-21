'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { patientService, authService } from '@/app/shared/firebase';
import { Patient } from '@/app/shared/interfaces';
import { useTranslation } from '@/app/shared/useTranslation';

interface PatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPatientCreated: () => void;
}

const PatientModal: React.FC<PatientModalProps> = ({ isOpen, onClose, onPatientCreated }) => {
  const { t } = useTranslation();
  const [patientName, setPatientName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!patientName.trim()) {
      setError(t('patientCreate.nameRequired'));
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
      setError(t('patientCreate.createError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 modal-backdrop" onClick={onClose}>
      <div
        className="bg-white rounded-lg w-full max-w-sm overflow-hidden modal-panel"
        style={{ border: '1px solid #E8E5DE', boxShadow: '0 16px 40px -12px rgba(120, 100, 80, 0.22), 0 4px 12px rgba(0,0,0,0.05)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-3.5" style={{ backgroundColor: '#FAF9F7', borderBottom: '1px solid #F0EDE8' }}>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{t('patientCreate.eyebrow') !== 'patientCreate.eyebrow' ? t('patientCreate.eyebrow') : 'Paciente'}</p>
          <p className="text-sm font-semibold text-gray-800 mt-0.5">{t('patientCreate.title')}</p>
        </div>

        {error && (
          <div className="mx-5 mt-3 px-3 py-2 rounded-sm text-[11px] text-red-700 flex items-center gap-2" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}>
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" /></svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="px-5 py-4">
            <label htmlFor="patientName" className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
              {t('patientCreate.nameLabel')}
            </label>
            <input
              id="patientName"
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded-sm text-xs focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400"
              placeholder={t('patientCreate.namePh')}
              disabled={isLoading}
              autoFocus
            />
          </div>

          <div className="px-5 py-3 flex justify-end gap-2" style={{ backgroundColor: '#FAF9F7', borderTop: '1px solid #E8E5DE' }}>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-white rounded-sm text-[11px] text-gray-600 hover:bg-[#FAF9F7] transition-colors"
              style={{ border: '1px solid #E8E5DE' }}
              disabled={isLoading}
            >
              {t('patientCreate.cancel')}
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 bg-emerald-600 text-white rounded-sm text-[11px] font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              disabled={isLoading}
            >
              {isLoading ? t('patientCreate.creating') : t('patientCreate.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientModal;