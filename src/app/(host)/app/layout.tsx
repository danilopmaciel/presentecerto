import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/admin';

export default async function HostLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const isAdmin = isAdminEmail(user.email);

  // Conta pendentes pra mostrar um badge no link "Admin".
  // Usa admin client porque o admin precisa enxergar todos os eventos (não só os dele).
  let pendingCount = 0;
  if (isAdmin) {
    const adminCli = createAdminClient();
    const { count } = await adminCli
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('plan_payment_status', 'paid_claimed');
    pendingCount = count ?? 0;
  }

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
            {isAdmin && (
              <Link
                href="/app/admin"
                className="relative rounded-md border border-yellow-300 bg-yellow-50 px-3 py-1.5 font-medium text-yellow-900 hover:bg-yellow-100"
              >
                Admin
                {pendingCount > 0 && (
                  <span className="ml-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1.5 text-[11px] font-semibold text-white">
                    {pendingCount}
                  </span>
                )}
              </Link>
            )}
            <Link
              href="/app/conta"
              className="rounded-md px-3 py-1.5 text-gray-700 hover:bg-gray-100"
            >
              Conta
            </Link>
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
