'use client'

import React, { useMemo, useState } from 'react';
import { X, Pencil, Trash2, Check, AlertCircle, Tag, Plus } from 'lucide-react';
import { SavedPlan } from '@/app/shared/firebase';
import { TagUsage, computeTagOptions } from '@/app/shared/TagEditor';
import { useTranslation } from '@/app/shared/useTranslation';

export default function TagManagerModal({ library, plans, onClose, onRename, onDelete, onCreate }: {
  library: string[];
  plans: SavedPlan[];
  onClose: () => void;
  onRename: (oldTag: string, newTag: string) => Promise<void>;
  onDelete: (tag: string) => Promise<void>;
  onCreate: (tag: string) => Promise<void> | void;
}) {
  const { t } = useTranslation();
  const options: TagUsage[] = useMemo(() => computeTagOptions(library, plans), [library, plans]);

  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<TagUsage | null>(null);
  const [busy, setBusy] = useState(false);
  const [newTag, setNewTag] = useState('');

  const createTag = async () => {
    const t = newTag.trim().replace(/\s+/g, ' ');
    if (!t) return;
    if (options.some(o => o.tag.toLowerCase() === t.toLowerCase())) { setNewTag(''); return; }
    setBusy(true);
    try { await onCreate(t); } finally { setBusy(false); setNewTag(''); }
  };

  const startEdit = (tag: string) => { setEditing(tag); setDraft(tag); };
  const commitEdit = async (tag: string) => {
    const next = draft.trim().replace(/\s+/g, ' ');
    if (!next || next === tag) { setEditing(null); return; }
    const dup = options.some(o => o.tag.toLowerCase() === next.toLowerCase() && o.tag.toLowerCase() !== tag.toLowerCase());
    if (dup) { setEditing(null); return; } // ya existe otra con ese nombre
    setBusy(true);
    try { await onRename(tag, next); } finally { setBusy(false); setEditing(null); }
  };
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try { await onDelete(deleteTarget.tag); } finally { setBusy(false); setDeleteTarget(null); }
  };

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !busy && onClose()} />
      <div className="relative bg-white rounded-md shadow-2xl w-full max-w-md flex flex-col overflow-hidden" style={{ border: '1px solid #E8E5DE', maxHeight: '80vh' }}>
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Tag className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">{t('plans.manageTagsTitle')}</span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X className="h-4 w-4 text-gray-500" /></button>
        </div>

        {/* Crear nueva etiqueta */}
        <div className="px-3 pt-3 pb-2 border-b border-[#F0EDE8] flex-shrink-0">
          <div className="flex items-center gap-2">
            <input
              value={newTag} onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') createTag(); }}
              placeholder={t('plans.newTagPlaceholder')}
              className="flex-1 min-w-0 px-3 py-1.5 text-sm rounded-sm bg-white border border-[#E0DCD4] focus:outline-none focus:ring-2 focus:ring-emerald-200 text-gray-800 placeholder:text-gray-400"
            />
            <button
              onClick={createTag} disabled={busy || !newTag.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 flex-shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> {t('plans.create')}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2">
          {options.length === 0 ? (
            <div className="py-10 text-center text-xs text-gray-400">{t('plans.noTags')}</div>
          ) : (
            <ul className="divide-y divide-[#F0EDE8]">
              {options.map(({ tag, count }) => (
                <li key={tag} className="flex items-center gap-2 px-2 py-1.5 group">
                  {editing === tag ? (
                    <>
                      <input
                        autoFocus value={draft} onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(tag); else if (e.key === 'Escape') setEditing(null); }}
                        className="flex-1 min-w-0 px-2 py-1 text-sm rounded-sm bg-white border border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-200 text-gray-800"
                      />
                      <button onClick={() => commitEdit(tag)} disabled={busy} className="p-1 rounded text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"><Check className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setEditing(null)} className="p-1 rounded text-gray-400 hover:bg-gray-100"><X className="w-3.5 h-3.5" /></button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 min-w-0 truncate text-sm text-gray-800">{tag}</span>
                      <span className="text-[10px] text-gray-400 tabular-nums flex-shrink-0">{count} {count === 1 ? t('plans.planOne') : t('plans.planMany')}</span>
                      <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEdit(tag)} title="Renombrar" className="p-1 rounded text-gray-400 hover:text-emerald-700 hover:bg-emerald-50"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setDeleteTarget({ tag, count })} title="Eliminar" className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="px-5 py-2 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <p className="text-[10px] text-gray-400">{t('plans.manageTagsFooter')}</p>
        </div>
      </div>

      {/* Confirmar eliminación de etiqueta */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !busy && setDeleteTarget(null)} />
          <div className="relative bg-white rounded-md shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="px-5 py-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-4 h-4 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900">{t('plans.deleteTagPrefix')} «{deleteTarget.tag}»</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {deleteTarget.count > 0
                    ? t('plans.deleteTagCascade')
                        .replace('{n}', String(deleteTarget.count))
                        .replace('{planes}', deleteTarget.count === 1 ? t('plans.planOne') : t('plans.planMany'))
                    : t('plans.deleteTagLibraryOnly')}
                </p>
              </div>
            </div>
            <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2">
              <button onClick={() => setDeleteTarget(null)} disabled={busy} className="text-xs px-3 py-1.5 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-50">{t('plans.cancel')}</button>
              <button onClick={confirmDelete} disabled={busy} className="text-xs px-4 py-1.5 rounded font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5">
                {busy && <span className="inline-block w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                {t('plans.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
