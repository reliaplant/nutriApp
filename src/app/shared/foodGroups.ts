// Grupos de alimentos para las preferencias del paciente.
// Se muestran como un listado de chips con toggle like/dislike, agrupados por
// secciones. Mezcla grupos amplios ("Verduras") con alimentos específicos
// ("Salmón", "Lentejas") porque la gente expresa gustos a ambos niveles.
// Cada item guarda info de matcheo (L1 / subgrupos / keywords) para relacionarlo
// con la BDD después.

export type GroupLang = 'es' | 'pt';

export interface MacroFoodGroup {
  id: string;
  label: { es: string; pt: string };
  icon: string; // nombre de icono en /public/icons (sin .svg)
  L1?: string[];
  subgrupos?: string[];
  keywords?: string[];
}

export interface MacroSection {
  id: string;
  label: { es: string; pt: string };
  groups: MacroFoodGroup[];
}

export const MACRO_SECTIONS: MacroSection[] = [
  {
    id: 'carnes',
    label: { es: 'Carnes y aves', pt: 'Carnes e aves' },
    groups: [
      { id: 'pollo', label: { es: 'Pollo', pt: 'Frango' }, icon: 'pechuga_pollo', subgrupos: ['Pollo'], keywords: ['pollo', 'frango', 'gallina', 'pechuga', 'muslo'] },
      { id: 'res', label: { es: 'Carne de res', pt: 'Carne bovina' }, icon: 'bistec', subgrupos: ['Res'], keywords: ['res', 'vacuno', 'bovina', 'bistec', 'carne', 'ternera'] },
      { id: 'cerdo', label: { es: 'Cerdo', pt: 'Porco' }, icon: 'chuleta', subgrupos: ['Cerdo'], keywords: ['cerdo', 'porco', 'chancho', 'chuleta', 'lomo'] },
      { id: 'embutidos', label: { es: 'Embutidos', pt: 'Embutidos' }, icon: 'jamon', keywords: ['embutido', 'jamón', 'salchicha', 'chorizo', 'tocino', 'salame', 'mortadela', 'fiambre'] },
    ],
  },
  {
    id: 'pescados',
    label: { es: 'Pescados y mariscos', pt: 'Peixes e frutos do mar' },
    groups: [
      { id: 'pescado', label: { es: 'Pescado (general)', pt: 'Peixe (geral)' }, icon: 'pescado', subgrupos: ['Pescados', 'Pescado'], keywords: ['pescado', 'peixe', 'merluza', 'tilapia'] },
      { id: 'salmon', label: { es: 'Salmón', pt: 'Salmão' }, icon: 'salmon', keywords: ['salmón', 'salmão'] },
      { id: 'atun', label: { es: 'Atún', pt: 'Atum' }, icon: 'atun', keywords: ['atún', 'atum'] },
      { id: 'sardina', label: { es: 'Sardina', pt: 'Sardinha' }, icon: 'sardina', keywords: ['sardina', 'sardinha'] },
      { id: 'bacalao', label: { es: 'Bacalao', pt: 'Bacalhau' }, icon: 'bacalao', keywords: ['bacalao', 'bacalhau'] },
      { id: 'mariscos', label: { es: 'Mariscos (general)', pt: 'Frutos do mar (geral)' }, icon: 'cangrejo', subgrupos: ['Mariscos'], keywords: ['marisco', 'gamba', 'langostino', 'calamar', 'mejillón', 'almeja'] },
      { id: 'camaron', label: { es: 'Camarón', pt: 'Camarão' }, icon: 'camaron', keywords: ['camarón', 'camarão', 'gamba', 'langostino'] },
      { id: 'pulpo', label: { es: 'Pulpo', pt: 'Polvo' }, icon: 'pulpo', keywords: ['pulpo', 'polvo'] },
    ],
  },
  {
    id: 'huevos-veg',
    label: { es: 'Huevos y proteína vegetal', pt: 'Ovos e proteína vegetal' },
    groups: [
      { id: 'huevos', label: { es: 'Huevos', pt: 'Ovos' }, icon: 'huevo', subgrupos: ['Huevos'], keywords: ['huevo', 'ovo', 'clara', 'yema'] },
      { id: 'tofu', label: { es: 'Tofu', pt: 'Tofu' }, icon: 'tofu', keywords: ['tofu', 'soja', 'soya', 'tempeh'] },
      { id: 'edamame', label: { es: 'Edamame', pt: 'Edamame' }, icon: 'edamame', keywords: ['edamame', 'soja verde'] },
    ],
  },
  {
    id: 'verduras',
    label: { es: 'Verduras', pt: 'Verduras' },
    groups: [
      { id: 'verduras', label: { es: 'Verduras y ensaladas', pt: 'Verduras e saladas' }, icon: 'lechuga', L1: ['Verduras'], keywords: ['verdura', 'ensalada', 'salada', 'lechuga', 'vegetal', 'hortaliza'] },
      { id: 'tomate', label: { es: 'Tomate', pt: 'Tomate' }, icon: 'tomate', keywords: ['tomate'] },
      { id: 'cebolla', label: { es: 'Cebolla', pt: 'Cebola' }, icon: 'cebolla', keywords: ['cebolla', 'cebola', 'puerro'] },
      { id: 'ajo', label: { es: 'Ajo', pt: 'Alho' }, icon: 'ajo', keywords: ['ajo', 'alho'] },
      { id: 'pimiento', label: { es: 'Pimiento / morrón', pt: 'Pimentão' }, icon: 'pimiento', keywords: ['pimiento', 'morrón', 'pimentão', 'ají dulce'] },
      { id: 'zanahoria', label: { es: 'Zanahoria', pt: 'Cenoura' }, icon: 'zanahoria', keywords: ['zanahoria', 'cenoura'] },
      { id: 'brocoli', label: { es: 'Brócoli', pt: 'Brócolis' }, icon: 'brocoli', keywords: ['brócoli', 'brócolis', 'brecol'] },
      { id: 'coliflor', label: { es: 'Coliflor', pt: 'Couve-flor' }, icon: 'coliflor', keywords: ['coliflor', 'couve-flor'] },
      { id: 'berenjena', label: { es: 'Berenjena', pt: 'Berinjela' }, icon: 'berenjena', keywords: ['berenjena', 'berinjela'] },
      { id: 'pepino', label: { es: 'Pepino', pt: 'Pepino' }, icon: 'pepino', keywords: ['pepino'] },
      { id: 'espinaca', label: { es: 'Espinaca', pt: 'Espinafre' }, icon: 'espinaca', keywords: ['espinaca', 'espinafre'] },
      { id: 'calabacita', label: { es: 'Calabacín', pt: 'Abobrinha' }, icon: 'calabacita', keywords: ['calabacín', 'calabacita', 'zucchini', 'abobrinha'] },
      { id: 'calabaza', label: { es: 'Calabaza', pt: 'Abóbora' }, icon: 'calabaza', keywords: ['calabaza', 'abóbora', 'zapallo', 'auyama'] },
      { id: 'betabel', label: { es: 'Betabel / remolacha', pt: 'Beterraba' }, icon: 'betabel', keywords: ['betabel', 'remolacha', 'beterraba', 'betarraga'] },
      { id: 'apio', label: { es: 'Apio', pt: 'Aipo' }, icon: 'apio', keywords: ['apio', 'aipo'] },
      { id: 'repollo', label: { es: 'Repollo / col', pt: 'Repolho' }, icon: 'repollo', keywords: ['repollo', 'col', 'repolho', 'couve'] },
      { id: 'elote', label: { es: 'Maíz / elote', pt: 'Milho' }, icon: 'elote', keywords: ['maíz', 'elote', 'choclo', 'milho'] },
      { id: 'esparrago', label: { es: 'Espárragos', pt: 'Aspargos' }, icon: 'esparrago', keywords: ['espárrago', 'aspargo'] },
      { id: 'hongos', label: { es: 'Champiñones y hongos', pt: 'Cogumelos' }, icon: 'hongo', keywords: ['champiñón', 'hongo', 'seta', 'cogumelo', 'portobello'] },
      { id: 'aguacate', label: { es: 'Aguacate', pt: 'Abacate' }, icon: 'aguacate', keywords: ['aguacate', 'palta', 'abacate'] },
    ],
  },
  {
    id: 'frutas',
    label: { es: 'Frutas', pt: 'Frutas' },
    groups: [
      { id: 'frutas', label: { es: 'Frutas (general)', pt: 'Frutas (geral)' }, icon: 'manzana', L1: ['Frutas'], keywords: ['fruta', 'fruit'] },
      { id: 'platano', label: { es: 'Plátano / banana', pt: 'Banana' }, icon: 'platano', keywords: ['plátano', 'banana', 'banano', 'cambur'] },
      { id: 'manzana', label: { es: 'Manzana', pt: 'Maçã' }, icon: 'manzana', keywords: ['manzana', 'maçã'] },
      { id: 'fresa', label: { es: 'Fresa', pt: 'Morango' }, icon: 'fresa', keywords: ['fresa', 'frutilla', 'morango'] },
      { id: 'pina', label: { es: 'Piña', pt: 'Abacaxi' }, icon: 'pina', keywords: ['piña', 'ananá', 'abacaxi'] },
      { id: 'mango', label: { es: 'Mango', pt: 'Manga' }, icon: 'mango', keywords: ['mango', 'manga'] },
      { id: 'naranja', label: { es: 'Naranja', pt: 'Laranja' }, icon: 'naranja', keywords: ['naranja', 'laranja'] },
      { id: 'uva', label: { es: 'Uva', pt: 'Uva' }, icon: 'uva', keywords: ['uva'] },
      { id: 'sandia', label: { es: 'Sandía', pt: 'Melancia' }, icon: 'sandia', keywords: ['sandía', 'melancia', 'patilla'] },
      { id: 'melon', label: { es: 'Melón', pt: 'Melão' }, icon: 'melon', keywords: ['melón', 'melão'] },
      { id: 'papaya', label: { es: 'Papaya', pt: 'Mamão' }, icon: 'papaya', keywords: ['papaya', 'mamão', 'lechosa'] },
      { id: 'pera', label: { es: 'Pera', pt: 'Pera' }, icon: 'pera', keywords: ['pera'] },
      { id: 'durazno', label: { es: 'Durazno', pt: 'Pêssego' }, icon: 'durazno', keywords: ['durazno', 'melocotón', 'pêssego'] },
      { id: 'kiwi', label: { es: 'Kiwi', pt: 'Kiwi' }, icon: 'kiwi', keywords: ['kiwi'] },
      { id: 'arandano', label: { es: 'Arándanos', pt: 'Mirtilos' }, icon: 'arandano', keywords: ['arándano', 'mirtilo', 'blueberry'] },
    ],
  },
  {
    id: 'legumbres',
    label: { es: 'Legumbres', pt: 'Leguminosas' },
    groups: [
      { id: 'frijol', label: { es: 'Frijoles', pt: 'Feijão' }, icon: 'frijol', L1: ['Legumbres'], keywords: ['frijol', 'feijão', 'poroto', 'judía', 'alubia'] },
      { id: 'lenteja', label: { es: 'Lentejas', pt: 'Lentilhas' }, icon: 'lenteja', L1: ['Legumbres'], keywords: ['lenteja', 'lentilha'] },
      { id: 'garbanzo', label: { es: 'Garbanzos', pt: 'Grão-de-bico' }, icon: 'garbanzo', L1: ['Legumbres'], keywords: ['garbanzo', 'grão-de-bico'] },
      { id: 'haba', label: { es: 'Habas / arvejas', pt: 'Favas / ervilhas' }, icon: 'haba', L1: ['Legumbres'], keywords: ['haba', 'arveja', 'guisante', 'chícharo', 'fava', 'ervilha'] },
    ],
  },
  {
    id: 'cereales',
    label: { es: 'Cereales y harinas', pt: 'Cereais e farinhas' },
    groups: [
      { id: 'pan', label: { es: 'Pan', pt: 'Pão' }, icon: 'pan', keywords: ['pan', 'pão', 'bollo', 'baguette', 'tostada'] },
      { id: 'arroz', label: { es: 'Arroz', pt: 'Arroz' }, icon: 'arroz', keywords: ['arroz', 'rice'] },
      { id: 'pasta', label: { es: 'Pasta', pt: 'Massa' }, icon: 'pasta', keywords: ['pasta', 'massa', 'fideo', 'espagueti', 'macarrón'] },
      { id: 'avena', label: { es: 'Avena', pt: 'Aveia' }, icon: 'avena', L1: ['Cereales y granos'], keywords: ['avena', 'aveia'] },
      { id: 'quinoa', label: { es: 'Quinoa', pt: 'Quinoa' }, icon: 'quinoa', keywords: ['quinoa', 'quinua'] },
      { id: 'granola', label: { es: 'Granola', pt: 'Granola' }, icon: 'granola', keywords: ['granola', 'muesli', 'cereal'] },
      { id: 'tortilla-arepa', label: { es: 'Tortilla / arepa', pt: 'Tortilla / arepa' }, icon: 'tortilla', keywords: ['tortilla', 'arepa', 'maíz', 'tlacoyo'] },
    ],
  },
  {
    id: 'tuberculos',
    label: { es: 'Tubérculos y almidones', pt: 'Tubérculos e amidos' },
    groups: [
      { id: 'papa', label: { es: 'Papa', pt: 'Batata' }, icon: 'papa', L1: ['Almidones'], keywords: ['papa', 'patata', 'batata inglesa'] },
      { id: 'camote', label: { es: 'Camote / batata', pt: 'Batata-doce' }, icon: 'camote', L1: ['Almidones'], keywords: ['camote', 'batata', 'boniato', 'batata-doce'] },
      { id: 'yuca', label: { es: 'Yuca / mandioca', pt: 'Mandioca' }, icon: 'yuca', L1: ['Almidones'], keywords: ['yuca', 'mandioca', 'casava'] },
      { id: 'platano-macho', label: { es: 'Plátano macho', pt: 'Banana-da-terra' }, icon: 'platano_macho', L1: ['Almidones'], keywords: ['plátano macho', 'plátano verde', 'banana-da-terra', 'maduro'] },
    ],
  },
  {
    id: 'lacteos',
    label: { es: 'Lácteos', pt: 'Laticínios' },
    groups: [
      { id: 'lacteos', label: { es: 'Leche', pt: 'Leite' }, icon: 'leche', L1: ['Lácteos y alternativas vegetales'], keywords: ['leche', 'leite', 'lácteo'] },
      { id: 'queso', label: { es: 'Quesos', pt: 'Queijos' }, icon: 'queso', subgrupos: ['Quesos'], keywords: ['queso', 'queijo'] },
      { id: 'yogur', label: { es: 'Yogur', pt: 'Iogurte' }, icon: 'yogur', keywords: ['yogur', 'iogurte', 'yoghurt'] },
    ],
  },
  {
    id: 'frutos-secos',
    label: { es: 'Frutos secos y semillas', pt: 'Oleaginosas e sementes' },
    groups: [
      { id: 'nuez', label: { es: 'Nueces', pt: 'Nozes' }, icon: 'nuez', subgrupos: ['Frutos secos'], keywords: ['nuez', 'noz', 'almendra', 'castanha'] },
      { id: 'mani', label: { es: 'Maní / cacahuate', pt: 'Amendoim' }, icon: 'cacahuate', keywords: ['maní', 'cacahuate', 'amendoim'] },
      { id: 'mantequilla-mani', label: { es: 'Mantequilla de maní', pt: 'Pasta de amendoim' }, icon: 'crema_mani', keywords: ['mantequilla de maní', 'pasta de amendoim', 'peanut butter', 'crema de cacahuate'] },
      { id: 'hummus', label: { es: 'Hummus', pt: 'Homus' }, icon: 'hummus', keywords: ['hummus', 'homus', 'garbanzo'] },
    ],
  },
  {
    id: 'suplementos',
    label: { es: 'Suplementos', pt: 'Suplementos' },
    groups: [
      { id: 'proteina-polvo', label: { es: 'Proteína en polvo', pt: 'Proteína em pó' }, icon: 'whey', L1: ['Suplementos'], keywords: ['proteína', 'whey', 'proteína em pó', 'suero'] },
      { id: 'barra-proteina', label: { es: 'Barras de proteína', pt: 'Barras de proteína' }, icon: 'barra_proteina', keywords: ['barra de proteína', 'protein bar'] },
      { id: 'creatina', label: { es: 'Creatina', pt: 'Creatina' }, icon: 'creatina', keywords: ['creatina'] },
      { id: 'colageno', label: { es: 'Colágeno', pt: 'Colágeno' }, icon: 'colageno', keywords: ['colágeno', 'colageno'] },
      { id: 'multivitaminico', label: { es: 'Multivitamínico', pt: 'Multivitamínico' }, icon: 'multivitaminico', keywords: ['multivitamínico', 'vitaminas', 'multivitaminico'] },
    ],
  },
  {
    id: 'bebidas',
    label: { es: 'Bebidas', pt: 'Bebidas' },
    groups: [
      { id: 'refrescos', label: { es: 'Refrescos / gaseosas', pt: 'Refrigerantes' }, icon: 'refresco', L1: ['Bebidas'], keywords: ['refresco', 'gaseosa', 'soda', 'refrigerante', 'cola'] },
      { id: 'jugos', label: { es: 'Jugos', pt: 'Sucos' }, icon: 'jugo', L1: ['Bebidas'], keywords: ['jugo', 'zumo', 'suco', 'néctar'] },
      { id: 'cafe', label: { es: 'Café', pt: 'Café' }, icon: 'cafe', keywords: ['café', 'cafeína', 'cafe'] },
    ],
  },
  {
    id: 'otros',
    label: { es: 'Otros', pt: 'Outros' },
    groups: [
      { id: 'dulces', label: { es: 'Dulces', pt: 'Doces' }, icon: 'caramelo', L1: ['Dulces y postres'], keywords: ['dulce', 'doce', 'postre', 'azúcar', 'caramelo', 'golosina'] },
      { id: 'chocolate', label: { es: 'Chocolate', pt: 'Chocolate' }, icon: 'chocolate', keywords: ['chocolate', 'cacao'] },
      { id: 'helado', label: { es: 'Helado', pt: 'Sorvete' }, icon: 'helado', keywords: ['helado', 'sorvete', 'gelado'] },
      { id: 'aceitunas', label: { es: 'Aceitunas', pt: 'Azeitonas' }, icon: 'aceituna', keywords: ['aceituna', 'azeitona', 'oliva'] },
      { id: 'coco', label: { es: 'Coco', pt: 'Coco' }, icon: 'coco', keywords: ['coco'] },
      { id: 'mayonesa', label: { es: 'Mayonesa', pt: 'Maionese' }, icon: 'mayonesa', keywords: ['mayonesa', 'maionese', 'mayo'] },
      { id: 'mostaza', label: { es: 'Mostaza', pt: 'Mostarda' }, icon: 'mostaza', keywords: ['mostaza', 'mostarda'] },
      { id: 'picante', label: { es: 'Picante', pt: 'Picante' }, icon: 'chile', keywords: ['picante', 'chile', 'ají', 'pimienta', 'apimentado'] },
      { id: 'frituras', label: { es: 'Frituras', pt: 'Frituras' }, icon: 'aceite', keywords: ['frito', 'fritura', 'frita', 'empanado', 'rebozado'] },
    ],
  },
];

export function getMacroSections(lang: GroupLang = 'es') {
  const l: GroupLang = lang === 'pt' ? 'pt' : 'es';
  return MACRO_SECTIONS.map((s) => ({
    id: s.id,
    label: s.label[l],
    groups: s.groups.map((g) => ({ id: g.id, label: g.label[l], icon: g.icon })),
  }));
}

// Etiquetas planas (todas) en un idioma — útil si se necesitan en otro contexto.
export function getMacroFoodGroupLabels(lang: GroupLang = 'es'): string[] {
  const l: GroupLang = lang === 'pt' ? 'pt' : 'es';
  return MACRO_SECTIONS.flatMap((s) => s.groups.map((g) => g.label[l]));
}
