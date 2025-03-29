"use client";

// Importa solo lo necesario, elimina el check de autenticación
import { useState, useEffect, useMemo } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../shared/firebase"; // Importar referencia a la base de datos
import ArmarPedido from "./components/armarPedido";
import ResumenPedido from "./components/resumen";
import FormularioSalida from "./components/formularioSalida";
import Entrega from "./components/entrega";
import Confirmacion from "./components/confirmacion";
import { OrderItem, Order, OrderSettings } from "../shared/interfaces";

// Define default values in case settings can't be loaded
const DEFAULT_SHIPPING_FEE = 100;
const DEFAULT_FREE_SHIPPING_THRESHOLD = 1000;
const DEFAULT_DISCOUNT_THRESHOLD = 1800;
const DEFAULT_DISCOUNT_AMOUNT = 300;

type OrderStep = 'armar' | 'formulario' | 'entrega' | 'confirmacion';

export default function PedidosPage() {
  const [carrito, setCarrito] = useState<OrderItem[]>([]);
  const [step, setStep] = useState<OrderStep>('armar');
  const [order, setOrder] = useState<Partial<Order> | null>(null);
  
  // Add settings state
  const [settings, setSettings] = useState<OrderSettings>({
    shippingFee: DEFAULT_SHIPPING_FEE,
    freeShippingThreshold: DEFAULT_FREE_SHIPPING_THRESHOLD,
    discountThreshold: DEFAULT_DISCOUNT_THRESHOLD,
    discountAmount: DEFAULT_DISCOUNT_AMOUNT
  });
  
  // Cargar configuraciones directamente de Firebase al montar el componente
  useEffect(() => {
    async function fetchSettings() {
      try {
        // Consultar el documento directamente sin usar el servicio
        const settingsDoc = await getDoc(doc(db, "orderSettings", "current"));
        
        if (settingsDoc.exists()) {
          // Si el documento existe, usar esos valores
          const fetchedSettings = settingsDoc.data() as OrderSettings;
          console.log("Configuraciones cargadas:", fetchedSettings);
          setSettings(fetchedSettings);
        } else {
          console.log("No se encontró el documento de configuración, usando valores predeterminados");
        }
      } catch (error) {
        console.error("Error al cargar configuraciones:", error);
        // En caso de error, seguir usando valores predeterminados
      }
    }
    
    fetchSettings();
  }, []);
  
  // Calculate order totals with shipping and discounts - updated to use dynamic settings
  const orderSummary = useMemo(() => {
    const subtotal = carrito.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    
    // Calculate discount based on threshold from settings
    let discountPercentage = 0;
    let discountAmount = 0;

    if (subtotal >= settings.discountThreshold) {
      // Apply the configured discount amount
      discountAmount = settings.discountAmount;
      // Calculate percentage equivalent for display purposes only
      discountPercentage = Math.round((settings.discountAmount / subtotal) * 100);
    }
    
    // Calculate shipping cost using threshold from settings
    const shippingCost = subtotal >= settings.freeShippingThreshold ? 0 : settings.shippingFee;
    
    // Final total: subtotal - discount + shipping
    const total = subtotal - discountAmount + shippingCost;
    
    // Item count
    const itemCount = carrito.reduce((acc, item) => acc + item.quantity, 0);
    
    return {
      subtotal,
      discountAmount,
      discountPercentage,
      shippingCost,
      total,
      itemCount,
      nextDiscountThreshold: subtotal < settings.discountThreshold ? settings.discountThreshold : null,
      nextDiscountDescription: subtotal < settings.discountThreshold ? `$${settings.discountAmount} descuento` : null
    };
  }, [carrito, settings]);
  
  // Agregar un item al carrito
  const agregarAlCarrito = (item: OrderItem) => {
    const existingItemIndex = carrito.findIndex(i => i.refaccionId === item.refaccionId);
    
    if (existingItemIndex >= 0) {
      // Ya existe el item, incrementar cantidad
      const updatedCarrito = [...carrito];
      updatedCarrito[existingItemIndex].quantity += 1;
      setCarrito(updatedCarrito);
    } else {
      // Nuevo item
      setCarrito([...carrito, { ...item, quantity: 1 }]);
    }
  };
  
  // Remover un item del carrito
  const removerDelCarrito = (refaccionId: string) => {
    const existingItemIndex = carrito.findIndex(i => i.refaccionId === refaccionId);
    
    if (existingItemIndex >= 0) {
      const updatedCarrito = [...carrito];
      
      if (updatedCarrito[existingItemIndex].quantity > 1) {
        // Decrementar cantidad
        updatedCarrito[existingItemIndex].quantity -= 1;
        setCarrito(updatedCarrito);
      } else {
        // Eliminar el item
        setCarrito(carrito.filter(item => item.refaccionId !== refaccionId));
      }
    }
  };
  
  // Manejar cambio de paso
  const handleNextStep = (data?: Partial<Order>) => {
    if (step === 'armar') {
      setStep('formulario');
    } else if (step === 'formulario' && data) {
      setOrder(prevOrder => ({
        ...prevOrder,
        ...data
      }));
      setStep('entrega');
    } else if (step === 'entrega' && data) {
      setOrder(prevOrder => ({
        ...prevOrder,
        ...data,
        items: carrito,
        totalAmount: orderSummary.total,
        subtotal: orderSummary.subtotal,
        shippingCost: orderSummary.shippingCost,
        discount: orderSummary.discountAmount,
        status: 'pending'
      }));
      setStep('confirmacion');
    }
  };
  
  const handlePrevStep = () => {
    if (step === 'formulario') {
      setStep('armar');
    } else if (step === 'entrega') {
      setStep('formulario');
    } else if (step === 'confirmacion') {
      setStep('entrega');
    }
  };

  const resetOrder = () => {
    setCarrito([]);
    setOrder(null);
    setStep('armar');
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-grow flex items-center justify-center px-4 py-8 pb-28">
        <div className="w-full max-w-4xl overflow-y-auto">
          <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Realizar Pedido</h1>
          
          {step === 'armar' && (
            <>
              {/* Promotional Banner - updated to use dynamic settings */}
              <div className="mb-6">
                <div className="bg-gradient-to-r from-emerald-500 to-blue-500 rounded-lg p-4 shadow-lg text-white">
                  <div className="flex flex-col md:flex-row items-center justify-between">
                    <div className="mb-3 md:mb-0">
                      <h3 className="text-lg font-bold">¡SUPER PROMOCIONES!</h3>
                      <div className="flex flex-col md:flex-row md:space-x-6 mt-2">
                        <div className="flex items-center mb-2 md:mb-0">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Envío gratis en pedidos de ${settings.freeShippingThreshold}+</span>
                        </div>
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>¡${settings.discountAmount} de descuento en pedidos de ${settings.discountThreshold}+!</span>
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center px-3 py-1 bg-white bg-opacity-20 rounded-full text-white text-sm animate-pulse">
                      <span className="mr-1">🔥</span> Promoción por tiempo limitado
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-1 md:col-span-2">
                  <ArmarPedido 
                    carrito={carrito} 
                    agregarAlCarrito={agregarAlCarrito} 
                    removerDelCarrito={removerDelCarrito} 
                  />
                </div>
                <div className="hidden md:block col-span-1">
                  <ResumenPedido 
                    carrito={carrito} 
                    orderSummary={orderSummary}
                    handleNextStep={handleNextStep} 
                    showButton={false} 
                  />
                </div>
              </div>
            </>
          )}
          
          {step === 'formulario' && (
            <FormularioSalida 
              handleNext={handleNextStep} 
              handleBack={handlePrevStep} 
              initialData={order || undefined}
              removeNavButtons={true} 
            />
          )}
          
          {step === 'entrega' && (
            <Entrega 
              handleNext={handleNextStep} 
              handleBack={handlePrevStep} 
              initialData={order || undefined}
              removeNavButtons={true} 
            />
          )}
          
          {step === 'confirmacion' && order && (
            <Confirmacion 
              order={{ 
                ...order as Order,
                subtotal: orderSummary.subtotal,
                discount: orderSummary.discountAmount,
                shippingCost: orderSummary.shippingCost
              }}
              handleBack={handlePrevStep}
              resetOrder={resetOrder}
              removeNavButtons={true} 
            />
          )}
        </div>
      </main>

      {/* Fixed bottom navigation bar - Always visible */}
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-10">
        <div className="container mx-auto px-4 py-3">
          {/* Order Summary Section in bottom bar */}
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center flex-wrap gap-1 flex-col items-start">
              <span className="text-sm text-gray-600">
                {orderSummary.itemCount} {orderSummary.itemCount === 1 ? 'producto' : 'productos'}
              </span>
              
              {/* Solo mostrar indicadores para las promociones activas o la siguiente promoción disponible */}
              {orderSummary.subtotal > 0 && (
                <div className="flex flex-wrap gap-1">
                  {/* Free shipping status - updated with dynamic threshold */}
                  {orderSummary.shippingCost === 0 ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      Envío gratis
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      +${(settings.freeShippingThreshold - orderSummary.subtotal).toFixed(2)} para envío gratis
                    </span>
                  )}

                  {/* Discount status - updated with dynamic threshold */}
                  {orderSummary.subtotal >= settings.discountThreshold ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      ${settings.discountAmount} descuento aplicado
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      +${(settings.discountThreshold - orderSummary.subtotal).toFixed(2)} para ${settings.discountAmount} descuento
                    </span>
                  )}
                </div>
              )}
            </div>
            
            <div className="text-right">
              <div className="text-xs text-gray-500">
                Subtotal: ${orderSummary.subtotal.toFixed(2)}
              </div>
              {orderSummary.discountAmount > 0 && (
                <div className="text-xs text-green-600">
                  Descuento: -${orderSummary.discountAmount.toFixed(2)}
                </div>
              )}
              <div className="text-xs text-gray-500">
                Envío: {orderSummary.shippingCost === 0 ? 'Gratis' : `$${orderSummary.shippingCost.toFixed(2)}`}
              </div>
              <div className="font-bold text-lg text-gray-800">
                Total: ${orderSummary.total.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            {step !== 'armar' && (
              <button
                onClick={handlePrevStep}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg"
              >
                Atrás
              </button>
            )}

            {step === 'armar' && (
              <button
                onClick={() => handleNextStep()}
                disabled={carrito.length === 0}
                className={`w-full px-6 py-2 rounded-lg text-white font-medium transition ${
                  carrito.length === 0 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-emerald-500 hover:bg-emerald-600'
                }`}
              >
                Continuar
              </button>
            )}

            {step === 'formulario' && (
              <button
                onClick={() => {
                  const formData = JSON.parse(localStorage.getItem('formData') || '{}');
                  if (formData.customerName) {
                    handleNextStep(formData);
                  } else {
                    document.getElementById('submit-form-button')?.click();
                  }
                }}
                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg"
              >
                Siguiente
              </button>
            )}

            {step === 'entrega' && (
              <button
                onClick={() => {
                  const deliveryData = JSON.parse(localStorage.getItem('deliveryData') || '{}');
                  if (deliveryData.deliveryDate && deliveryData.deliveryTime) {
                    handleNextStep(deliveryData);
                  } else {
                    document.getElementById('submit-entrega-button')?.click();
                  }
                }}
                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg"
              >
                Siguiente
              </button>
            )}

            {step === 'confirmacion' && (
              <button
                onClick={() => document.getElementById('confirm-order-button')?.click()}
                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg"
              >
                Confirmar Pedido
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

