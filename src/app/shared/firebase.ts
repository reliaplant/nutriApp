import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
  orderBy,
  setDoc,
  increment,
  writeBatch
} from "firebase/firestore";
import { getStorage } from 'firebase/storage';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  User,
  UserCredential,
  browserLocalPersistence,
  setPersistence
} from "firebase/auth";
import {
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  listAll
} from 'firebase/storage';

// Importar la interfaz Patient desde interfaces.ts
import { Patient, DailyTracking, Refaccion, Order, OrderSettings } from './interfaces';
import { limit } from "firebase/firestore";

// Export the storage functions so they can be used elsewhere
export { ref, uploadBytes, getDownloadURL, deleteObject, listAll };

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyADffMjXybSnN6hSYmVrVaXQ0NnSIooEvg",
  authDomain: "refeit-47277.firebaseapp.com",
  projectId: "refeit-47277",
  storageBucket: "refeit-47277.firebasestorage.app",
  messagingSenderId: "208398794432",
  appId: "1:208398794432:web:28d157693a340c528c3725",
  measurementId: "G-5Y8ZGR61J8"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "refeit");
export const storage = getStorage(app);
export const auth = getAuth(app);

// Set persistence to local (browser will maintain session on refresh)
setPersistence(auth, browserLocalPersistence).catch(error => {
  console.error("Error setting auth persistence:", error);
});

// Eliminar la definición duplicada de Patient
// export interface Patient { ... } - ELIMINAR ESTO

// Definición del tipo para consultas
export interface Consultation {
  id?: string;
  patientId: string;
  date: string;
  weight?: number;
  comments?: string;
  status: 'scheduled' | 'completed';
  highlights?: string[];
  nutritionPlan?: any; // Para la integración futura con CrearPlan
  createdAt?: Timestamp;
}

// Actualiza la interfaz NutritionUser para incluir todos los campos de perfil
export interface UserPlan {
  tier: 'free' | 'premium';
  billing?: 'monthly' | 'annual';
  renewsAt?: Timestamp | null;
  startedAt?: Timestamp | null;
}

export interface NutritionUser {
  uid: string;
  email: string;
  displayName?: string;
  role: 'admin' | 'nutritionist';
  plan?: UserPlan;
  phone?: string;
  whatsapp?: string;
  showWhatsapp?: boolean;
  bio?: string;
  specialization?: string;
  credentials?: string;
  logoUrl?: string;
  avatarUrl?: string;
  businessHours?: string;
  website?: string;
  officeAddress?: string;
  professionalId?: string;      // nuevo campo
  language?: 'es' | 'pt';       // nuevo campo
  signatureUrl?: string;        // para firma real
  textSignature?: string;       // para firma generada
  useRealSignature?: boolean;   // toggle de firma real o generada
  signatureFont?: string;       // fuente de la firma digital (font-family)
  // Onboarding
  country?: string;
  practiceType?: ('clinic' | 'private' | 'online')[];
  patientLoad?: '0' | '1-10' | '11-30' | '30+';
  specialties?: string[];
  onboardingCompletedAt?: Timestamp | null;
  planTags?: string[];          // biblioteca de etiquetas para planes (reutilizables)
  createdAt: Timestamp;
}

// Etiquetas de planes disponibles por defecto para cada nutriólogo.
export const DEFAULT_PLAN_TAGS: string[] = [
  'Pérdida de peso',
  'Mantenimiento',
  'Ganancia muscular',
  'Vegetariano',
  'Vegano',
  'Sin gluten',
  'Sin lactosa',
  'Diabetes',
  'Hipertensión',
  'Colesterol alto',
  'Keto',
  'Ayuno intermitente',
  'Deportistas',
  'Embarazo',
];

// Fuentes disponibles para la firma digital (el id ES el font-family CSS).
export const SIGNATURE_FONTS: { id: string; label: string }[] = [
  { id: 'Allura', label: 'Allura' },
  { id: 'Great Vibes', label: 'Great Vibes' },
  { id: 'Dancing Script', label: 'Dancing Script' },
];
export const DEFAULT_SIGNATURE_FONT = 'Allura';

// Interfaz para comidas guardadas
export interface SavedMeal {
  id?: string;
  name: string;
  description: string;
  imageUrl?: string;
  mealOption: {
    ingredients: Array<{
      name: string;
      quantity: number;
      calories: number;
    }>;
    content: string;
    instructions?: string;
  };
  category?: string;
  usageCount?: number;
  lastUsedDate?: Timestamp;
  createdAt?: Timestamp;
  nutritionistId: string;
}

// Indicación guardada (plantilla reutilizable de indicaciones para el paciente)
export interface SavedIndication {
  id?: string;
  title: string;
  content: string;
  usageCount?: number;
  createdAt?: Timestamp;
  nutritionistId: string;
}

// Authentication service
export const authService = {
  // Expose the auth instance
  getAuth: () => auth,
  
  // Nuevo método que devuelve una promesa que se resuelve cuando auth está listo
  getAuthStatePromise(): Promise<User | null> {
    return new Promise((resolve) => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        unsubscribe(); // Nos desuscribimos inmediatamente después del primer evento
        resolve(user);
      });
    });
  },
  
  // Register a new user
  async register(email: string, password: string, displayName: string): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update profile with display name
    await updateProfile(user, { displayName });
    
    // Create user document in Firestore
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: user.email,
      displayName,
      role: 'nutritionist', // Default role
      plan: { tier: 'free', startedAt: serverTimestamp() },
      professionalId: '',
      language: 'es',
      signatureUrl: '',
      textSignature: '',
      useRealSignature: false,
      createdAt: serverTimestamp()
    });
    
    return user;
  },
  
  // Login with email/password
  async login(email: string, password: string): Promise<UserCredential> {
    return await signInWithEmailAndPassword(auth, email, password);
  },

  // Login with Google
  async loginWithGoogle(): Promise<UserCredential> {
    const provider = new GoogleAuthProvider();
    const credential = await signInWithPopup(auth, provider);
    // Ensure user document exists in Firestore
    const userRef = doc(db, "users", credential.user.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: credential.user.uid,
        email: credential.user.email,
        displayName: credential.user.displayName || '',
        role: 'nutritionist',
        plan: { tier: 'free', startedAt: serverTimestamp() },
        professionalId: '',
        language: 'es',
        signatureUrl: '',
        textSignature: '',
        useRealSignature: false,
        createdAt: serverTimestamp()
      });
    }
    return credential;
  },
  
  // Logout current user
  async logout(): Promise<void> {
    return await signOut(auth);
  },
  
  // Reset password
  async resetPassword(email: string): Promise<void> {
    return await sendPasswordResetEmail(auth, email);
  },
  
  // Get user data from Firestore con mejor manejo de errores
  async getUserData(uid: string): Promise<NutritionUser | null> {
    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as NutritionUser;
      } else {
        console.warn(`No se encontró documento de usuario para el UID: ${uid}`);
        return null;
      }
    } catch (error) {
      console.error("Error al obtener datos del usuario:", error);
      throw new Error("Error al cargar los datos del usuario");
    }
  },
  
  // Current user
  getCurrentUser(): User | null {
    return auth.currentUser;
  },

  // Identificador del proveedor de autenticación (password / google.com / …)
  getAuthProvider(): string | null {
    return auth.currentUser?.providerData[0]?.providerId ?? null;
  },

  // ⚠️ Elimina TODA la cuenta del nutriólogo y sus datos asociados.
  // Requiere reautenticación reciente (contraseña o Google) para borrar la cuenta de Auth.
  async deleteAccount(password?: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('No hay sesión activa');
    const uid = user.uid;

    // 1) Reautenticación (Firebase la exige para borrar la cuenta)
    const provider = user.providerData[0]?.providerId;
    if (provider === 'password') {
      if (!password) throw new Error('reauth-required');
      const cred = EmailAuthProvider.credential(user.email || '', password);
      await reauthenticateWithCredential(user, cred);
    } else if (provider === 'google.com') {
      await reauthenticateWithPopup(user, new GoogleAuthProvider());
    }

    const delDocs = async (snap: { docs: { ref: import('firebase/firestore').DocumentReference }[] }) =>
      Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));

    // 2) Datos en Firestore
    // Pacientes (cada uno con sus consultas, seguimientos y archivos)
    const patientsSnap = await getDocs(query(collection(db, 'patients'), where('nutritionistId', '==', uid)));
    for (const p of patientsSnap.docs) {
      try { await delDocs(await getDocs(query(collection(db, 'dailyTrackings'), where('patientId', '==', p.id)))); } catch (e) { console.error(e); }
      try { await delDocs(await getDocs(collection(db, `patientConsultas/${p.id}/consultas`))); } catch (e) { console.error(e); }
      try { const ls = await listAll(ref(storage, `patients/${p.id}`)); await Promise.all(ls.items.map((i) => deleteObject(i))); } catch { /* sin archivos */ }
      try { await deleteDoc(p.ref); } catch (e) { console.error(e); }
    }
    // Comidas guardadas (colección legacy)
    try { await delDocs(await getDocs(query(collection(db, 'savedMeals'), where('nutritionistId', '==', uid)))); } catch (e) { console.error(e); }
    // Subcolecciones del usuario
    try { await delDocs(await getDocs(collection(db, `users/${uid}/savedPlans`))); } catch (e) { console.error(e); }
    try { await delDocs(await getDocs(collection(db, `users/${uid}/savedMealOptions`))); } catch (e) { console.error(e); }
    // Ingredientes personalizados
    try { await deleteDoc(doc(db, 'ingredients', `${uid}_all-ingredients`)); } catch { /* puede no existir */ }
    // Archivos del usuario (avatar / logo / firma)
    try { const ls = await listAll(ref(storage, `users/${uid}`)); await Promise.all(ls.items.map((i) => deleteObject(i))); } catch { /* sin archivos */ }
    // Documento de perfil
    try { await deleteDoc(doc(db, 'users', uid)); } catch (e) { console.error(e); }

    // 3) Cuenta de autenticación
    await deleteUser(user);
  },
};

// CRUD operations for patients
export const patientService = {
  // Create a new patient with only name required
  async createPatient(name: string): Promise<string> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error("Debes iniciar sesión para crear un paciente");
    }
    
    // Crear un objeto que cumpla con los campos requeridos de Patient
    const patientData: Omit<Patient, 'id'> = {
      name,
      nutritionistId: currentUser.uid,
      status: 'active',
      createdAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(collection(db, "patients"), patientData);
    return docRef.id;
  },

  // Get all patients for the current nutritionist
  async getAllPatients(): Promise<Patient[]> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error("Debes iniciar sesión para ver tus pacientes");
    }
    
    const patientsQuery = query(
      collection(db, "patients"), 
      where("nutritionistId", "==", currentUser.uid)
    );
    const querySnapshot = await getDocs(patientsQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Patient));
  },

  // Get patients by status (filtered by nutritionist)
  async getPatientsByStatus(status: 'active' | 'discharged' | 'lost'): Promise<Patient[]> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error("Debes iniciar sesión para ver tus pacientes");
    }
    
    const patientsQuery = query(
      collection(db, "patients"), 
      where("nutritionistId", "==", currentUser.uid),
      where("status", "==", status)
    );
    const querySnapshot = await getDocs(patientsQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Patient));
  },

  // Get a patient by ID (with security check)
  async getPatientById(id: string): Promise<Patient | null> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error("Debes iniciar sesión para ver detalles de pacientes");
    }
    
    const docRef = doc(db, "patients", id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const patientData = docSnap.data() as Patient;
      
      // Security check: verify the patient belongs to the current user
      if (patientData.nutritionistId !== currentUser.uid) {
        throw new Error("No tienes permiso para acceder a este paciente");
      }
      
      return { ...patientData, id: docSnap.id };
    } else {
      return null;
    }
  },

  // Update a patient (with security check)
  async updatePatient(id: string, patientData: Partial<Patient>): Promise<void> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error("Debes iniciar sesión para actualizar pacientes");
    }
    
    // First check if this patient belongs to the current user
    const patientRef = doc(db, "patients", id);
    const docSnap = await getDoc(patientRef);
    
    if (!docSnap.exists()) {
      throw new Error("Paciente no encontrado");
    }
    
    const existingPatient = docSnap.data() as Patient;
    if (existingPatient.nutritionistId !== currentUser.uid) {
      throw new Error("No tienes permiso para actualizar este paciente");
    }
    
    // Prevent changing the nutritionist ID
    const safeData = { ...patientData };
    delete safeData.nutritionistId;
    
    await updateDoc(patientRef, safeData);
  },

  // Delete a patient (with security check)
  async deletePatient(id: string): Promise<void> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error("Debes iniciar sesión para eliminar pacientes");
    }
    
    // First check if this patient belongs to the current user
    const patientRef = doc(db, "patients", id);
    const docSnap = await getDoc(patientRef);
    
    if (!docSnap.exists()) {
      throw new Error("Paciente no encontrado");
    }
    
    const existingPatient = docSnap.data() as Patient;
    if (existingPatient.nutritionistId !== currentUser.uid) {
      throw new Error("No tienes permiso para eliminar este paciente");
    }
    
    await deleteDoc(patientRef);
  },

  // Method to delete a patient and all associated data
  async deletePatientAndData(id: string): Promise<void> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error("Debes iniciar sesión para eliminar pacientes");
    }
    
    // Security check - verify patient belongs to current user
    const patientRef = doc(db, "patients", id);
    const docSnap = await getDoc(patientRef);
    
    if (!docSnap.exists()) {
      throw new Error("Paciente no encontrado");
    }
    
    const existingPatient = docSnap.data() as Patient;
    if (existingPatient.nutritionistId !== currentUser.uid) {
      throw new Error("No tienes permiso para eliminar este paciente");
    }
    
    try {
      // 1. Delete all consultations
      const consultationDocs = await getDocs(
        collection(db, `patientConsultas/${id}/consultas`)
      );
      
      const deleteConsultationPromises = consultationDocs.docs.map(doc => 
        deleteDoc(doc.ref)
      );
      await Promise.all(deleteConsultationPromises);
      
      // 2. Delete patient folder from storage (if exists)
      try {
        // List all files in the patient folder
        const storageRef = ref(storage, `patients/${id}`);
        const filesList = await listAll(storageRef);
        
        // Delete all files in the folder
        const deleteFilePromises = filesList.items.map(item => 
          deleteObject(item)
        );
        await Promise.all(deleteFilePromises);
        
      } catch (err) {
        console.error('Error deleting storage files:', err);
        // Continue with deletion even if storage cleanup fails
      }
      
      // 3. Delete patient profile document
      await deleteDoc(patientRef);
      
      return;
    } catch (err) {
      console.error('Error during patient deletion:', err);
      throw err;
    }
  }
};

// CRUD operations para consultas
export const consultationService = {
  // Crear una nueva consulta (con verificación de seguridad y actualización de nextAppointmentDate)
  async createConsultation(consultation: Consultation): Promise<string> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error("Debes iniciar sesión para crear consultas");
    }
    
    // Verify the patient belongs to this nutritionist
    const patientRef = doc(db, "patients", consultation.patientId);
    const patientSnap = await getDoc(patientRef);
    
    if (!patientSnap.exists()) {
      throw new Error("Paciente no encontrado");
    }
    
    const patientData = patientSnap.data() as Patient;
    if (patientData.nutritionistId !== currentUser.uid) {
      throw new Error("No tienes permiso para crear consultas para este paciente");
    }
    
    const consultationData = {
      ...consultation,
      nutritionistId: currentUser.uid,
      createdAt: serverTimestamp(),
    };
    
    // Crear la consulta
    const docRef = await addDoc(
      collection(db, `patientConsultas/${consultation.patientId}/consultas`), 
      consultationData
    );
    
    // Si es una consulta programada (status: 'scheduled'), actualizar el nextAppointmentDate del paciente
    if (consultation.status === 'scheduled') {
      try {
        // Actualizar el campo nextAppointmentDate del paciente
        await updateDoc(patientRef, {
          nextAppointmentDate: consultation.date,
          updatedAt: serverTimestamp()
        });
      } catch (error) {
        console.error("Error al actualizar la próxima cita del paciente:", error);
        // No fallamos la transacción completa si esto falla
      }
    }
    
    return docRef.id;
  },

  // Obtener todas las consultas de un paciente
  async getConsultationsByPatient(patientId: string): Promise<Consultation[]> {
    const q = query(
      collection(db, `patientConsultas/${patientId}/consultas`),
      orderBy('date', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Consultation));
  },

  // Obtener una consulta específica
  async getConsultationById(patientId: string, consultationId: string): Promise<Consultation | null> {
    const docRef = doc(db, `patientConsultas/${patientId}/consultas/${consultationId}`);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Consultation;
    } else {
      return null;
    }
  },

  // Actualizar una consulta
  async updateConsultation(patientId: string, consultationId: string, consultationData: Partial<Consultation>): Promise<void> {
    const consultationRef = doc(db, `patientConsultas/${patientId}/consultas/${consultationId}`);
    await updateDoc(consultationRef, consultationData);
  },

  // 1. Arreglar ruta para deleteConsultation
  async deleteConsultation(patientId: string, consultationId: string): Promise<void> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error("Debes iniciar sesión para eliminar consultas");
    }
  
    try {
      console.log(`Eliminando consulta: patientId=${patientId}, consultationId=${consultationId}`);
      
      // IMPORTANTE: Usar la ruta correcta
      // Anteriormente usabas: patientConsultas/${patientId}/consultas
      // Verifica cuál es la ruta correcta en tu Firestore
      const consultationRef = doc(db, "patients", patientId, "consultas", consultationId);
      
      // Log para verificar la ruta
      console.log(`Ruta de consulta: patients/${patientId}/consultas/${consultationId}`);
      
      const consultationSnap = await getDoc(consultationRef);
      
      if (!consultationSnap.exists()) {
        // Intentar con la otra ruta posible como fallback
        const altConsultationRef = doc(db, `patientConsultas/${patientId}/consultas/${consultationId}`);
        console.log(`Intentando ruta alternativa: patientConsultas/${patientId}/consultas/${consultationId}`);
        
        const altConsultationSnap = await getDoc(altConsultationRef);
        
        if (!altConsultationSnap.exists()) {
          console.error(`Consulta no encontrada en ninguna ruta: ${consultationId}`);
          throw new Error("Consulta no encontrada");
        }
        
        // Usar la ruta alternativa si la consulta existe allí
        console.log("Usando ruta alternativa para eliminar");
        const consultationData = altConsultationSnap.data() as Consultation;
        await deleteDoc(altConsultationRef);
        
        // Actualizar nextAppointmentDate si es necesario
        if (consultationData.status === 'scheduled') {
          updateNextAppointmentDate(patientId);
        }
        
        return;
      }
      
      // Continuar con la primera ruta si existe
      const consultationData = consultationSnap.data() as Consultation;
      await deleteDoc(consultationRef);
      
      // Actualizar nextAppointmentDate si es una consulta programada
      if (consultationData.status === 'scheduled') {
        updateNextAppointmentDate(patientId);
      }
    } catch (error) {
      console.error("Error al eliminar consulta:", error);
      throw error;
    }
  },
  
  // Función de ayuda para actualizar nextAppointmentDate
  async updateNextAppointmentDate(patientId: string): Promise<void> {
    try {
      const patientRef = doc(db, "patients", patientId);
      
      // Intentar primero con la ruta "patients/{patientId}/consultas"
      let nextConsultationsQuery = query(
        collection(db, "patients", patientId, "consultas"),
        where("status", "==", "scheduled"),
        orderBy("date", "asc"),
        limit(1)
      );
      
      let nextConsultationsSnap = await getDocs(nextConsultationsQuery);
      
      // Si no hay resultados, probar con la ruta alternativa
      if (nextConsultationsSnap.empty) {
        nextConsultationsQuery = query(
          collection(db, `patientConsultas/${patientId}/consultas`),
          where("status", "==", "scheduled"),
          orderBy("date", "asc"),
          limit(1)
        );
        
        nextConsultationsSnap = await getDocs(nextConsultationsQuery);
      }
      
      if (nextConsultationsSnap.empty) {
        // No hay más consultas programadas
        console.log(`No hay más consultas programadas para el paciente ${patientId}`);
        await updateDoc(patientRef, {
          nextAppointmentDate: null,
          updatedAt: serverTimestamp()
        });
      } else {
        // Hay otra consulta programada
        const nextConsultation = nextConsultationsSnap.docs[0].data() as Consultation;
        console.log(`Próxima consulta encontrada para el paciente ${patientId}: ${nextConsultation.date}`);
        await updateDoc(patientRef, {
          nextAppointmentDate: nextConsultation.date,
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error("Error actualizando nextAppointmentDate:", error);
      // No relanzamos el error para que no falle toda la operación
    }
  },

  // Marcar una consulta como completada
  async completeConsultation(patientId: string, consultationId: string, weight?: number): Promise<void> {
    const consultationRef = doc(db, `patientConsultas/${patientId}/consultas/${consultationId}`);
    const consultationSnap = await getDoc(consultationRef);
    
    if (!consultationSnap.exists()) {
      throw new Error("Consulta no encontrada");
    }
    
    const updateData: Partial<Consultation> = {
      status: 'completed'
    };
    
    // Si se proporciona peso, actualizarlo
    if (weight !== undefined) {
      updateData.weight = weight;
      
      // También actualizar el peso actual del paciente
      try {
        const patientRef = doc(db, "patients", patientId);
        await updateDoc(patientRef, {
          currentWeight: weight,
          updatedAt: serverTimestamp()
        });
      } catch (error) {
        console.error("Error al actualizar el peso del paciente:", error);
      }
    }
    
    // Actualizar la consulta
    await updateDoc(consultationRef, updateData);
    
    // Buscar si era la próxima cita y actualizar nextAppointmentDate
    const consultationData = consultationSnap.data() as Consultation;
    const patientRef = doc(db, "patients", patientId);
    const patientSnap = await getDoc(patientRef);
    
    if (patientSnap.exists()) {
      const patientData = patientSnap.data() as Patient;
      
      // Si esta consulta era la próxima cita programada
      if (patientData.nextAppointmentDate === consultationData.date) {
        try {
          // Buscar la próxima consulta programada
          const nextConsultationsQuery = query(
            collection(db, `patientConsultas/${patientId}/consultas`),
            where("status", "==", "scheduled"),
            orderBy("date", "asc"),
            limit(1)
          );
          
          const nextConsultationsSnap = await getDocs(nextConsultationsQuery);
          
          if (nextConsultationsSnap.empty) {
            // Si no hay más consultas programadas
            await updateDoc(patientRef, {
              nextAppointmentDate: null,
              updatedAt: serverTimestamp()
            });
          } else {
            // Si hay otra consulta programada
            const nextConsultation = nextConsultationsSnap.docs[0].data() as Consultation;
            await updateDoc(patientRef, {
              nextAppointmentDate: nextConsultation.date,
              updatedAt: serverTimestamp()
            });
          }
        } catch (error) {
          console.error("Error al actualizar la próxima cita del paciente:", error);
        }
      }
    }
  },

  // Reabrir una consulta completada (volver a "en progreso")
  async reopenConsultation(patientId: string, consultationId: string): Promise<void> {
    const consultationRef = doc(db, `patientConsultas/${patientId}/consultas/${consultationId}`);
    await updateDoc(consultationRef, { status: 'scheduled' });
  }
};

// Servicio para manejar comidas guardadas
export const savedMealService = {
  // Obtener todas las comidas del nutricionista actual
  async getSavedMeals(): Promise<SavedMeal[]> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error("Debes iniciar sesión para ver tus comidas guardadas");
    }
    
    const mealsQuery = query(
      collection(db, "savedMeals"),
      where("nutritionistId", "==", currentUser.uid),
      orderBy("name")
    );
    
    const querySnapshot = await getDocs(mealsQuery);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as SavedMeal));
  },
  
  // Obtener una comida por ID
  async getSavedMealById(id: string): Promise<SavedMeal | null> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error("Debes iniciar sesión para ver detalles de comidas");
    }
    
    const docRef = doc(db, "savedMeals", id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const mealData = docSnap.data() as SavedMeal;
      
      // Verificación de seguridad
      if (mealData.nutritionistId !== currentUser.uid) {
        throw new Error("No tienes permiso para acceder a esta comida");
      }
      
      return { id: docSnap.id, ...mealData };
    } else {
      return null;
    }
  },
  
  // Crear una nueva comida
  async createSavedMeal(meal: SavedMeal): Promise<string> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error("Debes iniciar sesión para crear una comida");
    }
    
    const mealData = {
      ...meal,
      nutritionistId: currentUser.uid,
      usageCount: 0,
      createdAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(collection(db, "savedMeals"), mealData);
    return docRef.id;
  },
  
  // Actualizar una comida
  async updateSavedMeal(id: string, mealData: Partial<SavedMeal>): Promise<void> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error("Debes iniciar sesión para actualizar comidas");
    }
    
    // Verificar que esta comida pertenece al usuario actual
    const mealRef = doc(db, "savedMeals", id);
    const docSnap = await getDoc(mealRef);
    
    if (!docSnap.exists()) {
      throw new Error("Comida no encontrada");
    }
    
    const existingMeal = docSnap.data() as SavedMeal;
    if (existingMeal.nutritionistId !== currentUser.uid) {
      throw new Error("No tienes permiso para actualizar esta comida");
    }
    
    // Evitar cambiar el ID del nutricionista
    const safeData = { ...mealData };
    delete safeData.nutritionistId;
    
    await updateDoc(mealRef, safeData);
  },
  
  // Eliminar una comida
  async deleteSavedMeal(id: string): Promise<void> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error("Debes iniciar sesión para eliminar comidas");
    }
    
    // Verificar que esta comida pertenece al usuario actual
    const mealRef = doc(db, "savedMeals", id);
    const docSnap = await getDoc(mealRef);
    
    if (!docSnap.exists()) {
      throw new Error("Comida no encontrada");
    }
    
    const existingMeal = docSnap.data() as SavedMeal;
    if (existingMeal.nutritionistId !== currentUser.uid) {
      throw new Error("No tienes permiso para eliminar esta comida");
    }
    
    await deleteDoc(mealRef);
  },
  
  // Incrementar el contador de uso de una comida
  async incrementUsageCount(id: string): Promise<void> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error("Debes iniciar sesión para utilizar esta función");
    }
    
    const mealRef = doc(db, "savedMeals", id);
    
    await updateDoc(mealRef, {
      usageCount: increment(1),
      lastUsedDate: serverTimestamp()
    });
  }
};

// Servicio para indicaciones guardadas (plantillas reutilizables por usuario)
export const savedIndicationService = {
  async getSavedIndications(): Promise<SavedIndication[]> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) return [];
    const q = query(
      collection(db, "savedIndications"),
      where("nutritionistId", "==", currentUser.uid)
    );
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as SavedIndication))
      .sort((a, b) => a.title.localeCompare(b.title));
  },

  async createSavedIndication(indication: { title: string; content: string }): Promise<string> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error("Debes iniciar sesión para guardar indicaciones");
    const docRef = await addDoc(collection(db, "savedIndications"), {
      title: indication.title.trim(),
      content: indication.content,
      nutritionistId: currentUser.uid,
      usageCount: 0,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async deleteSavedIndication(id: string): Promise<void> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error("Debes iniciar sesión para eliminar indicaciones");
    const ref = doc(db, "savedIndications", id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const existing = snap.data() as SavedIndication;
    if (existing.nutritionistId !== currentUser.uid) {
      throw new Error("No tienes permiso para eliminar esta indicación");
    }
    await deleteDoc(ref);
  },
};

async function updateNextAppointmentDate(patientId: string): Promise<void> {
  try {
    const patientRef = doc(db, "patients", patientId);
    
    // Try first with the "patients/{patientId}/consultas" path
    let nextConsultationsQuery = query(
      collection(db, "patients", patientId, "consultas"),
      where("status", "==", "scheduled"),
      orderBy("date", "asc"),
      limit(1)
    );
    
    let nextConsultationsSnap = await getDocs(nextConsultationsQuery);
    
    // If no results, try with alternative path
    if (nextConsultationsSnap.empty) {
      nextConsultationsQuery = query(
        collection(db, `patientConsultas/${patientId}/consultas`),
        where("status", "==", "scheduled"),
        orderBy("date", "asc"),
        limit(1)
      );
      
      nextConsultationsSnap = await getDocs(nextConsultationsQuery);
    }
    
    if (nextConsultationsSnap.empty) {
      // No more scheduled consultations
      await updateDoc(patientRef, {
        nextAppointmentDate: null,
        updatedAt: serverTimestamp()
      });
    } else {
      // There is another scheduled consultation
      const nextConsultation = nextConsultationsSnap.docs[0].data() as Consultation;
      await updateDoc(patientRef, {
        nextAppointmentDate: nextConsultation.date,
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error("Error updating nextAppointmentDate:", error);
    // Not throwing the error to avoid failing the entire operation
  }
}

// Servicio para manejar refacciones
export const refaccionService = {
  async createRefaccion(refaccion: Refaccion): Promise<string> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error("Debes iniciar sesión para crear una refacción");
    }
    
    // Limpiar campos undefined antes de guardar
    const refaccionData = Object.entries(refaccion).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);
    
    // Agregar timestamp
    refaccionData.createdAt = serverTimestamp();
    
    const docRef = await addDoc(collection(db, "refacciones"), refaccionData);
    return docRef.id;
  },

  async getRefacciones(): Promise<Refaccion[]> {
    try {
      const refaccionesQuery = query(
        collection(db, "refacciones"),
        orderBy("name")
      );
      
      const querySnapshot = await getDocs(refaccionesQuery);
      
      if (querySnapshot.empty) {
        console.log("No se encontraron refacciones");
        return [];
      }
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Refaccion));
      
    } catch (error) {
      console.error("Error al obtener refacciones:", error);
      throw new Error("No se pudieron cargar las refacciones");
    }
  },

  async updateRefaccion(id: string, refaccionData: Partial<Refaccion>): Promise<void> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error("Debes iniciar sesión para actualizar refacciones");
    }
    
    const refaccionRef = doc(db, "refacciones", id);
    await updateDoc(refaccionRef, refaccionData);
  },

  async deleteRefaccion(id: string): Promise<void> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error("Debes iniciar sesión para eliminar refacciones");
    }
    
    const refaccionRef = doc(db, "refacciones", id);
    await deleteDoc(refaccionRef);
  },

  // Get only available refacciones for the menu
  async getAvailableRefacciones(): Promise<Refaccion[]> {
    try {
      // Try with just filtering without ordering first
      const refaccionesQuery = query(
        collection(db, "refacciones"),
        where("status", "==", "available")
      );
      
      const querySnapshot = await getDocs(refaccionesQuery);
      
      if (querySnapshot.empty) {
        console.log("No se encontraron refacciones disponibles");
        return [];
      }
      
      // Then sort in memory (for now until index is created)
      const refacciones = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Refaccion));
      
      // Sort by name locally
      return refacciones.sort((a, b) => a.name.localeCompare(b.name));
      
    } catch (error) {
      console.error("Error al obtener refacciones disponibles:", error);
      throw new Error("No se pudieron cargar las refacciones disponibles");
    }
  }
};

// Add new service for orders management
export const orderService = {
  async createOrder(order: Order): Promise<string> {
    // No authentication required for customers creating orders
    const orderData = {
      ...order,
      status: 'pending',
      createdAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(collection(db, "orders"), orderData);
    return docRef.id;
  },

  async getOrders(): Promise<Order[]> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error("Debes iniciar sesión para ver los pedidos");
    }
    
    const ordersQuery = query(
      collection(db, "orders"),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(ordersQuery);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Order));
  },

  async updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error("Debes iniciar sesión para actualizar pedidos");
    }
    
    const orderRef = doc(db, "orders", orderId);
    
    let updateData: any = {
      status: status,
    };
    
    // If completing the order, add completion timestamp
    if (status === 'completed') {
      updateData.completedAt = serverTimestamp();
    }
    
    await updateDoc(orderRef, updateData);
  },

  async deleteOrder(orderId: string): Promise<void> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error("Debes iniciar sesión para eliminar pedidos");
    }
    
    const orderRef = doc(db, "orders", orderId);
    await deleteDoc(orderRef);
  },

  async getOrderById(orderId: string): Promise<Order | null> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error("Debes iniciar sesión para ver los detalles del pedido");
    }
    
    const orderRef = doc(db, "orders", orderId);
    const orderSnap = await getDoc(orderRef);
    
    if (orderSnap.exists()) {
      return { id: orderSnap.id, ...orderSnap.data() } as Order;
    }
    
    return null;
  },
  
  async getOrdersByStatus(status: Order['status']): Promise<Order[]> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error("Debes iniciar sesión para filtrar pedidos");
    }
    
    const ordersQuery = query(
      collection(db, "orders"),
      where("status", "==", status),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(ordersQuery);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Order));
  },

  createPublicOrder: async (order: Order) => {
    try {
      // No verificamos autenticación aquí
      const ordersRef = collection(db, 'publicOrders');
      const docRef = await addDoc(ordersRef, {
        ...order,
        createdAt: serverTimestamp(),
        source: 'public_form'
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating public order:', error);
      throw new Error('No se pudo crear el pedido');
    }
  },
};

// Add new service for order settings management
export const orderSettingsService = {
  // Get current settings
  async getSettings(): Promise<OrderSettings> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error("Debes iniciar sesión para acceder a la configuración");
    }
    
    // Always use a single document with a fixed ID for settings
    const settingsRef = doc(db, "orderSettings", "current");
    const docSnap = await getDoc(settingsRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as OrderSettings;
    } else {
      // Return default settings if none exist
      return {
        shippingFee: 100,
        freeShippingThreshold: 1000,
        discountThreshold: 1800,
        discountAmount: 300
      };
    }
  },
  
  // Update settings
  async updateSettings(settings: OrderSettings): Promise<void> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error("Debes iniciar sesión para actualizar la configuración");
    }
    
    // Add timestamp
    const updatedSettings = {
      ...settings,
      updatedAt: serverTimestamp()
    };
    
    const settingsRef = doc(db, "orderSettings", "current");
    await setDoc(settingsRef, updatedSettings);
  }
};

// Add the missing dailyTrackingService
export const dailyTrackingService = {
  async getDailyTrackings(patientId: string): Promise<DailyTracking[]> {
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        throw new Error("Debes iniciar sesión para ver seguimientos");
      }
      
      const trackingsQuery = query(
        collection(db, "dailyTrackings"),
        where("patientId", "==", patientId),
        orderBy("date", "desc")
      );
      
      const querySnapshot = await getDocs(trackingsQuery);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as DailyTracking));
    } catch (error) {
      console.error("Error fetching daily trackings:", error);
      throw error;
    }
  },

  async addDailyTracking(tracking: DailyTracking): Promise<string> {
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        throw new Error("Debes iniciar sesión para añadir seguimientos");
      }

      const trackingData = {
        ...tracking,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, "dailyTrackings"), trackingData);
      return docRef.id;
    } catch (error) {
      console.error("Error adding daily tracking:", error);
      throw error;
    }
  },

  async updateDailyTracking(id: string, data: Partial<DailyTracking>): Promise<void> {
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        throw new Error("Debes iniciar sesión para actualizar seguimientos");
      }

      const trackingRef = doc(db, "dailyTrackings", id);
      await updateDoc(trackingRef, data);
    } catch (error) {
      console.error("Error updating daily tracking:", error);
      throw error;
    }
  },

  async deleteDailyTracking(id: string): Promise<void> {
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        throw new Error("Debes iniciar sesión para eliminar seguimientos");
      }

      const trackingRef = doc(db, "dailyTrackings", id);
      await deleteDoc(trackingRef);
    } catch (error) {
      console.error("Error deleting daily tracking:", error);
      throw error;
    }
  },
  
  async getDailyTrackingById(id: string): Promise<DailyTracking | null> {
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        throw new Error("Debes iniciar sesión para ver detalles de seguimiento");
      }
      
      const trackingRef = doc(db, "dailyTrackings", id);
      const trackingSnap = await getDoc(trackingRef);
      
      if (trackingSnap.exists()) {
        return { id: trackingSnap.id, ...trackingSnap.data() } as DailyTracking;
      }
      
      return null;
    } catch (error) {
      console.error("Error fetching daily tracking:", error);
      throw error;
    }
  }
};

// =================================================================
// Admin service: solo accesible para usuarios con role === 'admin'
// =================================================================
export const adminService = {
  // Verifica si el uid actual tiene rol admin
  async isAdmin(uid: string): Promise<boolean> {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      return snap.exists() && (snap.data() as NutritionUser).role === 'admin';
    } catch {
      return false;
    }
  },

  // Lista todos los usuarios (nutricionistas + admins)
  async getAllUsers(): Promise<NutritionUser[]> {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map((d) => ({ ...(d.data() as NutritionUser), uid: d.id }));
  },

  // Cuenta los pacientes de un nutricionista
  async countPatientsByNutritionist(nutritionistId: string): Promise<number> {
    const q = query(collection(db, 'patients'), where('nutritionistId', '==', nutritionistId));
    const snap = await getDocs(q);
    return snap.size;
  },

  // Lista pacientes de un nutricionista (sin restricción de auth)
  async getPatientsByNutritionist(nutritionistId: string): Promise<Patient[]> {
    const q = query(collection(db, 'patients'), where('nutritionistId', '==', nutritionistId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Patient, 'id'>) }));
  },

  // Cambia el plan de un usuario
  async updateUserPlan(uid: string, plan: UserPlan): Promise<void> {
    const ref = doc(db, 'users', uid);
    await updateDoc(ref, {
      plan: {
        tier: plan.tier,
        billing: plan.billing ?? null,
        startedAt: plan.startedAt ?? serverTimestamp(),
        renewsAt: plan.renewsAt ?? null,
      },
    });
  },

  // Cambia el rol de un usuario
  async updateUserRole(uid: string, role: 'admin' | 'nutritionist'): Promise<void> {
    await updateDoc(doc(db, 'users', uid), { role });
  },
};

// // Fix the Consultation interface if needed - let's ensure it's exported
// export { Consultation };

// // Export the Patient interface if needed
// export type { Patient };

// ─── Planes reutilizables (plantillas de plan completo) ───────────────────────
// Cada plan guarda todo el conjunto de comidas (meals[]) + metadatos.
// Vive en users/{uid}/savedPlans.
export interface SavedPlan {
  id?: string;
  name: string;
  group?: string;            // [legacy] grupo único — reemplazado por tags
  tags?: string[];           // etiquetas libres reutilizables (0..n)
  featured?: boolean;        // marcado como destacado por el nutriólogo
  meals: unknown[];          // Meal[] embebido (autocontenido)
  indicaciones?: string;     // indicaciones generales (opcional)
  totalNutrition?: { calories: number; protein: number; carbs: number; fat: number };
  targetCalories?: number;
  mealsCount?: number;
  usageCount?: number;
  createdAt?: unknown;
  lastUsedDate?: unknown;
}

export const planService = {
  async getPlans(): Promise<SavedPlan[]> {
    const user = authService.getCurrentUser();
    if (!user) return [];
    const q = query(collection(db, `users/${user.uid}/savedPlans`), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as SavedPlan));
  },

  async createPlan(plan: Omit<SavedPlan, 'id'>): Promise<string> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Debes iniciar sesión');
    const clean = JSON.parse(JSON.stringify(plan)); // Firestore no acepta undefined
    const ref = await addDoc(collection(db, `users/${user.uid}/savedPlans`), {
      ...clean,
      usageCount: 0,
      createdAt: serverTimestamp(),
      lastUsedDate: serverTimestamp(),
    });
    return ref.id;
  },

  async updatePlan(id: string, data: Partial<SavedPlan>): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Debes iniciar sesión');
    const clean = JSON.parse(JSON.stringify(data));
    await updateDoc(doc(db, `users/${user.uid}/savedPlans`, id), clean);
  },

  async deletePlan(id: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Debes iniciar sesión');
    await deleteDoc(doc(db, `users/${user.uid}/savedPlans`, id));
  },

  // ── Biblioteca de etiquetas (reutilizables, por nutriólogo) ──
  async getTagLibrary(): Promise<string[]> {
    const user = authService.getCurrentUser();
    if (!user) return [...DEFAULT_PLAN_TAGS];
    const snap = await getDoc(doc(db, 'users', user.uid));
    const data = snap.exists() ? (snap.data() as NutritionUser) : null;
    if (data && Array.isArray(data.planTags)) {
      // Unimos con los defaults para que nuevas etiquetas base aparezcan en cuentas previas.
      return [...new Set([...DEFAULT_PLAN_TAGS, ...data.planTags])];
    }
    // Primer uso: sembramos las etiquetas por defecto en el perfil.
    await updateDoc(doc(db, 'users', user.uid), { planTags: DEFAULT_PLAN_TAGS }).catch(() => {});
    return [...DEFAULT_PLAN_TAGS];
  },

  async saveTagLibrary(tags: string[]): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Debes iniciar sesión');
    await updateDoc(doc(db, 'users', user.uid), { planTags: tags });
  },

  // Renombra una etiqueta en la biblioteca y en todos los planes que la usan.
  async renameTag(oldTag: string, newTag: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Debes iniciar sesión');
    const from = oldTag.trim();
    const to = newTag.trim().replace(/\s+/g, ' ');
    if (!from || !to || from.toLowerCase() === to.toLowerCase()) return;
    // Biblioteca
    const lib = await this.getTagLibrary();
    await this.saveTagLibrary([...new Set(lib.map(t => (t.toLowerCase() === from.toLowerCase() ? to : t)))]);
    // Planes (cascada)
    const plans = await this.getPlans();
    const batch = writeBatch(db);
    let touched = 0;
    plans.forEach(p => {
      const tags = Array.isArray(p.tags) ? p.tags : (p.group ? [p.group] : []);
      if (tags.some(t => t.toLowerCase() === from.toLowerCase())) {
        const newTags = [...new Set(tags.map(t => (t.toLowerCase() === from.toLowerCase() ? to : t)))];
        batch.update(doc(db, `users/${user.uid}/savedPlans`, p.id!), { tags: newTags });
        touched++;
      }
    });
    if (touched) await batch.commit();
  },

  // Elimina una etiqueta de la biblioteca y de todos los planes que la usan.
  async deleteTag(tag: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Debes iniciar sesión');
    const t = tag.trim();
    if (!t) return;
    const lib = await this.getTagLibrary();
    await this.saveTagLibrary(lib.filter(x => x.toLowerCase() !== t.toLowerCase()));
    const plans = await this.getPlans();
    const batch = writeBatch(db);
    let touched = 0;
    plans.forEach(p => {
      const tags = Array.isArray(p.tags) ? p.tags : (p.group ? [p.group] : []);
      if (tags.some(x => x.toLowerCase() === t.toLowerCase())) {
        batch.update(doc(db, `users/${user.uid}/savedPlans`, p.id!), { tags: tags.filter(x => x.toLowerCase() !== t.toLowerCase()) });
        touched++;
      }
    });
    if (touched) await batch.commit();
  },
};
