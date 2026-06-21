'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { Ingredient } from './IngredientTypeahead';
import { getPortionsForIngredient } from './portionsHelper';
import { useTranslation } from '@/app/shared/useTranslation';

interface PortionPickerProps {
  ingredient: Pick<Ingredient, 'name' | 'icon' | 'portions'>;
  /** Gramos actuales (siempre se almacena en gramos). */
  grams: number;
  /** Notifica el nuevo total en gramos. */
  onChange: (newGrams: number) => void;
}

/**
 * Input compacto: [número editable en gramos] [unidad ▾]
 * Click en la unidad abre un mini-popover con porciones rápidas
 * (1 cda, 1 taza, 1 huevo M, etc.) inferidas según el tipo de alimento.
 * El campo numérico siempre representa gramos — fuente única de verdad.
 */
const PortionPicker: React.FC<PortionPickerProps> = ({ ingredient, grams, onChange }) => {
  const { t, ti } = useTranslation();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const portions = getPortionsForIngredient(ingredient);

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
      setPos({
        top: r.bottom + window.scrollY + 4,
        // alineado a la derecha del trigger
        left: r.right + window.scrollX - 160,
      });
    }
  }, [open]);

  return (
    <>
      <input
        className="w-16 py-0.5 px-1.5 text-xs rounded-sm text-center tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 bg-white border border-gray-300 text-gray-800"
        type="number"
        value={grams === 0 ? '' : grams}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === '' ? 0 : Number(v));
        }}
        step="1"
        min="0"
      />
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        title={t('consultation.portion.title')}
        className="flex items-center gap-0.5 text-[10px] text-gray-500 hover:text-emerald-700 transition-colors px-0.5"
      >
        g
        <ChevronDown className="h-2.5 w-2.5" />
      </button>

      {open && createPortal(
        <div
          ref={popoverRef}
          className="fixed z-[9999] rounded-md bg-white shadow-lg py-1 w-40"
          style={{ top: pos.top, left: pos.left, border: '1px solid #E8E5DE' }}
        >
          <div className="px-2.5 py-1 text-[9px] uppercase tracking-wider text-gray-500 font-semibold">
            {t('consultation.portion.quickPortions')}
          </div>
          {portions.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { onChange(p.gramos); setOpen(false); }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
            >
              <span>{p.label}</span>
              <span className="text-[10px] text-gray-500 tabular-nums">{p.gramos} g</span>
            </button>
          ))}
          <div className="mt-1 pt-1" style={{ borderTop: '1px solid #F0EDE8' }}>
            <button
              type="button"
              onClick={() => { onChange(grams + (portions[0]?.gramos || 10)); setOpen(false); }}
              className="w-full text-left px-2.5 py-1.5 text-[11px] text-emerald-700 hover:bg-emerald-50 transition-colors"
            >
              {ti('consultation.portion.add', [portions[0]?.label.replace(/^1\s*/, '') || 'porción'])}
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default PortionPicker;
