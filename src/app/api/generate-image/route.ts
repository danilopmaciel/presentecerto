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

/**
 * Modelos com suporte a image-out via `generateContent` no Google AI Studio.
 * Tenta em ordem — cai no próximo se um der 404. Pode ser sobrescrito pela env
 * `GEMINI_IMAGE_MODEL` (vírgulas separam alternativas).
 *
 *  • gemini-2.5-flash-image          → "Nano Banana" — estável, mais barato (default)
 *  • gemini-3.1-flash-image-preview  → "Nano Banana 2" — preview, qualidade melhor
 *  • gemini-3-pro-image-preview      → "Nano Banana Pro" — preview, mais caro
 */
const DEFAULT_MODELS = [
  'gemini-2.5-flash-image',
  'gemini-3.1-flash-image-preview',
  'gemini-3-pro-image-preview'
];

function getModels(): string[] {
  const envModels = (process.env.GEMINI_IMAGE_MODEL ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return envModels.length > 0 ? envModels : DEFAULT_MODELS;
}

function endpointFor(model: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

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
    .select('id, owner_id, plan_tier, ai_generations_used, ai_generations_limit')
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
  const limit = ev.ai_generations_limit ?? MAX_PER_EVENT;
  const usedSoFar = ev.ai_generations_used ?? 0;
  if (usedSoFar >= limit) {
    return NextResponse.json(
      { error: `Limite de ${limit} gerações atingido. Você pode solicitar mais ao suporte.`, limit_reached: true },
      { status: 429 }
    );
  }

  // Estilo livre (realista OU ilustrado, conforme o prompt do anfitrião).
  // Mantemos só o mínimo: uso como capa/fundo + guarda-corpos legais.
  const fullPrompt = [
    prompt,
    '',
    'A imagem será a capa/fundo de uma página de evento: composição limpa e equilibrada, sem texto sobreposto.',
    'Não inclua personagens, marcas ou logotipos protegidos por copyright, nem rostos de pessoas reais reconhecíveis.'
  ].join('\n');

  // Chama o Gemini — tenta cada modelo em ordem; 404 num modelo pula pro próximo.
  const models = getModels();
  const requestBody = JSON.stringify({
    contents: [
      {
        parts: [{ text: fullPrompt }]
      }
    ],
    generationConfig: {
      responseModalities: ['IMAGE', 'TEXT']
    }
  });

  let geminiRes: Response | null = null;
  let modelUsed: string | null = null;
  const triedErrors: { model: string; status: number; msg: string }[] = [];

  for (const model of models) {
    try {
      const res = await fetch(`${endpointFor(model)}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: requestBody,
        signal: AbortSignal.timeout(60_000)
      });
      if (res.ok) {
        geminiRes = res;
        modelUsed = model;
        // eslint-disable-next-line no-console
        console.log('[generate-image] using model', model);
        break;
      }
      // 404 = modelo não existe nesse projeto/região → tenta o próximo
      // 400 com "modelo" na msg também → tenta o próximo
      const txt = await res.text();
      triedErrors.push({ model, status: res.status, msg: txt.slice(0, 300) });
      if (res.status === 404 || (res.status === 400 && /model/i.test(txt))) {
        // eslint-disable-next-line no-console
        console.warn(`[generate-image] model ${model} not available, trying next`);
        continue;
      }
      // Outros erros (429, 500, 401, 403) — não adianta tentar outros modelos
      // eslint-disable-next-line no-console
      console.error('[generate-image] gemini error', model, res.status, txt);

      // Tenta extrair a mensagem específica do JSON de erro do Google
      let detail = '';
      try {
        const errJson = JSON.parse(txt) as { error?: { message?: string; status?: string } };
        detail = errJson.error?.message ?? '';
      } catch {
        detail = txt.slice(0, 300);
      }

      if (res.status === 429) {
        // Distingue free-tier vs rate limit real
        const isFreeTier = /free.?tier|billing|quota.*exceeded|requires.*billing/i.test(detail);
        return NextResponse.json(
          {
            error: isFreeTier
              ? 'Geração de imagem do Gemini não é coberta pelo free tier. ' +
                'Ative o billing no projeto Google Cloud associado à sua chave de API. ' +
                'Custo estimado: ~US$ 0,03 por imagem.'
              : 'API do Gemini atingiu limite por minuto. Tente novamente em alguns segundos.',
            detail,
            help_url: isFreeTier
              ? 'https://aistudio.google.com/app/apikey'
              : undefined
          },
          { status: 429 }
        );
      }
      if (res.status === 401 || res.status === 403) {
        return NextResponse.json(
          {
            error:
              'Chave de API inválida ou sem permissão. Verifique se ela tem acesso ao Generative Language API.',
            detail
          },
          { status: res.status }
        );
      }
      return NextResponse.json(
        { error: `Falha na geração (${res.status}). ${detail || 'Tente outro prompt.'}` },
        { status: 502 }
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'falha ao chamar Gemini';
      triedErrors.push({ model, status: 0, msg });
    }
  }

  if (!geminiRes || !modelUsed) {
    // eslint-disable-next-line no-console
    console.error('[generate-image] all models failed', JSON.stringify(triedErrors));
    return NextResponse.json(
      {
        error:
          'Nenhum modelo de imagem disponível na sua chave Gemini. ' +
          'Confira no Google AI Studio quais modelos sua conta tem acesso e seta a env GEMINI_IMAGE_MODEL.',
        debug: triedErrors
      },
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
    limit,
    remaining: limit - (usedSoFar + 1)
  });
}
