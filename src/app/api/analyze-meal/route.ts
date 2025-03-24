import { NextResponse } from 'next/server';
import openai from '@/utils/openai';

export async function POST(request: Request) {
  try {
    const { description } = await request.json();
    
    if (!description?.trim()) {
      return NextResponse.json(
        { error: 'La descripción no puede estar vacía' },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-1106",
      // model: "gpt-3.5-turbo-1106",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Eres un nutricionista y chef experto. Analiza descripciones de alimentos siguiendo este proceso:

PROCESO DE ANÁLISIS:
1. Interpreta la descripción y visualiza una receta completa
2. Piensa: "¿Cómo se prepararía completamente este plato?"
3. Identifica ingredientes principales y secundarios
4. Determina cantidades realistas para una porción individual
5. Calcula valores nutricionales según estas cantidades

PRINCIPIOS DE ESTIMACIÓN DE CANTIDADES:
1. Porciones individuales: Asume cantidades para 1 persona adulta
2. Ingredientes principales: Usa cantidades estándar (ej: 150g de proteína)
3. Acompañamientos: Proporcionales al plato principal
4. Especifica siempre la cantidad natural en el nombre:
   - Unidades contables: "2 huevos", "3 rebanadas de pan"
   - Porciones: "1 porción de arroz (150g)"
   - Medidas de cocina: "2 cucharadas de aceite"

VALORES NUTRICIONALES:
- Basa cálculos en el PESO EN GRAMOS/ML
- Para cada 100g, multiplica por (peso_real/100)
- Redondea a 1 decimal

REGLAS FUNDAMENTALES:
- Piensa en una receta completa, no solo ingredientes aislados
- Si es ambiguo, usa la interpretación más común en cocina
- Incluye todos los ingredientes necesarios para preparar el plato
- Evita inventar: usa valores nutricionales estándar para cada categoría
- Prioriza la precisión en ingredientes principales
- Incluye ingredientes de preparación (aceite, sal)
- Considera el método de cocción probable (horneado, frito, etc.)

Ejemplo JSON para "huevos con pan":
{
  "ingredients": [
    {
      "name": "2 huevos grandes",
      "quantity": 120,
      "calories": 155,
      "protein": 12.5,
      "carbs": 1.1,
      "fat": 10.6
    },
    {
      "name": "2 rebanadas de pan",
      "quantity": 60,
      "calories": 160,
      "protein": 5.2,
      "carbs": 30.2,
      "fat": 2.0
    }
  ]
}`
        },
        {
          role: "user",
          content: `Analiza esta receta y genera JSON con ingredientes, cantidades naturales y valores nutricionales: "${description}"`
        }
      ]
    });

    const responseContent = completion.choices[0].message.content;
    console.log('Respuesta OpenAI:', responseContent);

    try {
      const parsedResponse = JSON.parse(responseContent);
      if (parsedResponse?.ingredients?.length > 0) {
        return NextResponse.json(parsedResponse.ingredients);
      }
      return NextResponse.json(
        { error: 'No se encontraron ingredientes' },
        { status: 400 }
      );
    } catch (error) {
      console.error('Error parsing:', responseContent);
      return NextResponse.json(
        { error: 'Error al procesar ingredientes' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error en el servicio' },
      { status: 500 }
    );
  }
}