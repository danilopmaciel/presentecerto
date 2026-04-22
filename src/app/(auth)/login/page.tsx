'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [err, setErr] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setErr(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
    if (error) {
      setErr(error.message);
      setStatus('error');
    } else {
      setStatus('sent');
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="text-2xl font-bold">Entrar no PresenteCerto</h1>
      <p className="mt-2 text-sm text-gray-600">
        Enviaremos um link mágico para o seu e-mail. Sem senha.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full rounded-md bg-brand-500 px-4 py-2 text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {status === 'loading' ? 'Enviando...' : 'Receber link'}
        </button>
      </form>

      {status === 'sent' && (
        <div className="mt-6 rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          Link enviado! Confira seu e-mail (pode ir para o spam).
        </div>
      )}
      {status === 'error' && err && (
        <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {err}
        </div>
      )}
    </main>
  );
}
