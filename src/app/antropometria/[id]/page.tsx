'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { format, parseISO, differenceInYears } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, RadialBarChart, RadialBar, PolarAngleAxis,
} from 'recharts';
import {
  Ruler, Scale, Activity, Target, Flame, HeartPulse, Dumbbell, Info,
  ChevronLeft, Save, Trash2, X,
} from 'lucide-react';
import { app, patientService } from '@/app/shared/firebase';
import {
  getFirestore, collection, addDoc, doc, getDoc, updateDoc, deleteDoc, serverTimestamp,
} from 'firebase/firestore';

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
const ACTIVIDAD_LABEL: Record<Actividad, string> = {
  sedentary: 'Sedentario',
  light: 'Ligero (1-3 d/sem)',
  moderate: 'Moderado (3-5 d/sem)',
  active: 'Activo (6-7 d/sem)',
  very_active: 'Muy activo',
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
  if (imc < 18.5) return { label: 'Bajo peso', color: '#3b82f6' };
  if (imc < 25)   return { label: 'Normopeso', color: '#10b981' };
  if (imc < 30)   return { label: 'Sobrepeso', color: '#f59e0b' };
  if (imc < 35)   return { label: 'Obesidad I', color: '#ef4444' };
  if (imc < 40)   return { label: 'Obesidad II', color: '#dc2626' };
  return { label: 'Obesidad III', color: '#991b1b' };
};
const pesoIdealDevine = (sexo: Sexo, alturaCm: number) => {
  const inches = alturaCm / 2.54;
  const over60 = Math.max(0, inches - 60);
  return sexo === 'male' ? 50 + 2.3 * over60 : 45.5 + 2.3 * over60;
};
const pesoIdealRobinson = (sexo: Sexo, alturaCm: number) => {
  const inches = alturaCm / 2.54;
  const over60 = Math.max(0, inches - 60);
  return sexo === 'male' ? 52 + 1.9 * over60 : 49 + 1.7 * over60;
};
const pesoIdealLorentz = (sexo: Sexo, alturaCm: number) => {
  const div = sexo === 'male' ? 4 : 2;
  return alturaCm - 100 - (alturaCm - 150) / div;
};
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
  if (!valor) return { label: '—', color: '#9ca3af' };
  if (sexo === 'male') {
    if (valor < 0.90) return { label: 'Bajo', color: '#10b981' };
    if (valor < 1.00) return { label: 'Moderado', color: '#f59e0b' };
    return { label: 'Alto', color: '#ef4444' };
  }
  if (valor < 0.80) return { label: 'Bajo', color: '#10b981' };
  if (valor < 0.85) return { label: 'Moderado', color: '#f59e0b' };
  return { label: 'Alto', color: '#ef4444' };
};
const whtr = (cintura: number, altura: number) => (altura ? cintura / altura : 0);
const whtrRiesgo = (valor: number) => {
  if (!valor) return { label: '—', color: '#9ca3af' };
  if (valor < 0.4) return { label: 'Delgadez', color: '#3b82f6' };
  if (valor < 0.5) return { label: 'Saludable', color: '#10b981' };
  if (valor < 0.6) return { label: 'Sobrepeso', color: '#f59e0b' };
  return { label: 'Obesidad', color: '#ef4444' };
};

// ──────────────────────────────────────────────────────────
// Página
// ──────────────────────────────────────────────────────────
export default function AntropometriaPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const db = getFirestore(app);

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
  const [tricipital, setTricipital] = useState<number>(0);
  const [subescapular, setSubescapular] = useState<number>(0);
  const [suprailiaco, setSuprailiaco] = useState<number>(0);
  const [actividad, setActividad] = useState<Actividad>('moderate');
  const [objetivo, setObjetivo] = useState<Objetivo>('maintain');
  const [formula, setFormula] = useState<Formula>('mifflin');
  const [notas, setNotas] = useState<string>('');

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
            setActividad(d.actividad || 'moderate');
            setObjetivo(d.objetivo || 'maintain');
            setFormula(d.formula || 'mifflin');
            setNotas(d.notas || '');
          }
        }
      } catch (e: any) {
        console.error(e);
        setError('Error al cargar los datos');
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
  const idealDevine = useMemo(() => pesoIdealDevine(sexo, altura), [sexo, altura]);
  const idealRobinson = useMemo(() => pesoIdealRobinson(sexo, altura), [sexo, altura]);
  const idealLorentz = useMemo(() => pesoIdealLorentz(sexo, altura), [sexo, altura]);
  const idealPromedio = (idealDevine + idealRobinson + idealLorentz) / 3;

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

  const macros = useMemo(() => {
    const carbs = (calObjetivo * 0.40) / 4;
    const prot  = (calObjetivo * 0.30) / 4;
    const fat   = (calObjetivo * 0.30) / 9;
    return [
      { name: 'Carbohidratos', value: round(carbs, 0), color: '#10b981' },
      { name: 'Proteínas',     value: round(prot, 0),  color: '#3b82f6' },
      { name: 'Grasas',        value: round(fat, 0),   color: '#f59e0b' },
    ];
  }, [calObjetivo]);

  const composicionData = [
    { name: 'Masa magra', value: round(masaMagraKg, 1), color: '#10b981' },
    { name: 'Masa grasa', value: round(masaGrasaKg, 1), color: '#f59e0b' },
  ];
  const pesosData = [
    { name: 'Actual',   kg: round(peso, 1),          color: '#0f766e' },
    { name: 'Objetivo', kg: round(pesoObjetivo, 1),  color: '#3b82f6' },
    { name: 'Devine',   kg: round(idealDevine, 1),   color: '#10b981' },
    { name: 'Robinson', kg: round(idealRobinson, 1), color: '#10b981' },
    { name: 'Lorentz',  kg: round(idealLorentz, 1),  color: '#10b981' },
  ];
  const tmbData = [
    { name: 'Mifflin-St Jeor', kcal: round(tmbMif, 0) },
    { name: 'Harris-Benedict', kcal: round(tmbHar, 0) },
    { name: 'Katch-McArdle',   kcal: round(tmbKat, 0) },
  ];
  const imcGauge = [{ name: 'IMC', value: Math.min(imc, 40), fill: claseIMC.color }];

  // ── Acciones ──
  const handleSave = async () => {
    if (!patientId) { setError('Falta patientId en la URL'); return; }
    if (!peso || !altura) { setError('Peso y altura son requeridos'); return; }
    setError(null);
    setSaving(true);
    try {
      const payload: any = {
        patientId, date, sexo, edad, altura, peso, pesoObjetivo,
        cintura, cadera, cuello, tricipital, subescapular, suprailiaco,
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
      setError('Error al guardar: ' + (e?.message || ''));
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
      setError('Error al eliminar');
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
                {id === 'new' ? 'Nueva medición' : 'Editar medición'}
              </p>
              <p className="text-[14px] font-semibold text-gray-900 leading-tight">
                Antropometría {patientName && <span className="text-gray-400 font-normal">· {patientName}</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {id !== 'new' && (
              <button
                onClick={() => setShowDelete(true)}
                className="px-3 py-1.5 border border-gray-300 rounded text-[12px] text-red-600 hover:bg-red-50 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Eliminar
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 bg-emerald-600 text-white rounded text-[12px] font-medium hover:bg-emerald-700 disabled:opacity-60 flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && <div className="bg-red-50 text-red-600 p-2.5 rounded mb-4 text-[12px]">{error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ── Inputs ── */}
          <aside className="lg:col-span-4 space-y-4">
            <Card title="Datos básicos" icon={<Scale className="w-3.5 h-3.5" />}>
              <FieldRow>
                <Label>Fecha de la medición</Label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-md text-[13px] bg-white outline-none focus:ring-2 focus:ring-emerald-200"
                  style={{ border: '1px solid #E8E5DE' }}
                />
              </FieldRow>
              <FieldRow>
                <Label>Sexo</Label>
                <div className="flex gap-2">
                  <ToggleBtn active={sexo === 'female'} onClick={() => setSexo('female')}>Mujer</ToggleBtn>
                  <ToggleBtn active={sexo === 'male'} onClick={() => setSexo('male')}>Hombre</ToggleBtn>
                </div>
              </FieldRow>
              <FieldRow>
                <Label>Edad (años)</Label>
                <NumberInput value={edad} onChange={setEdad} min={1} max={120} />
              </FieldRow>
              <FieldRow>
                <Label>Altura (cm)</Label>
                <NumberInput value={altura} onChange={setAltura} min={50} max={250} step={0.1} />
              </FieldRow>
              <FieldRow>
                <Label>Peso actual (kg)</Label>
                <NumberInput value={peso} onChange={setPeso} min={20} max={350} step={0.1} />
              </FieldRow>
              <FieldRow>
                <Label>Peso objetivo (kg)</Label>
                <NumberInput value={pesoObjetivo} onChange={setPesoObjetivo} min={20} max={350} step={0.1} />
              </FieldRow>
            </Card>

            <Card title="Circunferencias (cm)" icon={<Ruler className="w-3.5 h-3.5" />}>
              <FieldRow><Label>Cintura</Label><NumberInput value={cintura} onChange={setCintura} min={0} max={250} step={0.1} /></FieldRow>
              <FieldRow><Label>Cadera</Label><NumberInput value={cadera} onChange={setCadera} min={0} max={250} step={0.1} /></FieldRow>
              <FieldRow><Label>Cuello</Label><NumberInput value={cuello} onChange={setCuello} min={0} max={80} step={0.1} /></FieldRow>
            </Card>

            <Card title="Pliegues cutáneos (mm)" icon={<Ruler className="w-3.5 h-3.5" />}>
              <FieldRow><Label>Tricipital</Label><NumberInput value={tricipital} onChange={setTricipital} min={0} max={80} step={0.1} /></FieldRow>
              <FieldRow><Label>Subescapular</Label><NumberInput value={subescapular} onChange={setSubescapular} min={0} max={80} step={0.1} /></FieldRow>
              <FieldRow><Label>Suprailíaco</Label><NumberInput value={suprailiaco} onChange={setSuprailiaco} min={0} max={80} step={0.1} /></FieldRow>
            </Card>

            <Card title="Calorías y actividad" icon={<Activity className="w-3.5 h-3.5" />}>
              <FieldRow>
                <Label>Fórmula TMB</Label>
                <select
                  value={formula}
                  onChange={e => setFormula(e.target.value as Formula)}
                  className="w-full px-3 py-2 rounded-md text-[13px] bg-white outline-none focus:ring-2 focus:ring-emerald-200"
                  style={{ border: '1px solid #E8E5DE' }}
                >
                  <option value="mifflin">Mifflin-St Jeor (recomendada)</option>
                  <option value="harris">Harris-Benedict</option>
                  <option value="katch">Katch-McArdle</option>
                </select>
              </FieldRow>
              <FieldRow>
                <Label>Nivel de actividad</Label>
                <select
                  value={actividad}
                  onChange={e => setActividad(e.target.value as Actividad)}
                  className="w-full px-3 py-2 rounded-md text-[13px] bg-white outline-none focus:ring-2 focus:ring-emerald-200"
                  style={{ border: '1px solid #E8E5DE' }}
                >
                  {(Object.keys(ACTIVIDAD_LABEL) as Actividad[]).map(k => (
                    <option key={k} value={k}>{ACTIVIDAD_LABEL[k]}</option>
                  ))}
                </select>
              </FieldRow>
              <FieldRow>
                <Label>Objetivo</Label>
                <div className="grid grid-cols-3 gap-2">
                  <ToggleBtn active={objetivo === 'lose'}     onClick={() => setObjetivo('lose')}>Bajar</ToggleBtn>
                  <ToggleBtn active={objetivo === 'maintain'} onClick={() => setObjetivo('maintain')}>Mantener</ToggleBtn>
                  <ToggleBtn active={objetivo === 'gain'}     onClick={() => setObjetivo('gain')}>Subir</ToggleBtn>
                </div>
              </FieldRow>
            </Card>

            <Card title="Notas">
              <textarea
                value={notas}
                onChange={e => setNotas(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 rounded-md text-[13px] bg-white outline-none focus:ring-2 focus:ring-emerald-200 resize-none"
                style={{ border: '1px solid #E8E5DE' }}
                placeholder="Observaciones, contexto, indicaciones…"
              />
            </Card>
          </aside>

          {/* ── Resultados ── */}
          <section className="lg:col-span-8 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Kpi label="IMC"      value={round(imc, 1).toString()} hint={claseIMC.label} color={claseIMC.color} icon={<Scale className="w-4 h-4" />} />
              <Kpi label="TMB"      value={`${round(tmb, 0)}`} hint="kcal en reposo" color="#0f766e" icon={<Flame className="w-4 h-4" />} />
              <Kpi label="GET"      value={`${round(get, 0)}`} hint={`× ${ACTIVIDAD_FACTOR[actividad]}`} color="#0f766e" icon={<Activity className="w-4 h-4" />} />
              <Kpi label="Objetivo" value={`${round(calObjetivo, 0)}`} hint={objetivo === 'lose' ? 'Déficit −500' : objetivo === 'gain' ? 'Superávit +300' : 'Mantenimiento'} color={objetivo === 'lose' ? '#3b82f6' : objetivo === 'gain' ? '#f59e0b' : '#10b981'} icon={<Target className="w-4 h-4" />} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Panel title="Índice de Masa Corporal" subtitle={claseIMC.label}>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart innerRadius="65%" outerRadius="100%" data={imcGauge} startAngle={210} endAngle={-30}>
                      <PolarAngleAxis type="number" domain={[0, 40]} tick={false} />
                      <RadialBar background dataKey="value" cornerRadius={12} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="-mt-[155px] text-center pointer-events-none">
                    <div className="text-4xl font-semibold tabular-nums" style={{ letterSpacing: '-0.02em', color: claseIMC.color }}>
                      {round(imc, 1)}
                    </div>
                    <div className="text-[11px] uppercase tracking-wider text-gray-400 mt-1">kg/m²</div>
                  </div>
                </div>
              </Panel>

              <Panel title="Composición corporal" subtitle={`${round(grasaPctFinal, 1)}% grasa`}>
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
                <p className="text-[11px] text-gray-500 mt-2 flex items-start gap-1.5">
                  <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  {grasaPctNavy > 0 ? 'Estimado por método U.S. Navy.' : 'Estimado por fórmula de Deurenberg (basada en IMC).'}
                </p>
              </Panel>
            </div>

            <Panel title="Comparativa de peso" subtitle="Actual vs. ideal vs. objetivo">
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pesosData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE8" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                    <Tooltip formatter={(v: any) => `${v} kg`} />
                    <Bar dataKey="kg" radius={[6, 6, 0, 0]}>
                      {pesosData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[12px] text-gray-600 mt-3">
                Peso ideal promedio: <strong className="text-gray-900">{round(idealPromedio, 1)} kg</strong>{' · '}
                diferencia con actual: <strong className="text-gray-900">{round(peso - idealPromedio, 1)} kg</strong>
              </p>
            </Panel>

            <Panel title="Tasa Metabólica Basal" subtitle="Comparación entre fórmulas">
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

            <Panel title="Distribución de macronutrientes" subtitle={`${round(calObjetivo, 0)} kcal · 40/30/30`}>
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
              <Panel title="Cintura / Cadera (WHR)" subtitle={claseWHR.label}>
                <RiskMeter
                  value={indiceCC}
                  fmt={v => v.toFixed(2)}
                  color={claseWHR.color}
                  zones={sexo === 'male'
                    ? [{ to: 0.9, label: 'Bajo', color: '#10b981' }, { to: 1.0, label: 'Moderado', color: '#f59e0b' }, { to: 1.2, label: 'Alto', color: '#ef4444' }]
                    : [{ to: 0.8, label: 'Bajo', color: '#10b981' }, { to: 0.85, label: 'Moderado', color: '#f59e0b' }, { to: 1.1, label: 'Alto', color: '#ef4444' }]}
                />
              </Panel>
              <Panel title="Cintura / Altura" subtitle={claseWHtR.label}>
                <RiskMeter
                  value={indiceCA}
                  fmt={v => v.toFixed(2)}
                  color={claseWHtR.color}
                  zones={[
                    { to: 0.4, label: 'Delgadez', color: '#3b82f6' },
                    { to: 0.5, label: 'Saludable', color: '#10b981' },
                    { to: 0.6, label: 'Sobrepeso', color: '#f59e0b' },
                    { to: 1.0, label: 'Obesidad', color: '#ef4444' },
                  ]}
                />
              </Panel>
            </div>

            <Panel title="Resumen" subtitle="Vista rápida de los principales indicadores">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <SummaryRow icon={<Scale className="w-3.5 h-3.5" />} label="IMC" value={`${round(imc, 1)}`} sub={claseIMC.label} />
                <SummaryRow icon={<Dumbbell className="w-3.5 h-3.5" />} label="Masa magra" value={`${round(masaMagraKg, 1)} kg`} />
                <SummaryRow icon={<HeartPulse className="w-3.5 h-3.5" />} label="% grasa" value={`${round(grasaPctFinal, 1)}%`} />
                <SummaryRow icon={<Flame className="w-3.5 h-3.5" />} label="TMB" value={`${round(tmb, 0)} kcal`} />
                <SummaryRow icon={<Activity className="w-3.5 h-3.5" />} label="GET" value={`${round(get, 0)} kcal`} />
                <SummaryRow icon={<Target className="w-3.5 h-3.5" />} label="Objetivo" value={`${round(calObjetivo, 0)} kcal`} />
              </div>
            </Panel>
          </section>
        </div>
      </div>

      {/* Confirm delete */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/35 flex items-center justify-center z-50">
          <div className="bg-white rounded-md w-full max-w-xs p-5" style={{ border: '1px solid #E8E5DE' }}>
            <p className="text-sm font-semibold text-gray-800 mb-1">Eliminar medición</p>
            <p className="text-xs text-gray-500 mb-4">Esta acción no se puede deshacer.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowDelete(false)} className="px-3 py-1 border border-gray-300 rounded text-[11px] text-gray-700 hover:bg-gray-50">Cancelar</button>
              <button onClick={handleDelete} className="px-3 py-1 bg-red-600 text-white rounded text-[11px] hover:bg-red-700">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Subcomponentes UI
// ──────────────────────────────────────────────────────────
function Card({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl p-5" style={{ border: '1px solid #E8E5DE' }}>
      <div className="flex items-center gap-1.5 mb-4">
        {icon && <span className="text-gray-400">{icon}</span>}
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{title}</h3>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl p-5" style={{ border: '1px solid #E8E5DE' }}>
      <div className="mb-4">
        <h3 className="text-[14px] font-semibold text-gray-900 tracking-tight">{title}</h3>
        {subtitle && <p className="text-[12px] text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
function FieldRow({ children }: { children: React.ReactNode }) { return <div>{children}</div>; }
function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-[11px] font-medium text-gray-500 mb-1.5">{children}</label>;
}
function NumberInput({ value, onChange, min, max, step = 1 }: { value: number; onChange: (n: number) => void; min?: number; max?: number; step?: number; }) {
  return (
    <input
      type="number"
      value={Number.isFinite(value) ? value : ''}
      min={min} max={max} step={step}
      onChange={e => onChange(parseFloat(e.target.value) || 0)}
      className="w-full px-3 py-2 rounded-md text-[13px] bg-white outline-none focus:ring-2 focus:ring-emerald-200 tabular-nums"
      style={{ border: '1px solid #E8E5DE' }}
    />
  );
}
function ToggleBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 px-3 py-2 rounded-md text-[12px] font-medium transition-colors ${active ? 'bg-emerald-700 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
      style={!active ? { border: '1px solid #E8E5DE' } : undefined}
    >
      {children}
    </button>
  );
}
function Kpi({ label, value, hint, color, icon }: { label: string; value: string; hint?: string; color?: string; icon?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl p-4" style={{ border: '1px solid #E8E5DE' }}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{label}</span>
        {icon && <span style={{ color }}>{icon}</span>}
      </div>
      <div className="text-2xl font-semibold tabular-nums text-gray-900" style={{ letterSpacing: '-0.02em' }}>{value}</div>
      {hint && <div className="text-[11px] text-gray-500 mt-0.5">{hint}</div>}
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
