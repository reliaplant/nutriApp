import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

// Definición de tipos
export interface Ingredient {
  name: string;
  quantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface IngredientTypeaheadProps {
  value: string;
  onChange: (value: string) => void;
  onSelectIngredient: (ingredient: Ingredient) => void;
  ingredients: Ingredient[];
}

const IngredientTypeahead = ({ 
  value,
  onChange,
  onSelectIngredient,
  ingredients 
}: IngredientTypeaheadProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Ingredient[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  
  // Actualizar sugerencias cuando cambia el valor
  useEffect(() => {
    if (value.length >= 2) {
      const filtered = ingredients.filter(ingredient => 
        ingredient.name.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 8)); // Limitar a 8 sugerencias
    } else {
      setSuggestions([]);
    }
  }, [value, ingredients]);
  
  // Calcular la posición del dropdown
  useEffect(() => {
    if (inputRef.current && showSuggestions) {
      const rect = inputRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, [showSuggestions]);
  
  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Renderizar las sugerencias en un portal
  const renderSuggestions = () => {
    if (!showSuggestions || suggestions.length === 0) return null;
    
    return createPortal(
      <div 
        ref={containerRef}
        className="fixed bg-white shadow-2xl rounded-md border border-gray-300 max-h-64 overflow-y-auto z-[9999]"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          width: `${position.width}px`,
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.1)"
        }}
      >
        {suggestions.map((suggestion, idx) => (
          <div 
            key={idx} 
            className="p-2 hover:bg-emerald-50 cursor-pointer border-b last:border-b-0 border-gray-200"
            onClick={() => {
              onSelectIngredient(suggestion);
              onChange(suggestion.name);
              setShowSuggestions(false);
            }}
          >
            <div className="font-medium">{suggestion.name}</div>
            <div className="text-xs text-gray-500">
              {suggestion.calories} cal | {suggestion.protein}g prot | {suggestion.carbs}g carbs | {suggestion.fat}g grasas
            </div>
          </div>
        ))}
      </div>,
      document.body
    );
  };
  
  return (
    <div className="w-full">
      <input
        ref={inputRef}
        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setShowSuggestions(true)}
        placeholder="Buscar ingrediente..."
      />
      
      {renderSuggestions()}
    </div>
  );
};

export default IngredientTypeahead;