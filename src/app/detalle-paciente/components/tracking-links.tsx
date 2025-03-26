'use client';

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

interface TrackingLinkProps {
  patientId: string;
}

const TrackingLinks: React.FC<TrackingLinkProps> = ({ patientId }) => {
  const [copied, setCopied] = useState(false);

  // Asegurar que la URL tenga el formato correcto sin caracteres no deseados
  const cleanId = patientId.trim();
  const trackingUrl = `${window.location.origin}/patient-tracking/${cleanId}`;
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(trackingUrl);
      setCopied(true);
      toast.success('Enlace copiado al portapapeles');
      
      // Reset copied state after 3 seconds
      setTimeout(() => {
        setCopied(false);
      }, 3000);
    } catch (err) {
      toast.error('Error al copiar enlace');
    }
  };
  
  const sendWhatsApp = () => {
    const message = encodeURIComponent(
      `Hola! Accede a este enlace para registrar tu seguimiento diario: ${trackingUrl}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  return (
    <div className="mb-6 bg-white border border-gray-300 rounded shadow-md p-6">
      <h3 className="text-lg font-medium mb-4">Enlace de seguimiento</h3>
      <p className="text-sm text-gray-600 mb-4">
        Comparte este enlace con tu paciente para que pueda registrar su seguimiento diario.
      </p>
      
      <div className="flex items-center mb-4">
        <input
          type="text"
          value={trackingUrl}
          readOnly
          className="flex-1 py-2 px-3 border border-gray-300 rounded-l text-sm"
        />
        <button
          onClick={copyToClipboard}
          className={`px-4 py-2 text-sm ${
            copied ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          } rounded-r border border-l-0 border-gray-300`}
        >
          {copied ? (
            <>
              <span className="mr-1">✓</span> Copiado
            </>
          ) : (
            'Copiar'
          )}
        </button>
      </div>
      
      <div className="flex space-x-3">
        <button
          onClick={sendWhatsApp}
          className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.273.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0a12 12 0 100 24 12 12 0 000-24zm0 22a10 10 0 110-20 10 10 0 010 20z"/>
          </svg>
          WhatsApp
        </button>
        
        <Link 
          href={`/patient-tracking/${patientId}`}
          target="_blank"
          className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Ver formulario
        </Link>
      </div>
    </div>
  );
};

export default TrackingLinks;
