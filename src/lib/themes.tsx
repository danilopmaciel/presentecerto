/**
 * Definição centralizada dos temas visuais do PresenteCerto.
 * Cada tema tem cores, padrão de fundo (SVG inline) e decorações opcionais.
 */
import React from 'react';

export type ThemeId =
  | 'default'
  | 'infantil-rosa'
  | 'infantil-azul'
  | 'aquatico'
  | 'safari'
  | 'principe';

export type Theme = {
  id: ThemeId;
  name: string;
  pageBg: string; // classe Tailwind do background base
  titleColor: string;
  accent: string; // cor de destaque (hex) usada nos SVGs
  // padrão SVG de tile pra fundo (string SVG inline)
  pattern?: string;
  // decoração extra (header art) renderizada acima do conteúdo
  Decoration?: React.FC;
};

// ----- Padrões SVG (tiled) ---------------------------------------------------

function svgDataUrl(svg: string) {
  // encodeURIComponent lida com caracteres especiais nas data URLs
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

const polkaDots = (color: string, size = 40) => svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <circle cx="8" cy="8" r="3" fill="${color}" opacity="0.5"/>
  <circle cx="${size - 10}" cy="${size - 10}" r="2.5" fill="${color}" opacity="0.4"/>
  <circle cx="${size / 2}" cy="${size / 2}" r="2" fill="${color}" opacity="0.3"/>
</svg>`);

const cloudDots = (color: string) => svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
  <ellipse cx="20" cy="20" rx="14" ry="6" fill="${color}" opacity="0.25"/>
  <ellipse cx="60" cy="55" rx="16" ry="7" fill="${color}" opacity="0.2"/>
</svg>`);

const waves = (color: string) => svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40" viewBox="0 0 120 40">
  <path d="M0 20 Q15 5 30 20 T60 20 T90 20 T120 20" stroke="${color}" stroke-width="2" fill="none" opacity="0.4"/>
  <path d="M0 32 Q15 17 30 32 T60 32 T90 32 T120 32" stroke="${color}" stroke-width="2" fill="none" opacity="0.25"/>
</svg>`);

const leaves = (color: string) => svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" width="70" height="70" viewBox="0 0 70 70">
  <ellipse cx="20" cy="20" rx="6" ry="14" fill="${color}" opacity="0.3" transform="rotate(35 20 20)"/>
  <ellipse cx="50" cy="48" rx="6" ry="14" fill="${color}" opacity="0.25" transform="rotate(-25 50 48)"/>
</svg>`);

const stars = (color: string) => svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
  <path d="M30 8 L33 22 L48 22 L36 30 L40 44 L30 35 L20 44 L24 30 L12 22 L27 22 Z" fill="${color}" opacity="0.35"/>
  <circle cx="10" cy="50" r="1.5" fill="${color}" opacity="0.5"/>
  <circle cx="50" cy="10" r="1.5" fill="${color}" opacity="0.5"/>
</svg>`);

// ----- Decorações (cabeçalhos com SVG) ---------------------------------------

const BalloonsDeco: React.FC = () => (
  <svg
    aria-hidden
    className="pointer-events-none absolute right-2 top-2 h-24 w-24 opacity-80 sm:h-32 sm:w-32"
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
  >
    <ellipse cx="30" cy="30" rx="14" ry="18" fill="#fb7185" />
    <ellipse cx="65" cy="40" rx="13" ry="16" fill="#f472b6" />
    <ellipse cx="50" cy="22" rx="11" ry="14" fill="#fda4af" />
    <path d="M30 48 Q32 60 28 75" stroke="#9ca3af" strokeWidth="1" fill="none" />
    <path d="M65 56 Q67 68 70 80" stroke="#9ca3af" strokeWidth="1" fill="none" />
    <path d="M50 36 Q52 50 48 70" stroke="#9ca3af" strokeWidth="1" fill="none" />
  </svg>
);

const BalloonsBlueDeco: React.FC = () => (
  <svg
    aria-hidden
    className="pointer-events-none absolute right-2 top-2 h-24 w-24 opacity-80 sm:h-32 sm:w-32"
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
  >
    <ellipse cx="30" cy="30" rx="14" ry="18" fill="#60a5fa" />
    <ellipse cx="65" cy="40" rx="13" ry="16" fill="#38bdf8" />
    <ellipse cx="50" cy="22" rx="11" ry="14" fill="#93c5fd" />
    <path d="M30 48 Q32 60 28 75" stroke="#9ca3af" strokeWidth="1" fill="none" />
    <path d="M65 56 Q67 68 70 80" stroke="#9ca3af" strokeWidth="1" fill="none" />
    <path d="M50 36 Q52 50 48 70" stroke="#9ca3af" strokeWidth="1" fill="none" />
  </svg>
);

const BubblesDeco: React.FC = () => (
  <svg
    aria-hidden
    className="pointer-events-none absolute left-2 top-2 h-20 w-20 opacity-70 sm:h-28 sm:w-28"
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="20" cy="80" r="10" fill="#5eead4" opacity="0.7" />
    <circle cx="40" cy="60" r="6" fill="#67e8f9" opacity="0.7" />
    <circle cx="55" cy="80" r="8" fill="#22d3ee" opacity="0.7" />
    <circle cx="75" cy="55" r="5" fill="#5eead4" opacity="0.7" />
    <circle cx="85" cy="78" r="7" fill="#67e8f9" opacity="0.7" />
  </svg>
);

const PalmDeco: React.FC = () => (
  <svg
    aria-hidden
    className="pointer-events-none absolute right-2 top-2 h-28 w-28 opacity-80 sm:h-36 sm:w-36"
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M50 90 Q48 60 52 30" stroke="#92400e" strokeWidth="3" fill="none" />
    <path d="M52 30 Q30 25 18 35" stroke="#15803d" strokeWidth="3" fill="none" />
    <path d="M52 30 Q72 22 88 30" stroke="#15803d" strokeWidth="3" fill="none" />
    <path d="M52 30 Q40 12 25 14" stroke="#16a34a" strokeWidth="3" fill="none" />
    <path d="M52 30 Q66 12 82 12" stroke="#16a34a" strokeWidth="3" fill="none" />
    <path d="M52 30 Q52 16 50 6" stroke="#15803d" strokeWidth="3" fill="none" />
  </svg>
);

const CrownDeco: React.FC = () => (
  <svg
    aria-hidden
    className="pointer-events-none absolute right-2 top-2 h-24 w-24 opacity-80 sm:h-32 sm:w-32"
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M20 60 L30 30 L40 50 L50 25 L60 50 L70 30 L80 60 Z"
      fill="#fbbf24"
      stroke="#d97706"
      strokeWidth="2"
    />
    <rect x="20" y="60" width="60" height="10" fill="#fbbf24" stroke="#d97706" strokeWidth="2" />
    <circle cx="30" cy="30" r="3" fill="#dc2626" />
    <circle cx="50" cy="25" r="3" fill="#2563eb" />
    <circle cx="70" cy="30" r="3" fill="#16a34a" />
  </svg>
);

// ----- Definição dos temas ---------------------------------------------------

export const THEMES: Theme[] = [
  {
    id: 'default',
    name: 'Padrão',
    pageBg: 'bg-brand-50',
    titleColor: 'text-brand-900',
    accent: '#ff6b1a'
  },
  {
    id: 'infantil-rosa',
    name: 'Infantil Rosa',
    pageBg: 'bg-pink-50',
    titleColor: 'text-pink-900',
    accent: '#ec4899',
    pattern: polkaDots('%23ec4899'),
    Decoration: BalloonsDeco
  },
  {
    id: 'infantil-azul',
    name: 'Infantil Azul',
    pageBg: 'bg-sky-50',
    titleColor: 'text-sky-900',
    accent: '#0284c7',
    pattern: cloudDots('%230284c7'),
    Decoration: BalloonsBlueDeco
  },
  {
    id: 'aquatico',
    name: 'Aquático',
    pageBg: 'bg-teal-50',
    titleColor: 'text-teal-900',
    accent: '#0d9488',
    pattern: waves('%230d9488'),
    Decoration: BubblesDeco
  },
  {
    id: 'safari',
    name: 'Safari',
    pageBg: 'bg-amber-50',
    titleColor: 'text-amber-900',
    accent: '#15803d',
    pattern: leaves('%2315803d'),
    Decoration: PalmDeco
  },
  {
    id: 'principe',
    name: 'Príncipe / Princesa',
    pageBg: 'bg-yellow-50',
    titleColor: 'text-yellow-900',
    accent: '#d97706',
    pattern: stars('%23d97706'),
    Decoration: CrownDeco
  }
];

export function getTheme(id?: string | null): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
