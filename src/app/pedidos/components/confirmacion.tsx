"use client";

import { useState } from "react";
import { Order } from "../../shared/interfaces";
import { orderService } from "../../shared/firebase";
import Image from "next/image";

interface ConfirmacionProps {
  order: Order;
  handleBack: () => void;
  resetOrder: () => void;
  removeNavButtons?: boolean; // Add this option
}

export default function Confirmacion({ 
  order, 
  handleBack, 
  resetOrder,
  removeNavButtons = false // Default to showing the buttons 
}: ConfirmacionProps) {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  
  // Calculate discount percentage
  const discountPercentage = order.discount && order.subtotal 
    ? Math.round((order.discount / order.subtotal) * 100) 
    : 0;

  const handleSubmit = async () => {
    if (submitting) return;
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Aquí puedes modificar orderService.createOrder para que no requiera autenticación
      // o crear una versión específica para pedidos públicos
      const id = await orderService.createPublicOrder(order);
      setOrderId(id);
      setSuccess(true);
      
    } catch (err) {
      console.error("Error al enviar pedido:", err);
      setError("No se pudo procesar tu pedido. Por favor intenta nuevamente.");
    } finally {
      setSubmitting(false);
    }
  };
  
  if (success) {
    return (
      <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-md p-6 mb-20 border border-gray-200">
        <div className="text-center py-6">
          <div className="bg-emerald-100 text-emerald-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold mb-2 text-gray-800">¡Pedido Enviado!</h2>
          <p className="text-gray-600 mb-4">
            Tu pedido ha sido recibido con éxito. Te contactaremos pronto para confirmar los detalles.
          </p>
          {orderId && (
            <p className="text-sm text-gray-500 mb-4">
              Número de pedido: <span className="font-mono">{orderId}</span>
            </p>
          )}
          <button
            onClick={resetOrder}
            className="bg-emerald-500 hover:bg-emerald-600 text-white py-2 px-6 rounded-lg"
          >
            Realizar otro pedido
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      <h2 className="text-xl font-semibold p-4 border-b border-gray-200 text-gray-800">Confirma tu Pedido</h2>
      
      <div className="p-4">
        {error && (
          <div className="bg-red-50 text-red-800 p-3 rounded-md mb-4 border border-red-200">
            {error}
          </div>
        )}
        
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2 text-gray-800">Información de Contacto</h3>
          <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
            <p><span className="font-medium text-gray-700">Nombre:</span> {order.customerName}</p>
            {order.contact && <p><span className="font-medium text-gray-700">Contacto:</span> {order.contact}</p>}
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2 text-gray-800">Información de Entrega</h3>
          <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
            {order.deliveryDate && (
              <p>
                <span className="font-medium text-gray-700">Fecha:</span> {new Date(order.deliveryDate).toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            )}
            {order.deliveryTime && (
              <p>
                <span className="font-medium text-gray-700">Horario:</span> {
                  {
                    "09:00-11:00": "9:00 AM - 11:00 AM",
                    "11:00-13:00": "11:00 AM - 1:00 PM",
                    "13:00-15:00": "1:00 PM - 3:00 PM",
                    "15:00-17:00": "3:00 PM - 5:00 PM",
                    "17:00-19:00": "5:00 PM - 7:00 PM",
                  }[order.deliveryTime] || order.deliveryTime
                }
              </p>
            )}
          </div>
        </div>
        
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2 text-gray-800">Productos</h3>
          <div className="divide-y border border-gray-200 rounded-md overflow-hidden">
            {order.items.map((item) => (
              <div key={item.refaccionId} className="p-3 flex items-center bg-gray-50">
                {item.photoUrl && (
                  <div className="relative w-12 h-12 mr-3 flex-shrink-0">
                    <Image 
                      src={item.photoUrl}
                      alt={item.name}
                      fill
                      style={{ objectFit: 'cover' }}
                      className="rounded-md"
                    />
                  </div>
                )}
                {!item.photoUrl && (
                  <div className="w-12 h-12 bg-gray-200 rounded-md mr-3 flex-shrink-0"></div>
                )}
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-800 truncate">{item.name}</h4>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{item.quantity} x ${item.price.toFixed(2)}</span>
                    <span>${(item.quantity * item.price).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {order.notes && (
          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2 text-gray-800">Notas</h3>
            <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
              <p className="text-gray-700">{order.notes}</p>
            </div>
          </div>
        )}
        
        <div className="border-t border-gray-200 pt-4">
          {/* First show the subtotal of products */}
          <div className="flex justify-between text-sm mb-1 text-gray-600">
            <span>Subtotal de Productos</span>
            <span>${order.subtotal?.toFixed(2)}</span>
          </div>
          
          {/* Show discount if applicable - with dynamic amount */}
          {order.discount && order.discount > 0 && (
            <div className="flex justify-between text-sm mb-1 text-green-600">
              <span>Descuento (Promo ${order.discount})</span>
              <span>-${order.discount.toFixed(2)}</span>
            </div>
          )}
          
          {/* Show shipping as an additional cost */}
          <div className="flex justify-between text-sm mb-1 text-gray-600">
            <span>Envío</span>
            <span>
              {order.shippingCost === 0 
                ? <span className="text-green-600 font-medium">Gratis</span> 
                : `+$${order.shippingCost?.toFixed(2)}`
              }
            </span>
          </div>
          
          {/* Total is correctly calculated: subtotal - discount + shipping */}
          <div className="flex justify-between font-semibold text-lg mt-2 text-gray-800">
            <span>Total a Pagar</span>
            <span>${order.totalAmount.toFixed(2)}</span>
          </div>

          {/* Applied promotions as badges - with dynamic discount amount */}
          {(order.shippingCost === 0 || (order.discount && order.discount > 0)) && (
            <div className="mt-4 space-y-2">
              <div className="text-sm text-gray-700 font-medium">Promociones aplicadas:</div>
              <div className="flex flex-wrap gap-2">
                {order.shippingCost === 0 && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                    Envío gratis
                  </span>
                )}
                
                {order.discount && order.discount > 0 && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                    ${order.discount} de descuento
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Hidden button for external triggering */}
      <button
        id="confirm-order-button"
        type="button"
        onClick={handleSubmit}
        className="hidden"
      >
        Confirm
      </button>
      
      {/* Only show these buttons if removeNavButtons is false */}
      {!removeNavButtons && (
        <div className="flex justify-between p-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleBack}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md"
            disabled={submitting}
          >
            Atrás
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className={`px-4 py-2 ${submitting ? 'bg-gray-400' : 'bg-emerald-500 hover:bg-emerald-600'} text-white rounded-md flex items-center`}
          >
            {submitting && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            )}
            {submitting ? 'Procesando...' : 'Confirmar Pedido'}
          </button>
        </div>
      )}
    </div>
  );
}
