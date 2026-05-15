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

    // PKCE failure → cookies de auth sujos. Limpa pra usuário poder tentar de novo
    // sem precisar abrir aba anônima ou apagar cookies manualmente.
    const isPkceError = /code verifier|PKCE/i.test(error.message);
    if (isPkceError) {
      const response = NextResponse.redirect(
        `${origin}/login?error=exchange&reason=pkce&retry=1`
      );
      // Apaga TODOS os cookies do Supabase pra zerar o estado de auth
      for (const cookie of request.headers.get('cookie')?.split(';') ?? []) {
        const name = cookie.split('=')[0]?.trim();
        if (name && name.startsWith('sb-')) {
          response.cookies.set(name, '', { maxAge: 0, path: '/' });
        }
      }
      return response;
    }

    const reason = encodeURIComponent(error.message);
    return NextResponse.redirect(`${origin}/login?error=exchange&reason=${reason}`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
