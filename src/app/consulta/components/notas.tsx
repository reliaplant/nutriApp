'use client'

import React, { useState, useRef } from 'react';
import { MDXEditorMethods } from '@mdxeditor/editor';
import { ForwardRefEditor } from './ForwardRefEditor';

// Interface para las props
interface NotasProps {
  initialContent?: string;
  onSave?: (content: string) => void;
  readOnly?: boolean;
  patientId?: string;
}

// Contenido inicial vacío
const notasIniciales = '';

const Notas = ({
  initialContent = notasIniciales,
  onSave,
  readOnly = false,
  patientId,
}: NotasProps) => {
  const [markdown, setMarkdown] = useState(initialContent);
  const [isEditing, setIsEditing] = useState(false);
  const editorRef = useRef<MDXEditorMethods>(null);
  
  // Función para guardar el contenido
  const handleSave = () => {
    if (editorRef.current && onSave) {
      const content = editorRef.current.getMarkdown();
      setMarkdown(content);
      onSave(content);
    }
    setIsEditing(false);
  };

  // Función para determinar si el contenido está vacío
  const isContentEmpty = (content: string) => {
    const trimmedContent = content.trim();
    return trimmedContent === '' || trimmedContent === '#' || trimmedContent === '# ';
  };

  return (
    <div className="bg-white ">
      <div className="flex justify-between items-center mb-4 200 p-4 border-b border-b-gray-300">
        <h2 className="text-xl font-semibold text-gray-700">Notas</h2>
        {!readOnly && (
          <div>
            {isEditing ? (
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="px-3 py-1 text-sm bg-blue-500 rounded text-white hover:bg-blue-600"
                >
                  Guardar
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1 text-sm border border-blue-500 text-blue-500 rounded hover:bg-blue-50"
              >
                Editar
              </button>
            )}
          </div>
        )}
      </div>

      <div className="">
        {isEditing ? (
          <ForwardRefEditor
            ref={editorRef}
            markdown={markdown}
            onChange={setMarkdown}
            contentEditableClassName="min-h-[300px] focus:outline-none text-sm"
            placeholder="Escribe tus notas aquí..."
          />
        ) : (
          <div className="p-4 prose max-w-none text-sm min-h-[300px]">
            {isContentEmpty(markdown) ? (
              // Mensaje cuando no hay notas (solo se muestra, no forma parte del contenido)
              <div className="text-gray-400 italic flex items-center justify-center h-full">
                No se han agregado notas
              </div>
            ) : (
              // Contenido de las notas (cuando hay contenido)
              <div 
                dangerouslySetInnerHTML={{ 
                  __html: markdown
                    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
                    .replace(/\n/gim, '<br />') 
                }} 
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notas;