'use client'

import React, { useState } from 'react';
import jsPDF from 'jspdf';
import { Meal } from '../meals';
import { Patient, Consultation } from '@/app/service/firebase';
import { Printer } from 'lucide-react';
import moment from 'moment';

interface PrintNutritionPlanProps {
  patient: Patient | null;
  consultation: Consultation | null;
  meals: Meal[];
  totalNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  notes: string;
  nutritionistName?: string;
  nutritionistId?: string;
}

const PrintNutritionPlan: React.FC<PrintNutritionPlanProps> = ({
  patient,
  consultation,
  meals,
  totalNutrition,
  notes,
  nutritionistName = "Nutricionista",
  nutritionistId = ""
}) => {
  const [loading, setLoading] = useState(false);

  // Calcular BMR del paciente
  const calculateBMR = () => {
    if (!patient) return null;

    const age = patient.birthDate ? moment().diff(moment(patient.birthDate, 'YYYY-MM-DD'), 'years') : 30;
    const weight = patient.currentWeight || 70;
    const height = patient.height || 170;
    const gender = patient.gender || 'male';

    // Harris-Benedict Equation
    if (gender === 'male') {
      return Math.round(88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age));
    } else {
      return Math.round(447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age));
    }
  };

  const generatePDF = () => {
    setLoading(true);
    try {
      // Inicializar PDF en formato A4
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Configuraciones básicas
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);
      
      let currentPage = 1;
      let yPos = 0;
      
      // Función para agregar encabezado a cada página
      const addHeader = () => {
        // Rectángulo de cabecera
        doc.setFillColor(240, 240, 240);
        doc.rect(0, 0, pageWidth, 30, 'F');
        
        // Título
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(50, 50, 50);
        doc.text("PLAN NUTRICIONAL", margin, 20);
        
        // Fecha
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Fecha: ${consultation?.date ? moment(consultation.date).format('DD/MM/YYYY') : moment().format('DD/MM/YYYY')}`, pageWidth - margin - 45, 20);
        
        // Actualizar posición inicial después del encabezado
        yPos = 40;
      };
      
      // Función para agregar pie de página a cada página
      const addFooter = () => {
        // Rectángulo de pie de página
        doc.setFillColor(240, 240, 240);
        doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`${nutritionistName} - ${nutritionistId}`, margin, pageHeight - 6);
        doc.text(`Página ${currentPage}`, pageWidth - margin - 15, pageHeight - 6);
      };
      
      // Función para verificar espacio disponible y crear nueva página si es necesario
      const checkAndAddNewPage = (requiredSpace) => {
        if (yPos + requiredSpace > pageHeight - 20) {
          addFooter();
          doc.addPage();
          currentPage++;
          addHeader();
          return true;
        }
        return false;
      };
      
      // Iniciar primera página
      addHeader();
      
      // ----- SECCIÓN: INFORMACIÓN DEL PACIENTE -----
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(50, 50, 50);
      doc.text("Información del Paciente", margin, yPos);
      yPos += 8;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      
      if (patient) {
        // Preparar información del paciente
        const infoTexts = [
          `Nombre: ${patient.name || 'No especificado'}`,
          `Sexo: ${patient.gender === 'male' ? 'Masculino' : 'Femenino'}`,
          patient.birthDate ? `Edad: ${moment().diff(moment(patient.birthDate, 'YYYY-MM-DD'), 'years')} años` : '',
          patient.height ? `Altura: ${patient.height} cm` : '',
          patient.currentWeight ? `Peso: ${patient.currentWeight} kg` : '',
          patient.currentWeight && patient.height ? 
            `IMC: ${(patient.currentWeight / Math.pow(patient.height / 100, 2)).toFixed(1)} kg/m²` : '',
        ].filter(text => text !== '');
        
        // Crear dos columnas para la info
        const midPoint = Math.ceil(infoTexts.length / 2);
        
        // Calcular altura necesaria
        const infoHeight = Math.ceil(infoTexts.length / 2) * 7;
        
        if (checkAndAddNewPage(infoHeight)) {
          doc.setFont("helvetica", "bold");
          doc.text("Información del Paciente", margin, yPos);
          yPos += 8;
          doc.setFont("helvetica", "normal");
        }
        
        // Primera columna
        infoTexts.slice(0, midPoint).forEach((text, i) => {
          doc.text(text, margin, yPos + (i * 7));
        });
        
        // Segunda columna
        infoTexts.slice(midPoint).forEach((text, i) => {
          doc.text(text, margin + contentWidth/2, yPos + (i * 7));
        });
        
        // Actualizar posición Y
        yPos += infoHeight;
      } else {
        doc.text("No hay información del paciente", margin, yPos);
        yPos += 7;
      }
      
      // Añadir espacio después de la información del paciente
      yPos += 10;
      
      // ----- SECCIÓN: RESUMEN NUTRICIONAL -----
      if (checkAndAddNewPage(40)) {
        // Si se agregó nueva página, repetir título
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
      }
      
      // Fondo para el resumen nutricional
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, yPos, contentWidth, 35, 'F');
      
      // Título del resumen
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Resumen Nutricional", margin + 5, yPos + 7);
      
      // Datos nutricionales
      const bmr = calculateBMR();
      const macroX = margin + 5;
      const macroY = yPos + 15;
      const macroSpacing = contentWidth / 4;
      
      // Calorías
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Calorías", macroX, macroY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(14);
      doc.text(`${Math.round(totalNutrition.calories)} kcal`, macroX, macroY + 7);
      
      // Proteínas
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Proteínas", macroX + macroSpacing, macroY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.text(`${Math.round(totalNutrition.protein)}g`, macroX + macroSpacing, macroY + 7);
      doc.setFontSize(8);
      if (totalNutrition.calories > 0) {
        const proteinPercent = Math.round((totalNutrition.protein * 4) / totalNutrition.calories * 100);
        doc.text(`${proteinPercent}%`, macroX + macroSpacing, macroY + 12);
      }
      
      // Carbohidratos
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Carbohidratos", macroX + macroSpacing * 2, macroY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.text(`${Math.round(totalNutrition.carbs)}g`, macroX + macroSpacing * 2, macroY + 7);
      doc.setFontSize(8);
      if (totalNutrition.calories > 0) {
        const carbsPercent = Math.round((totalNutrition.carbs * 4) / totalNutrition.calories * 100);
        doc.text(`${carbsPercent}%`, macroX + macroSpacing * 2, macroY + 12);
      }
      
      // Grasas
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Grasas", macroX + macroSpacing * 3, macroY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.text(`${Math.round(totalNutrition.fat)}g`, macroX + macroSpacing * 3, macroY + 7);
      doc.setFontSize(8);
      if (totalNutrition.calories > 0) {
        const fatPercent = Math.round((totalNutrition.fat * 9) / totalNutrition.calories * 100);
        doc.text(`${fatPercent}%`, macroX + macroSpacing * 3, macroY + 12);
      }
      
      // BMR si está disponible
      if (bmr) {
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`Metabolismo basal estimado: ${bmr} kcal/día`, macroX, macroY + 25);
      }
      
      // Actualizar posición Y
      yPos += 45;
      
      // ----- SECCIÓN: PLAN ALIMENTICIO -----
      if (checkAndAddNewPage(15)) {
        // Si se agregó nueva página, repetir título
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
      }
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(50, 50, 50);
      doc.text("Plan Alimenticio", margin, yPos);
      yPos += 10;
      
      // Procesar cada comida
      meals.forEach((meal, index) => {
        const selectedOption = meal.options.find(opt => opt.isSelectedForSummary) || meal.options[0];
        if (!selectedOption) return;
        
        // Estimar altura necesaria para esta comida
        const contentLines = doc.splitTextToSize(selectedOption.content || "", contentWidth).length;
        const instructionsLines = selectedOption.instructions ? 
          doc.splitTextToSize(selectedOption.instructions, contentWidth).length : 0;
        const ingredientsRows = selectedOption.ingredients?.length || 0;
        
        // Altura estimada: encabezado + contenido + tabla + instrucciones + espacio entre comidas
        const estimatedHeight = 10 + (contentLines * 5) + (ingredientsRows * 8 + 15) + (instructionsLines * 5 + 10) + 10;
        
        // Verificar si hay espacio suficiente
        if (checkAndAddNewPage(estimatedHeight)) {
          // Si se agregó nueva página, indicarlo
          doc.setFont("helvetica", "bold");
          doc.setFontSize(11);
          doc.text(`Continuación: Plan Alimenticio`, margin, yPos);
          yPos += 8;
        }
        
        // Encabezado de la comida con fondo
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, yPos - 5, contentWidth, 10, 'F');
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text(`${meal.name} - ${meal.time}`, margin + 3, yPos);
        yPos += 10;
        
        // Contenido/descripción de la comida
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        
        if (selectedOption.content) {
          const contentLines = doc.splitTextToSize(selectedOption.content, contentWidth);
          contentLines.forEach(line => {
            doc.text(line, margin, yPos);
            yPos += 5;
          });
          yPos += 5;
        }
        
        // Tabla de ingredientes
        if (selectedOption.ingredients && selectedOption.ingredients.length > 0) {
          // Verificar espacio para la tabla
          const tableHeight = selectedOption.ingredients.length * 8 + 15;
          if (checkAndAddNewPage(tableHeight)) {
            doc.setFont("helvetica", "bold");
            doc.text(`Ingredientes para ${meal.name}:`, margin, yPos);
            yPos += 8;
          }
          
          // Configuración de tabla
          const colWidths = [
            contentWidth * 0.5,   // Nombre
            contentWidth * 0.25,  // Cantidad
            contentWidth * 0.25   // Calorías
          ];
          
          // Encabezado de tabla
          doc.setFillColor(230, 230, 230);
          doc.rect(margin, yPos, contentWidth, 8, 'F');
          
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.text("Alimento", margin + 3, yPos + 5);
          doc.text("Cantidad", margin + colWidths[0] + 3, yPos + 5);
          doc.text("Calorías", margin + colWidths[0] + colWidths[1] + 3, yPos + 5);
          yPos += 8;
          
          // Dibujar filas de ingredientes
          let totalCals = 0;
          
          selectedOption.ingredients.forEach((ing, i) => {
            // Alternar colores de fondo
            if (i % 2 === 0) {
              doc.setFillColor(245, 245, 245);
              doc.rect(margin, yPos, contentWidth, 8, 'F');
            }
            
            // Texto de ingrediente
            doc.setFont("helvetica", "normal");
            doc.text(ing.name, margin + 3, yPos + 5);
            doc.text(`${ing.quantity}g`, margin + colWidths[0] + 3, yPos + 5);
            doc.text(`${ing.calories || 0} kcal`, margin + colWidths[0] + colWidths[1] + 3, yPos + 5);
            
            totalCals += (ing.calories || 0);
            yPos += 8;
          });
          
          // Fila de total
          doc.setFillColor(230, 230, 230);
          doc.rect(margin, yPos, contentWidth, 8, 'F');
          
          doc.setFont("helvetica", "bold");
          doc.text("Total", margin + 3, yPos + 5);
          doc.text(`${totalCals} kcal`, margin + colWidths[0] + colWidths[1] + 3, yPos + 5);
          yPos += 13;
        }
        
        // Instrucciones
        if (selectedOption.instructions) {
          const instructionsLines = doc.splitTextToSize(selectedOption.instructions, contentWidth);
          const instructionsHeight = instructionsLines.length * 5 + 10;
          
          // Verificar espacio
          if (checkAndAddNewPage(instructionsHeight)) {
            doc.setFont("helvetica", "bold");
            doc.text(`Instrucciones para ${meal.name}:`, margin, yPos);
            yPos += 7;
          } else {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.text("Instrucciones:", margin, yPos);
            yPos += 7;
          }
          
          // Texto de instrucciones
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          
          instructionsLines.forEach(line => {
            doc.text(line, margin, yPos);
            yPos += 5;
          });
          yPos += 3;
        }
        
        // Espacio entre comidas
        yPos += 10;
      });
      
      // ----- SECCIÓN: NOTAS ADICIONALES -----
      if (notes && notes.trim() !== '') {
        // Calcular espacio necesario
        const notesLines = doc.splitTextToSize(notes, contentWidth);
        const notesHeight = notesLines.length * 5 + 15;
        
        // Verificar espacio
        if (checkAndAddNewPage(notesHeight)) {
          // Si se agregó nueva página, repetir título de sección
          doc.setFont("helvetica", "bold");
          doc.setFontSize(12);
        }
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("Notas Adicionales", margin, yPos);
        yPos += 8;
        
        // Recuadro para notas
        doc.setFillColor(250, 250, 250);
        doc.setDrawColor(220, 220, 220);
        doc.rect(margin, yPos - 3, contentWidth, notesLines.length * 5 + 6, 'FD');
        
        // Texto de las notas
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        
        notesLines.forEach(line => {
          doc.text(line, margin + 3, yPos);
          yPos += 5;
        });
      }
      
      // Agregar pie de página a la última página
      addFooter();
      
      // Guardar PDF
      doc.save(`PlanNutricional_${patient?.name || 'Paciente'}_${moment().format('DDMMYYYY')}.pdf`);
      
    } catch (error) {
      console.error("Error generando el PDF:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={generatePDF}
      className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors"
      disabled={loading}
    >
      <Printer size={16} />
      {loading ? "Generando documento..." : "Imprimir Plan Nutricional"}
    </button>
  );
};

export default PrintNutritionPlan;