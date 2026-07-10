'use client'

import React, { useState, useRef, useEffect } from 'react';
import jsPDF from 'jspdf';
import { Meal, sortMealsByTime } from '@/app/consulta/components/meals';
import { Patient } from '@/app/shared/interfaces';
import { Consultation } from '@/app/shared/interfaces';
import { Printer, ChevronDown, Check } from 'lucide-react';
import moment from 'moment';
import 'moment/locale/pt-br';
import 'moment/locale/es';
import { useTranslation } from '@/app/shared/useTranslation';
import { t as tRaw } from '@/app/shared/i18n';

interface PrintNutritionPlanProps {
  patient: Patient | null;
  consultation: Consultation | null;
  meals: Meal[];
  totalNutrition: { calories: number; protein: number; carbs: number; fat: number };
  notes: string;
  indicaciones?: string;
  measurements?: { waist?: number; hip?: number; neck?: number; tricipital?: number; subescapular?: number; suprailiaco?: number; arm?: number; calf?: number; wrist?: number };
  targetCalories?: number;
  nutritionistName?: string;
  nutritionistId?: string;
  nutritionistAvatarUrl?: string;
  nutritionistLogoUrl?: string;
  nutritionistSignatureUrl?: string;
  nutritionistTextSignature?: string;
  nutritionistUseRealSignature?: boolean;
  nutritionistSignatureFont?: string;
  nutritionistSpecialization?: string;
  nutritionistPhone?: string;
  nutritionistEmail?: string;
  nutritionistWebsite?: string;
  nutritionistAddress?: string;
  nutritionistCredentials?: string;
}

// Paleta cálida — combina con la estética de la app (crema + emerald sutil)
const COLORS = {
  primary: [5, 150, 105] as [number, number, number],
  primaryDark: [4, 120, 87] as [number, number, number],
  primaryBg: [236, 253, 245] as [number, number, number],
  text: [45, 43, 40] as [number, number, number],
  textMuted: [107, 102, 96] as [number, number, number],
  textLight: [168, 162, 158] as [number, number, number],
  border: [232, 229, 222] as [number, number, number],
  bgLight: [250, 249, 247] as [number, number, number],
  bgMedium: [244, 242, 238] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  protein: [239, 68, 68] as [number, number, number],
  carbs: [245, 158, 11] as [number, number, number],
  fat: [59, 130, 246] as [number, number, number],
};

const PrintNutritionPlan: React.FC<PrintNutritionPlanProps> = ({
  patient, consultation, meals, indicaciones, measurements, targetCalories,
  nutritionistName = "Nutricionista", nutritionistId = "",
  nutritionistLogoUrl, nutritionistSignatureUrl, nutritionistTextSignature, nutritionistUseRealSignature,
  nutritionistSignatureFont, nutritionistSpecialization, nutritionistPhone, nutritionistEmail,
  nutritionistWebsite, nutritionistAddress,
}) => {
  const { t, lang } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Carga una URL (imagen o SVG) y la devuelve como PNG dataURL a tamaño fijo.
  const loadImage = (url: string, fixed?: number): Promise<string | null> =>
    new Promise((resolve) => {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const w = fixed || img.width || 64;
        const h = fixed || img.height || 64;
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) { ctx.drawImage(img, 0, 0, w, h); resolve(canvas.toDataURL('image/png')); }
        else resolve(null);
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });

  const generatePDF = async (withNutrition: boolean) => {
    setLoading(true);
    setMenuOpen(false);
    try {
      // El PDF es para el paciente → todo en SU idioma (no el de la app).
      const patientLang: 'es' | 'pt' = patient?.language === 'pt' ? 'pt' : 'es';
      const t = (key: string) => tRaw(key, patientLang);
      const lang = patientLang;
      moment.locale(lang === 'pt' ? 'pt-br' : 'es');

      const activeMeals = sortMealsByTime(meals).filter(m => m.isActive !== false && m.options && m.options.length > 0);

      // Preload de imágenes: branding + iconos de alimentos usados.
      const iconNames = new Set<string>();
      activeMeals.forEach(m => m.options.forEach(o => (o.ingredients || []).forEach(i => { if (i.icon) iconNames.add(i.icon); })));
      const [logoData, signatureData, ...iconPairs] = await Promise.all([
        nutritionistLogoUrl ? loadImage(nutritionistLogoUrl) : Promise.resolve(null),
        nutritionistSignatureUrl ? loadImage(nutritionistSignatureUrl) : Promise.resolve(null),
        ...[...iconNames].map(async (n) => [n, await loadImage(`/icons/${n}.svg`, 64)] as [string, string | null]),
      ]);
      const icons: Record<string, string | null> = Object.fromEntries(iconPairs);

      // Fuente de la firma digital: asegurar que esté cargada antes de dibujar al canvas.
      const sigFont = nutritionistSignatureFont || 'Allura';
      const useRealSig = !!nutritionistUseRealSignature && !!signatureData;
      if (!useRealSig) {
        try { await (document as unknown as { fonts: { load: (f: string) => Promise<unknown>; ready: Promise<unknown> } }).fonts.load(`96px '${sigFont}'`); await document.fonts.ready; } catch { /* fallback a cursiva del sistema */ }
      }

      // Firma digital: texto en cursiva renderizado como imagen.
      const renderDigitalSignature = (text: string): { data: string; w: number; h: number } | null => {
        if (!text || !text.trim()) return null;
        const fontPx = 110;
        const font = `${fontPx}px "${sigFont}","Snell Roundhand","Brush Script MT",cursive`;
        const meas = document.createElement('canvas').getContext('2d');
        if (!meas) return null;
        meas.font = font;
        const w = Math.ceil(meas.measureText(text).width) + 70;
        const h = Math.ceil(fontPx * 1.8);
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const ctx = c.getContext('2d');
        if (!ctx) return null;
        ctx.font = font; ctx.fillStyle = '#2D2B28'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
        ctx.fillText(text, 35, h / 2);
        return { data: c.toDataURL('image/png'), w, h };
      };
      const digitalSig = useRealSig ? null : renderDigitalSignature((nutritionistTextSignature && nutritionistTextSignature.trim()) || nutritionistName);

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 18;
      const contentWidth = pageWidth - margin * 2;
      let yPos = 0;

      const setColor = (c: [number, number, number]) => doc.setTextColor(c[0], c[1], c[2]);
      const setFill = (c: [number, number, number]) => doc.setFillColor(c[0], c[1], c[2]);
      const setDraw = (c: [number, number, number]) => doc.setDrawColor(c[0], c[1], c[2]);
      const drawLine = (x1: number, y1: number, x2: number, y2: number, color = COLORS.border) => { setDraw(color); doc.setLineWidth(0.3); doc.line(x1, y1, x2, y2); };
      const charSpace = (v: number) => { (doc as unknown as { setCharSpace: (n: number) => void }).setCharSpace(v); };

      const dateStr = consultation?.date ? moment(consultation.date).format('DD MMM YYYY') : moment().format('DD MMM YYYY');
      const age = (() => {
        if (!patient?.birthDate) return null;
        const d = moment(patient.birthDate); return d.isValid() ? moment().diff(d, 'years') : null;
      })();

      // ── Footer (en páginas del plan) ──
      const addFooter = () => {
        const fy = pageHeight - 12;
        drawLine(margin, fy - 3, pageWidth - margin, fy - 3);
        doc.setFont("helvetica", "normal"); doc.setFontSize(7); setColor(COLORS.textLight);
        const parts = [nutritionistName];
        if (nutritionistId) parts.push(`${t('consultation.pdf.license')} ${nutritionistId}`);
        if (nutritionistPhone) parts.push(nutritionistPhone);
        if (nutritionistEmail) parts.push(nutritionistEmail);
        doc.text(parts.join('  ·  '), margin, fy);
      };

      // ── Header compacto (páginas del plan) ──
      const addHeader = () => {
        setFill(COLORS.primary); doc.rect(0, 0, pageWidth, 1.5, 'F');
        yPos = 12;
        let tx = margin;
        if (logoData) { try { doc.addImage(logoData, 'PNG', margin, yPos - 5, 9, 9); tx = margin + 12; } catch { /* */ } }
        doc.setFont("helvetica", "bold"); doc.setFontSize(11); setColor(COLORS.text);
        doc.text(`${t('consultation.pdf.fileNamePrefix')} ${patient?.name || ''}`.trim(), tx, yPos);
        doc.setFont("helvetica", "normal"); doc.setFontSize(7); setColor(COLORS.textLight);
        doc.text(dateStr, pageWidth - margin, yPos, { align: 'right' });
        yPos += 4;
        drawLine(margin, yPos, pageWidth - margin, yPos, COLORS.border);
        yPos += 8;
      };

      const newPage = () => { addFooter(); doc.addPage(); addHeader(); };
      const ensure = (space: number) => { if (yPos + space > pageHeight - 18) newPage(); };

      // Tabla etiqueta/valor con banda de título (reutilizable: ficha, medidas…).
      // Tabla clínica continua (sin espacios entre secciones).
      const T_CELL_H = 10.5;       // alto de celda de dato
      const T_BAND_H = 6.6;        // alto de banda de sección
      // Banda de sección (fila full-width con fondo) — pegada a lo anterior.
      const tBand = (title: string) => {
        ensure(T_BAND_H + T_CELL_H);
        setFill(COLORS.bgMedium); setDraw(COLORS.border); doc.setLineWidth(0.3);
        doc.rect(margin, yPos, contentWidth, T_BAND_H, 'FD');
        doc.setFont("helvetica", "bold"); doc.setFontSize(7); setColor(COLORS.textMuted); charSpace(0.8);
        doc.text(title.toUpperCase(), margin + 4, yPos + 4.6); charSpace(0);
        yPos += T_BAND_H;
      };
      // Filas de celdas etiqueta/valor (3 columnas) pegadas.
      const tCells = (rows: { label: string; value: string }[], cols = 3) => {
        const rowsN = Math.ceil(rows.length / cols);
        const cellW = contentWidth / cols;
        for (let idx = 0; idx < rowsN * cols; idx++) {
          const col = idx % cols, row = Math.floor(idx / cols);
          const x = margin + col * cellW, y = yPos + row * T_CELL_H;
          setDraw(COLORS.border); doc.setLineWidth(0.3); doc.rect(x, y, cellW, T_CELL_H, 'S');
          const d = rows[idx];
          if (d) {
            doc.setFont("helvetica", "bold"); doc.setFontSize(6); setColor(COLORS.textLight); charSpace(0.4);
            doc.text(d.label.toUpperCase(), x + 4, y + 4); charSpace(0);
            doc.setFont("helvetica", "bold"); doc.setFontSize(10); setColor(COLORS.text);
            doc.text(d.value, x + 4, y + 8.6);
          }
        }
        yPos += rowsN * T_CELL_H;
      };
      // Fila de ancho completo (etiqueta + valor, multi-línea) pegada.
      const tField = (label: string, value: string) => {
        doc.setFont("helvetica", "normal"); doc.setFontSize(9); setColor(COLORS.text);
        const valLines = doc.splitTextToSize(value || '—', contentWidth - 36);
        const h = Math.max(T_CELL_H, 3.5 + valLines.length * 4.1);
        ensure(h);
        setDraw(COLORS.border); doc.setLineWidth(0.3); doc.rect(margin, yPos, contentWidth, h, 'S');
        doc.setFont("helvetica", "bold"); doc.setFontSize(6); setColor(COLORS.textLight); charSpace(0.4);
        doc.text(label.toUpperCase(), margin + 4, yPos + 5.5); charSpace(0);
        doc.setFont("helvetica", "normal"); doc.setFontSize(9); setColor(COLORS.text);
        let vy = yPos + 5;
        valLines.forEach((ln: string) => { doc.text(ln, margin + 33, vy); vy += 4.1; });
        yPos += h;
      };

      // ─────────────── PORTADA — carta formal del plan ───────────────
      setFill(COLORS.primary); doc.rect(0, 0, pageWidth, 1.5, 'F');

      // Encabezado superior: profesional · matrícula · referencia + regla
      {
        const ref = `${t('consultation.pdf.fileNamePrefix').toUpperCase()} · ${moment(consultation?.date || undefined).format('YYYYMMDD')}`;
        const bits = [nutritionistName];
        if (nutritionistId) bits.push(`${t('consultation.pdf.license')} ${nutritionistId}`);
        bits.push(ref);
        let hx = margin;
        if (logoData) { try { doc.addImage(logoData, 'PNG', margin, 9.5, 8, 8); hx = margin + 11; } catch { /* */ } }
        doc.setFont("helvetica", "normal"); doc.setFontSize(8); setColor(COLORS.textMuted);
        doc.text(bits.join('    |    '), pageWidth - margin, 14.5, { align: 'right' });
        if (logoData) { doc.setFont("helvetica", "bold"); doc.setFontSize(9.5); setColor(COLORS.text); doc.text(nutritionistName, hx, 15); }
        drawLine(margin, 19, pageWidth - margin, 19, COLORS.border);
      }

      // Fecha
      yPos = 33;
      doc.setFont("helvetica", "normal"); doc.setFontSize(10.5); setColor(COLORS.text);
      doc.text(moment(consultation?.date || undefined).format('DD [de] MMMM [de] YYYY'), margin, yPos);
      yPos += 13;

      // Título grande del documento
      doc.setFont("helvetica", "bold"); doc.setFontSize(19); setColor(COLORS.text);
      doc.splitTextToSize(t('consultation.pdf.subtitle').toUpperCase(), contentWidth).forEach((ln: string) => { doc.text(ln, margin, yPos); yPos += 8.5; });
      yPos += 4;

      // Destinatario (paciente)
      doc.setFont("helvetica", "bolditalic"); doc.setFontSize(12.5); setColor(COLORS.text);
      doc.text(patient?.name || t('consultation.pdf.noName'), margin, yPos);
      yPos += 5.5;
      doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); setColor(COLORS.textMuted);
      doc.text(lang === 'pt' ? 'Paciente' : 'Paciente', margin, yPos);
      yPos += 11;

      // — Cuerpo de la carta + firma (portada) —
      yPos += 4;
      doc.setFont("helvetica", "normal"); doc.setFontSize(10.5); setColor(COLORS.text);
      doc.text(lang === 'pt' ? 'A seguir, você encontrará seu plano alimentar personalizado.' : 'A continuación encontrarás tu plan alimentario personalizado.', margin, yPos);
      yPos += 12;
      doc.text(lang === 'pt' ? 'Atenciosamente,' : 'Atentamente,', margin, yPos);
      yPos += 8;
      doc.setFont("helvetica", "bold"); doc.setFontSize(11); setColor(COLORS.text);
      doc.text(nutritionistName, margin, yPos); yPos += 5.5;
      if (nutritionistSpecialization) { doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); setColor(COLORS.textMuted); doc.text(nutritionistSpecialization, margin, yPos); yPos += 4.6; }
      if (nutritionistEmail) { doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); setColor(COLORS.textMuted); doc.text(nutritionistEmail, margin, yPos); yPos += 4.6; }
      if (nutritionistPhone) { doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); setColor(COLORS.textMuted); doc.text(nutritionistPhone, margin, yPos); yPos += 4.6; }
      yPos += 3;
      if (useRealSig && signatureData) {
        try { doc.addImage(signatureData, 'PNG', margin, yPos, 48, 16); } catch { /* */ }
      } else if (digitalSig) {
        const drawW = Math.min(54, (digitalSig.w / digitalSig.h) * 15);
        const drawH = drawW * (digitalSig.h / digitalSig.w);
        try { doc.addImage(digitalSig.data, 'PNG', margin, yPos, drawW, drawH); } catch { /* */ }
      }

      // ─────────────── PÁGINA 2: FICHA CLÍNICA DEL PACIENTE ───────────────
      doc.addPage();
      addHeader();
      {
        const mL = (es: string, pt: string) => (lang === 'pt' ? pt : es);
        const imc = (patient?.currentWeight && patient?.height) ? +(patient.currentWeight / Math.pow(patient.height / 100, 2)).toFixed(1) : null;
        const fmtDate = (s?: string) => (s ? moment(s).format('DD/MM/YYYY') : '—');
        const list = (arr?: string[]) => (arr && arr.length ? arr.join('  ·  ') : '—');

        // Encabezado de la ficha
        doc.setFont("helvetica", "bold"); doc.setFontSize(8); setColor(COLORS.textMuted); charSpace(0.6);
        doc.text((lang === 'pt' ? 'Ficha clínica do paciente' : 'Ficha clínica del paciente').toUpperCase(), margin, yPos); charSpace(0);
        yPos += 6;

        const mm = measurements || {};
        const mv = (v?: number, unit = 'cm') => (v && v > 0 ? `${v} ${unit}` : '—');

        // ── Una sola tabla continua (secciones pegadas) ──
        tBand(mL('Datos personales', 'Dados pessoais'));
        tCells([
          { label: mL('Nombre', 'Nome'), value: patient?.name || '—' },
          { label: t('consultation.pdf.sex'), value: patient?.gender === 'male' ? t('consultation.pdf.male') : patient?.gender === 'female' ? t('consultation.pdf.female') : '—' },
          { label: mL('Nacimiento', 'Nascimento'), value: fmtDate(patient?.birthDate) },
          { label: t('consultation.pdf.age'), value: age !== null ? `${age} ${t('consultation.pdf.years')}` : '—' },
          { label: mL('Teléfono', 'Telefone'), value: patient?.phone || '—' },
          { label: mL('Ocupación', 'Ocupação'), value: patient?.occupation || '—' },
        ]);
        tField(mL('Correo', 'E-mail'), patient?.email || '—');

        tBand(mL('Antropometría', 'Antropometria'));
        const antropoRows: { label: string; value: string }[] = [
          { label: t('consultation.pdf.height'), value: patient?.height ? `${patient.height} cm` : '—' },
          { label: mL('Peso actual', 'Peso atual'), value: patient?.currentWeight ? `${patient.currentWeight} kg` : '—' },
          { label: mL('Peso inicial', 'Peso inicial'), value: patient?.initialWeight ? `${patient.initialWeight} kg` : '—' },
          { label: t('consultation.pdf.targetWeight'), value: patient?.targetWeight ? `${patient.targetWeight} kg` : '—' },
          { label: 'IMC', value: imc ? `${imc}` : '—' },
          { label: mL('Meta mensual', 'Meta mensal'), value: patient?.monthlyWeightGoal ? `${patient.monthlyWeightGoal} kg/${mL('mes', 'mês')}` : '—' },
        ];
        if (withNutrition && targetCalories) antropoRows.push({ label: mL('Objetivo', 'Objetivo'), value: `${targetCalories} kcal` });
        tCells(antropoRows);

        tBand(mL('Medidas corporales', 'Medidas corporais'));
        tCells([
          { label: mL('Cintura', 'Cintura'), value: mv(mm.waist) },
          { label: mL('Cadera', 'Quadril'), value: mv(mm.hip) },
          { label: mL('Cuello', 'Pescoço'), value: mv(mm.neck) },
          { label: mL('Brazo', 'Braço'), value: mv(mm.arm) },
          { label: mL('Pantorrilla', 'Panturrilha'), value: mv(mm.calf) },
          { label: mL('Muñeca', 'Punho'), value: mv(mm.wrist) },
          { label: mL('Pl. tricipital', 'Prega tricip.'), value: mv(mm.tricipital, 'mm') },
          { label: mL('Pl. subescapular', 'Prega subesc.'), value: mv(mm.subescapular, 'mm') },
          { label: mL('Pl. suprailíaco', 'Prega suprail.'), value: mv(mm.suprailiaco, 'mm') },
        ]);

        tBand(mL('Antecedentes clínicos', 'Histórico clínico'));
        tField(t('consultation.setup.conditions'), list((patient?.medicalConditions || []).filter(Boolean)));
        tField(mL('Alergias', 'Alergias'), list(patient?.allergies));
        tField(mL('Medicamentos', 'Medicamentos'), list(patient?.medications));
        tField(mL('Restricciones', 'Restrições'), list(patient?.dietaryRestrictions));
      }

      // ─────────────── PÁGINA 3: INDICACIONES GENERALES ───────────────
      if (indicaciones && indicaciones.trim() !== '') {
        newPage();
        doc.setFont("helvetica", "bold"); doc.setFontSize(8); setColor(COLORS.textMuted); charSpace(0.6);
        doc.text(t('consultation.pdf.generalIndications').toUpperCase(), margin, yPos);
        charSpace(0);
        yPos += 2.5;
        drawLine(margin, yPos, pageWidth - margin, yPos, COLORS.border);
        yPos += 5;
        // Fijar la fuente del cuerpo ANTES de partir el texto (si no, se mide con otra y se corta).
        doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); setColor(COLORS.text);
        const indLines = doc.splitTextToSize(indicaciones, contentWidth);
        indLines.forEach((line: string) => { ensure(6); doc.text(line, margin, yPos); yPos += 4.6; });
      }

      // ─────────────── PÁGINA 4+: COMIDAS ───────────────
      newPage();

      const fmtQty = (ing: { quantity?: number; unit?: { label: string; g: number }; baseUnit?: 'g' | 'ml' }) => {
        const q = Number(ing.quantity || 0);
        const u = ing.unit;
        const baseLabel = ing.baseUnit === 'ml' ? 'ml' : 'g';
        const isBase = !u || (u.g === 1 && (u.label === 'g' || u.label === 'ml'));
        if (u && u.label && u.g > 0 && !isBase) {
          const count = +(q / u.g).toFixed(2);
          return `${count} ${u.label} (${Math.round(q)} ${baseLabel})`;
        }
        return `${Math.round(q)} ${baseLabel}`;
      };

      const ROW_H = 8;          // alto de fila de alimento
      const MEAL_BAND_H = 11;   // alto del encabezado de la comida
      const colDivX = margin + contentWidth * 0.68;  // divisor nombre | cantidad

      // Alto estimado de una opción (para no dejar encabezados huérfanos ni partir bloques).
      const optionHeight = (option: typeof activeMeals[number]['options'][number], multi: boolean): number => {
        const ings = option.ingredients || [];
        const obsText = [option.content, option.instructions].filter(Boolean).join('\n').trim();
        doc.setFont("helvetica", "normal"); doc.setFontSize(9);
        const obsLines = obsText ? doc.splitTextToSize(obsText, contentWidth - 6) : [];
        const tableH = ings.length * ROW_H;
        const obsH = obsLines.length > 0 ? obsLines.length * 4.6 + 7 : 0;
        const optHeaderH = multi ? 6.5 : 0;
        const totalsH = (withNutrition && ings.length > 0) ? 6 : 0;
        return optHeaderH + tableH + obsH + totalsH + 6;
      };

      activeMeals.forEach((meal) => {
        // Solo opciones con contenido (ingredientes u observaciones)
        const realOptions = meal.options.filter(o => (o.ingredients && o.ingredients.length > 0) || (o.content && o.content.trim()) || (o.instructions && o.instructions.trim()));
        if (realOptions.length === 0) return;
        const multi = realOptions.length > 1;

        // ── Encabezado de la COMIDA (una vez; agrupa sus opciones) ──
        // Evitar encabezado huérfano: mantener el encabezado junto con su primera opción.
        const firstH = optionHeight(realOptions[0], multi);
        ensure(MEAL_BAND_H + 4 + Math.min(firstH, pageHeight - margin - 70));
        setFill(COLORS.primaryBg); doc.rect(margin, yPos, contentWidth, MEAL_BAND_H, 'F');
        setFill(COLORS.primary); doc.rect(margin, yPos, 2.4, MEAL_BAND_H, 'F');
        doc.setFont("helvetica", "bold"); doc.setFontSize(13); setColor(COLORS.text);
        doc.text(meal.name, margin + 7, yPos + 7.6);
        if (meal.time) {
          doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); setColor(COLORS.textMuted);
          doc.text(`${meal.time} ${t('consultation.meals.hourSuffix')}`, pageWidth - margin - 4, yPos + 7.4, { align: 'right' });
        }
        yPos += MEAL_BAND_H + 4;

        realOptions.forEach((option, optIdx) => {
          const ings = option.ingredients || [];
          const obsText = [option.content, option.instructions].filter(Boolean).join('\n').trim();
          doc.setFont("helvetica", "normal"); doc.setFontSize(9);
          const obsLines = obsText ? doc.splitTextToSize(obsText, contentWidth - 6) : [];

          const tableH = ings.length * ROW_H;
          const obsH = obsLines.length > 0 ? obsLines.length * 4.6 + 7 : 0;
          const optHeaderH = multi ? 6.5 : 0;
          const blockH = optHeaderH + tableH + obsH + 6;
          // No partir la opción: si no cabe pero cabría en página nueva, saltar.
          if (yPos + blockH > pageHeight - 18 && blockH < pageHeight - 40) newPage();
          else ensure(optHeaderH + ROW_H + 6);

          // ── Sub-encabezado de la OPCIÓN (solo si hay varias) ──
          if (multi) {
            doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); setColor(COLORS.primaryDark); charSpace(0.6);
            doc.text(`${t('consultation.pdf.option').toUpperCase()} ${optIdx + 1}`, margin + 1, yPos + 3.6);
            charSpace(0);
            yPos += 6.5;
          }

          // ── Tabla de alimentos (con bordes) ──
          if (ings.length > 0) {
            const tableTop = yPos;
            ings.forEach((ing, i) => {
              const rowTop = yPos;
              const cy2 = rowTop + ROW_H / 2 + 1.4;
              const iconData = ing.icon ? icons[ing.icon] : null;
              let nx = margin + 3;
              if (iconData) { try { doc.addImage(iconData, 'PNG', margin + 2.5, rowTop + (ROW_H - 5) / 2, 5, 5); nx = margin + 9.5; } catch { /* */ } }
              doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); setColor(COLORS.text);
              const maxNameW = colDivX - nx - 2;
              const fullName = (ing as { displayName?: string }).displayName || ing.name;
              let name = fullName;
              while (doc.getTextWidth(name) > maxNameW && name.length > 4) name = name.slice(0, -2);
              if (name !== fullName) name = name.trimEnd() + '…';
              doc.text(name, nx, cy2);
              doc.setFontSize(9); setColor(COLORS.textMuted);
              if (withNutrition) {
                const q = Number(ing.quantity || 0);
                const kcal = Math.round((Number(ing.calories || 0) * q) / 100);
                doc.text(`${kcal} kcal`, pageWidth - margin - 3, cy2, { align: 'right' });
                doc.text(fmtQty(ing), colDivX + 3, cy2);
              } else {
                doc.text(fmtQty(ing), pageWidth - margin - 3, cy2, { align: 'right' });
              }
              if (i > 0) drawLine(margin, rowTop, pageWidth - margin, rowTop, COLORS.border);
              yPos += ROW_H;
            });
            // Marco exterior + divisor de columna
            setDraw(COLORS.border); doc.setLineWidth(0.3);
            doc.rect(margin, tableTop, contentWidth, tableH, 'S');
            drawLine(colDivX, tableTop, colDivX, tableTop + tableH, COLORS.border);

            if (withNutrition) {
              const tot = ings.reduce((a, ing) => {
                const q = Number(ing.quantity || 0);
                a.k += (Number(ing.calories || 0) * q) / 100;
                a.p += (Number(ing.protein || 0) * q) / 100;
                a.c += (Number(ing.carbs || 0) * q) / 100;
                a.f += (Number(ing.fat || 0) * q) / 100;
                return a;
              }, { k: 0, p: 0, c: 0, f: 0 });
              yPos += 4.5;
              doc.setFont("helvetica", "bold"); doc.setFontSize(8); setColor(COLORS.textMuted);
              doc.text(`${t('consultation.pdf.total')}: ${Math.round(tot.k)} kcal  ·  ${Math.round(tot.p)}g P  ·  ${Math.round(tot.c)}g C  ·  ${Math.round(tot.f)}g G`, pageWidth - margin - 3, yPos, { align: 'right' });
              yPos += 1.5;
            }
          }

          // ── Observaciones ──
          if (obsLines.length > 0) {
            yPos += 6.5;
            doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); setColor(COLORS.textMuted);
            doc.text(`${t('consultation.pdf.observations').toUpperCase()}`, margin, yPos);
            yPos += 4.6;
            doc.setFont("helvetica", "normal"); doc.setFontSize(9); setColor(COLORS.text);
            obsLines.forEach((line: string) => { ensure(6); doc.text(line, margin, yPos); yPos += 4.6; });
          }

          yPos += 5.5;  // separación entre opciones (más juntas → agrupadas)
        });
        yPos += 5;      // separación extra entre comidas
      });

      // (La firma del profesional va en la portada/carta.)
      addFooter();

      // Paginación "Página X / N" en todas las páginas.
      const totalPages = (doc as unknown as { getNumberOfPages: () => number }).getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFont("helvetica", "normal"); doc.setFontSize(7); setColor(COLORS.textLight);
        doc.text(`${t('consultation.pdf.pageOf')} ${p} / ${totalPages}`, pageWidth - margin, pageHeight - 12, { align: 'right' });
      }

      const safeName = (patient?.name || 'Paciente').replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ ]/g, '').trim();
      doc.save(`${t('consultation.pdf.fileNamePrefix')}_${safeName}_${moment().format('DD-MM-YYYY')}.pdf`);
    } catch (error) {
      console.error("Error generando el PDF:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <div className="flex items-center">
        <button
          onClick={() => setMenuOpen(o => !o)}
          disabled={loading}
          title={t('consultation.pdf.btnDownload')}
          className="flex items-center justify-center gap-1.5 pl-2 pr-1.5 py-1 rounded-l text-[11px] font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors disabled:opacity-60"
        >
          <Printer size={13} />
          {loading ? t('consultation.pdf.btnGenerating') : t('consultation.pdf.btnDownload')}
        </button>
        <button
          onClick={() => setMenuOpen(o => !o)}
          disabled={loading}
          className="flex items-center px-1 py-1 rounded-r text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-colors disabled:opacity-60"
          title={t('consultation.pdf.includeNutrition')}
        >
          <ChevronDown size={12} />
        </button>
      </div>
      {menuOpen && (
        <div className="absolute right-0 mt-1 z-50 w-64 rounded-md bg-white py-1 shadow-lg" style={{ border: '1px solid #E8E5DE' }}>
          <button
            onClick={() => generatePDF(false)}
            className="w-full flex items-start gap-2.5 px-3 py-2 text-left hover:bg-[#FAF9F7] transition-colors"
          >
            <Printer size={14} className="mt-0.5 text-gray-400 flex-shrink-0" />
            <span>
              <span className="block text-[12px] font-medium text-gray-800">{t('consultation.pdf.optSimple')}</span>
              <span className="block text-[11px] text-gray-400">{t('consultation.pdf.optSimpleHint')}</span>
            </span>
          </button>
          <div className="my-1 border-t border-[#F0EDE8]" />
          <button
            onClick={() => generatePDF(true)}
            className="w-full flex items-start gap-2.5 px-3 py-2 text-left hover:bg-emerald-50 transition-colors"
          >
            <Check size={14} className="mt-0.5 text-emerald-600 flex-shrink-0" />
            <span>
              <span className="block text-[12px] font-medium text-emerald-700">{t('consultation.pdf.optNutrition')}</span>
              <span className="block text-[11px] text-gray-400">{t('consultation.pdf.optNutritionHint')}</span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

export default PrintNutritionPlan;
