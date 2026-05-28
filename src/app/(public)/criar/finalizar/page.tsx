import { redirect } from 'next/navigation';

// O fluxo de finalização agora é inline em /criar — esta rota fica só pra não
// quebrar links antigos (magic-links que ainda estavam no email, etc).
export default function FinalizarRedirect() {
  redirect('/criar');
}
