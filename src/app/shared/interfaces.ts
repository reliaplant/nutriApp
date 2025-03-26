import { Timestamp } from "firebase/firestore";

export interface Patient {
  id: string;
  nutritionistId: string;
  name: string;
  status: 'active' | 'discharged' | 'lost';
  gender: 'male' | 'female' | 'other';
  createdAt: any; // Firebase Timestamp
  updatedAt?: any;
  email?: string;
  phone?: string;
  birthDate?: string;
  country?: string;
  height?: number;
  currentWeight?: number;
  initialWeight?: number;
  targetWeight?: number;
  monthlyWeightGoal?: number;
  isPregnant?: boolean;
  occupation?: string;
  stressLevel?: 'low' | 'medium' | 'high' | 'severe';
  shortNote?: string;
  allergies?: string[];
  medicalConditions?: string[];
  medications?: string[];
  dietaryRestrictions?: string[];
  photoUrl?: string; // Add this field to support patient photos
  nextAppointmentDate?: string | null;
}

export interface DailyTracking {
  id?: string;
  patientId: string;
  date: string;
  dietCompliance: 'complete' | 'partial' | 'none';
  hungerLevel: 'none' | 'little' | 'moderate' | 'high';
  anxietyLevel: 'none' | 'little' | 'moderate' | 'high';
  exerciseDone: boolean;
  exerciseDuration?: number; // en minutos
  exerciseType?: string;
  notes?: string;
  weight?: number; // Añadir el campo de peso
  createdAt?: Timestamp;
}