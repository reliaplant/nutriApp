'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import type { IngredientPrep } from './IngredientTypeahead';

interface PrepSelectorProps {
  preparations: IngredientPrep[];
  value: string | undefined;
  onChange: (key: string) => void;
}

/**
 * Chip compacto que muestra la preparación actual y permite cambiarla.
 * Se usa en la fila de la tabla, junto al nombre del ingrediente, cuando
 * el alimento tiene más de una preparación disponible.
 */
const PrepSelector: React.FC<PrepSelectorProps> = ({ preparations, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const current = preparations.find((p) => p.key === value) ?? preparations[0];

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
      setPos({
        top: r.bottom + 4,
        left: r.right - 200,
      });
    }
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-sm hover:bg-emerald-50 hover:text-emerald-700 transition-colors max-w-[140px]"
        style={{ color: '#6B6660', backgroundColor: '#F5F2EE' }}
        title={current.label}
      >
        <span className="truncate">{current.label}</span>
        <ChevronDown className="h-2.5 w-2.5 flex-shrink-0" />
      </button>

      {open && createPortal(
        <div
          ref={popoverRef}
          className="fixed z-[9999] rounded-md bg-white shadow-lg py-1 w-52 max-h-72 overflow-y-auto"
          style={{ top: pos.top, left: pos.left, border: '1px solid #E8E5DE' }}
        >
          {preparations.map((p) => {
            const active = p.key === current.key;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => { onChange(p.key); setOpen(false); }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] transition-colors ${active ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                <span className="truncate">{p.label}</span>
                <span className="text-[10px] tabular-nums text-gray-500 ml-2 flex-shrink-0">
                  {Math.round(p.calories)} kcal
                </span>
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </>
  );
};

export default PrepSelector;
