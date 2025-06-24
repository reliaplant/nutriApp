"use client";
import { useState } from "react";

interface Guia {
  id: number;
  titulo: string;
  contenido: string;
}

export default function GuiasPage() {
  const [guias, setGuias] = useState<Guia[]>([]);
  const [open, setOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [contenido, setContenido] = useState("");

  const handleCrear = () => {
    if (!titulo.trim() || !contenido.trim()) return;
    setGuias([
      ...guias,
      { id: Date.now(), titulo: titulo.trim(), contenido: contenido.trim() },
    ]);
    setTitulo("");
    setContenido("");
    setOpen(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Guías</h1>
      <button
        className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded shadow mb-4"
        onClick={() => setOpen(true)}
      >
        Crear nueva guía
      </button>
      <div className="space-y-4">
        {guias.length === 0 ? (
          <div className="text-gray-400 text-sm">No hay guías aún.</div>
        ) : (
          guias.map(g => (
            <div key={g.id} className="bg-white rounded-lg shadow border p-4">
              <h2 className="font-semibold text-lg mb-1">{g.titulo}</h2>
              <div className="text-gray-700 whitespace-pre-line text-sm">{g.contenido}</div>
            </div>
          ))
        )}
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
            >
              &times;
            </button>
            <h2 className="text-lg font-semibold mb-2">Nueva Guía</h2>
            <input
              className="border rounded px-2 py-1 w-full mb-3"
              placeholder="Título"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
            />
            <textarea
              className="border rounded px-2 py-1 w-full mb-3 min-h-[100px]"
              placeholder="Contenido de la guía"
              value={contenido}
              onChange={e => setContenido(e.target.value)}
            />
            <button
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded shadow w-full"
              onClick={handleCrear}
            >
              Guardar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
