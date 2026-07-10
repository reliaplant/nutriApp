'use client'

import React, { useEffect, useMemo, useState } from 'react';
import { Search, Trash2, AlertCircle, FileText, Plus, X, Check, Pencil } from 'lucide-react';
import { savedIndicationService, SavedIndication } from '@/app/shared/firebase';
import { useAuth } from '@/app/shared/AuthContext';
import { useTranslation } from '@/app/shared/useTranslation';

const previewOf = (c: string): string => {
  const lines = c.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length > 1 && lines[0] === lines[0].toUpperCase() && lines[0].length < 60) lines.shift();
  return lines.join(' ').replace(/[•·]\s*/g, '· ').replace(/\s+/g, ' ').trim();
};

export default function IndicacionesPage() {
  const { lang } = useTranslation();
  const isPt = lang === 'pt';
  const T = {
    title: isPt ? 'Indicações' : 'Indicaciones',
    one: isPt ? 'modelo' : 'plantilla',
    many: isPt ? 'modelos' : 'plantillas',
    search: isPt ? 'Buscar…' : 'Buscar…',
    nueva: isPt ? 'Nueva' : 'Nueva',
    emptyNone: isPt ? 'Aún no tienes plantillas de indicaciones.' : 'Aún no tienes plantillas de indicaciones.',
    emptyHint: isPt ? 'Crea una para reutilizarla en tus consultas.' : 'Crea una para reutilizarla en tus consultas.',
    emptyNoResults: isPt ? 'Nenhum resultado.' : 'Sin resultados.',
    name: isPt ? 'Nome' : 'Nombre',
    colName: isPt ? 'Nome' : 'Nombre',
    colPreview: isPt ? 'Vista prévia' : 'Vista previa',
    edit: isPt ? 'Editar' : 'Editar',
    namePh: isPt ? 'Ex: Indicações base low carb' : 'Ej: Indicaciones base low carb',
    content: isPt ? 'Texto da indicação' : 'Texto de la indicación',
    contentPh: isPt ? 'Escreva a indicação…' : 'Escribe la indicación…',
    save: isPt ? 'Guardar' : 'Guardar',
    saving: isPt ? 'Salvando…' : 'Guardando…',
    cancel: isPt ? 'Cancelar' : 'Cancelar',
    newTitle: isPt ? 'Nova indicação' : 'Nueva indicación',
    editTitle: isPt ? 'Editar indicação' : 'Editar indicación',
    deleteTitle: isPt ? 'Excluir plantilla?' : '¿Eliminar plantilla?',
    deleteIrreversible: isPt ? 'Esta ação não pode ser desfeita.' : 'Esta acción no se puede deshacer.',
    delete: isPt ? 'Eliminar' : 'Eliminar',
  };

  const { firebaseUser, loading: authLoading } = useAuth();
  const [items, setItems] = useState<SavedIndication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [editor, setEditor] = useState<{ id?: string; title: string; content: string; mode: 'view' | 'edit' } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    try { setItems(await savedIndicationService.getSavedIndications()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  useEffect(() => {
    if (authLoading) return;
    if (!firebaseUser) { setLoading(false); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUser, authLoading]);

  const processed = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return items
      .filter((i) => !term || i.title.toLowerCase().includes(term) || i.content.toLowerCase().includes(term))
      .sort((a, b) => a.title.localeCompare(b.title, 'es'));
  }, [items, searchTerm]);

  const save = async () => {
    if (!editor || !editor.title.trim() || !editor.content.trim()) return;
    setSaving(true);
    try {
      if (editor.id) {
        await savedIndicationService.updateSavedIndication(editor.id, { title: editor.title, content: editor.content });
        setEditor({ ...editor, mode: 'view' });
      } else {
        await savedIndicationService.createSavedIndication({ title: editor.title, content: editor.content });
        setEditor(null);
      }
      await load();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await savedIndicationService.deleteSavedIndication(deleteId);
      setItems((prev) => prev.filter((i) => i.id !== deleteId));
      if (editor?.id === deleteId) setEditor(null);
      setDeleteId(null);
    } catch (e) { console.error(e); }
  };

  return (
    <div className="bg-cream-pattern" style={{ minHeight: 'calc(100vh - 44px)' }}>
    <div className="px-6 py-5 max-w-[1600px] mx-auto flex flex-col" style={{ height: 'calc(100vh - 44px)' }}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4 flex-shrink-0">
        <h1 className="text-base font-semibold text-gray-800 mr-1">{T.title}</h1>
        <span className="text-[11px] text-gray-400 tabular-nums">{processed.length} {processed.length === 1 ? T.one : T.many}</span>
        <div className="relative flex-1 max-w-sm ml-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
          <input
            type="text"
            placeholder={T.search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs rounded w-full focus:outline-none focus:ring-1 focus:ring-emerald-200 transition-shadow"
            style={{ backgroundColor: '#FFFFFF', border: '1px solid #CCC9C3', color: '#2D2B28' }}
          />
        </div>
        <button
          onClick={() => setEditor({ title: '', content: '', mode: 'edit' })}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: '#047857' }}
        >
          <Plus className="w-3.5 h-3.5" /> {T.nueva}
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        </div>
      ) : processed.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400">
          <FileText className="w-10 h-10 mb-3 opacity-40" />
          <p className="text-sm">{items.length === 0 ? T.emptyNone : T.emptyNoResults}</p>
          {items.length === 0 && <p className="text-[11px] mt-1">{T.emptyHint}</p>}
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="bg-white rounded-md overflow-hidden" style={{ border: '1px solid #E8E5DE' }}>
            <table className="w-full">
              <thead style={{ backgroundColor: '#FAF9F7', borderBottom: '1px solid #E8E5DE' }}>
                <tr className="text-left text-[10px] uppercase tracking-wider text-gray-500">
                  <th className="pl-3 pr-1 py-2 w-[34px]"></th>
                  <th className="px-3 py-2 font-semibold">{T.colName}</th>
                  <th className="px-3 py-2 font-semibold">{T.colPreview}</th>
                  <th className="px-2 py-2 font-semibold text-right w-[60px]"></th>
                </tr>
              </thead>
              <tbody>
                {processed.map((it) => (
                  <tr
                    key={it.id}
                    onClick={() => setEditor({ id: it.id, title: it.title, content: it.content, mode: 'view' })}
                    className="group cursor-pointer transition-colors"
                    style={{ borderTop: '1px solid #F0EDE8' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FAF9F7')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td className="pl-3 pr-1 py-2.5">
                      <FileText className="w-3.5 h-3.5 text-emerald-600/70" />
                    </td>
                    <td className="px-3 py-2.5 text-xs font-medium text-gray-800 align-top">{it.title}</td>
                    <td className="px-3 py-2.5 text-[11px] text-gray-500">
                      <span className="block truncate max-w-[640px]">{previewOf(it.content)}</span>
                    </td>
                    <td className="px-2 py-2.5 text-right">
                      <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteId(it.id!); }}
                          className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Editor (crear / editar) */}
      {editor && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => editor.mode === 'view' && setEditor(null)} />
          <div className="relative bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden" style={{ border: '1px solid #E8E5DE', width: '90vw', maxWidth: '900px', height: '88vh' }}>

            {/* Header */}
            <div className="flex items-center justify-between gap-4 px-5 py-3 flex-shrink-0" style={{ borderBottom: '1px solid #E8E5DE' }}>
              <div className="min-w-0 flex-1 flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#ECFDF5' }}>
                  <FileText className="w-4 h-4" style={{ color: '#047857' }} />
                </span>
                <h2 className="text-base font-semibold text-gray-900 truncate">
                  {editor.mode === 'edit' ? (editor.title.trim() || T.newTitle) : editor.title}
                </h2>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {editor.mode === 'view' && (
                  <>
                    <button onClick={() => setEditor({ ...editor, mode: 'edit' })} className="flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors">
                      <Pencil className="w-3.5 h-3.5" /> {T.edit}
                    </button>
                    <button onClick={() => editor.id && setDeleteId(editor.id)} className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
                <button onClick={() => setEditor(null)} className="p-1.5 rounded hover:bg-gray-100"><X className="h-4 w-4 text-gray-500" /></button>
              </div>
            </div>

            {/* Body */}
            {editor.mode === 'view' ? (
              <div className="flex-1 overflow-y-auto px-6 py-5">
                <p className="text-[13.5px] text-gray-700 leading-relaxed whitespace-pre-wrap">{editor.content}</p>
              </div>
            ) : (
              <>
                <div className="flex-1 min-h-0 px-6 py-5 flex flex-col gap-3" style={{ backgroundColor: '#FAF9F7' }}>
                  <div className="flex-shrink-0">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block mb-1.5">{T.name}</label>
                    <input
                      type="text"
                      value={editor.title}
                      onChange={(e) => setEditor({ ...editor, title: e.target.value })}
                      placeholder={T.namePh}
                      autoFocus
                      className="w-full px-3.5 py-2.5 text-[14px] rounded-md bg-white border border-[#E0DCD4] text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                  </div>
                  <div className="flex-1 min-h-0 flex flex-col">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block mb-1.5 flex-shrink-0">{T.content}</label>
                    <textarea
                      value={editor.content}
                      onChange={(e) => setEditor({ ...editor, content: e.target.value })}
                      placeholder={T.contentPh}
                      className="flex-1 min-h-0 w-full px-3.5 py-3 text-[13.5px] rounded-md bg-white border border-[#E0DCD4] text-gray-700 placeholder:text-gray-400 resize-none overflow-y-auto focus:outline-none focus:ring-2 focus:ring-emerald-200 leading-relaxed"
                    />
                  </div>
                </div>
                <div className="px-5 py-3 flex items-center justify-end gap-2 flex-shrink-0" style={{ borderTop: '1px solid #E8E5DE' }}>
                  <button onClick={() => editor.id ? setEditor({ ...editor, mode: 'view' }) : setEditor(null)} className="px-3 py-1.5 text-[12px] rounded border border-gray-300 text-gray-700 bg-white hover:bg-gray-50">{T.cancel}</button>
                  <button
                    onClick={save}
                    disabled={!editor.title.trim() || !editor.content.trim() || saving}
                    className="px-4 py-1.5 text-[12px] rounded font-semibold text-white inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#047857' }}
                  >
                    {saving ? <><span className="inline-block w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />{T.saving}</> : <><Check className="w-3.5 h-3.5" /> {T.save}</>}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Confirmar eliminación */}
      {deleteId && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white rounded-md shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="px-5 py-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-4 h-4 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900">{T.deleteTitle}</h3>
                <p className="text-xs text-gray-500 mt-1">{T.deleteIrreversible}</p>
              </div>
            </div>
            <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2">
              <button onClick={() => setDeleteId(null)} className="text-xs px-3 py-1.5 rounded text-gray-600 hover:bg-gray-100">{T.cancel}</button>
              <button onClick={confirmDelete} className="text-xs px-4 py-1.5 rounded font-semibold text-white bg-red-600 hover:bg-red-700">{T.delete}</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
