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
  setDoc
} from "firebase/firestore";
import { getStorage } from 'firebase/storage';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail,
  updateProfile,
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

// Export the storage functions so they can be used elsewhere
export { ref, uploadBytes, getDownloadURL, deleteObject, listAll };

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyApCT6WuSW0Y9lXqVn7WM3MSTcR6rsDCCI",
  authDomain: "nutriapp-1687b.firebaseapp.com",
  projectId: "nutriapp-1687b",
  storageBucket: "nutriapp-1687b.firebasestorage.app",
  messagingSenderId: "902401357823",
  appId: "1:902401357823:web:eab3a697cb79aff17dd9ca"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

// Set persistence to local (browser will maintain session on refresh)
setPersistence(auth, browserLocalPersistence).catch(error => {
  console.error("Error setting auth persistence:", error);
});

// Patient type definition based on detalle-paciente
export interface Patient {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  height?: number; // en cm
  currentWeight?: number; // en kg
  gender?: 'male' | 'female' | 'other';
  country?: string;
  status: 'active' | 'discharged' | 'lost';
  nextAppointmentDate?: string | null;
  createdAt?: Timestamp;
  nutritionistId: string; // Added field to associate patient with nutritionist
  photoUrl?: string; // Add this field to support patient photos
}

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
export interface NutritionUser {
  uid: string;
  email: string;
  displayName?: string;
  role: 'admin' | 'nutritionist';
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
  createdAt: Timestamp;
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
  }
};

// CRUD operations for patients
export const patientService = {
  // Create a new patient
  async createPatient(patient: Patient): Promise<string> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error("Debes iniciar sesión para crear un paciente");
    }
    
    const patientData = {
      ...patient,
      nutritionistId: currentUser.uid, // Always associate with current user
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
      
      return { id: docSnap.id, ...patientData };
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
  // Crear una nueva consulta (con verificación de seguridad)
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
      nutritionistId: currentUser.uid, // Also add nutritionist ID to consultations
      createdAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(
      collection(db, `patientConsultas/${consultation.patientId}/consultas`), 
      consultationData
    );
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

  // Eliminar una consulta
  async deleteConsultation(patientId: string, consultationId: string): Promise<void> {
    await deleteDoc(doc(db, `patientConsultas/${patientId}/consultas/${consultationId}`));
  },
  
  // Marcar una consulta como completada
  async completeConsultation(patientId: string, consultationId: string): Promise<void> {
    await this.updateConsultation(patientId, consultationId, { status: 'completed' });
  }
};