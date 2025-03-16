'use client'

import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface EvolucionProps {
  patient: {
    id: string;
    name: string;
    height: number;
    currentWeight?: number;
  };
  weightHistory: { date: string; weight: number }[];
  initialWeightGoal?: number;
  onWeightGoalChange?: (newGoal: number) => void;
}

const Evolucion: React.FC<EvolucionProps> = ({
  patient,
  weightHistory,
  initialWeightGoal = 0,
  onWeightGoalChange
}) => {
  const [weightGoal, setWeightGoal] = useState(initialWeightGoal);
  const [isEditingGoal, setIsEditingGoal] = useState(false);

  // Determinar si hay suficientes datos para mostrar
  const hasWeightData = weightHistory.length > 0;
  const hasMultipleWeightData = weightHistory.length > 1;

  // Obtener el peso actual (último registro) y el peso inicial
  const initialWeight = hasWeightData ? weightHistory[0].weight : null;
  const currentWeight = hasWeightData 
    ? weightHistory[weightHistory.length - 1].weight 
    : patient.currentWeight || null;

  // Calcular el cambio desde el peso inicial (solo si tenemos ambos datos)
  const weightChange = (initialWeight !== null && currentWeight !== null) 
    ? currentWeight - initialWeight
    : 0;

  // Calcular BMI si hay altura y peso actual
  const calculateBMI = () => {
    if (!patient.height || !currentWeight) return null;
    const heightInMeters = patient.height / 100;
    return currentWeight / (heightInMeters * heightInMeters);
  };

  const bmi = calculateBMI();
  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { category: "Bajo peso", color: "text-blue-600" };
    if (bmi < 25) return { category: "Normal", color: "text-green-600" };
    if (bmi < 30) return { category: "Sobrepeso", color: "text-yellow-600" };
    if (bmi < 35) return { category: "Obesidad grado 1", color: "text-orange-600" };
    if (bmi < 40) return { category: "Obesidad grado 2", color: "text-red-600" };
    return { category: "Obesidad grado 3", color: "text-red-800" };
  };

  const bmiCategory = bmi ? getBMICategory(bmi) : null;

  // Calcular peso ideal basado en IMC ideal (rango entre 18.5 y 24.9)
  const calculateIdealWeight = () => {
    if (!patient.height) return null;
    
    const heightInMeters = patient.height / 100;
    const minIdealWeight = 18.5 * (heightInMeters * heightInMeters);
    const maxIdealWeight = 24.9 * (heightInMeters * heightInMeters);
    
    return {
      min: Math.round(minIdealWeight * 10) / 10,
      max: Math.round(maxIdealWeight * 10) / 10
    };
  };

  const idealWeight = calculateIdealWeight();

  // Preparar datos para la gráfica
  const chartData = {
    labels: hasWeightData ? weightHistory.map((record) =>
      format(parseISO(record.date), "d MMM", { locale: es })
    ) : [],
    datasets: [
      {
        label: 'Peso (kg)',
        data: hasWeightData ? weightHistory.map((record) => record.weight) : [],
        borderColor: 'rgb(75, 192, 192)',
        fill: true,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
      },
      {
        label: 'Objetivo (kg)',
        data: hasWeightData ? Array(weightHistory.length).fill(weightGoal) : [],
        borderColor: 'rgba(255, 99, 132, 1)',
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: false,
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
  };

  const handleSaveGoal = () => {
    setIsEditingGoal(false);
    if (onWeightGoalChange) {
      onWeightGoalChange(weightGoal);
    }
  };

  return (
    <div className="mt-6 bg-white p-6 border border-gray-300 rounded shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-700">Evolución de peso</h2>
        
        {isEditingGoal ? (
          <div className="flex items-center space-x-2">
            <input
              type="number"
              value={weightGoal}
              onChange={(e) => setWeightGoal(Number(e.target.value))}
              className="w-20 p-1 border border-gray-300 rounded"
              step="0.1"
            />
            <span className="text-sm text-gray-500">kg</span>
            <button
              onClick={handleSaveGoal}
              className="text-xs bg-emerald-600 text-white px-2 py-1 rounded hover:bg-emerald-700"
            >
              Guardar
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditingGoal(true)}
            className="text-sm text-emerald-600 hover:underline"
          >
            Editar objetivo
          </button>
        )}
      </div>

      {/* Gráfico de evolución */}
      <div className="h-64">
        {hasWeightData ? (
          <Line data={chartData} options={chartOptions} />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-50 rounded-md">
            <p className="text-gray-500 text-sm">
              No hay datos de peso disponibles para mostrar la gráfica
            </p>
          </div>
        )}
      </div>

      {/* Resumen de métricas */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Peso inicial vs actual */}
        <div className="bg-gray-50 p-4 rounded-md">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Peso inicial:</span>
              <span> {initialWeight !== null ? `${initialWeight} kg` : 'Sin datos'}</span>
            </div>
            <div>
              <span className="font-medium">Peso actual:</span>
              <span> {currentWeight !== null ? `${currentWeight} kg` : 'Sin datos'}</span>
            </div>
            <div>
              <span className="font-medium">Cambio:</span>
              {initialWeight !== null && currentWeight !== null ? (
                <span className={`${weightChange < 0 ? 'text-green-600' : weightChange > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                  {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg
                </span>
              ) : (
                <span className="text-gray-500">Sin datos</span>
              )}
            </div>
          </div>
        </div>

        {/* Índice de Masa Corporal */}
        <div className="bg-gray-50 p-4 rounded-md">
          <h4 className="text-sm font-medium text-gray-700">IMC (Índice Masa Corporal)</h4>
          {bmi !== null ? (
            <>
              <p className="text-2xl font-bold text-gray-800">{bmi.toFixed(1)}</p>
              <p className={`text-xs ${bmiCategory?.color}`}>
                {bmiCategory?.category}
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-500 italic">
              Se requiere altura y peso actual para calcular
            </p>
          )}
        </div>

        {/* Peso objetivo o peso ideal */}
        <div className="bg-gray-50 p-4 rounded-md">
          <h4 className="text-sm font-medium text-gray-700">Peso objetivo</h4>
          <p className="text-2xl font-bold text-gray-800">{weightGoal} kg</p>
          {idealWeight && (
            <p className="text-xs text-gray-600">
              Peso ideal: {idealWeight.min} - {idealWeight.max} kg
            </p>
          )}
        </div>
        
        {/* Peso perdido y porcentaje - Solo mostrar si hay datos suficientes */}
        {hasMultipleWeightData && initialWeight !== null && currentWeight !== null && initialWeight > currentWeight && (
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="text-sm font-medium text-gray-700">Peso perdido</h4>
            <p className="text-2xl font-bold text-gray-800">
              {(initialWeight - currentWeight).toFixed(1)} kg
            </p>
            <p className="text-xs text-gray-600">
              {(((initialWeight - currentWeight) / initialWeight) * 100).toFixed(1)}% del peso inicial
            </p>
          </div>
        )}
        
        {/* Progreso hacia el objetivo - Solo mostrar si hay datos y objetivo */}
        {currentWeight !== null && weightGoal > 0 && currentWeight > weightGoal && (
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="text-sm font-medium text-gray-700">Progreso hacia objetivo</h4>
            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500" 
                style={{ 
                  width: `${Math.min(100, Math.max(0, ((initialWeight || currentWeight) - currentWeight) / ((initialWeight || currentWeight) - weightGoal) * 100))}%` 
                }}
              ></div>
            </div>
            <p className="mt-1 text-xs text-gray-600">
              {((currentWeight - weightGoal)).toFixed(1)} kg para alcanzar el objetivo
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Evolucion;