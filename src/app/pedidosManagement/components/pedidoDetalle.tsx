"use client";

import { Order } from "../../shared/interfaces";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Image from 'next/image';

interface PedidoDetalleProps {
  order: Order;
  onClose: () => void;
  onUpdateStatus: (orderId: string, status: Order['status']) => Promise<void>;
}

export default function PedidoDetalle({ order, onClose, onUpdateStatus }: PedidoDetalleProps) {
  // Formatear fecha
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, 'PPP', { locale: es });
    } catch (e) {
      return dateStr;
    }
  };
  
  // Formatear hora de entrega
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

  // Obtener clase CSS para el select de estado
  const getStatusSelectClass = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'completed':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'cancelled':
        return 'bg-red-100 border-red-300 text-red-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };
  
  const handleUpdateStatus = async (status: Order['status']) => {
    if (!order.id) return;
    
    try {
      await onUpdateStatus(order.id, status);
    } catch (err) {
      console.error("Error al actualizar estado:", err);
      alert("No se pudo actualizar el estado del pedido.");
    }
  };
  
  // Formatear fecha de creación
  const formatCreatedAt = () => {
    if (!order.createdAt) return 'No disponible';
    
    try {
      // Si es un timestamp de Firestore
      if (typeof order.createdAt.toDate === 'function') {
        const date = order.createdAt.toDate();
        return format(date, 'PPp', { locale: es });
      }
      // Si es una fecha normal
      return format(new Date(order.createdAt), 'PPp', { locale: es });
    } catch (e) {
      return 'No disponible';
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Detalles del Pedido</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">INFORMACIÓN DEL CLIENTE</h3>
              <p className="font-semibold text-gray-900">{order.customerName}</p>
              <p className="text-gray-700">{order.contact || 'No disponible'}</p>
              {order.notes && (
                <div className="mt-2 border-t border-gray-200 pt-2">
                  <h4 className="text-xs font-medium text-gray-500">NOTAS:</h4>
                  <p className="text-gray-700 text-sm mt-1">{order.notes}</p>
                </div>
              )}
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">INFORMACIÓN DE ENTREGA</h3>
              <p className="text-gray-700">
                <span className="font-medium">Fecha:</span> {order.deliveryDate ? formatDate(order.deliveryDate) : 'No especificado'}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Horario:</span> {order.deliveryTime ? formatTimeSlot(order.deliveryTime) : 'No especificado'}
              </p>
              <div className="mt-2 border-t border-gray-200 pt-2">
                <h4 className="text-xs font-medium text-gray-500">ESTADO:</h4>
                <div className="mt-1">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">DETALLE DEL PEDIDO</h3>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Producto
                      </th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cantidad
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Precio Unitario
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {order.items.map((item) => (
                      <tr key={item.refaccionId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap flex items-center">
                          {item.photoUrl && (
                            <div className="relative h-10 w-10 mr-3">
                              <Image 
                                src={item.photoUrl} 
                                alt={item.name} 
                                fill
                                className="rounded object-cover"
                              />
                            </div>
                          )}
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600">
                          ${item.price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                          ${(item.quantity * item.price).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-medium text-gray-500">INFORMACIÓN DE ESTADO</h3>
                <div className="mt-2">
                  <select 
                    value={order.status}
                    onChange={(e) => handleUpdateStatus(e.target.value as Order['status'])}
                    className={`px-3 py-2 rounded-md text-sm font-medium border ${getStatusSelectClass(order.status)}`}
                  >
                    <option value="pending" className="bg-white text-yellow-800">Pendiente</option>
                    <option value="processing" className="bg-white text-blue-800">Pagado</option>
                    <option value="completed" className="bg-white text-green-800">Entregado</option>
                    <option value="cancelled" className="bg-white text-red-800">Cancelado</option>
                  </select>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm text-gray-600">
                  <span>Subtotal: </span>
                  <span>${order.subtotal?.toFixed(2)}</span>
                </div>
                {order.discount && order.discount > 0 && (
                  <div className="text-sm text-green-600">
                    <span>Descuento: </span>
                    <span>-${order.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="text-sm text-gray-600">
                  <span>Envío: </span>
                  <span>
                    {order.shippingCost === 0 ? 'Gratis' : `+$${order.shippingCost?.toFixed(2)}`}
                  </span>
                </div>
                <div className="font-bold text-lg text-gray-900">
                  <span>Total: </span>
                  <span>${order.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom actions */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
