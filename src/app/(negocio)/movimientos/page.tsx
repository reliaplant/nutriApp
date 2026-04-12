"use client";
import { useState, useEffect } from "react";
import { pedidosService } from "@/app/(negocio)/ventas/pedidos.service";
import { gastosService } from "@/app/(negocio)/gastos/gastos.service";
import { Movimiento } from "./movimiento.interface";
import { startOfWeek, endOfWeek, isWithinInterval, parseISO } from "date-fns";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
} from "chart.js";
ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

export default function MovimientosPage() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [indicadores, setIndicadores] = useState({ ventas: 0, gastos: 0 });
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      const [ventas, gastos] = await Promise.all([
        pedidosService.getAll(),
        gastosService.getAll(),
      ]);
      // Calcular semana actual
      const hoy = new Date();
      const inicioSemana = startOfWeek(hoy, { weekStartsOn: 1 });
      const finSemana = endOfWeek(hoy, { weekStartsOn: 1 });
      const totalVentas = ventas
        .filter(v => isWithinInterval(parseISO(v.fecha), { start: inicioSemana, end: finSemana }))
        .reduce((acc, v) => acc + v.total, 0);
      const totalGastos = gastos
        .filter(g => isWithinInterval(parseISO(g.fecha), { start: inicioSemana, end: finSemana }))
        .reduce((acc, g) => acc + g.total, 0);
      setIndicadores({ ventas: totalVentas, gastos: totalGastos });
      const ingresos: Movimiento[] = ventas.map((v) => ({
        id: v.id,
        tipo: 'ingreso',
        monto: v.total,
        descripcion: `Venta (${v.productos.length} productos)`,
        fecha: v.fecha,
      }));
      const egresos: Movimiento[] = gastos.map((g) => ({
        id: g.id,
        tipo: 'egreso',
        monto: g.total,
        descripcion: g.descripcion,
        fecha: g.fecha,
      }));
      setMovimientos([...ingresos, ...egresos].sort((a, b) => b.fecha.localeCompare(a.fecha)));

      // Calcular datos para gráfico (últimas 8 semanas)
      const semanas: string[] = [];
      const ventasPorSemana: number[] = [];
      const gastosPorSemana: number[] = [];
      const saldoPorSemana: number[] = [];
      let saldoAcumulado = 0;
      for (let i = 7; i >= 0; i--) {
        const inicio = startOfWeek(new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000), { weekStartsOn: 1 });
        const fin = endOfWeek(inicio, { weekStartsOn: 1 });
        const ventasSemana = ventas
          .filter(v => isWithinInterval(parseISO(v.fecha), { start: inicio, end: fin }))
          .reduce((acc, v) => acc + v.total, 0);
        const gastosSemana = gastos
          .filter(g => isWithinInterval(parseISO(g.fecha), { start: inicio, end: fin }))
          .reduce((acc, g) => acc + g.total, 0);
        saldoAcumulado += ventasSemana - gastosSemana;
        semanas.push(`${inicio.getDate()}/${inicio.getMonth() + 1}`);
        ventasPorSemana.push(ventasSemana);
        gastosPorSemana.push(gastosSemana);
        saldoPorSemana.push(saldoAcumulado);
      }
      setChartData({
        labels: semanas,
        datasets: [
          {
            label: "Saldo acumulado",
            data: saldoPorSemana,
            type: "line",
            borderColor: "#6366f1",
            backgroundColor: "#6366f1",
            fill: false,
            pointRadius: 3,
            tension: 0.3,
            order: 2,
            yAxisID: undefined, // Asegura que no se asigne yAxisID
          },
        ],
      });
    }
    fetchData();
  }, []);

  return (
    <div className="bg-gray-100 min-h-screen enton">
      <h1 className="text-2xl font-bold mb-4 p-2 px-4 bg-gray-100">Ingresos y Egresos</h1>
      <div className="bg-white/80 rounded-xl shadow-lg border border-gray-200 mb-8 flex flex-col justify-center items-center p-2" style={{ height: '30vh', minHeight: 120 }}>
        {chartData && (
          <Bar
            data={chartData}
            options={{
              responsive: true,
              plugins: {
                legend: { display: false },
                title: { display: false },
              },
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  title: { display: true, text: "Saldo acumulado ($)" },
                  ticks: {
                    callback: function(value) {
                      return `$${value}`;
                    },
                  },
                },
              },
              layout: {
                padding: 16,
              },
            }}
          />
        )}
      </div>
      <div className="overflow-x-auto mb-8">
        <table className="min-w-full bg-white border border-gray-200 shadow-sm overflow-hidden">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-100">
              <th className="px-4 py-2 text-center text-gray-700 font-semibold text-sm rounded-tl-lg">Tipo</th>
              <th className="px-4 py-2 text-center text-gray-700 font-semibold text-sm">Monto</th>
              <th className="px-4 py-2 text-center text-gray-700 font-semibold text-sm">Descripción</th>
              <th className="px-4 py-2 text-center text-gray-700 font-semibold text-sm rounded-tr-lg">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {movimientos.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-gray-400 text-lg font-semibold bg-gray-50 rounded-b-lg">No hay movimientos aún.</td>
              </tr>
            ) : (
              movimientos.map((m, idx) => (
                <tr
                  key={m.tipo + m.id}
                  className={`border-t ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-emerald-50/40 group`}
                >
                  <td className={`px-4 py-2 text-xs font-semibold text-center ${m.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}>{m.tipo.charAt(0).toUpperCase() + m.tipo.slice(1)}</td>
                  <td className="px-4 py-2 text-xs text-emerald-700 text-center font-bold">${m.monto.toFixed(2)}</td>
                  <td className="px-4 py-2 text-xs text-gray-500 text-center">{m.descripcion}</td>
                  <td className="px-4 py-2 text-xs text-gray-500 text-center">{new Date(m.fecha).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
