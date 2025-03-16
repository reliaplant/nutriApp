'use client'

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const SimulacionPacientes = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [currentFrame, setCurrentFrame] = useState(0);
  
  // Auto-rotate frames
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Weight history data for chart
  const weightHistory = [
    { date: '1 Jun', weight: 87.2 },
    { date: '15 Jun', weight: 85.8 },
    { date: '1 Jul', weight: 84.3 },
    { date: '15 Jul', weight: 83.0 },
    { date: '1 Ago', weight: 81.5 },
    { date: '15 Ago', weight: 79.8 },
  ];

  // Chart data config
  const chartData = {
    labels: weightHistory.map(record => record.date),
    datasets: [
      {
        label: 'Peso (kg)',
        data: weightHistory.map(record => record.weight),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
        fill: true,
      },
      {
        label: 'Objetivo',
        data: Array(weightHistory.length).fill(75),
        borderColor: 'rgba(255, 99, 132, 1)',
        borderDash: [5, 5],
        fill: false,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: false,
        min: 70,
        max: 90
      }
    },
    plugins: {
      legend: {
        display: false
      },
    },
  };

  const tabs = [
    { id: 'overview', name: 'Vista general' },
    { id: 'evolution', name: 'Evolución' },
    { id: 'documents', name: 'Documentos' }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Gestión integral de pacientes</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Toda la información de tus pacientes en un solo lugar. Visualiza su progreso, gestiona consultas y documenta su evolución de forma intuitiva.
          </p>
        </div>
        
        {/* Interactive Demo */}
        <div className="bg-white rounded-xl overflow-hidden shadow-xl border border-gray-200">
          {/* Browser-like header */}
          <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 flex items-center">
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div className="mx-auto text-sm text-gray-500">NutriApp - Panel de Paciente</div>
          </div>
          
          {/* App header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center">
              <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-emerald-200 mr-4">
                <Image 
                  src="/IMG_8524.JPG"
                  alt="Paciente"
                  width={64}
                  height={64}
                  className="object-cover"
                />
              </div>
              <div>
                <div className="text-lg font-bold">María García Sánchez</div>
                <div className="text-sm text-gray-500">35 años • 168cm • Activo desde: 01/06/2023</div>
              </div>
              <div className="ml-auto">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <span className="h-2 w-2 rounded-full bg-green-500 mr-1"></span>
                  Activo
                </span>
              </div>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="px-6 flex space-x-8">
              {tabs.map((tab, idx) => (
                <button
                  key={tab.id}
                  className={`py-4 px-1 border-b-2 text-sm font-medium ${
                    idx === activeTab
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab(idx)}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
          
          {/* Content */}
          <div className="p-6">
            {/* Content frames */}
            <div className="transition-opacity duration-500">
              {currentFrame === 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Key metrics card */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Progreso de peso</h3>
                    <div className="flex items-baseline">
                      <div className="text-2xl font-bold text-gray-900">-7.4 kg</div>
                      <div className="ml-2 text-sm text-green-600 font-medium">-8.5%</div>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">desde primera consulta</div>
                    
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progreso al objetivo</span>
                        <span>64%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: '64%' }}></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Upcoming appointment */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Próxima consulta</h3>
                    <div className="flex items-center">
                      <div className="h-3 w-3 rounded-full mr-2 bg-amber-400"></div>
                      <div className="text-gray-900 font-medium">28 de agosto, 2023 - 16:30</div>
                    </div>
                    <div className="mt-4 flex space-x-2">
                      <button className="text-xs bg-emerald-600 text-white px-3 py-1 rounded hover:bg-emerald-700">
                        Confirmar
                      </button>
                      <button className="text-xs border border-gray-300 px-3 py-1 rounded hover:bg-gray-50">
                        Reprogramar
                      </button>
                    </div>
                  </div>
                  
                  {/* Last measurement */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Última medición</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-500">Peso</div>
                        <div className="text-gray-900 font-bold">79.8 kg</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">IMC</div>
                        <div className="text-gray-900 font-bold">28.3</div>
                        <div className="text-xs text-yellow-600">Sobrepeso</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {currentFrame === 1 && (
                <div className="h-64">
                  <Line data={chartData} options={chartOptions} />
                </div>
              )}
              
              {currentFrame === 2 && (
                <div className="space-y-3">
                  {/* Document list */}
                  {[
                    { name: 'Análisis de sangre inicial', date: '01/06/2023', type: 'PDF' },
                    { name: 'Plan nutricional - Fase 1', date: '15/06/2023', type: 'DOCX' },
                    { name: 'Resultados de progreso - Mes 1', date: '01/07/2023', type: 'PDF' },
                    { name: 'Plan nutricional - Fase 2', date: '01/08/2023', type: 'DOCX' }
                  ].map((doc, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-md p-3 hover:bg-gray-50 flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="mr-3 text-gray-400">
                          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-800">{doc.name}</h4>
                          <div className="text-xs text-gray-500 flex items-center">
                            <span>{doc.type}</span>
                            <span className="mx-1">•</span>
                            <span>{doc.date}</span>
                          </div>
                        </div>
                      </div>
                      <button className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700 hover:bg-gray-200">
                        Ver
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Navigation dots */}
            <div className="flex justify-center space-x-2 mt-6">
              {[0, 1, 2].map((idx) => (
                <button
                  key={idx}
                  className={`h-2 w-2 rounded-full ${
                    currentFrame === idx ? 'bg-emerald-500' : 'bg-gray-300'
                  }`}
                  onClick={() => setCurrentFrame(idx)}
                ></button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Features list */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center mb-3">
              <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mr-3">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold">Seguimiento visual</h3>
            </div>
            <p className="text-gray-600 ml-13 pl-1">
              Visualiza la evolución del peso y otras métricas de tus pacientes con gráficos claros y personalizables.
            </p>
          </div>
          
          <div>
            <div className="flex items-center mb-3">
              <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mr-3">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold">Gestión de consultas</h3>
            </div>
            <p className="text-gray-600 ml-13 pl-1">
              Programa, registra y haz seguimiento a todas las citas con tus pacientes en un solo lugar.
            </p>
          </div>
          
          <div>
            <div className="flex items-center mb-3">
              <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mr-3">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold">Documentación centralizada</h3>
            </div>
            <p className="text-gray-600 ml-13 pl-1">
              Almacena y accede fácilmente a análisis, planes nutricionales y otros documentos importantes de tus pacientes.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SimulacionPacientes;