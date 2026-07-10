import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import bdd from '@/app/shared/bdd_nutricional.json';

export const runtime = 'nodejs';
export const maxDuration = 30;

// ── Catálogo base (se construye una vez por proceso y se cachea en el prompt) ──
type Alimento = {
  id: string;
  nombre_es?: string;
  nombre?: string;
  L1?: string;
  nutrientes_100g?: Record<string, { valores?: Record<string, number | null> }>;
};

function macrosDe(a: Alimento): { kcal: number; p: number; c: number; f: number } | null {
  const nut = a.nutrientes_100g || {};
  for (const e of ['crudo', 'cocido', 'NA']) {
    const v = nut[e]?.valores;
    if (v && v.kcal != null) {
      return { kcal: Math.round(v.kcal), p: Math.round((v.prot as number) || 0), c: Math.round((v.carb as number) || 0), f: Math.round((v.grasa as number) || 0) };
    }
  }
  return null;
}

let CATALOGO: string | null = null;
function getCatalogo(): string {
  if (CATALOGO) return CATALOGO;
  const lines: string[] = [];
  for (const a of (bdd as unknown as { alimentos: Alimento[] }).alimentos) {
    const m = macrosDe(a);
    if (!m) continue;
    lines.push(`${a.id}|${a.nombre_es || a.nombre}|${a.L1}|${m.kcal}|${m.p}|${m.c}|${m.f}`);
  }
  // Formato: id|nombre|grupo|kcal|prot|carb|grasa (por 100 g)
  CATALOGO = lines.join('\n');
  return CATALOGO;
}

const SYSTEM_INTRO =
  'Eres un nutricionista experto que arma comidas usando EXCLUSIVAMENTE ingredientes de un catálogo dado. ' +
  'Cada línea del catálogo es: id|nombre|grupo|kcal|prot|carb|grasa (valores por 100 g). ' +
  'Reglas: (1) Usa SOLO ids que aparezcan en el catálogo o en la lista de ingredientes del usuario. ' +
  'Nunca inventes ids ni alimentos. ' +
  '(2) Las cantidades son para UNA porción individual (1 persona) — lo que el paciente come en esa comida, NO una receta familiar ni un lote. ' +
  'Si el plato se suele preparar en lote (ej. tortilla española), da igualmente las cantidades de una sola porción servida. ' +
  'Devuelve gramos realistas y caseros por ingrediente. ' +
  '(3) Si te dan un objetivo de kcal/macros, acércate lo más posible ajustando cantidades. ' +
  '(4) Una comida razonable tiene entre 3 y 7 ingredientes. ' +
  '(5) Escribe también una receta de preparación CLARA y breve para el paciente (cómo prepararla paso a paso, 2 a 5 frases), en el mismo idioma del pedido. ' +
  '(6) Responde SIEMPRE mediante la herramienta registrar_comida.';

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Falta ANTHROPIC_API_KEY en el servidor.' }, { status: 500 });
  }

  let body: {
    modo?: 'generar' | 'sugerir';
    descripcion?: string;
    kcalObjetivo?: number;
    macros?: { p?: number; c?: number; f?: number };
    categoria?: string;
    pais?: string;
    idioma?: string;
    enfoque?: string;
    gustos?: string[];
    disgustos?: string[];
    nota?: string;
    propios?: { id: string; nombre: string; kcal: number; p: number; c: number; f: number }[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido.' }, { status: 400 });
  }

  const anthropicClient = new Anthropic({ apiKey });
  const modelId = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001';

  // ── Modo SUGERIR: devuelve solo ~12 títulos de ideas (rápido y barato) ──
  if (body.modo === 'sugerir') {
    // Descripción de cada categoría para que las ideas encajen (un snack no es un plato principal).
    const catDescripcion = (cat?: string): string => {
      const c = (cat || '').toLowerCase();
      if (c.includes('desayun')) return 'DESAYUNO: comida de la mañana (ej. avena, huevos, tostadas, yogur con fruta, smoothies, pan integral). No platos de almuerzo/cena.';
      if (c.includes('snack') || c.includes('colaci') || c.includes('merienda')) return 'SNACK / COLACIÓN: porción PEQUEÑA y LIGERA entre comidas (ej. fruta, yogur, puñado de frutos secos, barrita, hummus con vegetales, tostada, smoothie). NUNCA un plato principal como pollo, carne con guarnición, pastas o arroces.';
      if (c.includes('almuerz') || c.includes('comida')) return 'ALMUERZO: plato principal del mediodía, completo y equilibrado.';
      if (c.includes('cena')) return 'CENA: plato principal de la noche, preferiblemente ligero.';
      return '';
    };
    const ctx: string[] = [];
    if (body.categoria) {
      ctx.push(`Categoría de comida: ${body.categoria}.`);
      const d = catDescripcion(body.categoria);
      if (d) ctx.push(`OBLIGATORIO: todas las ideas deben ser apropiadas para esta categoría → ${d}`);
    }
    if (body.enfoque?.trim()) ctx.push(`Enfoque pedido por el nutricionista para estas ideas: ${body.enfoque.trim().slice(0, 300)}. Ajusta TODAS las ideas a este enfoque, sin salirte de la categoría.`);
    if (body.pais) ctx.push(`Preferencia regional / país: ${body.pais}.`);
    if (Array.isArray(body.gustos) && body.gustos.length) ctx.push(`Al paciente le GUSTAN mucho estos alimentos (priorízalos): ${body.gustos.slice(0, 40).join(', ')}.`);
    if (Array.isArray(body.disgustos) && body.disgustos.length) ctx.push(`Al paciente NO le gustan estos alimentos (EVÍTALOS por completo): ${body.disgustos.slice(0, 40).join(', ')}.`);
    if (body.nota?.trim()) ctx.push(`Otras preferencias del paciente a respetar: ${body.nota.trim().slice(0, 400)}.`);
    if (body.idioma) ctx.push(`IDIOMA: escribe TODOS los títulos en ${body.idioma}. No mezcles idiomas.`);
    try {
      const sg = await anthropicClient.messages.create({
        model: modelId,
        max_tokens: 512,
        system: [
          {
            type: 'text',
            text:
              'Eres un nutricionista que propone ideas de comidas saludables, caseras y realistas. ' +
              'Devuelve EXACTAMENTE 12 ideas, cada una solo con un título corto y apetecible (sin ingredientes ni receta). ' +
              'REGLA CLAVE: cada idea debe encajar EXACTAMENTE con la categoría de comida indicada (un snack es una colación pequeña y ligera, NO un plato principal; un desayuno es comida de mañana, etc.). Si la idea no encaja con la categoría, NO la incluyas. ' +
              'Respeta también el enfoque pedido (p. ej. "dulces", "low carb", "pre-entreno"). ' +
              'Variedad: mezcla opciones clásicas y creativas dentro de esos límites. ' +
              'Responde SIEMPRE mediante la herramienta sugerir_comidas.',
          },
        ],
        tools: [
          {
            name: 'sugerir_comidas',
            description: 'Registra una lista de 12 ideas de comidas (solo títulos).',
            input_schema: {
              type: 'object',
              properties: {
                ideas: {
                  type: 'array',
                  description: 'Lista de exactamente 12 títulos cortos de comidas',
                  items: { type: 'string' },
                },
              },
              required: ['ideas'],
            },
          },
        ],
        tool_choice: { type: 'tool', name: 'sugerir_comidas' },
        messages: [{ role: 'user', content: ctx.join('\n') || 'Propón 12 ideas de comidas saludables variadas.' }],
      });
      const tu = sg.content.find((b) => b.type === 'tool_use');
      if (!tu || tu.type !== 'tool_use') {
        return NextResponse.json({ error: 'La IA no devolvió ideas.' }, { status: 502 });
      }
      const ideasRaw = (tu.input as { ideas?: unknown }).ideas;
      const ideas = Array.isArray(ideasRaw)
        ? ideasRaw.filter((s): s is string => typeof s === 'string' && s.trim().length > 0).map((s) => s.trim()).slice(0, 12)
        : [];
      return NextResponse.json({ ideas });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      console.error('Error IA sugerir-comidas:', message);
      return NextResponse.json({ error: 'No se pudieron generar ideas. ' + message }, { status: 500 });
    }
  }

  const partes: string[] = [];
  partes.push(`Pedido del nutricionista: ${body.descripcion?.trim() || 'una comida saludable y equilibrada'}.`);
  if (body.categoria) partes.push(`Categoría: ${body.categoria}.`);
  if (body.kcalObjetivo) partes.push(`Objetivo calórico aproximado: ${Math.round(body.kcalObjetivo)} kcal.`);
  if (body.macros && (body.macros.p || body.macros.c || body.macros.f)) {
    partes.push(`Macros objetivo (g): proteína ${body.macros.p ?? '-'}, carbohidratos ${body.macros.c ?? '-'}, grasa ${body.macros.f ?? '-'}.`);
  }
  // En modo generar el PLATO PEDIDO manda: NO sustituyas sus ingredientes característicos
  // por preferencias. Las preferencias son solo una guía secundaria para acompañamientos.
  partes.push('IMPORTANTE: respeta fielmente el plato solicitado. Usa sus ingredientes característicos aunque coincidan con lo que al paciente "no le gusta" (p. ej. una boloñesa lleva carne de res: NO la cambies por pollo). Tampoco agregues alimentos ajenos al plato solo porque le gusten al paciente.');
  if (Array.isArray(body.disgustos) && body.disgustos.length) partes.push(`Solo como guía secundaria, si el plato lo permite evita estos alimentos en los acompañamientos (nunca en los ingredientes que definen el plato): ${body.disgustos.slice(0, 40).join(', ')}.`);
  if (body.nota?.trim()) partes.push(`Considera estas notas del paciente (p. ej. alergias) sin alterar el plato pedido: ${body.nota.trim().slice(0, 400)}.`);
  if (body.idioma) partes.push(`IDIOMA DE SALIDA: escribe el NOMBRE de la comida y la PREPARACIÓN completos en ${body.idioma}. No mezcles idiomas.`);
  if (Array.isArray(body.propios) && body.propios.length > 0) {
    const lista = body.propios.slice(0, 200).map((i) => `${i.id}|${i.nombre}|${i.kcal}|${i.p}|${i.c}|${i.f}`).join('\n');
    partes.push(`Ingredientes propios del usuario que también puedes usar (id|nombre|kcal|prot|carb|grasa por 100 g):\n${lista}`);
  }

  try {
    const msg = await anthropicClient.messages.create({
      model: modelId,
      max_tokens: 1024,
      system: [
        { type: 'text', text: SYSTEM_INTRO },
        // El catálogo es estable → se cachea para abaratar las siguientes llamadas.
        { type: 'text', text: `CATÁLOGO DE INGREDIENTES:\n${getCatalogo()}`, cache_control: { type: 'ephemeral' } },
      ],
      tools: [
        {
          name: 'registrar_comida',
          description: 'Registra la comida generada con sus ingredientes (ids del catálogo) y gramos.',
          input_schema: {
            type: 'object',
            properties: {
              nombre: { type: 'string', description: 'Nombre corto y atractivo de la comida' },
              preparacion: { type: 'string', description: 'Receta de preparación clara para el paciente (cómo hacerla), 2 a 5 frases' },
              ingredientes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', description: 'id exacto del catálogo' },
                    gramos: { type: 'number', description: 'cantidad en gramos' },
                  },
                  required: ['id', 'gramos'],
                },
              },
            },
            required: ['nombre', 'preparacion', 'ingredientes'],
          },
        },
      ],
      tool_choice: { type: 'tool', name: 'registrar_comida' },
      messages: [{ role: 'user', content: partes.join('\n') }],
    });

    const toolUse = msg.content.find((b) => b.type === 'tool_use');
    if (!toolUse || toolUse.type !== 'tool_use') {
      return NextResponse.json({ error: 'La IA no devolvió una comida.' }, { status: 502 });
    }
    const out = toolUse.input as { nombre: string; preparacion?: string; ingredientes: { id: string; gramos: number }[] };
    return NextResponse.json({
      nombre: out.nombre,
      preparacion: out.preparacion || '',
      ingredientes: (out.ingredientes || []).filter((i) => i && i.id && i.gramos > 0),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    console.error('Error IA generar-comida:', message);
    return NextResponse.json({ error: 'No se pudo generar la comida. ' + message }, { status: 500 });
  }
}
