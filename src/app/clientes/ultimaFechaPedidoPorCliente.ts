import { pedidosService } from "../ventas/pedidos.service";
import { Pedido } from "../ventas/pedido.interface";

export async function getUltimaFechaPedidoPorCliente(): Promise<Record<string, string>> {
  const pedidos = await pedidosService.getAll();
  // Solo pedidos con estatus 'vendida'
  const pagados = pedidos.filter(p => p.estatus === 'vendida');
  // Agrupar por clienteId y obtener la fecha más reciente
  const fechas: Record<string, string> = {};
  pagados.forEach(p => {
    if (!fechas[p.clienteId] || new Date(p.fecha) > new Date(fechas[p.clienteId])) {
      fechas[p.clienteId] = p.fecha;
    }
  });
  return fechas;
}
