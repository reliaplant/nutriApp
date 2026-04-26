'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { app } from '@/app/shared/firebase';
import {
  getFirestore, collection, query, where, getDocs, deleteDoc, doc,
} from 'firebase/firestore';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Ruler, Plus, Trash2, ChevronRight } from 'lucide-react';

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
  const [items, setItems] = useState<Anthropometry[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

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
      alert('Error al eliminar');
    } finally {
      setConfirmDelete(null);
    }
  };

  return (
    <div className="bg-white rounded-md p-5" style={{ border: '1px solid #E8E5DE' }}>
      <div className="flex justify-between items-center mb-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
          <Ruler className="w-3 h-3" /> Antropometría
        </p>
        <button
          onClick={goNew}
          className="text-[11px] bg-emerald-600 text-white px-2.5 py-1 rounded font-medium hover:bg-emerald-700 flex items-center gap-1"
        >
          <Plus className="w-3 h-3" strokeWidth={2.5} /> Nueva medición
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
                    {format(parseISO(a.date), "d 'de' MMMM yyyy", { locale: es })}
                  </p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-gray-600 tabular-nums">
                    {a.peso != null && <span><strong className="text-gray-900">{a.peso}</strong> kg</span>}
                    {a.computed?.bmi != null && <span>IMC <strong className="text-gray-900">{a.computed.bmi}</strong></span>}
                    {a.computed?.bodyFatPct != null && <span>{a.computed.bodyFatPct}% grasa</span>}
                    {a.computed?.targetCalories != null && <span><strong>{a.computed.targetCalories}</strong> kcal</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmDelete(a.id); }}
                    className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                    title="Eliminar"
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
        <p className="text-xs text-gray-400 text-center py-6">No hay mediciones registradas</p>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/35 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-md w-full max-w-xs p-5" style={{ border: '1px solid #E8E5DE' }}>
            <p className="text-sm font-semibold text-gray-800 mb-1">Eliminar medición</p>
            <p className="text-xs text-gray-500 mb-4">Esta acción no se puede deshacer.</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-3 py-1 border border-gray-300 rounded text-[11px] text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="px-3 py-1 bg-red-600 text-white rounded text-[11px] hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
