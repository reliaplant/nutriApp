'use client'

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { differenceInYears, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
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
  status: 'active' | 'discharged' | 'lost';
  nutritionistId: string;
  photoUrl?: string;
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
      alert('Error al subir la imagen.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="relative w-16 h-16 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
      {patient.photoUrl ? (
        <img src={patient.photoUrl} alt={patient.name} className="w-16 h-16 rounded-full object-cover border border-emerald-200" />
      ) : (
        <div className="w-16 h-16 rounded-full border border-emerald-200 bg-emerald-50 flex items-center justify-center">
          <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      )}
      <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-all">
        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      {isUploading && (
        <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/50">
          <div className="animate-spin h-6 w-6 border-2 border-white rounded-full border-t-transparent"></div>
        </div>
      )}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────
const PatientDetailPage = () => {
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
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', birthDate: '', height: 0, gender: 'other' as string, country: '' });
  const [isDeletePatientModalOpen, setIsDeletePatientModalOpen] = useState(false);
  const [isDeletingPatient, setIsDeletingPatient] = useState(false);

  // ── Consultas state ──
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [consultationToEdit, setConsultationToEdit] = useState<Consultation | null>(null);
  const [isDeleteConsultModalOpen, setIsDeleteConsultModalOpen] = useState(false);
  const [consultationToDelete, setConsultationToDelete] = useState<string | null>(null);
  const [consultLoading, setConsultLoading] = useState(false);
  const [consultError, setConsultError] = useState<string | null>(null);

  // ── CreateConsultation state ──
  const [formData, setFormData] = useState({ date: '', time: '' });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

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
          setEditForm({ name: fetched.name || '', email: fetched.email || '', phone: fetched.phone || '', birthDate: fetched.birthDate || '', height: fetched.height || 0, gender: fetched.gender || 'other', country: fetched.country || '' });
          if (fetched.currentWeight) setWeightGoal(Math.round(fetched.currentWeight * 0.95 * 10) / 10);
        } else {
          setError('No se encontró el paciente');
        }
      } catch { setError('Error al cargar los datos del paciente'); }
      finally { setLoading(false); }
    };
    fetchPatientData();
  }, [patientId]);

  useEffect(() => { if (patientId && patientId !== 'new') fetchConsultations(); }, [patientId]);
  useEffect(() => { if (patientId && patientId !== 'new') fetchDocuments(); }, [patientId]);

  useEffect(() => {
    setEditForm({ name: patient.name || '', email: patient.email || '', phone: patient.phone || '', birthDate: patient.birthDate || '', height: patient.height || 0, gender: patient.gender || 'other', country: patient.country || '' });
  }, [patient]);

  useEffect(() => {
    if (showCreateModal && consultationToEdit) {
      const dateStr = consultationToEdit.date.split('T')[0];
      const timeStr = consultationToEdit.date.includes('T') ? consultationToEdit.date.split('T')[1].substring(0, 5) : '00:00';
      setFormData({ date: dateStr, time: timeStr });
    } else if (showCreateModal && !consultationToEdit) {
      setFormData({ date: '', time: '' });
    }
  }, [showCreateModal, consultationToEdit]);

  // ── Consultas functions ──
  const fetchConsultations = async () => {
    setConsultLoading(true);
    setConsultError(null);
    try {
      const fetched = await consultationService.getConsultationsByPatient(patientId);
      setConsultations(fetched);
      // Build weight history from completed consultations
      const completed = fetched.filter(c => c.status === 'completed' && c.weight);
      const wh = completed.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(c => ({ date: c.date, weight: c.weight! }));
      setWeightHistory(wh);
    } catch { setConsultError('Error al cargar las consultas'); }
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
        setConsultError('Error al eliminar la consulta');
      }
    } finally { setConsultLoading(false); }
  };

  const handleCreateSubmit = async () => {
    if (!formData.date) { setCreateError('La fecha es obligatoria'); return; }
    if (!formData.time) { setCreateError('La hora es obligatoria'); return; }
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
      } else {
        const newC: Consultation = { patientId, date: dateWithTime, status: 'scheduled', highlights: [] };
        const id = await consultationService.createConsultation(newC);
        handleConsultationCreated({ ...newC, id });
      }
      setFormData({ date: '', time: '' });
      setShowCreateModal(false);
    } catch { setCreateError('Error al guardar la consulta'); }
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
    } catch { alert('Error al eliminar paciente.'); }
    finally { setIsDeletingPatient(false); setIsDeletePatientModalOpen(false); }
  };

  const handleSavePatientChanges = () => {
    handlePatientUpdate({ ...patient, name: editForm.name, email: editForm.email, phone: editForm.phone, birthDate: editForm.birthDate, height: editForm.height, gender: editForm.gender as 'male' | 'female' | 'other', country: editForm.country });
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
  const getBMICategory = (b: number) => {
    if (b < 18.5) return { category: "Bajo peso", color: "text-blue-600" };
    if (b < 25) return { category: "Normal", color: "text-green-600" };
    if (b < 30) return { category: "Sobrepeso", color: "text-yellow-600" };
    if (b < 35) return { category: "Obesidad grado 1", color: "text-orange-600" };
    if (b < 40) return { category: "Obesidad grado 2", color: "text-red-600" };
    return { category: "Obesidad grado 3", color: "text-red-800" };
  };
  const bmiCategory = bmi ? getBMICategory(bmi) : null;
  const calculateIdealWeight = () => {
    if (!patient.height) return null;
    const hm = patient.height / 100;
    return { min: Math.round(18.5 * hm * hm * 10) / 10, max: Math.round(24.9 * hm * hm * 10) / 10 };
  };
  const idealWeight = calculateIdealWeight();

  const chartData = {
    labels: hasWeightData ? weightHistory.map(r => format(parseISO(r.date), "d MMM", { locale: es })) : [],
    datasets: [
      { label: 'Peso (kg)', data: hasWeightData ? weightHistory.map(r => r.weight) : [], borderColor: 'rgb(16, 185, 129)', fill: true, backgroundColor: 'rgba(16, 185, 129, 0.1)', tension: 0.1 },
      { label: 'Objetivo (kg)', data: hasWeightData ? Array(weightHistory.length).fill(weightGoal) : [], borderColor: 'rgba(255, 99, 132, 1)', borderDash: [5, 5], fill: false, pointRadius: 0 }
    ]
  };
  const chartOptions = { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: false } }, plugins: { legend: { position: 'top' as const }, tooltip: { mode: 'index' as const, intersect: false } } };

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
    if (!selectedFile || !newDocumentName.trim()) { setUploadError('Se requiere un archivo y un nombre'); return; }
    setIsUploading(true); setUploadError(null); setUploadProgress(0);
    try {
      const ext = selectedFile.name.split('.').pop();
      const uniqueName = `${Date.now()}-${patientId.substring(0, 8)}.${ext}`;
      const storagePath = `pacientes/${patientId}/documentos/${uniqueName}`;
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, selectedFile);
      uploadTask.on('state_changed',
        (snap) => setUploadProgress((snap.bytesTransferred / snap.totalBytes) * 100),
        () => { setUploadError('Error al subir el archivo.'); setIsUploading(false); },
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
    } catch { setUploadError('Error al iniciar la carga.'); setIsUploading(false); }
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
    } catch { alert('Error al eliminar el documento.'); }
    finally { setIsDeletingDoc(false); setShowDeleteDocModal(false); setDocumentToDelete(null); }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  // ── Helpers ──
  const formatDate = (dateString?: string | null): string => {
    if (!dateString) return 'No disponible';
    try { return format(parseISO(dateString), "d 'de' MMMM, yyyy", { locale: es }); }
    catch { return 'Fecha inválida'; }
  };

  const formatConsultDate = (dateString: string): string => {
    try { return format(parseISO(dateString), "d 'de' MMMM, yyyy - HH:mm", { locale: es }); }
    catch { return dateString; }
  };

  const calculateAge = (birthDate?: string | null): number | null => {
    if (!birthDate) return null;
    try { return differenceInYears(new Date(), new Date(birthDate)); }
    catch { return null; }
  };

  const lastWeight = getLastRecordedWeight();

  // ── Loading / Error states ──
  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent"></div>
    </div>
  );

  if (error) return <div className="p-4 bg-red-50 text-red-700 rounded-sm text-xs">{error}</div>;

  // ─── RENDER ─────────────────────────────────────────────
  return (
    <div className="flex flex-row min-h-screen bg-gray-50">
      {/* ════════ PANEL IZQUIERDO - DATOS PACIENTE ════════ */}
      <div className="w-full md:w-1/4 bg-white border-r border-gray-200 p-5">
        <div className="flex items-center mb-5">
          <div className="mr-3">
            <PatientAvatar patient={patient} onImageUpdate={(url) => handlePatientUpdate({ ...patient, photoUrl: url } as Patient)} />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-800">{patient.name}</h1>
            <select
              value={patient.status}
              onChange={(e) => handlePatientUpdate({ ...patient, status: e.target.value as 'active' | 'discharged' | 'lost' })}
              className={`mt-1 p-0.5 !pr-5 rounded-sm text-[10px] focus:outline-none ${
                patient.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                patient.status === 'discharged' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'
              }`}
            >
              <option value="active">Activo</option>
              <option value="discharged">Alta</option>
              <option value="lost">Perdido</option>
            </select>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <div className="flex justify-between items-center mb-3">
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-gray-400">Información Personal</p>
            {!isEditingPatient && (
              <button onClick={() => setIsEditingPatient(true)} className="text-[11px] text-emerald-600 hover:underline">Editar</button>
            )}
          </div>

          {isEditingPatient ? (
            <form className="space-y-3">
              {[
                { id: 'name', label: 'Nombre completo', type: 'text', value: editForm.name },
                { id: 'email', label: 'Correo electrónico', type: 'email', value: editForm.email },
                { id: 'phone', label: 'Teléfono', type: 'text', value: editForm.phone },
                { id: 'country', label: 'País', type: 'text', value: editForm.country },
                { id: 'birthDate', label: 'Fecha de nacimiento', type: 'date', value: editForm.birthDate },
                { id: 'height', label: 'Altura (cm)', type: 'number', value: editForm.height },
              ].map(f => (
                <div key={f.id}>
                  <label className="block text-[10px] font-medium uppercase tracking-[0.12em] text-gray-400">{f.label}</label>
                  <input
                    name={f.id} type={f.type} value={f.value}
                    onChange={(e) => setEditForm(prev => ({ ...prev, [f.id]: f.type === 'number' ? Number(e.target.value) : e.target.value }))}
                    className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-sm mt-1 text-xs"
                  />
                </div>
              ))}
              <div>
                <label className="block text-[10px] font-medium uppercase tracking-[0.12em] text-gray-400">Género</label>
                <select name="gender" value={editForm.gender} onChange={(e) => setEditForm(prev => ({ ...prev, gender: e.target.value }))} className="w-full p-1.5 border border-gray-200 rounded-sm mt-1 bg-white text-xs">
                  <option value="male">Masculino</option>
                  <option value="female">Femenino</option>
                  <option value="other">Otro</option>
                </select>
              </div>
              <div className="flex space-x-2 pt-2">
                <button type="button" onClick={() => setIsEditingPatient(false)} className="flex-1 py-1.5 border border-gray-200 rounded-sm text-xs hover:bg-gray-50">Cancelar</button>
                <button type="button" onClick={handleSavePatientChanges} className="flex-1 bg-emerald-600 text-white py-1.5 rounded-sm text-xs hover:bg-emerald-700">Guardar</button>
              </div>
            </form>
          ) : (
            <div className="space-y-2.5">
              {[
                { label: 'Correo', value: patient.email },
                { label: 'Teléfono', value: patient.phone },
                { label: 'País', value: patient.country },
                { label: 'Nacimiento', value: patient.birthDate ? `${formatDate(patient.birthDate)} ${calculateAge(patient.birthDate) !== null ? `(${calculateAge(patient.birthDate)} años)` : ''}` : 'No registrada' },
                { label: 'Género', value: patient.gender === 'male' ? 'Masculino' : patient.gender === 'female' ? 'Femenino' : 'Otro' },
                { label: 'Altura', value: `${patient.height} cm` },
              ].map(f => (
                <div key={f.label}>
                  <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-gray-400">{f.label}</p>
                  <p className="text-xs text-gray-800">{f.value}</p>
                </div>
              ))}
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-gray-400">Último peso</p>
                {lastWeight.weight ? (
                  <>
                    <p className="text-xs text-gray-800">{lastWeight.weight} kg</p>
                    <p className="text-[10px] text-gray-400">Tomado el {format(parseISO(lastWeight.date!), "d 'de' MMMM, yyyy", { locale: es })}</p>
                  </>
                ) : <p className="text-xs text-gray-400 italic">Se registrará en la primera consulta</p>}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 mt-6 pt-3">
          <button onClick={() => setIsDeletePatientModalOpen(true)} className="text-[10px] text-gray-300 hover:text-red-500 transition-colors">Eliminar paciente</button>
        </div>

        {/* Delete patient modal */}
        {isDeletePatientModalOpen && (
          <div className="fixed inset-0 bg-black/35 flex items-center justify-center z-50">
            <div className="bg-white rounded-sm p-5 max-w-sm w-full border border-gray-200">
              <p className="text-xs font-medium text-gray-800 mb-2">Confirmar eliminación</p>
              <p className="text-[11px] text-gray-500 mb-1">Se eliminará permanentemente:</p>
              <ul className="list-disc pl-4 mb-3 text-[11px] text-gray-500 space-y-0.5">
                <li>Datos personales</li><li>Historial de consultas</li><li>Documentos y archivos</li><li>Planes nutricionales</li>
              </ul>
              <div className="flex justify-end space-x-2">
                <button onClick={() => setIsDeletePatientModalOpen(false)} className="px-3 py-1.5 border border-gray-200 rounded-sm text-[11px] text-gray-600 hover:bg-gray-50" disabled={isDeletingPatient}>Cancelar</button>
                <button onClick={handleDeletePatient} className="px-3 py-1.5 bg-red-600 text-white rounded-sm text-[11px] hover:bg-red-700" disabled={isDeletingPatient}>
                  {isDeletingPatient ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ════════ PANEL DERECHO ════════ */}
      <div className="w-3/4 p-4 space-y-4">
        {patientId !== 'new' ? (
          <>
            {/* ──── CONSULTAS ──── */}
            <div className="bg-white border border-gray-200 rounded-sm p-4">
              <div className="flex justify-between items-center mb-3">
                <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-gray-400">Consultas</p>
                <button
                  onClick={() => { setConsultationToEdit(null); setShowCreateModal(true); }}
                  className={`text-[11px] rounded-sm px-2.5 py-1 flex items-center ${hasScheduledConsultation ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                  disabled={hasScheduledConsultation}
                >
                  <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                  Nueva consulta
                </button>
              </div>

              {consultError && <div className="bg-red-50 text-red-600 p-2 rounded-sm mb-3 text-xs">{consultError}</div>}

              {consultLoading && consultations.length === 0 ? (
                <div className="flex justify-center py-6"><div className="animate-spin rounded-full h-6 w-6 border-2 border-emerald-600 border-t-transparent"></div></div>
              ) : (
                <>
                  <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-gray-400 mb-2 mt-2">Programadas</p>
                  {scheduledConsultations.length > 0 ? (
                    <div className="space-y-2 mb-4">
                      {scheduledConsultations.map(c => (
                        <div key={c.id} className="border border-gray-200 rounded-sm p-3">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <div className="h-2 w-2 rounded-full mr-2 bg-amber-400"></div>
                              <span className="text-xs text-gray-800">{formatConsultDate(c.date)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <button onClick={() => router.push(`/consulta/${c.id}?patientId=${patientId}`)} className="text-[10px] bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-sm text-gray-600 hover:bg-gray-100">Ir a plan</button>
                              <button onClick={() => { setConsultationToEdit(c); setShowCreateModal(true); }} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-sm hover:bg-blue-100">Editar</button>
                              <button onClick={() => { setConsultationToDelete(c.id!); setIsDeleteConsultModalOpen(true); }} className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-sm hover:bg-red-100">Eliminar</button>
                            </div>
                          </div>
                          {c.weight && <p className="mt-1 text-[11px] text-gray-500">Peso: {c.weight} kg</p>}
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-xs text-gray-400 text-center py-3 mb-4">No hay consultas programadas</p>}

                  <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-gray-400 mb-2">Previas</p>
                  {previousConsultations.length > 0 ? (
                    <div className="space-y-2">
                      {previousConsultations.map(c => (
                        <div key={c.id} className="border border-gray-200 rounded-sm p-3 bg-gray-50/50">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <div className="h-2 w-2 rounded-full mr-2 bg-emerald-500"></div>
                              <span className="text-xs text-gray-800">{formatConsultDate(c.date)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <button onClick={() => router.push(`/consulta/${c.id}?patientId=${patientId}`)} className="text-[10px] bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-sm text-gray-600 hover:bg-gray-100">Ir a plan</button>
                              <button onClick={() => { setConsultationToDelete(c.id!); setIsDeleteConsultModalOpen(true); }} className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-sm hover:bg-red-100">Eliminar</button>
                            </div>
                          </div>
                          {c.weight && <p className="mt-1 text-[11px] text-gray-500">Peso: {c.weight} kg</p>}
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-xs text-gray-400 text-center py-3">No hay consultas previas</p>}
                </>
              )}
            </div>

            {/* ──── EVOLUCIÓN ──── */}
            <div className="bg-white border border-gray-200 rounded-sm p-4">
              <div className="flex justify-between items-center mb-3">
                <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-gray-400">Evolución de peso</p>
                {isEditingGoal ? (
                  <div className="flex items-center space-x-1">
                    <input type="number" value={weightGoal} onChange={(e) => setWeightGoal(Number(e.target.value))} className="w-16 p-1 border border-gray-200 rounded-sm text-xs" step="0.1" />
                    <span className="text-[10px] text-gray-400">kg</span>
                    <button onClick={() => setIsEditingGoal(false)} className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-sm hover:bg-emerald-700">Guardar</button>
                  </div>
                ) : (
                  <button onClick={() => setIsEditingGoal(true)} className="text-[11px] text-emerald-600 hover:underline">Editar objetivo</button>
                )}
              </div>

              <div className="h-56">
                {hasWeightData ? (
                  <Line data={chartData} options={chartOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-50 rounded-sm">
                    <p className="text-xs text-gray-400">No hay datos de peso disponibles</p>
                  </div>
                )}
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-gray-50 p-3 rounded-sm">
                  <div className="grid grid-cols-3 gap-3 text-[11px]">
                    <div><p className="text-[10px] font-medium uppercase tracking-[0.12em] text-gray-400">Inicial</p><p className="text-gray-800">{initialWeight !== null ? `${initialWeight} kg` : '—'}</p></div>
                    <div><p className="text-[10px] font-medium uppercase tracking-[0.12em] text-gray-400">Actual</p><p className="text-gray-800">{currentWeight !== null ? `${currentWeight} kg` : '—'}</p></div>
                    <div><p className="text-[10px] font-medium uppercase tracking-[0.12em] text-gray-400">Cambio</p>
                      {initialWeight !== null && currentWeight !== null ? (
                        <p className={weightChange < 0 ? 'text-green-600' : weightChange > 0 ? 'text-red-600' : 'text-gray-600'}>{weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg</p>
                      ) : <p className="text-gray-400">—</p>}
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-sm">
                  <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-gray-400">IMC</p>
                  {bmi !== null ? (
                    <><p className="text-lg font-semibold text-gray-800">{bmi.toFixed(1)}</p><p className={`text-[10px] ${bmiCategory?.color}`}>{bmiCategory?.category}</p></>
                  ) : <p className="text-xs text-gray-400 italic">Se requiere altura y peso</p>}
                </div>
                <div className="bg-gray-50 p-3 rounded-sm">
                  <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-gray-400">Peso objetivo</p>
                  <p className="text-lg font-semibold text-gray-800">{weightGoal} kg</p>
                  {idealWeight && <p className="text-[10px] text-gray-400">Ideal: {idealWeight.min} - {idealWeight.max} kg</p>}
                </div>
                {hasMultipleWeightData && initialWeight !== null && currentWeight !== null && initialWeight > currentWeight && (
                  <div className="bg-gray-50 p-3 rounded-sm">
                    <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-gray-400">Peso perdido</p>
                    <p className="text-lg font-semibold text-gray-800">{(initialWeight - currentWeight).toFixed(1)} kg</p>
                    <p className="text-[10px] text-gray-400">{(((initialWeight - currentWeight) / initialWeight) * 100).toFixed(1)}% del inicial</p>
                  </div>
                )}
                {currentWeight !== null && weightGoal > 0 && currentWeight > weightGoal && (
                  <div className="bg-gray-50 p-3 rounded-sm">
                    <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-gray-400">Progreso</p>
                    <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, Math.max(0, ((initialWeight || currentWeight) - currentWeight) / ((initialWeight || currentWeight) - weightGoal) * 100))}%` }}></div>
                    </div>
                    <p className="mt-1 text-[10px] text-gray-400">{(currentWeight - weightGoal).toFixed(1)} kg para el objetivo</p>
                  </div>
                )}
              </div>
            </div>

            {/* ──── DOCUMENTOS ──── */}
            <div className="bg-white border border-gray-200 rounded-sm p-4">
              <div className="flex justify-between items-center mb-3">
                <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-gray-400">Documentos</p>
                <button onClick={() => setShowUploadModal(true)} className="text-[11px] bg-emerald-600 text-white px-2.5 py-1 rounded-sm hover:bg-emerald-700 flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                  Subir documento
                </button>
              </div>

              {docsLoading ? (
                <div className="flex justify-center py-6"><div className="animate-spin rounded-full h-6 w-6 border-2 border-emerald-600 border-t-transparent"></div></div>
              ) : documents.length > 0 ? (
                <div className="space-y-2">
                  {documents.map(d => (
                    <div key={d.id} className="border border-gray-200 rounded-sm p-2.5 hover:bg-gray-50/50 flex justify-between items-center">
                      <div className="flex items-center">
                        <svg className="w-6 h-6 text-gray-300 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        <div>
                          <p className="text-xs text-gray-800">{d.name}</p>
                          <p className="text-[10px] text-gray-400">{formatFileSize(d.fileSize)} · {format(parseISO(d.uploadDate), "d MMM yyyy", { locale: es })}</p>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-[10px] bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-sm text-gray-600 hover:bg-gray-100">Ver</a>
                        <button onClick={() => { setDocumentToDelete(d.id); setShowDeleteDocModal(true); }} className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-sm hover:bg-red-100">Eliminar</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs text-gray-400 text-center py-6">No hay documentos subidos</p>}
            </div>
          </>
        ) : (
          <div className="bg-white border border-gray-200 rounded-sm p-4">
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-gray-400 mb-2">Nuevo paciente</p>
            <p className="text-xs text-gray-500">Complete la información personal en el panel izquierdo y haga clic en "Guardar".</p>
          </div>
        )}
      </div>

      {/* ════════ MODALES ════════ */}

      {/* Create/Edit consultation modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/35 flex items-center justify-center z-50">
          <div className="bg-white rounded-sm p-5 w-full max-w-sm border border-gray-200">
            <p className="text-xs font-medium text-gray-800 mb-3">{consultationToEdit ? 'Editar consulta' : 'Nueva consulta'}</p>
            {createError && <div className="bg-red-50 text-red-600 p-2 rounded-sm mb-3 text-[11px]">{createError}</div>}
            <div className="flex gap-3 mb-4">
              <div className="flex-1">
                <label className="block text-[10px] font-medium uppercase tracking-[0.12em] text-gray-400 mb-1">Fecha</label>
                <input type="date" value={formData.date} onChange={(e) => setFormData(p => ({ ...p, date: e.target.value }))} className="w-full px-2 py-1.5 border border-gray-200 rounded-sm text-xs" />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] font-medium uppercase tracking-[0.12em] text-gray-400 mb-1">Hora</label>
                <select value={formData.time} onChange={(e) => setFormData(p => ({ ...p, time: e.target.value }))} className="w-full px-2 py-1.5 border border-gray-200 rounded-sm text-xs">
                  <option value="">Seleccionar</option>
                  {availableTimeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <button onClick={() => { setShowCreateModal(false); setConsultationToEdit(null); }} className="px-3 py-1.5 border border-gray-200 rounded-sm text-[11px] text-gray-600 hover:bg-gray-50" disabled={createLoading}>Cancelar</button>
              <button onClick={handleCreateSubmit} className="px-3 py-1.5 bg-emerald-600 text-white rounded-sm text-[11px] hover:bg-emerald-700" disabled={createLoading}>
                {createLoading ? 'Guardando...' : consultationToEdit ? 'Guardar cambios' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete consultation modal */}
      {isDeleteConsultModalOpen && (
        <div className="fixed inset-0 bg-black/35 flex items-center justify-center z-50">
          <div className="bg-white rounded-sm p-5 w-full max-w-sm border border-gray-200">
            <p className="text-xs font-medium text-gray-800 mb-2">Confirmar eliminación</p>
            <p className="text-[11px] text-gray-500 mb-4">¿Eliminar esta consulta? Esta acción no se puede deshacer.</p>
            <div className="flex justify-end space-x-2">
              <button onClick={() => { setIsDeleteConsultModalOpen(false); setConsultationToDelete(null); }} className="px-3 py-1.5 border border-gray-200 rounded-sm text-[11px] text-gray-600 hover:bg-gray-50" disabled={consultLoading}>Cancelar</button>
              <button onClick={handleDeleteConsultConfirm} className="px-3 py-1.5 bg-red-600 text-white rounded-sm text-[11px] hover:bg-red-700" disabled={consultLoading}>
                {consultLoading ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload document modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/35 flex items-center justify-center z-50">
          <div className="bg-white rounded-sm p-5 w-full max-w-sm border border-gray-200">
            <p className="text-xs font-medium text-gray-800 mb-3">Subir documento</p>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-medium uppercase tracking-[0.12em] text-gray-400 mb-1">Nombre</label>
                <input type="text" value={newDocumentName} onChange={(e) => setNewDocumentName(e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 rounded-sm text-xs" placeholder="Ej: Análisis de sangre" disabled={isUploading} />
              </div>
              <div>
                <label className="block text-[10px] font-medium uppercase tracking-[0.12em] text-gray-400 mb-1">Archivo</label>
                <input type="file" ref={fileInputRef} onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setSelectedFile(e.target.files[0]);
                    if (!newDocumentName.trim()) setNewDocumentName(e.target.files[0].name.split('.').slice(0, -1).join('.'));
                  }
                }} className="w-full text-[11px] text-gray-500 file:mr-3 file:py-1 file:px-3 file:rounded-sm file:border-0 file:text-[11px] file:bg-emerald-50 file:text-emerald-700" disabled={isUploading} />
                {selectedFile && <p className="mt-1 text-[10px] text-gray-400">{selectedFile.name} ({formatFileSize(selectedFile.size)})</p>}
              </div>
              {isUploading && (
                <div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5"><div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div></div>
                  <p className="text-[10px] text-gray-400 mt-1">{Math.round(uploadProgress)}%</p>
                </div>
              )}
              {uploadError && <p className="text-[11px] text-red-600 bg-red-50 p-2 rounded-sm">{uploadError}</p>}
              <div className="flex justify-end space-x-2 pt-1">
                <button onClick={() => { if (!isUploading) setShowUploadModal(false); }} className="px-3 py-1.5 border border-gray-200 rounded-sm text-[11px] text-gray-600 hover:bg-gray-50" disabled={isUploading}>Cancelar</button>
                <button onClick={uploadFileToFirebase} className="px-3 py-1.5 bg-emerald-600 text-white rounded-sm text-[11px] hover:bg-emerald-700" disabled={isUploading || !selectedFile}>
                  {isUploading ? 'Subiendo...' : 'Subir'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete document modal */}
      {showDeleteDocModal && (
        <div className="fixed inset-0 bg-black/35 flex items-center justify-center z-50">
          <div className="bg-white rounded-sm p-5 w-full max-w-sm border border-gray-200">
            <p className="text-xs font-medium text-gray-800 mb-2">Confirmar eliminación</p>
            <p className="text-[11px] text-gray-500 mb-4">¿Eliminar este documento? Esta acción no se puede deshacer.</p>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setShowDeleteDocModal(false)} className="px-3 py-1.5 border border-gray-200 rounded-sm text-[11px] text-gray-600 hover:bg-gray-50" disabled={isDeletingDoc}>Cancelar</button>
              <button onClick={confirmDeleteDocument} className="px-3 py-1.5 bg-red-600 text-white rounded-sm text-[11px] hover:bg-red-700" disabled={isDeletingDoc}>
                {isDeletingDoc ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDetailPage;
