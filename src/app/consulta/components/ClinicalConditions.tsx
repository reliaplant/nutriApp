'use client'

import React, { useState } from 'react';
import { Check, Plus, X } from 'lucide-react';

type Lang = 'es' | 'pt';

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');

interface Item { id: string; label: { es: string; pt: string } }
interface Section { id: string; label: { es: string; pt: string }; items: Item[] }

const SECTIONS: Section[] = [
  {
    id: 'metabolicas',
    label: { es: 'Metabólicas y cardiovasculares', pt: 'Metabólicas e cardiovasculares' },
    items: [
      { id: 'hipertension', label: { es: 'Hipertensión', pt: 'Hipertensão' } },
      { id: 'diabetes2', label: { es: 'Diabetes tipo 2', pt: 'Diabetes tipo 2' } },
      { id: 'diabetes1', label: { es: 'Diabetes tipo 1', pt: 'Diabetes tipo 1' } },
      { id: 'prediabetes', label: { es: 'Prediabetes / resistencia a la insulina', pt: 'Pré-diabetes / resistência à insulina' } },
      { id: 'dislipidemia', label: { es: 'Colesterol / triglicéridos altos', pt: 'Colesterol / triglicerídeos altos' } },
      { id: 'sindrome-metabolico', label: { es: 'Síndrome metabólico', pt: 'Síndrome metabólica' } },
      { id: 'cardiovascular', label: { es: 'Enfermedad cardiovascular', pt: 'Doença cardiovascular' } },
      { id: 'sobrepeso', label: { es: 'Sobrepeso / obesidad', pt: 'Sobrepeso / obesidade' } },
      { id: 'higado-graso', label: { es: 'Hígado graso', pt: 'Esteatose hepática' } },
      { id: 'gota', label: { es: 'Gota / ácido úrico alto', pt: 'Gota / ácido úrico alto' } },
    ],
  },
  {
    id: 'hormonal',
    label: { es: 'Tiroides y hormonal', pt: 'Tireoide e hormonal' },
    items: [
      { id: 'hipotiroidismo', label: { es: 'Hipotiroidismo', pt: 'Hipotireoidismo' } },
      { id: 'hipertiroidismo', label: { es: 'Hipertiroidismo', pt: 'Hipertireoidismo' } },
      { id: 'sop', label: { es: 'Ovario poliquístico (SOP)', pt: 'Ovário policístico (SOP)' } },
    ],
  },
  {
    id: 'digestivas',
    label: { es: 'Digestivas', pt: 'Digestivas' },
    items: [
      { id: 'gastritis', label: { es: 'Gastritis / reflujo', pt: 'Gastrite / refluxo' } },
      { id: 'sii', label: { es: 'Colon irritable (SII)', pt: 'Cólon irritável (SII)' } },
      { id: 'estrenimiento', label: { es: 'Estreñimiento crónico', pt: 'Constipação crônica' } },
      { id: 'diverticulitis', label: { es: 'Diverticulitis', pt: 'Diverticulite' } },
      { id: 'celiaca', label: { es: 'Enfermedad celíaca', pt: 'Doença celíaca' } },
      { id: 'lactosa', label: { es: 'Intolerancia a la lactosa', pt: 'Intolerância à lactose' } },
      { id: 'eii', label: { es: 'Enfermedad inflamatoria intestinal', pt: 'Doença inflamatória intestinal' } },
    ],
  },
  {
    id: 'otras',
    label: { es: 'Renal, ósea y otras', pt: 'Renal, óssea e outras' },
    items: [
      { id: 'renal', label: { es: 'Enfermedad renal', pt: 'Doença renal' } },
      { id: 'litiasis', label: { es: 'Cálculos renales (litiasis)', pt: 'Cálculos renais (litíase)' } },
      { id: 'osteoporosis', label: { es: 'Osteoporosis', pt: 'Osteoporose' } },
      { id: 'anemia', label: { es: 'Anemia', pt: 'Anemia' } },
      { id: 'cancer', label: { es: 'Cáncer (en tratamiento)', pt: 'Câncer (em tratamento)' } },
      { id: 'tca', label: { es: 'Trastorno de conducta alimentaria', pt: 'Transtorno alimentar' } },
    ],
  },
  {
    id: 'etapas',
    label: { es: 'Etapas', pt: 'Etapas' },
    items: [
      { id: 'embarazo', label: { es: 'Embarazo', pt: 'Gestação' } },
      { id: 'lactancia', label: { es: 'Lactancia', pt: 'Amamentação' } },
      { id: 'menopausia', label: { es: 'Menopausia', pt: 'Menopausa' } },
    ],
  },
];

interface Props {
  lang: Lang;
  value: string[];
  onChange: (next: string[]) => void;
}

const ACCENT = '#4F46E5'; // indigo clínico

const ClinicalConditions: React.FC<Props> = ({ lang, value, onChange }) => {
  const l: Lang = lang === 'pt' ? 'pt' : 'es';
  const [custom, setCustom] = useState('');

  const has = (label: string) => value.some((v) => norm(v) === norm(label));
  const toggle = (label: string) => {
    onChange(has(label) ? value.filter((v) => norm(v) !== norm(label)) : [...value, label]);
  };

  // Etiquetas predefinidas (todas) para detectar las personalizadas.
  const allLabels = SECTIONS.flatMap((s) => s.items.map((i) => i.label[l]));
  const customValues = value.filter((v) => !allLabels.some((al) => norm(al) === norm(v)));

  const addCustom = () => {
    const c = custom.trim();
    if (!c || has(c)) { setCustom(''); return; }
    onChange([...value, c]);
    setCustom('');
  };

  return (
    <div className="space-y-3">
      {SECTIONS.map((section) => (
        <div key={section.id}>
          <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">{section.label[l]}</p>
          <div className="flex flex-wrap gap-1.5">
            {section.items.map((it) => {
              const label = it.label[l];
              const on = has(label);
              return (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => toggle(label)}
                  className="inline-flex items-center gap-1 rounded-full pl-2 pr-2.5 py-1 text-[12px] transition-colors bg-white"
                  style={{
                    border: on ? `2px solid ${ACCENT}` : '1px solid #E5E1DA',
                    color: on ? ACCENT : '#44403C',
                    fontWeight: on ? 600 : 400,
                  }}
                >
                  {on ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3 text-gray-300" />}
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Otras (personalizadas) + input */}
      <div>
        <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">{l === 'pt' ? 'Outras' : 'Otras'}</p>
        {customValues.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-1.5">
            {customValues.map((v) => (
              <span
                key={v}
                className="inline-flex items-center gap-1 rounded-full pl-2.5 pr-1.5 py-1 text-[12px] font-medium bg-white"
                style={{ border: `2px solid ${ACCENT}`, color: ACCENT }}
              >
                {v}
                <button type="button" onClick={() => onChange(value.filter((x) => x !== v))} className="hover:opacity-60"><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
        )}
        <div className="relative">
          <input
            type="text"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }}
            placeholder={l === 'pt' ? 'Adicionar outra condição…' : 'Agregar otra condición…'}
            className="w-full px-3 py-1.5 text-[12px] rounded-md bg-white border border-[#E0DCD4] text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
          {custom.trim() && (
            <button type="button" onClick={addCustom} className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-0.5 text-[11px] rounded text-white" style={{ backgroundColor: ACCENT }}>
              {l === 'pt' ? 'Adicionar' : 'Agregar'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClinicalConditions;
