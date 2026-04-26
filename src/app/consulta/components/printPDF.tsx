'use client'

import React, { useState } from 'react';
import jsPDF from 'jspdf';
import { Meal } from '@/app/consulta/components/meals';
import { Patient } from '@/app/shared/interfaces';
import { Consultation } from '@/app/shared/interfaces';
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
  nutritionistAvatarUrl?: string;
  nutritionistLogoUrl?: string;
  nutritionistSignatureUrl?: string;
  nutritionistSpecialization?: string;
  nutritionistPhone?: string;
  nutritionistEmail?: string;
}

// Emerald palette
const COLORS = {
  primary: [16, 185, 129] as [number, number, number],       // emerald-500
  primaryDark: [5, 150, 105] as [number, number, number],    // emerald-600
  primaryLight: [209, 250, 229] as [number, number, number], // emerald-100
  primaryBg: [236, 253, 245] as [number, number, number],    // emerald-50
  text: [17, 24, 39] as [number, number, number],            // gray-900
  textMuted: [107, 114, 128] as [number, number, number],    // gray-500
  textLight: [156, 163, 175] as [number, number, number],    // gray-400
  border: [229, 231, 235] as [number, number, number],       // gray-200
  bgLight: [249, 250, 251] as [number, number, number],      // gray-50
  bgMedium: [243, 244, 246] as [number, number, number],     // gray-100
  white: [255, 255, 255] as [number, number, number],
  protein: [59, 130, 246] as [number, number, number],       // blue-500
  carbs: [245, 158, 11] as [number, number, number],         // amber-500
  fat: [239, 68, 68] as [number, number, number],            // red-500
};

const PrintNutritionPlan: React.FC<PrintNutritionPlanProps> = ({
  patient,
  consultation,
  meals,
  totalNutrition,
  notes,
  nutritionistName = "Nutricionista",
  nutritionistId = "",
  nutritionistAvatarUrl,
  nutritionistLogoUrl,
  nutritionistSignatureUrl,
  nutritionistSpecialization,
  nutritionistPhone,
  nutritionistEmail
}) => {
  const [loading, setLoading] = useState(false);

  // Helper to load an image URL as base64 data URL
  const loadImage = (url: string): Promise<string | null> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  };

  const generatePDF = async () => {
    setLoading(true);
    try {
      // Preload images
      const [logoData, avatarData, signatureData] = await Promise.all([
        nutritionistLogoUrl ? loadImage(nutritionistLogoUrl) : Promise.resolve(null),
        nutritionistAvatarUrl ? loadImage(nutritionistAvatarUrl) : Promise.resolve(null),
        nutritionistSignatureUrl ? loadImage(nutritionistSignatureUrl) : Promise.resolve(null),
      ]);

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 18;
      const contentWidth = pageWidth - margin * 2;
      let currentPage = 1;
      let yPos = 0;

      // ── Helpers ──
      const setColor = (c: [number, number, number]) => doc.setTextColor(c[0], c[1], c[2]);
      const setFill = (c: [number, number, number]) => doc.setFillColor(c[0], c[1], c[2]);
      const setDraw = (c: [number, number, number]) => doc.setDrawColor(c[0], c[1], c[2]);

      const drawLine = (x1: number, y1: number, x2: number, y2: number, color = COLORS.border) => {
        setDraw(color);
        doc.setLineWidth(0.3);
        doc.line(x1, y1, x2, y2);
      };

      const drawRoundedRect = (x: number, y: number, w: number, h: number, r: number, style: 'F' | 'S' | 'FD' = 'F') => {
        doc.roundedRect(x, y, w, h, r, r, style);
      };

      const drawProgressBar = (x: number, y: number, w: number, h: number, percent: number, color: [number, number, number]) => {
        setFill(COLORS.bgMedium);
        drawRoundedRect(x, y, w, h, h / 2, 'F');
        if (percent > 0) {
          setFill(color);
          const fillW = Math.min(w * (percent / 100), w);
          drawRoundedRect(x, y, fillW, h, h / 2, 'F');
        }
      };

      // ── Header ──
      const addHeader = () => {
        // Top emerald bar
        setFill(COLORS.primary);
        doc.rect(0, 0, pageWidth, 3, 'F');

        yPos = 10;

        // Logo on the left if available
        let titleX = margin;
        if (logoData) {
          try {
            doc.addImage(logoData, 'PNG', margin, yPos - 3, 12, 12);
            titleX = margin + 15;
          } catch { /* skip logo */ }
        }

        // Title
        yPos += 6;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        setColor(COLORS.text);
        doc.text("Plan Nutricional", titleX, yPos);

        // Nutritionist name + specialization on the right
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        setColor(COLORS.textMuted);
        const rightX = pageWidth - margin;
        doc.text(nutritionistName, rightX, yPos - 4, { align: 'right' });
        if (nutritionistSpecialization) {
          doc.setFontSize(7);
          doc.text(nutritionistSpecialization, rightX, yPos, { align: 'right' });
        }

        // Date
        const dateStr = consultation?.date
          ? moment(consultation.date).format('DD MMM YYYY')
          : moment().format('DD MMM YYYY');
        doc.setFontSize(7);
        setColor(COLORS.textLight);
        doc.text(dateStr, rightX, yPos + 4, { align: 'right' });

        // Divider
        yPos += 7;
        drawLine(margin, yPos, pageWidth - margin, yPos, COLORS.primary);
        yPos += 8;
      };

      // ── Footer ──
      const addFooter = () => {
        const footerY = pageHeight - 12;
        drawLine(margin, footerY - 3, pageWidth - margin, footerY - 3);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        setColor(COLORS.textLight);
        const footerParts = [nutritionistName];
        if (nutritionistId) footerParts.push(nutritionistId);
        if (nutritionistPhone) footerParts.push(nutritionistPhone);
        if (nutritionistEmail) footerParts.push(nutritionistEmail);
        doc.text(footerParts.join('  ·  '), margin, footerY);
        doc.text(`${currentPage}`, pageWidth - margin, footerY, { align: 'right' });
      };

      const checkNewPage = (requiredSpace: number): boolean => {
        if (yPos + requiredSpace > pageHeight - 18) {
          addFooter();
          doc.addPage();
          currentPage++;
          addHeader();
          return true;
        }
        return false;
      };

      // ─── PAGE 1 ───
      addHeader();

      // ── Patient Info Card ──
      if (patient) {
        checkNewPage(38);

        // Section label
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        setColor(COLORS.primary);
        doc.text("PACIENTE", margin, yPos);
        yPos += 5;

        // Patient name
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        setColor(COLORS.text);
        doc.text(patient.name || 'Sin nombre', margin, yPos);
        yPos += 7;

        // Info chips
        const age = patient.birthDate ? moment().diff(moment(patient.birthDate, 'YYYY-MM-DD'), 'years') : null;
        const bmi = patient.currentWeight && patient.height
          ? (patient.currentWeight / Math.pow(patient.height / 100, 2)).toFixed(1)
          : null;

        const chips: string[] = [];
        if (patient.gender) chips.push(patient.gender === 'male' ? '♂ Masculino' : '♀ Femenino');
        if (age !== null) chips.push(`${age} años`);
        if (patient.height) chips.push(`${patient.height} cm`);
        if (patient.currentWeight) chips.push(`${patient.currentWeight} kg`);
        if (bmi) chips.push(`IMC ${bmi}`);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        setColor(COLORS.textMuted);

        let chipX = margin;
        chips.forEach((chip, i) => {
          const sep = i > 0 ? '  ·  ' : '';
          const text = sep + chip;
          doc.text(text, chipX, yPos);
          chipX += doc.getTextWidth(text);
        });

        yPos += 10;
        drawLine(margin, yPos, pageWidth - margin, yPos);
        yPos += 8;
      }

      // ── Macro Summary ──
      checkNewPage(48);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      setColor(COLORS.primary);
      doc.text("RESUMEN NUTRICIONAL", margin, yPos);
      yPos += 7;

      // Calorie card
      setFill(COLORS.primaryBg);
      setDraw(COLORS.primaryLight);
      doc.setLineWidth(0.4);
      drawRoundedRect(margin, yPos, contentWidth, 18, 2, 'FD');

      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      setColor(COLORS.primaryDark);
      doc.text(`${Math.round(totalNutrition.calories)}`, margin + 6, yPos + 12);

      const kcalLabelX = margin + 6 + doc.getTextWidth(`${Math.round(totalNutrition.calories)}`) + 2;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      setColor(COLORS.textMuted);
      doc.text('kcal / día', kcalLabelX, yPos + 12);

      yPos += 24;

      // Macro bars
      const macros = [
        { label: 'Proteínas', value: totalNutrition.protein, multiplier: 4, unit: 'g', color: COLORS.protein },
        { label: 'Carbohidratos', value: totalNutrition.carbs, multiplier: 4, unit: 'g', color: COLORS.carbs },
        { label: 'Grasas', value: totalNutrition.fat, multiplier: 9, unit: 'g', color: COLORS.fat },
      ];

      const totalCalFromMacros = macros.reduce((sum, m) => sum + m.value * m.multiplier, 0);

      macros.forEach((macro) => {
        checkNewPage(14);

        const percent = totalCalFromMacros > 0 ? Math.round((macro.value * macro.multiplier) / totalCalFromMacros * 100) : 0;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        setColor(COLORS.textMuted);
        doc.text(macro.label, margin, yPos);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        setColor(COLORS.text);
        const valueStr = `${Math.round(macro.value)}${macro.unit}  (${percent}%)`;
        doc.text(valueStr, pageWidth - margin, yPos, { align: 'right' });

        yPos += 3;
        drawProgressBar(margin, yPos, contentWidth, 2.5, percent, macro.color);
        yPos += 7;
      });

      yPos += 4;
      drawLine(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;

      // ── Meals ──
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      setColor(COLORS.primary);
      doc.text("PLAN ALIMENTICIO", margin, yPos);
      yPos += 7;

      meals.forEach((meal) => {
        if (!meal.options || meal.options.length === 0) return;

        // Meal header bar
        checkNewPage(20);
        setFill(COLORS.primaryBg);
        drawRoundedRect(margin, yPos, contentWidth, 9, 1.5, 'F');

        // Emerald dot
        setFill(COLORS.primary);
        doc.circle(margin + 4, yPos + 4.5, 1.5, 'F');

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        setColor(COLORS.text);
        doc.text(meal.name, margin + 8, yPos + 6);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        setColor(COLORS.textMuted);
        doc.text(meal.time, pageWidth - margin - 2, yPos + 6, { align: 'right' });

        yPos += 13;

        // Iterate over ALL options
        meal.options.forEach((option, optIdx) => {
          // Option label if there are multiple options
          if (meal.options.length > 1) {
            checkNewPage(10);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8);
            setColor(COLORS.primaryDark);
            doc.text(`Opción ${optIdx + 1}${option.name ? ': ' + option.name : ''}`, margin + 2, yPos);
            yPos += 5;
          }

          const contentLines = option.content ? doc.splitTextToSize(option.content, contentWidth - 6) : [];
          const instructionLines = option.instructions ? doc.splitTextToSize(option.instructions, contentWidth - 10) : [];

          // Description
          if (contentLines.length > 0) {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            setColor(COLORS.text);
            contentLines.forEach((line: string) => {
              checkNewPage(6);
              doc.text(line, margin + 2, yPos);
              yPos += 4;
            });
            yPos += 2;
          }

          // Ingredients table
          if (option.ingredients && option.ingredients.length > 0) {
            const colAlimento = margin;
            const colCantidad = margin + contentWidth * 0.38;
            const colKcal = margin + contentWidth * 0.54;
            const colProt = margin + contentWidth * 0.67;
            const colCarbs = margin + contentWidth * 0.78;
            const colFat = margin + contentWidth * 0.89;

            checkNewPage(10);

            // Table header
            doc.setFont("helvetica", "bold");
            doc.setFontSize(7);
            setColor(COLORS.textMuted);
            doc.text("ALIMENTO", colAlimento + 2, yPos);
            doc.text("CANT.", colCantidad, yPos);
            doc.text("KCAL", colKcal, yPos);
            doc.text("PROT", colProt, yPos);
            doc.text("CARB", colCarbs, yPos);
            doc.text("GRASA", colFat, yPos);

            yPos += 2;
            drawLine(margin, yPos, pageWidth - margin, yPos, COLORS.bgMedium);
            yPos += 3;

            let totalKcal = 0, totalProt = 0, totalCarb = 0, totalFatVal = 0;

            option.ingredients.forEach((ing, i) => {
              checkNewPage(7);

              if (i % 2 === 0) {
                setFill(COLORS.bgLight);
                doc.rect(margin, yPos - 3.5, contentWidth, 6, 'F');
              }

              doc.setFont("helvetica", "normal");
              doc.setFontSize(8);
              setColor(COLORS.text);

              const nameText = ing.name.length > 28 ? ing.name.substring(0, 26) + '…' : ing.name;
              doc.text(nameText, colAlimento + 2, yPos);
              setColor(COLORS.textMuted);
              doc.text(`${ing.quantity}g`, colCantidad, yPos);
              doc.text(`${ing.calories || 0}`, colKcal, yPos);
              doc.text(`${Math.round(ing.protein || 0)}`, colProt, yPos);
              doc.text(`${Math.round(ing.carbs || 0)}`, colCarbs, yPos);
              doc.text(`${Math.round(ing.fat || 0)}`, colFat, yPos);

              totalKcal += (ing.calories || 0);
              totalProt += (ing.protein || 0);
              totalCarb += (ing.carbs || 0);
              totalFatVal += (ing.fat || 0);
              yPos += 6;
            });

            // Total row
            drawLine(margin, yPos - 2, pageWidth - margin, yPos - 2, COLORS.bgMedium);
            yPos += 1;
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8);
            setColor(COLORS.text);
            doc.text("Total", colAlimento + 2, yPos);
            doc.text(`${totalKcal}`, colKcal, yPos);
            doc.text(`${Math.round(totalProt)}`, colProt, yPos);
            doc.text(`${Math.round(totalCarb)}`, colCarbs, yPos);
            doc.text(`${Math.round(totalFatVal)}`, colFat, yPos);
            yPos += 5;
          }

          // Instructions
          if (instructionLines.length > 0) {
            checkNewPage(instructionLines.length * 4 + 8);

            setFill(COLORS.bgLight);
            const instBoxH = instructionLines.length * 4 + 5;
            drawRoundedRect(margin + 2, yPos, contentWidth - 4, instBoxH, 1.5, 'F');

            doc.setFont("helvetica", "italic");
            doc.setFontSize(8);
            setColor(COLORS.textMuted);
            let instY = yPos + 4;
            instructionLines.forEach((line: string) => {
              doc.text(line, margin + 5, instY);
              instY += 4;
            });
            yPos += instBoxH + 3;
          }

          // Separator between options
          if (meal.options.length > 1 && optIdx < meal.options.length - 1) {
            yPos += 2;
            drawLine(margin + 4, yPos, pageWidth - margin - 4, yPos, COLORS.bgMedium);
            yPos += 4;
          }
        });

        yPos += 6;
      });

      // ── Notes ──
      if (notes && notes.trim() !== '') {
        const notesLines = doc.splitTextToSize(notes, contentWidth - 8);
        checkNewPage(notesLines.length * 4.5 + 18);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        setColor(COLORS.primary);
        doc.text("NOTAS", margin, yPos);
        yPos += 5;

        setFill(COLORS.bgLight);
        setDraw(COLORS.border);
        doc.setLineWidth(0.3);
        const notesBoxH = notesLines.length * 4.5 + 6;
        drawRoundedRect(margin, yPos, contentWidth, notesBoxH, 2, 'FD');

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        setColor(COLORS.text);
        let noteY = yPos + 5;
        notesLines.forEach((line: string) => {
          doc.text(line, margin + 4, noteY);
          noteY += 4.5;
        });

        yPos += notesBoxH + 5;
      }

      // ── Firma del nutricionista ──
      checkNewPage(50);
      yPos += 5;
      drawLine(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;

      // Signature block centered
      const sigCenterX = pageWidth / 2;

      if (signatureData) {
        try {
          doc.addImage(signatureData, 'PNG', sigCenterX - 20, yPos, 40, 15);
          yPos += 18;
        } catch { /* skip signature */ }
      } else {
        yPos += 10;
      }

      // Line for signature
      drawLine(sigCenterX - 30, yPos, sigCenterX + 30, yPos, COLORS.textMuted);
      yPos += 4;

      // Nutritionist name
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      setColor(COLORS.text);
      doc.text(nutritionistName, sigCenterX, yPos, { align: 'center' });
      yPos += 4;

      // Specialization
      if (nutritionistSpecialization) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        setColor(COLORS.textMuted);
        doc.text(nutritionistSpecialization, sigCenterX, yPos, { align: 'center' });
        yPos += 4;
      }

      // Professional ID
      if (nutritionistId) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        setColor(COLORS.textLight);
        doc.text(`Cédula: ${nutritionistId}`, sigCenterX, yPos, { align: 'center' });
      }

      // Final footer
      addFooter();

      // Save
      const safeName = (patient?.name || 'Paciente').replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ ]/g, '').trim();
      doc.save(`Plan_${safeName}_${moment().format('DD-MM-YYYY')}.pdf`);

    } catch (error) {
      console.error("Error generando el PDF:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={generatePDF}
      className="flex items-center justify-center gap-1.5 px-3 py-1 bg-gray-800 text-white rounded-sm text-[11px] hover:bg-gray-700 transition-colors"
      disabled={loading}
    >
      <Printer size={13} />
      {loading ? "Generando..." : "Imprimir Plan"}
    </button>
  );
};

export default PrintNutritionPlan;