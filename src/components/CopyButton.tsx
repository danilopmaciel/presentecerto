'use client';

import { useState } from 'react';

export function CopyButton({
  text,
  label = 'Copiar Pix copia-e-cola',
  className = ''
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback silencioso — usuário pode copiar manualmente
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 ${className}`}
    >
      {copied ? '✓ Copiado!' : label}
    </button>
  );
}
