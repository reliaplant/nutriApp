'use client'

import React from 'react';

interface NotasProps {
  initialContent?: string;
  onSave?: (content: string) => void;
  readOnly?: boolean;
  patientId?: string;
}

const Notas = ({
  initialContent = '',
  onSave,
  readOnly = false,
}: NotasProps) => {
  return (
    <div className="p-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-gray-400 mb-2">Notas</p>
      <textarea
        defaultValue={initialContent}
        onChange={(e) => onSave?.(e.target.value)}
        readOnly={readOnly}
        placeholder="Escribe tus notas aquí..."
        className="w-full min-h-[calc(100vh-140px)] p-2 text-xs text-gray-700 border border-gray-200 rounded-sm resize-none focus:outline-none focus:border-emerald-300 placeholder:text-gray-300"
      />
    </div>
  );
};

export default Notas;