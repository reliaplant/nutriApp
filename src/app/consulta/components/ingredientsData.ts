import { Ingredient } from './IngredientTypeahead';

// Base de datos de ingredientes comunes
export const COMMON_INGREDIENTS: Ingredient[] = [
  // Proteínas
  { name: "Pechuga de pollo", quantity: 100, calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { name: "Atún en agua", quantity: 100, calories: 109, protein: 24, carbs: 0, fat: 0.9 },
  { name: "Huevo", quantity: 60, calories: 78, protein: 6.3, carbs: 0.6, fat: 5.3 },
  { name: "Lomo de cerdo", quantity: 100, calories: 143, protein: 26, carbs: 0, fat: 3.5 },
  { name: "Salmón", quantity: 100, calories: 208, protein: 20, carbs: 0, fat: 13 },
  { name: "Carne molida (res 93% magra)", quantity: 100, calories: 159, protein: 21, carbs: 0, fat: 8 },
  
  // Lácteos
  { name: "Yogurt griego", quantity: 100, calories: 59, protein: 10, carbs: 3.6, fat: 0.4 },
  { name: "Queso cottage", quantity: 100, calories: 98, protein: 11, carbs: 3.4, fat: 4.3 },
  { name: "Leche descremada", quantity: 100, calories: 34, protein: 3.4, carbs: 5, fat: 0.1 },
  { name: "Queso mozzarella", quantity: 100, calories: 280, protein: 28, carbs: 3.1, fat: 17 },
  
  // Carbohidratos
  { name: "Arroz integral", quantity: 100, calories: 112, protein: 2.6, carbs: 24, fat: 0.9 },
  { name: "Pan integral", quantity: 30, calories: 80, protein: 4, carbs: 15, fat: 1 },
  { name: "Avena", quantity: 100, calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
  { name: "Pasta integral", quantity: 100, calories: 131, protein: 5.5, carbs: 27, fat: 1 },
  { name: "Papa", quantity: 100, calories: 77, protein: 2, carbs: 17, fat: 0.1 },
  { name: "Quinoa", quantity: 100, calories: 120, protein: 4.4, carbs: 21.3, fat: 1.9 },
  
  // Vegetales
  { name: "Brócoli", quantity: 100, calories: 34, protein: 2.8, carbs: 7, fat: 0.4 },
  { name: "Espinaca", quantity: 100, calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
  { name: "Zanahoria", quantity: 100, calories: 41, protein: 0.9, carbs: 10, fat: 0.2 },
  { name: "Tomate", quantity: 100, calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
  { name: "Pimiento", quantity: 100, calories: 20, protein: 0.9, carbs: 4.6, fat: 0.2 },
  
  // Frutas
  { name: "Plátano", quantity: 100, calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3 },
  { name: "Manzana", quantity: 100, calories: 52, protein: 0.3, carbs: 14, fat: 0.2 },
  { name: "Fresa", quantity: 100, calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3 },
  { name: "Naranja", quantity: 100, calories: 47, protein: 0.9, carbs: 12, fat: 0.1 },
  
  // Grasas saludables
  { name: "Aguacate", quantity: 100, calories: 160, protein: 2, carbs: 8.5, fat: 14.7 },
  { name: "Aceite de oliva", quantity: 15, calories: 120, protein: 0, carbs: 0, fat: 14 },
  { name: "Nueces", quantity: 30, calories: 185, protein: 4.3, carbs: 3.9, fat: 18.5 },
  { name: "Almendras", quantity: 30, calories: 173, protein: 6, carbs: 6, fat: 15 }
];

// Función para obtener los ingredientes por categoría
export function getIngredientsByCategory() {
  return {
    proteinas: COMMON_INGREDIENTS.slice(0, 6),
    lacteos: COMMON_INGREDIENTS.slice(6, 10),
    carbohidratos: COMMON_INGREDIENTS.slice(10, 16),
    vegetales: COMMON_INGREDIENTS.slice(16, 21),
    frutas: COMMON_INGREDIENTS.slice(21, 25),
    grasas: COMMON_INGREDIENTS.slice(25)
  };
}

// Función para buscar ingredientes
export function searchIngredients(term: string): Ingredient[] {
  if (!term || term.length < 2) return [];
  
  return COMMON_INGREDIENTS.filter(ingredient => 
    ingredient.name.toLowerCase().includes(term.toLowerCase())
  );
}