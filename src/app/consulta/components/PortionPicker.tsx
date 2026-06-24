'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';
import { Ingredient } from './IngredientTypeahead';
import { getPortionsForIngredient, parsePortion } from './portionsHelper';
import { useTranslation } from '@/app/shared/useTranslation';

type Unit = { label: string; g: number };

interface PortionPickerProps {
  ingredient: Pick<Ingredient, 'name' | 'icon' | 'portions' | 'baseUnit'>;
  /** Gramos actuales (siempre se almacena en gramos). */
  grams: number;
  /** Unidad elegida (la base del alimento por defecto). */
  unit?: Unit;
  /** Notifica nuevos gramos + unidad. */
  onChange: (newGrams: number, unit: Unit) => void;
}

/**
 * Control de cantidad: [número en la unidad elegida] [unidad ▾].
 * La unidad puede ser gramos o una medida casera (taza, rebanada, pieza…).
 * Si la unidad no es gramos, se muestra el equivalente "≈ N g".
 * Internamente quantity SIEMPRE se almacena en gramos.
 */
const PortionPicker: React.FC<PortionPickerProps> = ({ ingredient, grams, unit: unitProp, onChange }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Unidad base del alimento: ml para líquidos, g para sólidos.
  const baseUnit: Unit = ingredient.baseUnit === 'ml' ? { label: 'ml', g: 1 } : { label: 'g', g: 1 };
  const unit = unitProp ?? baseUnit;
  const portions = getPortionsForIngredient(ingredient);
  const isBase = unit.g === 1 && (unit.label === 'g' || unit.label === 'ml');
  const count = isBase ? grams : (unit.g > 0 ? grams / unit.g : grams);
  const countStr = count === 0 ? '' : String(Math.round(count * 100) / 100);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  useEffect(() => {
    if (open && triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      // position: fixed → coordenadas relativas al viewport (sin sumar scroll)
      setPos({ top: r.bottom + 4, left: r.right - 176 });
    }
  }, [open]);

  const setCount = (v: string) => {
    const c = v === '' ? 0 : Number(v);
    onChange(isBase ? c : c * unit.g, unit);
  };

  const pickBase = () => { onChange(grams, baseUnit); setOpen(false); };
  const pickPortion = (label: string, totalG: number) => {
    const parsed = parsePortion({ label, gramos: totalG });
    onChange(totalG, { label: parsed.label, g: parsed.perUnit });
    setOpen(false);
  };

  return (
    <div className="flex items-center gap-1">
      <input
        className="w-16 flex-shrink-0 py-0.5 px-1.5 text-xs rounded-sm text-center tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 bg-white border border-[#E0DCD4] text-gray-800"
        type="number"
        value={countStr}
        onChange={(e) => setCount(e.target.value)}
        step={isBase ? 1 : 0.5}
        min="0"
      />
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        title={t('consultation.portion.title')}
        className="flex items-center justify-between gap-0.5 w-[88px] flex-shrink-0 text-[11px] px-2 py-0.5 rounded-sm transition-colors hover:bg-emerald-50"
        style={{ color: '#6B6660', border: '1px solid #E8E5DE', backgroundColor: '#FAF9F7' }}
      >
        <span className="truncate">{unit.label}</span>
        <ChevronDown className="h-2.5 w-2.5 flex-shrink-0" />
      </button>
      <span className="w-[48px] flex-shrink-0 text-[10px] tabular-nums" style={{ color: '#A8A29E' }}>
        {isBase ? '' : `≈${Math.round(grams)}${baseUnit.label}`}
      </span>

      {open && createPortal(
        <div
          ref={popoverRef}
          className="fixed z-[10001] rounded-md bg-white shadow-lg py-1 w-44"
          style={{ top: pos.top, left: pos.left, border: '1px solid #E8E5DE' }}
        >
          <div className="px-2.5 py-1 text-[9px] uppercase tracking-wider font-semibold" style={{ color: '#A8A29E' }}>
            Medida
          </div>
          <button
            type="button"
            onClick={pickBase}
            className="w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
          >
            <span className="flex items-center gap-1.5">{isBase && <Check className="w-3 h-3 text-emerald-600" />}<span className={isBase ? '' : 'pl-[18px]'}>{baseUnit.label === 'ml' ? 'Mililitros' : 'Gramos'}</span></span>
            <span className="text-[10px]" style={{ color: '#A8A29E' }}>{baseUnit.label}</span>
          </button>
          {portions.map((p, i) => {
            const active = !isBase && unit.label === parsePortion({ label: p.label, gramos: p.gramos }).label;
            return (
              <button
                key={i}
                type="button"
                onClick={() => pickPortion(p.label, p.gramos)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
              >
                <span className="flex items-center gap-1.5">{active && <Check className="w-3 h-3 text-emerald-600" />}<span className={active ? '' : 'pl-[18px]'}>{p.label}</span></span>
                <span className="text-[10px] tabular-nums" style={{ color: '#A8A29E' }}>{p.gramos} {baseUnit.label}</span>
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
};

export default PortionPicker;
