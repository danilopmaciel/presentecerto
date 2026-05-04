/**
 * Extração de paleta dominante de uma imagem usando Canvas.
 * Sem dependência externa.
 */

export type Palette = {
  accent: string; // hex — cor vibrante destaque
  bg: string; // hex — cor de fundo suave (geralmente claro)
  text: string; // hex — cor do título legível sobre bg (preto ou branco)
};

function rgbToHex(r: number, g: number, b: number): string {
  const h = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return [h, s, l];
}

function luminance(r: number, g: number, b: number): number {
  // Relativa (WCAG)
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

/** Carrega imagem (URL ou objectURL) para um HTMLImageElement. */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

/**
 * Extrai paleta dominante. Estratégia:
 * 1. Reduz imagem pra 64x64 num canvas
 * 2. Quantiza cada pixel agrupando por bins de 32
 * 3. Conta histograma
 * 4. Escolhe accent = cor mais frequente excluindo near-white/near-black/baixa saturação
 * 5. bg = cor mais frequente clara (luminância > 0.7), ou white
 * 6. text = preto ou branco baseado no contraste contra bg
 */
export async function extractPalette(src: string): Promise<Palette> {
  const img = await loadImage(src);
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas-2d-unavailable');
  ctx.drawImage(img, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);

  const counts = new Map<string, { r: number; g: number; b: number; n: number }>();
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 128) continue;
    const r = Math.round(data[i] / 32) * 32;
    const g = Math.round(data[i + 1] / 32) * 32;
    const b = Math.round(data[i + 2] / 32) * 32;
    const key = `${r},${g},${b}`;
    const cur = counts.get(key);
    if (cur) cur.n++;
    else counts.set(key, { r, g, b, n: 1 });
  }

  const sorted = Array.from(counts.values()).sort((a, b) => b.n - a.n);

  // Accent: primeira cor com saturação > 0.35 e luminância 0.2..0.75
  let accent = sorted[0];
  for (const c of sorted) {
    const [, s, l] = rgbToHsl(c.r, c.g, c.b);
    if (s > 0.35 && l > 0.2 && l < 0.75) {
      accent = c;
      break;
    }
  }

  // Background: cor clara dominante (luminância > 0.78) ou primeira muito leve
  let bg = sorted.find((c) => luminance(c.r, c.g, c.b) > 0.78) ?? null;
  if (!bg) {
    // Sem cor clara dominante — pega a accent e clareia
    const lighten = (v: number) => Math.round(v + (255 - v) * 0.85);
    bg = {
      r: lighten(accent.r),
      g: lighten(accent.g),
      b: lighten(accent.b),
      n: 0
    };
  }

  // Text: preto ou branco baseado no contraste contra bg
  const lumBg = luminance(bg.r, bg.g, bg.b);
  const textHex = lumBg > 0.6 ? '#111827' : '#ffffff';

  return {
    accent: rgbToHex(accent.r, accent.g, accent.b),
    bg: rgbToHex(bg.r, bg.g, bg.b),
    text: textHex
  };
}

/** Versão clara da cor (mistura com branco). */
export function lightenHex(hex: string, ratio = 0.85): string {
  const m = hex.match(/^#?([0-9a-f]{6})$/i);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  const lerp = (v: number) => Math.round(v + (255 - v) * ratio);
  const h = (v: number) => v.toString(16).padStart(2, '0');
  return `#${h(lerp(r))}${h(lerp(g))}${h(lerp(b))}`;
}
