'use client'

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, Check, X, Wand2 } from 'lucide-react';

type Lang = 'es' | 'pt';

interface Props {
  lang: Lang;
  conditions: string[];
  goalDir?: 'lose' | 'gain' | 'maintain';
  weightKg?: number;
  likedFoods?: string[];
  dislikedFoods?: string[];
  currentContent: string;
  onApply: (text: string, mode: 'replace' | 'append') => void;
}

const HYDRATION = { es: 'Hidratación diaria', pt: 'Hidratação diária' };

const GENERAL_GROUPS: { es: string; pt: string; items: { es: string; pt: string }[] }[] = [
  {
    es: 'Alimentación', pt: 'Alimentação',
    items: [
      { es: 'Método del plato y porciones', pt: 'Método do prato e porções' },
      { es: 'Proteína en cada comida', pt: 'Proteína em cada refeição' },
      { es: 'Más verduras y fibra', pt: 'Mais verduras e fibra' },
      { es: 'Menos azúcar y ultraprocesados', pt: 'Menos açúcar e ultraprocessados' },
    ],
  },
  {
    es: 'Estilo de vida', pt: 'Estilo de vida',
    items: [
      HYDRATION,
      { es: 'Actividad física', pt: 'Atividade física' },
      { es: 'Descanso y sueño', pt: 'Descanso e sono' },
      { es: 'Moderar el alcohol', pt: 'Moderar o álcool' },
      { es: 'Suplementación', pt: 'Suplementação' },
    ],
  },
];

const IndicationAssistant: React.FC<Props> = ({ lang, conditions, goalDir, weightKg, likedFoods, dislikedFoods, currentContent, onApply }) => {
  const l: Lang = lang === 'pt' ? 'pt' : 'es';
  const T = {
    trigger: l === 'pt' ? 'Construir com IA' : 'Construir con IA',
    title: l === 'pt' ? 'Assistente de indicações' : 'Asistente de indicaciones',
    subtitle: l === 'pt' ? 'Escolha os temas e a IA redige conforme o paciente' : 'Elige los temas y la IA las redacta según el paciente',
    conditionsLbl: l === 'pt' ? 'Condições do paciente' : 'Condiciones del paciente',
    generalLbl: l === 'pt' ? 'Temas generales' : 'Temas generales',
    goalLbl: l === 'pt' ? 'Objetivo' : 'Objetivo',
    freeLbl: l === 'pt' ? 'Texto livre (a IA melhora e integra)' : 'Texto libre (la IA lo mejora e integra)',
    freePh: l === 'pt' ? 'Ex: recordar tomar o suplemento de ferro com o almoço…' : 'Ej: recordarle tomar el suplemento de hierro con el almuerzo…',
    generate: l === 'pt' ? 'Gerar com IA' : 'Generar con IA',
    generating: l === 'pt' ? 'Redigindo…' : 'Redactando…',
    proposal: l === 'pt' ? 'Proposta de indicações' : 'Propuesta de indicaciones',
    replace: l === 'pt' ? 'Substituir texto' : 'Reemplazar texto',
    append: l === 'pt' ? 'Adicionar ao final' : 'Agregar al final',
    use: l === 'pt' ? 'Usar' : 'Usar',
    cancel: l === 'pt' ? 'Cancelar' : 'Cancelar',
    back: l === 'pt' ? 'Voltar' : 'Volver',
    empty: l === 'pt' ? 'Escolha ao menos um tema ou escreva algo.' : 'Elige al menos un tema o escribe algo.',
  };

  const goalTopic = useMemo(() => {
    if (goalDir === 'lose') return l === 'pt' ? 'Perda de peso' : 'Pérdida de peso';
    if (goalDir === 'gain') return l === 'pt' ? 'Aumento de massa muscular' : 'Aumento de masa muscular';
    return null;
  }, [goalDir, l]);

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [freeText, setFreeText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Al abrir, preselecciona condiciones + objetivo + hidratación.
  const openModal = () => {
    const s = new Set<string>();
    conditions.forEach((c) => s.add(c));
    if (goalTopic) s.add(goalTopic);
    s.add(HYDRATION[l]);
    setSelected(s);
    setFreeText('');
    setError('');
    setResult(null);
    setOpen(true);
  };

  const toggle = (label: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(label)) n.delete(label); else n.add(label);
      return n;
    });
  };

  const Chip: React.FC<{ label: string; tone: 'cond' | 'goal' | 'gen' }> = ({ label, tone }) => {
    const on = selected.has(label);
    const accent = tone === 'cond' ? '#4F46E5' : tone === 'goal' ? '#0D9488' : '#7C3AED';
    return (
      <button
        type="button"
        onClick={() => toggle(label)}
        className="inline-flex items-center gap-1 rounded-full pl-2 pr-2.5 py-1 text-[12px] transition-colors bg-white"
        style={{ border: on ? `2px solid ${accent}` : '1px solid #E5E1DA', color: on ? accent : '#57534E', fontWeight: on ? 600 : 400 }}
      >
        {on ? <Check className="w-3 h-3" /> : <span className="w-3 h-3 rounded-full" style={{ border: '1.5px solid #D6D3CD' }} />}
        {label}
      </button>
    );
  };

  const canGenerate = selected.size > 0 || freeText.trim().length > 0;

  const generate = async () => {
    if (!canGenerate) { setError(T.empty); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ai/indicaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          temas: Array.from(selected),
          condiciones: conditions,
          objetivo: goalTopic || undefined,
          pesoKg: weightKg,
          gustos: likedFoods,
          disgustos: dislikedFoods,
          textoLibre: freeText.trim() || undefined,
          idioma: l,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'No se pudo generar.');
      if (!data.texto?.trim()) throw new Error('La IA no devolvió texto.');
      setResult(data.texto.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo generar.');
    } finally {
      setLoading(false);
    }
  };

  const apply = (mode: 'replace' | 'append') => {
    if (!result) return;
    onApply(result, mode);
    setOpen(false);
    setResult(null);
    setFreeText('');
  };

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="text-[11px] px-2.5 py-1 rounded-md inline-flex items-center gap-1.5 font-medium text-white transition-opacity hover:opacity-90"
        style={{ backgroundImage: 'linear-gradient(90deg, #8B5CF6, #7C3AED)' }}
      >
        <Sparkles className="w-3.5 h-3.5" /> {T.trigger}
      </button>

      {open && mounted && createPortal(
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />

          {/* Modal de configuración */}
          <div className="relative bg-white rounded-md shadow-2xl w-full max-w-lg max-h-[86vh] flex flex-col overflow-hidden" style={{ border: '1px solid #E8E5DE' }}>
            <div className="px-5 py-3 flex items-center justify-between flex-shrink-0" style={{ borderBottom: '1px solid #F0EDE8', backgroundImage: 'linear-gradient(90deg, #F5F3FF, #FFFFFF)' }}>
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#EDE9FE' }}>
                  <Sparkles className="w-4 h-4" style={{ color: '#7C3AED' }} />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 leading-tight">{T.title}</h3>
                  <p className="text-[10px] text-gray-500 leading-tight truncate">{T.subtitle}</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-gray-100 flex-shrink-0"><X className="w-4 h-4 text-gray-400" /></button>
            </div>

            <div className="overflow-y-auto overscroll-contain p-4 space-y-3">
              {conditions.length > 0 && (
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">{T.conditionsLbl}</p>
                  <div className="flex flex-wrap gap-1.5">{conditions.map((c) => <Chip key={c} label={c} tone="cond" />)}</div>
                </div>
              )}
              {goalTopic && (
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">{T.goalLbl}</p>
                  <div className="flex flex-wrap gap-1.5"><Chip label={goalTopic} tone="goal" /></div>
                </div>
              )}
              {GENERAL_GROUPS.map((grp) => (
                <div key={grp.es}>
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">{grp[l]}</p>
                  <div className="flex flex-wrap gap-1.5">{grp.items.map((it) => <Chip key={it[l]} label={it[l]} tone="gen" />)}</div>
                </div>
              ))}
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">{T.freeLbl}</p>
                <textarea
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                  placeholder={T.freePh}
                  rows={2}
                  className="w-full px-3 py-2 text-[12px] rounded-md bg-white border border-[#E0DCD4] text-gray-800 placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-200"
                />
              </div>
            </div>

            <div className="px-5 py-3 flex items-center justify-between gap-2 flex-shrink-0" style={{ borderTop: '1px solid #F0EDE8', backgroundColor: '#FAFAFA' }}>
              {error ? <span className="text-[11px] text-red-600 truncate" title={error}>{error}</span> : <span className="text-[10px] text-gray-400">{selected.size} {l === 'pt' ? 'temas' : 'temas'}</span>}
              <button
                type="button"
                onClick={generate}
                disabled={loading || !canGenerate}
                className="text-[12px] px-4 py-1.5 rounded-md inline-flex items-center gap-1.5 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                style={{ backgroundImage: 'linear-gradient(90deg, #8B5CF6, #7C3AED)' }}
              >
                {loading ? <><span className="inline-block w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />{T.generating}</> : <><Wand2 className="w-3.5 h-3.5" />{T.generate}</>}
              </button>
            </div>
          </div>

          {/* Modal de propuesta (encima) */}
          {result && (
            <div className="absolute inset-0 z-[91] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/30" onClick={() => setResult(null)} />
              <div className="relative bg-white rounded-md shadow-2xl w-full max-w-lg max-h-[86vh] flex flex-col overflow-hidden" style={{ border: '1px solid #E8E5DE' }}>
                <div className="px-5 py-3 flex items-center justify-between flex-shrink-0" style={{ borderBottom: '1px solid #F0EDE8', backgroundImage: 'linear-gradient(90deg, #F5F3FF, #FFFFFF)' }}>
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: '#EDE9FE' }}>
                      <Sparkles className="w-4 h-4" style={{ color: '#7C3AED' }} />
                    </span>
                    <h3 className="text-sm font-semibold text-gray-900">{T.proposal}</h3>
                  </div>
                  <button onClick={() => setResult(null)} className="p-1 rounded hover:bg-gray-100"><X className="w-4 h-4 text-gray-400" /></button>
                </div>
                <div className="overflow-y-auto overscroll-contain p-4">
                  <pre className="text-[12.5px] text-gray-700 leading-relaxed whitespace-pre-wrap font-sans">{result}</pre>
                </div>
                <div className="px-5 py-3 flex items-center justify-between gap-2 flex-shrink-0" style={{ borderTop: '1px solid #F0EDE8', backgroundColor: '#FAFAFA' }}>
                  <button type="button" onClick={() => setResult(null)} className="px-3 py-1.5 text-[12px] rounded border border-gray-300 text-gray-700 bg-white hover:bg-gray-50">{T.back}</button>
                  <div className="flex gap-2">
                    {currentContent.trim() && (
                      <button type="button" onClick={() => apply('append')} className="px-3 py-1.5 text-[12px] rounded font-medium text-gray-700 bg-white hover:bg-gray-50" style={{ border: '1px solid #E0DCD4' }}>{T.append}</button>
                    )}
                    <button type="button" onClick={() => apply('replace')} className="px-4 py-1.5 text-[12px] rounded font-semibold text-white inline-flex items-center gap-1.5" style={{ backgroundImage: 'linear-gradient(90deg, #8B5CF6, #7C3AED)' }}>
                      <Check className="w-3.5 h-3.5" /> {currentContent.trim() ? T.replace : T.use}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
};

export default IndicationAssistant;
