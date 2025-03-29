"use client";

import { useState, useEffect } from "react";
import { Refaccion, OrderItem } from "../../shared/interfaces";
import { refaccionService } from "../../shared/firebase";
import Image from "next/image";

interface ArmarPedidoProps {
  carrito: OrderItem[];
  agregarAlCarrito: (item: OrderItem) => void;
  removerDelCarrito: (refaccionId: string) => void;
}

export default function ArmarPedido({
  carrito,
  agregarAlCarrito,
  removerDelCarrito
}: ArmarPedidoProps) {
  const [refacciones, setRefacciones] = useState<Refaccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchRefacciones = async () => {
      try {
        setLoading(true);
        const disponibles = await refaccionService.getAvailableRefacciones();
        setRefacciones(disponibles);
        setError(null);
      } catch (err) {
        console.error("Error al cargar refacciones:", err);
        setError("No se pudieron cargar los productos disponibles");
      } finally {
        setLoading(false);
      }
    };
    
    fetchRefacciones();
  }, []);
  
  // Funciones para trabajar con el carrito
  const getItemCount = (refaccionId: string): number => {
    const item = carrito.find(item => item.refaccionId === refaccionId);
    return item ? item.quantity : 0;
  };
  
  const handleAgregarItem = (refaccion: Refaccion) => {
    if (!refaccion.id) return;
    
    const item: OrderItem = {
      refaccionId: refaccion.id,
      name: refaccion.name,
      price: refaccion.price,
      quantity: 1,
      photoUrl: refaccion.photoUrl
    };
    
    agregarAlCarrito(item);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center p-12 bg-white rounded-lg shadow-md">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-md">
        <p>{error}</p>
        <button 
          className="mt-3 bg-red-500 hover:bg-red-600 text-white py-1 px-4 rounded"
          onClick={() => window.location.reload()}
        >
          Reintentar
        </button>
      </div>
    );
  }
  
  if (refacciones.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg shadow-md">
        <p>No hay productos disponibles en este momento.</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Productos Disponibles</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {refacciones.map(refaccion => (
          <div 
            key={refaccion.id} 
            className="border border-gray-200 rounded-lg p-4 flex items-center hover:bg-gray-50 transition relative"
          >
            {refaccion.photoUrl && (
              <div className="relative w-20 h-20 mr-4">
                <Image 
                  src={refaccion.photoUrl}
                  alt={refaccion.name}
                  fill
                  style={{ objectFit: 'cover' }}
                  className="rounded-md"
                />
              </div>
            )}
            {!refaccion.photoUrl && (
              <div className="w-20 h-20 bg-gray-100 rounded-md mr-4 flex items-center justify-center text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800">{refaccion.name}</h3>
              <p className="text-sm text-gray-600">{refaccion.description}</p>
              <p className="font-bold mt-1 text-gray-800">${refaccion.price.toFixed(2)}</p>
            </div>
            
            <div className="flex items-center space-x-2">
              {getItemCount(refaccion.id || '') > 0 && (
                <>
                  <button 
                    onClick={() => removerDelCarrito(refaccion.id || '')}
                    className="bg-red-100 hover:bg-red-200 text-red-800 p-2 rounded-full"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  
                  <span className="font-semibold text-lg text-gray-800">{getItemCount(refaccion.id || '')}</span>
                </>
              )}
              
              <button 
                onClick={() => handleAgregarItem(refaccion)}
                className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 p-2 rounded-full"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            
            {getItemCount(refaccion.id || '') > 0 && (
              <div className="absolute top-2 right-2 bg-emerald-500 text-white text-xs h-6 w-6 flex items-center justify-center rounded-full">
                {getItemCount(refaccion.id || '')}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
