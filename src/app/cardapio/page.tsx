'use client';
import { useState, useEffect } from 'react';
import { Refaccion } from '../shared/interfaces';
import { refaccionService } from '../shared/firebase';
import RefaccionModal from './refaccion';

export default function CardapioPage() {
  const [refacciones, setRefacciones] = useState<Refaccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRefaccion, setSelectedRefaccion] = useState<Refaccion | null>(null);

  useEffect(() => {
    loadRefacciones();
  }, []);

  const loadRefacciones = async () => {
    try {
      const data = await refaccionService.getRefacciones();
      setRefacciones(data);
    } catch (error) {
      console.error('Error loading refacciones:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Cargando refacciones...</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Menú de Refacciones</h1>
        <button 
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={() => setModalOpen(true)}
        >
          Agregar Refacción
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {refacciones.map((refaccion) => (
          <div 
            key={refaccion.id}
            className="border rounded-lg overflow-hidden cursor-pointer hover:shadow-lg"
            onClick={() => {
              setSelectedRefaccion(refaccion);
              setModalOpen(true);
            }}
          >
            {refaccion.photoUrl && (
              <img
                src={refaccion.photoUrl}
                alt={refaccion.name}
                className="w-full h-40 object-cover"
              />
            )}
            <div className="p-4">
              <h3 className="text-xl font-semibold mb-2">{refaccion.name}</h3>
              <p className="text-gray-600 mb-2">{refaccion.description}</p>
              <div className="space-y-1">
                <p>Calorías: {refaccion.calories}</p>
                <p>Precio: ${refaccion.price}</p>
                <p className={
                  refaccion.status === 'available' 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }>
                  {refaccion.status === 'available' ? 'Disponible' : 'No disponible'}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <RefaccionModal 
        open={modalOpen} 
        onClose={(refresh) => {
          setModalOpen(false);
          setSelectedRefaccion(null);
          if (refresh) loadRefacciones();
        }}
        refaccion={selectedRefaccion}
      />
    </div>
  );
}
