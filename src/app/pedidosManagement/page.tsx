"use client";

import { useState, useEffect } from "react";
import { orderService, authService } from "../shared/firebase";
import { Order } from "../shared/interfaces";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import PedidoDetalle from "./components/pedidoDetalle";
import { useRouter } from "next/navigation";
import OrderSettingsModal from "./components/orderSettings";

export default function PedidosManagementPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<Order['status'] | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  // Check authentication first
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Wait for auth state to be determined
        const user = await authService.getAuthStatePromise();
        
        if (!user) {
          // Redirect to login if not authenticated
          router.push('/auth/login?redirect=/pedidosManagement');
          return;
        }
        
        // Proceed to fetch data once authentication is confirmed
        fetchOrders();
      } catch (err) {
        console.error("Error checking authentication:", err);
        setError("Error de autenticación. Intenta iniciar sesión nuevamente.");
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [router]);
  
  // Cargar pedidos
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const fetchedOrders = await orderService.getOrders();
      setOrders(fetchedOrders);
      setFilteredOrders(fetchedOrders);
    } catch (err) {
      console.error("Error al cargar pedidos:", err);
      setError("No se pudieron cargar los pedidos. Por favor, intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };
  
  // Filtrar pedidos cuando cambia el statusFilter
  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter(order => order.status === statusFilter));
    }
  }, [statusFilter, orders]);
  
  // Actualizar el estado de un pedido
  const handleStatusUpdate = async (orderId: string, status: Order['status']) => {
    try {
      await orderService.updateOrderStatus(orderId, status);
      
      // Actualizar localmente
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status } : order
      ));
    } catch (err) {
      console.error("Error al actualizar el estado:", err);
      alert("No se pudo actualizar el estado del pedido.");
    }
  };
  
  // Eliminar un pedido
  const handleDeleteOrder = async (orderId: string) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este pedido? Esta acción no se puede deshacer.")) {
      try {
        await orderService.deleteOrder(orderId);
        
        // Remover de la lista local
        setOrders(orders.filter(order => order.id !== orderId));
      } catch (err) {
        console.error("Error al eliminar el pedido:", err);
        alert("No se pudo eliminar el pedido.");
      }
    }
  };
  
  // Abrir el modal con detalles del pedido
  const openOrderDetail = (order: Order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };
  
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
  
  // Obtener clase CSS para el estado
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
        return 'border-yellow-500 text-yellow-800';
      case 'processing':
        return 'border-blue-500 text-blue-800';
      case 'completed':
        return 'border-green-500 text-green-800';
      case 'cancelled':
        return 'border-red-500 text-red-800';
      default:
        return 'border-gray-500 text-gray-800';
    }
  };
  
  // Obtener texto para el estado
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
  
  // Componente para los filtros de estado
  const StatusFilters = () => (
    <div className="flex flex-wrap gap-2 mb-4">
      <button
        onClick={() => setStatusFilter('all')}
        className={`px-3 py-1 rounded-full text-sm font-medium ${
          statusFilter === 'all' 
            ? 'bg-gray-800 text-white' 
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        Todos
      </button>
      <button
        onClick={() => setStatusFilter('pending')}
        className={`px-3 py-1 rounded-full text-sm font-medium ${
          statusFilter === 'pending' 
            ? 'bg-yellow-500 text-white' 
            : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
        }`}
      >
        Pendientes
      </button>
      <button
        onClick={() => setStatusFilter('processing')}
        className={`px-3 py-1 rounded-full text-sm font-medium ${
          statusFilter === 'processing' 
            ? 'bg-blue-500 text-white' 
            : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
        }`}
      >
        Pagados
      </button>
      <button
        onClick={() => setStatusFilter('completed')}
        className={`px-3 py-1 rounded-full text-sm font-medium ${
          statusFilter === 'completed' 
            ? 'bg-green-500 text-white' 
            : 'bg-green-100 text-green-800 hover:bg-green-200'
        }`}
      >
        Entregados
      </button>
      <button
        onClick={() => setStatusFilter('cancelled')}
        className={`px-3 py-1 rounded-full text-sm font-medium ${
          statusFilter === 'cancelled' 
            ? 'bg-red-500 text-white' 
            : 'bg-red-100 text-red-800 hover:bg-red-200'
        }`}
      >
        Cancelados
      </button>
    </div>
  );
  
  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6 bg-gray-50">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 bg-red-500 hover:bg-red-600 text-white py-1 px-4 rounded"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Gestión de Pedidos</h1>
          
          {/* Add Settings button */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowSettingsModal(true)}
              className="px-3 py-1 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-md flex items-center space-x-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Configurar Promociones</span>
            </button>
            
            <div className="text-sm text-gray-500">
              {filteredOrders.length} pedido{filteredOrders.length !== 1 ? 's' : ''} 
              {statusFilter !== 'all' && (
                <span> ({getStatusText(statusFilter)})</span>
              )}
            </div>
          </div>
        </div>
        
        <StatusFilters />
        
        <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
          {filteredOrders.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <p>No hay pedidos {statusFilter !== 'all' ? getStatusText(statusFilter).toLowerCase() : ''} disponibles</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hora de Entrega
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contacto
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monto
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {order.deliveryDate ? formatDate(order.deliveryDate) : 'No especificado'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {order.deliveryTime ? formatTimeSlot(order.deliveryTime) : 'No especificado'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {order.contact || 'No disponible'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">${order.totalAmount.toFixed(2)}</div>
                        <div className="text-xs text-gray-500">
                          {order.items.reduce((acc, item) => acc + item.quantity, 0)} productos
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select 
                          value={order.status}
                          onChange={(e) => handleStatusUpdate(order.id!, e.target.value as Order['status'])}
                          className={`px-3 py-1 rounded-md text-sm font-medium border ${
                            getStatusSelectClass(order.status)
                          }`}
                        >
                          <option value="pending" className="bg-white text-yellow-800">Pendiente</option>
                          <option value="processing" className="bg-white text-blue-800">Pagado</option>
                          <option value="completed" className="bg-white text-green-800">Entregado</option>
                          <option value="cancelled" className="bg-white text-red-800">Cancelado</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => openOrderDetail(order)}
                          className="text-emerald-600 hover:text-emerald-900"
                        >
                          Ver
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(order.id!)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* Modal for settings */}
      {showSettingsModal && (
        <OrderSettingsModal onClose={() => setShowSettingsModal(false)} />
      )}
      
      {/* Modal for order details */}
      {showModal && selectedOrder && (
        <PedidoDetalle 
          order={selectedOrder} 
          onClose={() => setShowModal(false)} 
          onUpdateStatus={handleStatusUpdate}
        />
      )}
    </div>
  );
}

