import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Geração de imagem via Gemini 2.5 Flash Image (Nano Banana).
 * Documentação: https://ai.google.dev/gemini-api/docs/image-generation
 *
 * ENVs necessárias na Vercel:
 *   GEMINI_API_KEY  → chave do Google AI Studio (https://aistudio.google.com/app/apikey)
 *
 * Limite: 5 gerações por evento (suficiente pra iterar; previne abuso/custo).
 * Modo: chama API → recebe imagem em base64 → upload pro bucket event-uploads.
 */

const MAX_PER_EVENT = 5;
const GEMINI_MODEL = 'gemini-2.5-flash-image-preview';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

type Body = {
  prompt?: string;
  event_id?: string;
  scope?: 'bg' | 'gift';
};

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Geração de imagem por IA não está configurada na plataforma.' },
      { status: 503 }
    );
  }

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const prompt = String(body.prompt ?? '').trim();
  const eventId = String(body.event_id ?? '').trim();
  const scope = body.scope === 'bg' ? 'bg' : 'gift';

  if (!prompt || prompt.length < 5) {
    return NextResponse.json({ error: 'Descreva o que você quer com mais detalhes.' }, { status: 400 });
  }
  if (prompt.length > 500) {
    return NextResponse.json({ error: 'Prompt muito longo (máx 500 caracteres).' }, { status: 400 });
  }
  if (!eventId) {
    return NextResponse.json({ error: 'event_id ausente.' }, { status: 400 });
  }

  // Auth + ownership do evento
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Faça login pra gerar imagens.' }, { status: 401 });
  }

  const { data: ev } = await supabase
    .from('events')
    .select('id, owner_id, plan_tier, ai_generations_used')
    .eq('id', eventId)
    .single();
  if (!ev || ev.owner_id !== user.id) {
    return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });
  }
  if (ev.plan_tier !== 'themed') {
    return NextResponse.json(
      { error: 'Geração por IA disponível só no plano Temático.' },
      { status: 403 }
    );
  }
  const usedSoFar = ev.ai_generations_used ?? 0;
  if (usedSoFar >= MAX_PER_EVENT) {
    return NextResponse.json(
      { error: `Limite de ${MAX_PER_EVENT} gerações por evento atingido.` },
      { status: 429 }
    );
  }

  // Sufixo de segurança/qualidade no prompt
  const fullPrompt = [
    'Gere uma imagem ilustrada para uma página de aniversário infantil:',
    prompt,
    '',
    'Estilo: ilustração colorida, alegre, infantil, sem texto sobreposto.',
    'Sem rostos humanos reconhecíveis. Sem personagens com copyright.',
    'Composição limpa que funciona como capa/fundo de site.'
  ].join('\n');

  // Chama o Gemini
  let geminiRes: Response;
  try {
    geminiRes = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: fullPrompt }]
          }
        ],
        generationConfig: {
          responseModalities: ['IMAGE', 'TEXT']
        }
      }),
      signal: AbortSignal.timeout(60_000)
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'falha ao chamar Gemini';
    return NextResponse.json({ error: `Erro de rede: ${msg}` }, { status: 502 });
  }

  if (!geminiRes.ok) {
    const txt = await geminiRes.text();
    // eslint-disable-next-line no-console
    console.error('[generate-image] gemini error', geminiRes.status, txt);
    if (geminiRes.status === 429) {
      return NextResponse.json(
        { error: 'API do Gemini atingiu limite. Tente em alguns minutos.' },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: `Falha na geração (${geminiRes.status}). Tente outro prompt.` },
      { status: 502 }
    );
  }

  // Extrai a imagem em base64 da resposta
  type GeminiPart = {
    text?: string;
    inlineData?: { mimeType?: string; mime_type?: string; data?: string };
    inline_data?: { mimeType?: string; mime_type?: string; data?: string };
  };
  type GeminiCandidate = { content?: { parts?: GeminiPart[] } };
  type GeminiResponse = { candidates?: GeminiCandidate[] };

  const json = (await geminiRes.json()) as GeminiResponse;
  const parts = json.candidates?.[0]?.content?.parts ?? [];
  let imageB64: string | null = null;
  let mimeType = 'image/png';
  for (const p of parts) {
    const inline = p.inlineData ?? p.inline_data;
    if (inline?.data) {
      imageB64 = inline.data;
      mimeType = inline.mimeType ?? inline.mime_type ?? 'image/png';
      break;
    }
  }
  if (!imageB64) {
    // eslint-disable-next-line no-console
    console.error('[generate-image] no inline image in response', JSON.stringify(json).slice(0, 500));
    return NextResponse.json(
      { error: 'Gemini não devolveu imagem. Reformule o prompt.' },
      { status: 502 }
    );
  }

  // Upload no bucket event-uploads (com service_role, dentro da pasta do user)
  const ext = mimeType.includes('jpeg') ? 'jpg' : mimeType.includes('webp') ? 'webp' : 'png';
  const buffer = Buffer.from(imageB64, 'base64');
  const id = crypto.randomUUID();
  const path = `${user.id}/${scope}/ai-${id}.${ext}`;

  const admin = createAdminClient();
  const { error: upErr } = await admin.storage
    .from('event-uploads')
    .upload(path, buffer, { contentType: mimeType, upsert: false });
  if (upErr) {
    return NextResponse.json({ error: `Falha no upload: ${upErr.message}` }, { status: 500 });
  }
  const { data: pub } = admin.storage.from('event-uploads').getPublicUrl(path);

  // Incrementa o contador (com service_role, atômico-ish)
  await admin
    .from('events')
    .update({ ai_generations_used: usedSoFar + 1 })
    .eq('id', eventId);

  return NextResponse.json({
    ok: true,
    image_url: pub.publicUrl,
    used: usedSoFar + 1,
    limit: MAX_PER_EVENT,
    remaining: MAX_PER_EVENT - (usedSoFar + 1)
  });
}
