"use client";
import { useState, useEffect } from "react";
import { Gasto } from "./gasto.interface";
import { gastosService } from "./gastos.service";

export default function GastosPage() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [nuevoGasto, setNuevoGasto] = useState<Omit<Gasto, "id">>({
    total: 0,
    descripcion: "",
    fecha: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    gastosService.getAll().then(setGastos);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNuevoGasto((prev) => ({ ...prev, [name]: name === "total" ? Number(value) : value }));
  };

  const handleGuardarGasto = async () => {
    const id = await gastosService.add(nuevoGasto);
    setGastos((prev) => [
      { ...nuevoGasto, id },
      ...prev,
    ]);
    setShowModal(false);
    setNuevoGasto({ total: 0, descripcion: "", fecha: new Date().toISOString().slice(0, 10) });
  };

  return (
    <div className="bg-gray-100 min-h-screen enton">
      <div className="flex justify-between items-center p-2 px-4 bg-gray-100">
        <h1 className="text-2xl font-bold">Gastos</h1>
        <button
          className="bg-emerald-600 text-white px-3 py-1.5 rounded text-sm hover:bg-emerald-700 transition"
          onClick={() => setShowModal(true)}
        >
          + Agregar Gasto
        </button>
      </div>
      <div className="overflow-x-auto mb-8">
        <table className="min-w-full bg-white border border-gray-200 shadow-sm overflow-hidden">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-100">
              <th className="px-4 py-2 text-center text-gray-700 font-semibold text-sm rounded-tl-lg">Total</th>
              <th className="px-4 py-2 text-center text-gray-700 font-semibold text-sm">Descripción</th>
              <th className="px-4 py-2 text-center text-gray-700 font-semibold text-sm rounded-tr-lg">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {gastos.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-8 text-gray-400 text-lg font-semibold bg-gray-50 rounded-b-lg">No hay gastos aún.</td>
              </tr>
            ) : (
              gastos.map((gasto, idx) => (
                <tr
                  key={gasto.id}
                  className={`border-t ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-emerald-50/40 group`}
                >
                  <td className="px-4 py-2 text-xs text-emerald-700 text-center font-bold">${gasto.total.toFixed(2)}</td>
                  <td className="px-4 py-2 text-xs text-gray-500 text-center">{gasto.descripcion}</td>
                  <td className="px-4 py-2 text-xs text-gray-500 text-center">{new Date(gasto.fecha).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Modal para agregar gasto */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-black/10">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-100">
            <h2 className="text-xl font-semibold mb-4">Agregar Gasto</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total</label>
                <input
                  type="number"
                  name="total"
                  min={0}
                  className="w-full border rounded px-3 py-2"
                  value={nuevoGasto.total}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  name="descripcion"
                  className="w-full border rounded px-3 py-2"
                  value={nuevoGasto.descripcion}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                <input
                  type="date"
                  name="fecha"
                  className="w-full border rounded px-3 py-2"
                  value={nuevoGasto.fecha}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                onClick={() => setShowModal(false)}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={handleGuardarGasto}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
