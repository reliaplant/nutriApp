'use client'

import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { Users, UserCheck, UserMinus, UserX, Percent, Calendar, TrendingUp } from 'lucide-react';

// Datos simulados - en un caso real vendrían de tu API
const mockPatientData = {
  total: 126,
  active: 82,
  discharged: 35,
  lost: 9,
  successRate: 85, // porcentaje
  newThisMonth: 8,
  growthRate: 12 // porcentaje
};

const mockConsultationsData = [
  { month: 'Ene', completed: 48, scheduled: 52 },
  { month: 'Feb', completed: 52, scheduled: 58 },
  { month: 'Mar', completed: 61, scheduled: 65 },
  { month: 'Abr', completed: 45, scheduled: 52 },
  { month: 'May', completed: 69, scheduled: 72 },
  { month: 'Jun', completed: 57, scheduled: 64 },
  { month: 'Jul', completed: 66, scheduled: 72 },
  { month: 'Ago', completed: 70, scheduled: 75 },
  { month: 'Sep', completed: 62, scheduled: 68 },
  { month: 'Oct', completed: 75, scheduled: 80 },
  { month: 'Nov', completed: 59, scheduled: 63 },
  { month: 'Dic', completed: 55, scheduled: 60 },
];

const mockPatientStatusData = [
  { name: 'Activos', value: 82, color: '#10b981' },
  { name: 'Dados de alta', value: 35, color: '#3b82f6' },
  { name: 'Perdidos', value: 9, color: '#ef4444' },
];

const StatisticsDashboard = () => {
  const [timeRange, setTimeRange] = useState('year');
  const [consultationData, setConsultationData] = useState(mockConsultationsData);
  
  // Filtrar datos basados en el rango temporal seleccionado
  useEffect(() => {
    if (timeRange === 'year') {
      setConsultationData(mockConsultationsData);
    } else if (timeRange === '6months') {
      setConsultationData(mockConsultationsData.slice(-6));
    } else if (timeRange === '3months') {
      setConsultationData(mockConsultationsData.slice(-3));
    }
  }, [timeRange]);

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Panel de Estadísticas</h1>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Pacientes</p>
              <p className="text-2xl font-bold text-gray-800">{mockPatientData.total}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-green-500 font-medium">+{mockPatientData.newThisMonth} nuevos</span>
            <span className="text-gray-500 ml-1">este mes</span>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pacientes Activos</p>
              <p className="text-2xl font-bold text-gray-800">{mockPatientData.active}</p>
            </div>
            <div className="p-3 rounded-full bg-green-100">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-gray-500">{Math.round((mockPatientData.active/mockPatientData.total)*100)}% del total</span>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Dados de Alta</p>
              <p className="text-2xl font-bold text-gray-800">{mockPatientData.discharged}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100">
              <UserMinus className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-gray-500">{Math.round((mockPatientData.discharged/mockPatientData.total)*100)}% del total</span>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Tasa de Éxito</p>
              <p className="text-2xl font-bold text-gray-800">{mockPatientData.successRate}%</p>
            </div>
            <div className="p-3 rounded-full bg-purple-100">
              <Percent className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-500 font-medium">{mockPatientData.growthRate}%</span>
            <span className="text-gray-500 ml-1">vs mes anterior</span>
          </div>
        </div>
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Consultas completadas Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-800">Consultas Completadas</h2>
            <div className="flex items-center space-x-2">
              <select 
                className="p-1 text-sm border rounded-md"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
              >
                <option value="year">Último año</option>
                <option value="6months">Últimos 6 meses</option>
                <option value="3months">Últimos 3 meses</option>
              </select>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={consultationData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value} consultas`, '']} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="completed" 
                stroke="#10b981" 
                activeDot={{ r: 8 }} 
                name="Completadas"
              />
              <Line 
                type="monotone" 
                dataKey="scheduled" 
                stroke="#94a3b8" 
                strokeDasharray="5 5" 
                name="Programadas" 
              />
            </LineChart>
          </ResponsiveContainer>
          
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-sm text-gray-500">Consultas este mes</p>
              <p className="text-xl font-bold text-gray-800">
                {consultationData[consultationData.length - 1]?.completed || 0}
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-sm text-gray-500">Tasa de asistencia</p>
              <p className="text-xl font-bold text-gray-800">
                {Math.round((consultationData[consultationData.length - 1]?.completed / 
                  consultationData[consultationData.length - 1]?.scheduled) * 100) || 0}%
              </p>
            </div>
          </div>
        </div>
        
        {/* Estado de pacientes Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Estado de Pacientes</h2>
          
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie
                data={mockPatientStatusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {mockPatientStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} pacientes`, '']} />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="mt-4 flex justify-center">
            {mockPatientStatusData.map((entry) => (
              <div key={entry.name} className="flex items-center mr-4">
                <div 
                  className="w-3 h-3 mr-1 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs text-gray-600">{entry.name}: {entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Additional KPIs Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Progreso Mensual</h3>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={consultationData.slice(-6)} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <Tooltip formatter={(value) => [`${value} consultas`, '']} />
              <Bar dataKey="completed" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-medium text-gray-800 mb-2">Consultas Próximas</h3>
          <div className="space-y-3">
            <div className="flex items-center p-2 bg-blue-50 rounded-md">
              <Calendar className="w-5 h-5 text-blue-500 mr-2" />
              <div>
                <p className="text-sm font-medium">Hoy - 15:30</p>
                <p className="text-xs text-gray-500">Ana Rodríguez</p>
              </div>
            </div>
            <div className="flex items-center p-2 bg-blue-50 rounded-md">
              <Calendar className="w-5 h-5 text-blue-500 mr-2" />
              <div>
                <p className="text-sm font-medium">Mañana - 10:00</p>
                <p className="text-xs text-gray-500">Miguel Díaz</p>
              </div>
            </div>
            <div className="flex items-center p-2 bg-blue-50 rounded-md">
              <Calendar className="w-5 h-5 text-blue-500 mr-2" />
              <div>
                <p className="text-sm font-medium">Mañana - 16:15</p>
                <p className="text-xs text-gray-500">Laura Sánchez</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-medium text-gray-800 mb-2">Objetivos Conseguidos</h3>
          <div className="space-y-3">
            <div className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">Consultas completadas</span>
                <span>75%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>
            <div className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">Clientes satisfechos</span>
                <span>92%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '92%' }}></div>
              </div>
            </div>
            <div className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">Objetivos nutricionales</span>
                <span>68%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '68%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsDashboard;