'use client';

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white shadow hover:bg-brand-600 active:scale-95"
    >
      🖨️ Imprimir / Salvar PDF
    </button>
  );
}
