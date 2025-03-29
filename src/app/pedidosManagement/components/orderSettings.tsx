"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../shared/firebase";

// Definir la interfaz para las configuraciones de pedidos
interface OrderSettings {
  shippingFee: number;
  freeShippingThreshold: number;
  discountThreshold: number;
  discountAmount: number;
}

interface OrderSettingsModalProps {
  onClose: () => void;
}

export default function OrderSettingsModal({ onClose }: OrderSettingsModalProps) {
  // Estado para las configuraciones
  const [settings, setSettings] = useState<OrderSettings>({
    shippingFee: 100,
    freeShippingThreshold: 1000,
    discountThreshold: 1800,
    discountAmount: 300
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Cargar configuraciones actuales al montar el componente
  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        // Consultar el documento único que contiene las configuraciones
        const settingsDoc = await getDoc(doc(db, "orderSettings", "current"));
        
        if (settingsDoc.exists()) {
          // Si existe, usar esos valores
          const data = settingsDoc.data() as OrderSettings;
          setSettings(data);
        }
        // Si no existe, se usarán los valores predeterminados del estado
      } catch (err) {
        console.error("Error al cargar configuraciones:", err);
        setError("No se pudieron cargar las configuraciones actuales");
      } finally {
        setLoading(false);
      }
    }
    
    loadSettings();
  }, []);

  // Manejar cambios en el formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings({
      ...settings,
      [name]: parseFloat(value)
    });
  };

  // Guardar configuraciones
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      
      // Guardar en el documento único - sobreescribirlo
      await setDoc(doc(db, "orderSettings", "current"), {
        ...settings,
        updatedAt: new Date()
      });
      
      setSuccess(true);
      
      // Ocultar mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
      
    } catch (err) {
      console.error("Error al guardar configuraciones:", err);
      setError("No se pudieron guardar las configuraciones. Intenta nuevamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Configuración de Promociones</h2>
            <button 
              onClick={onClose} 
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
          ) : (
            <form onSubmit={handleSave}>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md">
                  Configuración guardada correctamente
                </div>
              )}
              
              <div className="mb-4">
                <label htmlFor="shippingFee" className="block text-sm font-medium text-gray-700 mb-1">
                  Costo de Envío ($)
                </label>
                <input
                  type="number"
                  id="shippingFee"
                  name="shippingFee"
                  min="0"
                  step="0.01"
                  value={settings.shippingFee}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">Costo base del envío para todos los pedidos</p>
              </div>
              
              <div className="mb-4">
                <label htmlFor="freeShippingThreshold" className="block text-sm font-medium text-gray-700 mb-1">
                  Umbral para Envío Gratis ($)
                </label>
                <input
                  type="number"
                  id="freeShippingThreshold"
                  name="freeShippingThreshold"
                  min="0"
                  step="0.01"
                  value={settings.freeShippingThreshold}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">A partir de qué monto el envío será gratuito</p>
              </div>
              
              <div className="mb-4">
                <label htmlFor="discountThreshold" className="block text-sm font-medium text-gray-700 mb-1">
                  Umbral para Descuento ($)
                </label>
                <input
                  type="number"
                  id="discountThreshold"
                  name="discountThreshold"
                  min="0"
                  step="0.01"
                  value={settings.discountThreshold}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">A partir de qué monto se aplicará el descuento promocional</p>
              </div>
              
              <div className="mb-6">
                <label htmlFor="discountAmount" className="block text-sm font-medium text-gray-700 mb-1">
                  Monto de Descuento ($)
                </label>
                <input
                  type="number"
                  id="discountAmount"
                  name="discountAmount"
                  min="0"
                  step="0.01"
                  value={settings.discountAmount}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">Cantidad que se descontará al alcanzar el umbral</p>
              </div>
              
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    disabled={saving}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 rounded-md text-white ${saving ? 'bg-gray-400' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                    disabled={saving}
                  >
                    {saving ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        <span>Guardando...</span>
                      </div>
                    ) : (
                      'Guardar Cambios'
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
