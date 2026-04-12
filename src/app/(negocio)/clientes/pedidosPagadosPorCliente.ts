import { pedidosService } from "@/app/(negocio)/ventas/pedidos.service";
import { Pedido } from "@/app/(negocio)/ventas/pedido.interface";

export async function getPedidosPagadosPorCliente(): Promise<Record<string, number>> {
  const pedidos = await pedidosService.getAll();
  // Solo pedidos con estatus 'vendida'
  const pagados = pedidos.filter(p => p.estatus === 'vendida');
  // Agrupar por clienteId y contar
  const counts: Record<string, number> = {};
  pagados.forEach(p => {
    counts[p.clienteId] = (counts[p.clienteId] || 0) + 1;
  });
  return counts;
}
