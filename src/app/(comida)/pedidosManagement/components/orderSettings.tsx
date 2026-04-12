'use client'

import React, { useState, useEffect } from 'react';
import { orderSettingsService } from '@/app/shared/firebase';
import { OrderSettings } from '@/app/shared/interfaces';
import { X } from 'lucide-react';

interface OrderSettingsModalProps {
  onClose: () => void;
}

export default function OrderSettingsModal({ onClose }: OrderSettingsModalProps) {
  const [settings, setSettings] = useState<OrderSettings>({
    shippingFee: 0,
    freeShippingThreshold: 0,
    discountThreshold: 0,
    discountAmount: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const currentSettings = await orderSettingsService.getSettings();
      setSettings(currentSettings);
    } catch (err) {
      console.error('Error loading settings:', err);
      setError('Error al cargar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await orderSettingsService.updateSettings(settings);
      alert('Configuración guardada con éxito');
      onClose();
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg">
          Cargando configuración...
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Configuración de Promociones</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Costo de envío base ($)
            </label>
            <input
              type="number"
              value={settings.shippingFee}
              onChange={(e) => setSettings({...settings, shippingFee: Number(e.target.value)})}
              className="w-full p-2 border rounded"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monto mínimo para envío gratis ($)
            </label>
            <input
              type="number"
              value={settings.freeShippingThreshold}
              onChange={(e) => setSettings({...settings, freeShippingThreshold: Number(e.target.value)})}
              className="w-full p-2 border rounded"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monto mínimo para descuento ($)
            </label>
            <input
              type="number"
              value={settings.discountThreshold}
              onChange={(e) => setSettings({...settings, discountThreshold: Number(e.target.value)})}
              className="w-full p-2 border rounded"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monto del descuento ($)
            </label>
            <input
              type="number"
              value={settings.discountAmount}
              onChange={(e) => setSettings({...settings, discountAmount: Number(e.target.value)})}
              className="w-full p-2 border rounded"
              min="0"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-4 bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}
