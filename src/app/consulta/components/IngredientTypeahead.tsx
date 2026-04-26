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
  icon?: string;
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
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  
  // Actualizar sugerencias cuando cambia el valor
  useEffect(() => {
    if (localValue.length >= 2) {
      const filtered = ingredients.filter(ingredient => 
        ingredient.name.toLowerCase().includes(localValue.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 8));
    } else {
      setSuggestions([]);
    }
  }, [localValue, ingredients]);

  // Sync external value
  useEffect(() => {
    setLocalValue(value);
  }, [value]);
  
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
        className="fixed rounded-sm max-h-52 overflow-y-auto z-[9999]"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          width: `${position.width}px`,
          backgroundColor: '#FFFFFF',
          border: '1px solid #E8E5DE',
          boxShadow: "0 12px 32px -4px rgba(0, 0, 0, 0.12), 0 4px 8px -2px rgba(0, 0, 0, 0.06)"
        }}
      >
        {suggestions.map((suggestion, idx) => (
          <div 
            key={idx} 
            className="px-2.5 py-1.5 cursor-pointer transition-colors flex items-center gap-2"
            style={{ borderTop: idx > 0 ? '1px solid #F0EDE8' : 'none' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FAF9F7'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            onClick={() => {
              onSelectIngredient(suggestion);
              onChange(suggestion.name);
              setLocalValue('');
              setShowSuggestions(false);
            }}
          >
            {suggestion.icon && (
              <img src={`/icons/${suggestion.icon}.svg`} alt="" className="w-5 h-5 flex-shrink-0" />
            )}
            <div className="min-w-0">
              <div className="text-xs font-medium" style={{ color: '#2D2B28' }}>{suggestion.name}</div>
              <div className="text-[10px]" style={{ color: '#8B8680' }}>
                {suggestion.calories} cal · {suggestion.protein}g prot · {suggestion.carbs}g carb · {suggestion.fat}g grasa
              </div>
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
        className="w-full px-2.5 py-1.5 text-xs rounded-sm focus:outline-none focus:ring-1 focus:ring-emerald-200 transition-shadow"
        style={{ backgroundColor: '#FFFFFF', border: '1px solid #CCC9C3', color: '#2D2B28' }}
        value={localValue}
        onChange={(e) => {
          setLocalValue(e.target.value);
          onChange(e.target.value);
        }}
        onFocus={() => setShowSuggestions(true)}
        placeholder="🔍 Buscar ingrediente..."
      />
      
      {renderSuggestions()}
    </div>
  );
};

export default IngredientTypeahead;