import type { Ingredient, IngredientPortion, IngredientPrep } from "./IngredientTypeahead";
import bdd from "@/app/shared/bdd_nutricional.json";
import { translatePortionLabel, translateSubgroup } from "./portionI18n";

// Base de datos nutricional propia — 562 alimentos curados.
// Cada alimento trae nombres es/en/pt, keywords (sinónimos regionales),
// nutrientes por estado (crudo/cocido/NA) con fuente, flags y derivados.
// Valores por 100 g.

type Valores = {
  kcal?: number | null;
  prot?: number | null;
  carb?: number | null;
  grasa?: number | null;
  [k: string]: number | null | undefined;
};

type EstadoBlock = {
  valores?: Valores;
  fuente?: string;
  origen_dato?: string;
};

type Medida = { label?: string | null; g?: number | null };

type Alimento = {
  id: string;
  nombre?: string;
  nombre_es?: string;
  nombre_en?: string;
  nombre_pt?: string;
  keywords?: string[];
  L1?: string;
  L1_id?: string;
  subgrupo?: string | null;
  icono?: string;
  unidad?: string;
  nutrientes_100g?: Record<string, EstadoBlock>;
  medidas?: Medida[] | null;
  flags?: Record<string, unknown>;
  derivados?: Record<string, unknown>;
  indice_glucemico?: { valor?: number | null; categoria?: string; fuente?: string };
  alergenos?: string[];
};

type Bdd = { alimentos: Alimento[] };

// Idioma de los nombres de alimentos (independiente del idioma de la app).
export type FoodLang = "es" | "pt" | "en";

// Etiqueta legible del estado (crudo/cocido). NA no muestra etiqueta.
const ESTADO_LABEL: Record<FoodLang, Record<string, string>> = {
  es: { crudo: "cruda", cocido: "cocida" },
  pt: { crudo: "crua", cocido: "cozida" },
  en: { crudo: "raw", cocido: "cooked" },
};

const pickNombre = (a: Alimento, lang: FoodLang): string => {
  const byLang = lang === "pt" ? a.nombre_pt : lang === "en" ? a.nombre_en : a.nombre_es;
  return byLang || a.nombre_es || a.nombre || a.nombre_en || "";
};

// Etiquetas de los grupos L1 por idioma. La clave canónica es el L1 en español
// (tal como viene en la BDD) y se mantiene para la lógica; solo se traduce al mostrar.
export const L1_GROUP_LABELS: Record<string, Record<FoodLang, string>> = {
  "Proteínas": { es: "Proteínas", pt: "Proteínas", en: "Proteins" },
  "Lácteos y alternativas vegetales": { es: "Lácteos y alternativas vegetales", pt: "Laticínios e alternativas vegetais", en: "Dairy & plant alternatives" },
  "Verduras": { es: "Verduras", pt: "Verduras", en: "Vegetables" },
  "Frutas": { es: "Frutas", pt: "Frutas", en: "Fruits" },
  "Cereales y granos": { es: "Cereales y granos", pt: "Cereais e grãos", en: "Cereals & grains" },
  "Almidones": { es: "Almidones", pt: "Amidos", en: "Starches" },
  "Legumbres": { es: "Legumbres", pt: "Leguminosas", en: "Legumes" },
  "Grasas, aceites y frutos secos": { es: "Grasas, aceites y frutos secos", pt: "Gorduras, óleos e oleaginosas", en: "Fats, oils & nuts" },
  "Bebidas": { es: "Bebidas", pt: "Bebidas", en: "Beverages" },
  "Condimentos y especias": { es: "Condimentos y especias", pt: "Condimentos e especiarias", en: "Condiments & spices" },
  "Dulces y postres": { es: "Dulces y postres", pt: "Doces e sobremesas", en: "Sweets & desserts" },
  "Harinas y féculas": { es: "Harinas y féculas", pt: "Farinhas e féculas", en: "Flours & starches" },
  "Suplementos": { es: "Suplementos", pt: "Suplementos", en: "Supplements" },
  "Comida de bebé": { es: "Comida de bebé", pt: "Comida de bebê", en: "Baby food" },
  "Otros": { es: "Otros", pt: "Outros", en: "Other" },
};

export const groupLabel = (l1: string | undefined | null, lang: FoodLang = "es"): string => {
  if (!l1) return L1_GROUP_LABELS["Otros"][lang];
  const m = L1_GROUP_LABELS[l1];
  return m ? m[lang] : l1;
};

const macros = (v: Valores | undefined) => ({
  calories: v?.kcal ?? 0,
  protein: v?.prot ?? 0,
  carbs: v?.carb ?? 0,
  fat: v?.grasa ?? 0,
});

const mapMedidas = (raw: Medida[] | null | undefined, lang: FoodLang): IngredientPortion[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((m) => typeof m?.g === "number" && (m.g as number) > 0)
    .map((m) => ({
      label: m.label ? translatePortionLabel(m.label, lang) : `${m.g} g`,
      grams: m.g as number,
    }));
};

// Orden de estados para elegir el representativo (default).
const ORDEN_ESTADOS = ["crudo", "cocido", "NA"];

const expandAlimento = (a: Alimento, lang: FoodLang): Ingredient | null => {
  const name = pickNombre(a, lang);
  if (!name) return null;
  const nut = a.nutrientes_100g || {};
  const portions = mapMedidas(a.medidas, lang);

  // Construir preparaciones a partir de los estados crudo/cocido.
  // NA (alimento sin distinción) NO genera selector de preparación.
  const estados = ORDEN_ESTADOS.filter(
    (e) => nut[e] && (nut[e].valores?.kcal ?? null) !== null
  );
  if (estados.length === 0) return null;

  const reales = estados.filter((e) => e === "crudo" || e === "cocido");
  const preparations: IngredientPrep[] = reales.map((e) => ({
    key: e,
    label: ESTADO_LABEL[lang][e] || e,
    ...macros(nut[e].valores),
    portions,
  }));

  // Estado representativo para los macros por defecto.
  const repKey = estados[0];
  const rep = macros(nut[repKey].valores);

  const der = (a.derivados || {}) as Record<string, unknown>;
  const ig = a.indice_glucemico;

  return {
    id: a.id,
    name,
    quantity: 100,
    ...rep,
    icon: a.icono || "generico",
    baseUnit: a.unidad === "ml" ? "ml" : "g",
    portions,
    preparations: preparations.length > 1 ? preparations : undefined,
    // Keywords = sinónimos + grupo (L1) + subgrupo (L2) → permite buscar por grupo.
    keywords: [...(a.keywords || []), a.L1, a.subgrupo]
      .filter((s): s is string => typeof s === "string" && s.length > 0)
      .map((s) => s.toLowerCase()),
    // Grupo (L1) y subgrupo (L2) para la biblioteca navegable.
    grupo: typeof a.L1 === "string" ? a.L1 : undefined,
    grupoLabel: groupLabel(typeof a.L1 === "string" ? a.L1 : undefined, lang),
    subgrupo: typeof a.subgrupo === "string" ? a.subgrupo : undefined,
    subgrupoLabel: typeof a.subgrupo === "string" ? translateSubgroup(a.subgrupo, lang) : undefined,
    // Metadatos para filtros del buscador (no se guardan al seleccionar).
    grupoIntercambio: typeof der.grupo_intercambio === "string" ? der.grupo_intercambio : undefined,
    macroDominante: typeof der.macro_dominante === "string" ? der.macro_dominante : undefined,
    ig: ig ? { valor: ig.valor ?? null, categoria: ig.categoria || "" } : undefined,
    flags: (a.flags as Record<string, boolean>) || undefined,
    alergenos: a.alergenos,
  };
};

const DB = (bdd as unknown as Bdd).alimentos;

export function getCommonIngredients(lang: FoodLang = "es"): Ingredient[] {
  const locale = lang === "pt" ? "pt-BR" : lang === "en" ? "en" : "es";
  return DB
    .map((a) => expandAlimento(a, lang))
    .filter((x): x is Ingredient => x !== null)
    .sort((a, b) => a.name.localeCompare(b.name, locale));
}

// Backwards compatibility — default ES list.
export const COMMON_INGREDIENTS: Ingredient[] = getCommonIngredients("es");
