import type { Ingredient, IngredientPortion, IngredientPrep } from "./IngredientTypeahead";
import unifiedDb from "@/app/shared/nutrition_db_unified.json";

// Base de datos nutricional unificada — 7593 conceptos
// Fuentes: TACO (Brasil), USDA (USA), BAM (México). Valores por 100g.

type Per100g = {
  energy_kcal?: number | null;
  protein_g?: number | null;
  total_fat_g?: number | null;
  carbohydrate_g?: number | null;
  [k: string]: number | null | undefined;
};

type LangMap = { es?: string; en?: string; pt?: string };

type RawPortion = {
  label?: string | LangMap;
  grams?: number | null;
};

type RawPrep = {
  label?: string | LangMap;
  per_100g?: Per100g;
  portions?: RawPortion[];
};

type UnifiedFood = {
  name: string | LangMap;
  category?: LangMap;
  source?: string;
  per_100g?: Per100g;
  portions?: RawPortion[];
  preparations?: Record<string, RawPrep>;
  food_group?: string;
};

type UnifiedDb = { foods: UnifiedFood[] };

// Mapeo food_group -> icono SVG existente en /public/icons/
const ICON_BY_GROUP: Record<string, string> = {
  beans: 'frijol', legumes: 'lenteja', soy: 'frijol',
  root_veg: 'camote', wheat: 'harina', tropical: 'mango',
  citrus: 'naranja', corn: 'elote', coffee_tea: 'generico',
  chicken: 'pechuga_pollo', turkey: 'pechuga_pollo',
  leafy_green: 'lechuga', chocolate: 'generico', cocoa_chocolate: 'generico',
  candy: 'generico', tree_nut: 'nuez', sugar: 'azucar',
  spice: 'condimento', condiment: 'condimento', condiments: 'condimento',
  berry: 'fresa', squash: 'calabaza', stone_fruit: 'durazno',
  apple: 'manzana', legume_veg: 'ejote', peanut: 'cacahuate',
  pepper: 'pimiento', beef: 'carne_molida', veal: 'carne_molida',
  lamb: 'carne_molida', game: 'carne_molida', organ_meat: 'carne_molida',
  seed: 'semilla', rice: 'arroz',
  alcohol: 'jugo', beverages: 'jugo', water: 'jugo', juice: 'jugo', soda: 'jugo',
  onion_garlic: 'cebolla',
  oil: 'aceite', lard: 'aceite', grasas_animales: 'aceite', butter: 'mantequilla',
  pork: 'tocino', tomato: 'tomate', pasta: 'pasta', grape: 'uva',
  cruciferous: 'brocoli', mushroom: 'hongo',
  plant_milk: 'leche_vegetal', oats: 'grano',
  fish: 'pescado', shellfish: 'camaron', cheese: 'queso',
  baking: 'harina', supplement: 'generico', melon: 'melon',
  milk: 'leche', cream: 'crema',
  vegetables: 'verdura_generica', fruits: 'verdura_generica', seaweed: 'verdura_generica',
  yogurt: 'yogur', egg: 'huevo',
  other: 'generico', composite: 'generico',
};

// Etiquetas en ES/PT para claves de preparación (cuando label viene vacío).
const PREP_LABELS: Record<'es' | 'pt', Record<string, string>> = {
  es: {
    raw: 'cruda', cooked: 'cocida', cooked_lean: 'cocida (magra)', cooked_regular: 'cocida (regular)',
    grilled: 'a la plancha', pan_seared: 'al sartén', pan_fried: 'salteada',
    pan_browned: 'dorada', pan_browned_no_oil: 'dorada sin aceite', pan_browned_with_oil: 'dorada con aceite',
    roasted: 'asada', baked: 'horneada', broiled: 'a la parrilla',
    boiled: 'hervida', braised: 'braseada', stewed: 'estofada',
    fried: 'frita', fried_with_flour: 'frita empanizada', breaded: 'empanizada',
    microwaved: 'al microondas', pickled: 'en escabeche', rendered: 'derretida',
    ready_to_eat: 'lista para comer',
    raw_fat: 'cruda con grasa', raw_lean: 'cruda magra', raw_semi_fat: 'cruda semi-grasa',
    raw_fat_no_bone: 'cruda con grasa sin hueso', raw_fat_with_bone: 'cruda con grasa con hueso',
    feet_cooked: 'patas cocidas', head_cooked: 'cabeza cocida',
  },
  pt: {
    raw: 'crua', cooked: 'cozida', cooked_lean: 'cozida (magra)', cooked_regular: 'cozida (regular)',
    grilled: 'grelhada', pan_seared: 'na frigideira', pan_fried: 'salteada',
    pan_browned: 'dourada', pan_browned_no_oil: 'dourada sem óleo', pan_browned_with_oil: 'dourada com óleo',
    roasted: 'assada', baked: 'no forno', broiled: 'na grelha',
    boiled: 'cozida em água', braised: 'braseada', stewed: 'ensopada',
    fried: 'frita', fried_with_flour: 'frita empanada', breaded: 'empanada',
    microwaved: 'no microondas', pickled: 'em conserva', rendered: 'derretida',
    ready_to_eat: 'pronta para consumo',
    raw_fat: 'crua com gordura', raw_lean: 'crua magra', raw_semi_fat: 'crua semi-gorda',
    raw_fat_no_bone: 'crua com gordura sem osso', raw_fat_with_bone: 'crua com gordura com osso',
    feet_cooked: 'pés cozidos', head_cooked: 'cabeça cozida',
  },
};

const iconFor = (group?: string): string => (group && ICON_BY_GROUP[group]) || 'generico';

const pickName = (n: string | LangMap | undefined, lang: 'es' | 'pt'): string => {
  if (!n) return '';
  if (typeof n === 'string') return n;
  return n[lang] || n.es || n.pt || n.en || '';
};

const mapPortions = (
  raw: RawPortion[] | undefined,
  lang: 'es' | 'pt'
): IngredientPortion[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((p) => typeof p?.grams === 'number' && (p.grams as number) > 0)
    .map((p) => ({ label: pickName(p.label, lang) || `${p.grams} g`, grams: p.grams as number }));
};

const macrosFromPer100g = (p: Per100g) => ({
  calories: p.energy_kcal ?? 0,
  protein: p.protein_g ?? 0,
  carbs: p.carbohydrate_g ?? 0,
  fat: p.total_fat_g ?? 0,
});

const buildPrep = (
  key: string,
  prep: RawPrep,
  lang: 'es' | 'pt'
): IngredientPrep | null => {
  if (!prep?.per_100g) return null;
  const explicit = pickName(prep.label, lang);
  const fallback = PREP_LABELS[lang][key] || key.replace(/_/g, ' ');
  return {
    key,
    label: explicit || fallback,
    ...macrosFromPer100g(prep.per_100g),
    portions: mapPortions(prep.portions, lang),
  };
};

const expandFood = (row: UnifiedFood, lang: 'es' | 'pt'): Ingredient | null => {
  const baseName = pickName(row.name, lang);
  if (!baseName) return null;
  const icon = iconFor(row.food_group);

  // Solo conceptos curados: deben tener `preparations`.
  // Las entradas planas (BAM_Mexico/TACO/USDA crudas) se ignoran por ahora —
  // son nombres en MAYÚSCULAS sin preparaciones ni concept_id.
  if (!row.preparations) return null;

  const preps: IngredientPrep[] = [];
  for (const [key, prep] of Object.entries(row.preparations)) {
    if (/^\d+$/.test(key)) continue; // claves numéricas son anomalías
    const built = buildPrep(key, prep, lang);
    if (built) preps.push(built);
  }
  if (preps.length === 0) return null;
  // Macros por defecto = primera preparación (suele ser "raw" / "cocida")
  const first = preps[0];
  return {
    name: baseName,
    quantity: 100,
    calories: first.calories,
    protein: first.protein,
    carbs: first.carbs,
    fat: first.fat,
    icon,
    portions: first.portions,
    preparations: preps,
  };
};

const DB = (unifiedDb as UnifiedDb).foods;

export function getCommonIngredients(lang: "es" | "pt" = "es"): Ingredient[] {
  return DB
    .map((r) => expandFood(r, lang))
    .filter((x): x is Ingredient => x !== null)
    .sort((a, b) => a.name.localeCompare(b.name, lang === "pt" ? "pt-BR" : "es"));
}

// Backwards compatibility — default ES list.
export const COMMON_INGREDIENTS: Ingredient[] = getCommonIngredients("es");
