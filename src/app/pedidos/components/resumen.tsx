"use client";

import { OrderItem, OrderSummary } from "../../shared/interfaces";
import Image from "next/image";

interface ResumenPedidoProps {
  carrito: OrderItem[];
  orderSummary: OrderSummary;
  handleNextStep: () => void;
  showButton?: boolean; 
}

export default function ResumenPedido({ 
  carrito, 
  orderSummary,
  handleNextStep,
  showButton = true
}: ResumenPedidoProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 sticky top-24 border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Resumen del Pedido</h2>
        <div className="bg-emerald-500 text-white text-sm px-2 py-1 rounded-full">
          {orderSummary.itemCount} {orderSummary.itemCount === 1 ? 'producto' : 'productos'}
        </div>
      </div>

      {carrito.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <p>Tu carrito está vacío</p>
          <p className="text-sm mt-1">Añade productos para continuar</p>
        </div>
      ) : (
        <>
          <div className="divide-y divide-gray-200">
            {carrito.map((item) => (
              <div key={item.refaccionId} className="py-3 flex items-center">
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
                  <h4 className="font-medium text-sm text-gray-800 truncate">{item.name}</h4>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{item.quantity} x ${item.price.toFixed(2)}</span>
                    <span>${(item.quantity * item.price).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            {/* First show subtotal of products */}
            <div className="flex justify-between text-sm mb-1 text-gray-600">
              <span>Subtotal de Productos</span>
              <span>${orderSummary.subtotal.toFixed(2)}</span>
            </div>
            
            {/* Show discount if applicable - only $300 when subtotal >= $1800 */}
            {orderSummary.discountAmount > 0 && (
              <div className="flex justify-between text-sm mb-1 text-green-600 font-medium">
                <span>Descuento ($300 promoción)</span>
                <span>-${orderSummary.discountAmount.toFixed(2)}</span>
              </div>
            )}
            
            {/* Show shipping as a separate additional cost */}
            <div className="flex justify-between text-sm mb-1 text-gray-600">
              <span>Envío</span>
              <span className={orderSummary.shippingCost === 0 ? 'text-green-600 font-medium' : ''}>
                {orderSummary.shippingCost === 0 ? 'Gratis' : `+$${orderSummary.shippingCost.toFixed(2)}`}
              </span>
            </div>
            
            {/* Total is the sum of everything */}
            <div className="flex justify-between font-semibold text-lg mt-2 text-gray-800">
              <span>Total a Pagar</span>
              <span>${orderSummary.total.toFixed(2)}</span>
            </div>

            {/* Badges and notifications */}
            <div className="mt-3">
              {/* Free Shipping Badge/Message with dynamic thresholds */}
              {orderSummary.shippingCost === 0 ? (
                <div className="px-3 py-2 bg-green-100 border border-green-200 text-green-800 text-sm rounded-md flex items-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Envío gratis aplicado
                </div>
              ) : (
                <div className="p-3 bg-blue-50 border border-blue-100 text-blue-700 text-sm rounded-md mb-2">
                  <div className="font-medium">
                    Añade ${(orderSummary.nextDiscountThreshold || 1000) - orderSummary.subtotal > 0 
                      ? ((orderSummary.nextDiscountThreshold || 1000) - orderSummary.subtotal).toFixed(2) 
                      : '0.00'} más para obtener envío gratis
                  </div>
                </div>
              )}
              
              {/* Updated Discount Messages with dynamic amount and threshold */}
              {orderSummary.discountAmount > 0 ? (
                <div className="px-3 py-2 bg-green-100 border border-green-200 text-green-800 text-sm rounded-md flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Descuento de ${orderSummary.discountAmount.toFixed(2)} aplicado
                </div>
              ) : orderSummary.nextDiscountThreshold ? (
                <div className="p-3 bg-blue-50 border border-blue-100 text-blue-700 text-sm rounded-md">
                  <div className="font-medium">
                    Añade ${(orderSummary.nextDiscountThreshold - orderSummary.subtotal).toFixed(2)} más para obtener ${orderSummary.nextDiscountDescription?.split(' ')[0]} de descuento
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </>
      )}
      
      {showButton && (
        <button
          onClick={handleNextStep}
          disabled={carrito.length === 0}
          className={`mt-6 w-full py-3 px-4 rounded-lg text-white font-medium transition ${
            carrito.length === 0 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-emerald-500 hover:bg-emerald-600'
          }`}
        >
          {carrito.length === 0 ? 'Añade productos para continuar' : 'Continuar con mi pedido'}
        </button>
      )}
    </div>
  );
}
