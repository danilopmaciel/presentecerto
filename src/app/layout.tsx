import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PresenteCerto — Lista de presentes + RSVP com Pix',
  description:
    'Crie um evento, compartilhe seu link e receba confirmações e cotas de presente via Pix. Sem complicação.',
  openGraph: {
    title: 'PresenteCerto',
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
