export interface Movimiento {
  id: string;
  tipo: 'ingreso' | 'egreso';
  monto: number;
  descripcion: string;
  fecha: string;
  origen?: string; // opcional para ingresos
}
