"use client";

import { useState, useEffect } from "react";
import { Order } from "../../shared/interfaces";

interface FormularioSalidaProps {
  handleNext?: (data: Partial<Order>) => void;
  handleBack?: () => void;
  initialData?: Partial<Order>;
  removeNavButtons?: boolean; // Add this option
}

export default function FormularioSalida({ 
  handleNext, 
  handleBack,
  initialData,
  removeNavButtons = false // Default to showing the buttons
}: FormularioSalidaProps) {
  const [formData, setFormData] = useState({
    customerName: initialData?.customerName || "",
    contact: initialData?.contact || "",
    notes: initialData?.notes || "",
  });
  
  const [formErrors, setFormErrors] = useState({
    customerName: false
  });

  // Store form data in localStorage when it changes
  useEffect(() => {
    localStorage.setItem('formData', JSON.stringify(formData));
  }, [formData]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error if field is filled
    if (name === 'customerName' && value.trim() !== '') {
      setFormErrors(prev => ({ ...prev, customerName: false }));
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.customerName.trim()) {
      setFormErrors(prev => ({ ...prev, customerName: true }));
      return;
    }
    
    // Submit data if handleNext exists
    if (handleNext) {
      handleNext({
        customerName: formData.customerName,
        contact: formData.contact,
        notes: formData.notes
      });
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h2 className="text-xl font-semibold mb-6 text-gray-800">Información del Pedido</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="customerName"
            name="customerName"
            value={formData.customerName}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md bg-gray-50 ${
              formErrors.customerName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Tu nombre completo"
          />
          {formErrors.customerName && (
            <p className="mt-1 text-sm text-red-500">Por favor ingresa tu nombre</p>
          )}
        </div>
        
        <div className="mb-4">
          <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono o Correo Electrónico
          </label>
          <input
            type="text"
            id="contact"
            name="contact"
            value={formData.contact}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
            placeholder="Tu teléfono o correo electrónico"
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notas
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
            placeholder="Notas adicionales sobre el pedido"
          />
        </div>
        
        {/* Hidden submit button that can be triggered from the parent */}
        <button
          id="submit-form-button"
          type="submit"
          className="hidden"
        >
          Submit
        </button>
        
        {/* Only show these buttons if removeNavButtons is false */}
        {!removeNavButtons && (
          <div className="flex justify-between">
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md"
            >
              Atrás
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md"
            >
              Siguiente
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
