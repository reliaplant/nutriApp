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
  increment
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

// Importar la interfaz Patient desde interfaces.ts
import { Patient, DailyTracking, Refaccion } from './interfaces';
import { limit } from "firebase/firestore";

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
      gender: 'other',
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
  }
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
