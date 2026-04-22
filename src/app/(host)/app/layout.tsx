import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function HostLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  async function signOut() {
    'use server';
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/app" className="text-lg font-bold text-brand-700">
            PresenteCerto
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-600">{user.email}</span>
            <form action={signOut}>
              <button className="rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-50">
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
