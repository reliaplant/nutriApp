'use client'

import React, { useState } from 'react';
import Link from 'next/link';

const Pricing = () => {
  const [isAnnual, setIsAnnual] = useState(true);
  
  // Define feature lists for each plan
  const features = {
    free: [
      'Hasta 10 pacientes activos',
      'Gestión básica de consultas',
      'Historial médico básico',
      'Acceso desde navegador web',
    ],
    pro: [
      'Pacientes ilimitados',
      'Consultas y citas ilimitadas',
      'Gráficos de evolución avanzados',
      'Planes nutricionales personalizados',
      'Notificaciones automáticas',
      'Soporte prioritario',
    ],
    enterprise: [
      'Todo lo incluido en el plan Pro',
      'Atención multiusuario para clínicas',
      'Integraciones personalizadas',
      'API para conectar con otros sistemas',
      'Formación personalizada',
      'Gestor de cuenta dedicado',
    ]
  };

  return (
    <section id="pricing" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Planes diseñados para cada nutricionista</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Elige el plan que mejor se adapte a tus necesidades, desde profesionales independientes hasta grandes clínicas.
          </p>
          
          {/* Toggle annual/monthly pricing */}
          <div className="mt-8 flex items-center justify-center">
            <span className={`mr-3 ${isAnnual ? 'text-gray-500' : 'text-gray-900 font-medium'}`}>Mensual</span>
            <button 
              onClick={() => setIsAnnual(!isAnnual)} 
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-emerald-600"
            >
              <span className="sr-only">Toggle pricing period</span>
              <span 
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${isAnnual ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
            <span className={`ml-3 ${isAnnual ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
              Anual <span className="text-xs text-emerald-600 font-medium">(ahorra un 20%)</span>
            </span>
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {/* Free Plan */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 transition-all hover:shadow-md">
            <div className="p-8">
              <h3 className="text-lg font-semibold text-gray-900">Free</h3>
              <p className="text-sm text-gray-500 mt-2">Para nutricionistas que están empezando</p>
              
              <div className="mt-6">
                <div className="flex items-end">
                  <span className="text-4xl font-bold text-gray-900">€0</span>
                  <span className="text-sm text-gray-500 ml-2 pb-1">/ mes</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Sin coste, para siempre</p>
              </div>
              
              <Link 
                href="/register" 
                className="mt-8 block w-full py-3 px-4 rounded-lg text-center font-medium bg-white border border-emerald-600 text-emerald-600 hover:bg-emerald-50 transition-colors"
              >
                Empezar gratis
              </Link>
            </div>
            
            <div className="border-t border-gray-100 p-8">
              <ul className="space-y-3">
                {features.free.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="h-5 w-5 text-emerald-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* Pro Plan - Highlighted */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-xl border border-emerald-100 transform md:-translate-y-4 transition-all hover:shadow-lg relative">
            <div className="absolute top-0 w-full text-center py-2 bg-emerald-600 text-white text-sm font-medium">
              Más popular
            </div>
            
            <div className="p-8 pt-12">
              <h3 className="text-lg font-semibold text-gray-900">Profesional</h3>
              <p className="text-sm text-gray-500 mt-2">Para nutricionistas en activo</p>
              
              <div className="mt-6">
                <div className="flex items-end">
                  <span className="text-4xl font-bold text-gray-900">
                    {isAnnual ? '€19' : '€24'}
                  </span>
                  <span className="text-sm text-gray-500 ml-2 pb-1">/ mes</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {isAnnual ? 'Facturado anualmente (€228)' : 'Facturado mensualmente'}
                </p>
              </div>
              
              <Link 
                href="/register" 
                className="mt-8 block w-full py-3 px-4 rounded-lg text-center font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
              >
                Empezar ahora
              </Link>
            </div>
            
            <div className="border-t border-gray-100 p-8">
              <ul className="space-y-3">
                {features.pro.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="h-5 w-5 text-emerald-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* Enterprise Plan */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 transition-all hover:shadow-md">
            <div className="p-8">
              <h3 className="text-lg font-semibold text-gray-900">Enterprise</h3>
              <p className="text-sm text-gray-500 mt-2">Para clínicas y centros médicos</p>
              
              <div className="mt-6">
                <div className="flex items-end">
                  <span className="text-4xl font-bold text-gray-900">
                    {isAnnual ? '€89' : '€109'}
                  </span>
                  <span className="text-sm text-gray-500 ml-2 pb-1">/ mes</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {isAnnual ? 'Facturado anualmente (€1068)' : 'Facturado mensualmente'}
                </p>
              </div>
              
              <Link 
                href="/contact" 
                className="mt-8 block w-full py-3 px-4 rounded-lg text-center font-medium bg-white border border-emerald-600 text-emerald-600 hover:bg-emerald-50 transition-colors"
              >
                Contactar
              </Link>
            </div>
            
            <div className="border-t border-gray-100 p-8">
              <ul className="space-y-3">
                {features.enterprise.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="h-5 w-5 text-emerald-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        
        {/* FAQs */}
        <div className="mt-16 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Preguntas frecuentes</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">¿Puedo cambiar de plan en cualquier momento?</h4>
              <p className="text-sm text-gray-600">
                Sí, puedes actualizar o degradar tu plan en cualquier momento. Los cambios se aplicarán en tu siguiente ciclo de facturación.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">¿Hay período de prueba?</h4>
              <p className="text-sm text-gray-600">
                Ofrecemos una prueba gratuita de 14 días del plan Profesional para que puedas explorar todas las funcionalidades.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">¿Necesito tarjeta de crédito para empezar?</h4>
              <p className="text-sm text-gray-600">
                No, puedes registrarte y usar el plan gratuito sin introducir información de pago.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">¿Ofrecen descuentos para estudiantes?</h4>
              <p className="text-sm text-gray-600">
                Sí, ofrecemos un 50% de descuento para estudiantes de nutrición. Contacta con nuestro soporte para más información.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;