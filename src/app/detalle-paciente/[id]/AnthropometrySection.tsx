'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { app } from '@/app/shared/firebase';
import {
  getFirestore, collection, query, where, getDocs, deleteDoc, doc,
} from 'firebase/firestore';
import { format, parseISO } from 'date-fns';
import { es, ptBR } from 'date-fns/locale';
import { Ruler, Plus, Trash2, ChevronRight, Info } from 'lucide-react';
import { useTranslation } from '@/app/shared/useTranslation';

interface Anthropometry {
  id: string;
  patientId: string;
  date: string;
  peso?: number;
  computed?: {
    bmi?: number;
    bodyFatPct?: number;
    tmb?: number;
    get?: number;
    targetCalories?: number;
  };
  notas?: string;
}

interface Props {
  patientId: string;
}

export default function AnthropometrySection({ patientId }: Props) {
  const db = getFirestore(app);
  const router = useRouter();
  const { t, lang } = useTranslation();
  const dateLocale = lang === 'pt' ? ptBR : es;
  const [items, setItems] = useState<Anthropometry[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  const fetchItems = async () => {
    if (!patientId || patientId === 'new') { setLoading(false); return; }
    setLoading(true);
    try {
      const q = query(collection(db, 'patientAnthropometries'), where('patientId', '==', patientId));
      const snap = await getDocs(q);
      const list: Anthropometry[] = [];
      snap.forEach(d => list.push({ id: d.id, ...(d.data() as any) }));
      list.sort((a, b) => (b.date > a.date ? 1 : -1));
      setItems(list);
    } catch (e) {
      console.error('fetch anthropometries:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); /* eslint-disable-next-line */ }, [patientId]);

  const goNew  = () => router.push(`/antropometria/new?patientId=${patientId}`);
  const goEdit = (id: string) => router.push(`/antropometria/${id}?patientId=${patientId}`);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'patientAnthropometries', id));
      setItems(prev => prev.filter(p => p.id !== id));
    } catch (e) {
      console.error(e);
      alert(t('anthropometry.deleteError'));
    } finally {
      setConfirmDelete(null);
    }
  };

  return (
    <div className="bg-white rounded-md p-5" style={{ border: '1px solid #E8E5DE' }}>
      <div className="flex justify-between items-center mb-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
          <Ruler className="w-3 h-3" /> {t('anthropometry.sectionTitle')}
          <button
            onClick={() => setShowInfo(true)}
            className="text-gray-400 hover:text-gray-600 transition-colors ml-0.5"
            aria-label="Info antropometría"
          >
            <Info className="w-3 h-3" />
          </button>
        </p>
        <button
          onClick={goNew}
          className="text-[11px] bg-emerald-600 text-white px-2.5 py-1 rounded font-medium hover:bg-emerald-700 flex items-center gap-1"
        >
          <Plus className="w-3 h-3" strokeWidth={2.5} /> {t('anthropometry.newMeasure')}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-emerald-600 border-t-transparent" />
        </div>
      ) : items.length > 0 ? (
        <div className="space-y-1.5">
          {items.map(a => (
            <div
              key={a.id}
              onClick={() => goEdit(a.id)}
              className="group rounded p-3 hover:bg-[#FAF9F7] transition-colors cursor-pointer"
              style={{ border: '1px solid #F0EDE8' }}
            >
              <div className="flex justify-between items-center">
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-gray-800 tabular-nums mb-1">
                    {format(parseISO(a.date), lang === 'pt' ? "d 'de' MMMM 'de' yyyy" : "d 'de' MMMM yyyy", { locale: dateLocale })}
                  </p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-gray-600 tabular-nums">
                    {a.peso != null && <span><strong className="text-gray-900">{a.peso}</strong> kg</span>}
                    {a.computed?.bmi != null && <span>{t('anthropometry.bmiShort')} <strong className="text-gray-900">{a.computed.bmi}</strong></span>}
                    {a.computed?.bodyFatPct != null && <span>{a.computed.bodyFatPct}{t('anthropometry.fatShort')}</span>}
                    {a.computed?.targetCalories != null && <span><strong>{a.computed.targetCalories}</strong> kcal</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmDelete(a.id); }}
                    className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                    title={t('common.delete')}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-emerald-600 transition-colors" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400 text-center py-6">{t('anthropometry.noMeasures')}</p>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/35 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-md w-full max-w-xs p-5" style={{ border: '1px solid #E8E5DE' }}>
            <p className="text-sm font-semibold text-gray-800 mb-1">{t('anthropometry.deleteTitle')}</p>
            <p className="text-xs text-gray-500 mb-4">{t('anthropometry.deleteMsg')}</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-3 py-1 border border-gray-300 rounded text-[11px] text-gray-700 hover:bg-gray-50"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="px-3 py-1 bg-red-600 text-white rounded text-[11px] hover:bg-red-700"
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showInfo && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4 modal-backdrop" onClick={() => setShowInfo(false)}>
          <div
            className="bg-white rounded-lg w-full max-w-md overflow-hidden modal-panel"
            style={{ border: '1px solid #E8E5DE', boxShadow: '0 16px 40px -12px rgba(120, 100, 80, 0.22), 0 4px 12px rgba(0,0,0,0.05)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5" style={{ backgroundColor: '#FAF9F7', borderBottom: '1px solid #F0EDE8' }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{t('anthropometry.sectionTitle')}</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">{t('anthropometry.infoTitle') !== 'anthropometry.infoTitle' ? t('anthropometry.infoTitle') : '¿Qué es la antropometría?'}</p>
            </div>
            <div className="px-5 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
              <p className="text-[12px] text-gray-600 leading-relaxed">
                {t('anthropometry.infoBody1') !== 'anthropometry.infoBody1'
                  ? t('anthropometry.infoBody1')
                  : 'La antropometría es el conjunto de medidas del cuerpo humano (peso, altura, circunferencias, pliegues) que sirven para evaluar la composición corporal y el estado nutricional del paciente.'}
              </p>
              <div className="space-y-2.5">
                <div className="flex gap-2.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 mt-0.5 flex-shrink-0 w-20">IMC</span>
                  <p className="text-[11px] text-gray-600 leading-relaxed flex-1">Relaciona peso y altura. Indicador rápido de bajo peso, normal, sobrepeso u obesidad.</p>
                </div>
                <div className="flex gap-2.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 mt-0.5 flex-shrink-0 w-20">% Grasa</span>
                  <p className="text-[11px] text-gray-600 leading-relaxed flex-1">Estimación con el método Navy (cintura, cuello, cadera) o Deurenberg si faltan circunferencias.</p>
                </div>
                <div className="flex gap-2.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 mt-0.5 flex-shrink-0 w-20">TMB</span>
                  <p className="text-[11px] text-gray-600 leading-relaxed flex-1">Tasa Metabólica Basal: calorías que el cuerpo gasta en reposo absoluto en 24 h.</p>
                </div>
                <div className="flex gap-2.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 mt-0.5 flex-shrink-0 w-20">GET</span>
                  <p className="text-[11px] text-gray-600 leading-relaxed flex-1">Gasto Energético Total: TMB × factor de actividad física. Es lo que el paciente gasta al día.</p>
                </div>
                <div className="flex gap-2.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 mt-0.5 flex-shrink-0 w-20">Kcal objetivo</span>
                  <p className="text-[11px] text-gray-600 leading-relaxed flex-1">Calorías diarias para alcanzar la meta (déficit, mantenimiento o superávit).</p>
                </div>
                <div className="flex gap-2.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 mt-0.5 flex-shrink-0 w-20">WHR</span>
                  <p className="text-[11px] text-gray-600 leading-relaxed flex-1">Cintura/cadera. Predictor de riesgo cardiovascular asociado a grasa abdominal.</p>
                </div>
                <div className="flex gap-2.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 mt-0.5 flex-shrink-0 w-20">WHtR</span>
                  <p className="text-[11px] text-gray-600 leading-relaxed flex-1">Cintura/altura. Mejor predictor de riesgo metabólico que el IMC. Saludable: &lt; 0.5.</p>
                </div>
              </div>
              <div className="rounded-md p-2.5 flex items-start gap-2" style={{ backgroundColor: '#FAF9F7', border: '1px solid #F0EDE8' }}>
                <Info className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Crea una antropometría tras cada control para tener un seguimiento objetivo. Necesitas como mínimo: peso, altura, edad y sexo.
                </p>
              </div>
            </div>
            <div className="px-5 py-3 flex justify-end" style={{ backgroundColor: '#FAF9F7', borderTop: '1px solid #E8E5DE' }}>
              <button onClick={() => setShowInfo(false)} className="px-3 py-1.5 bg-white rounded-sm text-[11px] text-gray-600 hover:bg-[#FAF9F7] transition-colors" style={{ border: '1px solid #E8E5DE' }}>{t('patientDetail.close') !== 'patientDetail.close' ? t('patientDetail.close') : 'Cerrar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
