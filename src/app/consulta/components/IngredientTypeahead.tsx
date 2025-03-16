import React, { useState, useEffect, useRef } from 'react';

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
  const inputRef = useRef<HTMLDivElement>(null);
  
  // Actualizar sugerencias cuando cambia el valor
  useEffect(() => {
    if (value.length >= 2) {
      const filtered = ingredients.filter(ingredient => 
        ingredient.name.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [value, ingredients]);
  
  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  return (
    <div className="relative" ref={inputRef}>
      <input
        className="w-full px-2 pl-4 py-[10px] text-sm  hover:bg-gray-100 focus:outline-blue-500 "
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setShowSuggestions(true)}
        placeholder="Buscar ingrediente..."
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 left-0 mt-1 w-60 bg-white shadow-lg rounded-md border max-h-48 overflow-y-auto">
          {suggestions.map((suggestion, idx) => (
            <div 
              key={idx} 
              className="p-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
              onClick={() => {
                onSelectIngredient(suggestion);
                setShowSuggestions(false);
              }}
            >
              <div className="font-medium">{suggestion.name}</div>
              <div className="text-xs text-gray-500">
                {suggestion.calories} cal | {suggestion.protein}g prot | {suggestion.carbs}g carbs | {suggestion.fat}g grasas
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default IngredientTypeahead;