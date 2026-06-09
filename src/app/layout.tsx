import './globals.css';
import type { Metadata, Viewport } from 'next';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover'
};

export const metadata: Metadata = {
  title: 'Presente no Pix — Lista de presentes + RSVP em um link',
  description:
    'Seus convidados querem acertar o presente. Lista em cotas de Pix, confirmação de presença e tudo num link. Sem repetir, sem trocar.',
  openGraph: {
    title: 'Presente no Pix',
    description: 'Lista de presentes com cotas em Pix + RSVP para o seu evento.',
    type: 'website'
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
