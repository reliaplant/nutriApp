// Indicaciones predefinidas de refeit (plantillas sugeridas).
// Redactadas para entregarse al paciente en el PDF del plan. Cada una tiene
// título y contenido en español y portugués. El idioma se elige según el
// idioma del plan del paciente.

export type IndicationLang = 'es' | 'pt';

export interface PredefinedIndication {
  id: string;
  category: string;
  title: { es: string; pt: string };
  content: { es: string; pt: string };
}

// Categorías para navegar la biblioteca (panel izquierdo).
export const INDICATION_CATEGORIES: { id: string; label: { es: string; pt: string } }[] = [
  { id: 'paquetes', label: { es: 'Paquetes', pt: 'Pacotes' } },
  { id: 'hidratacion', label: { es: 'Hidratación', pt: 'Hidratação' } },
  { id: 'alimentacion', label: { es: 'Alimentación', pt: 'Alimentação' } },
  { id: 'habitos', label: { es: 'Hábitos', pt: 'Hábitos' } },
  { id: 'actividad', label: { es: 'Actividad física', pt: 'Atividade física' } },
  { id: 'descanso', label: { es: 'Descanso', pt: 'Descanso' } },
  { id: 'suplementos', label: { es: 'Suplementos', pt: 'Suplementos' } },
  { id: 'flexibilidad', label: { es: 'Comidas libres', pt: 'Refeições livres' } },
  { id: 'seguimiento', label: { es: 'Seguimiento', pt: 'Acompanhamento' } },
];

export const PREDEFINED_INDICATIONS: PredefinedIndication[] = [
  // ── Paquetes: sets completos listos para usar (compilan varias indicaciones) ──
  {
    id: 'paquete-general',
    category: 'paquetes',
    title: { es: 'Indicaciones generales (completo)', pt: 'Orientações gerais (completo)' },
    content: {
      es: `INDICACIONES GENERALES

• Hidratación: bebe 30–35 ml de agua por kilo de peso al día (unos 6 a 8 vasos), repartidos durante la jornada.
• Método del plato: la mitad verduras o ensalada, un cuarto proteína y un cuarto carbohidratos.
• Incluye una fuente de proteína en cada comida principal.
• Apunta a 5 porciones de frutas y verduras al día; prioriza la fibra.
• Reduce el azúcar, las bebidas azucaradas y los ultraprocesados.
• Cocina al horno, plancha, vapor o hervido; modera frituras y sal.
• Come despacio y sin pantallas, al menos 20 minutos por comida.
• Mantén horarios regulares y no te saltes comidas.
• Actividad física: al menos 150 minutos por semana + 2 o 3 sesiones de fuerza.
• Duerme entre 7 y 9 horas: el descanso regula el apetito.`,
      pt: `ORIENTAÇÕES GERAIS

• Hidratação: beba 30–35 ml de água por quilo de peso por dia (cerca de 6 a 8 copos), distribuídos ao longo do dia.
• Método do prato: metade de verduras ou salada, um quarto de proteína e um quarto de carboidratos.
• Inclua uma fonte de proteína em cada refeição principal.
• Busque 5 porções de frutas e verduras por dia; priorize a fibra.
• Reduza o açúcar, as bebidas açucaradas e os ultraprocessados.
• Cozinhe no forno, grelha, vapor ou cozido; modere frituras e sal.
• Coma devagar e sem telas, pelo menos 20 minutos por refeição.
• Mantenha horários regulares e não pule refeições.
• Atividade física: pelo menos 150 minutos por semana + 2 ou 3 sessões de força.
• Durma entre 7 e 9 horas: o descanso regula o apetite.`,
    },
  },
  {
    id: 'paquete-perdida-peso',
    category: 'paquetes',
    title: { es: 'Pérdida de peso', pt: 'Perda de peso' },
    content: {
      es: `INDICACIONES — PÉRDIDA DE PESO

• Respeta las porciones de tu plan; usa platos más pequeños.
• Proteína y verduras en cada comida para mayor saciedad.
• Bebe agua a lo largo del día y un vaso antes de las comidas.
• Evita bebidas azucaradas, alcohol y ultraprocesados.
• Come despacio y sin distracciones; espera 10 minutos antes de repetir.
• Planea y prepara tus comidas con antelación.
• Muévete al menos 150 minutos por semana e incluye fuerza para conservar músculo.
• Duerme bien: dormir poco aumenta el apetito y los antojos.
• Pésate 1 vez por semana en las mismas condiciones; mira la tendencia, no el día.`,
      pt: `ORIENTAÇÕES — PERDA DE PESO

• Respeite as porções do seu plano; use pratos menores.
• Proteína e verduras em cada refeição para mais saciedade.
• Beba água ao longo do dia e um copo antes das refeições.
• Evite bebidas açucaradas, álcool e ultraprocessados.
• Coma devagar e sem distrações; espere 10 minutos antes de repetir.
• Planeje e prepare suas refeições com antecedência.
• Mexa-se pelo menos 150 minutos por semana e inclua força para preservar músculo.
• Durma bem: dormir pouco aumenta o apetite e os desejos.
• Pese-se 1 vez por semana nas mesmas condições; olhe a tendência, não o dia.`,
    },
  },
  {
    id: 'paquete-habitos',
    category: 'paquetes',
    title: { es: 'Hábitos saludables', pt: 'Hábitos saudáveis' },
    content: {
      es: `INDICACIONES — HÁBITOS

• Mantén horarios de comida regulares; no te saltes comidas.
• Come con atención, masticando bien y sin pantallas.
• Haz la compra con una lista y nunca con hambre.
• Dedica un día de la semana a planear y adelantar comidas.
• Al comer fuera, prioriza proteína y verduras y cuida la porción.
• Maneja los antojos: espera 10 minutos y bebe agua antes de decidir.`,
      pt: `ORIENTAÇÕES — HÁBITOS

• Mantenha horários de refeição regulares; não pule refeições.
• Coma com atenção, mastigando bem e sem telas.
• Faça as compras com uma lista e nunca com fome.
• Reserve um dia da semana para planejar e adiantar refeições.
• Ao comer fora, priorize proteína e verduras e cuide da porção.
• Controle os desejos: espere 10 minutos e beba água antes de decidir.`,
    },
  },
  {
    id: 'paquete-deportista',
    category: 'paquetes',
    title: { es: 'Rendimiento y masa muscular', pt: 'Desempenho e massa muscular' },
    content: {
      es: `INDICACIONES — RENDIMIENTO Y MASA MUSCULAR

• Proteína suficiente en cada comida, incluida una toma después de entrenar.
• Hidrátate bien, sobre todo los días de entrenamiento.
• Entrena fuerza 3 o más veces por semana, de forma progresiva.
• Incluye carbohidratos alrededor del entrenamiento para tener energía.
• Toma suplementos solo según lo indicado en esta consulta.
• Duerme entre 7 y 9 horas para recuperar y progresar.`,
      pt: `ORIENTAÇÕES — DESEMPENHO E MASSA MUSCULAR

• Proteína suficiente em cada refeição, incluindo uma após o treino.
• Hidrate-se bem, principalmente nos dias de treino.
• Treine força 3 ou mais vezes por semana, de forma progressiva.
• Inclua carboidratos em torno do treino para ter energia.
• Tome suplementos apenas conforme indicado nesta consulta.
• Durma entre 7 e 9 horas para recuperar e progredir.`,
    },
  },
  {
    id: 'hidratacion',
    category: 'hidratacion',
    title: { es: 'Hidratación', pt: 'Hidratação' },
    content: {
      es: 'Bebe entre 30 y 35 ml de agua por kilo de peso al día (alrededor de 6 a 8 vasos). Reparte el consumo durante la jornada y aumenta la cantidad los días de calor o ejercicio. El café y las infusiones sin azúcar también cuentan.',
      pt: 'Beba entre 30 e 35 ml de água por quilo de peso por dia (cerca de 6 a 8 copos). Distribua o consumo ao longo do dia e aumente a quantidade em dias quentes ou de exercício. Café e chás sem açúcar também contam.',
    },
  },
  {
    id: 'metodo-plato',
    category: 'alimentacion',
    title: { es: 'Método del plato', pt: 'Método do prato' },
    content: {
      es: 'Arma tu plato así: la mitad con verduras o ensalada, un cuarto con proteína (carne, pescado, huevo o legumbres) y un cuarto con carbohidratos (arroz, papa, pasta o pan). Es una guía visual sencilla para equilibrar cualquier comida sin pesar alimentos.',
      pt: 'Monte seu prato assim: metade com verduras ou salada, um quarto com proteína (carne, peixe, ovo ou leguminosas) e um quarto com carboidratos (arroz, batata, massa ou pão). É um guia visual simples para equilibrar qualquer refeição sem pesar alimentos.',
    },
  },
  {
    id: 'proteina',
    category: 'alimentacion',
    title: { es: 'Proteína en cada comida', pt: 'Proteína em cada refeição' },
    content: {
      es: 'Incluye una fuente de proteína en todas las comidas principales. Ayuda a mantener la masa muscular, prolonga la saciedad y reduce los antojos entre horas.',
      pt: 'Inclua uma fonte de proteína em todas as refeições principais. Ajuda a manter a massa muscular, prolonga a saciedade e reduz a vontade de beliscar entre as refeições.',
    },
  },
  {
    id: 'vegetales-fibra',
    category: 'alimentacion',
    title: { es: 'Verduras, frutas y fibra', pt: 'Verduras, frutas e fibra' },
    content: {
      es: 'Apunta a 5 porciones al día entre frutas y verduras, e incluye vegetales en al menos dos comidas. La fibra mejora la digestión, regula el azúcar en sangre y aporta saciedad con pocas calorías.',
      pt: 'Busque 5 porções por dia entre frutas e verduras, e inclua vegetais em pelo menos duas refeições. A fibra melhora a digestão, regula o açúcar no sangue e dá saciedade com poucas calorias.',
    },
  },
  {
    id: 'azucar-ultraprocesados',
    category: 'alimentacion',
    title: { es: 'Azúcar y ultraprocesados', pt: 'Açúcar e ultraprocessados' },
    content: {
      es: 'Reduce las bebidas azucaradas, los dulces y los productos ultraprocesados (galletas, snacks, embutidos, comida rápida). Prioriza alimentos en su estado natural: aportan más nutrientes y sacian mejor.',
      pt: 'Reduza as bebidas açucaradas, os doces e os produtos ultraprocessados (biscoitos, snacks, embutidos, fast food). Priorize alimentos no seu estado natural: têm mais nutrientes e saciam melhor.',
    },
  },
  {
    id: 'cocina-saludable',
    category: 'alimentacion',
    title: { es: 'Cocción saludable', pt: 'Cozimento saudável' },
    content: {
      es: 'Prefiere preparaciones al horno, a la plancha, al vapor o hervidas, y reserva los fritos para ocasiones puntuales. Usa el aceite con medida (1 a 2 cucharadas por comida) y condimenta con especias y hierbas en lugar de exceso de sal.',
      pt: 'Prefira preparações no forno, na grelha, no vapor ou cozidas, e deixe as frituras para ocasiões pontuais. Use o óleo com moderação (1 a 2 colheres por refeição) e tempere com especiarias e ervas em vez de excesso de sal.',
    },
  },
  {
    id: 'horarios',
    category: 'habitos',
    title: { es: 'Horarios y orden de comidas', pt: 'Horários e regularidade' },
    content: {
      es: 'Procura comer a horas similares cada día y evita saltarte comidas: llegar con mucha hambre a la siguiente suele llevar a comer de más. Mantener un orden regular ayuda a controlar el apetito.',
      pt: 'Procure comer em horários parecidos todos os dias e evite pular refeições: chegar com muita fome à próxima costuma levar a comer demais. Manter uma rotina regular ajuda a controlar o apetite.',
    },
  },
  {
    id: 'comer-consciente',
    category: 'habitos',
    title: { es: 'Comer con atención', pt: 'Comer com atenção' },
    content: {
      es: 'Come sin prisa, masticando bien y sin pantallas. Tardar al menos 20 minutos por comida le da tiempo al cuerpo de registrar la saciedad y ayuda a comer la cantidad justa.',
      pt: 'Coma sem pressa, mastigando bem e sem telas. Levar pelo menos 20 minutos por refeição dá tempo ao corpo de registrar a saciedade e ajuda a comer a quantidade certa.',
    },
  },
  {
    id: 'antojos',
    category: 'habitos',
    title: { es: 'Manejo de antojos', pt: 'Controle de desejos' },
    content: {
      es: 'Cuando aparezca un antojo, espera 10 minutos y bebe un vaso de agua antes de decidir; muchas veces se trata de sed o aburrimiento. Si persiste, elige una porción pequeña y disfrútala sin culpa.',
      pt: 'Quando surgir um desejo, espere 10 minutos e beba um copo de água antes de decidir; muitas vezes é sede ou tédio. Se persistir, escolha uma porção pequena e aproveite sem culpa.',
    },
  },
  {
    id: 'compras',
    category: 'habitos',
    title: { es: 'Compras inteligentes', pt: 'Compras inteligentes' },
    content: {
      es: 'Haz la compra con una lista y nunca con el estómago vacío. Si no tienes ultraprocesados en casa, no tendrás que resistirte a ellos: lo que entra a la despensa es lo que terminas comiendo.',
      pt: 'Faça as compras com uma lista e nunca de estômago vazio. Se não houver ultraprocessados em casa, você não precisará resistir a eles: o que entra na despensa é o que você acaba comendo.',
    },
  },
  {
    id: 'meal-prep',
    category: 'habitos',
    title: { es: 'Planificación y preparación', pt: 'Planejamento e preparo' },
    content: {
      es: 'Dedica un momento de la semana a planear y adelantar comidas (cocinar proteínas, lavar y cortar verduras, dejar porciones listas). Tener opciones saludables a mano evita decisiones impulsivas cuando hay hambre o prisa.',
      pt: 'Reserve um momento da semana para planejar e adiantar refeições (cozinhar proteínas, lavar e cortar verduras, deixar porções prontas). Ter opções saudáveis à mão evita decisões impulsivas quando bate a fome ou a pressa.',
    },
  },
  {
    id: 'comer-fuera',
    category: 'habitos',
    title: { es: 'Comer fuera de casa', pt: 'Comer fora de casa' },
    content: {
      es: 'Al comer fuera, prioriza proteínas y vegetales, pide las salsas y aderezos aparte, y modera el pan de entrada y las bebidas azucaradas. No hace falta ser perfecto: elige la mejor opción disponible y cuida la porción.',
      pt: 'Ao comer fora, priorize proteínas e vegetais, peça os molhos à parte e modere o pão de entrada e as bebidas açucaradas. Não precisa ser perfeito: escolha a melhor opção disponível e cuide da porção.',
    },
  },
  {
    id: 'etiquetas',
    category: 'alimentacion',
    title: { es: 'Leer etiquetas', pt: 'Ler rótulos' },
    content: {
      es: 'Antes de comprar, revisa el tamaño de la porción, los azúcares añadidos y la lista de ingredientes (cuanto más corta y reconocible, mejor). No te dejes guiar solo por frases como "light" o "natural" en el frente del envase.',
      pt: 'Antes de comprar, confira o tamanho da porção, os açúcares adicionados e a lista de ingredientes (quanto mais curta e reconhecível, melhor). Não se guie apenas por frases como "light" ou "natural" na frente da embalagem.',
    },
  },
  {
    id: 'alcohol',
    category: 'habitos',
    title: { es: 'Consumo de alcohol', pt: 'Consumo de álcool' },
    content: {
      es: 'Limita el alcohol lo máximo posible. Aporta calorías vacías, abre el apetito, dificulta el control del peso y afecta el descanso y la recuperación. Si bebes, hazlo con moderación y alterna con agua.',
      pt: 'Limite o álcool ao máximo. Ele fornece calorias vazias, abre o apetite, dificulta o controle de peso e afeta o descanso e a recuperação. Se beber, faça com moderação e intercale com água.',
    },
  },
  {
    id: 'actividad',
    category: 'actividad',
    title: { es: 'Actividad física', pt: 'Atividade física' },
    content: {
      es: 'Mantente activo al menos 150 minutos por semana e incluye 2 o 3 sesiones de fuerza para conservar masa muscular. Sumar pasos en el día (escaleras, caminatas cortas) también marca la diferencia.',
      pt: 'Mantenha-se ativo pelo menos 150 minutos por semana e inclua 2 ou 3 sessões de força para preservar a massa muscular. Somar passos no dia (escadas, caminhadas curtas) também faz diferença.',
    },
  },
  {
    id: 'sueno',
    category: 'descanso',
    title: { es: 'Descanso y sueño', pt: 'Descanso e sono' },
    content: {
      es: 'Procura dormir entre 7 y 9 horas cada noche con horarios regulares. Dormir poco aumenta el apetito y los antojos de azúcar; un buen descanso mejora tus resultados tanto como la alimentación.',
      pt: 'Procure dormir entre 7 e 9 horas por noite com horários regulares. Dormir pouco aumenta o apetite e a vontade de açúcar; um bom descanso melhora seus resultados tanto quanto a alimentação.',
    },
  },
  {
    id: 'constancia',
    category: 'seguimiento',
    title: { es: 'Constancia y peso', pt: 'Constância e peso' },
    content: {
      es: 'Pésate una vez por semana, en ayunas y en las mismas condiciones. El peso fluctúa día a día por agua y digestión: lo que importa es la tendencia a lo largo de las semanas, no el número de un día puntual.',
      pt: 'Pese-se uma vez por semana, em jejum e nas mesmas condições. O peso oscila de um dia para o outro por água e digestão: o que importa é a tendência ao longo das semanas, não o número de um dia isolado.',
    },
  },
  {
    id: 'suplementacion',
    category: 'suplementos',
    title: { es: 'Suplementación', pt: 'Suplementação' },
    content: {
      es: 'Si en algún momento consideras tomar un suplemento, consúltalo antes con tu nutricionista; no inicies suplementos por tu cuenta. Si ya tomas alguno, respeta la dosis y el horario indicados: más no siempre es mejor.',
      pt: 'Se em algum momento considerar tomar um suplemento, consulte antes seu nutricionista; não inicie suplementos por conta própria. Se já toma algum, respeite a dose e o horário indicados: mais nem sempre é melhor.',
    },
  },
  {
    id: 'comida-libre',
    category: 'flexibilidad',
    title: { es: 'Comida libre', pt: 'Refeição livre' },
    content: {
      es: 'Tienes una comida libre a la semana para disfrutar lo que quieras sin culpa. Mantén una porción razonable y retoma el plan en la siguiente comida: la flexibilidad ayuda a sostener el proceso a largo plazo.',
      pt: 'Você tem uma refeição livre por semana para aproveitar o que quiser sem culpa. Mantenha uma porção razoável e retome o plano na refeição seguinte: a flexibilidade ajuda a sustentar o processo a longo prazo.',
    },
  },
  {
    id: 'regla-8020',
    category: 'flexibilidad',
    title: { es: 'Regla 80/20', pt: 'Regra 80/20' },
    content: {
      es: 'Si el 80% de tus comidas son nutritivas, el 20% restante puede ser más flexible. No busques la perfección: la constancia sostenida vale mucho más que ser estricto unos días y abandonar.',
      pt: 'Se 80% das suas refeições forem nutritivas, os 20% restantes podem ser mais flexíveis. Não busque a perfeição: a constância sustentada vale muito mais do que ser rígido por alguns dias e desistir.',
    },
  },
];

export interface FlatIndication {
  id: string;
  category: string;
  title: string;
  content: string;
  source: 'refeit';
}

export function getPredefinedIndications(lang: IndicationLang = 'es'): FlatIndication[] {
  const l: IndicationLang = lang === 'pt' ? 'pt' : 'es';
  return PREDEFINED_INDICATIONS.map((i) => ({
    id: `refeit:${i.id}`,
    category: i.category,
    title: i.title[l],
    content: i.content[l],
    source: 'refeit' as const,
  }));
}

export function getIndicationCategories(lang: IndicationLang = 'es'): { id: string; label: string }[] {
  const l: IndicationLang = lang === 'pt' ? 'pt' : 'es';
  return INDICATION_CATEGORIES.map((c) => ({ id: c.id, label: c.label[l] }));
}
