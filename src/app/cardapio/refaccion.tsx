'use client';
import { useState, useEffect } from 'react';
import { Refaccion } from '../shared/interfaces';
import { refaccionService, storage } from '../shared/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface RefaccionModalProps {
  open: boolean;
  onClose: (refreshData?: boolean) => void;
  refaccion?: Refaccion | null;
}

export default function RefaccionModal({ open, onClose, refaccion }: RefaccionModalProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Partial<Refaccion>>({
    name: '',
    description: '',
    calories: 0,
    price: 0,
    status: 'available',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    if (refaccion) {
      setForm(refaccion);
    } else {
      setForm({
        name: '',
        description: '',
        calories: 0,
        price: 0,
        status: 'available',
      });
    }
  }, [refaccion]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      let photoUrl = form.photoUrl;
      if (imageFile) {
        const storageRef = ref(storage, `refacciones/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(storageRef, imageFile);
        photoUrl = await getDownloadURL(snapshot.ref);
      }

      const refaccionData: Refaccion = {
        name: form.name || '',
        description: form.description || '',
        calories: form.calories || 0,
        price: form.price || 0,
        status: form.status || 'available',
        ...(photoUrl ? { photoUrl } : {}) // Solo incluir photoUrl si existe
      };

      if (refaccion?.id) {
        await refaccionService.updateRefaccion(refaccion.id, refaccionData);
      } else {
        await refaccionService.createRefaccion(refaccionData);
      }

      onClose(true);
    } catch (error) {
      console.error('Error saving refaccion:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-xl font-bold mb-4">
          {refaccion ? 'Editar' : 'Agregar'} Refacción
        </h3>
        
        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Nombre"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full p-2 border rounded"
          />
          <textarea
            placeholder="Descripción"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full p-2 border rounded"
          />
          <input
            type="number"
            placeholder="Calorías"
            value={form.calories}
            onChange={(e) => setForm({ ...form, calories: Number(e.target.value) })}
            className="w-full p-2 border rounded"
          />
          <input
            type="number"
            placeholder="Precio"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            className="w-full p-2 border rounded"
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            className="w-full"
          />
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={form.status === 'available'}
              onChange={(e) => setForm({ 
                ...form, 
                status: e.target.checked ? 'available' : 'unavailable' 
              })}
            />
            <span>Disponible</span>
          </label>

          <div className="flex justify-end space-x-2 pt-4">
            {refaccion && (
              <button
                type="button"
                onClick={async () => {
                  if (!refaccion?.id) return;
                  if (!confirm('¿Estás seguro de eliminar esta refacción?')) return;
                  
                  try {
                    setLoading(true);
                    await refaccionService.deleteRefaccion(refaccion.id);
                    onClose(true);
                  } catch (error) {
                    console.error('Error deleting refaccion:', error);
                  } finally {
                    setLoading(false);
                  }
                }}
                className="px-4 py-2 bg-red-500 text-white rounded"
                disabled={loading}
              >
                Eliminar
              </button>
            )}
            <button
              type="button"
              onClick={() => onClose(false)}
              className="px-4 py-2 bg-gray-200 rounded"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded"
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
