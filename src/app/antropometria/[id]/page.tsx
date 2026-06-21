'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { format, parseISO, differenceInYears } from 'date-fns';
import { es, ptBR } from 'date-fns/locale';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import {
  Ruler, Scale, Activity, Target, Flame, HeartPulse, Dumbbell, Info,
  ChevronLeft, Save, Trash2, Droplet, TrendingUp, TrendingDown, Minus,
} from 'lucide-react';
import { app, patientService } from '@/app/shared/firebase';
import {
  getFirestore, collection, addDoc, doc, getDoc, getDocs, query, where,
  updateDoc, deleteDoc, serverTimestamp,
} from 'firebase/firestore';
import { useTranslation } from '@/app/shared/useTranslation';

// ──────────────────────────────────────────────────────────
// Tipos
// ──────────────────────────────────────────────────────────
type Sexo = 'male' | 'female';
type Actividad = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
type Objetivo = 'lose' | 'maintain' | 'gain';
type Formula = 'mifflin' | 'harris' | 'katch';

const ACTIVIDAD_FACTOR: Record<Actividad, number> = {
  sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9,
};
const OBJETIVO_DELTA: Record<Objetivo, number> = { lose: -500, maintain: 0, gain: 300 };

// ──────────────────────────────────────────────────────────
// Cálculos
// ──────────────────────────────────────────────────────────
const round = (n: number, dec = 1) => {
  if (!Number.isFinite(n)) return 0;
  const f = Math.pow(10, dec);
  return Math.round(n * f) / f;
};
const calcIMC = (peso: number, alturaCm: number) => {
  const m = alturaCm / 100;
  return m > 0 ? peso / (m * m) : 0;
};
const clasificacionIMC = (imc: number) => {
  if (imc < 18.5) return { key: 'underweight', color: '#3b82f6' };
  if (imc < 25)   return { key: 'normal',      color: '#10b981' };
  if (imc < 30)   return { key: 'overweight',  color: '#f59e0b' };
  if (imc < 35)   return { key: 'obese1',      color: '#ef4444' };
  if (imc < 40)   return { key: 'obese2',      color: '#dc2626' };
  return { key: 'obese3', color: '#991b1b' };
};
// (peso ideal por fórmulas removido — ahora usamos rango saludable IMC 18.5–24.9)
const tmbMifflin = (sexo: Sexo, peso: number, altura: number, edad: number) => {
  const base = 10 * peso + 6.25 * altura - 5 * edad;
  return sexo === 'male' ? base + 5 : base - 161;
};
const tmbHarris = (sexo: Sexo, peso: number, altura: number, edad: number) =>
  sexo === 'male'
    ? 88.362 + 13.397 * peso + 4.799 * altura - 5.677 * edad
    : 447.593 + 9.247 * peso + 3.098 * altura - 4.330 * edad;
const tmbKatch = (masaMagraKg: number) => 370 + 21.6 * masaMagraKg;
const grasaDeurenberg = (imc: number, edad: number, sexo: Sexo) => {
  const s = sexo === 'male' ? 1 : 0;
  return 1.2 * imc + 0.23 * edad - 10.8 * s - 5.4;
};
const grasaNavy = (sexo: Sexo, alturaCm: number, cinturaCm: number, cuelloCm: number, caderaCm?: number) => {
  if (!cinturaCm || !cuelloCm || !alturaCm) return 0;
  if (sexo === 'male') {
    const v = cinturaCm - cuelloCm;
    if (v <= 0) return 0;
    return 495 / (1.0324 - 0.19077 * Math.log10(v) + 0.15456 * Math.log10(alturaCm)) - 450;
  }
  if (!caderaCm) return 0;
  const v = cinturaCm + caderaCm - cuelloCm;
  if (v <= 0) return 0;
  return 495 / (1.29579 - 0.35004 * Math.log10(v) + 0.22100 * Math.log10(alturaCm)) - 450;
};
const whr = (cintura: number, cadera: number) => (cadera ? cintura / cadera : 0);
const whrRiesgo = (valor: number, sexo: Sexo) => {
  if (!valor) return { key: 'none', color: '#9ca3af' };
  if (sexo === 'male') {
    if (valor < 0.90) return { key: 'low', color: '#10b981' };
    if (valor < 1.00) return { key: 'moderate', color: '#f59e0b' };
    return { key: 'high', color: '#ef4444' };
  }
  if (valor < 0.80) return { key: 'low', color: '#10b981' };
  if (valor < 0.85) return { key: 'moderate', color: '#f59e0b' };
  return { key: 'high', color: '#ef4444' };
};
const whtr = (cintura: number, altura: number) => (altura ? cintura / altura : 0);
const whtrRiesgo = (valor: number) => {
  if (!valor) return { key: 'none', color: '#9ca3af' };
  if (valor < 0.4) return { key: 'underweight', color: '#3b82f6' };
  if (valor < 0.5) return { key: 'healthy',     color: '#10b981' };
  if (valor < 0.6) return { key: 'overweight',  color: '#f59e0b' };
  return { key: 'obese', color: '#ef4444' };
};

// ──────────────────────────────────────────────────────────
// Página
// ──────────────────────────────────────────────────────────
export default function AntropometriaPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const db = getFirestore(app);
  const { t, ti, lang } = useTranslation();
  const dateLocale = lang === 'pt' ? ptBR : es;

  const labelBmi = (key: string) =>
    key === 'normal' ? t('anthropometry.bmiClass.normal')
    : key === 'underweight' ? t('anthropometry.bmiClass.underweight')
    : key === 'overweight' ? t('anthropometry.bmiClass.overweight')
    : key === 'obese1' ? t('anthropometry.bmiClass.obese1')
    : key === 'obese2' ? t('anthropometry.bmiClass.obese2')
    : key === 'obese3' ? t('anthropometry.bmiClass.obese3')
    : '—';

  const labelRisk = (key: string) =>
    key === 'low' ? t('anthropometry.risk.low')
    : key === 'moderate' ? t('anthropometry.risk.moderate')
    : key === 'high' ? t('anthropometry.risk.high')
    : key === 'veryHigh' ? t('anthropometry.risk.veryHigh')
    : '—';

  const labelWhtr = (key: string) =>
    key === 'underweight' ? t('anthropometry.bmiClass.underweight')
    : key === 'healthy' ? t('anthropometry.bmiClass.normal')
    : key === 'overweight' ? t('anthropometry.bmiClass.overweight')
    : key === 'obese' ? t('anthropometry.bmiClass.obese1')
    : '—';

  const ACTIVIDAD_LABEL: Record<Actividad, string> = {
    sedentary: t('anthropometry.activity.sed'),
    light: t('anthropometry.activity.light') + ' (1-3 d/sem)',
    moderate: t('anthropometry.activity.moderate') + ' (3-5 d/sem)',
    active: t('anthropometry.activity.active') + ' (6-7 d/sem)',
    very_active: t('anthropometry.activity.veryActive'),
  };

  const id = (params?.id as string) || 'new';
  const patientId = searchParams?.get('patientId') || '';

  const [patientName, setPatientName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState(false);

  // Datos del paciente
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [sexo, setSexo] = useState<Sexo>('female');
  const [edad, setEdad] = useState<number>(30);
  const [altura, setAltura] = useState<number>(165);
  const [peso, setPeso] = useState<number>(65);
  const [pesoObjetivo, setPesoObjetivo] = useState<number>(60);
  const [cintura, setCintura] = useState<number>(0);
  const [cadera, setCadera] = useState<number>(0);
  const [cuello, setCuello] = useState<number>(0);
  // Avanzado (opcional)
  const [tricipital, setTricipital] = useState<number>(0);
  const [subescapular, setSubescapular] = useState<number>(0);
  const [suprailiaco, setSuprailiaco] = useState<number>(0);
  const [brazo, setBrazo] = useState<number>(0);
  const [pantorrilla, setPantorrilla] = useState<number>(0);
  const [muneca, setMuneca] = useState<number>(0);
  const [actividad, setActividad] = useState<Actividad>('moderate');
  const [objetivo, setObjetivo] = useState<Objetivo>('maintain');
  const [formula, setFormula] = useState<Formula>('mifflin');
  const [notas, setNotas] = useState<string>('');

  // Histórico (otras antropometrías del paciente, sin la actual)
  type HistRow = { id: string; date: string; peso: number; cintura: number; bmi: number; bodyFatPct: number };
  const [history, setHistory] = useState<HistRow[]>([]);
  // Modal informativo
  const [infoKey, setInfoKey] = useState<string | null>(null);
  // Marcador anatómico activo (para iluminar el esquema)
  const [focusedMeasure, setFocusedMeasure] = useState<'waist' | 'hip' | 'neck' | 'tricipital' | 'subescapular' | 'suprailiaco' | 'arm' | 'calf' | 'wrist' | null>(null);
  // Stepper
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Carga inicial
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // 1. Cargar paciente para nombre + prefill
        if (patientId) {
          const p: any = await patientService.getPatientById(patientId);
          if (p) {
            setPatientName(p.name || '');
            // Prefill solo si es nueva
            if (id === 'new') {
              if (p.gender === 'male' || p.gender === 'female') setSexo(p.gender);
              if (p.height) setAltura(p.height);
              if (p.currentWeight) setPeso(p.currentWeight);
              if (p.birthDate) {
                const a = differenceInYears(new Date(), parseISO(p.birthDate));
                if (a > 0) setEdad(a);
              }
            }
          }
        }
        // 2. Si edita, cargar medición
        if (id !== 'new') {
          const snap = await getDoc(doc(db, 'patientAnthropometries', id));
          if (snap.exists()) {
            const d = snap.data() as any;
            setDate(d.date || format(new Date(), 'yyyy-MM-dd'));
            setSexo(d.sexo || 'female');
            setEdad(d.edad ?? 30);
            setAltura(d.altura ?? 165);
            setPeso(d.peso ?? 65);
            setPesoObjetivo(d.pesoObjetivo ?? 60);
            setCintura(d.cintura ?? 0);
            setCadera(d.cadera ?? 0);
            setCuello(d.cuello ?? 0);
            setTricipital(d.tricipital ?? 0);
            setSubescapular(d.subescapular ?? 0);
            setSuprailiaco(d.suprailiaco ?? 0);
            setBrazo(d.brazo ?? 0);
            setPantorrilla(d.pantorrilla ?? 0);
            setMuneca(d.muneca ?? 0);
            setActividad(d.actividad || 'moderate');
            setObjetivo(d.objetivo || 'maintain');
            setFormula(d.formula || 'mifflin');
            setNotas(d.notas || '');
          }
        }
        // 3. Cargar histórico (todas las antropometrías del paciente)
        if (patientId) {
          const qs = query(collection(db, 'patientAnthropometries'), where('patientId', '==', patientId));
          const snap = await getDocs(qs);
          const rows: HistRow[] = [];
          snap.forEach(docSnap => {
            if (docSnap.id === id) return; // excluir la actual cuando se está editando
            const dd = docSnap.data() as any;
            rows.push({
              id: docSnap.id,
              date: dd.date || '',
              peso: Number(dd.peso ?? 0),
              cintura: Number(dd.cintura ?? 0),
              bmi: Number(dd.computed?.bmi ?? 0),
              bodyFatPct: Number(dd.computed?.bodyFatPct ?? 0),
            });
          });
          rows.sort((a, b) => a.date.localeCompare(b.date));
          setHistory(rows);
        }
      } catch (e: any) {
        console.error(e);
        setError(t('anthropometry.loadError'));
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, patientId]);

  // ── Cálculos derivados ──
  const imc = useMemo(() => calcIMC(peso, altura), [peso, altura]);
  const claseIMC = clasificacionIMC(imc);
  const grasaPctDeur = useMemo(() => grasaDeurenberg(imc, edad, sexo), [imc, edad, sexo]);
  const grasaPctNavy = useMemo(
    () => grasaNavy(sexo, altura, cintura, cuello, sexo === 'female' ? cadera : undefined),
    [sexo, altura, cintura, cuello, cadera],
  );
  const grasaPctFinal = grasaPctNavy > 0 ? grasaPctNavy : grasaPctDeur;
  const masaGrasaKg = (grasaPctFinal / 100) * peso;
  const masaMagraKg = peso - masaGrasaKg;

  const tmbMif = useMemo(() => tmbMifflin(sexo, peso, altura, edad), [sexo, peso, altura, edad]);
  const tmbHar = useMemo(() => tmbHarris(sexo, peso, altura, edad), [sexo, peso, altura, edad]);
  const tmbKat = useMemo(() => tmbKatch(masaMagraKg), [masaMagraKg]);
  const tmb = formula === 'mifflin' ? tmbMif : formula === 'harris' ? tmbHar : tmbKat;
  const get = tmb * ACTIVIDAD_FACTOR[actividad];
  const calObjetivo = get + OBJETIVO_DELTA[objetivo];

  const indiceCC = whr(cintura, cadera);
  const claseWHR = whrRiesgo(indiceCC, sexo);
  const indiceCA = whtr(cintura, altura);
  const claseWHtR = whtrRiesgo(indiceCA);

  // Comparativa con la medición previa más reciente (anterior a esta fecha)
  const previous = useMemo<HistRow | null>(() => {
    if (history.length === 0) return null;
    const before = history.filter(h => h.date && h.date < date);
    if (before.length > 0) return before[before.length - 1];
    return history[history.length - 1];
  }, [history, date]);
  const deltaDays = useMemo(() => {
    if (!previous?.date) return 0;
    try {
      const a = parseISO(date).getTime();
      const b = parseISO(previous.date).getTime();
      return Math.max(0, Math.round((a - b) / (1000 * 60 * 60 * 24)));
    } catch { return 0; }
  }, [previous, date]);

  // Rango saludable según IMC (18.5–24.9) y altura
  const healthyWeightMin = useMemo(() => 18.5 * Math.pow(altura / 100, 2), [altura]);
  const healthyWeightMax = useMemo(() => 24.9 * Math.pow(altura / 100, 2), [altura]);

  // Hidratación recomendada (35 mL/kg) y proteína por kg de masa magra
  const hidratacionLitros = useMemo(() => round(peso * 0.035, 2), [peso]);
  const proteinaGr = useMemo(() => {
    const factor = objetivo === 'lose' ? 2.0 : objetivo === 'gain' ? 1.8 : 1.6;
    return Math.round(masaMagraKg * factor);
  }, [masaMagraKg, objetivo]);

  // Validación visible: Navy requiere cuello + cintura (+ cadera para mujer)
  const navyMissing: string[] = [];
  if (!cintura) navyMissing.push(t('anthropometry.fields.waist'));
  if (!cuello) navyMissing.push(t('anthropometry.fields.neck'));
  if (sexo === 'female' && !cadera) navyMissing.push(t('anthropometry.fields.hip'));
  const navyOk = navyMissing.length === 0 && grasaPctNavy > 0;

  const macros = useMemo(() => {
    const carbs = (calObjetivo * 0.40) / 4;
    const prot  = (calObjetivo * 0.30) / 4;
    const fat   = (calObjetivo * 0.30) / 9;
    return [
      { name: t('anthropometry.charts.carbs'),   value: round(carbs, 0), color: '#10b981' },
      { name: t('anthropometry.charts.protein'), value: round(prot, 0),  color: '#3b82f6' },
      { name: t('anthropometry.charts.fat'),     value: round(fat, 0),   color: '#f59e0b' },
    ];
  }, [calObjetivo, t]);

  const composicionData = [
    { name: t('anthropometry.charts.lean'),     value: round(masaMagraKg, 1), color: '#10b981' },
    { name: t('anthropometry.charts.fatLabel'), value: round(masaGrasaKg, 1), color: '#f59e0b' },
  ];
  const tmbData = [
    { name: 'Mifflin-St Jeor', kcal: round(tmbMif, 0) },
    { name: 'Harris-Benedict', kcal: round(tmbHar, 0) },
    { name: 'Katch-McArdle',   kcal: round(tmbKat, 0) },
  ];
  // Histórico de peso para sparkline (incluye el actual)
  const weightHistory = useMemo(() => {
    const rows = [...history.map(h => ({ date: h.date, peso: h.peso }))];
    if (date && peso) rows.push({ date, peso });
    rows.sort((a, b) => a.date.localeCompare(b.date));
    return rows.slice(-8);
  }, [history, date, peso]);

  // ── Acciones ──
  const handleSave = async () => {
    if (!patientId) { setError(t('anthropometry.noPatient')); return; }
    if (!peso || !altura) { setError(t('anthropometry.saveError')); return; }
    setError(null);
    setSaving(true);
    try {
      const payload: any = {
        patientId, date, sexo, edad, altura, peso, pesoObjetivo,
        cintura, cadera, cuello,
        tricipital, subescapular, suprailiaco, brazo, pantorrilla, muneca,
        actividad, objetivo, formula, notas,
        computed: {
          bmi: round(imc, 1),
          bodyFatPct: round(grasaPctFinal, 1),
          leanMassKg: round(masaMagraKg, 1),
          fatMassKg: round(masaGrasaKg, 1),
          tmb: Math.round(tmb),
          get: Math.round(get),
          targetCalories: Math.round(calObjetivo),
          whr: round(indiceCC, 2),
          whtr: round(indiceCA, 2),
        },
      };
      if (id === 'new') {
        payload.createdAt = serverTimestamp();
        await addDoc(collection(db, 'patientAnthropometries'), payload);
      } else {
        await updateDoc(doc(db, 'patientAnthropometries', id), payload);
      }
      router.push(`/detalle-paciente/${patientId}`);
    } catch (e: any) {
      console.error(e);
      setError(t('anthropometry.saveError') + (e?.message ? ': ' + e.message : ''));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (id === 'new') return;
    try {
      await deleteDoc(doc(db, 'patientAnthropometries', id));
      router.push(`/detalle-paciente/${patientId}`);
    } catch (e) {
      console.error(e);
      setError(t('anthropometry.deleteError'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-pattern flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-pattern">
      {/* Top bar */}
      <div className="bg-white border-b border-[#E8E5DE] sticky top-0 z-10">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={patientId ? `/detalle-paciente/${patientId}` : '/pacientes'}
              className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-emerald-50 text-emerald-700">
              <Ruler className="w-3.5 h-3.5" strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                {id === 'new' ? t('anthropometry.newTitle') : t('anthropometry.editTitle')}
              </p>
              <p className="text-[14px] font-semibold text-gray-900 leading-tight">
                {t('anthropometry.sectionTitle')} {patientName && <span className="text-gray-400 font-normal">· {patientName}</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {id !== 'new' && (
              <button
                onClick={() => setShowDelete(true)}
                className="px-3 py-1.5 border border-gray-300 rounded text-[12px] text-red-600 hover:bg-red-50 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> {t('anthropometry.deleteBtn')}
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 bg-emerald-600 text-white rounded text-[12px] font-medium hover:bg-emerald-700 disabled:opacity-60 flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? t('anthropometry.saving') : t('common.save')}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && <div className="bg-red-50 text-red-600 p-2.5 rounded mb-4 text-[12px]">{error}</div>}

        {/* Stepper header */}
        <Stepper currentStep={currentStep} onStepChange={setCurrentStep} t={t} />

        <div>
          {/* ── Step 1: Paciente ── */}
          <aside className={currentStep === 1 ? 'space-y-4 max-w-2xl mx-auto' : 'hidden'}>
            <Card step={1} title={t('anthropometry.cards.basic')} subtitle={t('anthropometry.steps.basicSubtitle')}>
              <FieldRow>
                <Label>{t('anthropometry.fields.date')}</Label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded-sm text-xs focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400"
                />
              </FieldRow>
              <FieldRow>
                <Label>{t('anthropometry.fields.sex')}</Label>
                <div className="flex gap-2">
                  <ToggleBtn active={sexo === 'female'} onClick={() => setSexo('female')}>{t('anthropometry.fields.female')}</ToggleBtn>
                  <ToggleBtn active={sexo === 'male'} onClick={() => setSexo('male')}>{t('anthropometry.fields.male')}</ToggleBtn>
                </div>
              </FieldRow>
              <FieldRow>
                <Label>{t('anthropometry.fields.age')}</Label>
                <NumberInput value={edad} onChange={setEdad} min={1} max={120} />
              </FieldRow>
            </Card>
          </aside>

          {/* ── Step 2: Mediciones físicas ── */}
          <aside className={currentStep === 2 ? 'space-y-4 max-w-2xl mx-auto' : 'hidden'}>
            <Card step={2} title={t('anthropometry.cards.physical')} subtitle={t('anthropometry.steps.physicalSubtitle')}>
              <div className="grid grid-cols-2 gap-3">
                <MeasureRow icon={<div className="w-full h-full flex items-center justify-center"><Ruler className="w-7 h-7 text-stone-400" /></div>} active={false} label={t('anthropometry.fields.height')}>
                  <NumberInput value={altura} onChange={setAltura} min={50} max={250} step={0.1} hint={t('anthropometry.hints.height')} />
                </MeasureRow>
                <MeasureRow icon={<div className="w-full h-full flex items-center justify-center"><Scale className="w-7 h-7 text-stone-400" /></div>} active={false} label={t('anthropometry.fields.weight')}>
                  <NumberInput value={peso} onChange={setPeso} min={20} max={350} step={0.1} hint={t('anthropometry.hints.weight')} />
                </MeasureRow>
              </div>
              <div className="pt-2 mt-2 border-t border-gray-100">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">{t('anthropometry.cards.circ')}</p>
                <div className="space-y-2">
                  <MeasureRow icon={<MiniSketch kind="waist" active={focusedMeasure === 'waist'} />} active={focusedMeasure === 'waist'} label={t('anthropometry.fields.waist')}>
                    <NumberInput value={cintura} onChange={setCintura} min={0} max={250} step={0.1} hint={t('anthropometry.hints.waist')} onFocus={() => setFocusedMeasure('waist')} onBlur={() => setFocusedMeasure(null)} />
                  </MeasureRow>
                  <MeasureRow icon={<MiniSketch kind="hip" active={focusedMeasure === 'hip'} />} active={focusedMeasure === 'hip'} label={t('anthropometry.fields.hip')}>
                    <NumberInput value={cadera} onChange={setCadera} min={0} max={250} step={0.1} hint={t('anthropometry.hints.hip')} onFocus={() => setFocusedMeasure('hip')} onBlur={() => setFocusedMeasure(null)} />
                  </MeasureRow>
                  <MeasureRow icon={<MiniSketch kind="neck" active={focusedMeasure === 'neck'} />} active={focusedMeasure === 'neck'} label={t('anthropometry.fields.neck')}>
                    <NumberInput value={cuello} onChange={setCuello} min={0} max={80} step={0.1} hint={t('anthropometry.hints.neck')} onFocus={() => setFocusedMeasure('neck')} onBlur={() => setFocusedMeasure(null)} />
                  </MeasureRow>
                </div>
              </div>
            </Card>
          </aside>

          {/* ── Step 3: Avanzado (opcional) ── */}
          <aside className={currentStep === 3 ? 'space-y-4 max-w-2xl mx-auto' : 'hidden'}>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3">
              <Info className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-[12px] text-amber-900 leading-relaxed">
                <p className="font-semibold">{t('anthropometry.stepper.optional')}</p>
                <p className="text-amber-800">Los pliegues requieren un plicómetro. Si no los tienes, omite este paso.</p>
              </div>
            </div>
            <Card step={3} title={t('anthropometry.stepper.s3')} subtitle={t('anthropometry.stepper.s3Sub')}>
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Pliegues cutáneos</p>
                <MeasureRow icon={<MiniSketch kind="tricipital" active={focusedMeasure === 'tricipital'} />} active={focusedMeasure === 'tricipital'} label={t('anthropometry.fields.tricipital')}>
                  <NumberInput value={tricipital} onChange={setTricipital} min={0} max={80} step={0.1} hint={t('anthropometry.hints.tricipital')} onFocus={() => setFocusedMeasure('tricipital')} onBlur={() => setFocusedMeasure(null)} />
                </MeasureRow>
                <MeasureRow icon={<MiniSketch kind="subescapular" active={focusedMeasure === 'subescapular'} />} active={focusedMeasure === 'subescapular'} label={t('anthropometry.fields.subescapular')}>
                  <NumberInput value={subescapular} onChange={setSubescapular} min={0} max={80} step={0.1} hint={t('anthropometry.hints.subescapular')} onFocus={() => setFocusedMeasure('subescapular')} onBlur={() => setFocusedMeasure(null)} />
                </MeasureRow>
                <MeasureRow icon={<MiniSketch kind="suprailiaco" active={focusedMeasure === 'suprailiaco'} />} active={focusedMeasure === 'suprailiaco'} label={t('anthropometry.fields.suprailiaco')}>
                  <NumberInput value={suprailiaco} onChange={setSuprailiaco} min={0} max={80} step={0.1} hint={t('anthropometry.hints.suprailiaco')} onFocus={() => setFocusedMeasure('suprailiaco')} onBlur={() => setFocusedMeasure(null)} />
                </MeasureRow>
              </div>
              <div className="pt-2 mt-2 border-t border-gray-100 space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Perímetros</p>
                <MeasureRow icon={<MiniSketch kind="arm" active={focusedMeasure === 'arm'} />} active={focusedMeasure === 'arm'} label={t('anthropometry.fields.arm')}>
                  <NumberInput value={brazo} onChange={setBrazo} min={0} max={80} step={0.1} hint={t('anthropometry.hints.arm')} onFocus={() => setFocusedMeasure('arm')} onBlur={() => setFocusedMeasure(null)} />
                </MeasureRow>
                <MeasureRow icon={<MiniSketch kind="calf" active={focusedMeasure === 'calf'} />} active={focusedMeasure === 'calf'} label={t('anthropometry.fields.calf')}>
                  <NumberInput value={pantorrilla} onChange={setPantorrilla} min={0} max={80} step={0.1} hint={t('anthropometry.hints.calf')} onFocus={() => setFocusedMeasure('calf')} onBlur={() => setFocusedMeasure(null)} />
                </MeasureRow>
                <MeasureRow icon={<MiniSketch kind="wrist" active={focusedMeasure === 'wrist'} />} active={focusedMeasure === 'wrist'} label={t('anthropometry.fields.wrist')}>
                  <NumberInput value={muneca} onChange={setMuneca} min={0} max={30} step={0.1} hint={t('anthropometry.hints.wrist')} onFocus={() => setFocusedMeasure('wrist')} onBlur={() => setFocusedMeasure(null)} />
                </MeasureRow>
              </div>
            </Card>
          </aside>

          {/* ── Step 4: Plan de calorías ── */}
          <aside className={currentStep === 4 ? 'space-y-4 max-w-2xl mx-auto' : 'hidden'}>
            <Card step={4} title={t('anthropometry.cards.kcal')} subtitle={t('anthropometry.steps.kcalSubtitle')}>
              <FieldRow>
                <Label>{t('anthropometry.fields.targetWeight')}</Label>
                <NumberInput value={pesoObjetivo} onChange={setPesoObjetivo} min={20} max={350} step={0.1} />
              </FieldRow>
              <FieldRow>
                <Label>{t('anthropometry.fields.formula')}</Label>
                <select
                  value={formula}
                  onChange={e => setFormula(e.target.value as Formula)}
                  className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded-sm text-xs focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400"
                >
                  <option value="mifflin">{t('anthropometry.formula.mifflin')}</option>
                  <option value="harris">{t('anthropometry.formula.harris')}</option>
                  <option value="katch">{t('anthropometry.formula.katch')}</option>
                </select>
              </FieldRow>
              <FieldRow>
                <Label>{t('anthropometry.fields.activity')}</Label>
                <select
                  value={actividad}
                  onChange={e => setActividad(e.target.value as Actividad)}
                  className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded-sm text-xs focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400"
                >
                  {(Object.keys(ACTIVIDAD_LABEL) as Actividad[]).map(k => (
                    <option key={k} value={k}>{ACTIVIDAD_LABEL[k]}</option>
                  ))}
                </select>
              </FieldRow>
              <FieldRow>
                <Label>{t('anthropometry.fields.goal')}</Label>
                <div className="grid grid-cols-3 gap-2">
                  <ToggleBtn active={objetivo === 'lose'}     onClick={() => setObjetivo('lose')}>{t('anthropometry.goal.lose')}</ToggleBtn>
                  <ToggleBtn active={objetivo === 'maintain'} onClick={() => setObjetivo('maintain')}>{t('anthropometry.goal.maintain')}</ToggleBtn>
                  <ToggleBtn active={objetivo === 'gain'}     onClick={() => setObjetivo('gain')}>{t('anthropometry.goal.gain')}</ToggleBtn>
                </div>
              </FieldRow>
            </Card>

            <Card title={t('anthropometry.cards.notes')} subtitle={t('anthropometry.steps.notesSubtitle')}>
              <textarea
                value={notas}
                onChange={e => setNotas(e.target.value)}
                rows={4}
                className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded-sm text-xs focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 resize-none"
                placeholder={t('anthropometry.fields.notesPh')}
              />
            </Card>
          </aside>

          {/* ── Step 5: Resultados ── */}
          <section className={currentStep === 5 ? 'space-y-6' : 'hidden'}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Kpi label={t('anthropometry.kpi.bmi')}      value={round(imc, 1).toString()} hint={labelBmi(claseIMC.key)} color={claseIMC.color} icon={<Scale className="w-4 h-4" />} onInfo={() => setInfoKey('bmi')} />
              <Kpi label={t('anthropometry.kpi.tmb')}      value={`${round(tmb, 0)}`} hint={`kcal · ${t('anthropometry.kpi.tmb')}`} color="#0f766e" icon={<Flame className="w-4 h-4" />} onInfo={() => setInfoKey('tmb')} />
              <Kpi label={t('anthropometry.kpi.get')}      value={`${round(get, 0)}`} hint={`× ${ACTIVIDAD_FACTOR[actividad]}`} color="#0f766e" icon={<Activity className="w-4 h-4" />} onInfo={() => setInfoKey('get')} />
              <Kpi label={t('anthropometry.kpi.targetKcal')} value={`${round(calObjetivo, 0)}`} hint={objetivo === 'lose' ? t('anthropometry.ui.deficitChip') : objetivo === 'gain' ? t('anthropometry.ui.surplusChip') : t('anthropometry.goal.maintain')} color={objetivo === 'lose' ? '#3b82f6' : objetivo === 'gain' ? '#f59e0b' : '#10b981'} icon={<Target className="w-4 h-4" />} onInfo={() => setInfoKey('targetKcal')} />
            </div>

            {/* Comparativa con la medición anterior */}
            {previous && (
              <Panel title={t('anthropometry.ui.comparativeTitle')} subtitle={previous.date ? `${t('anthropometry.ui.lastDate')}: ${format(parseISO(previous.date), 'dd MMM yyyy', { locale: dateLocale })} · ${ti('anthropometry.ui.daysAgo', [deltaDays])}` : ''} onInfo={() => setInfoKey('comparative')}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <DeltaCard label={t('anthropometry.ui.deltaWeight')}  unit="kg" current={peso}            previous={previous.peso}       lowerIsBetter />
                  <DeltaCard label={t('anthropometry.ui.deltaBmi')}     unit=""   current={round(imc, 1)}   previous={previous.bmi}        lowerIsBetter />
                  <DeltaCard label={t('anthropometry.ui.deltaWaist')}   unit="cm" current={cintura}         previous={previous.cintura}    lowerIsBetter />
                  <DeltaCard label={t('anthropometry.ui.deltaFatPct')}  unit="%"  current={round(grasaPctFinal, 1)} previous={previous.bodyFatPct} lowerIsBetter />
                </div>
              </Panel>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Panel title={t('anthropometry.charts.composition')} subtitle={`${round(grasaPctFinal, 1)}% ${lang === 'pt' ? 'gordura' : 'grasa'}`}>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={composicionData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value">
                        {composicionData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip formatter={(v: any) => `${v} kg`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {!navyOk && navyMissing.length > 0 ? (
                  <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 mt-2 flex items-start gap-1.5">
                    <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>{ti('anthropometry.ui.navyWarning', [navyMissing.join(', ')])}</span>
                  </p>
                ) : (
                  <p className="text-[11px] text-gray-500 mt-2 flex items-start gap-1.5">
                    <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    {t('anthropometry.ui.navyOk')}
                  </p>
                )}
              </Panel>

              <Panel title={t('anthropometry.ui.healthyRangeTitle')} subtitle={ti('anthropometry.ui.healthyRangeSubtitle', [round(healthyWeightMin, 1), round(healthyWeightMax, 1)])} onInfo={() => setInfoKey('healthyRange')}>
                <HealthyWeightBar
                  current={peso}
                  target={pesoObjetivo}
                  min={healthyWeightMin}
                  max={healthyWeightMax}
                  zoneLabel={t('anthropometry.ui.healthyZoneLabel')}
                />
                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                  <div className="p-2 rounded" style={{ border: '1px solid #E8E5DE' }}>
                    <div className="text-[10px] uppercase tracking-wider text-gray-500">{t('anthropometry.ui.current')}</div>
                    <div className="text-sm font-semibold tabular-nums text-gray-900">{round(peso, 1)} kg</div>
                  </div>
                  <div className="p-2 rounded" style={{ border: '1px solid #E8E5DE' }}>
                    <div className="text-[10px] uppercase tracking-wider text-gray-500">{t('anthropometry.ui.target')}</div>
                    <div className="text-sm font-semibold tabular-nums text-gray-900">{round(pesoObjetivo, 1)} kg</div>
                  </div>
                  <div className="p-2 rounded" style={{ border: '1px solid #E8E5DE' }}>
                    <div className="text-[10px] uppercase tracking-wider text-gray-500">{t('anthropometry.ui.deltaToHealthy')}</div>
                    <div className="text-sm font-semibold tabular-nums text-gray-900">
                      {peso < healthyWeightMin ? `+${round(healthyWeightMin - peso, 1)}` :
                       peso > healthyWeightMax ? `−${round(peso - healthyWeightMax, 1)}` : '0'} kg
                    </div>
                  </div>
                </div>
              </Panel>
            </div>

            {/* Hidratación + Proteína */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Panel title={t('anthropometry.ui.hydrationTitle')} subtitle={t('anthropometry.ui.hydrationSubtitle')} onInfo={() => setInfoKey('hydration')}>
                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 text-blue-600">
                    <Droplet className="w-5 h-5" />
                  </span>
                  <div>
                    <div className="text-3xl font-semibold tabular-nums text-gray-900" style={{ letterSpacing: '-0.02em' }}>{hidratacionLitros}<span className="text-base font-normal text-gray-500 ml-1">{t('anthropometry.ui.litersDay')}</span></div>
                    <div className="text-[11px] text-gray-500 mt-0.5">{ti('anthropometry.ui.hydrationGlasses', [Math.round(hidratacionLitros * 1000 / 250)])}</div>
                  </div>
                </div>
              </Panel>
              <Panel title={t('anthropometry.ui.proteinTitle')} subtitle={ti('anthropometry.ui.proteinSubtitle', [objetivo === 'lose' ? '2.0' : objetivo === 'gain' ? '1.8' : '1.6'])} onInfo={() => setInfoKey('protein')}>
                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 text-emerald-700">
                    <Dumbbell className="w-5 h-5" />
                  </span>
                  <div>
                    <div className="text-3xl font-semibold tabular-nums text-gray-900" style={{ letterSpacing: '-0.02em' }}>{proteinaGr}<span className="text-base font-normal text-gray-500 ml-1">{t('anthropometry.ui.gPerDay')}</span></div>
                    <div className="text-[11px] text-gray-500 mt-0.5">{ti('anthropometry.ui.proteinFooter', [round(masaMagraKg, 1)])}</div>
                  </div>
                </div>
              </Panel>
            </div>

            {/* Evolución de peso */}
            {weightHistory.length >= 2 && (
              <Panel title={t('anthropometry.ui.evolutionTitle')} subtitle={ti('anthropometry.ui.evolutionSubtitle', [weightHistory.length])} onInfo={() => setInfoKey('evolution')}>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weightHistory} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE8" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(v) => { try { return format(parseISO(v), 'dd MMM', { locale: dateLocale }); } catch { return v; } }} />
                      <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} domain={['auto', 'auto']} />
                      <Tooltip formatter={(v: any) => `${v} kg`} labelFormatter={(v: any) => { try { return format(parseISO(v), 'dd MMM yyyy', { locale: dateLocale }); } catch { return v; } }} />
                      <Line type="monotone" dataKey="peso" stroke="#0f766e" strokeWidth={2} dot={{ r: 3, fill: '#0f766e' }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Panel>
            )}

            <Panel title={t('anthropometry.charts.tmb')} subtitle={t('anthropometry.kpi.tmb')}>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tmbData} layout="vertical" margin={{ top: 10, right: 30, left: 80, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE8" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} width={120} />
                    <Tooltip formatter={(v: any) => `${v} kcal`} />
                    <Bar dataKey="kcal" radius={[0, 6, 6, 0]} fill="#0f766e" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title={t('anthropometry.charts.macros')} subtitle={`${round(calObjetivo, 0)} kcal · 40/30/30`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={macros} cx="50%" cy="50%" outerRadius={85} dataKey="value" label={(e: any) => `${e.value}g`}>
                        {macros.map((m, i) => <Cell key={i} fill={m.color} />)}
                      </Pie>
                      <Tooltip formatter={(v: any) => `${v} g`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col justify-center gap-3">
                  {macros.map(m => (
                    <div key={m.name} className="flex items-center justify-between p-3 rounded-md" style={{ border: '1px solid #E8E5DE' }}>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.color }} />
                        <span className="text-[13px] text-gray-700">{m.name}</span>
                      </div>
                      <span className="text-[14px] font-semibold tabular-nums text-gray-900">{m.value} g</span>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Panel title={t('anthropometry.charts.whr')} subtitle={labelRisk(claseWHR.key)} onInfo={() => setInfoKey('whr')}>
                <RiskMeter
                  value={indiceCC}
                  fmt={v => v.toFixed(2)}
                  color={claseWHR.color}
                  zones={sexo === 'male'
                    ? [{ to: 0.9, label: t('anthropometry.risk.low'), color: '#10b981' }, { to: 1.0, label: t('anthropometry.risk.moderate'), color: '#f59e0b' }, { to: 1.2, label: t('anthropometry.risk.high'), color: '#ef4444' }]
                    : [{ to: 0.8, label: t('anthropometry.risk.low'), color: '#10b981' }, { to: 0.85, label: t('anthropometry.risk.moderate'), color: '#f59e0b' }, { to: 1.1, label: t('anthropometry.risk.high'), color: '#ef4444' }]}
                />
              </Panel>
              <Panel title={t('anthropometry.charts.whtr')} subtitle={labelWhtr(claseWHtR.key)} onInfo={() => setInfoKey('whtr')}>
                <RiskMeter
                  value={indiceCA}
                  fmt={v => v.toFixed(2)}
                  color={claseWHtR.color}
                  zones={[
                    { to: 0.4, label: t('anthropometry.bmiClass.underweight'), color: '#3b82f6' },
                    { to: 0.5, label: t('anthropometry.bmiClass.normal'),      color: '#10b981' },
                    { to: 0.6, label: t('anthropometry.bmiClass.overweight'),  color: '#f59e0b' },
                    { to: 1.0, label: t('anthropometry.bmiClass.obese1'),      color: '#ef4444' },
                  ]}
                />
              </Panel>
            </div>

            <Panel title={t('anthropometry.summary.title')} subtitle={t('anthropometry.charts.risks')}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <SummaryRow icon={<Scale className="w-3.5 h-3.5" />} label={t('anthropometry.kpi.bmi')} value={`${round(imc, 1)}`} sub={labelBmi(claseIMC.key)} />
                <SummaryRow icon={<Dumbbell className="w-3.5 h-3.5" />} label={t('anthropometry.kpi.leanMass')} value={`${round(masaMagraKg, 1)} kg`} />
                <SummaryRow icon={<HeartPulse className="w-3.5 h-3.5" />} label={t('anthropometry.kpi.fatPct')} value={`${round(grasaPctFinal, 1)}%`} />
                <SummaryRow icon={<Flame className="w-3.5 h-3.5" />} label={t('anthropometry.kpi.tmb')} value={`${round(tmb, 0)} kcal`} />
                <SummaryRow icon={<Activity className="w-3.5 h-3.5" />} label={t('anthropometry.kpi.get')} value={`${round(get, 0)} kcal`} />
                <SummaryRow icon={<Target className="w-3.5 h-3.5" />} label={t('anthropometry.kpi.targetKcal')} value={`${round(calObjetivo, 0)} kcal`} />
              </div>
            </Panel>
          </section>
        </div>

        {/* Stepper navigation */}
        <div className="max-w-2xl mx-auto mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setCurrentStep(s => Math.max(1, s - 1))}
            disabled={currentStep === 1}
            className="px-4 py-2 border border-gray-300 rounded-md text-[12px] text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> {t('anthropometry.stepper.prev')}
          </button>
          <span className="text-[11px] text-gray-400 tabular-nums">{currentStep} / 5</span>
          {currentStep < 5 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(s => Math.min(5, s + 1))}
              className="px-4 py-2 bg-emerald-600 text-white rounded-md text-[12px] font-medium hover:bg-emerald-700 flex items-center gap-1.5"
            >
              {currentStep === 3 ? t('anthropometry.stepper.skip') : t('anthropometry.stepper.next')}
              <ChevronLeft className="w-3.5 h-3.5 rotate-180" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-emerald-600 text-white rounded-md text-[12px] font-medium hover:bg-emerald-700 disabled:opacity-60 flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" /> {saving ? t('anthropometry.saving') : t('common.save')}
            </button>
          )}
        </div>
      </div>

      {/* Confirm delete */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/35 flex items-center justify-center z-50">
          <div className="bg-white rounded-md w-full max-w-xs p-5" style={{ border: '1px solid #E8E5DE' }}>
            <p className="text-sm font-semibold text-gray-800 mb-1">{t('anthropometry.deleteTitle')}</p>
            <p className="text-xs text-gray-500 mb-4">{t('anthropometry.deleteMsg')}</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowDelete(false)} className="px-3 py-1 border border-gray-300 rounded text-[11px] text-gray-700 hover:bg-gray-50">{t('common.cancel')}</button>
              <button onClick={handleDelete} className="px-3 py-1 bg-red-600 text-white rounded text-[11px] hover:bg-red-700">{t('common.delete')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Info modal */}
      {infoKey && (() => {
        const info: any = t(`anthropometry.info.${infoKey}`);
        const valid = info && typeof info === 'object' && !Array.isArray(info);
        return (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setInfoKey(null)}>
          <div className="bg-white rounded-md w-full max-w-md overflow-hidden" style={{ border: '1px solid #E8E5DE', boxShadow: '0 16px 40px -12px rgba(120, 100, 80, 0.22)' }} onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-3 border-b border-gray-100">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{t('anthropometry.ui.infoLabel')}</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">{valid ? info.title : ''}</p>
            </div>
            <div className="px-5 py-4 text-[12px] text-gray-700 space-y-2 leading-relaxed">
              {valid && info.intro && <p>{info.intro}</p>}
              {valid && info.listTitle && <p>{info.listTitle}</p>}
              {valid && Array.isArray(info.list) && info.list.length > 0 && (
                <ul className="list-disc pl-4 space-y-0.5">
                  {info.list.map((item: string, i: number) => <li key={i}>{item}</li>)}
                </ul>
              )}
              {valid && info.note && <p className="text-gray-500">{info.note}</p>}
            </div>
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button onClick={() => setInfoKey(null)} className="px-3 py-1 bg-emerald-600 text-white rounded text-[11px] hover:bg-emerald-700">{t('anthropometry.ui.gotIt')}</button>
            </div>
          </div>
        </div>
        );
      })()}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Subcomponentes UI
// ──────────────────────────────────────────────────────────
function Card({ title, icon, children, step, subtitle }: { title: string; icon?: React.ReactNode; children: React.ReactNode; step?: number; subtitle?: string }) {
  return (
    <div className="bg-white rounded-xl p-5" style={{ border: '1px solid #E8E5DE' }}>
      <div className="flex items-start gap-2.5 mb-4">
        {step !== undefined ? (
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600 text-white text-[11px] font-semibold flex-shrink-0 mt-0.5">{step}</span>
        ) : icon ? (
          <span className="text-gray-400 mt-0.5">{icon}</span>
        ) : null}
        <div className="flex-1 min-w-0">
          <h3 className="text-[13px] font-semibold text-gray-900 leading-tight">{title}</h3>
          {subtitle && <p className="text-[11px] text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
function Panel({ title, subtitle, children, onInfo }: { title: string; subtitle?: string; children: React.ReactNode; onInfo?: () => void }) {
  return (
    <div className="bg-white rounded-xl p-5" style={{ border: '1px solid #E8E5DE' }}>
      <div className="mb-4 flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-[14px] font-semibold text-gray-900 tracking-tight">{title}</h3>
          {subtitle && <p className="text-[12px] text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {onInfo && (
          <button
            type="button"
            onClick={onInfo}
            className="flex-shrink-0 p-1 -mr-1 -mt-0.5 text-gray-400 hover:text-emerald-600 transition-colors rounded"
            aria-label="info"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
function FieldRow({ children }: { children: React.ReactNode }) { return <div>{children}</div>; }
function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-[11px] font-medium text-gray-500 mb-1.5">{children}</label>;
}
function NumberInput({ value, onChange, min, max, step = 1, hint, onFocus, onBlur }: { value: number; onChange: (n: number) => void; min?: number; max?: number; step?: number; hint?: string; onFocus?: () => void; onBlur?: () => void }) {
  return (
    <>
      <input
        type="number"
        value={Number.isFinite(value) ? value : ''}
        min={min} max={max} step={step}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        onFocus={onFocus}
        onBlur={onBlur}
        className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded-sm text-xs focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 tabular-nums"
      />
      {hint && <p className="text-[10px] text-gray-400 mt-1 leading-tight">{hint}</p>}
    </>
  );
}
// Fila con mini-foto + label + input para mediciones corporales
function MeasureRow({ icon, active, label, children }: { icon: React.ReactNode; active: boolean; label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={`w-14 h-14 flex-shrink-0 rounded-lg flex items-center justify-center transition-colors p-1.5 ${
          active ? 'bg-emerald-50 border border-emerald-200' : 'bg-stone-50 border border-stone-200'
        }`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <label className={`block text-[11px] font-medium mb-1 ${active ? 'text-emerald-700' : 'text-gray-600'}`}>{label}</label>
        {children}
      </div>
    </div>
  );
}
function ToggleBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 px-2 py-1.5 rounded-sm text-xs font-medium transition-colors border ${active ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
    >
      {children}
    </button>
  );
}
function Kpi({ label, value, hint, color, icon, onInfo }: { label: string; value: string; hint?: string; color?: string; icon?: React.ReactNode; onInfo?: () => void }) {
  return (
    <div className="bg-white rounded-xl p-4" style={{ border: '1px solid #E8E5DE' }}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{label}</span>
          {onInfo && (
            <button type="button" onClick={onInfo} className="text-gray-300 hover:text-gray-600" aria-label="Info">
              <Info className="w-3 h-3" />
            </button>
          )}
        </div>
        {icon && <span style={{ color }}>{icon}</span>}
      </div>
      <div className="text-2xl font-semibold tabular-nums text-gray-900" style={{ letterSpacing: '-0.02em' }}>{value}</div>
      {hint && <div className="text-[11px] text-gray-500 mt-0.5">{hint}</div>}
    </div>
  );
}

function DeltaCard({ label, current, previous, unit, lowerIsBetter }: { label: string; current: number; previous: number; unit: string; lowerIsBetter?: boolean }) {
  const delta = round(current - previous, 1);
  const isZero = Math.abs(delta) < 0.05;
  const positive = delta > 0;
  const good = isZero ? null : (lowerIsBetter ? !positive : positive);
  const color = good === null ? '#6b7280' : good ? '#10b981' : '#ef4444';
  const Icon = isZero ? Minus : positive ? TrendingUp : TrendingDown;
  return (
    <div className="p-3 rounded-md bg-white" style={{ border: '1px solid #E8E5DE' }}>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">{label}</div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-base font-semibold tabular-nums text-gray-900">{round(current, 1)}{unit && <span className="text-[10px] text-gray-400 ml-0.5">{unit}</span>}</span>
      </div>
      <div className="flex items-center gap-1 mt-1.5" style={{ color }}>
        <Icon className="w-3 h-3" />
        <span className="text-[11px] font-medium tabular-nums">
          {isZero ? '0' : `${positive ? '+' : ''}${delta}`}{unit && ` ${unit}`}
        </span>
        <span className="text-[10px] text-gray-400 ml-0.5">vs {round(previous, 1)}{unit}</span>
      </div>
    </div>
  );
}

// Stepper visual con 5 pasos
function Stepper({ currentStep, onStepChange, t }: { currentStep: number; onStepChange: (n: number) => void; t: (k: string) => any }) {
  const steps = [
    { n: 1, label: t('anthropometry.stepper.s1'), sub: t('anthropometry.stepper.s1Sub') },
    { n: 2, label: t('anthropometry.stepper.s2'), sub: t('anthropometry.stepper.s2Sub') },
    { n: 3, label: t('anthropometry.stepper.s3'), sub: t('anthropometry.stepper.s3Sub') },
    { n: 4, label: t('anthropometry.stepper.s4'), sub: t('anthropometry.stepper.s4Sub') },
    { n: 5, label: t('anthropometry.stepper.s5'), sub: t('anthropometry.stepper.s5Sub') },
  ];
  return (
    <div className="mb-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between relative">
        {/* línea de progreso de fondo */}
        <div className="absolute top-4 left-[10%] right-[10%] h-0.5 bg-gray-200 -z-0" />
        <div
          className="absolute top-4 left-[10%] h-0.5 bg-emerald-500 -z-0 transition-all"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 80}%` }}
        />
        {steps.map(s => {
          const done = s.n < currentStep;
          const active = s.n === currentStep;
          return (
            <button
              key={s.n}
              type="button"
              onClick={() => onStepChange(s.n)}
              className="relative z-10 flex flex-col items-center gap-1.5 group"
            >
              <span
                className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-[12px] font-semibold transition-all ${
                  active
                    ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                    : done
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white text-gray-400 border border-gray-300 group-hover:border-emerald-400'
                }`}
              >
                {done ? '✓' : s.n}
              </span>
              <div className="text-center">
                <div className={`text-[11px] font-medium leading-tight ${active ? 'text-emerald-700' : done ? 'text-gray-700' : 'text-gray-400'}`}>{s.label}</div>
                <div className="text-[9px] text-gray-400 leading-tight hidden sm:block max-w-[80px]">{s.sub}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Mini-sketch por medición — se muestra al lado de cada input
type MiniKind = 'waist' | 'hip' | 'neck' | 'tricipital' | 'subescapular' | 'suprailiaco' | 'arm' | 'calf' | 'wrist';
function MiniSketch({ kind, active }: { kind: MiniKind; active: boolean }) {
  const base = '#F5F3EE';
  const stroke = '#D6D3D1';
  const accent = active ? '#059669' : '#9CA3AF';
  const sw = active ? 1.8 : 1.1;
  const dash = active ? '0' : '2 2';
  const common = { width: '100%', height: '100%', viewBox: '0 0 70 70' as string, 'aria-hidden': true };

  switch (kind) {
    case 'waist':
      return (
        <svg {...common}>
          <path d="M 22 8 Q 20 18 18 26 Q 14 36 18 46 Q 22 56 24 62 L 46 62 Q 48 56 52 46 Q 56 36 52 26 Q 50 18 48 8 Q 35 5 22 8 Z" fill={base} stroke={stroke} strokeWidth={1} />
          <ellipse cx={35} cy={36} rx={19} ry={3} fill="none" stroke={accent} strokeWidth={sw} strokeDasharray={dash} />
          <rect x={32} y={33} width={6} height={6} fill={accent} opacity={active ? 1 : 0.5} rx={1} />
        </svg>
      );
    case 'hip':
      return (
        <svg {...common}>
          <path d="M 26 8 L 26 28 Q 14 36 12 50 Q 12 60 22 64 L 48 64 Q 58 60 58 50 Q 56 36 44 28 L 44 8 Z" fill={base} stroke={stroke} strokeWidth={1} />
          <ellipse cx={35} cy={48} rx={23} ry={3.5} fill="none" stroke={accent} strokeWidth={sw} strokeDasharray={dash} />
          <rect x={32} y={45} width={6} height={6} fill={accent} opacity={active ? 1 : 0.5} rx={1} />
        </svg>
      );
    case 'neck':
      return (
        <svg {...common}>
          <circle cx={35} cy={20} r={11} fill={base} stroke={stroke} strokeWidth={1} />
          <path d="M 28 30 L 28 42 Q 22 46 22 56 L 48 56 Q 48 46 42 42 L 42 30 Z" fill={base} stroke={stroke} strokeWidth={1} />
          <ellipse cx={35} cy={36} rx={9} ry={2.5} fill="none" stroke={accent} strokeWidth={sw} strokeDasharray={dash} />
          <rect x={32} y={34} width={6} height={5} fill={accent} opacity={active ? 1 : 0.5} rx={1} />
        </svg>
      );
    case 'tricipital':
      return (
        <svg {...common}>
          {/* brazo vertical */}
          <path d="M 30 8 Q 28 30 30 52 Q 31 60 28 64 L 42 64 Q 39 60 40 52 Q 42 30 40 8 Z" fill={base} stroke={stroke} strokeWidth={1} />
          {/* caliper pinch en cara posterior */}
          <line x1={28} y1={32} x2={16} y2={26} stroke={accent} strokeWidth={sw} />
          <line x1={28} y1={40} x2={16} y2={46} stroke={accent} strokeWidth={sw} />
          <circle cx={16} cy={36} r={2.5} fill={accent} />
          <text x={2} y={62} fontSize="6" fill={accent} fontWeight={active ? 600 : 400}>caliper</text>
        </svg>
      );
    case 'subescapular':
      return (
        <svg {...common}>
          {/* espalda */}
          <path d="M 14 12 L 14 56 Q 16 62 22 64 L 48 64 Q 54 62 56 56 L 56 12 Q 35 6 14 12 Z" fill={base} stroke={stroke} strokeWidth={1} />
          {/* escápula */}
          <path d="M 22 18 L 32 30 L 18 26 Z" fill="none" stroke="#E0DDD5" strokeWidth={0.8} />
          {/* caliper */}
          <line x1={32} y1={34} x2={44} y2={32} stroke={accent} strokeWidth={sw} />
          <line x1={32} y1={40} x2={44} y2={42} stroke={accent} strokeWidth={sw} />
          <circle cx={46} cy={37} r={2.5} fill={accent} />
        </svg>
      );
    case 'suprailiaco':
      return (
        <svg {...common}>
          {/* tronco bajo + cresta ilíaca */}
          <path d="M 18 8 Q 16 28 14 42 Q 14 56 22 64 L 48 64 Q 56 56 56 42 Q 54 28 52 8 Z" fill={base} stroke={stroke} strokeWidth={1} />
          {/* hueso ilíaco insinuado */}
          <path d="M 16 42 Q 35 36 54 42" fill="none" stroke="#E0DDD5" strokeWidth={0.8} />
          {/* caliper sobre cresta */}
          <line x1={42} y1={38} x2={54} y2={34} stroke={accent} strokeWidth={sw} />
          <line x1={42} y1={44} x2={54} y2={48} stroke={accent} strokeWidth={sw} />
          <circle cx={56} cy={41} r={2.5} fill={accent} />
        </svg>
      );
    case 'arm':
      return (
        <svg {...common}>
          <path d="M 28 6 Q 26 30 28 50 Q 29 60 26 64 L 44 64 Q 41 60 42 50 Q 44 30 42 6 Z" fill={base} stroke={stroke} strokeWidth={1} />
          <ellipse cx={35} cy={32} rx={9} ry={2.5} fill="none" stroke={accent} strokeWidth={sw} strokeDasharray={dash} />
          <rect x={32} y={30} width={6} height={5} fill={accent} opacity={active ? 1 : 0.5} rx={1} />
        </svg>
      );
    case 'calf':
      return (
        <svg {...common}>
          {/* pantorrilla */}
          <path d="M 26 6 L 26 28 Q 18 36 20 50 Q 22 60 26 64 L 44 64 Q 48 60 50 50 Q 52 36 44 28 L 44 6 Z" fill={base} stroke={stroke} strokeWidth={1} />
          <ellipse cx={35} cy={42} rx={15} ry={3} fill="none" stroke={accent} strokeWidth={sw} strokeDasharray={dash} />
          <rect x={32} y={39} width={6} height={6} fill={accent} opacity={active ? 1 : 0.5} rx={1} />
        </svg>
      );
    case 'wrist':
      return (
        <svg {...common}>
          {/* antebrazo + mano */}
          <rect x={10} y={28} width={28} height={14} rx={3} fill={base} stroke={stroke} strokeWidth={1} />
          <path d="M 38 26 L 56 22 Q 60 28 60 35 Q 60 42 56 48 L 38 44 Z" fill={base} stroke={stroke} strokeWidth={1} />
          <ellipse cx={38} cy={35} rx={2.5} ry={9} fill="none" stroke={accent} strokeWidth={sw} strokeDasharray={dash} />
          <rect x={36} y={33} width={5} height={5} fill={accent} opacity={active ? 1 : 0.5} rx={1} />
        </svg>
      );
  }
}

// Esquema avanzado: brazo + pliegues + caliper
function AdvancedSchematic({ highlight }: { highlight: string | null }) {
  const isOn = (k: string) => highlight === k;
  const ringActive = '#059669';
  const ringIdle = '#D6D3D1';
  const labelActive = '#065F46';
  const labelIdle = '#9CA3AF';

  return (
    <div className="flex justify-center mb-3 -mt-1">
      <svg viewBox="0 0 200 165" className="w-full max-w-[280px] h-auto" aria-hidden>
        {/* Brazo (vertical) ── pliegue tricipital + perímetro brazo */}
        <g>
          {/* hombro a codo */}
          <path d="M 30 25 Q 28 60 32 95 Q 34 105 30 115" fill="#F5F3EE" stroke="#D6D3D1" strokeWidth={1} />
          <path d="M 50 25 Q 52 60 48 95 Q 46 105 50 115" fill="#F5F3EE" stroke="#D6D3D1" strokeWidth={1} />
          <path d="M 30 25 Q 40 22 50 25" fill="#F5F3EE" stroke="#D6D3D1" strokeWidth={1} />
          <path d="M 30 115 L 32 130 L 48 130 L 50 115 Z" fill="#F5F3EE" stroke="#D6D3D1" strokeWidth={1} />

          {/* Anillo perímetro brazo */}
          <ellipse cx={40} cy={70} rx={11} ry={2.5} fill="none" stroke={isOn('arm') ? ringActive : ringIdle} strokeWidth={isOn('arm') ? 2 : 1.2} strokeDasharray={isOn('arm') ? '0' : '2 2'} />
          <line x1={51} y1={70} x2={62} y2={70} stroke={isOn('arm') ? ringActive : ringIdle} strokeWidth={1} />
          <text x={64} y={72} fontSize="6" fill={isOn('arm') ? labelActive : labelIdle} fontWeight={isOn('arm') ? 600 : 400}>brazo</text>

          {/* Pliegue tricipital — pinza en cara posterior del brazo */}
          <g>
            <line x1={28} y1={62} x2={20} y2={58} stroke={isOn('tricipital') ? ringActive : ringIdle} strokeWidth={isOn('tricipital') ? 2 : 1.2} />
            <line x1={28} y1={68} x2={20} y2={72} stroke={isOn('tricipital') ? ringActive : ringIdle} strokeWidth={isOn('tricipital') ? 2 : 1.2} />
            <circle cx={20} cy={65} r={2} fill={isOn('tricipital') ? ringActive : ringIdle} />
            <text x={4} y={88} fontSize="5.5" fill={isOn('tricipital') ? labelActive : labelIdle} fontWeight={isOn('tricipital') ? 600 : 400}>tricipital</text>
          </g>
        </g>

        {/* Torso parcial (espalda + cresta ilíaca) ── subescapular + suprailíaco */}
        <g>
          <path d="M 80 30 L 80 100 Q 82 110 90 115 L 130 115 Q 138 110 140 100 L 140 30 Q 110 22 80 30 Z" fill="#F5F3EE" stroke="#D6D3D1" strokeWidth={1} />
          {/* Escápula insinuada */}
          <path d="M 92 38 L 100 55 L 88 50 Z" fill="none" stroke="#E0DDD5" strokeWidth={0.8} />

          {/* Pliegue subescapular */}
          <g>
            <line x1={102} y1={58} x2={112} y2={56} stroke={isOn('subescapular') ? ringActive : ringIdle} strokeWidth={isOn('subescapular') ? 2 : 1.2} />
            <line x1={102} y1={62} x2={112} y2={64} stroke={isOn('subescapular') ? ringActive : ringIdle} strokeWidth={isOn('subescapular') ? 2 : 1.2} />
            <circle cx={114} cy={60} r={2} fill={isOn('subescapular') ? ringActive : ringIdle} />
            <line x1={117} y1={60} x2={148} y2={48} stroke={isOn('subescapular') ? ringActive : ringIdle} strokeWidth={0.8} />
            <text x={150} y={50} fontSize="6" fill={isOn('subescapular') ? labelActive : labelIdle} fontWeight={isOn('subescapular') ? 600 : 400}>subescapular</text>
          </g>

          {/* Pliegue suprailíaco — encima cadera */}
          <g>
            <line x1={128} y1={92} x2={138} y2={90} stroke={isOn('suprailiaco') ? ringActive : ringIdle} strokeWidth={isOn('suprailiaco') ? 2 : 1.2} />
            <line x1={128} y1={96} x2={138} y2={98} stroke={isOn('suprailiaco') ? ringActive : ringIdle} strokeWidth={isOn('suprailiaco') ? 2 : 1.2} />
            <circle cx={140} cy={94} r={2} fill={isOn('suprailiaco') ? ringActive : ringIdle} />
            <line x1={143} y1={94} x2={158} y2={104} stroke={isOn('suprailiaco') ? ringActive : ringIdle} strokeWidth={0.8} />
            <text x={150} y={114} fontSize="6" fill={isOn('suprailiaco') ? labelActive : labelIdle} fontWeight={isOn('suprailiaco') ? 600 : 400}>suprailíaco</text>
          </g>
        </g>

        {/* Pierna ── pantorrilla */}
        <g>
          <path d="M 90 130 Q 88 145 92 158 L 102 158 Q 100 145 98 130 Z" fill="#F5F3EE" stroke="#D6D3D1" strokeWidth={1} />
          <ellipse cx={95} cy={145} rx={7} ry={2} fill="none" stroke={isOn('calf') ? ringActive : ringIdle} strokeWidth={isOn('calf') ? 2 : 1.2} strokeDasharray={isOn('calf') ? '0' : '2 2'} />
          <line x1={102} y1={145} x2={112} y2={145} stroke={isOn('calf') ? ringActive : ringIdle} strokeWidth={1} />
          <text x={114} y={147} fontSize="5.5" fill={isOn('calf') ? labelActive : labelIdle} fontWeight={isOn('calf') ? 600 : 400}>pantorrilla</text>
        </g>

        {/* Mano + muñeca */}
        <g>
          <rect x={170} y={55} width={14} height={30} rx={3} fill="#F5F3EE" stroke="#D6D3D1" strokeWidth={1} />
          <rect x={172} y={85} width={10} height={22} rx={2} fill="#F5F3EE" stroke="#D6D3D1" strokeWidth={1} />
          <ellipse cx={177} cy={85} rx={7} ry={1.8} fill="none" stroke={isOn('wrist') ? ringActive : ringIdle} strokeWidth={isOn('wrist') ? 2 : 1.2} strokeDasharray={isOn('wrist') ? '0' : '2 2'} />
          <line x1={184} y1={85} x2={194} y2={85} stroke={isOn('wrist') ? ringActive : ringIdle} strokeWidth={1} />
          <text x={170} y={120} fontSize="5.5" fill={isOn('wrist') ? labelActive : labelIdle} fontWeight={isOn('wrist') ? 600 : 400}>muñeca</text>
        </g>
      </svg>
    </div>
  );
}

function BodySchematic({ highlight, sex }: { highlight: 'waist' | 'hip' | 'neck' | null; sex: 'male' | 'female' }) {
  // Coordenadas de los anillos de medición sobre la silueta (viewBox 100x180)
  const isFem = sex === 'female';
  const neckY = 38;
  const waistY = 88;
  const hipY = isFem ? 118 : 115;
  const torsoMidX = 50;

  const ringActive = '#059669';
  const ringIdle = '#D6D3D1';
  const labelActive = '#065F46';
  const labelIdle = '#9CA3AF';

  const Ring = ({ y, rx, label, kind }: { y: number; rx: number; label: string; kind: 'waist' | 'hip' | 'neck' }) => {
    const isOn = highlight === kind;
    return (
      <g style={{ transition: 'all 200ms ease' }}>
        <ellipse
          cx={torsoMidX}
          cy={y}
          rx={rx}
          ry={3}
          fill="none"
          stroke={isOn ? ringActive : ringIdle}
          strokeWidth={isOn ? 2 : 1.2}
          strokeDasharray={isOn ? '0' : '2 2'}
        />
        <line
          x1={torsoMidX + rx + 2}
          y1={y}
          x2={torsoMidX + rx + 14}
          y2={y}
          stroke={isOn ? ringActive : ringIdle}
          strokeWidth={isOn ? 1.5 : 1}
        />
        <text
          x={torsoMidX + rx + 16}
          y={y + 2.5}
          fontSize="6"
          fill={isOn ? labelActive : labelIdle}
          fontWeight={isOn ? 600 : 400}
        >
          {label}
        </text>
      </g>
    );
  };

  // Silueta simple: cabeza + cuello + torso (forma diferente femenino/masculino) + piernas
  const torsoPath = isFem
    ? 'M 38 50 Q 30 70 32 88 Q 28 105 32 122 Q 35 135 40 145 L 60 145 Q 65 135 68 122 Q 72 105 68 88 Q 70 70 62 50 Z'
    : 'M 36 50 Q 30 70 34 88 Q 32 105 35 122 Q 38 135 42 145 L 58 145 Q 62 135 65 122 Q 68 105 66 88 Q 70 70 64 50 Z';

  return (
    <div className="flex justify-center mb-3 -mt-1">
      <svg viewBox="0 0 130 165" className="w-full max-w-[200px] h-auto" aria-hidden>
        {/* Cabeza */}
        <circle cx={50} cy={26} r={11} fill="#F5F3EE" stroke="#D6D3D1" strokeWidth={1} />
        {/* Cuello */}
        <rect x={45} y={36} width={10} height={8} fill="#F5F3EE" stroke="#D6D3D1" strokeWidth={1} />
        {/* Torso */}
        <path d={torsoPath} fill="#F5F3EE" stroke="#D6D3D1" strokeWidth={1} />
        {/* Hombros (insinuados) */}
        <path d="M 30 52 Q 50 46 70 52" fill="none" stroke="#D6D3D1" strokeWidth={1} strokeLinecap="round" />
        {/* Piernas */}
        <path d="M 40 145 L 38 162 M 60 145 L 62 162" stroke="#D6D3D1" strokeWidth={1.5} strokeLinecap="round" fill="none" />

        {/* Anillos de medición */}
        <Ring y={neckY} rx={7} label="cuello" kind="neck" />
        <Ring y={waistY} rx={isFem ? 12 : 14} label="cintura" kind="waist" />
        <Ring y={hipY} rx={isFem ? 17 : 14} label="cadera" kind="hip" />
      </svg>
    </div>
  );
}

function HealthyWeightBar({ current, target, min, max, zoneLabel }: { current: number; target: number; min: number; max: number; zoneLabel: string }) {
  // Range visualization: lower 25% = under, middle 50% = healthy, upper 25% = over
  // Map peso range from min-10 to max+10
  const lo = Math.min(min - 10, current - 5, target - 5);
  const hi = Math.max(max + 10, current + 5, target + 5);
  const span = hi - lo;
  const pos = (v: number) => Math.max(0, Math.min(100, ((v - lo) / span) * 100));
  return (
    <div className="pt-2">
      <div className="relative h-3 rounded-full bg-gray-100 overflow-visible">
        {/* zona saludable */}
        <div className="absolute top-0 bottom-0 bg-emerald-100 border border-emerald-300" style={{ left: `${pos(min)}%`, width: `${pos(max) - pos(min)}%` }} />
        {/* objetivo */}
        <div className="absolute -top-1 w-0.5 h-5 bg-blue-500" style={{ left: `${pos(target)}%` }} title={`Objetivo: ${round(target, 1)} kg`} />
        {/* actual */}
        <div className="absolute -top-2 -translate-x-1/2 flex flex-col items-center" style={{ left: `${pos(current)}%` }}>
          <span className="text-[10px] font-semibold text-gray-900 tabular-nums whitespace-nowrap">{round(current, 1)}</span>
          <div className="w-3 h-3 rounded-full bg-gray-900 border-2 border-white mt-0.5" />
        </div>
      </div>
      <div className="flex justify-between mt-3 text-[10px] text-gray-500 tabular-nums">
        <span>{round(lo, 0)}</span>
        <span className="text-emerald-700 font-medium">{round(min, 1)}–{round(max, 1)} {zoneLabel}</span>
        <span>{round(hi, 0)}</span>
      </div>
    </div>
  );
}
function SummaryRow({ icon, label, value, sub }: { icon?: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="p-3 rounded-md" style={{ border: '1px solid #E8E5DE' }}>
      <div className="flex items-center gap-1.5 text-gray-500 mb-1">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-[15px] font-semibold tabular-nums text-gray-900">{value}</div>
      {sub && <div className="text-[11px] text-gray-500">{sub}</div>}
    </div>
  );
}
function RiskMeter({ value, fmt, color, zones }: { value: number; fmt: (v: number) => string; color: string; zones: { to: number; label: string; color: string }[] }) {
  const max = zones[zones.length - 1].to;
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <span className="text-3xl font-semibold tabular-nums" style={{ letterSpacing: '-0.02em', color }}>{fmt(value)}</span>
      </div>
      <div className="relative h-2.5 rounded-full overflow-hidden flex">
        {zones.map((z, i) => {
          const prev = i === 0 ? 0 : zones[i - 1].to;
          return <div key={i} style={{ flex: z.to - prev, backgroundColor: z.color }} />;
        })}
        <div className="absolute -top-1 w-0.5 h-4 bg-gray-900" style={{ left: `${pct}%` }} />
      </div>
      <div className="flex justify-between mt-2 text-[10px] text-gray-500">
        {zones.map(z => <span key={z.label}>{z.label}</span>)}
      </div>
    </div>
  );
}
