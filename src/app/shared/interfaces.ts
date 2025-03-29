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

export interface Refaccion {
  id?: string;
  name: string;
  description: string;
  calories: number;
  status: 'available' | 'unavailable';
  price: number;
  photoUrl?: string;
  createdAt?: Timestamp;
}

export interface OrderItem {
  refaccionId: string;
  name: string;
  quantity: number;
  price: number;
  photoUrl?: string;
}

export interface Order {
  id?: string;
  customerId?: string;
  customerName: string;
  items: OrderItem[];
  totalAmount: number;
  subtotal: number;        // Added field for subtotal
  discount?: number;       // Added field for discount amount
  shippingCost?: number;   // Added field for shipping cost
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  createdAt?: Timestamp;
  completedAt?: Timestamp;
  notes?: string;
  contact?: string; // Phone or email
  deliveryDate?: string; // Added field for delivery date
  deliveryTime?: string; // Added field for delivery time slot
}

// Update the OrderSummary interface with new fieldss
export interface OrderSummary {
  subtotal: number;
  discountAmount: number;
  discountPercentage: number;
  shippingCost: number;
  total: number;
  itemCount: number;
  nextDiscountThreshold: number | null;
  nextDiscountDescription: string | null;
}

// Añadir o asegurarse que esta interfaz esté disponible
export interface OrderSettings {
  shippingFee: number;         // Costo de envío base
  freeShippingThreshold: number; // Monto para envío gratis
  discountThreshold: number;    // Monto para activar el descuento
  discountAmount: number;       // Cantidad de descuento a aplicar
  updatedAt?: any;              // Timestamp de la última actualización (opcional)
}