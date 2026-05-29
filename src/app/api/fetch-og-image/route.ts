import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const IMG_EXT = /\.(png|jpe?g|webp|gif|avif|bmp|svg)(\?.*)?$/i;

function pickMeta(html: string, ...names: string[]): string | null {
  for (const name of names) {
    const re = new RegExp(
      `<meta[^>]+(?:property|name)=["']${name}["'][^>]*content=["']([^"']+)["']`,
      'i'
    );
    const m = html.match(re);
    if (m && m[1]) return m[1];
    const reRev = new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${name}["']`,
      'i'
    );
    const m2 = html.match(reRev);
    if (m2 && m2[1]) return m2[1];
  }
  return null;
}

/** Tenta extrair o preço em BRL a partir de meta tags e JSON-LD. */
function pickPrice(html: string): number | null {
  // 1. Meta tags padrão de e-commerce
  const fromMeta = pickMeta(html, 'og:price:amount', 'product:price:amount', 'twitter:data1');
  if (fromMeta) {
    const n = parseFloat(fromMeta.replace(/[^\d,.]/g, '').replace(',', '.'));
    if (!isNaN(n) && n > 0) return n;
  }

  // 2. JSON-LD: Product > offers > price
  const ldBlocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const m of ldBlocks) {
    try {
      const data: unknown = JSON.parse(m[1]);
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        if (!item || typeof item !== 'object') continue;
        const obj = item as Record<string, unknown>;
        if (obj['@type'] !== 'Product' || !obj.offers) continue;
        const offers = Array.isArray(obj.offers) ? obj.offers[0] : obj.offers;
        if (offers && typeof offers === 'object') {
          const price = (offers as Record<string, unknown>).price;
          const n = parseFloat(String(price ?? ''));
          if (!isNaN(n) && n > 0) return n;
        }
      }
    } catch { /* ignorar JSON inválido */ }
  }

  return null;
}

/** Extrai o título do produto limpando sufixos de loja. */
function pickTitle(html: string): string | null {
  const raw =
    pickMeta(html, 'og:title', 'twitter:title') ??
    html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ??
    null;
  if (!raw) return null;
  // Remove sufixos comuns: " | Mercado Livre", " - Amazon.com.br", etc.
  return raw.replace(/\s*[|–\-]\s*(Mercado Livre|Amazon\.com\.br|Americanas|Shopee|Magalu|Magazine Luiza)[^|–\-]*$/i, '').trim().slice(0, 200) || null;
}

function abs(url: string, base: string) {
  try {
    return new URL(url, base).toString();
  } catch {
    return url;
  }
}

export async function POST(req: Request) {
  let url: string;
  try {
    const body = await req.json();
    url = String(body?.url ?? '').trim();
  } catch {
    return NextResponse.json({ ok: false, error: 'JSON inválido' }, { status: 400 });
  }

  if (!url) {
    return NextResponse.json({ ok: false, error: 'URL vazia' }, { status: 400 });
  }

  try {
    const u = new URL(url);
    if (!/^https?:$/.test(u.protocol)) {
      return NextResponse.json({ ok: false, error: 'Protocolo não suportado' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ ok: false, error: 'URL inválida' }, { status: 400 });
  }

  // Se já é uma URL direta de imagem, retorna direto
  if (IMG_EXT.test(url)) {
    return NextResponse.json({ ok: true, image_url: url });
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8'
      },
      redirect: 'follow',
      // 8s de timeout
      signal: AbortSignal.timeout(8000)
    });

    const ctype = res.headers.get('content-type') ?? '';

    // Se a própria URL retornou imagem (content-type), aceita
    if (ctype.startsWith('image/')) {
      return NextResponse.json({ ok: true, image_url: res.url });
    }

    if (!ctype.includes('html')) {
      return NextResponse.json(
        { ok: false, error: 'Conteúdo não é HTML' },
        { status: 400 }
      );
    }

    const html = await res.text();

    const candidate =
      pickMeta(html, 'og:image:secure_url', 'og:image', 'twitter:image', 'twitter:image:src') ??
      // <link rel="image_src">
      (html.match(/<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i)?.[1] ?? null);

    if (!candidate) {
      return NextResponse.json(
        { ok: false, error: 'Imagem não encontrada na página' },
        { status: 404 }
      );
    }

    const price = pickPrice(html);
    const title = pickTitle(html);
    return NextResponse.json({
      ok: true,
      image_url: abs(candidate, res.url),
      ...(price !== null && { price }),
      ...(title && { title })
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao buscar';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
