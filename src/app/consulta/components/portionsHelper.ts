import { Ingredient } from "./IngredientTypeahead";

// ─────────────────────────────────────────────────────────────────────────────
// Sistema de porciones caseras
//
// Internamente TODO se sigue almacenando en gramos (quantity: number en gramos).
// Este helper solo provee atajos para que el nutricionista no tenga que pensar
// en gramos: chips tipo "1 taza · 158g", "1 cda · 14g", etc.
// ─────────────────────────────────────────────────────────────────────────────

export interface Portion {
  label: string;   // p.ej. "1 taza", "1 cda", "1 huevo mediano"
  gramos: number;  // peso equivalente en g
}

// Categorías derivadas del nombre/icon del ingrediente para el fallback.
type IngredientCategory =
  | 'aceite'        // aceites, mantequilla
  | 'liquido'       // leche, jugo, agua
  | 'huevo'
  | 'arroz_pasta'   // arroz, pasta, quinoa, granos cocidos
  | 'cereal_seco'   // avena, granos crudos
  | 'fruta'
  | 'verdura_hoja'  // espinaca, lechuga, arugula
  | 'verdura'       // resto de vegetales
  | 'carne'         // res, cerdo, cordero
  | 'ave'           // pollo, pavo
  | 'pescado'
  | 'frutos_secos'  // almendras, nueces, etc.
  | 'semilla'       // chía, linaza
  | 'legumbre'      // frijol, lenteja, garbanzo
  | 'lacteo'        // yogur, queso (no líquido)
  | 'pan'
  | 'tuberculo'     // papa, camote
  | 'condimento'    // sal, especias
  | 'azucar'        // azúcar, miel
  | 'generico';

// Inferir categoría a partir del nombre y/o icono del ingrediente.
export function inferCategory(ingredient: Pick<Ingredient, 'name' | 'icon'>): IngredientCategory {
  const name = (ingredient.name || '').toLowerCase();
  const icon = (ingredient.icon || '').toLowerCase();

  // Por icono (más confiable cuando viene de la base USDA)
  if (icon === 'aceite' || icon === 'aceituna' || icon === 'mantequilla') return 'aceite';
  if (icon === 'huevo') return 'huevo';
  if (icon === 'arroz') return 'arroz_pasta';
  if (icon === 'pescado' || icon === 'atun' || icon === 'salmon' || icon === 'calamar') return 'pescado';
  if (icon === 'almendra' || icon === 'nuez' || icon === 'cacahuate' || icon === 'avellana' || icon === 'anacardo' || icon === 'pistache') return 'frutos_secos';
  if (icon === 'frijol' || icon === 'lenteja' || icon === 'garbanzo') return 'legumbre';
  if (icon === 'leche' || icon === 'yogur') return /yog/.test(name) ? 'lacteo' : 'liquido';
  if (icon === 'queso') return 'lacteo';
  if (icon === 'azucar' || icon === 'miel') return 'azucar';
  if (icon === 'pan' || icon === 'tortilla') return 'pan';
  if (icon === 'papa' || icon === 'camote') return 'tuberculo';

  // Por nombre
  if (/aceite|mantequilla|manteca|ghee/.test(name)) return 'aceite';
  if (/huevo|clara de huevo|yema/.test(name)) return 'huevo';
  if (/arroz|pasta|fideo|espagueti|macarr|quinoa|cuscus|bulgur/.test(name)) return 'arroz_pasta';
  if (/avena|granola|cereal|trigo|cebada|centeno/.test(name)) return 'cereal_seco';
  if (/leche|bebida|jugo|zumo|agua|caldo|té|cafe|café|vino|cerveza/.test(name)) return 'liquido';
  if (/yogur|yogurt|queso|requesón|ricota|cottage/.test(name)) return 'lacteo';
  if (/pollo|pavo|gallina|pato/.test(name)) return 'ave';
  if (/pescado|salmón|salmon|atún|atun|merluza|tilapia|bacalao|trucha|sardina|abadejo|bagre|anchoa/.test(name)) return 'pescado';
  if (/res|ternera|cerdo|cordero|chivo|jamón|jamon|tocino|bistec|arrachera|bisonte|chuleta|lomo|filete|carne molida|carne picada/.test(name)) return 'carne';
  if (/almendra|nuez|nueces|cacahuate|maní|mani|avellana|pistache|anacardo|castaña|piñón|pinon/.test(name)) return 'frutos_secos';
  if (/chía|chia|linaza|sésamo|sesamo|girasol|calabaza/.test(name) && /semilla/.test(name)) return 'semilla';
  if (/frijol|lenteja|garbanzo|haba|judía|judia|alubia|soya|edamame/.test(name)) return 'legumbre';
  if (/manzana|pera|plátano|platano|banana|naranja|mandarina|uva|fresa|frambuesa|mora|arándano|arandano|durazno|melocotón|melocoton|piña|pina|mango|sandía|sandia|melón|melon|kiwi|papaya|cereza|ciruela|higo|granada|toronja|maracuyá|maracuya|guayaba|coco/.test(name)) return 'fruta';
  if (/espinaca|lechuga|arúgula|arugula|kale|berro|acelga|achicoria|radicchio|bok choy|berza/.test(name)) return 'verdura_hoja';
  if (/papa|patata|camote|batata|yuca|mandioca/.test(name)) return 'tuberculo';
  if (/sal|pimienta|comino|orégano|oregano|canela|nuez moscada|jengibre|ajo en polvo|paprika|pimentón|pimenton|curry|laurel|tomillo|romero|albahaca|perejil|cilantro|menta|hierba/.test(name)) return 'condimento';
  if (/azúcar|azucar|miel|sirope|jarabe|melaza|stevia|edulcorante/.test(name)) return 'azucar';
  if (/pan|tortilla|bagel|baguette|focaccia|croissant/.test(name)) return 'pan';
  if (/brócoli|brocoli|coliflor|zanahoria|cebolla|tomate|jitomate|pepino|pimiento|pimentón|chile|calabacita|calabaza|berenjena|apio|champiñ|hongo|setas|betabel|remolacha|rábano|rabano|nopal|ejote|chayote|elote|maíz|maiz|espárrag|esparrag|alcachofa/.test(name)) return 'verdura';

  return 'generico';
}

// Fallback de porciones por categoría (cuando el alimento no tiene definidas las suyas).
const FALLBACK_PORTIONS: Record<IngredientCategory, Portion[]> = {
  aceite: [
    { label: '1 cdita',     gramos: 5 },
    { label: '1 cda',       gramos: 14 },
    { label: '1 chorrito',  gramos: 8 },
  ],
  liquido: [
    { label: '½ vaso',      gramos: 120 },
    { label: '1 vaso',      gramos: 240 },
    { label: '1 taza',      gramos: 240 },
  ],
  huevo: [
    { label: '1 huevo S',   gramos: 45 },
    { label: '1 huevo M',   gramos: 50 },
    { label: '1 huevo L',   gramos: 60 },
  ],
  arroz_pasta: [
    { label: '½ taza',      gramos: 80 },
    { label: '1 taza',      gramos: 158 },
    { label: '1 cucharón',  gramos: 80 },
  ],
  cereal_seco: [
    { label: '¼ taza',      gramos: 20 },
    { label: '½ taza',      gramos: 40 },
    { label: '1 taza',      gramos: 80 },
  ],
  fruta: [
    { label: '1 pequeña',   gramos: 80 },
    { label: '1 mediana',   gramos: 150 },
    { label: '1 grande',    gramos: 200 },
  ],
  verdura_hoja: [
    { label: '1 taza',      gramos: 30 },
    { label: '1 plato',     gramos: 100 },
  ],
  verdura: [
    { label: '½ taza',      gramos: 75 },
    { label: '1 taza',      gramos: 150 },
    { label: '1 unidad',    gramos: 100 },
  ],
  carne: [
    { label: 'Palma',       gramos: 100 },
    { label: 'Filete',      gramos: 150 },
    { label: 'Porción',     gramos: 200 },
  ],
  ave: [
    { label: 'Palma',       gramos: 100 },
    { label: 'Pechuga',     gramos: 170 },
    { label: 'Muslo',       gramos: 110 },
  ],
  pescado: [
    { label: 'Filete pq',   gramos: 100 },
    { label: 'Filete med',  gramos: 150 },
    { label: 'Lata',        gramos: 80 },
  ],
  frutos_secos: [
    { label: 'Puñado',      gramos: 30 },
    { label: '¼ taza',      gramos: 35 },
    { label: '1 cda',       gramos: 8 },
  ],
  semilla: [
    { label: '1 cdita',     gramos: 4 },
    { label: '1 cda',       gramos: 12 },
  ],
  legumbre: [
    { label: '½ taza',      gramos: 90 },
    { label: '1 taza',      gramos: 180 },
  ],
  lacteo: [
    { label: '1 cda',       gramos: 15 },
    { label: 'Rebanada',    gramos: 28 },
    { label: '1 taza',      gramos: 240 },
  ],
  pan: [
    { label: '1 rebanada',  gramos: 30 },
    { label: '1 pieza',     gramos: 60 },
    { label: '1 tortilla',  gramos: 30 },
  ],
  tuberculo: [
    { label: '1 pequeña',   gramos: 100 },
    { label: '1 mediana',   gramos: 170 },
    { label: '1 grande',    gramos: 250 },
  ],
  condimento: [
    { label: '1 pizca',     gramos: 1 },
    { label: '1 cdita',     gramos: 2 },
    { label: '1 cda',       gramos: 6 },
  ],
  azucar: [
    { label: '1 cdita',     gramos: 4 },
    { label: '1 cda',       gramos: 12 },
    { label: '1 sobre',     gramos: 8 },
  ],
  generico: [
    { label: '50 g',        gramos: 50 },
    { label: '100 g',       gramos: 100 },
    { label: '200 g',       gramos: 200 },
  ],
};

// Porción por defecto (la más "típica") por categoría — para el autofill al seleccionar.
const DEFAULT_GRAMS: Record<IngredientCategory, number> = {
  aceite: 14,        // 1 cda
  liquido: 240,      // 1 vaso
  huevo: 50,         // 1 huevo M
  arroz_pasta: 158,  // 1 taza cocida
  cereal_seco: 40,   // ½ taza
  fruta: 150,        // 1 mediana
  verdura_hoja: 30,  // 1 taza
  verdura: 100,
  carne: 150,
  ave: 150,
  pescado: 150,
  frutos_secos: 30,
  semilla: 12,
  legumbre: 180,
  lacteo: 30,
  pan: 30,
  tuberculo: 170,
  condimento: 2,
  azucar: 4,
  generico: 100,
};

/** Devuelve los chips de porciones rápidas para un ingrediente.
 *  Si el ingrediente trae porciones definidas en la BDD se usan esas;
 *  en caso contrario se cae al fallback por categoría inferida.
 */
export function getPortionsForIngredient(
  ingredient: Pick<Ingredient, 'name' | 'icon' | 'portions'>
): Portion[] {
  const fromDb = ingredient.portions;
  if (Array.isArray(fromDb) && fromDb.length > 0) {
    return fromDb.map((p) => ({ label: p.label, gramos: p.grams }));
  }
  return FALLBACK_PORTIONS[inferCategory(ingredient)];
}

/** Devuelve los gramos por defecto al añadir el ingrediente por primera vez. */
export function getDefaultGramsForIngredient(
  ingredient: Pick<Ingredient, 'name' | 'icon' | 'portions'>
): number {
  const fromDb = ingredient.portions;
  if (Array.isArray(fromDb) && fromDb.length > 0) {
    // Preferir una porción "razonable" (entre 20 y 250 g) que no sea exactamente 100 g.
    // Evita tomar por defecto cosas como "1 pollo entero = 1200 g".
    const reasonable = fromDb.find((p) => p.grams >= 20 && p.grams <= 250 && p.grams !== 100);
    if (reasonable) return reasonable.grams;
    // Si no hay nada razonable, usar el fallback por categoría inferida.
    return DEFAULT_GRAMS[inferCategory(ingredient)];
  }
  return DEFAULT_GRAMS[inferCategory(ingredient)];
}
