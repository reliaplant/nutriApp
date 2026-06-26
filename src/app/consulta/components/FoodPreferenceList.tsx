'use client'

import React, { useState } from 'react';
import { getMacroSections, GroupLang } from '@/app/shared/foodGroups';

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');

interface Props {
  lang: GroupLang;
  liked: string[];
  disliked: string[];
  /** Recibe ambas listas ya resueltas (mutuamente excluyentes). */
  onChange: (next: { liked: string[]; disliked: string[] }) => void;
}

const FoodPreferenceList: React.FC<Props> = ({ lang, liked, disliked, onChange }) => {
  const isPt = lang === 'pt';
  const L = {
    like: isPt ? 'Gosta' : 'Me gusta',
    dislike: isPt ? 'Não gosta' : 'No me gusta',
    clear: isPt ? 'Remover' : 'Quitar',
  };
  const sections = getMacroSections(lang);
  const [menuFor, setMenuFor] = useState<string | null>(null);

  const inList = (list: string[], label: string) => list.some((v) => norm(v) === norm(label));

  const set = (label: string, kind: 'like' | 'dislike' | 'clear') => {
    let nextLiked = liked.filter((v) => norm(v) !== norm(label));
    let nextDisliked = disliked.filter((v) => norm(v) !== norm(label));
    if (kind === 'like') nextLiked = [...nextLiked, label];
    if (kind === 'dislike') nextDisliked = [...nextDisliked, label];
    onChange({ liked: nextLiked, disliked: nextDisliked });
    setMenuFor(null);
  };

  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <div key={section.id}>
          <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-400 mb-2">{section.label}</p>
          <div className="flex flex-wrap gap-1.5">
            {section.groups.map((g) => {
              const isLiked = inList(liked, g.label);
              const isDisliked = inList(disliked, g.label);
              const open = menuFor === g.id;
              return (
                <div key={g.id} className="relative">
                  <button
                    type="button"
                    onClick={() => setMenuFor(open ? null : g.id)}
                    className="inline-flex items-center gap-1.5 rounded-full pl-2 pr-2.5 py-1 transition-colors bg-white"
                    style={{
                      border: isLiked ? '2px solid #059669' : isDisliked ? '2px solid #DC2626' : '1px solid #E5E1DA',
                    }}
                  >
                    <img src={`/icons/${g.icon}.svg`} alt="" className="w-4 h-4 flex-shrink-0 object-contain" />
                    <span className="text-[12px] text-gray-800 whitespace-nowrap">{g.label}</span>
                    {(isLiked || isDisliked) && (
                      <span className="text-[11px] flex-shrink-0 ml-0.5">{isLiked ? '👍' : '👎'}</span>
                    )}
                  </button>

                  {/* Context menu (fondo oscuro, texto claro) */}
                  {open && (
                    <>
                      <div className="fixed inset-0 z-[40]" onClick={() => setMenuFor(null)} />
                      <div
                        className="absolute z-[41] right-0 top-full mt-1 rounded-lg overflow-hidden shadow-xl min-w-[150px] bg-white"
                        style={{ border: '1px solid #E8E5DE' }}
                      >
                        <button
                          type="button"
                          onClick={() => set(g.label, 'like')}
                          className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-left transition-colors hover:bg-emerald-50"
                          style={{ color: isLiked ? '#047857' : '#44403C', fontWeight: isLiked ? 600 : 400 }}
                        >
                          <span>👍</span> {L.like}
                          {isLiked && <span className="ml-auto text-emerald-600">•</span>}
                        </button>
                        <button
                          type="button"
                          onClick={() => set(g.label, 'dislike')}
                          className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-left transition-colors hover:bg-rose-50"
                          style={{ color: isDisliked ? '#B91C1C' : '#44403C', fontWeight: isDisliked ? 600 : 400 }}
                        >
                          <span>👎</span> {L.dislike}
                          {isDisliked && <span className="ml-auto text-rose-600">•</span>}
                        </button>
                        {(isLiked || isDisliked) && (
                          <button
                            type="button"
                            onClick={() => set(g.label, 'clear')}
                            className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-left text-gray-400 transition-colors hover:bg-gray-50"
                            style={{ borderTop: '1px solid #F0EDE8' }}
                          >
                            {L.clear}
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default FoodPreferenceList;
