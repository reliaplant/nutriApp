import { NextRequest, NextResponse } from 'next/server';

// Función para esperar un tiempo determinado
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { messages } = body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json({ error: 'Se requieren mensajes válidos' }, { status: 400 });
        }

        // Verifica que la API key esté configurada
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            console.error('No se encontró la API key de OpenAI');
            return NextResponse.json({ error: 'Configuración de API incompleta' }, { status: 500 });
        }

        console.log('Enviando solicitud a OpenAI API...');
        
        // Configuración para reintentos
        const MAX_RETRIES = 3;
        let retries = 0;
        let response;

        while (retries < MAX_RETRIES) {
            try {
                response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: 'gpt-3.5-turbo', // Modelo menos costoso
                        messages,
                        max_tokens: 500, // Tokens reducidos
                        temperature: 0.3 // Más determinístico
                    })
                });

                // Si la respuesta es exitosa, salimos del bucle
                if (response.ok) {
                    break;
                }
                
                // Si es un 429, esperamos y reintentamos
                if (response.status === 429) {
                    console.log(`Recibido error 429. Reintento ${retries + 1} de ${MAX_RETRIES}...`);
                    retries++;
                    
                    // Esperar tiempo exponencial entre reintentos (1s, 2s, 4s...)
                    const backoffTime = 1000 * Math.pow(2, retries);
                    await sleep(backoffTime);
                } else {
                    // Si es otro error, lo manejamos fuera del bucle
                    break;
                }
            } catch (e) {
                console.error('Error al hacer fetch:', e);
                break;
            }
        }

        // Si después de los reintentos seguimos con error 429
        if (response?.status === 429) {
            return NextResponse.json({
                error: 'Has alcanzado el límite de solicitudes a la API. Usa un token diferente o espera unos minutos.',
                type: 'rate_limit'
            }, { status: 429 });
        }

        // Para otros errores
        if (!response?.ok) {
            let errorDetails = 'Error desconocido';
            try {
                const errorText = await response.text();
                errorDetails = errorText;
            } catch {}

            return NextResponse.json({
                error: `Error en la API de OpenAI: ${response?.status}`,
                details: errorDetails
            }, { status: 500 });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error en el servidor:', error);
        return NextResponse.json({
            error: 'Error interno del servidor',
            message: error instanceof Error ? error.message : 'Error desconocido'
        }, { status: 500 });
    }
}