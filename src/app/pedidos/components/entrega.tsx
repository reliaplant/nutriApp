"use client";

import { useState, useEffect } from "react";
import { Order } from "../../shared/interfaces";

// Hard-coded available delivery dates and time slots
const AVAILABLE_DATES = [
  { value: "2023-11-20", label: "Lunes, 20 de Noviembre" },
  { value: "2023-11-21", label: "Martes, 21 de Noviembre" },
  { value: "2023-11-22", label: "Miércoles, 22 de Noviembre" },
  { value: "2023-11-23", label: "Jueves, 23 de Noviembre" },
  { value: "2023-11-24", label: "Viernes, 24 de Noviembre" },
];

const TIME_SLOTS = [
  { value: "09:00-11:00", label: "9:00 AM - 11:00 AM" },
  { value: "11:00-13:00", label: "11:00 AM - 1:00 PM" },
  { value: "13:00-15:00", label: "1:00 PM - 3:00 PM" },
  { value: "15:00-17:00", label: "3:00 PM - 5:00 PM" },
  { value: "17:00-19:00", label: "5:00 PM - 7:00 PM" },
];

interface EntregaProps {
  handleNext?: (deliveryInfo: { deliveryDate: string; deliveryTime: string }) => void;
  handleBack?: () => void;
  initialData?: Partial<Order>;
  removeNavButtons?: boolean; // Add this option
}

export default function Entrega({ 
  handleNext, 
  handleBack, 
  initialData,
  removeNavButtons = false // Default to showing the buttons
}: EntregaProps) {
  const [deliveryDate, setDeliveryDate] = useState(initialData?.deliveryDate || "");
  const [deliveryTime, setDeliveryTime] = useState(initialData?.deliveryTime || "");
  const [errors, setErrors] = useState({ date: false, time: false });

  // Generate current dates instead of hard-coded ones
  const [currentDates, setCurrentDates] = useState<typeof AVAILABLE_DATES>([]);
  
  useEffect(() => {
    const generateDates = () => {
      const dates = [];
      const today = new Date();
      
      // Start from tomorrow (or today if it's early)
      const startDay = today.getHours() < 12 ? 0 : 1;
      
      for (let i = startDay; i < startDay + 5; i++) {
        const date = new Date();
        date.setDate(today.getDate() + i);
        
        const options: Intl.DateTimeFormatOptions = { 
          weekday: 'long', 
          day: 'numeric', 
          month: 'long'
        };
        
        const formattedDate = date.toLocaleDateString('es-ES', options);
        const dateValue = date.toISOString().split('T')[0];
        
        dates.push({
          value: dateValue,
          label: formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)
        });
      }
      
      setCurrentDates(dates);
      
      // If there's no selected date, select the first available
      if (!deliveryDate && dates.length > 0) {
        setDeliveryDate(dates[0].value);
      }
    };
    
    generateDates();
  }, [deliveryDate]);

  // Store delivery data in localStorage when it changes
  useEffect(() => {
    if (deliveryDate && deliveryTime) {
      localStorage.setItem('deliveryData', JSON.stringify({ deliveryDate, deliveryTime }));
    }
  }, [deliveryDate, deliveryTime]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors = {
      date: !deliveryDate,
      time: !deliveryTime
    };
    
    setErrors(newErrors);
    
    if (!newErrors.date && !newErrors.time && handleNext) {
      handleNext({ 
        deliveryDate, 
        deliveryTime 
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h2 className="text-xl font-semibold mb-6 text-gray-800">Selecciona Fecha y Hora de Entrega</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label htmlFor="deliveryDate" className="block text-sm font-medium text-gray-700 mb-1">
            Fecha de Entrega <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
            {currentDates.map((date) => (
              <div key={date.value}>
                <input
                  type="radio"
                  id={date.value}
                  name="deliveryDate"
                  value={date.value}
                  className="sr-only"
                  checked={deliveryDate === date.value}
                  onChange={() => {
                    setDeliveryDate(date.value);
                    setErrors({...errors, date: false});
                  }}
                />
                <label
                  htmlFor={date.value}
                  className={`
                    block w-full px-4 py-3 text-center rounded-lg transition
                    ${deliveryDate === date.value
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                    }
                    cursor-pointer border ${errors.date ? 'border-red-500' : 'border-transparent'}
                  `}
                >
                  {date.label}
                </label>
              </div>
            ))}
          </div>
          {errors.date && (
            <p className="mt-2 text-sm text-red-500">Por favor, selecciona una fecha de entrega</p>
          )}
        </div>
        
        <div className="mb-6">
          <label htmlFor="deliveryTime" className="block text-sm font-medium text-gray-700 mb-1">
            Horario de Entrega <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
            {TIME_SLOTS.map((slot) => (
              <div key={slot.value}>
                <input
                  type="radio"
                  id={slot.value}
                  name="deliveryTime"
                  value={slot.value}
                  className="sr-only"
                  checked={deliveryTime === slot.value}
                  onChange={() => {
                    setDeliveryTime(slot.value);
                    setErrors({...errors, time: false});
                  }}
                />
                <label
                  htmlFor={slot.value}
                  className={`
                    block w-full px-4 py-3 text-center rounded-lg transition
                    ${deliveryTime === slot.value
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                    }
                    cursor-pointer border ${errors.time ? 'border-red-500' : 'border-transparent'}
                  `}
                >
                  {slot.label}
                </label>
              </div>
            ))}
          </div>
          {errors.time && (
            <p className="mt-2 text-sm text-red-500">Por favor, selecciona un horario de entrega</p>
          )}
        </div>
        
        {/* Hidden submit button that can be triggered from the parent */}
        <button
          id="submit-entrega-button"
          type="submit"
          className="hidden"
        >
          Submit
        </button>
        
        {/* Only show these buttons if removeNavButtons is false */}
        {!removeNavButtons && (
          <div className="flex justify-between mt-6">
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
              Continuar
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
