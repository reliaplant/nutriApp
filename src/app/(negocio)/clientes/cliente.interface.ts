export interface Cliente {
  id: string;
  nombre: string;
  dondeVive: string;
  telefono: string;
  correo: string;
  pais: string;
  origen: 'feria zibata' | 'feria altozano' | 'feria jurica' | 'feria juriquilla' | 'whatsapp' | 'instagram' | 'facebook' | 'publicaciones en grupos' | 'indicacion';
  nivel: string;
  cantPedidos: number;
  totalVentas: number;
  interes: string[];
  cantPedidosPagados?: number;
  ultimaFechaPedido?: string | null;
}
