import { updateSession } from '@/lib/supabase/middleware';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Tudo, exceto:
    // - assets estáticos
    // - /auth/callback: precisa que a rota controle os cookies do exchange PKCE
    //   diretamente. Se o middleware rodar antes e chamar getUser(), pode
    //   atrapalhar o code_verifier que ainda não foi trocado.
    // - /api/*: rotas de API gerenciam auth próprio
    '/((?!auth/callback|api/|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
};
