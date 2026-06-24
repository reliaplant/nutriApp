'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Check, Search } from 'lucide-react';
import { COUNTRIES, getCountry, searchCountries } from './countries';

interface Props {
  value: string | null;                 // código de país (o null)
  onChange: (code: string | null) => void;
  placeholder?: string;
  clearable?: boolean;
}

/** Selector de país tipo typeahead, con banderitas. Un solo campo. */
const CountryTypeahead: React.FC<Props> = ({ value, onChange, placeholder = 'Buscar país…', clearable = true }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);

  const selected = getCountry(value);
  const results = searchCountries(query);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) { setOpen(false); setQuery(''); }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const pick = (code: string) => { onChange(code); setOpen(false); setQuery(''); };
  const clear = () => { onChange(null); setQuery(''); };

  return (
    <div className="relative" ref={wrapRef}>
      {/* Adorno izquierdo: bandera del país elegido (cuando no se está escribiendo) o lupa */}
      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
        {selected && !open ? (
          <span className="text-base leading-none">{selected.flag}</span>
        ) : (
          <Search className="w-3.5 h-3.5 text-gray-400" />
        )}
      </span>

      <input
        type="text"
        autoComplete="off"
        data-1p-ignore
        data-lpignore="true"
        name="country-search"
        value={open ? query : (selected ? selected.name : '')}
        placeholder={selected ? selected.name : placeholder}
        onFocus={() => { setOpen(true); setQuery(''); }}
        onChange={(e) => { setQuery(e.target.value); if (!open) setOpen(true); }}
        className="w-full pl-8 pr-8 py-2 bg-white border border-gray-300 rounded-md text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 placeholder:text-gray-400"
      />

      {/* Adorno derecho: limpiar o chevron */}
      {clearable && selected && !open ? (
        <button type="button" onClick={clear} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
          <X className="w-3.5 h-3.5" />
        </button>
      ) : (
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
      )}

      {open && (
        <div
          className="absolute left-0 right-0 mt-1 z-50 rounded-md bg-white py-1 max-h-56 overflow-y-auto"
          style={{ border: '1px solid #E8E5DE', boxShadow: '0 12px 32px -8px rgba(0,0,0,0.14)' }}
        >
          {clearable && value && (
            <button type="button" onClick={clear} className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-gray-500 hover:bg-gray-50">
              <X className="w-3.5 h-3.5" /> Sin país
            </button>
          )}
          {results.length === 0 ? (
            <div className="px-3 py-2 text-[12px] text-gray-400">Sin resultados</div>
          ) : (
            results.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => pick(c.code)}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-[13px] text-gray-700 hover:bg-emerald-50 hover:text-emerald-700"
              >
                <span className="text-base leading-none">{c.flag}</span>
                <span className="flex-1 text-left">{c.name}</span>
                {value === c.code && <Check className="w-3.5 h-3.5 text-emerald-600" />}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default CountryTypeahead;
export { COUNTRIES };
