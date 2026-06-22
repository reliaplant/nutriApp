'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { differenceInYears, format, parseISO, isToday, isPast, isFuture, formatDistanceToNow } from 'date-fns';
import { es, ptBR } from 'date-fns/locale';
import { useTranslation } from '@/app/shared/useTranslation';
import { patientService, consultationService, app, storage } from '@/app/shared/firebase';
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable, deleteObject, listAll } from 'firebase/storage';
import { doc, updateDoc, serverTimestamp, collection, addDoc, query, where, getDocs, deleteDoc, getFirestore } from 'firebase/firestore';
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
import { Line } from 'react-chartjs-2';
import { Consultation } from '@/app/shared/firebase';
import { CheckCircle2, AlertCircle, Calendar, FileText, Trash2, Pencil, Plus, ChevronRight, Play, RotateCcw, Info } from 'lucide-react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

const COUNTRIES = [
  { code: 'MX', flag: '🇲🇽', name: 'México' },
  { code: 'BR', flag: '🇧🇷', name: 'Brasil' },
  { code: 'AR', flag: '🇦🇷', name: 'Argentina' },
  { code: 'CO', flag: '🇨🇴', name: 'Colombia' },
  { code: 'CL', flag: '🇨🇱', name: 'Chile' },
  { code: 'PE', flag: '🇵🇪', name: 'Perú' },
  { code: 'ES', flag: '🇪🇸', name: 'España' },
  { code: 'PT', flag: '🇵🇹', name: 'Portugal' },
  { code: 'UY', flag: '🇺🇾', name: 'Uruguay' },
  { code: 'PY', flag: '🇵🇾', name: 'Paraguay' },
  { code: 'BO', flag: '🇧🇴', name: 'Bolivia' },
  { code: 'EC', flag: '🇪🇨', name: 'Ecuador' },
  { code: 'VE', flag: '🇻🇪', name: 'Venezuela' },
  { code: 'CR', flag: '🇨🇷', name: 'Costa Rica' },
  { code: 'PA', flag: '🇵🇦', name: 'Panamá' },
  { code: 'GT', flag: '🇬🇹', name: 'Guatemala' },
  { code: 'HN', flag: '🇭🇳', name: 'Honduras' },
  { code: 'SV', flag: '🇸🇻', name: 'El Salvador' },
  { code: 'NI', flag: '🇳🇮', name: 'Nicaragua' },
  { code: 'CU', flag: '🇨🇺', name: 'Cuba' },
  { code: 'DO', flag: '🇩🇴', name: 'República Dominicana' },
  { code: 'PR', flag: '🇵🇷', name: 'Puerto Rico' },
  { code: 'US', flag: '🇺🇸', name: 'Estados Unidos' },
  { code: 'CA', flag: '🇨🇦', name: 'Canadá' },
  { code: 'FR', flag: '🇫🇷', name: 'Francia' },
  { code: 'IT', flag: '🇮🇹', name: 'Italia' },
  { code: 'DE', flag: '🇩🇪', name: 'Alemania' },
  { code: 'GB', flag: '🇬🇧', name: 'Reino Unido' },
  { code: 'OTHER', flag: '🌎', name: 'Otro' },
];

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// ─── Interfaces ───────────────────────────────────────────
interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  birthDate: string;
  height: number;
  currentWeight: number;
  gender: 'male' | 'female' | 'other';
  country: string;
  language?: 'es' | 'pt' | 'en';
  status: 'active' | 'discharged' | 'lost';
  nutritionistId: string;
  photoUrl?: string;
  targetWeight?: number;
}

interface PatientDocument {
  id: string;
  name: string;
  fileName: string;
  uploadDate: string;
  fileSize: number;
  fileType: string;
  url: string;
  storagePath?: string;
}

// ─── PatientAvatar ────────────────────────────────────────
const PatientAvatar = ({ patient, onImageUpdate }: { patient: Patient; onImageUpdate: (url: string) => void }) => {
  const { t } = useTranslation();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !patient.id) return;
    setIsUploading(true);
    try {
      const storageRef = ref(storage, `patients/${patient.id}/avatar`);
      await uploadBytes(storageRef, files[0]);
      const photoUrl = await getDownloadURL(storageRef);
      onImageUpdate(photoUrl);
    } catch {
      alert(t('patientDetail.errors.imageUpload'));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div
      className="relative w-16 h-16 cursor-pointer rounded-full overflow-hidden flex-shrink-0"
      style={{ backgroundColor: '#F4F2EE', border: '1px solid #E8E5DE' }}
      onClick={() => fileInputRef.current?.click()}
    >
      {patient.photoUrl ? (
        <img src={patient.photoUrl} alt={patient.name} className="w-16 h-16 object-cover" />
      ) : (
        <div className="w-16 h-16 flex items-center justify-center">
          <span className="font-semibold text-gray-500 text-xl">
            {patient.name?.charAt(0)?.toUpperCase() || 'P'}
          </span>
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-all">
        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      {isUploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent"></div>
        </div>
      )}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────
const PatientDetailPage = () => {
  const { t, lang } = useTranslation();
  const dateLocale = lang === 'pt' ? ptBR : es;
  const params = useParams();
  const router = useRouter();
  const patientId = (params?.id as string) || 'new';
  const db = getFirestore(app);

  const [patient, setPatient] = useState<Patient>({
    id: patientId, name: '', email: '', phone: '', birthDate: '', height: 0,
    currentWeight: 0, gender: 'other', country: '', status: 'active', nutritionistId: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [patientDocuments, setPatientDocuments] = useState<PatientDocument[]>([]);
  const [weightHistory, setWeightHistory] = useState<{ date: string; weight: number }[]>([]);
  const [weightGoal, setWeightGoal] = useState(0);

  // ── DatosPaciente state ──
  const [isEditingPatient, setIsEditingPatient] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', birthDate: '', height: 0, gender: 'other' as string, country: '', language: 'es' as 'es' | 'pt' | 'en', currentWeight: 0, targetWeight: 0 });
  const [isDeletePatientModalOpen, setIsDeletePatientModalOpen] = useState(false);
  const [isDeletingPatient, setIsDeletingPatient] = useState(false);

  // ── Consultas state ──
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [consultationToEdit, setConsultationToEdit] = useState<Consultation | null>(null);
  const [isDeleteConsultModalOpen, setIsDeleteConsultModalOpen] = useState(false);
  const [consultationToDelete, setConsultationToDelete] = useState<string | null>(null);
  const [consultationToReopen, setConsultationToReopen] = useState<string | null>(null);
  const [isReopening, setIsReopening] = useState(false);
  const [showStatusInfo, setShowStatusInfo] = useState(false);
  const [showChartInfo, setShowChartInfo] = useState(false);
  const [showBmiInfo, setShowBmiInfo] = useState(false);
  const [showPaceInfo, setShowPaceInfo] = useState(false);
  const [showSingleRecordInfo, setShowSingleRecordInfo] = useState(false);
  const [consultLoading, setConsultLoading] = useState(false);
  const [consultError, setConsultError] = useState<string | null>(null);

  // ── CreateConsultation state ──
  const [formData, setFormData] = useState({ date: '', time: '' });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createMode, setCreateMode] = useState<'choose' | 'schedule' | 'now'>('choose');

  // ── Evolucion state ──
  const [isEditingGoal, setIsEditingGoal] = useState(false);

  // ── Documentos state ──
  const [documents, setDocuments] = useState<PatientDocument[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newDocumentName, setNewDocumentName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showDeleteDocModal, setShowDeleteDocModal] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const [isDeletingDoc, setIsDeletingDoc] = useState(false);
  const [docsLoading, setDocsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const availableTimeSlots = Array.from({ length: 48 }).map((_, i) => {
    const h = Math.floor(i / 2);
    const m = i % 2 === 0 ? '00' : '30';
    return `${h.toString().padStart(2, '0')}:${m}`;
  });

  // ── Data fetching ──
  useEffect(() => {
    const fetchPatientData = async () => {
      if (patientId === 'new') { setLoading(false); return; }
      setLoading(true);
      try {
        const fetched = await patientService.getPatientById(patientId);
        if (fetched) {
          setPatient(fetched as Patient);
          setEditForm({ name: fetched.name || '', email: fetched.email || '', phone: fetched.phone || '', birthDate: fetched.birthDate || '', height: fetched.height || 0, gender: fetched.gender || 'other', country: fetched.country || '', language: fetched.language || 'es', currentWeight: fetched.currentWeight || 0, targetWeight: fetched.targetWeight || 0 });
          if (fetched.targetWeight) setWeightGoal(fetched.targetWeight);
        } else {
          setError(t('patientDetail.errors.notFound'));
        }
      } catch { setError(t('patientDetail.errors.loadError')); }
      finally { setLoading(false); }
    };
    fetchPatientData();
  }, [patientId]);

  useEffect(() => { if (patientId && patientId !== 'new') fetchConsultations(); }, [patientId]);
  useEffect(() => { if (patientId && patientId !== 'new') fetchDocuments(); }, [patientId]);

  useEffect(() => {
    setEditForm({ name: patient.name || '', email: patient.email || '', phone: patient.phone || '', birthDate: patient.birthDate || '', height: patient.height || 0, gender: patient.gender || 'other', country: patient.country || '', language: patient.language || 'es', currentWeight: patient.currentWeight || 0, targetWeight: patient.targetWeight || 0 });
  }, [patient]);

  useEffect(() => {
    if (showCreateModal && consultationToEdit) {
      const dateStr = consultationToEdit.date.split('T')[0];
      const timeStr = consultationToEdit.date.includes('T') ? consultationToEdit.date.split('T')[1].substring(0, 5) : '00:00';
      setFormData({ date: dateStr, time: timeStr });
      setCreateMode('schedule');
    } else if (showCreateModal && !consultationToEdit) {
      setFormData({ date: '', time: '' });
      setCreateMode('choose');
    }
  }, [showCreateModal, consultationToEdit]);

  // ── Consultas functions ──
  const fetchConsultations = async () => {
    setConsultLoading(true);
    setConsultError(null);
    try {
      const fetched = await consultationService.getConsultationsByPatient(patientId);
      setConsultations(fetched);
      // Build weight history from any consultation with a recorded weight (completed or in-progress)
      const withWeight = fetched.filter(c => typeof c.weight === 'number' && c.weight! > 0);
      const wh = withWeight.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(c => ({ date: c.date, weight: c.weight! }));
      setWeightHistory(wh);
    } catch { setConsultError(t('patientDetail.errors.loadConsults')); }
    finally { setConsultLoading(false); }
  };

  const scheduledConsultations = consultations.filter(c => c.status === 'scheduled');
  const previousConsultations = consultations.filter(c => c.status === 'completed');
  const hasScheduledConsultation = scheduledConsultations.length > 0;

  const handleConsultationCreated = (newC: Consultation) => {
    if (consultationToEdit) {
      setConsultations(prev => prev.map(c => c.id === newC.id ? newC : c));
      setConsultationToEdit(null);
    } else {
      setConsultations(prev => [newC, ...prev]);
    }
  };

  const handleDeleteConsultConfirm = async () => {
    if (!consultationToDelete) return;
    setConsultLoading(true);
    try {
      const toDeleteData = consultations.find(c => c.id === consultationToDelete);
      const wasScheduled = toDeleteData?.status === 'scheduled';
      await consultationService.deleteConsultation(patientId, consultationToDelete);
      if (wasScheduled) {
        const remaining = consultations.filter(c => c.id !== consultationToDelete);
        const scheduled = remaining.filter(c => c.status === 'scheduled').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const patientRef = doc(db, "patients", patientId);
        if (scheduled.length > 0) {
          await updateDoc(patientRef, { nextAppointmentDate: scheduled[0].date, updatedAt: serverTimestamp() });
        } else {
          await updateDoc(patientRef, { nextAppointmentDate: null, updatedAt: serverTimestamp() });
        }
      }
      setConsultations(prev => prev.filter(c => c.id !== consultationToDelete));
      setIsDeleteConsultModalOpen(false);
      setConsultationToDelete(null);
    } catch (err) {
      if (err instanceof Error && err.message.includes("Consulta no encontrada")) {
        setConsultations(prev => prev.filter(c => c.id !== consultationToDelete));
        setIsDeleteConsultModalOpen(false);
        setConsultationToDelete(null);
      } else {
        setConsultError(t('patientDetail.errors.deleteConsult'));
      }
    } finally { setConsultLoading(false); }
  };

  const handleCreateSubmit = async (goToPlan = false) => {
    if (!formData.date) { setCreateError(t('patientDetail.createModal.dateRequired')); return; }
    if (!formData.time) { setCreateError(t('patientDetail.createModal.timeRequired')); return; }
    setCreateLoading(true);
    setCreateError(null);
    try {
      const dateWithTime = `${formData.date}T${formData.time}:00`;
      if (consultationToEdit?.id) {
        const toUpdate: Partial<Consultation> = { date: dateWithTime, status: 'scheduled' };
        await consultationService.updateConsultation(patientId, consultationToEdit.id, toUpdate);
        const patientRef = doc(db, "patients", patientId);
        await updateDoc(patientRef, { nextAppointmentDate: dateWithTime, updatedAt: serverTimestamp() });
        handleConsultationCreated({ ...consultationToEdit, ...toUpdate });
        setFormData({ date: '', time: '' });
        setShowCreateModal(false);
        if (goToPlan) router.push(`/consulta/${consultationToEdit.id}?patientId=${patientId}`);
      } else {
        const newC: Consultation = { patientId, date: dateWithTime, status: 'scheduled', highlights: [] };
        const id = await consultationService.createConsultation(newC);
        handleConsultationCreated({ ...newC, id });
        setFormData({ date: '', time: '' });
        setShowCreateModal(false);
        if (goToPlan && id) router.push(`/consulta/${id}?patientId=${patientId}`);
      }
    } catch { setCreateError(t('patientDetail.errors.saveConsult')); }
    finally { setCreateLoading(false); }
  };

  const handleStartNow = async () => {
    setCreateLoading(true);
    setCreateError(null);
    try {
      const now = new Date();
      const dateWithTime = format(now, "yyyy-MM-dd'T'HH:mm:00");
      const newC: Consultation = { patientId, date: dateWithTime, status: 'scheduled', highlights: [] };
      const id = await consultationService.createConsultation(newC);
      handleConsultationCreated({ ...newC, id });
      setShowCreateModal(false);
      if (id) router.push(`/consulta/${id}?patientId=${patientId}`);
    } catch { setCreateError(t('patientDetail.errors.createConsult')); }
    finally { setCreateLoading(false); }
  };

  // ── Patient functions ──
  const handlePatientUpdate = async (updatedPatient: Patient) => {
    try {
      const complete: Patient = { ...updatedPatient, nutritionistId: updatedPatient.nutritionistId || patient.nutritionistId };
      if (patientId === 'new') {
        const newId = await patientService.createPatient(complete.name);
        await patientService.updatePatient(newId, complete);
        router.push(`/detalle-paciente/${newId}`);
      } else {
        await patientService.updatePatient(patientId, complete);
        setPatient(complete);
      }
    } catch (err) { console.error('Error al guardar paciente:', err); }
  };

  const handleDeletePatient = async () => {
    if (!patient.id) return;
    setIsDeletingPatient(true);
    try {
      const patientConsultations = await consultationService.getConsultationsByPatient(patient.id);
      for (const c of patientConsultations) { if (c.id) await consultationService.deleteConsultation(patient.id, c.id); }
      try {
        const storageRef = ref(storage, `patients/${patient.id}`);
        const filesList = await listAll(storageRef);
        for (const item of filesList.items) await deleteObject(item);
      } catch {}
      await patientService.deletePatient(patient.id);
      router.push('/pacientes');
    } catch { alert(t('patientDetail.errors.deletePatient')); }
    finally { setIsDeletingPatient(false); setIsDeletePatientModalOpen(false); }
  };

  const handleSavePatientChanges = () => {
    if (editForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) {
      return; // invalid email — block save (UI shows the error inline)
    }
    handlePatientUpdate({ ...patient, name: editForm.name, email: editForm.email, phone: editForm.phone, birthDate: editForm.birthDate, height: editForm.height, gender: editForm.gender as 'male' | 'female' | 'other', country: editForm.country, language: editForm.language, currentWeight: editForm.currentWeight, targetWeight: editForm.targetWeight });
    if (editForm.targetWeight !== weightGoal) setWeightGoal(editForm.targetWeight);
    setIsEditingPatient(false);
  };

  const getLastRecordedWeight = () => {
    const completed = consultations.filter(c => c.status === 'completed');
    if (completed.length === 0) return { weight: null, date: null };
    const sorted = [...completed].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return { weight: sorted[0].weight || null, date: sorted[0].date };
  };

  // ── Evolucion computed ──
  const hasWeightData = weightHistory.length > 0;
  const hasMultipleWeightData = weightHistory.length > 1;
  const initialWeight = hasWeightData ? weightHistory[0].weight : null;
  const currentWeight = hasWeightData ? weightHistory[weightHistory.length - 1].weight : patient.currentWeight || null;
  const weightChange = (initialWeight !== null && currentWeight !== null) ? currentWeight - initialWeight : 0;
  const calculateBMI = () => {
    if (!patient.height || !currentWeight) return null;
    const hm = patient.height / 100;
    return currentWeight / (hm * hm);
  };
  const bmi = calculateBMI();
  const getBMICategory = (b: number): { key: 'underweight'|'normal'|'overweight'|'obese1'|'obese2'|'obese3'; color: string } => {
    if (b < 18.5) return { key: 'underweight', color: 'text-blue-600' };
    if (b < 25) return { key: 'normal', color: 'text-green-600' };
    if (b < 30) return { key: 'overweight', color: 'text-yellow-600' };
    if (b < 35) return { key: 'obese1', color: 'text-orange-600' };
    if (b < 40) return { key: 'obese2', color: 'text-red-600' };
    return { key: 'obese3', color: 'text-red-800' };
  };
  const labelBmi = (k: 'underweight'|'normal'|'overweight'|'obese1'|'obese2'|'obese3') => t(`patientDetail.bmiCategories.${k}`);
  const bmiCategory = bmi ? getBMICategory(bmi) : null;
  const calculateIdealWeight = () => {
    if (!patient.height) return null;
    const hm = patient.height / 100;
    return { min: Math.round(18.5 * hm * hm * 10) / 10, max: Math.round(24.9 * hm * hm * 10) / 10 };
  };
  const idealWeight = calculateIdealWeight();

  const chartData = {
    labels: hasWeightData
      ? (weightHistory.length === 1
          ? [format(parseISO(weightHistory[0].date), 'd MMM', { locale: dateLocale }), (t('patientDetail.evolution.now') !== 'patientDetail.evolution.now' ? t('patientDetail.evolution.now') : 'ahora')]
          : weightHistory.map(r => format(parseISO(r.date), 'd MMM', { locale: dateLocale })))
      : [],
    datasets: [
      { label: t('patientDetail.evolution.weightKg'), data: hasWeightData ? (weightHistory.length === 1 ? [weightHistory[0].weight, weightHistory[0].weight] : weightHistory.map(r => r.weight)) : [], borderColor: 'rgb(16, 185, 129)', borderWidth: 2, fill: true, backgroundColor: 'rgba(16, 185, 129, 0.08)', tension: 0.35, pointRadius: weightHistory.length === 1 ? [5, 0] : 4, pointHoverRadius: weightHistory.length === 1 ? [7, 0] : 6, pointBackgroundColor: '#fff', pointBorderColor: 'rgb(16, 185, 129)', pointBorderWidth: 2, spanGaps: true },
      { label: t('patientDetail.evolution.goalKg'), data: hasWeightData ? Array(weightHistory.length === 1 ? 2 : weightHistory.length).fill(weightGoal) : [], borderColor: 'rgba(244, 114, 182, 0.9)', borderWidth: 2, borderDash: [6, 5], fill: false, pointRadius: 0, tension: 0 }
    ]
  };
  const chartOptions = useMemo(() => {
    // Compute a y-range wide enough to show several BMI bands when possible
    const hm = patient.height ? patient.height / 100 : 0;
    const bmiToW = (b: number) => (hm > 0 ? b * hm * hm : null);
    const weights = hasWeightData ? weightHistory.map(r => r.weight) : [];
    if (weightGoal > 0) weights.push(weightGoal);
    let suggestedMin: number | undefined;
    let suggestedMax: number | undefined;
    if (hm > 0) {
      const wNormal = bmiToW(18.5)!;
      const wOver = bmiToW(25)!;
      const wObese1 = bmiToW(30)!;
      const dataMin = weights.length ? Math.min(...weights) : wNormal;
      const dataMax = weights.length ? Math.max(...weights) : wOver;
      // Show at least Normal+Sobrepeso, plus 1 kg padding around data
      suggestedMin = Math.floor(Math.min(dataMin - 1, wNormal - 1));
      suggestedMax = Math.ceil(Math.max(dataMax + 1, wObese1 + 0.5));
    }
    return {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { top: 8, right: 8, bottom: 0, left: 0 } },
      scales: {
        y: {
          beginAtZero: false,
          grace: '8%',
          ...(suggestedMin !== undefined ? { suggestedMin } : {}),
          ...(suggestedMax !== undefined ? { suggestedMax } : {}),
          grid: { color: '#F0EDE8', drawBorder: false },
          ticks: { color: '#9CA3AF', font: { size: 10 } },
        },
        x: {
          grid: { display: false, drawBorder: false },
          ticks: { color: '#9CA3AF', font: { size: 10 } },
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: { mode: 'index' as const, intersect: false, backgroundColor: 'rgba(17,24,39,0.92)', padding: 8, titleFont: { size: 11 }, bodyFont: { size: 11 } }
      }
    };
  }, [patient.height, weightHistory, weightGoal, hasWeightData]);

  // Background plugin: paints BMI zones behind the weight chart, with dividing lines & labels
  const bmiBandsPlugin = useMemo(() => ({
    id: 'bmiBands',
    beforeDatasetsDraw: (chart: unknown) => {
      const c = chart as { ctx: CanvasRenderingContext2D; chartArea: { left: number; right: number; top: number; bottom: number }; scales: { y: { getPixelForValue: (v: number) => number; min: number; max: number } } };
      if (!patient.height || patient.height <= 0) return;
      const hm = patient.height / 100;
      const w = (bmi: number) => bmi * hm * hm;
      const bands: Array<{ from: number; to: number; color: string; line: string; label: string; labelColor: string }> = [
        { from: 0,       to: w(18.5), color: 'rgba(96, 165, 250, 0.12)', line: 'rgba(96, 165, 250, 0.55)', label: 'Bajo peso',   labelColor: 'rgba(37, 99, 235, 0.85)'  },
        { from: w(18.5), to: w(25),   color: 'rgba(52, 211, 153, 0.14)', line: 'rgba(52, 211, 153, 0.55)', label: 'Normal',      labelColor: 'rgba(5, 150, 105, 0.9)'   },
        { from: w(25),   to: w(30),   color: 'rgba(251, 191, 36, 0.12)', line: 'rgba(251, 191, 36, 0.55)', label: 'Sobrepeso',   labelColor: 'rgba(202, 138, 4, 0.9)'   },
        { from: w(30),   to: w(35),   color: 'rgba(251, 146, 60, 0.12)', line: 'rgba(251, 146, 60, 0.55)', label: 'Obesidad I',  labelColor: 'rgba(234, 88, 12, 0.9)'   },
        { from: w(35),   to: w(99),   color: 'rgba(239, 68, 68, 0.12)',  line: 'rgba(239, 68, 68, 0.55)',  label: 'Obesidad II+',labelColor: 'rgba(185, 28, 28, 0.9)'   },
      ];
      const { ctx, chartArea, scales } = c;
      const yMin = scales.y.min;
      const yMax = scales.y.max;
      ctx.save();
      ctx.beginPath();
      ctx.rect(chartArea.left, chartArea.top, chartArea.right - chartArea.left, chartArea.bottom - chartArea.top);
      ctx.clip();
      // Fill bands
      bands.forEach(b => {
        const from = Math.max(b.from, yMin);
        const to = Math.min(b.to, yMax);
        if (to <= from) return;
        const yTop = scales.y.getPixelForValue(to);
        const yBot = scales.y.getPixelForValue(from);
        ctx.fillStyle = b.color;
        ctx.fillRect(chartArea.left, yTop, chartArea.right - chartArea.left, yBot - yTop);
      });
      // Divider lines + labels (only for bands visible in the current y range)
      ctx.font = '600 9px ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'right';
      bands.forEach(b => {
        if (b.to <= yMin || b.from >= yMax) return;
        const visibleFrom = Math.max(b.from, yMin);
        const visibleTo = Math.min(b.to, yMax);
        // Top divider line (skip if band starts at y axis bottom)
        if (b.from > yMin && b.from < yMax) {
          const yLine = scales.y.getPixelForValue(b.from);
          ctx.strokeStyle = b.line;
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(chartArea.left, yLine);
          ctx.lineTo(chartArea.right, yLine);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        // Label centered vertically in the visible portion of the band, anchored to the right
        const yMid = (scales.y.getPixelForValue(visibleFrom) + scales.y.getPixelForValue(visibleTo)) / 2;
        const bandHeightPx = Math.abs(scales.y.getPixelForValue(visibleFrom) - scales.y.getPixelForValue(visibleTo));
        if (bandHeightPx < 14) return; // skip if too thin
        const text = b.label;
        const padX = 6;
        const padY = 2;
        const textW = ctx.measureText(text).width;
        const boxW = textW + padX * 2;
        const boxH = 14;
        const boxX = chartArea.right - boxW - 4;
        const boxY = yMid - boxH / 2;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.strokeStyle = b.line;
        ctx.lineWidth = 0.75;
        ctx.strokeRect(boxX + 0.5, boxY + 0.5, boxW - 1, boxH - 1);
        ctx.fillStyle = b.labelColor;
        ctx.fillText(text, chartArea.right - 4 - padX, yMid + 0.5);
        // Reset alignment for next iteration safety
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        void padY;
      });
      ctx.restore();
    }
  }), [patient.height]);

  // ── Documents functions ──
  const fetchDocuments = async () => {
    if (!patientId) return;
    setDocsLoading(true);
    try {
      const q = query(collection(db, "patientDocuments"), where("patientId", "==", patientId));
      const snap = await getDocs(q);
      const fetched: PatientDocument[] = [];
      for (const d of snap.docs) {
        const data = d.data() as PatientDocument & { patientId: string };
        fetched.push({ id: d.id, name: data.name, fileName: data.fileName, uploadDate: data.uploadDate, fileSize: data.fileSize, fileType: data.fileType, url: data.url, storagePath: data.storagePath });
      }
      fetched.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
      setDocuments(fetched);
    } catch (err) { console.error("Error fetching documents:", err); }
    finally { setDocsLoading(false); }
  };

  const uploadFileToFirebase = async () => {
    if (!selectedFile || !newDocumentName.trim()) { setUploadError(t('patientDetail.documents.nameFileRequired')); return; }
    setIsUploading(true); setUploadError(null); setUploadProgress(0);
    try {
      const ext = selectedFile.name.split('.').pop();
      const uniqueName = `${Date.now()}-${patientId.substring(0, 8)}.${ext}`;
      const storagePath = `pacientes/${patientId}/documentos/${uniqueName}`;
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, selectedFile);
      uploadTask.on('state_changed',
        (snap) => setUploadProgress((snap.bytesTransferred / snap.totalBytes) * 100),
        () => { setUploadError(t('patientDetail.documents.uploadFailed')); setIsUploading(false); },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          const newDoc: PatientDocument = { id: `doc-${Date.now()}`, name: newDocumentName.trim(), fileName: selectedFile.name, uploadDate: new Date().toISOString(), fileSize: selectedFile.size, fileType: selectedFile.type, url, storagePath };
          try {
            const docRef = await addDoc(collection(db, "patientDocuments"), { ...newDoc, patientId });
            newDoc.id = docRef.id;
          } catch {}
          setDocuments(prev => [newDoc, ...prev]);
          setNewDocumentName(''); setSelectedFile(null); setUploadProgress(0); setIsUploading(false); setShowUploadModal(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      );
    } catch { setUploadError(t('patientDetail.documents.initFailed')); setIsUploading(false); }
  };

  const confirmDeleteDocument = async () => {
    if (!documentToDelete) return;
    setIsDeletingDoc(true);
    try {
      const toRemove = documents.find(d => d.id === documentToDelete);
      if (toRemove) {
        if (toRemove.storagePath) { const fileRef = ref(storage, toRemove.storagePath); await deleteObject(fileRef); }
        await deleteDoc(doc(db, "patientDocuments", documentToDelete));
        setDocuments(prev => prev.filter(d => d.id !== documentToDelete));
      }
    } catch { alert(t('patientDetail.documents.deleteAlert')); }
    finally { setIsDeletingDoc(false); setShowDeleteDocModal(false); setDocumentToDelete(null); }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  // ── Helpers ──
  const formatDate = (dateString?: string | null): string => {
    if (!dateString) return t('patientDetail.misc.notAvailable');
    try {
      const fmt = lang === 'pt' ? "d 'de' MMMM 'de' yyyy" : "d 'de' MMMM, yyyy";
      return format(parseISO(dateString), fmt, { locale: dateLocale });
    } catch { return t('patientDetail.misc.invalidDate'); }
  };

  const formatConsultDate = (dateString: string): string => {
    try {
      const fmt = lang === 'pt' ? "d 'de' MMMM 'de' yyyy - HH:mm" : "d 'de' MMMM, yyyy - HH:mm";
      return format(parseISO(dateString), fmt, { locale: dateLocale });
    } catch { return dateString; }
  };

  const getConsultationState = (c: Consultation) => {
    const date = parseISO(c.date);
    if (c.status === 'completed') return 'completed';
    if (isToday(date)) return 'today';
    if (isPast(date)) return 'overdue';
    return 'upcoming';
  };

  const getTimeLabel = (dateString: string): string => {
    try {
      const date = parseISO(dateString);
      if (isToday(date)) return t('patientDetail.consultations.today') + ' · ' + format(date, 'HH:mm');
      return formatDistanceToNow(date, { locale: dateLocale, addSuffix: true });
    } catch { return ''; }
  };

  const calculateAge = (birthDate?: string | null): number | null => {
    if (!birthDate) return null;
    try { return differenceInYears(new Date(), new Date(birthDate)); }
    catch { return null; }
  };

  const lastWeight = getLastRecordedWeight();

  // ── Loading / Error states ──
  if (loading) return (
    <div className="bg-cream-pattern flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-6 w-6 border-2 border-emerald-600 border-t-transparent"></div>
    </div>
  );

  if (error) return <div className="m-4 p-3 bg-red-50 text-red-700 rounded-md text-xs" style={{ border: '1px solid #FECACA' }}>{error}</div>;

  // ─── RENDER ─────────────────────────────────────────────
  return (
    <div className="bg-cream-pattern flex flex-row min-h-screen">
      {/* PANEL IZQUIERDO - DATOS PACIENTE */}
      <div className="w-full md:w-[300px] bg-white p-5 flex-shrink-0" style={{ borderRight: '1px solid #E8E5DE' }}>
        <div className="flex items-center mb-5 gap-3">
          <PatientAvatar patient={patient} onImageUpdate={(url) => handlePatientUpdate({ ...patient, photoUrl: url } as Patient)} />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{t('patientDetail.patient')}</p>
            <h1 className="text-sm font-semibold text-gray-800 truncate mt-0.5">{patient.name || t('patientDetail.noName')}</h1>
            <div className="mt-1 flex items-center gap-1">
              <select
                value={patient.status}
                onChange={(e) => handlePatientUpdate({ ...patient, status: e.target.value as 'active' | 'discharged' | 'lost' })}
                className="px-1.5 py-0.5 rounded text-[10px] font-medium focus:outline-none bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                <option value="active">{t('patientDetail.status.active')}</option>
                <option value="discharged">{t('patientDetail.status.discharged')}</option>
                <option value="lost">{t('patientDetail.status.lost')}</option>
              </select>
              <button
                type="button"
                onClick={() => setShowStatusInfo(true)}
                className="p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
                title={t('patientDetail.status.infoTitle') !== 'patientDetail.status.infoTitle' ? t('patientDetail.status.infoTitle') : '¿Qué significa cada estado?'}
                aria-label="info"
              >
                <Info className="h-3.5 w-3.5" strokeWidth={1.75} />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-4" style={{ borderTop: '1px solid #F0EDE8' }}>
          <div className="flex justify-between items-center mb-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{t('patientDetail.personalInfo')}</p>
            {!isEditingPatient && (
              <button onClick={() => setIsEditingPatient(true)} className="text-[11px] text-emerald-700 hover:underline">{t('patientDetail.edit')}</button>
            )}
          </div>

          {isEditingPatient ? (
            <form className="space-y-3">
              {[
                { id: 'name', label: t('patientDetail.fields.fullName'), type: 'text', value: editForm.name },
                { id: 'email', label: t('patientDetail.fields.email'), type: 'email', value: editForm.email },
                { id: 'birthDate', label: t('patientDetail.fields.birthDate'), type: 'date', value: editForm.birthDate },
                { id: 'height', label: t('patientDetail.fields.height'), type: 'number', value: editForm.height },
                { id: 'currentWeight', label: t('patientDetail.fields.currentWeight') !== 'patientDetail.fields.currentWeight' ? t('patientDetail.fields.currentWeight') : 'Peso actual (kg)', type: 'number', value: editForm.currentWeight },
                { id: 'targetWeight', label: t('patientDetail.fields.targetWeight') !== 'patientDetail.fields.targetWeight' ? t('patientDetail.fields.targetWeight') : 'Peso objetivo (kg)', type: 'number', value: editForm.targetWeight },
              ].map(f => {
                const isInvalidEmail = f.id === 'email' && f.value !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(f.value));
                return (
                <div key={f.id}>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">{f.label}</label>
                  <input
                    name={f.id}
                    type={f.type}
                    value={f.type === 'number' ? (f.value === 0 || f.value === '' ? '' : f.value) : f.value}
                    placeholder={f.type === 'number' ? '—' : undefined}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setEditForm(prev => ({
                        ...prev,
                        [f.id]: f.type === 'number' ? (raw === '' ? 0 : Number(raw)) : raw,
                      }));
                    }}
                    className={`w-full px-2 py-1.5 bg-white border rounded-sm text-xs focus:outline-none focus:ring-2 tabular-nums ${isInvalidEmail ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : 'border-gray-300 focus:ring-emerald-200 focus:border-emerald-400'}`}
                  />
                  {isInvalidEmail && (
                    <p className="text-[10px] text-red-600 mt-1">{t('patientDetail.fields.invalidEmail') !== 'patientDetail.fields.invalidEmail' ? t('patientDetail.fields.invalidEmail') : 'Ingresa un correo válido'}</p>
                  )}
                </div>
                );
              })}
              {/* Phone with country code */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">{t('patientDetail.fields.phone')}</label>
                <PhoneInput
                  international
                  defaultCountry={(editForm.country && editForm.country !== 'OTHER' ? editForm.country : 'MX') as never}
                  value={editForm.phone || undefined}
                  onChange={(val) => setEditForm(prev => ({ ...prev, phone: val || '' }))}
                  className="phone-input-field w-full"
                  placeholder={t('patientDetail.fields.phone')}
                />
              </div>
              {/* Country dropdown */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">{t('patientDetail.fields.country')}</label>
                <select
                  name="country"
                  value={editForm.country || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, country: e.target.value }))}
                  className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded-sm text-xs focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400"
                >
                  <option value="">—</option>
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">{t('patientDetail.fields.gender')}</label>
                <select name="gender" value={editForm.gender} onChange={(e) => setEditForm(prev => ({ ...prev, gender: e.target.value }))} className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded-sm text-xs focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400">
                  <option value="male">{t('patientDetail.fields.male')}</option>
                  <option value="female">{t('patientDetail.fields.female')}</option>
                  <option value="other">{t('patientDetail.fields.other')}</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">{t('patientDetail.fields.language')}</label>
                <select name="language" value={editForm.language} onChange={(e) => setEditForm(prev => ({ ...prev, language: e.target.value as 'es' | 'pt' | 'en' }))} className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded-sm text-xs focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400">
                  <option value="es">🇪🇸 Español</option>
                  <option value="pt">🇧🇷 Português</option>
                  <option value="en">🇺🇸 English</option>
                </select>
                <p className="text-[10px] text-gray-400 mt-1">{t('patientDetail.fields.languageHint')}</p>
              </div>
              <div className="flex space-x-2 pt-2">
                <button type="button" onClick={() => setIsEditingPatient(false)} className="flex-1 py-1.5 border border-gray-300 rounded-sm text-xs text-gray-700 hover:bg-gray-50">{t('patientDetail.cancel')}</button>
                <button type="button" onClick={handleSavePatientChanges} className="flex-1 bg-emerald-600 text-white py-1.5 rounded-sm text-xs font-medium hover:bg-emerald-700">{t('patientDetail.save')}</button>
              </div>
            </form>
          ) : (
            <div className="space-y-2.5">
              {[
                { label: t('patientDetail.fields.emailShort'), value: patient.email },
                { label: t('patientDetail.fields.phoneShort'), value: patient.phone },
                { label: t('patientDetail.fields.countryShort'), value: (() => { const c = COUNTRIES.find(x => x.code === patient.country); return c ? `${c.flag} ${c.name}` : patient.country; })() },
                { label: t('patientDetail.fields.birth'), value: patient.birthDate ? `${formatDate(patient.birthDate)} ${calculateAge(patient.birthDate) !== null ? `(${calculateAge(patient.birthDate)} ${t('patientDetail.fields.years')})` : ''}` : t('patientDetail.fields.notRegistered') },
                { label: t('patientDetail.fields.gender'), value: patient.gender === 'male' ? t('patientDetail.fields.male') : patient.gender === 'female' ? t('patientDetail.fields.female') : patient.gender === 'other' ? t('patientDetail.fields.other') : '' },
                { label: t('patientDetail.fields.language'), value: ({ es: '🇪🇸 Español', pt: '🇧🇷 Português', en: '🇺🇸 English' } as Record<string, string>)[patient.language || 'es'] },
                { label: t('patientDetail.fields.heightShort'), value: patient.height ? `${patient.height} cm` : '—' },
                { label: t('patientDetail.fields.currentWeightShort') !== 'patientDetail.fields.currentWeightShort' ? t('patientDetail.fields.currentWeightShort') : 'Peso actual', value: (currentWeight ?? patient.currentWeight) ? `${(currentWeight ?? patient.currentWeight)} kg` : '—' },
                { label: t('patientDetail.fields.targetWeightShort') !== 'patientDetail.fields.targetWeightShort' ? t('patientDetail.fields.targetWeightShort') : 'Peso objetivo', value: patient.targetWeight ? `${patient.targetWeight} kg` : '—' },
              ].map(f => (
                <div key={f.label}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{f.label}</p>
                  <p className="text-xs text-gray-800 tabular-nums">{f.value || '—'}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 pt-3" style={{ borderTop: '1px solid #F0EDE8' }}>
          <button onClick={() => setIsDeletePatientModalOpen(true)} className="text-[10px] text-gray-400 hover:text-red-500 transition-colors">{t('patientDetail.deletePatient')}</button>
        </div>

        {/* Delete patient modal */}
        {isDeletePatientModalOpen && (
          <div className="fixed inset-0 bg-black/35 flex items-center justify-center z-50">
            <div className="bg-white rounded-md w-full max-w-sm overflow-hidden" style={{ border: '1px solid #E8E5DE', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
              <div className="px-5 py-3 border-b border-gray-100">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{t('patientDetail.deleteModal.eyebrow')}</p>
                <p className="text-sm font-semibold text-gray-800 mt-0.5">{t('patientDetail.deleteModal.title')}</p>
              </div>
              <div className="px-5 py-4">
                <p className="text-[12px] text-gray-600 mb-2">{t('patientDetail.deleteModal.intro')}</p>
                <ul className="list-disc pl-4 text-[11px] text-gray-500 space-y-0.5">
                  {(t('patientDetail.deleteModal.items') as unknown as string[]).map((it, i) => <li key={i}>{it}</li>)}
                </ul>
              </div>
              <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
                <button onClick={() => setIsDeletePatientModalOpen(false)} className="px-3 py-1 border border-gray-300 rounded text-[11px] text-gray-700 hover:bg-white" disabled={isDeletingPatient}>{t('patientDetail.cancel')}</button>
                <button onClick={handleDeletePatient} className="px-3 py-1 bg-red-600 text-white rounded text-[11px] font-medium hover:bg-red-700" disabled={isDeletingPatient}>
                  {isDeletingPatient ? t('patientDetail.deleting') : t('patientDetail.delete')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PANEL DERECHO */}
      <div className="flex-1 p-5 space-y-4">
        {patientId !== 'new' ? (
          <>
            {/* CONSULTAS */}
            <div className="bg-white rounded-md p-5" style={{ border: '1px solid #E8E5DE' }}>
              <div className="flex justify-between items-center mb-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{t('patientDetail.consultations.title')}</p>
                {!hasScheduledConsultation && (
                  <button
                    onClick={() => { setConsultationToEdit(null); setShowCreateModal(true); }}
                    className="text-[11px] rounded px-2.5 py-1 flex items-center gap-1.5 font-medium transition-colors bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    {t('patientDetail.consultations.newConsult')}
                  </button>
                )}
              </div>

              {consultError && <div className="bg-red-50 text-red-600 p-2 rounded mb-3 text-[11px]">{consultError}</div>}

              {consultLoading && consultations.length === 0 ? (
                <div className="flex justify-center py-6"><div className="animate-spin rounded-full h-5 w-5 border-2 border-emerald-600 border-t-transparent"></div></div>
              ) : (
                <>
                  {/* Próxima cita */}
                  {scheduledConsultations.length > 0 ? (
                    <div className="mb-5">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2">{t('patientDetail.consultations.nextAppt')}</p>
                      {scheduledConsultations.map(c => {
                        const state = getConsultationState(c);
                        const isToday_ = state === 'today';
                        const isOverdue = state === 'overdue';
                        return (
                          <div
                            key={c.id}
                            className="rounded-md p-4 bg-white"
                            style={{ border: '1px solid #E8E5DE', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 flex items-start gap-2.5">
                                {isToday_ || !isOverdue ? (
                                  <CheckCircle2 className="w-4 h-4 text-white flex-shrink-0 mt-0.5" fill={isToday_ ? '#059669' : '#6B7280'} strokeWidth={2.5} />
                                ) : (
                                  <AlertCircle className="w-4 h-4 text-white flex-shrink-0 mt-0.5" fill="#F59E0B" strokeWidth={2.5} />
                                )}
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="text-[13px] font-medium text-gray-800 tabular-nums">{formatConsultDate(c.date)}</p>
                                    {isToday_ && <span className="text-[9px] font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">{t('patientDetail.consultations.today')}</span>}
                                    {isOverdue && <span className="text-[9px] font-semibold uppercase tracking-wider text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">{t('patientDetail.consultations.overdue')}</span>}
                                  </div>
                                  <p className="text-[11px] text-gray-500 mt-0.5">{getTimeLabel(c.date)}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <button onClick={() => { setConsultationToEdit(c); setShowCreateModal(true); }} className="p-1.5 rounded text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors" title={t('patientDetail.consultations.rescheduleTitle')}>
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => { setConsultationToDelete(c.id!); setIsDeleteConsultModalOpen(true); }} className="p-1.5 rounded text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors" title={t('patientDetail.consultations.cancelAppt')}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <div className="mt-3 pt-3" style={{ borderTop: '1px solid #F0EDE8' }}>
                              {(() => {
                                const np = (c as { nutritionPlan?: { nutritionParams?: unknown; objectivesSet?: boolean } }).nutritionPlan;
                                const inProgress = !!np && (!!np.nutritionParams || !!np.objectivesSet);
                                return (
                                  <button
                                    onClick={() => router.push(`/consulta/${c.id}?patientId=${patientId}`)}
                                    className="w-full text-center text-[12px] font-medium bg-emerald-600 text-white hover:bg-emerald-700 py-2 rounded transition-colors"
                                  >
                                    {inProgress
                                      ? (t('patientDetail.consultations.resumeConsult') !== 'patientDetail.consultations.resumeConsult' ? t('patientDetail.consultations.resumeConsult') : 'Retomar consulta')
                                      : t('patientDetail.consultations.startConsult')}
                                  </button>
                                );
                              })()}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="mb-5 rounded-md p-6 text-center" style={{ border: '1px dashed #E8E5DE' }}>
                      <Calendar className="w-7 h-7 text-gray-300 mx-auto mb-2" strokeWidth={1.5} />
                      <p className="text-xs text-gray-400">{t('patientDetail.consultations.noAppt')}</p>
                    </div>
                  )}

                  {/* Historial */}
                  {previousConsultations.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2">{t('patientDetail.consultations.history')}</p>
                      <div className="space-y-2">
                        {previousConsultations.map(c => (
                          <div
                            key={c.id}
                            className="group flex items-center justify-between gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors hover:bg-[#FAF9F7]"
                            style={{ border: '1px solid #E8E5DE', backgroundColor: '#FFFFFF' }}
                            onClick={() => router.push(`/consulta/${c.id}?patientId=${patientId}`)}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <CheckCircle2 className="w-4 h-4 text-white flex-shrink-0" fill="#059669" strokeWidth={2.5} />
                              <div className="flex items-baseline gap-3 min-w-0">
                                <p className="text-[12px] font-medium text-gray-800 tabular-nums truncate">{formatConsultDate(c.date)}</p>
                                {c.weight && (
                                  <span className="text-[10px] text-gray-500 tabular-nums">
                                    {c.weight} kg
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <span className="text-[10px] text-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity mr-1">{t('patientDetail.consultations.viewPlan')}</span>
                              <button onClick={(e) => { e.stopPropagation(); setConsultationToReopen(c.id!); }} className="p-1 rounded text-gray-300 hover:text-emerald-600 hover:bg-emerald-50 opacity-0 group-hover:opacity-100 transition-all" title={t('patientDetail.consultations.reopenTitle') !== 'patientDetail.consultations.reopenTitle' ? t('patientDetail.consultations.reopenTitle') : 'Reabrir consulta'}>
                                <RotateCcw className="w-3 h-3" />
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); setConsultationToDelete(c.id!); setIsDeleteConsultModalOpen(true); }} className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all" title={t('patientDetail.consultations.deleteShort')}>
                                <Trash2 className="w-3 h-3" />
                              </button>
                              <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-emerald-600 transition-colors" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {consultations.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-2">{t('patientDetail.consultations.noRecords')}</p>
                  )}
                </>
              )}
            </div>

            {/* EVOLUCIÓN */}
            <div className="bg-white rounded-md p-5" style={{ border: '1px solid #E8E5DE' }}>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{t('patientDetail.evolution.title')}</p>
                  <button
                    type="button"
                    onClick={() => setShowChartInfo(true)}
                    className="p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
                    title={t('patientDetail.evolution.infoTitle') !== 'patientDetail.evolution.infoTitle' ? t('patientDetail.evolution.infoTitle') : '¿Qué muestra este gráfico?'}
                    aria-label="info"
                  >
                    <Info className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </button>
                  {hasWeightData && (
                    <div className="flex items-center gap-3 text-[10px] text-gray-500">
                      <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'rgb(16, 185, 129)' }} />{t('patientDetail.evolution.weightKg')}</span>
                      <span className="flex items-center gap-1.5"><span className="inline-block w-3.5 h-0 border-t-2 border-dashed" style={{ borderColor: 'rgba(244, 114, 182, 0.9)' }} /><span className="font-medium text-gray-700">{t('patientDetail.evolution.weightGoal')}</span></span>
                    </div>
                  )}
                </div>
                {isEditingGoal ? (
                  <div className="flex items-center gap-1.5">
                    <input type="number" value={weightGoal || ''} placeholder="—" onChange={(e) => setWeightGoal(Number(e.target.value))} className="w-16 px-2 py-1 border border-gray-300 rounded-sm text-xs tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-200" step="0.1" />
                    <span className="text-[10px] text-gray-500">kg</span>
                    <button onClick={async () => {
                      if (patient.id) {
                        try { await patientService.updatePatient(patient.id, { targetWeight: weightGoal || 0 }); setPatient(prev => ({ ...prev, targetWeight: weightGoal || 0 })); } catch (e) { console.error(e); }
                      }
                      setIsEditingGoal(false);
                    }} className="text-[11px] bg-emerald-600 text-white px-2 py-1 rounded font-medium hover:bg-emerald-700">{t('patientDetail.evolution.save')}</button>
                  </div>
                ) : (
                  <button onClick={() => setIsEditingGoal(true)} className="text-[11px] text-emerald-700 hover:underline">{t('patientDetail.evolution.editGoal')}</button>
                )}
              </div>

              <div className="h-56 relative">
                {hasWeightData ? (
                  <>
                    <Line data={chartData} options={chartOptions} plugins={[bmiBandsPlugin]} />
                    {weightHistory.length === 1 && (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3.5 py-2 rounded-lg text-[11px] text-gray-700 flex items-center gap-2 max-w-[90%]" style={{ backgroundColor: 'rgba(255,255,255,0.97)', border: '1px solid #E8E5DE', boxShadow: '0 4px 14px rgba(120,100,80,0.14)' }}>
                        <span className="font-medium">{t('patientDetail.evolution.singleRecordMain') !== 'patientDetail.evolution.singleRecordMain' ? t('patientDetail.evolution.singleRecordMain') : 'Solo 1 registro disponible de la primera consulta'}</span>
                        <button
                          onClick={() => setShowSingleRecordInfo(true)}
                          className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                          aria-label="Más info"
                        >
                          <Info className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full rounded-md" style={{ backgroundColor: '#FAF9F7' }}>
                    <p className="text-xs text-gray-400">{t('patientDetail.evolution.noData')}</p>
                  </div>
                )}
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* PROGRESO A LA META */}
                <div className="rounded-md p-3 flex flex-col" style={{ backgroundColor: '#FAF9F7', border: '1px solid #F0EDE8' }}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{t('patientDetail.evolution.progressToGoal') !== 'patientDetail.evolution.progressToGoal' ? t('patientDetail.evolution.progressToGoal') : 'Progreso a la meta'}</p>
                  {currentWeight !== null && weightGoal > 0 ? (() => {
                    const start = initialWeight ?? currentWeight;
                    const totalDelta = weightGoal - start;
                    const direction: 'lose' | 'gain' | 'maintain' = Math.abs(totalDelta) < 0.05 ? 'maintain' : totalDelta < 0 ? 'lose' : 'gain';
                    const progressed = currentWeight - start;
                    const progressPct = Math.abs(totalDelta) < 0.05 ? 100 : Math.max(0, Math.min(100, (progressed / totalDelta) * 100));
                    const remaining = weightGoal - currentWeight;
                    const reached = Math.abs(remaining) < 0.05;
                    const wrongWay = !reached && ((direction === 'lose' && progressed > 0) || (direction === 'gain' && progressed < 0));
                    const verb = direction === 'lose' ? (t('patientDetail.evolution.toLose') !== 'patientDetail.evolution.toLose' ? t('patientDetail.evolution.toLose') : 'por bajar') : direction === 'gain' ? (t('patientDetail.evolution.toGain') !== 'patientDetail.evolution.toGain' ? t('patientDetail.evolution.toGain') : 'por subir') : (t('patientDetail.evolution.maintain') !== 'patientDetail.evolution.maintain' ? t('patientDetail.evolution.maintain') : 'mantener');
                    const arrow = direction === 'lose' ? '↓' : direction === 'gain' ? '↑' : '→';
                    const fillColor = reached ? 'bg-emerald-500' : wrongWay ? 'bg-red-400' : 'bg-emerald-400';
                    return (
                      <>
                        <div className="flex items-baseline gap-1.5">
                          <p className="text-lg font-semibold text-gray-800 tabular-nums">{currentWeight}</p>
                          <span className="text-[10px] text-gray-400">kg →</span>
                          <p className="text-sm font-medium text-emerald-700 tabular-nums">{weightGoal} kg</p>
                        </div>
                        <p className="text-[10px] tabular-nums text-gray-500">
                          {reached
                            ? (t('patientDetail.evolution.goalReached') !== 'patientDetail.evolution.goalReached' ? t('patientDetail.evolution.goalReached') : '¡Meta alcanzada!')
                            : `${arrow} ${Math.abs(remaining).toFixed(1)} kg ${verb}`}
                        </p>
                        <div className="mt-auto pt-2.5">
                          <div className="relative h-2 w-full rounded-full" style={{ backgroundColor: '#E8E5DE' }}>
                            <div className={`absolute top-0 left-0 h-full rounded-full transition-all ${fillColor}`} style={{ width: `${progressPct}%` }} />
                          </div>
                          <div className="flex justify-between items-center text-[9px] tabular-nums mt-1">
                            <span className="text-gray-400">{start.toFixed(1)} kg</span>
                            <span className={`font-semibold ${reached ? 'text-emerald-700' : wrongWay ? 'text-red-600' : 'text-gray-600'}`}>{Math.round(progressPct)}%</span>
                            <span className="text-emerald-700">{weightGoal} kg</span>
                          </div>
                        </div>
                      </>
                    );
                  })() : (
                    <p className="text-xs text-gray-400 italic mt-1">{currentWeight === null ? t('patientDetail.evolution.noData') : (t('patientDetail.evolution.setGoalHint') !== 'patientDetail.evolution.setGoalHint' ? t('patientDetail.evolution.setGoalHint') : 'Define un peso objetivo')}</p>
                  )}
                </div>
                {/* IMC */}
                <div className="rounded-md p-3 flex flex-col" style={{ backgroundColor: '#FAF9F7', border: '1px solid #F0EDE8' }}>
                  <div className="flex items-center gap-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{t('patientDetail.evolution.bmi')}</p>
                    <button onClick={() => setShowBmiInfo(true)} className="text-gray-400 hover:text-gray-600 transition-colors" aria-label="Info IMC">
                      <Info className="w-3 h-3" />
                    </button>
                  </div>
                  {bmi !== null ? (
                    <>
                      <p className="text-lg font-semibold text-gray-800 tabular-nums">{bmi.toFixed(1)}</p>
                      <p className={`text-[10px] ${bmiCategory?.color}`}>{bmiCategory && labelBmi(bmiCategory.key)}</p>
                      {/* BMI gradient bar */}
                      <div className="mt-auto pt-2.5">
                        <div className="relative h-2 w-full rounded-full overflow-hidden flex">
                          <div className="h-full" style={{ width: '14%', backgroundColor: '#60A5FA' }} />
                          <div className="h-full" style={{ width: '26%', backgroundColor: '#34D399' }} />
                          <div className="h-full" style={{ width: '20%', backgroundColor: '#FBBF24' }} />
                          <div className="h-full" style={{ width: '20%', backgroundColor: '#FB923C' }} />
                          <div className="h-full" style={{ width: '20%', backgroundColor: '#EF4444' }} />
                          <div
                            className="absolute top-1/2 -translate-y-1/2 h-3.5 w-0.5 bg-gray-800 rounded-sm"
                            style={{ left: `calc(${Math.max(0, Math.min(100, ((bmi - 15) / 25) * 100))}% - 1px)`, boxShadow: '0 0 0 1.5px #FAF9F7' }}
                          />
                        </div>
                        <div className="flex justify-between text-[8px] text-gray-400 tabular-nums mt-1 px-[1px]">
                          <span>15</span>
                          <span>18.5</span>
                          <span>25</span>
                          <span>30</span>
                          <span>35</span>
                          <span>40</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-gray-400 italic mt-1">{t('patientDetail.evolution.requiresHeightWeight')}</p>
                  )}
                </div>
                {/* RITMO */}
                <div className="rounded-md p-3 flex flex-col" style={{ backgroundColor: '#FAF9F7', border: '1px solid #F0EDE8' }}>
                  <div className="flex items-center gap-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{t('patientDetail.evolution.pace') !== 'patientDetail.evolution.pace' ? t('patientDetail.evolution.pace') : 'Ritmo'}</p>
                    <button onClick={() => setShowPaceInfo(true)} className="text-gray-400 hover:text-gray-600 transition-colors" aria-label="Info Ritmo">
                      <Info className="w-3 h-3" />
                    </button>
                  </div>
                  {hasMultipleWeightData && initialWeight !== null && currentWeight !== null ? (() => {
                    const firstDate = parseISO(weightHistory[0].date).getTime();
                    const lastDate = parseISO(weightHistory[weightHistory.length - 1].date).getTime();
                    const days = Math.max(1, (lastDate - firstDate) / (1000 * 60 * 60 * 24));
                    const weeks = days / 7;
                    const kgPerWeek = (currentWeight - initialWeight) / weeks;
                    const absRate = Math.abs(kgPerWeek);
                    // Healthy range: 0.25 – 1 kg/week change
                    const isHealthy = absRate >= 0.1 && absRate <= 1;
                    const isFast = absRate > 1;
                    const sign = kgPerWeek < 0 ? '-' : kgPerWeek > 0 ? '+' : '';
                    const rateColor = absRate < 0.1 ? 'text-gray-500' : isFast ? 'text-amber-600' : 'text-emerald-700';
                    const tagLabel = absRate < 0.1
                      ? (t('patientDetail.evolution.steady') !== 'patientDetail.evolution.steady' ? t('patientDetail.evolution.steady') : 'Estable')
                      : isFast
                        ? (t('patientDetail.evolution.fast') !== 'patientDetail.evolution.fast' ? t('patientDetail.evolution.fast') : 'Acelerado')
                        : (t('patientDetail.evolution.healthy') !== 'patientDetail.evolution.healthy' ? t('patientDetail.evolution.healthy') : 'Saludable');
                    // Position rate on a -1.5 → +1.5 kg/week scale
                    const minScale = -1.5, maxScale = 1.5;
                    const ratePct = Math.max(0, Math.min(100, ((kgPerWeek - minScale) / (maxScale - minScale)) * 100));
                    return (
                      <>
                        <div className="flex items-baseline gap-1">
                          <p className={`text-lg font-semibold tabular-nums ${rateColor}`}>{sign}{absRate.toFixed(2)}</p>
                          <span className="text-[10px] text-gray-400">kg/sem</span>
                        </div>
                        <p className="text-[10px] text-gray-500">
                          <span className={isHealthy ? 'text-emerald-700' : isFast ? 'text-amber-600' : 'text-gray-500'}>{tagLabel}</span>
                          <span className="text-gray-400"> · {weightHistory.length} {t('patientDetail.evolution.records') !== 'patientDetail.evolution.records' ? t('patientDetail.evolution.records') : 'registros'} · {Math.round(days)}d</span>
                        </p>
                        <div className="mt-auto pt-2.5">
                          <div className="relative h-2 w-full rounded-full overflow-hidden flex">
                            <div className="h-full" style={{ width: '16.66%', backgroundColor: 'rgba(251, 146, 60, 0.35)' }} />
                            <div className="h-full" style={{ width: '16.66%', backgroundColor: 'rgba(52, 211, 153, 0.45)' }} />
                            <div className="h-full" style={{ width: '33.34%', backgroundColor: 'rgba(229, 231, 235, 0.7)' }} />
                            <div className="h-full" style={{ width: '16.67%', backgroundColor: 'rgba(52, 211, 153, 0.45)' }} />
                            <div className="h-full" style={{ width: '16.67%', backgroundColor: 'rgba(251, 146, 60, 0.35)' }} />
                            <div
                              className="absolute top-1/2 -translate-y-1/2 h-3.5 w-0.5 bg-gray-800 rounded-sm"
                              style={{ left: `calc(${ratePct}% - 1px)`, boxShadow: '0 0 0 1.5px #FAF9F7' }}
                            />
                          </div>
                          <div className="flex justify-between text-[8px] text-gray-400 tabular-nums mt-1 px-[1px]">
                            <span>−1.5</span>
                            <span>−0.5</span>
                            <span>0</span>
                            <span>+0.5</span>
                            <span>+1.5</span>
                          </div>
                        </div>
                      </>
                    );
                  })() : (
                    <>
                      <p className="text-xs text-gray-400 italic mt-1">{t('patientDetail.evolution.needMoreRecords') !== 'patientDetail.evolution.needMoreRecords' ? t('patientDetail.evolution.needMoreRecords') : 'Necesita ≥ 2 registros'}</p>
                      {hasWeightData && initialWeight !== null && (
                        <p className="text-[10px] text-gray-400 mt-1">{weightHistory.length} {t('patientDetail.evolution.records') !== 'patientDetail.evolution.records' ? t('patientDetail.evolution.records') : 'registro(s)'}</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* DOCUMENTOS */}
            <div className="bg-white rounded-md p-5" style={{ border: '1px solid #E8E5DE' }}>
              <div className="flex justify-between items-center mb-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{t('patientDetail.documents.title')}</p>
                <button onClick={() => setShowUploadModal(true)} className="text-[11px] bg-emerald-600 text-white px-2.5 py-1 rounded font-medium hover:bg-emerald-700 flex items-center gap-1">
                  <Plus className="w-3 h-3" strokeWidth={2.5} />
                  {t('patientDetail.documents.upload')}
                </button>
              </div>

              {docsLoading ? (
                <div className="flex justify-center py-6"><div className="animate-spin rounded-full h-5 w-5 border-2 border-emerald-600 border-t-transparent"></div></div>
              ) : documents.length > 0 ? (
                <div className="space-y-1">
                  {documents.map(d => (
                    <div key={d.id} className="group rounded p-2.5 hover:bg-[#FAF9F7] flex justify-between items-center transition-colors" style={{ border: '1px solid #F0EDE8' }}>
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" strokeWidth={1.5} />
                        <div>
                          <p className="text-[12px] text-gray-800">{d.name}</p>
                          <p className="text-[10px] text-gray-400 tabular-nums">{formatFileSize(d.fileSize)} · {format(parseISO(d.uploadDate), "d MMM yyyy", { locale: dateLocale })}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-[10px] border border-gray-300 px-2 py-0.5 rounded text-gray-700 bg-white hover:bg-gray-50">{t('patientDetail.documents.view')}</a>
                        <button onClick={() => { setDocumentToDelete(d.id); setShowDeleteDocModal(true); }} className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs text-gray-400 text-center py-6">{t('patientDetail.documents.empty')}</p>}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-md p-5" style={{ border: '1px solid #E8E5DE' }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2">{t('patientDetail.newPatient.title')}</p>
            <p className="text-xs text-gray-600">{t('patientDetail.newPatient.message')}</p>
          </div>
        )}
      </div>

      {/* Create/Edit consultation modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 modal-backdrop" onClick={() => { setShowCreateModal(false); setConsultationToEdit(null); }}>
          <div
            className="bg-white rounded-lg w-full max-w-sm overflow-hidden modal-panel"
            style={{ border: '1px solid #E8E5DE', boxShadow: '0 16px 40px -12px rgba(120, 100, 80, 0.22), 0 4px 12px rgba(0,0,0,0.05)' }}
            onClick={(e) => e.stopPropagation()}
          >

            {/* Mode: Choose */}
            {createMode === 'choose' && (
              <>
                <div className="px-5 py-3.5" style={{ backgroundColor: '#FAF9F7', borderBottom: '1px solid #F0EDE8' }}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{t('patientDetail.createModal.eyebrow')}</p>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">{t('patientDetail.createModal.chooseHeading')}</p>
                </div>

                <div className="px-5 py-4">
                  {createError && <div className="bg-red-50 text-red-600 p-2 rounded mb-3 text-[11px]">{createError}</div>}

                  <div className="space-y-2">
                    <button
                      onClick={handleStartNow}
                      disabled={createLoading}
                      className="w-full flex items-center gap-3 p-3 rounded-md hover:bg-[#FAF9F7] transition-colors text-left group"
                      style={{ border: '1px solid #E8E5DE' }}
                    >
                      <div className="h-8 w-8 rounded-md bg-emerald-50 flex items-center justify-center flex-shrink-0">
                        <Play className="w-3.5 h-3.5 text-emerald-700" strokeWidth={2.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-gray-800">{t('patientDetail.createModal.startNow')}</p>
                        <p className="text-[10px] text-gray-500">{t('patientDetail.createModal.startNowDesc')}</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition-colors" />
                    </button>

                    <button
                      onClick={() => setCreateMode('schedule')}
                      className="w-full flex items-center gap-3 p-3 rounded-md hover:bg-[#FAF9F7] transition-colors text-left group"
                      style={{ border: '1px solid #E8E5DE' }}
                    >
                      <div className="h-8 w-8 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-3.5 h-3.5 text-gray-600" strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-gray-800">{t('patientDetail.createModal.scheduleFor')}</p>
                        <p className="text-[10px] text-gray-500">{t('patientDetail.createModal.scheduleForDesc')}</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition-colors" />
                    </button>
                  </div>
                </div>

                <div className="px-5 py-3 flex justify-end" style={{ backgroundColor: '#FAF9F7', borderTop: '1px solid #E8E5DE' }}>
                  <button onClick={() => { setShowCreateModal(false); setConsultationToEdit(null); }} className="px-3 py-1.5 bg-white rounded-sm text-[11px] text-gray-600 hover:bg-[#FAF9F7] transition-colors" style={{ border: '1px solid #E8E5DE' }}>{t('patientDetail.createModal.cancel')}</button>
                </div>
              </>
            )}

            {/* Mode: Schedule / Edit */}
            {(createMode === 'schedule' || createMode === 'now') && (
              <>
                <div className="px-5 py-3.5" style={{ backgroundColor: '#FAF9F7', borderBottom: '1px solid #F0EDE8' }}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{consultationToEdit ? t('patientDetail.createModal.rescheduleEyebrow') : t('patientDetail.createModal.scheduleEyebrow')}</p>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">{t('patientDetail.createModal.scheduleHeading')}</p>
                </div>

                <div className="px-5 py-4">
                  {createError && <div className="bg-red-50 text-red-600 p-2 rounded mb-3 text-[11px]">{createError}</div>}

                  <div className="mb-3">
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">{t('patientDetail.createModal.dateLabel')}</label>
                    <div className="flex gap-2">
                      <input type="date" value={formData.date} onChange={(e) => setFormData(p => ({ ...p, date: e.target.value }))} className="flex-1 px-2 py-1.5 bg-white border border-gray-300 rounded-sm text-xs tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400" />
                      <button
                        type="button"
                        onClick={() => {
                          const now = new Date();
                          setFormData(p => ({ ...p, date: format(now, 'yyyy-MM-dd'), time: p.time || format(now, 'HH:mm') }));
                        }}
                        className="px-2.5 py-1.5 text-[11px] font-medium border border-gray-300 text-gray-700 rounded-sm hover:bg-gray-50 transition-colors whitespace-nowrap"
                      >
                        {t('patientDetail.createModal.todayBtn')}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">{t('patientDetail.createModal.timeLabel')}</label>
                    <select value={formData.time} onChange={(e) => setFormData(p => ({ ...p, time: e.target.value }))} className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded-sm text-xs tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400">
                      <option value="">{t('patientDetail.createModal.selectTime')}</option>
                      {availableTimeSlots.map(t2 => <option key={t2} value={t2}>{t2}</option>)}
                    </select>
                  </div>
                </div>

                <div className="px-5 py-3 flex justify-between items-center" style={{ backgroundColor: '#FAF9F7', borderTop: '1px solid #E8E5DE' }}>
                  <button onClick={() => { if (!consultationToEdit) setCreateMode('choose'); else { setShowCreateModal(false); setConsultationToEdit(null); } }} className="text-[11px] text-gray-600 hover:text-gray-800 px-2 py-1" disabled={createLoading}>
                    {consultationToEdit ? t('patientDetail.createModal.cancel') : t('patientDetail.createModal.back')}
                  </button>
                  <div className="flex gap-2">
                    {!consultationToEdit && (
                      <button onClick={() => handleCreateSubmit(true)} className="px-3 py-1.5 bg-white rounded-sm text-[11px] font-medium text-gray-700 hover:bg-[#FAF9F7] transition-colors" style={{ border: '1px solid #E8E5DE' }} disabled={createLoading}>
                        {t('patientDetail.createModal.saveAndGo')}
                      </button>
                    )}
                    <button onClick={() => handleCreateSubmit(false)} className="px-3 py-1.5 bg-emerald-600 text-white rounded-sm text-[11px] font-medium hover:bg-emerald-700 transition-colors" disabled={createLoading}>
                      {createLoading ? t('patientDetail.createModal.saving') : consultationToEdit ? t('patientDetail.createModal.save') : t('patientDetail.createModal.schedule')}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Reopen consultation modal */}
      {consultationToReopen && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 modal-backdrop" onClick={() => { if (!isReopening) setConsultationToReopen(null); }}>
          <div
            className="bg-white rounded-lg w-full max-w-sm overflow-hidden modal-panel"
            style={{ border: '1px solid #E8E5DE', boxShadow: '0 16px 40px -12px rgba(120, 100, 80, 0.22), 0 4px 12px rgba(0,0,0,0.05)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5" style={{ backgroundColor: '#FAF9F7', borderBottom: '1px solid #F0EDE8' }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{t('patientDetail.consultations.reopenEyebrow') !== 'patientDetail.consultations.reopenEyebrow' ? t('patientDetail.consultations.reopenEyebrow') : 'Consulta'}</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">{t('patientDetail.consultations.reopenHeading') !== 'patientDetail.consultations.reopenHeading' ? t('patientDetail.consultations.reopenHeading') : '¿Reabrir esta consulta?'}</p>
            </div>
            <div className="px-5 py-4">
              <p className="text-[12px] text-gray-600 leading-relaxed">{t('patientDetail.consultations.reopenMsg') !== 'patientDetail.consultations.reopenMsg' ? t('patientDetail.consultations.reopenMsg') : 'La consulta volverá a aparecer en próximas y podrás editar el plan.'}</p>
            </div>
            <div className="px-5 py-3 flex justify-end gap-2" style={{ backgroundColor: '#FAF9F7', borderTop: '1px solid #E8E5DE' }}>
              <button onClick={() => setConsultationToReopen(null)} className="px-3 py-1.5 bg-white rounded-sm text-[11px] text-gray-600 hover:bg-[#FAF9F7] transition-colors" style={{ border: '1px solid #E8E5DE' }} disabled={isReopening}>{t('patientDetail.cancel')}</button>
              <button
                onClick={async () => {
                  if (!consultationToReopen) return;
                  setIsReopening(true);
                  try {
                    await consultationService.updateConsultation(patientId, consultationToReopen, { status: 'scheduled' });
                    await fetchConsultations();
                    setConsultationToReopen(null);
                  } catch (err) {
                    console.error('Error reabriendo consulta:', err);
                  } finally {
                    setIsReopening(false);
                  }
                }}
                className="px-3 py-1.5 bg-emerald-600 text-white rounded-sm text-[11px] font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                disabled={isReopening}
              >
                {isReopening
                  ? (t('patientDetail.consultations.reopening') !== 'patientDetail.consultations.reopening' ? t('patientDetail.consultations.reopening') : 'Reabriendo…')
                  : (t('patientDetail.consultations.reopenBtn') !== 'patientDetail.consultations.reopenBtn' ? t('patientDetail.consultations.reopenBtn') : 'Sí, reabrir')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BMI info modal */}
      {showBmiInfo && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 modal-backdrop" onClick={() => setShowBmiInfo(false)}>
          <div
            className="bg-white rounded-lg w-full max-w-sm overflow-hidden modal-panel"
            style={{ border: '1px solid #E8E5DE', boxShadow: '0 16px 40px -12px rgba(120, 100, 80, 0.22), 0 4px 12px rgba(0,0,0,0.05)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5" style={{ backgroundColor: '#FAF9F7', borderBottom: '1px solid #F0EDE8' }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{t('patientDetail.evolution.bmi')}</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">{t('patientDetail.evolution.bmiInfoTitle') !== 'patientDetail.evolution.bmiInfoTitle' ? t('patientDetail.evolution.bmiInfoTitle') : '¿Qué es el Índice de Masa Corporal?'}</p>
            </div>
            <div className="px-5 py-4 space-y-3">
              <p className="text-[12px] text-gray-600 leading-relaxed">
                {t('patientDetail.evolution.bmiInfoBody1') !== 'patientDetail.evolution.bmiInfoBody1'
                  ? t('patientDetail.evolution.bmiInfoBody1')
                  : 'El IMC relaciona el peso con la altura: IMC = peso (kg) / altura² (m). Es un indicador rápido del estado nutricional, pero no distingue entre masa magra y grasa.'}
              </p>
              <div className="rounded-md overflow-hidden" style={{ border: '1px solid #F0EDE8' }}>
                <div className="px-3 py-2 flex items-center justify-between text-[11px]" style={{ backgroundColor: 'rgba(96,165,250,0.10)' }}>
                  <span className="text-blue-700 font-medium">Bajo peso</span>
                  <span className="tabular-nums text-gray-500">&lt; 18.5</span>
                </div>
                <div className="px-3 py-2 flex items-center justify-between text-[11px]" style={{ backgroundColor: 'rgba(52,211,153,0.12)' }}>
                  <span className="text-emerald-700 font-medium">Normal</span>
                  <span className="tabular-nums text-gray-500">18.5 – 24.9</span>
                </div>
                <div className="px-3 py-2 flex items-center justify-between text-[11px]" style={{ backgroundColor: 'rgba(251,191,36,0.12)' }}>
                  <span className="text-amber-700 font-medium">Sobrepeso</span>
                  <span className="tabular-nums text-gray-500">25 – 29.9</span>
                </div>
                <div className="px-3 py-2 flex items-center justify-between text-[11px]" style={{ backgroundColor: 'rgba(251,146,60,0.12)' }}>
                  <span className="text-orange-700 font-medium">Obesidad I</span>
                  <span className="tabular-nums text-gray-500">30 – 34.9</span>
                </div>
                <div className="px-3 py-2 flex items-center justify-between text-[11px]" style={{ backgroundColor: 'rgba(239,68,68,0.10)' }}>
                  <span className="text-red-700 font-medium">Obesidad II+</span>
                  <span className="tabular-nums text-gray-500">≥ 35</span>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 italic">
                {t('patientDetail.evolution.bmiInfoNote') !== 'patientDetail.evolution.bmiInfoNote'
                  ? t('patientDetail.evolution.bmiInfoNote')
                  : 'Referencia OMS. El IMC puede sobrestimar grasa en personas musculosas o subestimarla en adultos mayores.'}
              </p>
            </div>
            <div className="px-5 py-3 flex justify-end" style={{ backgroundColor: '#FAF9F7', borderTop: '1px solid #E8E5DE' }}>
              <button onClick={() => setShowBmiInfo(false)} className="px-3 py-1.5 bg-white rounded-sm text-[11px] text-gray-600 hover:bg-[#FAF9F7] transition-colors" style={{ border: '1px solid #E8E5DE' }}>{t('patientDetail.close') !== 'patientDetail.close' ? t('patientDetail.close') : 'Cerrar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Pace info modal */}
      {showPaceInfo && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 modal-backdrop" onClick={() => setShowPaceInfo(false)}>
          <div
            className="bg-white rounded-lg w-full max-w-sm overflow-hidden modal-panel"
            style={{ border: '1px solid #E8E5DE', boxShadow: '0 16px 40px -12px rgba(120, 100, 80, 0.22), 0 4px 12px rgba(0,0,0,0.05)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5" style={{ backgroundColor: '#FAF9F7', borderBottom: '1px solid #F0EDE8' }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{t('patientDetail.evolution.pace') !== 'patientDetail.evolution.pace' ? t('patientDetail.evolution.pace') : 'Ritmo'}</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">{t('patientDetail.evolution.paceInfoTitle') !== 'patientDetail.evolution.paceInfoTitle' ? t('patientDetail.evolution.paceInfoTitle') : '¿Cómo se calcula el ritmo?'}</p>
            </div>
            <div className="px-5 py-4 space-y-3">
              <p className="text-[12px] text-gray-600 leading-relaxed">
                {t('patientDetail.evolution.paceInfoBody1') !== 'patientDetail.evolution.paceInfoBody1'
                  ? t('patientDetail.evolution.paceInfoBody1')
                  : 'Es el cambio promedio de peso por semana, calculado entre el primer registro y el último: (peso actual − peso inicial) ÷ semanas.'}
              </p>
              <div className="rounded-md overflow-hidden" style={{ border: '1px solid #F0EDE8' }}>
                <div className="px-3 py-2 flex items-center justify-between text-[11px]" style={{ backgroundColor: 'rgba(229,231,235,0.5)' }}>
                  <span className="text-gray-600 font-medium">Estable</span>
                  <span className="tabular-nums text-gray-500">&lt; 0.1 kg/sem</span>
                </div>
                <div className="px-3 py-2 flex items-center justify-between text-[11px]" style={{ backgroundColor: 'rgba(52,211,153,0.14)' }}>
                  <span className="text-emerald-700 font-medium">Saludable</span>
                  <span className="tabular-nums text-gray-500">0.1 – 1 kg/sem</span>
                </div>
                <div className="px-3 py-2 flex items-center justify-between text-[11px]" style={{ backgroundColor: 'rgba(251,146,60,0.14)' }}>
                  <span className="text-amber-700 font-medium">Acelerado</span>
                  <span className="tabular-nums text-gray-500">&gt; 1 kg/sem</span>
                </div>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                {t('patientDetail.evolution.paceInfoBody2') !== 'patientDetail.evolution.paceInfoBody2'
                  ? t('patientDetail.evolution.paceInfoBody2')
                  : 'Un ritmo saludable de pérdida o ganancia ronda los 0.5 kg por semana (≈ 0.5–1 % del peso corporal). Cambios más rápidos suelen reflejar pérdida de masa magra o agua, no grasa.'}
              </p>
              <p className="text-[10px] text-gray-400 italic">
                {t('patientDetail.evolution.paceInfoNote') !== 'patientDetail.evolution.paceInfoNote'
                  ? t('patientDetail.evolution.paceInfoNote')
                  : 'Necesitas al menos 2 registros de peso para calcular el ritmo.'}
              </p>
            </div>
            <div className="px-5 py-3 flex justify-end" style={{ backgroundColor: '#FAF9F7', borderTop: '1px solid #E8E5DE' }}>
              <button onClick={() => setShowPaceInfo(false)} className="px-3 py-1.5 bg-white rounded-sm text-[11px] text-gray-600 hover:bg-[#FAF9F7] transition-colors" style={{ border: '1px solid #E8E5DE' }}>{t('patientDetail.close') !== 'patientDetail.close' ? t('patientDetail.close') : 'Cerrar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Single record info modal */}
      {showSingleRecordInfo && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 modal-backdrop" onClick={() => setShowSingleRecordInfo(false)}>
          <div
            className="bg-white rounded-lg w-full max-w-sm overflow-hidden modal-panel"
            style={{ border: '1px solid #E8E5DE', boxShadow: '0 16px 40px -12px rgba(120, 100, 80, 0.22), 0 4px 12px rgba(0,0,0,0.05)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5" style={{ backgroundColor: '#FAF9F7', borderBottom: '1px solid #F0EDE8' }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{t('patientDetail.evolution.title')}</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">{t('patientDetail.evolution.singleRecordTitle') !== 'patientDetail.evolution.singleRecordTitle' ? t('patientDetail.evolution.singleRecordTitle') : '¿Por qué solo veo un punto?'}</p>
            </div>
            <div className="px-5 py-4 space-y-3">
              <p className="text-[12px] text-gray-600 leading-relaxed">
                {t('patientDetail.evolution.singleRecordBody1') !== 'patientDetail.evolution.singleRecordBody1'
                  ? t('patientDetail.evolution.singleRecordBody1')
                  : 'Hasta ahora solo hay un peso registrado, tomado en la primera consulta del paciente.'}
              </p>
              <p className="text-[12px] text-gray-600 leading-relaxed">
                {t('patientDetail.evolution.singleRecordBody2') !== 'patientDetail.evolution.singleRecordBody2'
                  ? t('patientDetail.evolution.singleRecordBody2')
                  : 'En la próxima consulta, al registrar un nuevo peso, aparecerá la línea de evolución y se podrá calcular el ritmo (kg/semana) y el progreso real hacia la meta.'}
              </p>
              <div className="rounded-md p-2.5 flex items-start gap-2" style={{ backgroundColor: '#FAF9F7', border: '1px solid #F0EDE8' }}>
                <Info className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  {t('patientDetail.evolution.singleRecordTip') !== 'patientDetail.evolution.singleRecordTip'
                    ? t('patientDetail.evolution.singleRecordTip')
                    : 'El IMC y la categoría se calculan igual con un solo registro, pero el “Ritmo” necesita al menos 2 mediciones.'}
                </p>
              </div>
            </div>
            <div className="px-5 py-3 flex justify-end" style={{ backgroundColor: '#FAF9F7', borderTop: '1px solid #E8E5DE' }}>
              <button onClick={() => setShowSingleRecordInfo(false)} className="px-3 py-1.5 bg-white rounded-sm text-[11px] text-gray-600 hover:bg-[#FAF9F7] transition-colors" style={{ border: '1px solid #E8E5DE' }}>{t('patientDetail.close') !== 'patientDetail.close' ? t('patientDetail.close') : 'Cerrar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Chart info modal */}
      {showChartInfo && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 modal-backdrop" onClick={() => setShowChartInfo(false)}>
          <div
            className="bg-white rounded-lg w-full max-w-sm overflow-hidden modal-panel"
            style={{ border: '1px solid #E8E5DE', boxShadow: '0 16px 40px -12px rgba(120, 100, 80, 0.22), 0 4px 12px rgba(0,0,0,0.05)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5" style={{ backgroundColor: '#FAF9F7', borderBottom: '1px solid #F0EDE8' }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{t('patientDetail.evolution.title')}</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">{t('patientDetail.evolution.infoTitle') !== 'patientDetail.evolution.infoTitle' ? t('patientDetail.evolution.infoTitle') : '¿Qué muestra este gráfico?'}</p>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="flex gap-3">
                <span className="mt-1 inline-block w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: 'rgb(16, 185, 129)' }} />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">{t('patientDetail.evolution.weightKg')}</p>
                  <p className="text-[12px] text-gray-600 leading-relaxed mt-0.5">Línea verde con la evolución del peso registrado en cada consulta.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="mt-1 inline-block w-3 h-0.5 flex-shrink-0" style={{ backgroundColor: 'rgba(244, 114, 182, 0.9)', borderTop: '2px dashed rgba(244, 114, 182, 0.9)', height: 0 }} />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-pink-600">{t('patientDetail.evolution.weightGoal')}</p>
                  <p className="text-[12px] text-gray-600 leading-relaxed mt-0.5">Línea punteada con el peso meta del paciente.</p>
                </div>
              </div>
              <div className="pt-2" style={{ borderTop: '1px solid #F0EDE8' }}>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2">Bandas de IMC (fondo)</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-[11px] text-gray-600"><span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: 'rgba(96, 165, 250, 0.35)' }} /> Bajo peso (&lt; 18.5)</div>
                  <div className="flex items-center gap-2 text-[11px] text-gray-600"><span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: 'rgba(52, 211, 153, 0.35)' }} /> Normal (18.5 – 25)</div>
                  <div className="flex items-center gap-2 text-[11px] text-gray-600"><span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: 'rgba(251, 191, 36, 0.35)' }} /> Sobrepeso (25 – 30)</div>
                  <div className="flex items-center gap-2 text-[11px] text-gray-600"><span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: 'rgba(251, 146, 60, 0.35)' }} /> Obesidad I (30 – 35)</div>
                  <div className="flex items-center gap-2 text-[11px] text-gray-600"><span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: 'rgba(239, 68, 68, 0.35)' }} /> Obesidad II+ (&gt; 35)</div>
                </div>
                <p className="text-[10px] text-gray-400 mt-2 italic">Las bandas se calculan a partir de la altura del paciente.</p>
              </div>
            </div>
            <div className="px-5 py-3 flex justify-end" style={{ backgroundColor: '#FAF9F7', borderTop: '1px solid #E8E5DE' }}>
              <button onClick={() => setShowChartInfo(false)} className="px-3 py-1.5 bg-white rounded-sm text-[11px] text-gray-600 hover:bg-[#FAF9F7] transition-colors" style={{ border: '1px solid #E8E5DE' }}>{t('patientDetail.close') !== 'patientDetail.close' ? t('patientDetail.close') : 'Cerrar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Status info modal */}
      {showStatusInfo && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 modal-backdrop" onClick={() => setShowStatusInfo(false)}>
          <div
            className="bg-white rounded-lg w-full max-w-sm overflow-hidden modal-panel"
            style={{ border: '1px solid #E8E5DE', boxShadow: '0 16px 40px -12px rgba(120, 100, 80, 0.22), 0 4px 12px rgba(0,0,0,0.05)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5" style={{ backgroundColor: '#FAF9F7', borderBottom: '1px solid #F0EDE8' }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{t('patientDetail.status.infoEyebrow') !== 'patientDetail.status.infoEyebrow' ? t('patientDetail.status.infoEyebrow') : 'Estados'}</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">{t('patientDetail.status.infoTitle') !== 'patientDetail.status.infoTitle' ? t('patientDetail.status.infoTitle') : '¿Qué significa cada estado?'}</p>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="flex gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0" />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">{t('patientDetail.status.active')}</p>
                  <p className="text-[12px] text-gray-600 leading-relaxed mt-0.5">{t('patientDetail.status.activeDesc') !== 'patientDetail.status.activeDesc' ? t('patientDetail.status.activeDesc') : 'Paciente en seguimiento, con consultas programadas o recientes.'}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">{t('patientDetail.status.discharged')}</p>
                  <p className="text-[12px] text-gray-600 leading-relaxed mt-0.5">{t('patientDetail.status.dischargedDesc') !== 'patientDetail.status.dischargedDesc' ? t('patientDetail.status.dischargedDesc') : 'Paciente que completó su proceso y fue dado de alta.'}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{t('patientDetail.status.lost')}</p>
                  <p className="text-[12px] text-gray-600 leading-relaxed mt-0.5">{t('patientDetail.status.lostDesc') !== 'patientDetail.status.lostDesc' ? t('patientDetail.status.lostDesc') : 'Paciente sin contacto reciente o que abandonó el seguimiento.'}</p>
                </div>
              </div>
            </div>
            <div className="px-5 py-3 flex justify-end" style={{ backgroundColor: '#FAF9F7', borderTop: '1px solid #E8E5DE' }}>
              <button onClick={() => setShowStatusInfo(false)} className="px-3 py-1.5 bg-white rounded-sm text-[11px] text-gray-600 hover:bg-[#FAF9F7] transition-colors" style={{ border: '1px solid #E8E5DE' }}>{t('patientDetail.close') !== 'patientDetail.close' ? t('patientDetail.close') : 'Cerrar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete consultation modal */}
      {isDeleteConsultModalOpen && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 modal-backdrop" onClick={() => { setIsDeleteConsultModalOpen(false); setConsultationToDelete(null); }}>
          <div
            className="bg-white rounded-lg w-full max-w-sm overflow-hidden modal-panel"
            style={{ border: '1px solid #E8E5DE', boxShadow: '0 16px 40px -12px rgba(120, 100, 80, 0.22), 0 4px 12px rgba(0,0,0,0.05)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5" style={{ backgroundColor: '#FAF9F7', borderBottom: '1px solid #F0EDE8' }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{t('patientDetail.deleteConsultModal.eyebrow')}</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">{t('patientDetail.deleteConsultModal.title')}</p>
            </div>
            <div className="px-5 py-4">
              <p className="text-[12px] text-gray-600">{t('patientDetail.deleteConsultModal.message')}</p>
            </div>
            <div className="px-5 py-3 flex justify-end gap-2" style={{ backgroundColor: '#FAF9F7', borderTop: '1px solid #E8E5DE' }}>
              <button onClick={() => { setIsDeleteConsultModalOpen(false); setConsultationToDelete(null); }} className="px-3 py-1.5 bg-white rounded-sm text-[11px] text-gray-600 hover:bg-[#FAF9F7] transition-colors" style={{ border: '1px solid #E8E5DE' }} disabled={consultLoading}>{t('patientDetail.cancel')}</button>
              <button onClick={handleDeleteConsultConfirm} className="px-3 py-1.5 bg-red-600 text-white rounded-sm text-[11px] font-medium hover:bg-red-700 transition-colors" disabled={consultLoading}>
                {consultLoading ? t('patientDetail.deleting') : t('patientDetail.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload document modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 modal-backdrop" onClick={() => { if (!isUploading) setShowUploadModal(false); }}>
          <div
            className="bg-white rounded-lg w-full max-w-sm overflow-hidden modal-panel"
            style={{ border: '1px solid #E8E5DE', boxShadow: '0 16px 40px -12px rgba(120, 100, 80, 0.22), 0 4px 12px rgba(0,0,0,0.05)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5" style={{ backgroundColor: '#FAF9F7', borderBottom: '1px solid #F0EDE8' }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{t('patientDetail.documents.modalEyebrow')}</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">{t('patientDetail.documents.modalTitle')}</p>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">{t('patientDetail.documents.nameLabel')}</label>
                <input type="text" value={newDocumentName} onChange={(e) => setNewDocumentName(e.target.value)} className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded-sm text-xs focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400" placeholder={t('patientDetail.documents.namePh')} disabled={isUploading} />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">{t('patientDetail.documents.fileLabel')}</label>
                <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setSelectedFile(e.target.files[0]);
                    if (!newDocumentName.trim()) setNewDocumentName(e.target.files[0].name.split('.').slice(0, -1).join('.'));
                  }
                }} disabled={isUploading} />
                {!selectedFile ? (
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading}
                    className="w-full px-3 py-3 text-[11px] text-gray-500 bg-white border border-dashed rounded-sm hover:bg-gray-50 transition-colors flex flex-col items-center gap-1"
                    style={{ borderColor: '#D1CFC9' }}>
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.9A5 5 0 0115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    <span>{t('patientDetail.documents.choose')}</span>
                  </button>
                ) : (
                  <div className="px-3 py-2 bg-white border rounded-sm flex items-center justify-between gap-2" style={{ borderColor: '#E8E5DE' }}>
                    <div className="flex items-center gap-2 min-w-0">
                      <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      <div className="min-w-0">
                        <p className="text-[11px] text-gray-700 truncate" title={selectedFile.name}>{selectedFile.name}</p>
                        <p className="text-[10px] text-gray-400 tabular-nums">{formatFileSize(selectedFile.size)}</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} disabled={isUploading}
                      className="text-gray-400 hover:text-red-500 flex-shrink-0" title={t('patientDetail.cancel')}>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                )}
              </div>
              {isUploading && (
                <div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5"><div className="bg-emerald-600 h-1.5 rounded-full transition-all" style={{ width: `${uploadProgress}%` }}></div></div>
                  <p className="text-[10px] text-gray-500 mt-1 tabular-nums">{Math.round(uploadProgress)}%</p>
                </div>
              )}
              {uploadError && <p className="text-[11px] text-red-600 bg-red-50 p-2 rounded">{uploadError}</p>}
            </div>
            <div className="px-5 py-3 flex justify-end gap-2" style={{ backgroundColor: '#FAF9F7', borderTop: '1px solid #E8E5DE' }}>
              <button onClick={() => { if (!isUploading) setShowUploadModal(false); }} className="px-3 py-1.5 bg-white rounded-sm text-[11px] text-gray-600 hover:bg-[#FAF9F7] transition-colors" style={{ border: '1px solid #E8E5DE' }} disabled={isUploading}>{t('patientDetail.cancel')}</button>
              <button onClick={uploadFileToFirebase} className="px-3 py-1.5 bg-emerald-600 text-white rounded-sm text-[11px] font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors" disabled={isUploading || !selectedFile}>
                {isUploading ? t('patientDetail.documents.uploading') : t('patientDetail.documents.uploadBtn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete document modal */}
      {showDeleteDocModal && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 modal-backdrop" onClick={() => { if (!isDeletingDoc) setShowDeleteDocModal(false); }}>
          <div
            className="bg-white rounded-lg w-full max-w-sm overflow-hidden modal-panel"
            style={{ border: '1px solid #E8E5DE', boxShadow: '0 16px 40px -12px rgba(120, 100, 80, 0.22), 0 4px 12px rgba(0,0,0,0.05)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5" style={{ backgroundColor: '#FAF9F7', borderBottom: '1px solid #F0EDE8' }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{t('patientDetail.documents.deleteEyebrow')}</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">{t('patientDetail.documents.deleteTitle')}</p>
            </div>
            <div className="px-5 py-4">
              <p className="text-[12px] text-gray-600">{t('patientDetail.documents.deleteMsg')}</p>
            </div>
            <div className="px-5 py-3 flex justify-end gap-2" style={{ backgroundColor: '#FAF9F7', borderTop: '1px solid #E8E5DE' }}>
              <button onClick={() => setShowDeleteDocModal(false)} className="px-3 py-1.5 bg-white rounded-sm text-[11px] text-gray-600 hover:bg-[#FAF9F7] transition-colors" style={{ border: '1px solid #E8E5DE' }} disabled={isDeletingDoc}>{t('patientDetail.cancel')}</button>
              <button onClick={confirmDeleteDocument} className="px-3 py-1.5 bg-red-600 text-white rounded-sm text-[11px] font-medium hover:bg-red-700 transition-colors" disabled={isDeletingDoc}>
                {isDeletingDoc ? t('patientDetail.deleting') : t('patientDetail.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDetailPage;
