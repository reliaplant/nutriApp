'use client'

import { Order } from '@/app/shared/interfaces';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PedidoDetalleProps {
  order: Order;
  onClose: () => void;
  onUpdateStatus: (orderId: string, status: Order['status']) => Promise<void>;
}

export default function PedidoDetalle({ order, onClose, onUpdateStatus }: PedidoDetalleProps) {
  const getStatusClass = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'processing':
        return 'Pagado';
      case 'completed':
        return 'Entregado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return 'Desconocido';
    }
  };

  const formatTimeSlot = (timeSlot: string) => {
    const timeSlotMap: Record<string, string> = {
      "09:00-11:00": "9:00 AM - 11:00 AM",
      "11:00-13:00": "11:00 AM - 1:00 PM",
      "13:00-15:00": "1:00 PM - 3:00 PM",
      "15:00-17:00": "3:00 PM - 5:00 PM",
      "17:00-19:00": "5:00 PM - 7:00 PM",
    };
    
    return timeSlotMap[timeSlot] || timeSlot;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Detalles del Pedido</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          {/* Customer Info */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Información del Cliente</h3>
            <div className="bg-gray-50 p-3 rounded">
              <p className="font-medium text-gray-900">{order.customerName}</p>
              <p className="text-gray-600">{order.contact}</p>
            </div>
          </div>

          {/* Delivery Info */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Información de Entrega</h3>
            <div className="bg-gray-50 p-3 rounded space-y-1">
              <p>
                <span className="font-medium">Fecha: </span>
                {order.deliveryDate && format(new Date(order.deliveryDate), 'PPP', { locale: es })}
              </p>
              <p>
                <span className="font-medium">Horario: </span>
                {order.deliveryTime && formatTimeSlot(order.deliveryTime)}
              </p>
            </div>
          </div>

          {/* Order Items */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Productos</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                    <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                    <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Precio</th>
                    <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {order.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 text-sm text-gray-900">{item.name}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 text-right">{item.quantity}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 text-right">${item.price.toFixed(2)}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 text-right">${(item.quantity * item.price).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-sm font-medium text-gray-900 text-right">Subtotal:</td>
                    <td className="px-4 py-2 text-sm font-medium text-gray-900 text-right">${order.subtotal.toFixed(2)}</td>
                  </tr>
                  {order.discount && order.discount > 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-2 text-sm font-medium text-green-600 text-right">Descuento:</td>
                      <td className="px-4 py-2 text-sm font-medium text-green-600 text-right">-${order.discount.toFixed(2)}</td>
                    </tr>
                  )}
                  {order.shippingCost && order.shippingCost > 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-2 text-sm font-medium text-gray-900 text-right">Envío:</td>
                      <td className="px-4 py-2 text-sm font-medium text-gray-900 text-right">${order.shippingCost.toFixed(2)}</td>
                    </tr>
                  )}
                  <tr className="border-t-2">
                    <td colSpan={3} className="px-4 py-2 text-base font-semibold text-gray-900 text-right">Total:</td>
                    <td className="px-4 py-2 text-base font-semibold text-gray-900 text-right">${order.totalAmount.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Status and Actions */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-500 mr-2">Estado:</span>
              <select
                value={order.status}
                onChange={(e) => onUpdateStatus(order.id!, e.target.value as Order['status'])}
                className={`text-sm font-medium px-3 py-1 rounded-full border ${getStatusClass(order.status)}`}
              >
                <option value="pending" className="bg-white text-yellow-800">Pendiente</option>
                <option value="processing" className="bg-white text-blue-800">Pagado</option>
                <option value="completed" className="bg-white text-green-800">Entregado</option>
                <option value="cancelled" className="bg-white text-red-800">Cancelado</option>
              </select>
            </div>

            <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
