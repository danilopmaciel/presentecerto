'use client';

import { useEffect, useRef, useState } from 'react';

// Extrai rsvp_id de uma URL de convite ou de um UUID puro
const CONVITE_RE =
  /\/convite\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseRsvpId(raw: string): string | null {
  const m = CONVITE_RE.exec(raw);
  if (m) return m[1];
  const s = raw.trim();
  return UUID_RE.test(s) ? s : null;
}

type CheckResult = {
  guest_name: string;
  adults: number;
  children: number;
  already_checked_in: boolean;
  checked_in_at: string;
};

type UIPhase =
  | { tag: 'off' }
  | { tag: 'starting' }
  | { tag: 'scanning' }
  | { tag: 'processing' }
  | { tag: 'result'; data: CheckResult }
  | { tag: 'err'; msg: string };

type HistoryEntry = { name: string; time: string; isNew: boolean };

export function ScannerSection({ eventId }: { eventId: string }) {
  const [ui, setUi] = useState<UIPhase>({ tag: 'off' });
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef(0);
  const phaseRef = useRef<'idle' | 'scanning' | 'processing'>('idle');
  const lastIdRef = useRef('');
  // jsQR é importado dinamicamente para não quebrar SSR
  const jsQRRef =
    useRef<((d: Uint8ClampedArray, w: number, h: number) => { data: string } | null) | null>(null);

  // Carrega jsQR uma única vez no cliente
  useEffect(() => {
    import('jsqr').then((m) => {
      jsQRRef.current = m.default;
    });
    return cleanup;
  }, []);

  function cleanup() {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    phaseRef.current = 'idle';
  }

  async function startScanner() {
    setUi({ tag: 'starting' });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();
      phaseRef.current = 'scanning';
      setUi({ tag: 'scanning' });
      startLoop();
    } catch {
      setUi({ tag: 'err', msg: 'Câmera indisponível. Verifique as permissões do navegador.' });
    }
  }

  function startLoop() {
    let lastT = 0;
    function tick(t: number) {
      if (phaseRef.current !== 'scanning') return;
      rafRef.current = requestAnimationFrame(tick);
      if (t - lastT < 200) return; // ~5 fps — suficiente para QR code
      lastT = t;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const jsQR = jsQRRef.current;
      if (!video || !canvas || !jsQR || video.readyState < 2) return;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      const w = video.videoWidth;
      const h = video.videoHeight;
      if (!w || !h) return;

      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(video, 0, 0, w, h);
      const code = jsQR(ctx.getImageData(0, 0, w, h).data, w, h);
      if (!code) return;

      const rsvpId = parseRsvpId(code.data);
      if (!rsvpId || rsvpId === lastIdRef.current) return;

      lastIdRef.current = rsvpId;
      phaseRef.current = 'processing';
      cancelAnimationFrame(rafRef.current);
      setUi({ tag: 'processing' });
      doCheckIn(rsvpId);
    }
    rafRef.current = requestAnimationFrame(tick);
  }

  async function doCheckIn(rsvpId: string) {
    try {
      const res = await fetch('/api/check-in', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ rsvp_id: rsvpId })
      });
      const data: CheckResult = await res.json();
      if (!res.ok) throw new Error((data as unknown as { error: string }).error ?? 'Erro');

      setUi({ tag: 'result', data });
      setHistory((prev) => [
        {
          name: data.guest_name,
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          isNew: !data.already_checked_in
        },
        ...prev.slice(0, 29)
      ]);

      // Retoma scanner após mostrar resultado
      setTimeout(resumeScanning, 2500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      setUi({ tag: 'err', msg });
      setTimeout(resumeScanning, 2000);
    }
  }

  function resumeScanning() {
    lastIdRef.current = '';
    phaseRef.current = 'scanning';
    setUi({ tag: 'scanning' });
    startLoop();
  }

  function stopScanner() {
    cleanup();
    setUi({ tag: 'off' });
    lastIdRef.current = '';
  }

  const isActive = ui.tag !== 'off';

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Scanner de Entrada</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Escaneie o QR code do convite para registrar a chegada de cada convidado.
          </p>
        </div>
        {isActive && (
          <button onClick={stopScanner} className="text-sm text-gray-400 hover:text-gray-600">
            ✕ Fechar
          </button>
        )}
      </div>

      {/* Botão iniciar */}
      {ui.tag === 'off' && (
        <button
          onClick={startScanner}
          className="mt-4 flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 active:scale-95"
        >
          <span>📷</span>
          <span>Ativar scanner</span>
        </button>
      )}

      {/* Área da câmera */}
      {isActive && (
        <div className="mt-4">
          <div className="relative overflow-hidden rounded-xl bg-gray-900">
            {/* Vídeo da câmera */}
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full"
              style={{
                display: ui.tag === 'scanning' || ui.tag === 'processing' ? 'block' : 'none'
              }}
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Mira de scan */}
            {ui.tag === 'scanning' && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="relative h-52 w-52">
                  {/* Cantos da mira */}
                  {[
                    'top-0 left-0 border-t-4 border-l-4 rounded-tl-lg',
                    'top-0 right-0 border-t-4 border-r-4 rounded-tr-lg',
                    'bottom-0 left-0 border-b-4 border-l-4 rounded-bl-lg',
                    'bottom-0 right-0 border-b-4 border-r-4 rounded-br-lg'
                  ].map((cls, i) => (
                    <span
                      key={i}
                      className={`absolute h-8 w-8 border-white ${cls}`}
                      style={{ opacity: 0.85 }}
                    />
                  ))}
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white/60">
                    Aponte para o QR code
                  </span>
                </div>
              </div>
            )}

            {/* Estados de overlay */}
            {ui.tag === 'starting' && (
              <div className="flex h-56 items-center justify-center gap-2 text-white">
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                <span className="text-sm">Iniciando câmera…</span>
              </div>
            )}

            {ui.tag === 'processing' && (
              <div className="absolute inset-0 flex h-56 items-center justify-center bg-black/70">
                <div className="text-center text-white">
                  <svg className="mx-auto h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  <p className="mt-2 text-sm">Verificando convite…</p>
                </div>
              </div>
            )}

            {ui.tag === 'result' && (
              <div
                className={`flex min-h-[14rem] flex-col items-center justify-center gap-2 p-6 text-center ${
                  ui.data.already_checked_in ? 'bg-amber-50' : 'bg-emerald-50'
                }`}
              >
                <div className="text-5xl">
                  {ui.data.already_checked_in ? '⚠️' : '✅'}
                </div>
                <div className="text-xl font-bold text-gray-900">{ui.data.guest_name}</div>
                <div className="text-sm text-gray-600">
                  {ui.data.adults} adulto{ui.data.adults !== 1 ? 's' : ''}
                  {ui.data.children > 0 &&
                    ` · ${ui.data.children} criança${ui.data.children !== 1 ? 's' : ''}`}
                </div>
                {ui.data.already_checked_in ? (
                  <div className="mt-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                    Convite já utilizado às{' '}
                    {new Date(ui.data.checked_in_at).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                ) : (
                  <div className="mt-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                    Check-in registrado!
                  </div>
                )}
              </div>
            )}

            {ui.tag === 'err' && (
              <div className="flex min-h-[14rem] flex-col items-center justify-center gap-3 bg-red-50 p-6 text-center">
                <div className="text-4xl">❌</div>
                <p className="text-sm font-medium text-red-700">{ui.msg}</p>
                <button
                  onClick={startScanner}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
                >
                  Tentar novamente
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Histórico de check-ins desta sessão */}
      {history.length > 0 && (
        <div className="mt-5">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Registros desta sessão
          </div>
          <ul className="divide-y divide-gray-100">
            {history.map((h, i) => (
              <li key={i} className="flex items-center gap-3 py-2 text-sm">
                <span className="text-base">{h.isNew ? '✅' : '⚠️'}</span>
                <span className="flex-1 font-medium text-gray-800">{h.name}</span>
                <span className="text-xs text-gray-400">{h.time}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
