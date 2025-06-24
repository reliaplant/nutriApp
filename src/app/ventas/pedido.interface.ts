export interface Pedido {
  id: string;
  clienteId: string;
  productos: Array<{
    productoId: string;
    cantidad: number;
    precioUnitario: number;
  }>;
  total: number;
  estatus: 'pendiente' | 'vendida';
  fecha: string;
  origen: 'pedido por whats' | 'feria zibata' | 'feria altozano' | 'otra feria';
}
