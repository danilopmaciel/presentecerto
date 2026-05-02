import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/app';

  // Provedor OAuth pode devolver erro direto na URL (ex.: usuário negou permissão)
  const oauthError = searchParams.get('error');
  const oauthErrorDescription = searchParams.get('error_description');
  if (oauthError) {
    const reason = encodeURIComponent(oauthErrorDescription || oauthError);
    return NextResponse.redirect(`${origin}/login?error=oauth&reason=${reason}`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    // Loga no servidor pra inspecionar nos logs da Vercel
    console.error('[auth/callback] exchangeCodeForSession failed:', error);
    const reason = encodeURIComponent(error.message);
    return NextResponse.redirect(`${origin}/login?error=exchange&reason=${reason}`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
