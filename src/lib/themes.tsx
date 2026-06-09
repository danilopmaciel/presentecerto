/**
 * Definição centralizada dos temas visuais do Presente no Pix.
 *
 * IMPORTANTE: todas as artes são originais e "inspiradas em" universos
 * populares (princesas, super-heróis, espaço, etc.) sem reproduzir
 * personagens, marcas ou logos protegidos por copyright.
 */
import React from 'react';

export type ThemeId =
  | 'default'
  | 'infantil-rosa'
  | 'infantil-azul'
  | 'reino-encantado'
  | 'reino-gelado'
  | 'super-heroi'
  | 'espaco'
  | 'safari'
  | 'reino-do-mar'
  | 'carros-pista'
  | 'dinos'
  | 'unicornio'
  | 'piratas';

export type Theme = {
  id: ThemeId;
  name: string;
  pageBg: string;
  titleColor: string;
  accent: string;
  cardClass?: string;
  pattern?: string;
  HeroArt?: React.FC;
  Decoration?: React.FC;
};

// ----- Helpers --------------------------------------------------------------

function svgDataUrl(svg: string) {
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

// ----- Padrões SVG (tiled) --------------------------------------------------

const dotsPattern = (c1: string, c2: string) => svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <circle cx="10" cy="10" r="3.5" fill="${c1}" opacity="0.55"/>
  <circle cx="36" cy="36" r="3" fill="${c2}" opacity="0.55"/>
  <circle cx="24" cy="24" r="2" fill="${c1}" opacity="0.35"/>
</svg>`);

const cloudsPattern = (c1: string, c2: string) => svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="80" viewBox="0 0 100 80">
  <ellipse cx="24" cy="22" rx="18" ry="7" fill="${c1}" opacity="0.4"/>
  <ellipse cx="24" cy="18" rx="12" ry="5" fill="${c1}" opacity="0.4"/>
  <ellipse cx="78" cy="58" rx="20" ry="8" fill="${c2}" opacity="0.3"/>
</svg>`);

const heartsStarsPattern = (c1: string, c2: string) => svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" width="70" height="70" viewBox="0 0 70 70">
  <path d="M14 20 c-3 -6 -10 -3 -10 3 c0 6 10 12 10 12 s10 -6 10 -12 c0 -6 -7 -9 -10 -3z" fill="${c1}" opacity="0.45"/>
  <path d="M52 50 l2 6 l6 0 l-5 4 l2 6 l-5 -4 l-5 4 l2 -6 l-5 -4 l6 0 z" fill="${c2}" opacity="0.55"/>
</svg>`);

const snowflakesPattern = (c1: string, c2: string) => svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
  <g stroke="${c1}" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.55">
    <path d="M20 8 L20 32 M8 20 L32 20 M11 11 L29 29 M29 11 L11 29"/>
  </g>
  <g stroke="${c2}" stroke-width="1.2" stroke-linecap="round" fill="none" opacity="0.45">
    <path d="M58 50 L58 70 M48 60 L68 60 M51 53 L65 67 M65 53 L51 67"/>
  </g>
  <circle cx="40" cy="40" r="1.5" fill="${c1}" opacity="0.7"/>
</svg>`);

const comicPattern = (c1: string, c2: string) => svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
  <path d="M16 8 L19 18 L29 18 L21 24 L24 34 L16 28 L8 34 L11 24 L3 18 L13 18 z" fill="${c1}" opacity="0.45"/>
  <path d="M58 56 l3 -10 l-6 0 l4 -8 l8 4 l-2 6 l8 -2 l-4 8 l-6 -2 l-2 8 z" fill="${c2}" opacity="0.5"/>
</svg>`);

const galaxyPattern = (c1: string, c2: string) => svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" width="90" height="90" viewBox="0 0 90 90">
  <circle cx="12" cy="12" r="1" fill="${c1}" opacity="0.9"/>
  <circle cx="32" cy="44" r="0.8" fill="${c1}" opacity="0.7"/>
  <circle cx="68" cy="20" r="1.3" fill="${c2}" opacity="0.9"/>
  <circle cx="78" cy="58" r="1" fill="${c1}" opacity="0.85"/>
  <circle cx="20" cy="76" r="1.1" fill="${c2}" opacity="0.85"/>
  <path d="M50 10 l1 3 l3 0 l-2.5 2 l1 3 l-2.5 -2 l-2.5 2 l1 -3 l-2.5 -2 l3 0 z" fill="${c2}" opacity="0.6"/>
</svg>`);

const wavesPattern = (c1: string, c2: string) => svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" width="160" height="60" viewBox="0 0 160 60">
  <path d="M0 20 Q20 4 40 20 T80 20 T120 20 T160 20" stroke="${c1}" stroke-width="2.5" fill="none" opacity="0.55"/>
  <path d="M0 40 Q20 24 40 40 T80 40 T120 40 T160 40" stroke="${c2}" stroke-width="2" fill="none" opacity="0.4"/>
</svg>`);

const checkeredPattern = (c1: string) => svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
  <rect x="0" y="0" width="10" height="10" fill="${c1}" opacity="0.25"/>
  <rect x="20" y="0" width="10" height="10" fill="${c1}" opacity="0.25"/>
  <rect x="40" y="0" width="10" height="10" fill="${c1}" opacity="0.25"/>
  <rect x="10" y="10" width="10" height="10" fill="${c1}" opacity="0.25"/>
  <rect x="30" y="10" width="10" height="10" fill="${c1}" opacity="0.25"/>
  <rect x="50" y="10" width="10" height="10" fill="${c1}" opacity="0.25"/>
</svg>`);

const leavesPattern = (c1: string, c2: string) => svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" width="90" height="90" viewBox="0 0 90 90">
  <ellipse cx="20" cy="25" rx="7" ry="16" fill="${c1}" opacity="0.45" transform="rotate(35 20 25)"/>
  <ellipse cx="60" cy="55" rx="7" ry="16" fill="${c2}" opacity="0.4" transform="rotate(-25 60 55)"/>
</svg>`);

const rainbowPattern = (c1: string, c2: string) => svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
  <path d="M14 20 c-3 -6 -10 -3 -10 3 c0 6 10 12 10 12 s10 -6 10 -12 c0 -6 -7 -9 -10 -3z" fill="${c1}" opacity="0.5"/>
  <g transform="translate(45 45)">
    <path d="M-10 8 a10 10 0 0 1 20 0" stroke="${c2}" stroke-width="2" fill="none" opacity="0.7"/>
    <path d="M-7 8 a7 7 0 0 1 14 0" stroke="${c1}" stroke-width="2" fill="none" opacity="0.7"/>
    <path d="M-4 8 a4 4 0 0 1 8 0" stroke="${c2}" stroke-width="2" fill="none" opacity="0.7"/>
  </g>
</svg>`);

const compassPattern = (c1: string, c2: string) => svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
  <g transform="translate(20 20)">
    <circle cx="0" cy="0" r="10" stroke="${c1}" stroke-width="1.5" fill="none" opacity="0.5"/>
    <path d="M0 -8 L2 0 L0 8 L-2 0 Z" fill="${c1}" opacity="0.6"/>
    <path d="M-8 0 L0 2 L8 0 L0 -2 Z" fill="${c2}" opacity="0.5"/>
  </g>
  <path d="M58 60 l2 4 l4 0 l-3 2 l1 4 l-4 -2 l-4 2 l1 -4 l-3 -2 l4 0 z" fill="${c2}" opacity="0.5"/>
</svg>`);

// ============================================================================
// HERO ARTS (banners grandes no topo da página pública)
// ============================================================================

const BalloonsRosa: React.FC = () => (
  <svg aria-hidden className="pointer-events-none mx-auto mb-2 h-32 w-full sm:h-40" viewBox="0 0 400 160" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="bRosa1" cx="50%" cy="35%"><stop offset="0%" stopColor="#ffe4ec"/><stop offset="100%" stopColor="#ec4899"/></radialGradient>
      <radialGradient id="bRosa2" cx="50%" cy="35%"><stop offset="0%" stopColor="#fff1f5"/><stop offset="100%" stopColor="#f472b6"/></radialGradient>
    </defs>
    <ellipse cx="60" cy="50" rx="26" ry="34" fill="url(#bRosa1)"/>
    <ellipse cx="150" cy="40" rx="28" ry="36" fill="url(#bRosa2)"/>
    <ellipse cx="250" cy="55" rx="24" ry="32" fill="url(#bRosa1)"/>
    <ellipse cx="340" cy="42" rx="26" ry="34" fill="url(#bRosa2)"/>
    <path d="M60 84 Q62 110 55 140 M150 76 Q152 106 160 150 M250 87 Q248 115 242 150 M340 76 Q342 110 336 148" stroke="#9ca3af" strokeWidth="1.2" fill="none"/>
    <rect x="20" y="130" width="4" height="9" fill="#ec4899" transform="rotate(20 22 134)"/>
    <rect x="110" y="130" width="4" height="9" fill="#fbbf24" transform="rotate(-15 112 134)"/>
    <rect x="200" y="134" width="4" height="9" fill="#60a5fa" transform="rotate(30 202 138)"/>
    <rect x="290" y="132" width="4" height="9" fill="#34d399" transform="rotate(-25 292 136)"/>
  </svg>
);

const BalloonsAzul: React.FC = () => (
  <svg aria-hidden className="pointer-events-none mx-auto mb-2 h-32 w-full sm:h-40" viewBox="0 0 400 160" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="bAzul1" cx="50%" cy="35%"><stop offset="0%" stopColor="#e0f2fe"/><stop offset="100%" stopColor="#0284c7"/></radialGradient>
      <radialGradient id="bAzul2" cx="50%" cy="35%"><stop offset="0%" stopColor="#dbeafe"/><stop offset="100%" stopColor="#3b82f6"/></radialGradient>
    </defs>
    <ellipse cx="340" cy="80" rx="55" ry="22" fill="#dbeafe" opacity="0.6"/>
    <ellipse cx="60" cy="90" rx="42" ry="18" fill="#e0f2fe" opacity="0.7"/>
    <ellipse cx="70" cy="45" rx="24" ry="30" fill="url(#bAzul1)"/>
    <ellipse cx="160" cy="35" rx="26" ry="32" fill="url(#bAzul2)"/>
    <ellipse cx="250" cy="50" rx="22" ry="28" fill="url(#bAzul1)"/>
    <ellipse cx="340" cy="40" rx="24" ry="30" fill="url(#bAzul2)"/>
    <path d="M70 78 Q72 108 66 140 M160 70 Q162 100 170 145 M250 80 Q248 110 244 148 M340 73 Q342 105 336 145" stroke="#9ca3af" strokeWidth="1.2" fill="none"/>
  </svg>
);

const ReinoEncantadoHero: React.FC = () => (
  <svg aria-hidden className="pointer-events-none mx-auto mb-2 h-36 w-full sm:h-44" viewBox="0 0 400 180" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="skyEnc" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fce7f3"/><stop offset="100%" stopColor="#fbcfe8"/></linearGradient>
      <linearGradient id="castleEnc" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fef3c7"/><stop offset="100%" stopColor="#f59e0b"/></linearGradient>
      <linearGradient id="roofEnc" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f9a8d4"/><stop offset="100%" stopColor="#db2777"/></linearGradient>
    </defs>
    <rect width="400" height="180" fill="url(#skyEnc)"/>
    {/* sol/lua brilhante */}
    <circle cx="80" cy="40" r="20" fill="#fef3c7" opacity="0.7"/>
    <circle cx="80" cy="40" r="13" fill="#fde68a"/>
    {/* castelo */}
    <g>
      {/* base */}
      <rect x="160" y="100" width="80" height="60" fill="url(#castleEnc)"/>
      {/* portão */}
      <path d="M188 160 L188 130 Q200 116 212 130 L212 160 Z" fill="#7c2d12"/>
      <circle cx="200" cy="142" r="1.5" fill="#fbbf24"/>
      {/* janelas */}
      <rect x="170" y="118" width="8" height="12" fill="#7c2d12" rx="3"/>
      <rect x="222" y="118" width="8" height="12" fill="#7c2d12" rx="3"/>
      {/* torre central */}
      <rect x="190" y="60" width="20" height="50" fill="url(#castleEnc)"/>
      <polygon points="186,60 200,30 214,60" fill="url(#roofEnc)"/>
      <line x1="200" y1="30" x2="200" y2="20" stroke="#831843" strokeWidth="1.5"/>
      <path d="M200 20 L210 22 L208 26 L200 24 Z" fill="#ec4899"/>
      <rect x="196" y="80" width="8" height="12" fill="#831843" rx="2"/>
      {/* torre esquerda */}
      <rect x="148" y="80" width="18" height="30" fill="url(#castleEnc)"/>
      <polygon points="144,80 157,55 170,80" fill="url(#roofEnc)"/>
      {/* torre direita */}
      <rect x="234" y="80" width="18" height="30" fill="url(#castleEnc)"/>
      <polygon points="230,80 243,55 256,80" fill="url(#roofEnc)"/>
    </g>
    {/* estrelas brilhantes */}
    <g fill="#fbbf24">
      <path d="M50 100 l1.5 4 l4 0 l-3 2 l1 4 l-3.5 -2 l-3 2 l1 -4 l-3 -2 l4 0 z" opacity="0.85"/>
      <path d="M340 60 l2 5 l5 0 l-4 3 l1 5 l-4 -3 l-4 3 l1 -5 l-4 -3 l5 0 z" opacity="0.85"/>
      <path d="M360 130 l1.5 4 l4 0 l-3 2 l1 4 l-3.5 -2 l-3 2 l1 -4 l-3 -2 l4 0 z" opacity="0.85"/>
      <path d="M30 150 l1.5 4 l4 0 l-3 2 l1 4 l-3.5 -2 l-3 2 l1 -4 l-3 -2 l4 0 z" opacity="0.85"/>
    </g>
    {/* coraçõezinhos */}
    <path d="M120 50 c-2 -4 -7 -2 -7 2 c0 4 7 8 7 8 s7 -4 7 -8 c0 -4 -5 -6 -7 -2z" fill="#f472b6" opacity="0.85"/>
    <path d="M290 35 c-2 -4 -7 -2 -7 2 c0 4 7 8 7 8 s7 -4 7 -8 c0 -4 -5 -6 -7 -2z" fill="#ec4899" opacity="0.85"/>
  </svg>
);

const ReinoGeladoHero: React.FC = () => (
  <svg aria-hidden className="pointer-events-none mx-auto mb-2 h-36 w-full sm:h-44" viewBox="0 0 400 180" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="auroraGel" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#a5f3fc"/>
        <stop offset="50%" stopColor="#bfdbfe"/>
        <stop offset="100%" stopColor="#ddd6fe"/>
      </linearGradient>
      <linearGradient id="mtnGel" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e0f2fe"/><stop offset="100%" stopColor="#7dd3fc"/></linearGradient>
    </defs>
    <rect width="400" height="180" fill="url(#auroraGel)"/>
    {/* aurora — bandas onduladas */}
    <path d="M0 50 Q100 20 200 50 T400 50 L400 30 Q300 10 200 35 T0 30 Z" fill="#a78bfa" opacity="0.35"/>
    <path d="M0 70 Q100 50 200 70 T400 70 L400 55 Q300 35 200 60 T0 55 Z" fill="#22d3ee" opacity="0.35"/>
    {/* montanhas */}
    <polygon points="0,180 80,80 140,140 200,60 260,130 340,90 400,180" fill="url(#mtnGel)"/>
    <polygon points="0,180 80,80 95,100 140,140 0,180" fill="#bae6fd" opacity="0.7"/>
    <polygon points="200,60 220,80 260,130 200,60" fill="#bae6fd" opacity="0.7"/>
    {/* topos nevados */}
    <polygon points="80,80 90,90 70,90" fill="#f0f9ff"/>
    <polygon points="200,60 215,75 185,75" fill="#f0f9ff"/>
    <polygon points="340,90 350,100 330,100" fill="#f0f9ff"/>
    {/* floco grande central com gradient */}
    <g transform="translate(330 50)" opacity="0.9">
      <g stroke="#0e7490" strokeWidth="2" strokeLinecap="round" fill="none">
        <line x1="0" y1="-22" x2="0" y2="22"/>
        <line x1="-22" y1="0" x2="22" y2="0"/>
        <line x1="-15" y1="-15" x2="15" y2="15"/>
        <line x1="15" y1="-15" x2="-15" y2="15"/>
        <path d="M0 -22 L-3 -16 M0 -22 L3 -16 M0 22 L-3 16 M0 22 L3 16"/>
        <path d="M22 0 L16 -3 M22 0 L16 3 M-22 0 L-16 -3 M-22 0 L-16 3"/>
      </g>
      <circle cx="0" cy="0" r="3" fill="#0e7490"/>
    </g>
    {/* flocos pequenos */}
    <g fill="#0e7490" opacity="0.7">
      <circle cx="60" cy="40" r="2"/>
      <circle cx="120" cy="25" r="1.5"/>
      <circle cx="250" cy="20" r="2"/>
      <circle cx="180" cy="100" r="1.5"/>
      <circle cx="50" cy="120" r="2"/>
    </g>
    {/* cristais */}
    <polygon points="50,160 60,140 70,160 60,170" fill="#67e8f9" opacity="0.85"/>
    <polygon points="280,165 286,148 292,165 286,172" fill="#a5f3fc" opacity="0.85"/>
  </svg>
);

const SuperHeroiHero: React.FC = () => (
  <svg aria-hidden className="pointer-events-none mx-auto mb-2 h-36 w-full sm:h-44" viewBox="0 0 400 180" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="skyHero" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1e3a8a"/><stop offset="100%" stopColor="#3b82f6"/></linearGradient>
      <radialGradient id="boomHero" cx="50%" cy="50%"><stop offset="0%" stopColor="#fbbf24"/><stop offset="100%" stopColor="#dc2626"/></radialGradient>
    </defs>
    <rect width="400" height="180" fill="url(#skyHero)"/>
    {/* skyline */}
    <g fill="#1e293b">
      <rect x="0" y="100" width="40" height="80"/>
      <rect x="40" y="80" width="50" height="100"/>
      <rect x="90" y="110" width="35" height="70"/>
      <rect x="125" y="70" width="60" height="110"/>
      <rect x="185" y="95" width="45" height="85"/>
      <rect x="230" y="115" width="40" height="65"/>
      <rect x="270" y="75" width="55" height="105"/>
      <rect x="325" y="100" width="40" height="80"/>
      <rect x="365" y="85" width="35" height="95"/>
    </g>
    {/* janelas iluminadas */}
    <g fill="#fde68a" opacity="0.85">
      <rect x="50" y="92" width="6" height="6"/><rect x="62" y="92" width="6" height="6"/><rect x="74" y="92" width="6" height="6"/>
      <rect x="50" y="105" width="6" height="6"/><rect x="74" y="105" width="6" height="6"/>
      <rect x="135" y="82" width="6" height="6"/><rect x="151" y="82" width="6" height="6"/><rect x="167" y="82" width="6" height="6"/>
      <rect x="135" y="100" width="6" height="6"/><rect x="167" y="100" width="6" height="6"/>
      <rect x="280" y="88" width="6" height="6"/><rect x="296" y="88" width="6" height="6"/><rect x="312" y="88" width="6" height="6"/>
    </g>
    {/* boom! estrela explosão */}
    <g transform="translate(290 50)">
      <path d="M-40 -15 L-25 -10 L-30 -25 L-15 -18 L-12 -35 L0 -22 L12 -35 L15 -18 L30 -25 L25 -10 L40 -15 L25 -3 L40 8 L20 5 L25 22 L10 12 L0 28 L-10 12 L-25 22 L-20 5 L-40 8 L-25 -3 Z" fill="url(#boomHero)" stroke="#7f1d1d" strokeWidth="2"/>
      <text x="0" y="2" textAnchor="middle" fontFamily="Impact, sans-serif" fontSize="20" fontWeight="900" fill="#fff" stroke="#7f1d1d" strokeWidth="1">POW!</text>
    </g>
    {/* raio */}
    <path d="M70 30 L80 65 L65 65 L78 110 L60 70 L74 70 L65 30 Z" fill="#fde047" stroke="#a16207" strokeWidth="1.5"/>
    {/* estrelas brilho */}
    <g fill="#fde68a">
      <path d="M170 35 l1 3 l3 0 l-2.5 2 l1 3 l-2.5 -2 l-2.5 2 l1 -3 l-2.5 -2 l3 0 z"/>
      <path d="M360 50 l1.5 4 l4 0 l-3 2 l1 4 l-3.5 -2 l-3 2 l1 -4 l-3 -2 l4 0 z"/>
    </g>
  </svg>
);

const EspacoHero: React.FC = () => (
  <svg aria-hidden className="pointer-events-none mx-auto mb-2 h-36 w-full sm:h-44" viewBox="0 0 400 180" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="cosmoEsp" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1e1b4b"/>
        <stop offset="50%" stopColor="#4c1d95"/>
        <stop offset="100%" stopColor="#831843"/>
      </linearGradient>
      <linearGradient id="rocketEsp" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f1f5f9"/><stop offset="100%" stopColor="#94a3b8"/></linearGradient>
      <radialGradient id="planetEsp" cx="40%" cy="40%"><stop offset="0%" stopColor="#fef08a"/><stop offset="100%" stopColor="#ea580c"/></radialGradient>
    </defs>
    <rect width="400" height="180" fill="url(#cosmoEsp)"/>
    {/* estrelas */}
    <g fill="#fff">
      <circle cx="20" cy="20" r="1.2"/><circle cx="60" cy="55" r="0.8"/><circle cx="120" cy="30" r="1"/>
      <circle cx="200" cy="20" r="1.4"/><circle cx="280" cy="60" r="0.9"/><circle cx="350" cy="25" r="1.2"/>
      <circle cx="380" cy="100" r="1"/><circle cx="50" cy="130" r="0.8"/><circle cx="160" cy="160" r="1.1"/>
      <circle cx="320" cy="150" r="0.9"/>
    </g>
    {/* estrelas grandes */}
    <g fill="#fde68a" opacity="0.85">
      <path d="M90 80 l1.5 4 l4 0 l-3 2 l1 4 l-3.5 -2 l-3 2 l1 -4 l-3 -2 l4 0 z"/>
      <path d="M340 110 l1.5 4 l4 0 l-3 2 l1 4 l-3.5 -2 l-3 2 l1 -4 l-3 -2 l4 0 z"/>
    </g>
    {/* lua crescente */}
    <g transform="translate(60 55)">
      <circle cx="0" cy="0" r="20" fill="#e2e8f0"/>
      <circle cx="6" cy="-3" r="20" fill="#1e1b4b"/>
    </g>
    {/* planeta saturno */}
    <g transform="translate(330 55)">
      <ellipse cx="0" cy="0" rx="38" ry="6" fill="none" stroke="#fbbf24" strokeWidth="2" opacity="0.85"/>
      <circle cx="0" cy="0" r="22" fill="url(#planetEsp)"/>
      <ellipse cx="0" cy="0" rx="38" ry="6" fill="none" stroke="#a16207" strokeWidth="1" opacity="0.6" transform="rotate(-15)"/>
    </g>
    {/* foguete */}
    <g transform="translate(180 100) rotate(-20)">
      {/* corpo */}
      <ellipse cx="0" cy="0" rx="14" ry="36" fill="url(#rocketEsp)"/>
      {/* ponta */}
      <path d="M-14 -25 Q0 -55 14 -25 Z" fill="#dc2626"/>
      {/* janela */}
      <circle cx="0" cy="-8" r="6" fill="#0ea5e9" stroke="#0c4a6e" strokeWidth="1.5"/>
      {/* aletas */}
      <path d="M-14 20 L-26 36 L-14 36 Z" fill="#dc2626"/>
      <path d="M14 20 L26 36 L14 36 Z" fill="#dc2626"/>
      <path d="M-4 30 L-4 40 L4 40 L4 30 Z" fill="#7c2d12"/>
      {/* fogo */}
      <path d="M-8 36 Q-4 56 0 40 Q4 56 8 36 Z" fill="#fb923c"/>
      <path d="M-5 38 Q-2 50 0 42 Q2 50 5 38 Z" fill="#fde047"/>
    </g>
    {/* trilha */}
    <g opacity="0.6">
      <circle cx="220" cy="135" r="2" fill="#fb923c"/>
      <circle cx="240" cy="148" r="1.5" fill="#fde047"/>
      <circle cx="258" cy="158" r="1" fill="#f97316"/>
    </g>
  </svg>
);

const SafariHero: React.FC = () => (
  <svg aria-hidden className="pointer-events-none mx-auto mb-2 h-36 w-full sm:h-44" viewBox="0 0 400 180" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="skySaf" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fde68a"/><stop offset="100%" stopColor="#fb923c"/></linearGradient>
      <linearGradient id="grSaf" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fcd34d"/><stop offset="100%" stopColor="#a16207"/></linearGradient>
    </defs>
    <rect width="400" height="120" fill="url(#skySaf)"/>
    <rect y="120" width="400" height="60" fill="url(#grSaf)"/>
    {/* sol gigante */}
    <circle cx="200" cy="70" r="38" fill="#fef3c7" opacity="0.5"/>
    <circle cx="200" cy="70" r="28" fill="#fbbf24"/>
    {/* árvore acácia (silhueta) */}
    <g fill="#7c2d12">
      <path d="M70 180 L70 130 Q70 125 76 125 L78 180 Z"/>
      <path d="M50 130 Q40 120 35 100 Q60 105 70 120 Q80 105 105 100 Q100 120 90 130 Z" fill="#15803d" opacity="0.9"/>
    </g>
    {/* leão silhueta — corpo + juba estilizada */}
    <g transform="translate(255 130)" fill="#a16207">
      {/* corpo */}
      <ellipse cx="0" cy="20" rx="35" ry="14"/>
      {/* patas */}
      <rect x="-26" y="28" width="6" height="14"/>
      <rect x="-12" y="28" width="6" height="14"/>
      <rect x="14" y="28" width="6" height="14"/>
      <rect x="26" y="28" width="6" height="14"/>
      {/* cabeça */}
      <circle cx="-30" cy="6" r="14" fill="#7c2d12"/>
      <circle cx="-30" cy="6" r="10" fill="#a16207"/>
      {/* juba — círculos ao redor da cabeça */}
      <g fill="#7c2d12">
        <circle cx="-44" cy="-2" r="4"/><circle cx="-42" cy="10" r="4"/>
        <circle cx="-40" cy="-8" r="4"/><circle cx="-30" cy="-10" r="4"/>
      </g>
      {/* rabo */}
      <path d="M30 18 Q42 6 38 -2 Q34 4 28 14 Z"/>
    </g>
    {/* arbustos */}
    <ellipse cx="40" cy="155" rx="22" ry="8" fill="#65a30d" opacity="0.9"/>
    <ellipse cx="345" cy="160" rx="28" ry="9" fill="#84cc16" opacity="0.9"/>
    {/* nuvem */}
    <ellipse cx="120" cy="40" rx="20" ry="7" fill="#fff" opacity="0.7"/>
    <ellipse cx="115" cy="35" rx="14" ry="6" fill="#fff" opacity="0.7"/>
  </svg>
);

const ReinoMarHero: React.FC = () => (
  <svg aria-hidden className="pointer-events-none mx-auto mb-2 h-36 w-full sm:h-44" viewBox="0 0 400 180" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="seaMar" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#bae6fd"/>
        <stop offset="100%" stopColor="#0e7490"/>
      </linearGradient>
      <radialGradient id="shellMar" cx="50%" cy="20%"><stop offset="0%" stopColor="#fef3c7"/><stop offset="100%" stopColor="#f97316"/></radialGradient>
    </defs>
    <rect width="400" height="60" fill="#fef3c7"/>
    <rect y="60" width="400" height="120" fill="url(#seaMar)"/>
    {/* sol */}
    <circle cx="60" cy="35" r="18" fill="#fbbf24"/>
    {/* ondas */}
    <path d="M0 80 Q40 64 80 80 T160 80 T240 80 T320 80 T400 80 V180 H0 Z" fill="#5eead4" opacity="0.6"/>
    <path d="M0 100 Q40 84 80 100 T160 100 T240 100 T320 100 T400 100 V180 H0 Z" fill="#22d3ee" opacity="0.6"/>
    {/* concha grande central */}
    <g transform="translate(200 110)">
      <path d="M0 30 Q-40 20 -40 -10 Q-30 -30 0 -30 Q30 -30 40 -10 Q40 20 0 30 Z" fill="url(#shellMar)" stroke="#9a3412" strokeWidth="1.5"/>
      <path d="M-30 -10 Q-20 10 0 25 Q20 10 30 -10" stroke="#9a3412" strokeWidth="1" fill="none"/>
      <path d="M-20 -20 Q-10 5 0 25" stroke="#9a3412" strokeWidth="1" fill="none"/>
      <path d="M20 -20 Q10 5 0 25" stroke="#9a3412" strokeWidth="1" fill="none"/>
      <path d="M0 -30 Q0 5 0 25" stroke="#9a3412" strokeWidth="1" fill="none"/>
      <circle cx="0" cy="-22" r="2" fill="#fbbf24"/>
    </g>
    {/* peixinhos */}
    <g transform="translate(80 130)">
      <ellipse cx="0" cy="0" rx="14" ry="7" fill="#fb923c"/>
      <polygon points="-14,0 -22,-5 -22,5" fill="#fb923c"/>
      <circle cx="6" cy="-2" r="1.5" fill="#1f2937"/>
    </g>
    <g transform="translate(310 145) scale(-1 1)">
      <ellipse cx="0" cy="0" rx="11" ry="6" fill="#a78bfa"/>
      <polygon points="-11,0 -18,-4 -18,4" fill="#a78bfa"/>
      <circle cx="5" cy="-1" r="1.2" fill="#1f2937"/>
    </g>
    {/* bolhas */}
    <g fill="#f0fdfa" opacity="0.8">
      <circle cx="120" cy="115" r="3"/>
      <circle cx="130" cy="130" r="2"/>
      <circle cx="280" cy="120" r="2.5"/>
      <circle cx="290" cy="135" r="1.8"/>
    </g>
    {/* estrela do mar */}
    <g transform="translate(340 165)" fill="#dc2626">
      <path d="M0 -10 L3 -3 L10 -2 L4.5 3 L6 10 L0 6 L-6 10 L-4.5 3 L-10 -2 L-3 -3 Z"/>
    </g>
  </svg>
);

const CarrosHero: React.FC = () => (
  <svg aria-hidden className="pointer-events-none mx-auto mb-2 h-36 w-full sm:h-44" viewBox="0 0 400 180" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="skyCar" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#bae6fd"/><stop offset="100%" stopColor="#fef9c3"/></linearGradient>
      <linearGradient id="carBody" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fca5a5"/><stop offset="100%" stopColor="#dc2626"/></linearGradient>
    </defs>
    <rect width="400" height="120" fill="url(#skyCar)"/>
    {/* montanhas */}
    <polygon points="0,120 80,60 130,90 180,55 240,95 320,65 400,120" fill="#7dd3fc" opacity="0.8"/>
    {/* asfalto */}
    <rect y="120" width="400" height="60" fill="#374151"/>
    {/* faixa central pontilhada */}
    <g fill="#fde047">
      <rect x="20" y="148" width="22" height="4"/>
      <rect x="60" y="148" width="22" height="4"/>
      <rect x="100" y="148" width="22" height="4"/>
      <rect x="140" y="148" width="22" height="4"/>
      <rect x="180" y="148" width="22" height="4"/>
      <rect x="220" y="148" width="22" height="4"/>
      <rect x="260" y="148" width="22" height="4"/>
      <rect x="300" y="148" width="22" height="4"/>
      <rect x="340" y="148" width="22" height="4"/>
    </g>
    {/* carro de corrida */}
    <g transform="translate(180 130)">
      {/* corpo baixo */}
      <path d="M-50 0 L-40 -15 L-15 -20 L20 -22 L40 -10 L50 0 L50 8 L-50 8 Z" fill="url(#carBody)" stroke="#7f1d1d" strokeWidth="1.5"/>
      {/* parabrisa */}
      <path d="M-12 -19 L18 -21 L26 -10 L-6 -10 Z" fill="#0ea5e9" opacity="0.85" stroke="#0c4a6e" strokeWidth="1"/>
      {/* número */}
      <circle cx="-25" cy="-6" r="6" fill="#fff"/>
      <text x="-25" y="-3" textAnchor="middle" fontFamily="Impact, sans-serif" fontSize="9" fontWeight="900" fill="#dc2626">3</text>
      {/* rodas */}
      <circle cx="-30" cy="10" r="9" fill="#1f2937"/>
      <circle cx="-30" cy="10" r="4" fill="#9ca3af"/>
      <circle cx="30" cy="10" r="9" fill="#1f2937"/>
      <circle cx="30" cy="10" r="4" fill="#9ca3af"/>
      {/* aileron */}
      <rect x="42" y="-15" width="8" height="2" fill="#7f1d1d"/>
      <rect x="44" y="-15" width="2" height="-8" fill="#7f1d1d"/>
    </g>
    {/* bandeira xadrez */}
    <g transform="translate(340 90)">
      <line x1="0" y1="0" x2="0" y2="60" stroke="#1f2937" strokeWidth="2"/>
      <g>
        <rect x="0" y="0" width="8" height="8" fill="#1f2937"/>
        <rect x="8" y="0" width="8" height="8" fill="#fff"/>
        <rect x="16" y="0" width="8" height="8" fill="#1f2937"/>
        <rect x="0" y="8" width="8" height="8" fill="#fff"/>
        <rect x="8" y="8" width="8" height="8" fill="#1f2937"/>
        <rect x="16" y="8" width="8" height="8" fill="#fff"/>
        <rect x="0" y="16" width="8" height="8" fill="#1f2937"/>
        <rect x="8" y="16" width="8" height="8" fill="#fff"/>
        <rect x="16" y="16" width="8" height="8" fill="#1f2937"/>
      </g>
    </g>
    {/* nuvens */}
    <ellipse cx="60" cy="35" rx="22" ry="7" fill="#fff" opacity="0.85"/>
    <ellipse cx="50" cy="30" rx="14" ry="6" fill="#fff" opacity="0.85"/>
    <ellipse cx="300" cy="50" rx="20" ry="6" fill="#fff" opacity="0.85"/>
  </svg>
);

const DinosHero: React.FC = () => (
  <svg aria-hidden className="pointer-events-none mx-auto mb-2 h-36 w-full sm:h-44" viewBox="0 0 400 180" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="skyDin" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fed7aa"/><stop offset="100%" stopColor="#fb923c"/></linearGradient>
      <linearGradient id="grDin" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#65a30d"/><stop offset="100%" stopColor="#365314"/></linearGradient>
    </defs>
    <rect width="400" height="125" fill="url(#skyDin)"/>
    <rect y="125" width="400" height="55" fill="url(#grDin)"/>
    {/* sol */}
    <circle cx="320" cy="50" r="22" fill="#fef3c7" opacity="0.8"/>
    <circle cx="320" cy="50" r="14" fill="#fb7185"/>
    {/* vulcão fumegando */}
    <g>
      <polygon points="0,125 50,60 100,125" fill="#7c2d12"/>
      <polygon points="40,80 50,60 60,80 55,75 50,80 45,75" fill="#dc2626"/>
      <circle cx="40" cy="50" r="8" fill="#9ca3af" opacity="0.7"/>
      <circle cx="50" cy="35" r="10" fill="#9ca3af" opacity="0.6"/>
      <circle cx="65" cy="22" r="12" fill="#9ca3af" opacity="0.5"/>
    </g>
    {/* braquiossauro silhueta */}
    <g fill="#15803d" transform="translate(220 90)">
      {/* corpo */}
      <ellipse cx="0" cy="20" rx="38" ry="16"/>
      {/* pescoço longo */}
      <path d="M-22 12 Q-30 -10 -25 -35 Q-15 -45 -8 -35 Q-15 -15 -10 8 Z"/>
      {/* cabeça */}
      <ellipse cx="-12" cy="-38" rx="9" ry="6"/>
      <circle cx="-7" cy="-39" r="1.5" fill="#fff"/>
      {/* patas */}
      <rect x="-30" y="34" width="8" height="14"/>
      <rect x="-14" y="34" width="8" height="14"/>
      <rect x="14" y="34" width="8" height="14"/>
      <rect x="28" y="34" width="8" height="14"/>
      {/* cauda */}
      <path d="M30 18 Q55 14 65 4 Q60 12 38 26 Z"/>
    </g>
    {/* T-Rex pequeno silhueta */}
    <g fill="#84cc16" transform="translate(140 100)">
      <path d="M0 30 Q-5 8 5 0 Q15 -10 18 -20 L24 -10 L20 -2 L26 0 Q30 8 28 18 Q32 28 28 30 Z"/>
      <rect x="2" y="30" width="4" height="10"/>
      <rect x="14" y="30" width="4" height="10"/>
      <circle cx="20" cy="-18" r="1.2" fill="#fff"/>
    </g>
    {/* palmeira pré-histórica */}
    <g transform="translate(370 155)">
      <path d="M0 0 Q-2 -30 2 -55" stroke="#7c2d12" strokeWidth="3" fill="none"/>
      <path d="M2 -55 Q-20 -60 -28 -50" stroke="#15803d" strokeWidth="3" fill="none"/>
      <path d="M2 -55 Q22 -62 30 -50" stroke="#15803d" strokeWidth="3" fill="none"/>
      <path d="M2 -55 Q2 -72 -8 -75" stroke="#16a34a" strokeWidth="3" fill="none"/>
    </g>
    {/* ovo */}
    <ellipse cx="80" cy="160" rx="9" ry="11" fill="#fef3c7" stroke="#a16207" strokeWidth="1"/>
    <ellipse cx="78" cy="158" rx="2" ry="2.5" fill="#a16207" opacity="0.5"/>
  </svg>
);

const UnicornioHero: React.FC = () => (
  <svg aria-hidden className="pointer-events-none mx-auto mb-2 h-36 w-full sm:h-44" viewBox="0 0 400 180" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="skyUni" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fce7f3"/>
        <stop offset="50%" stopColor="#ddd6fe"/>
        <stop offset="100%" stopColor="#bfdbfe"/>
      </linearGradient>
      <linearGradient id="bodyUni" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fff"/><stop offset="100%" stopColor="#fce7f3"/></linearGradient>
    </defs>
    <rect width="400" height="180" fill="url(#skyUni)"/>
    {/* arco-íris atrás */}
    <g transform="translate(80 160)">
      <path d="M-60 0 a60 60 0 0 1 120 0" stroke="#dc2626" strokeWidth="6" fill="none"/>
      <path d="M-54 0 a54 54 0 0 1 108 0" stroke="#fb923c" strokeWidth="6" fill="none"/>
      <path d="M-48 0 a48 48 0 0 1 96 0" stroke="#fde047" strokeWidth="6" fill="none"/>
      <path d="M-42 0 a42 42 0 0 1 84 0" stroke="#22c55e" strokeWidth="6" fill="none"/>
      <path d="M-36 0 a36 36 0 0 1 72 0" stroke="#3b82f6" strokeWidth="6" fill="none"/>
      <path d="M-30 0 a30 30 0 0 1 60 0" stroke="#a855f7" strokeWidth="6" fill="none"/>
    </g>
    {/* nuvens fofas */}
    <g fill="#fff" opacity="0.95">
      <ellipse cx="20" cy="155" rx="28" ry="10"/>
      <ellipse cx="35" cy="148" rx="18" ry="9"/>
      <ellipse cx="140" cy="160" rx="32" ry="11"/>
    </g>
    {/* unicórnio silhueta */}
    <g transform="translate(280 110)">
      {/* corpo */}
      <ellipse cx="0" cy="20" rx="40" ry="16" fill="url(#bodyUni)" stroke="#f9a8d4" strokeWidth="1.5"/>
      {/* pescoço */}
      <path d="M-25 12 L-32 -10 L-20 -10 L-15 8 Z" fill="url(#bodyUni)" stroke="#f9a8d4" strokeWidth="1.5"/>
      {/* cabeça */}
      <path d="M-32 -10 Q-44 -22 -38 -28 Q-26 -28 -22 -18 L-20 -10 Z" fill="url(#bodyUni)" stroke="#f9a8d4" strokeWidth="1.5"/>
      {/* chifre dourado */}
      <path d="M-32 -28 L-30 -45 L-28 -28 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="1.5"/>
      {/* olho */}
      <circle cx="-32" cy="-18" r="1.5" fill="#1f2937"/>
      {/* crina arco-íris */}
      <path d="M-26 -12 Q-12 -20 -10 -5 Z" fill="#ec4899"/>
      <path d="M-22 -8 Q-6 -14 -4 0 Z" fill="#fde047"/>
      <path d="M-18 -4 Q0 -8 4 6 Z" fill="#22c55e"/>
      <path d="M-14 0 Q4 0 8 12 Z" fill="#3b82f6"/>
      {/* patas */}
      <rect x="-30" y="32" width="6" height="12" fill="#fce7f3" stroke="#f9a8d4"/>
      <rect x="-12" y="32" width="6" height="12" fill="#fce7f3" stroke="#f9a8d4"/>
      <rect x="14" y="32" width="6" height="12" fill="#fce7f3" stroke="#f9a8d4"/>
      <rect x="28" y="32" width="6" height="12" fill="#fce7f3" stroke="#f9a8d4"/>
      {/* cauda arco-íris */}
      <path d="M40 18 Q60 8 58 -4" stroke="#ec4899" strokeWidth="3" fill="none"/>
      <path d="M40 22 Q62 14 62 0" stroke="#fde047" strokeWidth="3" fill="none"/>
      <path d="M40 26 Q64 20 66 6" stroke="#22c55e" strokeWidth="3" fill="none"/>
    </g>
    {/* estrelinhas e corações */}
    <g fill="#f472b6" opacity="0.85">
      <path d="M50 50 c-2 -4 -7 -2 -7 2 c0 4 7 8 7 8 s7 -4 7 -8 c0 -4 -5 -6 -7 -2z"/>
      <path d="M180 30 c-2 -4 -7 -2 -7 2 c0 4 7 8 7 8 s7 -4 7 -8 c0 -4 -5 -6 -7 -2z"/>
    </g>
    <g fill="#fbbf24" opacity="0.9">
      <path d="M120 50 l1.5 4 l4 0 l-3 2 l1 4 l-3.5 -2 l-3 2 l1 -4 l-3 -2 l4 0 z"/>
      <path d="M220 80 l1.5 4 l4 0 l-3 2 l1 4 l-3.5 -2 l-3 2 l1 -4 l-3 -2 l4 0 z"/>
      <path d="M360 30 l1.5 4 l4 0 l-3 2 l1 4 l-3.5 -2 l-3 2 l1 -4 l-3 -2 l4 0 z"/>
    </g>
  </svg>
);

const PiratasHero: React.FC = () => (
  <svg aria-hidden className="pointer-events-none mx-auto mb-2 h-36 w-full sm:h-44" viewBox="0 0 400 180" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="skyPir" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fef3c7"/><stop offset="100%" stopColor="#fb923c"/></linearGradient>
      <linearGradient id="seaPir" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0e7490"/><stop offset="100%" stopColor="#0c4a6e"/></linearGradient>
    </defs>
    <rect width="400" height="100" fill="url(#skyPir)"/>
    <rect y="100" width="400" height="80" fill="url(#seaPir)"/>
    {/* sol */}
    <circle cx="80" cy="50" r="20" fill="#fcd34d"/>
    {/* nuvens */}
    <ellipse cx="200" cy="35" rx="22" ry="7" fill="#fff" opacity="0.85"/>
    <ellipse cx="195" cy="30" rx="14" ry="6" fill="#fff" opacity="0.85"/>
    {/* ondas */}
    <path d="M0 110 Q40 100 80 110 T160 110 T240 110 T320 110 T400 110 V180 H0 Z" fill="#0891b2" opacity="0.7"/>
    <path d="M0 130 Q40 120 80 130 T160 130 T240 130 T320 130 T400 130 V180 H0 Z" fill="#0e7490" opacity="0.85"/>
    {/* navio pirata */}
    <g transform="translate(220 90)">
      {/* casco */}
      <path d="M-50 20 L50 20 L40 36 L-40 36 Z" fill="#7c2d12" stroke="#451a03" strokeWidth="1.5"/>
      <line x1="-44" y1="28" x2="44" y2="28" stroke="#fbbf24" strokeWidth="1"/>
      {/* mastros */}
      <line x1="0" y1="20" x2="0" y2="-40" stroke="#451a03" strokeWidth="3"/>
      {/* vela */}
      <path d="M2 -38 L34 -28 L34 0 L2 8 Z" fill="#fef3c7" stroke="#92400e" strokeWidth="1"/>
      <path d="M-2 -38 L-34 -28 L-34 0 L-2 8 Z" fill="#fef3c7" stroke="#92400e" strokeWidth="1"/>
      {/* caveira simples na vela */}
      <g transform="translate(0 -12)" fill="#1f2937">
        <circle cx="0" cy="-2" r="5"/>
        <rect x="-1" y="3" width="2" height="3"/>
        <circle cx="-2" cy="-2" r="1" fill="#fef3c7"/>
        <circle cx="2" cy="-2" r="1" fill="#fef3c7"/>
        <line x1="-7" y1="6" x2="7" y2="6" stroke="#1f2937" strokeWidth="1.5"/>
      </g>
      {/* bandeira topo */}
      <path d="M0 -40 L18 -36 L0 -32 Z" fill="#1f2937"/>
    </g>
    {/* ilha à direita com palmeira */}
    <ellipse cx="350" cy="135" rx="30" ry="8" fill="#fbbf24"/>
    <g transform="translate(355 130)">
      <path d="M0 0 Q-2 -20 4 -38" stroke="#7c2d12" strokeWidth="3" fill="none"/>
      <path d="M4 -38 Q-12 -42 -20 -36" stroke="#15803d" strokeWidth="3" fill="none"/>
      <path d="M4 -38 Q20 -42 28 -34" stroke="#15803d" strokeWidth="3" fill="none"/>
      <path d="M4 -38 Q4 -52 -4 -54" stroke="#16a34a" strokeWidth="3" fill="none"/>
    </g>
    {/* baú/X marca */}
    <g transform="translate(60 145)">
      <rect x="-12" y="-6" width="24" height="14" fill="#a16207" stroke="#451a03" strokeWidth="1"/>
      <rect x="-12" y="-2" width="24" height="2" fill="#fbbf24"/>
      <rect x="-3" y="-1" width="6" height="6" fill="#fbbf24"/>
    </g>
  </svg>
);

// ============================================================================
// DECORAÇÕES (canto superior direito)
// ============================================================================

const decoCommon = "pointer-events-none absolute right-2 top-2 h-20 w-20 opacity-90 sm:h-24 sm:w-24";

const BalloonsRosaDeco: React.FC = () => (
  <svg aria-hidden className={decoCommon} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="30" cy="30" rx="12" ry="16" fill="#fb7185"/>
    <ellipse cx="60" cy="40" rx="11" ry="14" fill="#f472b6"/>
    <ellipse cx="50" cy="22" rx="9" ry="12" fill="#fda4af"/>
    <path d="M30 46 Q32 58 28 75 M60 54 Q62 66 65 80 M50 34 Q52 48 48 68" stroke="#9ca3af" strokeWidth="1" fill="none"/>
  </svg>
);

const BalloonsAzulDeco: React.FC = () => (
  <svg aria-hidden className={decoCommon} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="30" cy="30" rx="12" ry="16" fill="#60a5fa"/>
    <ellipse cx="60" cy="40" rx="11" ry="14" fill="#38bdf8"/>
    <ellipse cx="50" cy="22" rx="9" ry="12" fill="#93c5fd"/>
    <path d="M30 46 Q32 58 28 75 M60 54 Q62 66 65 80 M50 34 Q52 48 48 68" stroke="#9ca3af" strokeWidth="1" fill="none"/>
  </svg>
);

const CrownDeco: React.FC = () => (
  <svg aria-hidden className={decoCommon} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 60 L30 30 L40 50 L50 25 L60 50 L70 30 L80 60 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="2"/>
    <rect x="20" y="60" width="60" height="10" fill="#fbbf24" stroke="#d97706" strokeWidth="2"/>
    <circle cx="30" cy="30" r="3" fill="#dc2626"/>
    <circle cx="50" cy="25" r="3" fill="#2563eb"/>
    <circle cx="70" cy="30" r="3" fill="#16a34a"/>
  </svg>
);

const SnowflakeDeco: React.FC = () => (
  <svg aria-hidden className={decoCommon} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <g stroke="#0e7490" strokeWidth="2.5" strokeLinecap="round" fill="none">
      <line x1="50" y1="15" x2="50" y2="85"/>
      <line x1="15" y1="50" x2="85" y2="50"/>
      <line x1="25" y1="25" x2="75" y2="75"/>
      <line x1="75" y1="25" x2="25" y2="75"/>
      <path d="M50 15 L44 25 M50 15 L56 25 M50 85 L44 75 M50 85 L56 75"/>
      <path d="M85 50 L75 44 M85 50 L75 56 M15 50 L25 44 M15 50 L25 56"/>
    </g>
    <circle cx="50" cy="50" r="5" fill="#0e7490"/>
  </svg>
);

const ShieldDeco: React.FC = () => (
  <svg aria-hidden className={decoCommon} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 15 L80 25 L78 60 Q78 78 50 88 Q22 78 22 60 L20 25 Z" fill="#dc2626" stroke="#7f1d1d" strokeWidth="2"/>
    <path d="M50 25 L70 32 L68 60 Q68 72 50 80 Q32 72 32 60 L30 32 Z" fill="#fbbf24"/>
    <path d="M40 50 L60 50 M50 40 L50 65" stroke="#dc2626" strokeWidth="5" strokeLinecap="round"/>
  </svg>
);

const PlanetDeco: React.FC = () => (
  <svg aria-hidden className={decoCommon} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="50" cy="50" rx="42" ry="8" fill="none" stroke="#fbbf24" strokeWidth="2.5" opacity="0.85" transform="rotate(-15 50 50)"/>
    <circle cx="50" cy="50" r="22" fill="#f97316"/>
    <circle cx="44" cy="44" r="6" fill="#fbbf24" opacity="0.5"/>
    <circle cx="58" cy="56" r="4" fill="#7c2d12" opacity="0.6"/>
    <ellipse cx="50" cy="50" rx="42" ry="8" fill="none" stroke="#a16207" strokeWidth="1" opacity="0.6" transform="rotate(-15 50 50)"/>
  </svg>
);

const LionDeco: React.FC = () => (
  <svg aria-hidden className={decoCommon} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    {/* juba */}
    <g fill="#7c2d12">
      <circle cx="35" cy="40" r="8"/><circle cx="65" cy="40" r="8"/>
      <circle cx="30" cy="55" r="9"/><circle cx="70" cy="55" r="9"/>
      <circle cx="50" cy="30" r="9"/>
    </g>
    {/* cabeça */}
    <circle cx="50" cy="50" r="20" fill="#fbbf24"/>
    {/* olhos */}
    <circle cx="42" cy="48" r="2.5" fill="#1f2937"/>
    <circle cx="58" cy="48" r="2.5" fill="#1f2937"/>
    {/* nariz */}
    <path d="M48 56 L52 56 L50 60 Z" fill="#7c2d12"/>
    {/* sorriso */}
    <path d="M44 64 Q50 68 56 64" stroke="#7c2d12" strokeWidth="1.5" fill="none"/>
  </svg>
);

const ShellDeco: React.FC = () => (
  <svg aria-hidden className={decoCommon} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 80 Q15 65 15 35 Q25 15 50 15 Q75 15 85 35 Q85 65 50 80 Z" fill="#fda4af" stroke="#9a3412" strokeWidth="2"/>
    <path d="M30 35 Q40 60 50 75 M50 15 Q50 50 50 75 M70 35 Q60 60 50 75 M22 30 Q35 55 50 75 M78 30 Q65 55 50 75" stroke="#9a3412" strokeWidth="1" fill="none"/>
    <circle cx="50" cy="22" r="2" fill="#fbbf24"/>
  </svg>
);

const RaceDeco: React.FC = () => (
  <svg aria-hidden className={decoCommon} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    {/* bandeira xadrez */}
    <line x1="20" y1="20" x2="20" y2="80" stroke="#1f2937" strokeWidth="2"/>
    <g>
      <rect x="20" y="20" width="10" height="10" fill="#1f2937"/>
      <rect x="30" y="20" width="10" height="10" fill="#fff"/>
      <rect x="40" y="20" width="10" height="10" fill="#1f2937"/>
      <rect x="50" y="20" width="10" height="10" fill="#fff"/>
      <rect x="60" y="20" width="10" height="10" fill="#1f2937"/>
      <rect x="20" y="30" width="10" height="10" fill="#fff"/>
      <rect x="30" y="30" width="10" height="10" fill="#1f2937"/>
      <rect x="40" y="30" width="10" height="10" fill="#fff"/>
      <rect x="50" y="30" width="10" height="10" fill="#1f2937"/>
      <rect x="60" y="30" width="10" height="10" fill="#fff"/>
      <rect x="20" y="40" width="10" height="10" fill="#1f2937"/>
      <rect x="30" y="40" width="10" height="10" fill="#fff"/>
      <rect x="40" y="40" width="10" height="10" fill="#1f2937"/>
      <rect x="50" y="40" width="10" height="10" fill="#fff"/>
      <rect x="60" y="40" width="10" height="10" fill="#1f2937"/>
    </g>
  </svg>
);

const DinoDeco: React.FC = () => (
  <svg aria-hidden className={decoCommon} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 80 Q15 50 30 35 Q40 15 50 10 Q60 5 65 15 L75 5 L70 25 L80 25 Q85 40 80 55 Q90 70 80 75 Z" fill="#15803d" stroke="#14532d" strokeWidth="1.5"/>
    <rect x="28" y="80" width="6" height="12" fill="#15803d"/>
    <rect x="60" y="80" width="6" height="12" fill="#15803d"/>
    <circle cx="62" cy="22" r="2" fill="#fff"/>
    {/* picos no dorso */}
    <path d="M30 35 L34 28 L38 35 L42 28 L46 35 L50 28 L54 35" stroke="#14532d" strokeWidth="1.5" fill="#16a34a"/>
  </svg>
);

const UnicornDeco: React.FC = () => (
  <svg aria-hidden className={decoCommon} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    {/* cabeça */}
    <path d="M30 70 Q20 50 30 35 Q45 25 60 40 L62 60 Q60 75 45 78 Z" fill="#fff" stroke="#f9a8d4" strokeWidth="2"/>
    {/* chifre */}
    <path d="M40 28 L42 8 L46 28 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="1.5"/>
    {/* olho */}
    <circle cx="42" cy="50" r="2" fill="#1f2937"/>
    {/* crina */}
    <path d="M48 38 Q60 30 65 45 Z" fill="#ec4899"/>
    <path d="M52 50 Q66 44 70 60 Z" fill="#fde047"/>
    <path d="M55 62 Q70 60 70 75 Z" fill="#3b82f6"/>
    {/* orelha */}
    <path d="M30 35 L32 25 L40 30 Z" fill="#fff" stroke="#f9a8d4" strokeWidth="1.5"/>
  </svg>
);

const PirateDeco: React.FC = () => (
  <svg aria-hidden className={decoCommon} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    {/* mapa enrolado */}
    <rect x="15" y="30" width="70" height="44" fill="#fef3c7" stroke="#92400e" strokeWidth="2" rx="2"/>
    <circle cx="15" cy="30" r="4" fill="#92400e"/>
    <circle cx="85" cy="30" r="4" fill="#92400e"/>
    <circle cx="15" cy="74" r="4" fill="#92400e"/>
    <circle cx="85" cy="74" r="4" fill="#92400e"/>
    {/* X marca o local */}
    <line x1="50" y1="45" x2="65" y2="60" stroke="#dc2626" strokeWidth="3" strokeLinecap="round"/>
    <line x1="65" y1="45" x2="50" y2="60" stroke="#dc2626" strokeWidth="3" strokeLinecap="round"/>
    {/* trilha pontilhada */}
    <path d="M25 65 Q35 55 45 60 Q55 50 50 45" stroke="#92400e" strokeWidth="1.5" strokeDasharray="2 2" fill="none"/>
    <circle cx="25" cy="65" r="2" fill="#92400e"/>
  </svg>
);

const StarsDeco: React.FC = () => (
  <svg aria-hidden className={decoCommon} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 15 l3 8 l8 0 l-6 5 l2 8 l-7 -5 l-7 5 l2 -8 l-6 -5 l8 0 z" fill="#fbbf24" stroke="#d97706" strokeWidth="1"/>
    <path d="M20 60 l1.5 4 l4 0 l-3 2 l1 4 l-3.5 -2 l-3 2 l1 -4 l-3 -2 l4 0 z" fill="#fbbf24"/>
    <path d="M75 65 l1.5 4 l4 0 l-3 2 l1 4 l-3.5 -2 l-3 2 l1 -4 l-3 -2 l4 0 z" fill="#fbbf24"/>
  </svg>
);

// ============================================================================
// DEFINIÇÃO DOS TEMAS
// ============================================================================

export const THEMES: Theme[] = [
  {
    id: 'default',
    name: 'Padrão',
    pageBg: 'bg-gradient-to-b from-brand-50 to-white',
    titleColor: 'text-brand-900',
    accent: '#ff6b1a'
  },
  {
    id: 'infantil-rosa',
    name: 'Infantil Rosa',
    pageBg: 'bg-gradient-to-b from-pink-100 via-rose-50 to-white',
    titleColor: 'text-pink-900',
    accent: '#ec4899',
    cardClass: 'bg-white/90 backdrop-blur ring-1 ring-pink-200',
    pattern: dotsPattern('%23ec4899', '%23fb7185'),
    HeroArt: BalloonsRosa,
    Decoration: BalloonsRosaDeco
  },
  {
    id: 'infantil-azul',
    name: 'Infantil Azul',
    pageBg: 'bg-gradient-to-b from-sky-100 via-blue-50 to-white',
    titleColor: 'text-sky-900',
    accent: '#0284c7',
    cardClass: 'bg-white/90 backdrop-blur ring-1 ring-sky-200',
    pattern: cloudsPattern('%230284c7', '%233b82f6'),
    HeroArt: BalloonsAzul,
    Decoration: BalloonsAzulDeco
  },
  {
    id: 'reino-encantado',
    name: 'Reino Encantado',
    pageBg: 'bg-gradient-to-b from-pink-100 via-rose-50 to-amber-50',
    titleColor: 'text-rose-900',
    accent: '#db2777',
    cardClass: 'bg-white/90 backdrop-blur ring-1 ring-rose-200',
    pattern: heartsStarsPattern('%23ec4899', '%23fbbf24'),
    HeroArt: ReinoEncantadoHero,
    Decoration: CrownDeco
  },
  {
    id: 'reino-gelado',
    name: 'Reino Gelado',
    pageBg: 'bg-gradient-to-b from-sky-100 via-cyan-50 to-violet-50',
    titleColor: 'text-cyan-900',
    accent: '#0e7490',
    cardClass: 'bg-white/90 backdrop-blur ring-1 ring-cyan-200',
    pattern: snowflakesPattern('%230e7490', '%237dd3fc'),
    HeroArt: ReinoGeladoHero,
    Decoration: SnowflakeDeco
  },
  {
    id: 'super-heroi',
    name: 'Super Herói',
    pageBg: 'bg-gradient-to-b from-blue-100 via-red-50 to-white',
    titleColor: 'text-red-900',
    accent: '#dc2626',
    cardClass: 'bg-white/90 backdrop-blur ring-1 ring-red-200',
    pattern: comicPattern('%23dc2626', '%23fde047'),
    HeroArt: SuperHeroiHero,
    Decoration: ShieldDeco
  },
  {
    id: 'espaco',
    name: 'Aventura Espacial',
    pageBg: 'bg-gradient-to-b from-violet-200 via-indigo-100 to-white',
    titleColor: 'text-indigo-900',
    accent: '#6d28d9',
    cardClass: 'bg-white/90 backdrop-blur ring-1 ring-indigo-200',
    pattern: galaxyPattern('%236d28d9', '%23fbbf24'),
    HeroArt: EspacoHero,
    Decoration: PlanetDeco
  },
  {
    id: 'safari',
    name: 'Safari Aventura',
    pageBg: 'bg-gradient-to-b from-amber-100 via-yellow-50 to-orange-50',
    titleColor: 'text-amber-900',
    accent: '#ca8a04',
    cardClass: 'bg-white/90 backdrop-blur ring-1 ring-amber-200',
    pattern: leavesPattern('%2315803d', '%2365a30d'),
    HeroArt: SafariHero,
    Decoration: LionDeco
  },
  {
    id: 'reino-do-mar',
    name: 'Reino do Mar',
    pageBg: 'bg-gradient-to-b from-cyan-100 via-teal-50 to-white',
    titleColor: 'text-teal-900',
    accent: '#0d9488',
    cardClass: 'bg-white/90 backdrop-blur ring-1 ring-teal-200',
    pattern: wavesPattern('%230d9488', '%2306b6d4'),
    HeroArt: ReinoMarHero,
    Decoration: ShellDeco
  },
  {
    id: 'carros-pista',
    name: 'Carros & Pista',
    pageBg: 'bg-gradient-to-b from-red-100 via-orange-50 to-white',
    titleColor: 'text-red-900',
    accent: '#dc2626',
    cardClass: 'bg-white/90 backdrop-blur ring-1 ring-red-200',
    pattern: checkeredPattern('%23dc2626'),
    HeroArt: CarrosHero,
    Decoration: RaceDeco
  },
  {
    id: 'dinos',
    name: 'Dino Aventura',
    pageBg: 'bg-gradient-to-b from-orange-100 via-amber-50 to-lime-50',
    titleColor: 'text-green-900',
    accent: '#15803d',
    cardClass: 'bg-white/90 backdrop-blur ring-1 ring-green-200',
    pattern: leavesPattern('%2315803d', '%237c2d12'),
    HeroArt: DinosHero,
    Decoration: DinoDeco
  },
  {
    id: 'unicornio',
    name: 'Unicórnio Mágico',
    pageBg: 'bg-gradient-to-b from-pink-100 via-violet-50 to-sky-50',
    titleColor: 'text-pink-900',
    accent: '#db2777',
    cardClass: 'bg-white/90 backdrop-blur ring-1 ring-pink-200',
    pattern: rainbowPattern('%23ec4899', '%23a855f7'),
    HeroArt: UnicornioHero,
    Decoration: UnicornDeco
  },
  {
    id: 'piratas',
    name: 'Aventura Pirata',
    pageBg: 'bg-gradient-to-b from-amber-100 via-orange-50 to-cyan-50',
    titleColor: 'text-amber-900',
    accent: '#92400e',
    cardClass: 'bg-white/90 backdrop-blur ring-1 ring-amber-200',
    pattern: compassPattern('%2392400e', '%23fbbf24'),
    HeroArt: PiratasHero,
    Decoration: PirateDeco
  }
];

export function getTheme(id?: string | null): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
