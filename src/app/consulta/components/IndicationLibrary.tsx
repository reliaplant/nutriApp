'use client'

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { FileText, Plus, Search, X, Trash2, Sparkles, Check, Save } from 'lucide-react';
import { savedIndicationService, SavedIndication } from '@/app/shared/firebase';

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');

// Preview en una línea: descarta el encabezado en mayúsculas y aplana saltos/viñetas.
const previewOf = (c: string): string => {
  const lines = c.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length > 1 && lines[0] === lines[0].toUpperCase() && lines[0].length < 60) lines.shift();
  return lines.join(' ').replace(/[•·]\s*/g, '· ').replace(/\s+/g, ' ').trim();
};

interface Props {
  lang: 'es' | 'pt';
  currentContent: string;
  onChange: (next: string) => void;
}

type Row = { id: string; title: string; content: string; custom: boolean; docId?: string };

const IndicationLibrary: React.FC<Props> = ({ lang, currentContent, onChange }) => {
  const isPt = lang === 'pt';
  const T = {
    templates: isPt ? 'Plantillas' : 'Plantillas',
    saveCurrent: isPt ? 'Salvar como modelo' : 'Guardar como plantilla',
    title: isPt ? 'Biblioteca de indicações' : 'Biblioteca de indicaciones',
    search: isPt ? 'Buscar indicação…' : 'Buscar indicación…',
    empty: isPt ? 'Você ainda não salvou modelos. Escreva uma indicação e use "Salvar como modelo".' : 'Aún no tienes plantillas. Escribe una indicación y usa "Guardar como plantilla".',
    askTitle: isPt ? 'Como inserir?' : '¿Cómo insertar?',
    replace: isPt ? 'Substituir texto' : 'Reemplazar texto',
    append: isPt ? 'Adicionar ao final' : 'Agregar al final',
    cancel: isPt ? 'Cancelar' : 'Cancelar',
    saveNameLabel: isPt ? 'Nome do modelo' : 'Nombre de la plantilla',
    saveNamePh: isPt ? 'Ex: Indicações base low carb' : 'Ej: Indicaciones base low carb',
    save: isPt ? 'Salvar' : 'Guardar',
    saving: isPt ? 'Salvando…' : 'Guardando…',
    saved: isPt ? 'Salvo' : 'Guardada',
    emptyToSave: isPt ? 'Escreva algo antes de salvar.' : 'Escribe algo antes de guardar.',
    deleteConfirm: isPt ? 'Excluir este modelo?' : '¿Eliminar esta plantilla?',
  };

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState('');
  const [userItems, setUserItems] = useState<SavedIndication[]>([]);
  const [pending, setPending] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saving, setSaving] = useState(false);

  const loadUser = async () => {
    try { setUserItems(await savedIndicationService.getSavedIndications()); }
    catch (e) { console.error('Error cargando indicaciones guardadas:', e); }
  };

  useEffect(() => setMounted(true), []);
  useEffect(() => { if (open) loadUser(); }, [open]);
  useEffect(() => {
    if (!(open || saveOpen)) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open, saveOpen]);

  const rows: Row[] = useMemo(() => {
    let base: Row[] = userItems.map((u): Row => ({ id: u.id || `c:${u.title}`, title: u.title, content: u.content, custom: true, docId: u.id }));
    const q = norm(query.trim());
    if (q) base = base.filter((r) => norm(r.title).includes(q) || norm(r.content).includes(q));
    return base;
  }, [query, userItems]);

  const choose = (content: string) => {
    if (!currentContent.trim()) { onChange(content); setOpen(false); }
    else setPending(content);
  };
  const doInsert = (mode: 'replace' | 'append') => {
    if (pending == null) return;
    onChange(mode === 'replace' ? pending : `${currentContent.trim()}\n\n${pending}`);
    setPending(null);
    setOpen(false);
  };

  const openSave = () => {
    const content = currentContent.trim();
    if (!content) return;
    setSaveName(content.split('\n')[0].replace(/[:.]+$/, '').slice(0, 60));
    setSaveOpen(true);
  };
  const doSave = async () => {
    const content = currentContent.trim();
    const title = saveName.trim();
    if (!content || !title) return;
    setSaving(true);
    try {
      await savedIndicationService.createSavedIndication({ title, content });
      setSaveOpen(false);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1800);
      if (open) loadUser();
    } catch (e) { console.error('Error guardando indicación:', e); }
    finally { setSaving(false); }
  };

  const removeUser = async (docId?: string) => {
    if (!docId || !window.confirm(T.deleteConfirm)) return;
    try {
      await savedIndicationService.deleteSavedIndication(docId);
      setUserItems((prev) => prev.filter((u) => u.id !== docId));
    } catch (e) { console.error('Error eliminando indicación:', e); }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[11px] px-2.5 py-1 rounded-md inline-flex items-center gap-1.5 font-medium transition-colors"
        style={{ color: '#047857', backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0' }}
      >
        <FileText className="w-3.5 h-3.5" /> {T.templates}
      </button>
      <button
        type="button"
        onClick={openSave}
        disabled={!currentContent.trim()}
        title={currentContent.trim() ? T.saveCurrent : T.emptyToSave}
        className="text-[11px] px-2.5 py-1 rounded-md inline-flex items-center gap-1.5 font-medium text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ backgroundColor: '#FFFFFF', border: '1px solid #E0DCD4' }}
      >
        {savedFlash ? <><Check className="w-3.5 h-3.5 text-emerald-600" /> {T.saved}</> : <><Save className="w-3.5 h-3.5" /> {T.saveCurrent}</>}
      </button>

      {/* Modal biblioteca (lista plana) */}
      {open && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setOpen(false); setPending(null); }} />
          <div className="relative rounded-md shadow-2xl w-full max-w-md h-[78vh] flex flex-col overflow-hidden bg-white" style={{ border: '1px solid #E8E5DE' }}>
            <div className="px-5 py-3 flex items-center justify-between flex-shrink-0" style={{ borderBottom: '1px solid #F0EDE8' }}>
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: '#ECFDF5' }}>
                  <FileText className="w-4 h-4" style={{ color: '#047857' }} />
                </span>
                <h3 className="text-sm font-semibold text-gray-900">{T.title}</h3>
              </div>
              <button onClick={() => { setOpen(false); setPending(null); }} className="p-1 rounded hover:bg-gray-100"><X className="w-4 h-4 text-gray-400" /></button>
            </div>

            <div className="p-3 flex-shrink-0">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={T.search}
                  autoFocus
                  className="w-full pl-8 pr-3 py-1.5 text-[12px] rounded-md bg-white border border-[#E0DCD4] text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-3 pb-3 space-y-1">
              {rows.length === 0 ? (
                <p className="text-[12px] text-gray-400 text-center py-6">{T.empty}</p>
              ) : (
                rows.map((r) => (
                  <div
                    key={r.id}
                    className="group rounded-md px-2.5 py-1.5 transition-colors cursor-pointer flex items-center gap-2 hover:bg-emerald-50/60 bg-white"
                    style={{ border: '1px solid #ECE9E3' }}
                    onClick={() => choose(r.content)}
                    title={r.title}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[12px] font-medium text-gray-900 truncate">{r.title}</span>
                        {!r.custom && <Sparkles className="w-2.5 h-2.5 flex-shrink-0" style={{ color: '#10B981' }} />}
                      </div>
                      <div className="text-[11px] text-gray-500 truncate">{previewOf(r.content)}</div>
                    </div>
                    {r.custom ? (
                      <button type="button" onClick={(e) => { e.stopPropagation(); removeUser(r.docId); }} className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 flex-shrink-0" title={T.deleteConfirm}>
                        <Trash2 className="w-3 h-3" />
                      </button>
                    ) : (
                      <Plus className="w-3.5 h-3.5 text-gray-300 group-hover:text-emerald-600 flex-shrink-0" />
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Sub-overlay: reemplazar o agregar */}
            {pending != null && (
              <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/30" onClick={() => setPending(null)} />
                <div className="relative bg-white rounded-md shadow-xl w-full max-w-xs p-4" style={{ border: '1px solid #E8E5DE' }}>
                  <p className="text-[13px] font-semibold text-gray-900 mb-3 text-center">{T.askTitle}</p>
                  <div className="space-y-2">
                    <button type="button" onClick={() => doInsert('append')} className="w-full px-3 py-2 text-[12px] rounded-md font-medium text-white" style={{ backgroundColor: '#047857' }}>{T.append}</button>
                    <button type="button" onClick={() => doInsert('replace')} className="w-full px-3 py-2 text-[12px] rounded-md font-medium text-gray-700 bg-white hover:bg-gray-50" style={{ border: '1px solid #E0DCD4' }}>{T.replace}</button>
                    <button type="button" onClick={() => setPending(null)} className="w-full px-3 py-1.5 text-[11px] text-gray-400 hover:text-gray-600">{T.cancel}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Modal: guardar como plantilla */}
      {saveOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSaveOpen(false)} />
          <div className="relative bg-white rounded-md shadow-2xl w-full max-w-sm overflow-hidden" style={{ border: '1px solid #E8E5DE' }}>
            <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #F0EDE8' }}>
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: '#ECFDF5' }}>
                  <Save className="w-4 h-4" style={{ color: '#047857' }} />
                </span>
                <h3 className="text-sm font-semibold text-gray-900">{T.saveCurrent}</h3>
              </div>
              <button onClick={() => setSaveOpen(false)} className="p-1 rounded hover:bg-gray-100"><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <div className="p-4">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block mb-1.5">{T.saveNameLabel}</label>
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && saveName.trim()) doSave(); }}
                placeholder={T.saveNamePh}
                autoFocus
                className="w-full px-3 py-2 text-[13px] rounded-md bg-white border border-[#E0DCD4] text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
              <p className="text-[10.5px] text-gray-400 mt-2 line-clamp-2">{previewOf(currentContent)}</p>
            </div>
            <div className="px-5 py-3 flex items-center justify-end gap-2" style={{ borderTop: '1px solid #F0EDE8', backgroundColor: '#FAFAFA' }}>
              <button type="button" onClick={() => setSaveOpen(false)} className="px-3 py-1.5 text-[12px] rounded border border-gray-300 text-gray-700 bg-white hover:bg-gray-50">{T.cancel}</button>
              <button type="button" onClick={doSave} disabled={!saveName.trim() || saving} className="px-4 py-1.5 text-[12px] rounded font-semibold text-white inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed" style={{ backgroundColor: '#047857' }}>
                {saving ? <><span className="inline-block w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />{T.saving}</> : <><Check className="w-3.5 h-3.5" /> {T.save}</>}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default IndicationLibrary;
