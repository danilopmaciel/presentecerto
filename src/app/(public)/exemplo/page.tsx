import { redirect } from 'next/navigation';

// /exemplo agora não existe como página separada — a melhor "demo" é o próprio
// rascunho em /criar (sem login, salvo no localStorage). Mantemos o redirect
// pra não quebrar links antigos compartilhados/marketing.
export default function ExamplePage() {
  redirect('/criar');
}
