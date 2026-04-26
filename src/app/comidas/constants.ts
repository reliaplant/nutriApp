export type MealCategory = 'desayuno' | 'mediaManana' | 'almuerzo' | 'lunchTarde' | 'cena' | 'general';

// Definición de etiquetas para categorías de comidas
export const categoryLabels: Record<MealCategory, string> = {
  desayuno: 'Desayuno',
  mediaManana: 'Media Mañana',
  almuerzo: 'Almuerzo',
  lunchTarde: 'Lunch Tarde',
  cena: 'Cena',
  general: 'General'
};

// Colores para las categorías (paleta vibrante inspirada en los iconos SVG)
export const categoryColors: Record<MealCategory, {bg: string, text: string, dark: string, light: string}> = {
  desayuno:    {bg: 'bg-yellow-50',  text: 'text-yellow-700', dark: '#EAB308', light: '#FEFCE8'}, // huevo — amarillo
  mediaManana: {bg: 'bg-red-50',     text: 'text-red-700',    dark: '#DC2626', light: '#FEF2F2'}, // manzana — rojo
  almuerzo:    {bg: 'bg-emerald-50', text: 'text-emerald-700',dark: '#059669', light: '#ECFDF5'}, // plato — verde
  lunchTarde:  {bg: 'bg-orange-50',  text: 'text-orange-700', dark: '#EA580C', light: '#FFF7ED'}, // jugo — naranja
  cena:        {bg: 'bg-sky-50',     text: 'text-sky-700',    dark: '#0284C7', light: '#F0F9FF'}, // pescado — azul
  general:     {bg: 'bg-slate-100',  text: 'text-slate-600',  dark: '#475569', light: '#F8FAFC'}
};

// Nombres de archivos SVG para las categorías (ubicados en /public/icons/<name>.svg)
export const categoryIcons: Record<MealCategory, string> = {
  desayuno: 'huevo',
  mediaManana: 'manzana',
  almuerzo: 'plato',
  lunchTarde: 'jugo',
  cena: 'pescado',
  general: 'generico'
};