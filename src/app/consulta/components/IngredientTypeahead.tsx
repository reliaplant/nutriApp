import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from '@/app/shared/useTranslation';

// Definición de tipos
export interface IngredientPortion {
  label: string;
  grams: number;
}

export interface IngredientPrep {
  key: string;
  label: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  portions: IngredientPortion[];
}

export interface Ingredient {
  name: string;
  quantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  icon?: string;
  /** Porciones caseras provenientes de la BDD (gramos exactos). */
  portions?: IngredientPortion[];
  /** Modos de preparación disponibles (cuando aplica). */
  preparations?: IngredientPrep[];
  /** Nombre base del concepto (sin sufijo de preparación). */
  baseName?: string;
  /** Clave de la preparación actualmente seleccionada. */
  prepKey?: string;
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
  ingredients,
}: IngredientTypeaheadProps) => {
  const { t, ti } = useTranslation();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Ingredient[]>([]);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

  // Búsqueda: solo prefijo del nombre o prefijo de cualquier palabra del nombre.
  useEffect(() => {
    if (localValue.length >= 2) {
      const norm = (s: string) =>
        s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const q = norm(localValue);

      const scored: { ing: Ingredient; score: number }[] = [];
      for (const ing of ingredients) {
        const name = norm(ing.name);
        if (name === q) { scored.push({ ing, score: 0 }); continue; }
        if (name.startsWith(q)) { scored.push({ ing, score: 1 }); continue; }
        const words = name.split(/[^\p{L}\p{N}]+/u);
        if (words.some((w) => w.startsWith(q))) {
          scored.push({ ing, score: 2 });
        }
      }
      scored.sort((a, b) => a.score - b.score || a.ing.name.localeCompare(b.ing.name));
      setSuggestions(scored.slice(0, 8).map((s) => s.ing));
    } else {
      setSuggestions([]);
    }
  }, [localValue, ingredients]);

  // Sync external value
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (inputRef.current && showSuggestions) {
      const rect = inputRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [showSuggestions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current && !containerRef.current.contains(event.target as Node) &&
        inputRef.current && !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Al elegir un concepto: si tiene preparaciones, aplicamos la primera por defecto.
  // El usuario podrá cambiarla desde la fila de la tabla.
  const handlePickConcept = (concept: Ingredient) => {
    let resolved: Ingredient = concept;
    if (concept.preparations && concept.preparations.length > 0) {
      const first = concept.preparations[0];
      resolved = {
        name: concept.name,
        baseName: concept.name,
        prepKey: first.key,
        quantity: 100,
        calories: first.calories,
        protein: first.protein,
        carbs: first.carbs,
        fat: first.fat,
        icon: concept.icon,
        portions: first.portions,
        preparations: concept.preparations,
      };
    } else {
      resolved = { ...concept, baseName: concept.name };
    }
    onSelectIngredient(resolved);
    onChange(resolved.name);
    setLocalValue('');
    setShowSuggestions(false);
  };

  const renderSuggestions = () => {
    if (!showSuggestions || suggestions.length === 0) return null;
    return createPortal(
      <div
        ref={containerRef}
        className="fixed rounded-sm max-h-72 overflow-y-auto z-[9999]"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          width: `${position.width}px`,
          backgroundColor: '#FFFFFF',
          border: '1px solid #E8E5DE',
          boxShadow: '0 12px 32px -4px rgba(0, 0, 0, 0.12), 0 4px 8px -2px rgba(0, 0, 0, 0.06)',
        }}
      >
        {suggestions.map((suggestion, idx) => {
          const prepCount = suggestion.preparations?.length ?? 0;
          return (
            <div
              key={idx}
              className="px-2.5 py-1.5 cursor-pointer transition-colors flex items-center gap-2"
              style={{ borderTop: idx > 0 ? '1px solid #F0EDE8' : 'none' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FAF9F7')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              onClick={() => handlePickConcept(suggestion)}
            >
              {suggestion.icon && (
                <img src={`/icons/${suggestion.icon}.svg`} alt="" className="w-5 h-5 flex-shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium flex items-center gap-1.5" style={{ color: '#2D2B28' }}>
                  <span className="truncate">{suggestion.name}</span>
                  {prepCount > 1 && (
                    <span
                      className="text-[9px] px-1 py-px rounded-sm flex-shrink-0"
                      style={{ backgroundColor: '#F0EDE8', color: '#6B6660' }}
                    >
                      {prepCount} {t('consultation.typeahead.prepBadge') || 'prep.'}
                    </span>
                  )}
                </div>
                <div className="text-[10px]" style={{ color: '#8B8680' }}>
                  {ti('consultation.typeahead.detail', [
                    suggestion.calories,
                    suggestion.protein,
                    suggestion.carbs,
                    suggestion.fat,
                  ])}
                </div>
              </div>
            </div>
          );
        })}
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
        placeholder={t('consultation.typeahead.placeholder')}
      />
      {renderSuggestions()}
    </div>
  );
};

export default IngredientTypeahead;

