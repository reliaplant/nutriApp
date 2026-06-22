'use client'

import React, { useState } from 'react';
import { Plus, Check } from 'lucide-react';
import { SavedPlan } from '@/app/shared/firebase';
import { useTranslation } from '@/app/shared/useTranslation';

export interface TagUsage { tag: string; count: number }

/** Etiquetas de un plan (compatibilidad con el campo legacy `group`). */
export function tagsOf(p: SavedPlan): string[] {
  if (Array.isArray(p.tags)) return p.tags.filter(Boolean);
  return p.group && p.group.trim() ? [p.group.trim()] : [];
}

/** Solo cuenta usos de cada etiqueta entre los planes (para filtros/listados). */
export function computeTagUsage(plans: SavedPlan[]): TagUsage[] {
  const m = new Map<string, number>();
  plans.forEach(p => tagsOf(p).forEach(t => m.set(t, (m.get(t) || 0) + 1)));
  return [...m.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'es'));
}

/** Une la biblioteca del usuario con las etiquetas realmente usadas y añade conteos. */
export function computeTagOptions(library: string[], plans: SavedPlan[]): TagUsage[] {
  const counts = new Map<string, number>();
  plans.forEach(p => tagsOf(p).forEach(t => counts.set(t, (counts.get(t) || 0) + 1)));
  const all = new Set<string>([...(library || []), ...counts.keys()]);
  return [...all]
    .map(tag => ({ tag, count: counts.get(tag) || 0 }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'es'));
}

export function TagEditor({ value, onChange, options, onCreate }: {
  value: string[];
  onChange: (tags: string[]) => void;
  options: TagUsage[];
  onCreate?: (tag: string) => void;
}) {
  const { t } = useTranslation();
  const [creating, setCreating] = useState(false);
  const [input, setInput] = useState('');

  const has = (tg: string) => value.some(v => v.toLowerCase() === tg.toLowerCase());
  const toggle = (tg: string) => has(tg) ? onChange(value.filter(v => v.toLowerCase() !== tg.toLowerCase())) : onChange([...value, tg]);

  const submitNew = () => {
    const tg = input.trim().replace(/\s+/g, ' ');
    if (!tg) { setCreating(false); setInput(''); return; }
    if (!has(tg)) onChange([...value, tg]);
    if (!options.some(o => o.tag.toLowerCase() === tg.toLowerCase())) onCreate?.(tg);
    setInput('');
    setCreating(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {options.map(({ tag, count }) => {
        const active = has(tag);
        return (
          <button
            key={tag} type="button" onClick={() => toggle(tag)}
            className={`inline-flex items-center gap-1.5 pl-2 pr-2 py-1 rounded-full text-xs font-medium transition-colors border ${
              active
                ? 'bg-emerald-600 border-emerald-600 text-white'
                : 'bg-[#FAF9F7] border-[#E8E5DE] text-gray-600 hover:border-emerald-300 hover:text-emerald-700 hover:bg-white'
            }`}
          >
            {active && <Check className="w-3 h-3" />}
            {tag}
            {count > 0 && (
              <span className={`text-[9px] tabular-nums rounded-full px-1 ${active ? 'bg-emerald-700/40' : 'bg-white border border-[#ECE9E3] text-gray-400'}`}>{count}</span>
            )}
          </button>
        );
      })}

      {creating ? (
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-white pl-2.5 pr-1 py-0.5">
          <input
            autoFocus value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submitNew(); } else if (e.key === 'Escape') { setCreating(false); setInput(''); } }}
            onBlur={submitNew}
            placeholder={t('plans.tagNewPlaceholder')}
            className="text-xs bg-transparent focus:outline-none text-gray-800 placeholder:text-gray-400 w-28 py-0.5"
          />
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={submitNew} className="p-0.5 rounded-full text-emerald-600 hover:bg-emerald-50"><Check className="w-3 h-3" /></button>
        </span>
      ) : (
        <button
          type="button" onClick={() => setCreating(true)}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-gray-500 border border-dashed border-[#CCC9C3] hover:border-emerald-400 hover:text-emerald-600 transition-colors"
        >
          <Plus className="w-3 h-3" /> {t('plans.tagCreate')}
        </button>
      )}
    </div>
  );
}
