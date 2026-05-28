import { redirect } from 'next/navigation';

export default async function NewEventPage({
  searchParams
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const sp = await searchParams;
  const plan = sp.plan === 'themed' ? 'themed' : 'basic';
  redirect(`/criar?plan=${plan}`);
}
