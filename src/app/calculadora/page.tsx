"use client";
import { useState } from "react";

export default function CalculadoraPage() {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-gray-100 min-h-screen enton">
      <div className="flex justify-between items-center p-2 px-4 bg-gray-100">
        <h1 className="text-2xl font-bold">Calculadora</h1>
      </div>
      <div className="overflow-x-auto mb-8">
        <table className="min-w-full bg-white border border-gray-200 shadow-sm overflow-hidden">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-100">
              <th className="px-4 py-2 text-center text-gray-700 font-semibold text-sm rounded-tl-lg">Herramienta</th>
              <th className="px-4 py-2 text-center text-gray-700 font-semibold text-sm rounded-tr-lg">Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr
              className="border-t bg-white hover:bg-emerald-50/40 cursor-pointer group"
              onClick={() => setOpen(true)}
            >
              <td className="px-4 py-2 text-center font-semibold text-emerald-700">Calculadora Pan de Queso</td>
              <td className="px-4 py-2 text-center text-gray-500 group-hover:text-emerald-700 transition">Ver</td>
            </tr>
          </tbody>
        </table>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-100 relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold"
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
            >
              &times;
            </button>
            <PanDeQuesoCalculator />
          </div>
        </div>
      )}
    </div>
  );
}

function PanDeQuesoCalculator() {
  const [harina, setHarina] = useState(1); // kg
  // Relación base para 1 kg de harina
  const base = {
    harina: 1, // kg
    panes: 70,
    polvilhoAzedo: 500, // gr
    polvilhoDoce: 500, // gr
    queso: 600, // gr
    agua: 400, // gr
    leche: 400, // gr
    huevos: 7,
  };
  const factor = harina / base.harina;
  const calc = (v: number) => +(v * factor).toFixed(2);
  const calcPote = (cantidadGramos: number, poteLitros: number) => Math.ceil((cantidadGramos * factor) / (poteLitros * 1000));
  const calcPaqueteQueso = (cantidadGramos: number, paqueteGramos: number) => Math.ceil((cantidadGramos * factor) / paqueteGramos);
  const panes = Math.round(base.panes * factor);
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4 text-emerald-700">Ingredientes Pan de Queso</h2>
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Cantidad de harina (kg)</label>
        <select
          className="border-none rounded-lg px-4 py-2 bg-gray-100 focus:ring-2 focus:ring-emerald-300 focus:bg-white transition w-32"
          value={harina}
          onChange={e => setHarina(Number(e.target.value))}
        >
          {Array.from({ length: 20 }, (_, i) => i + 1).map((kg) => (
            <option key={kg} value={kg}>{kg} kg</option>
          ))}
        </select>
      </div>
      <div className="space-y-2 text-sm">
        <div><b>Pan de queso estimado:</b> <span className="text-emerald-700 font-bold">{panes} und.</span></div>
        <div><b>Polvilho Azedo:</b> <span className="text-gray-700">{calc(base.polvilhoAzedo)} gr</span></div>
        <div><b>Polvilho Doce:</b> <span className="text-gray-700">{calc(base.polvilhoDoce)} gr</span></div>
        <div><b>Queso:</b> <span className="text-gray-700">{calc(base.queso)} gr</span> <span className="text-xs">({calcPaqueteQueso(base.queso, 900)} paquetes de 900gr)</span></div>
        <div><b>Agua:</b> <span className="text-gray-700">{calc(base.agua)} gr</span> <span className="text-xs">({(calc(base.agua)/1000).toFixed(2)} L)</span></div>
        <div><b>Leche:</b> <span className="text-gray-700">{calc(base.leche)} gr</span> <span className="text-xs">({(calc(base.leche)/1000).toFixed(2)} L, {calcPote(base.leche, 1.5)} potes de 1.5L <b>o</b> {calcPote(base.leche, 1)} potes de 1L)</span></div>
        <div><b>Aceite:</b> <span className="text-gray-700">{calc(base.agua)} gr</span> <span className="text-xs">({(calc(base.agua)/1000).toFixed(2)} L, {calcPote(base.agua, 0.85)} potes de 850ml)</span></div>
        <div><b>Huevos:</b> <span className="text-gray-700">{Math.round(calc(base.huevos))} und.</span></div>
      </div>
    </div>
  );
}
