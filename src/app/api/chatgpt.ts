import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const body = await req.json();
    const { messages } = body;

    if (!messages || messages.length === 0) {
        return NextResponse.json({ error: 'No messages provided' }, { status: 400 });
    }

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages,
                max_tokens: 500
            })
        });

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error llamando a la API de OpenAI:', error);
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        } else {
            return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
        }
    }
}
