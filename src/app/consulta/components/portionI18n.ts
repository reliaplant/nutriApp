// Traducción de etiquetas de medidas caseras (es → pt/en) según el idioma del
// paciente. Las medidas se guardan en español en la BDD; aquí se traducen palabra
// por palabra al mostrarlas (editor + PDF). Si una palabra no está en el diccionario
// se deja tal cual (fallback en español).

import type { FoodLang } from "./ingredientsData";

type Dict = Record<string, string>;

// Diccionario español → inglés.
const EN: Dict = {
  de: "of", en: "in", con: "with", sin: "without",
  taza: "cup", tazas: "cups", tazón: "bowl",
  cucharada: "tbsp", cucharadas: "tbsp", cucharadita: "tsp", cucharaditas: "tsp",
  pieza: "piece", piezas: "pieces", porción: "portion", porciones: "portions",
  puñado: "handful", puñados: "handfuls",
  filete: "fillet", filetes: "fillets",
  rebanada: "slice", rebanadas: "slices", rodaja: "slice", rodajas: "slices",
  vaso: "glass", vasos: "glasses", vasito: "small glass",
  copa: "glass", copas: "glasses",
  pizca: "pinch", pizcas: "pinches",
  lata: "can", latas: "cans",
  barra: "bar", barras: "bars", botella: "bottle", botellas: "bottles",
  scoop: "scoop", scoops: "scoops",
  hamburguesa: "patty", hamburguesas: "patties", medallón: "patty",
  cubo: "cube", cubos: "cubes", trozo: "piece", trozos: "pieces",
  plato: "plate", paleta: "popsicle",
  chica: "small", chico: "small", grande: "large", mediano: "medium", mediana: "medium",
  caballito: "shot", trago: "shot", disparo: "shot", disparos: "shots", mate: "mate",
  sobre: "packet", frasco: "jar", bolsita: "bag",
  pechuga: "breast", muslo: "thigh", muslos: "thighs", pierna: "leg", piernas: "legs",
  ala: "wing", alas: "wings", corte: "cut", presa: "piece",
  bola: "scoop", hoja: "leaf", hojas: "leaves", tallo: "stalk", penca: "stalk",
  cuadrito: "square", galleta: "cracker", galletas: "crackers",
  chuleta: "chop", chuletas: "chops", huevo: "egg", huevos: "eggs",
  salchicha: "sausage", salchichas: "sausages", chorizo: "sausage",
  rallado: "grated", rallada: "grated", picado: "chopped", picada: "chopped",
  desmoronado: "crumbled", deshebrado: "shredded", cocida: "cooked", cruda: "raw",
  ramita: "sprig", biberón: "bottle",
  nugget: "nugget", nuggets: "nuggets", bife: "steak", bistec: "steak",
  costilla: "rib", costillas: "ribs", albóndiga: "meatball", albóndigas: "meatballs",
  sardina: "sardine", sardinas: "sardines", lonja: "slice", lonjas: "slices",
  camarón: "shrimp", camarones: "shrimp", cola: "tail", corazón: "heart",
  tira: "strip", tiras: "strips", milanesa: "cutlet", milanesas: "cutlets",
  trucha: "trout", langostino: "prawn", langostinos: "prawns", tentáculo: "tentacle",
  anillo: "ring", mejillón: "mussel", mejillones: "mussels", almeja: "clam", almejas: "clams",
  ostra: "oyster", ostras: "oysters", vieira: "scallop", vieiras: "scallops",
  hígado: "liver", hígados: "livers", clara: "egg white", claras: "egg whites",
  yema: "yolk", yemas: "yolks", cuña: "wedge", pulpa: "pulp", vaina: "pod",
  diente: "clove", dientes: "cloves", bastones: "sticks",
  caramelo: "candy", caramelos: "candies", pastelito: "cake", pastelitos: "cakes",
  churro: "churro", churros: "churros", cápsulas: "capsules",
  tableta: "tablet", tabletas: "tablets",
};

// Diccionario español → portugués.
const PT: Dict = {
  de: "de", en: "em", con: "com", sin: "sem",
  taza: "xícara", tazas: "xícaras", tazón: "tigela",
  cucharada: "colher de sopa", cucharadas: "colheres de sopa",
  cucharadita: "colher de chá", cucharaditas: "colheres de chá",
  pieza: "unidade", piezas: "unidades", porción: "porção", porciones: "porções",
  puñado: "punhado", puñados: "punhados",
  filete: "filé", filetes: "filés",
  rebanada: "fatia", rebanadas: "fatias", rodaja: "rodela", rodajas: "rodelas",
  vaso: "copo", vasos: "copos", vasito: "copinho",
  copa: "taça", copas: "taças",
  pizca: "pitada", pizcas: "pitadas",
  lata: "lata", latas: "latas",
  barra: "barra", barras: "barras", botella: "garrafa", botellas: "garrafas",
  scoop: "scoop", scoops: "scoops",
  hamburguesa: "hambúrguer", hamburguesas: "hambúrgueres", medallón: "medalhão",
  cubo: "cubo", cubos: "cubos", trozo: "pedaço", trozos: "pedaços",
  plato: "prato", paleta: "picolé",
  chica: "pequena", chico: "pequeno", grande: "grande", mediano: "médio", mediana: "média",
  caballito: "dose", trago: "dose", disparo: "dose", disparos: "doses", mate: "mate",
  sobre: "sachê", frasco: "pote", bolsita: "saquinho",
  pechuga: "peito", muslo: "coxa", muslos: "coxas", pierna: "perna", piernas: "pernas",
  ala: "asa", alas: "asas", corte: "corte", presa: "pedaço",
  bola: "bola", hoja: "folha", hojas: "folhas", tallo: "talo", penca: "talo",
  cuadrito: "quadradinho", galleta: "biscoito", galletas: "biscoitos",
  chuleta: "costeleta", chuletas: "costeletas", huevo: "ovo", huevos: "ovos",
  salchicha: "salsicha", salchichas: "salsichas", chorizo: "chouriço",
  rallado: "ralado", rallada: "ralada", picado: "picado", picada: "picada",
  desmoronado: "esfarelado", deshebrado: "desfiado", cocida: "cozida", cruda: "crua",
  ramita: "raminho", biberón: "mamadeira",
  nugget: "nugget", nuggets: "nuggets", bife: "bife", bistec: "bife",
  costilla: "costela", costillas: "costelas", albóndiga: "almôndega", albóndigas: "almôndegas",
  sardina: "sardinha", sardinas: "sardinhas", lonja: "fatia", lonjas: "fatias",
  camarón: "camarão", camarones: "camarões", cola: "cauda", corazón: "coração",
  tira: "tira", tiras: "tiras", milanesa: "milanesa", milanesas: "milanesas",
  trucha: "truta", langostino: "camarão", langostinos: "camarões", tentáculo: "tentáculo",
  anillo: "anel", mejillón: "mexilhão", mejillones: "mexilhões", almeja: "amêijoa", almejas: "amêijoas",
  ostra: "ostra", ostras: "ostras", vieira: "vieira", vieiras: "vieiras",
  hígado: "fígado", hígados: "fígados", clara: "clara", claras: "claras",
  yema: "gema", yemas: "gemas", cuña: "fatia", pulpa: "polpa", vaina: "vagem",
  diente: "dente", dientes: "dentes", bastones: "palitos",
  caramelo: "bala", caramelos: "balas", pastelito: "bolinho", pastelitos: "bolinhos",
  churro: "churro", churros: "churros", cápsulas: "cápsulas",
  tableta: "comprimido", tabletas: "comprimidos",
};

/** Traduce una etiqueta de medida ("1 vaso", "1 taza picado") al idioma del paciente. */
export function translatePortionLabel(label: string, lang: FoodLang): string {
  if (lang === "es" || !label) return label;
  const dict = lang === "pt" ? PT : EN;
  // Separa el prefijo numérico ("1", "1/2", "3") del resto.
  const m = label.match(/^([\d/.,\s]*)(.*)$/);
  const prefix = m ? m[1] : "";
  const rest = m ? m[2] : label;
  const translated = rest
    .split(/\s+/)
    .map((tok) => dict[tok.toLowerCase()] ?? tok)
    .join(" ");
  return (prefix + translated).trim();
}

// Subgrupos expuestos como chips (Proteínas + Lácteos) traducidos.
const SUBGROUP_I18N: Record<string, Record<FoodLang, string>> = {
  "Pollo": { es: "Pollo", pt: "Frango", en: "Chicken" },
  "Res": { es: "Res", pt: "Carne bovina", en: "Beef" },
  "Cerdo": { es: "Cerdo", pt: "Porco", en: "Pork" },
  "Pescados": { es: "Pescados", pt: "Peixes", en: "Fish" },
  "Pavo": { es: "Pavo", pt: "Peru", en: "Turkey" },
  "Cordero": { es: "Cordero", pt: "Cordeiro", en: "Lamb" },
  "Mariscos": { es: "Mariscos", pt: "Frutos do mar", en: "Seafood" },
  "Embutidos": { es: "Embutidos", pt: "Embutidos", en: "Cold cuts" },
  "Vísceras": { es: "Vísceras", pt: "Vísceras", en: "Offal" },
  "Huevos": { es: "Huevos", pt: "Ovos", en: "Eggs" },
  "Otras carnes": { es: "Otras carnes", pt: "Outras carnes", en: "Other meats" },
  "Leches": { es: "Leches", pt: "Leites", en: "Milks" },
  "Quesos": { es: "Quesos", pt: "Queijos", en: "Cheeses" },
  "Yogures y kefir": { es: "Yogures y kefir", pt: "Iogurtes e kefir", en: "Yogurts & kefir" },
  "Mantequilla y cremas": { es: "Mantequilla y cremas", pt: "Manteiga e cremes", en: "Butter & creams" },
  "Leches vegetales": { es: "Leches vegetales", pt: "Leites vegetais", en: "Plant milks" },
};

/** Traduce el nombre de un subgrupo al idioma del paciente (para los chips). */
export function translateSubgroup(value: string | undefined, lang: FoodLang): string {
  if (!value) return "";
  const m = SUBGROUP_I18N[value];
  return m ? m[lang] : value;
}
