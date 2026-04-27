'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { createClient } from '@/lib/supabase/client';
import { formatBRL } from '@/lib/utils';
import { CopyButton } from '@/components/CopyButton';

type Gift = {
  id: string;
  title: string;
  description: string | null;
  image_path: string | null;
  quota_value_cents: number;
  quota_total: number;
  reserved: number;
  available: number;
};

export function RsvpAndGiftForm({
  eventId,
  gifts,
  cardClass,
  accent
}: {
  eventId: string;
  gifts: Gift[];
  cardClass?: string;
  accent?: string;
}) {
  const [rsvpOpen, setRsvpOpen] = useState(false);
  const [rsvpDone, setRsvpDone] = useState(false);
  const [rsvpId, setRsvpId] = useState<string | null>(null);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');

  const baseCard = cardClass ?? 'bg-white';

  return (
    <div className="mt-10 space-y-8">
      {/* RSVP — botão grande que expande o form */}
      {!rsvpDone ? (
        rsvpOpen ? (
          <RsvpForm
            eventId={eventId}
            cardClass={baseCard}
            accent={accent}
            onCancel={() => setRsvpOpen(false)}
            onDone={(id, name, email) => {
              setRsvpId(id);
              setGuestName(name);
              setGuestEmail(email);
              setRsvpDone(true);
              setRsvpOpen(false);
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setRsvpOpen(true)}
            className="block w-full rounded-2xl px-6 py-5 text-center text-lg font-semibold text-white shadow-lg ring-2 ring-white/40 transition hover:scale-[1.01] hover:shadow-xl active:scale-[0.99]"
            style={{
              background: accent
                ? `linear-gradient(135deg, ${accent}, ${accent}cc)`
                : 'linear-gradient(135deg, #ef4444, #f97316)'
            }}
          >
            Clique aqui para confirmar presença ✅
          </button>
        )
      ) : (
        <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          Presença confirmada, {guestName}! Obrigado por vir. ✨
        </div>
      )}

      <section>
        <h2 className="text-lg font-semibold">Lista de presentes</h2>
        <p className="text-sm text-gray-600">
          Cada presente é dividido em cotas. Você escolhe quantas quer presentear.
        </p>
        <div className="mt-4 space-y-3">
          {gifts.map((g) => (
            <GiftCard
              key={g.id}
              gift={g}
              defaultBuyerName={guestName}
              defaultBuyerEmail={guestEmail}
              rsvpId={rsvpId}
              cardClass={baseCard}
              accent={accent}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function RsvpForm({
  eventId,
  onDone,
  onCancel,
  cardClass = 'bg-white',
  accent
}: {
  eventId: string;
  onDone: (id: string, name: string, email: string) => void;
  onCancel: () => void;
  cardClass?: string;
  accent?: string;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      event_id: eventId,
      guest_name: String(fd.get('guest_name') ?? ''),
      guest_email: String(fd.get('guest_email') ?? ''),
      guest_phone: String(fd.get('guest_phone') ?? ''),
      adults: Number(fd.get('adults') ?? 1),
      children: Number(fd.get('children') ?? 0),
      note: String(fd.get('note') ?? '')
    };

    const supabase = createClient();
    const { data, error } = await supabase
      .from('rsvps')
      .insert(payload)
      .select('id')
      .single();
    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    onDone(data!.id, payload.guest_name, payload.guest_email);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`space-y-3 rounded-lg p-6 shadow-sm ${cardClass}`}
      style={accent ? { borderTop: `4px solid ${accent}` } : undefined}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Confirmar presença</h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          Cancelar
        </button>
      </div>
      <input
        name="guest_name"
        required
        placeholder="Seu nome"
        className="w-full rounded-md border border-gray-300 px-3 py-2"
      />
      <input
        name="guest_email"
        type="email"
        placeholder="E-mail (opcional)"
        className="w-full rounded-md border border-gray-300 px-3 py-2"
      />
      <input
        name="guest_phone"
        placeholder="Telefone/WhatsApp (opcional)"
        className="w-full rounded-md border border-gray-300 px-3 py-2"
      />
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm">
          Adultos
          <input
            name="adults"
            type="number"
            min={0}
            defaultValue={1}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </label>
        <label className="text-sm">
          Crianças
          <input
            name="children"
            type="number"
            min={0}
            defaultValue={0}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </label>
      </div>
      <textarea
        name="note"
        rows={2}
        placeholder="Observação (restrição alimentar etc)"
        className="w-full rounded-md border border-gray-300 px-3 py-2"
      />
      <button
        disabled={submitting}
        className="w-full rounded-md py-2 text-white shadow-sm hover:opacity-90 disabled:opacity-60"
        style={{ background: accent ?? '#3b82f6' }}
      >
        {submitting ? 'Enviando...' : 'Confirmar presença'}
      </button>
      {error && <div className="text-sm text-red-600">{error}</div>}
    </form>
  );
}

function ProgressBar({
  reserved,
  total,
  accent
}: {
  reserved: number;
  total: number;
  accent?: string;
}) {
  const pct = total > 0 ? Math.min(100, Math.round((reserved / total) * 100)) : 0;
  const c = accent ?? '#10b981';
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between text-[11px] text-gray-600">
        <span>
          {reserved} de {total} cotas
        </span>
        <span className="font-medium">{pct}%</span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${c}, ${c}aa)`
          }}
        />
      </div>
    </div>
  );
}

function SoldOutStamp() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
      <div
        className="select-none rounded-md border-4 border-red-600 px-4 py-1 text-xl font-extrabold tracking-widest text-red-600 shadow-lg"
        style={{
          transform: 'rotate(-18deg)',
          background: 'rgba(255,255,255,0.85)',
          letterSpacing: '0.15em'
        }}
      >
        ESGOTADO
      </div>
    </div>
  );
}

function GiftCard({
  gift,
  defaultBuyerName,
  defaultBuyerEmail,
  rsvpId,
  cardClass = 'bg-white',
  accent
}: {
  gift: Gift;
  defaultBuyerName: string;
  defaultBuyerEmail: string;
  rsvpId: string | null;
  cardClass?: string;
  accent?: string;
}) {
  const [open, setOpen] = useState(false);
  const [quotas, setQuotas] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ id: string; pix_payload: string; amount_cents: number } | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const soldOut = gift.available <= 0;

  useEffect(() => {
    if (!result?.pix_payload) {
      setQrDataUrl(null);
      return;
    }
    let cancelled = false;
    QRCode.toDataURL(result.pix_payload, { margin: 1, width: 220 })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [result?.pix_payload]);

  async function handleBuy(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const body = {
      gift_item_id: gift.id,
      quotas,
      buyer_name: String(fd.get('buyer_name') ?? defaultBuyerName),
      buyer_email: String(fd.get('buyer_email') ?? defaultBuyerEmail),
      buyer_phone: String(fd.get('buyer_phone') ?? ''),
      rsvp_id: rsvpId ?? undefined
    };
    const res = await fetch('/api/purchases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    });
    const json = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(json.error ?? 'Erro ao gerar Pix');
      return;
    }
    setResult(json);
  }

  return (
    <div
      className={`relative rounded-lg p-4 shadow-sm ${cardClass} ${
        soldOut ? 'overflow-hidden' : ''
      }`}
      style={accent ? { borderLeft: `4px solid ${accent}` } : undefined}
    >
      <div className="flex items-center gap-4">
        {gift.image_path && (
          <div className="relative shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={gift.image_path}
              alt={gift.title}
              className={`h-20 w-20 rounded-md object-cover ${
                soldOut ? 'opacity-60 grayscale' : ''
              }`}
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="font-medium">{gift.title}</div>
            {soldOut && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-700">
                Esgotado
              </span>
            )}
          </div>
          {gift.description && (
            <div className="text-sm text-gray-600">{gift.description}</div>
          )}
          <div className="mt-1 text-sm text-gray-500">
            {formatBRL(gift.quota_value_cents)} / cota
            {!soldOut && ` · ${gift.available} cotas disponíveis`}
          </div>
          <ProgressBar
            reserved={gift.reserved}
            total={gift.quota_total}
            accent={accent}
          />
        </div>
        {!soldOut && (
          <button
            onClick={() => setOpen((v) => !v)}
            className="shrink-0 rounded-md px-3 py-1.5 text-sm text-white shadow-sm hover:opacity-90"
            style={{ background: accent ?? '#3b82f6' }}
          >
            Presentear
          </button>
        )}
      </div>

      {soldOut && <SoldOutStamp />}

      {open && !result && !soldOut && (
        <form
          onSubmit={handleBuy}
          className="mt-4 space-y-3 border-t border-gray-100 pt-4"
        >
          <label className="block text-sm">
            Quantas cotas?
            <input
              type="number"
              min={1}
              max={gift.available}
              value={quotas}
              onChange={(e) =>
                setQuotas(
                  Math.max(1, Math.min(gift.available, Number(e.target.value)))
                )
              }
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>
          <input
            name="buyer_name"
            required
            defaultValue={defaultBuyerName}
            placeholder="Seu nome"
            className="w-full rounded-md border border-gray-300 px-3 py-2"
          />
          <input
            name="buyer_email"
            type="email"
            defaultValue={defaultBuyerEmail}
            placeholder="E-mail para o recibo"
            className="w-full rounded-md border border-gray-300 px-3 py-2"
          />
          <input
            name="buyer_phone"
            placeholder="WhatsApp (opcional)"
            className="w-full rounded-md border border-gray-300 px-3 py-2"
          />
          <div className="text-sm text-gray-700">
            Total: <strong>{formatBRL(gift.quota_value_cents * quotas)}</strong>
          </div>
          <button
            disabled={submitting}
            className="w-full rounded-md py-2 text-white shadow-sm hover:opacity-90 disabled:opacity-60"
            style={{ background: accent ?? '#3b82f6' }}
          >
            {submitting ? 'Gerando Pix...' : 'Gerar Pix'}
          </button>
          {error && <div className="text-sm text-red-600">{error}</div>}
        </form>
      )}

      {result && (
        <div className="mt-4 space-y-4 border-t border-gray-100 pt-4">
          <div className="rounded-md bg-gray-50 p-3 text-xs text-gray-600">
            <p className="font-medium text-gray-700">Como pagar:</p>
            <p className="mt-1">
              <strong>No celular:</strong> abra o app do seu banco, escolha "Pagar com Pix" →
              "Ler QR Code" e aponte para o código abaixo.
            </p>
            <p className="mt-1">
              <strong>No computador:</strong> copie o código Pix copia-e-cola, abra o app do seu
              banco no celular e cole em "Pix copia-e-cola".
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-start">
            {qrDataUrl && (
              <div className="mx-auto sm:mx-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrDataUrl}
                  alt="QR Code para pagamento Pix"
                  className="h-40 w-40 rounded-md border border-gray-200 bg-white p-1"
                />
                <p className="mt-1 text-center text-[11px] text-gray-500">
                  Aponte a câmera do banco
                </p>
              </div>
            )}
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-700">Pix copia-e-cola</div>
              <div className="max-h-28 overflow-auto rounded-md border border-gray-200 bg-white p-3 font-mono text-[11px] break-all">
                {result.pix_payload}
              </div>
              <CopyButton
                text={result.pix_payload}
                label="Copiar código Pix"
                className="w-full"
              />
            </div>
          </div>

          <div className="rounded-md border border-dashed border-gray-300 bg-white p-3 text-xs text-gray-600">
            Depois de pagar, avise o anfitrião clicando em <strong>Já paguei</strong>. A cota fica
            reservada e o anfitrião confirma o recebimento.
          </div>

          {!confirmed ? (
            <button
              type="button"
              disabled={confirming}
              onClick={async () => {
                if (!result?.id) {
                  setConfirmed(true);
                  return;
                }
                setConfirming(true);
                try {
                  await fetch(`/api/purchases/${result.id}/mark-paid`, {
                    method: 'POST'
                  });
                } catch {
                  // falha silenciosa — anfitrião pode acompanhar manualmente
                }
                setConfirming(false);
                setConfirmed(true);
              }}
              className="w-full rounded-md border py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
              style={{
                borderColor: accent ?? '#3b82f6',
                color: accent ?? '#3b82f6'
              }}
            >
              {confirming ? 'Avisando...' : 'Já paguei ✓'}
            </button>
          ) : (
            <div className="rounded-md border border-green-200 bg-green-50 p-3 text-center text-xs text-green-800">
              🎉 Obrigado! O anfitrião foi avisado e vai confirmar o recebimento.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
