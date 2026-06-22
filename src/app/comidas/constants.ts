export type MealCategory = 'desayuno' | 'almuerzo' | 'cena' | 'snack';

// Las 4 categorías reales (las que se eligen al guardar una comida en la biblioteca).
export const ALL_MEAL_CATEGORIES: MealCategory[] = ['desayuno', 'almuerzo', 'cena', 'snack'];

// Mapea valores viejos (mediaManana / lunchTarde / general) o desconocidos → una de las 4.
export function normalizeCategory(c?: string | null): MealCategory {
  switch (c) {
    case 'desayuno': case 'almuerzo': case 'cena': case 'snack': return c;
    case 'mediaManana': case 'lunchTarde': case 'general': return 'snack';
    default: return 'snack';
  }
}

// Definición de etiquetas para categorías de comidas
export const categoryLabels: Record<MealCategory, string> = {
  desayuno: 'Desayuno',
  almuerzo: 'Almuerzo',
  cena: 'Cena',
  snack: 'Snack',
};

// Colores para las categorías
export const categoryColors: Record<MealCategory, {bg: string, text: string, dark: string, light: string}> = {
  desayuno: {bg: 'bg-yellow-50',  text: 'text-yellow-700',  dark: '#EAB308', light: '#FEFCE8'}, // huevo — amarillo
  almuerzo: {bg: 'bg-emerald-50', text: 'text-emerald-700', dark: '#059669', light: '#ECFDF5'}, // plato — verde
  cena:     {bg: 'bg-sky-50',     text: 'text-sky-700',     dark: '#0284C7', light: '#F0F9FF'}, // pescado — azul
  snack:    {bg: 'bg-orange-50',  text: 'text-orange-700',  dark: '#EA580C', light: '#FFF7ED'}, // snack — naranja
};

// Nombres de archivos SVG para las categorías (ubicados en /public/icons/<name>.svg)
export const categoryIcons: Record<MealCategory, string> = {
  desayuno: 'huevo',
  almuerzo: 'plato',
  cena: 'pescado',
  snack: 'manzana',
};
