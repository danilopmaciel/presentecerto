import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { uniqueSlug } from '@/lib/utils';
import { eventCreateSchema } from '@/lib/validation/schemas';

export default function NewEventPage() {
  async function createEvent(formData: FormData) {
    'use server';
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const parsed = eventCreateSchema.parse({
      title: formData.get('title'),
      description: formData.get('description') ?? '',
      starts_at: new Date(formData.get('starts_at') as string).toISOString(),
      location_text: formData.get('location_text') ?? '',
      location_maps_url: formData.get('location_maps_url') ?? '',
      plan_tier: (formData.get('plan_tier') as string) ?? 'basic',
      pix_key: formData.get('pix_key') as string
    });

    // garante que existe pix_key no perfil (Fase 1)
    await supabase
      .from('profiles')
      .update({ pix_key: parsed.pix_key })
      .eq('id', user.id);

    const slug = uniqueSlug(parsed.title);
    const planFeeCents = parsed.plan_tier === 'themed' ? 5000 : 2000;

    const { data: event, error } = await supabase
      .from('events')
      .insert({
        owner_id: user.id,
        slug,
        title: parsed.title,
        description: parsed.description || null,
        starts_at: parsed.starts_at,
        location_text: parsed.location_text || null,
        location_maps_url: parsed.location_maps_url || null,
        plan_tier: parsed.plan_tier,
        plan_fee_cents: planFeeCents,
        status: 'draft'
      })
      .select('id')
      .single();

    if (error) throw error;
    redirect(`/app/eventos/${event.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">Novo evento</h1>
      <p className="mt-1 text-sm text-gray-600">
        Preencha os dados principais. Você poderá adicionar a lista de presentes na próxima tela.
      </p>

      <form action={createEvent} className="mt-6 space-y-4">
        <Field label="Título do evento">
          <input
            name="title"
            required
            placeholder="Aniversário de 3 anos"
            className="w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </Field>

        <Field label="Data e hora">
          <input
            type="datetime-local"
            name="starts_at"
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </Field>

        <Field label="Local (texto)">
          <input
            name="location_text"
            placeholder="Buffet Felicidade — São Paulo, SP"
            className="w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </Field>

        <Field label="Link do Google Maps (opcional)">
          <input
            name="location_maps_url"
            type="url"
            placeholder="https://maps.google.com/..."
            className="w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </Field>

        <Field label="Descrição (opcional)">
          <textarea
            name="description"
            rows={3}
            placeholder="Mensagem de boas-vindas, detalhes da festa, dress code..."
            className="w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </Field>

        <Field label="Sua chave Pix (para receber os presentes)">
          <input
            name="pix_key"
            required
            placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"
            className="w-full rounded-md border border-gray-300 px-3 py-2"
          />
          <p className="mt-1 text-xs text-gray-500">
            Os presentes vão direto para a sua chave Pix. O PresenteCerto não retém o dinheiro.
          </p>
        </Field>

        <fieldset className="rounded-md border border-gray-200 p-4">
          <legend className="px-2 text-sm font-medium">Plano</legend>
          <label className="flex items-start gap-3 py-2">
            <input type="radio" name="plan_tier" value="basic" defaultChecked />
            <div>
              <div className="font-medium">Básico — R$ 20</div>
              <div className="text-sm text-gray-600">
                Página do evento, RSVP, lista de cotas, painel do anfitrião.
              </div>
            </div>
          </label>
          <label className="flex items-start gap-3 py-2">
            <input type="radio" name="plan_tier" value="themed" />
            <div>
              <div className="font-medium">Temático — R$ 50</div>
              <div className="text-sm text-gray-600">
                Tudo do básico + tema personalizado + convites e lembretes por WhatsApp/e-mail.
              </div>
            </div>
          </label>
        </fieldset>

        <button
          type="submit"
          className="rounded-md bg-brand-500 px-6 py-2.5 text-white hover:bg-brand-600"
        >
          Criar rascunho
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      {children}
    </label>
  );
}
