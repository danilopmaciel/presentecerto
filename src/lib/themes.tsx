/**
 * Definição centralizada dos temas visuais do PresenteCerto.
 * Cada tema tem cores, padrão de fundo (SVG inline), decorações e hero banner.
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
  // background base da página inteira (gradiente Tailwind)
  pageBg: string;
  // cor do título principal
  titleColor: string;
  // cor de destaque (hex) usada em botões/borders
  accent: string;
  // classes tailwind aplicadas no card (fundo + borda)
  cardClass?: string;
  // padrão SVG (tiled) aplicado como background-image
  pattern?: string;
  // arte grande no topo da página (banner)
  HeroArt?: React.FC;
  // pequena decoração (canto superior direito dentro do container)
  Decoration?: React.FC;
};

// ----- Padrões SVG (tiled) ---------------------------------------------------

function svgDataUrl(svg: string) {
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

const polkaDots = (c1: string, c2: string, size = 48) => svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <circle cx="10" cy="10" r="4" fill="${c1}" opacity="0.55"/>
  <circle cx="${size - 12}" cy="${size - 12}" r="3" fill="${c2}" opacity="0.55"/>
  <circle cx="${size / 2}" cy="${size / 2}" r="2" fill="${c1}" opacity="0.35"/>
  <circle cx="${size - 10}" cy="12" r="2" fill="${c2}" opacity="0.4"/>
  <circle cx="12" cy="${size - 10}" r="2.5" fill="${c1}" opacity="0.4"/>
</svg>`);

const cloudDots = (c1: string, c2: string) => svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="80" viewBox="0 0 100 80">
  <ellipse cx="24" cy="22" rx="18" ry="7" fill="${c1}" opacity="0.35"/>
  <ellipse cx="24" cy="18" rx="12" ry="5" fill="${c1}" opacity="0.35"/>
  <ellipse cx="78" cy="58" rx="20" ry="8" fill="${c2}" opacity="0.28"/>
  <ellipse cx="78" cy="54" rx="14" ry="6" fill="${c2}" opacity="0.28"/>
</svg>`);

const waves = (c1: string, c2: string) => svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" width="160" height="60" viewBox="0 0 160 60">
  <path d="M0 20 Q20 4 40 20 T80 20 T120 20 T160 20" stroke="${c1}" stroke-width="2.5" fill="none" opacity="0.55"/>
  <path d="M0 38 Q20 22 40 38 T80 38 T120 38 T160 38" stroke="${c2}" stroke-width="2" fill="none" opacity="0.35"/>
  <path d="M0 54 Q20 40 40 54 T80 54 T120 54 T160 54" stroke="${c1}" stroke-width="1.5" fill="none" opacity="0.25"/>
</svg>`);

const leaves = (c1: string, c2: string) => svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" width="90" height="90" viewBox="0 0 90 90">
  <ellipse cx="20" cy="25" rx="7" ry="16" fill="${c1}" opacity="0.45" transform="rotate(35 20 25)"/>
  <ellipse cx="60" cy="55" rx="7" ry="16" fill="${c2}" opacity="0.4" transform="rotate(-25 60 55)"/>
  <circle cx="75" cy="20" r="3" fill="${c1}" opacity="0.45"/>
  <circle cx="15" cy="70" r="2" fill="${c2}" opacity="0.45"/>
</svg>`);

const stars = (c1: string, c2: string) => svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 72 72">
  <path d="M36 10 L39 24 L54 24 L42 32 L46 46 L36 37 L26 46 L30 32 L18 24 L33 24 Z" fill="${c1}" opacity="0.5"/>
  <circle cx="12" cy="56" r="2" fill="${c2}" opacity="0.7"/>
  <circle cx="58" cy="14" r="2" fill="${c2}" opacity="0.7"/>
  <circle cx="62" cy="58" r="1.5" fill="${c1}" opacity="0.6"/>
  <circle cx="8" cy="18" r="1.5" fill="${c1}" opacity="0.6"/>
</svg>`);

// ----- Hero Arts (banners grandes no topo da página) ------------------------

const BalloonsHero: React.FC = () => (
  <svg
    aria-hidden
    className="pointer-events-none mx-auto mb-2 h-32 w-full sm:h-40"
    viewBox="0 0 400 160"
    preserveAspectRatio="xMidYMid meet"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <radialGradient id="pink1" cx="50%" cy="35%">
        <stop offset="0%" stopColor="#ffe4ec" />
        <stop offset="100%" stopColor="#ec4899" />
      </radialGradient>
      <radialGradient id="pink2" cx="50%" cy="35%">
        <stop offset="0%" stopColor="#fff1f5" />
        <stop offset="100%" stopColor="#f472b6" />
      </radialGradient>
      <radialGradient id="pink3" cx="50%" cy="35%">
        <stop offset="0%" stopColor="#fff1f5" />
        <stop offset="100%" stopColor="#fb7185" />
      </radialGradient>
    </defs>
    <ellipse cx="60" cy="50" rx="26" ry="34" fill="url(#pink1)" />
    <ellipse cx="150" cy="40" rx="28" ry="36" fill="url(#pink2)" />
    <ellipse cx="250" cy="55" rx="24" ry="32" fill="url(#pink3)" />
    <ellipse cx="340" cy="42" rx="26" ry="34" fill="url(#pink1)" />
    <path d="M60 84 Q62 110 55 140" stroke="#9ca3af" strokeWidth="1.2" fill="none" />
    <path d="M150 76 Q152 106 160 150" stroke="#9ca3af" strokeWidth="1.2" fill="none" />
    <path d="M250 87 Q248 115 242 150" stroke="#9ca3af" strokeWidth="1.2" fill="none" />
    <path d="M340 76 Q342 110 336 148" stroke="#9ca3af" strokeWidth="1.2" fill="none" />
    {/* confetes */}
    <rect x="20" y="130" width="4" height="9" fill="#ec4899" transform="rotate(20 22 134)" />
    <rect x="110" y="130" width="4" height="9" fill="#fbbf24" transform="rotate(-15 112 134)" />
    <rect x="200" y="134" width="4" height="9" fill="#60a5fa" transform="rotate(30 202 138)" />
    <rect x="290" y="132" width="4" height="9" fill="#34d399" transform="rotate(-25 292 136)" />
    <rect x="370" y="134" width="4" height="9" fill="#f472b6" transform="rotate(15 372 138)" />
  </svg>
);

const BalloonsBlueHero: React.FC = () => (
  <svg
    aria-hidden
    className="pointer-events-none mx-auto mb-2 h-32 w-full sm:h-40"
    viewBox="0 0 400 160"
    preserveAspectRatio="xMidYMid meet"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <radialGradient id="blue1" cx="50%" cy="35%">
        <stop offset="0%" stopColor="#e0f2fe" />
        <stop offset="100%" stopColor="#0284c7" />
      </radialGradient>
      <radialGradient id="blue2" cx="50%" cy="35%">
        <stop offset="0%" stopColor="#dbeafe" />
        <stop offset="100%" stopColor="#3b82f6" />
      </radialGradient>
    </defs>
    <ellipse cx="340" cy="80" rx="55" ry="22" fill="#dbeafe" opacity="0.6" />
    <ellipse cx="60" cy="90" rx="42" ry="18" fill="#e0f2fe" opacity="0.7" />
    <ellipse cx="70" cy="45" rx="24" ry="30" fill="url(#blue1)" />
    <ellipse cx="160" cy="35" rx="26" ry="32" fill="url(#blue2)" />
    <ellipse cx="250" cy="50" rx="22" ry="28" fill="url(#blue1)" />
    <ellipse cx="340" cy="40" rx="24" ry="30" fill="url(#blue2)" />
    <path d="M70 78 Q72 108 66 140" stroke="#9ca3af" strokeWidth="1.2" fill="none" />
    <path d="M160 70 Q162 100 170 145" stroke="#9ca3af" strokeWidth="1.2" fill="none" />
    <path d="M250 80 Q248 110 244 148" stroke="#9ca3af" strokeWidth="1.2" fill="none" />
    <path d="M340 73 Q342 105 336 145" stroke="#9ca3af" strokeWidth="1.2" fill="none" />
  </svg>
);

const WaterHero: React.FC = () => (
  <svg
    aria-hidden
    className="pointer-events-none mx-auto mb-2 h-32 w-full sm:h-40"
    viewBox="0 0 400 160"
    preserveAspectRatio="xMidYMid slice"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#99f6e4" />
        <stop offset="100%" stopColor="#14b8a6" />
      </linearGradient>
    </defs>
    <rect x="0" y="80" width="400" height="80" fill="url(#sea)" />
    {/* sol */}
    <circle cx="340" cy="40" r="28" fill="#fde68a" opacity="0.9" />
    <circle cx="340" cy="40" r="18" fill="#fbbf24" />
    {/* ondas */}
    <path d="M0 95 Q40 80 80 95 T160 95 T240 95 T320 95 T400 95 V160 H0 Z" fill="#5eead4" opacity="0.8" />
    <path d="M0 115 Q40 100 80 115 T160 115 T240 115 T320 115 T400 115 V160 H0 Z" fill="#2dd4bf" opacity="0.85" />
    {/* peixe */}
    <g transform="translate(80 125)">
      <ellipse cx="0" cy="0" rx="14" ry="8" fill="#fb923c" />
      <polygon points="-14,0 -22,-6 -22,6" fill="#fb923c" />
      <circle cx="6" cy="-2" r="1.5" fill="#1f2937" />
    </g>
    <g transform="translate(260 135)">
      <ellipse cx="0" cy="0" rx="10" ry="6" fill="#f97316" />
      <polygon points="-10,0 -16,-4 -16,4" fill="#f97316" />
      <circle cx="4" cy="-1" r="1" fill="#1f2937" />
    </g>
    {/* bolhas */}
    <circle cx="120" cy="110" r="3" fill="#f0fdfa" opacity="0.8" />
    <circle cx="130" cy="125" r="2" fill="#f0fdfa" opacity="0.8" />
    <circle cx="220" cy="115" r="2.5" fill="#f0fdfa" opacity="0.7" />
  </svg>
);

const SafariHero: React.FC = () => (
  <svg
    aria-hidden
    className="pointer-events-none mx-auto mb-2 h-32 w-full sm:h-40"
    viewBox="0 0 400 160"
    preserveAspectRatio="xMidYMid slice"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fde68a" />
        <stop offset="100%" stopColor="#fbbf24" />
      </linearGradient>
      <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fcd34d" />
        <stop offset="100%" stopColor="#d97706" />
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="400" height="110" fill="url(#sky)" />
    <rect x="0" y="110" width="400" height="50" fill="url(#ground)" />
    {/* sol */}
    <circle cx="320" cy="50" r="26" fill="#fef3c7" opacity="0.9" />
    <circle cx="320" cy="50" r="18" fill="#f59e0b" />
    {/* palmeira */}
    <path d="M80 160 Q78 110 82 60" stroke="#7c2d12" strokeWidth="5" fill="none" />
    <path d="M82 60 Q55 52 35 65" stroke="#15803d" strokeWidth="4" fill="none" />
    <path d="M82 60 Q110 50 135 62" stroke="#15803d" strokeWidth="4" fill="none" />
    <path d="M82 60 Q65 38 48 38" stroke="#16a34a" strokeWidth="4" fill="none" />
    <path d="M82 60 Q102 38 122 40" stroke="#16a34a" strokeWidth="4" fill="none" />
    <path d="M82 60 Q82 42 80 28" stroke="#15803d" strokeWidth="4" fill="none" />
    {/* girafa pescoço simples */}
    <g transform="translate(220 95)">
      <rect x="0" y="0" width="16" height="50" rx="4" fill="#d97706" />
      <ellipse cx="8" cy="0" rx="18" ry="10" fill="#d97706" />
      <circle cx="4" cy="-3" r="1.5" fill="#1f2937" />
      <circle cx="2" cy="8" r="2" fill="#7c2d12" opacity="0.6" />
      <circle cx="14" cy="20" r="2" fill="#7c2d12" opacity="0.6" />
      <circle cx="4" cy="35" r="2" fill="#7c2d12" opacity="0.6" />
    </g>
    {/* arbustos */}
    <ellipse cx="340" cy="135" rx="30" ry="10" fill="#65a30d" opacity="0.9" />
    <ellipse cx="330" cy="128" rx="20" ry="10" fill="#84cc16" opacity="0.9" />
  </svg>
);

const CrownHero: React.FC = () => (
  <svg
    aria-hidden
    className="pointer-events-none mx-auto mb-2 h-32 w-full sm:h-40"
    viewBox="0 0 400 160"
    preserveAspectRatio="xMidYMid meet"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fde68a" />
        <stop offset="100%" stopColor="#f59e0b" />
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="50%">
        <stop offset="0%" stopColor="#fef3c7" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#fef3c7" stopOpacity="0" />
      </radialGradient>
    </defs>
    <ellipse cx="200" cy="80" rx="180" ry="60" fill="url(#glow)" />
    {/* coroa central */}
    <g transform="translate(200 80)">
      <path
        d="M-60 20 L-45 -30 L-20 10 L0 -45 L20 10 L45 -30 L60 20 Z"
        fill="url(#gold)"
        stroke="#b45309"
        strokeWidth="2.5"
      />
      <rect x="-60" y="20" width="120" height="14" fill="url(#gold)" stroke="#b45309" strokeWidth="2" />
      <circle cx="-45" cy="-30" r="4" fill="#dc2626" />
      <circle cx="0" cy="-45" r="4" fill="#2563eb" />
      <circle cx="45" cy="-30" r="4" fill="#16a34a" />
      <circle cx="-30" cy="27" r="2.5" fill="#b91c1c" />
      <circle cx="0" cy="27" r="2.5" fill="#1d4ed8" />
      <circle cx="30" cy="27" r="2.5" fill="#15803d" />
    </g>
    {/* estrelinhas ao redor */}
    <g fill="#fbbf24" opacity="0.85">
      <path d="M60 40 l2 6 l6 0 l-5 4 l2 6 l-5 -4 l-5 4 l2 -6 l-5 -4 l6 0 z" />
      <path d="M340 50 l2 5 l5 0 l-4 3 l1.5 5 l-4.5 -3 l-4 3 l1.5 -5 l-4 -3 l5 0 z" />
      <path d="M340 120 l1.5 4 l4 0 l-3 2.5 l1 4 l-3.5 -2.5 l-3 2.5 l1 -4 l-3 -2.5 l4 0 z" />
      <path d="M55 130 l1.5 4 l4 0 l-3 2.5 l1 4 l-3.5 -2.5 l-3 2.5 l1 -4 l-3 -2.5 l4 0 z" />
    </g>
  </svg>
);

// ----- Decorações pequenas (canto superior direito do container) -----------

const BalloonsDeco: React.FC = () => (
  <svg
    aria-hidden
    className="pointer-events-none absolute right-2 top-2 h-20 w-20 opacity-80 sm:h-24 sm:w-24"
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
  >
    <ellipse cx="30" cy="30" rx="12" ry="16" fill="#fb7185" />
    <ellipse cx="60" cy="40" rx="11" ry="14" fill="#f472b6" />
    <ellipse cx="50" cy="22" rx="9" ry="12" fill="#fda4af" />
    <path d="M30 46 Q32 58 28 75" stroke="#9ca3af" strokeWidth="1" fill="none" />
    <path d="M60 54 Q62 66 65 80" stroke="#9ca3af" strokeWidth="1" fill="none" />
    <path d="M50 34 Q52 48 48 68" stroke="#9ca3af" strokeWidth="1" fill="none" />
  </svg>
);

const BalloonsBlueDeco: React.FC = () => (
  <svg
    aria-hidden
    className="pointer-events-none absolute right-2 top-2 h-20 w-20 opacity-80 sm:h-24 sm:w-24"
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
  >
    <ellipse cx="30" cy="30" rx="12" ry="16" fill="#60a5fa" />
    <ellipse cx="60" cy="40" rx="11" ry="14" fill="#38bdf8" />
    <ellipse cx="50" cy="22" rx="9" ry="12" fill="#93c5fd" />
    <path d="M30 46 Q32 58 28 75" stroke="#9ca3af" strokeWidth="1" fill="none" />
    <path d="M60 54 Q62 66 65 80" stroke="#9ca3af" strokeWidth="1" fill="none" />
    <path d="M50 34 Q52 48 48 68" stroke="#9ca3af" strokeWidth="1" fill="none" />
  </svg>
);

const BubblesDeco: React.FC = () => (
  <svg
    aria-hidden
    className="pointer-events-none absolute right-2 top-2 h-20 w-20 opacity-70 sm:h-24 sm:w-24"
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="20" cy="80" r="10" fill="#5eead4" opacity="0.8" />
    <circle cx="40" cy="60" r="6" fill="#67e8f9" opacity="0.8" />
    <circle cx="55" cy="80" r="8" fill="#22d3ee" opacity="0.8" />
    <circle cx="75" cy="55" r="5" fill="#5eead4" opacity="0.8" />
    <circle cx="85" cy="78" r="7" fill="#67e8f9" opacity="0.8" />
  </svg>
);

const PalmDeco: React.FC = () => (
  <svg
    aria-hidden
    className="pointer-events-none absolute right-2 top-2 h-24 w-24 opacity-80 sm:h-28 sm:w-28"
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
    className="pointer-events-none absolute right-2 top-2 h-20 w-20 opacity-90 sm:h-24 sm:w-24"
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
    pattern: polkaDots('%23ec4899', '%23fb7185'),
    HeroArt: BalloonsHero,
    Decoration: BalloonsDeco
  },
  {
    id: 'infantil-azul',
    name: 'Infantil Azul',
    pageBg: 'bg-gradient-to-b from-sky-100 via-blue-50 to-white',
    titleColor: 'text-sky-900',
    accent: '#0284c7',
    cardClass: 'bg-white/90 backdrop-blur ring-1 ring-sky-200',
    pattern: cloudDots('%230284c7', '%233b82f6'),
    HeroArt: BalloonsBlueHero,
    Decoration: BalloonsBlueDeco
  },
  {
    id: 'aquatico',
    name: 'Aquático',
    pageBg: 'bg-gradient-to-b from-teal-100 via-cyan-50 to-white',
    titleColor: 'text-teal-900',
    accent: '#0d9488',
    cardClass: 'bg-white/90 backdrop-blur ring-1 ring-teal-200',
    pattern: waves('%230d9488', '%2306b6d4'),
    HeroArt: WaterHero,
    Decoration: BubblesDeco
  },
  {
    id: 'safari',
    name: 'Safari',
    pageBg: 'bg-gradient-to-b from-amber-100 via-yellow-50 to-white',
    titleColor: 'text-amber-900',
    accent: '#15803d',
    cardClass: 'bg-white/90 backdrop-blur ring-1 ring-amber-200',
    pattern: leaves('%2315803d', '%2365a30d'),
    HeroArt: SafariHero,
    Decoration: PalmDeco
  },
  {
    id: 'principe',
    name: 'Príncipe / Princesa',
    pageBg: 'bg-gradient-to-b from-yellow-100 via-amber-50 to-white',
    titleColor: 'text-yellow-900',
    accent: '#d97706',
    cardClass: 'bg-white/90 backdrop-blur ring-1 ring-yellow-200',
    pattern: stars('%23d97706', '%23fbbf24'),
    HeroArt: CrownHero,
    Decoration: CrownDeco
  }
];

export function getTheme(id?: string | null): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
