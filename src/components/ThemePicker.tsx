'use client';

import { useOptimistic, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { THEMES } from '@/lib/themes';
import { CustomThemeEditor } from './CustomThemeEditor';
import { AiImageModal } from './AiImageModal';
import { extractPalette, type Palette } from '@/lib/colors';

const CUSTOM_ID = '__custom__';

type SaveCustom = (formData: FormData) => Promise<{ error?: string } | void>;
type ClearCustom = () => Promise<void>;

export function ThemePicker({
  currentTheme,
  onSelect,
  customBgUrl,
  customPalette,
  onSaveCustom,
  onClearCustom,
  eventId,
  aiEnabled = false
}: {
  currentTheme: string;
  onSelect: (themeId: string) => Promise<void>;
  customBgUrl?: string | null;
  customPalette?: Palette | null;
  /** Se passado, o card "Personalizado" fica visível e abre o editor. */
  onSaveCustom?: SaveCustom;
  onClearCustom?: ClearCustom;
  /** Necessário pro botão IA dentro do editor de custom funcionar */
  eventId?: string;
  /** Mostra o botão "✨ Gerar com IA" no editor de custom */
  aiEnabled?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // Tema "ativo" do ponto de vista do picker:
  // - Se tem custom_bg_path no evento, é o card __custom__
  // - Caso contrário, é o currentTheme do banco
  const activeId = customBgUrl ? CUSTOM_ID : currentTheme;
  const [optimisticTheme, setOptimisticTheme] = useOptimistic(activeId);

  // Quando o usuário clica em "Personalizado", abrimos o editor.
  // Quando salva no editor, automaticamente vira o ativo.
  const [customOpen, setCustomOpen] = useState(activeId === CUSTOM_ID);

  // Modal de geração por IA acionado pelo card "Criar com IA"
  const [aiOpen, setAiOpen] = useState(false);
  const [aiSaving, setAiSaving] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Quando a IA devolve uma imagem, aplica direto como tema personalizado:
  // extrai a paleta e salva via onSaveCustom.
  async function applyAiImage(url: string) {
    if (!onSaveCustom) return;
    setAiSaving(true);
    setAiError(null);
    try {
      const palette = await extractPalette(url);
      const fd = new FormData();
      fd.set('bg_url', url);
      fd.set('palette', JSON.stringify(palette));
      const res = (await onSaveCustom(fd)) ?? {};
      if (res.error) {
        setAiError(res.error);
        return;
      }
      setCustomOpen(true);
      router.refresh();
    } catch {
      setAiError('Imagem gerada, mas não consegui extrair a paleta. Tente abrir em "Personalizado".');
    } finally {
      setAiSaving(false);
    }
  }

  function select(themeId: string) {
    if (themeId === optimisticTheme) {
      // Re-clicar no Custom abre/fecha o editor
      if (themeId === CUSTOM_ID) setCustomOpen((v) => !v);
      return;
    }

    if (themeId === CUSTOM_ID) {
      // Apenas abre o editor — não muda o tema no banco até salvar
      setCustomOpen(true);
      return;
    }

    // Selecionou um tema pronto — fecha o editor de custom
    setCustomOpen(false);
    startTransition(async () => {
      setOptimisticTheme(themeId);
      // Se tinha custom ativo, limpa primeiro
      if (customBgUrl && onClearCustom) {
        await onClearCustom();
      }
      await onSelect(themeId);
      router.refresh();
    });
  }

  const customEnabled = !!onSaveCustom;

  return (
    <div className="mt-4 space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {/* Card "Criar com IA" — primeira opção do temático */}
        {aiEnabled && customEnabled && (
          <button
            type="button"
            onClick={() => setAiOpen(true)}
            disabled={aiSaving || !eventId}
            title={!eventId ? 'Salve o evento antes de usar IA' : 'Gerar um fundo único por IA'}
            className="group relative overflow-hidden rounded-lg border-2 border-purple-300 text-left transition hover:border-purple-500 disabled:opacity-60"
          >
            <div className="relative h-24 w-full overflow-hidden bg-gradient-to-br from-brand-100 via-purple-100 to-pink-100">
              <div className="absolute inset-0 flex items-center justify-center text-4xl transition group-hover:scale-110">
                {aiSaving ? '⏳' : '✨'}
              </div>
              <div className="absolute right-1.5 top-1.5 rounded-full bg-purple-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow">
                IA
              </div>
            </div>
            <div className="px-3 py-2">
              <div className="text-sm font-semibold text-purple-700">Criar com IA</div>
              <div className="mt-0.5 text-xs text-gray-600">
                {aiSaving ? 'Aplicando...' : 'Descreva e a IA cria o fundo'}
              </div>
            </div>
          </button>
        )}

        {THEMES.map((t) => {
          const selected = optimisticTheme === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => select(t.id)}
              disabled={pending && !selected}
              className={`overflow-hidden rounded-lg border-2 text-left transition ${
                selected
                  ? 'border-brand-500 ring-2 ring-brand-200'
                  : 'border-gray-200 hover:border-gray-300'
              } ${pending && !selected ? 'opacity-60' : ''}`}
            >
              <div
                className={`relative h-24 w-full overflow-hidden ${t.pageBg}`}
                style={t.pattern ? { backgroundImage: t.pattern } : undefined}
              >
                {t.HeroArt ? (
                  <div className="absolute inset-0 -translate-y-1 scale-[0.7] origin-center">
                    <t.HeroArt />
                  </div>
                ) : t.Decoration ? (
                  <div className="absolute inset-0 origin-top-right scale-[0.55]">
                    <t.Decoration />
                  </div>
                ) : null}
                {selected && (
                  <div className="absolute right-1.5 top-1.5 rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-medium text-white shadow">
                    ✓ Ativo
                  </div>
                )}
              </div>
              <div className="px-3 py-2">
                <div className={`text-sm font-medium ${t.titleColor}`}>{t.name}</div>
                <div className="mt-0.5 text-xs text-gray-500">
                  {selected ? 'Aplicado na página' : 'Clique para aplicar'}
                </div>
              </div>
            </button>
          );
        })}

        {/* Card Personalizado — destaque maior pra atrair clique */}
        {customEnabled && (
          <button
            type="button"
            onClick={() => select(CUSTOM_ID)}
            disabled={pending && optimisticTheme !== CUSTOM_ID}
            className={`group relative overflow-hidden rounded-lg border-2 text-left transition ${
              optimisticTheme === CUSTOM_ID
                ? 'border-brand-500 ring-2 ring-brand-200'
                : 'border-dashed border-brand-400 hover:border-solid hover:border-brand-500'
            } ${pending && optimisticTheme !== CUSTOM_ID ? 'opacity-60' : ''}`}
            style={
              customBgUrl
                ? {
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.4), rgba(255,255,255,0.4)), url(${customBgUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }
                : undefined
            }
          >
            <div
              className={`relative h-24 w-full overflow-hidden ${
                customBgUrl
                  ? ''
                  : 'bg-gradient-to-br from-brand-100 via-purple-100 to-pink-100'
              }`}
            >
              {!customBgUrl && (
                <>
                  <div className="absolute inset-0 flex items-center justify-center text-4xl">
                    ✨
                  </div>
                  <div className="absolute right-1.5 top-1.5 rounded-full bg-brand-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow">
                    Novo
                  </div>
                </>
              )}
              {customBgUrl && optimisticTheme === CUSTOM_ID && (
                <div className="absolute right-1.5 top-1.5 rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-medium text-white shadow">
                  ✓ Ativo
                </div>
              )}
            </div>
            <div className="px-3 py-2">
              <div className="text-sm font-semibold text-brand-700">
                Personalizado
              </div>
              <div className="mt-0.5 text-xs text-gray-600">
                {customBgUrl
                  ? customOpen
                    ? 'Editando...'
                    : 'Sua imagem · clique pra editar'
                  : 'Use sua imagem'}
              </div>
            </div>
          </button>
        )}
      </div>

      {aiError && (
        <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          {aiError}
        </div>
      )}

      {/* Modal de geração por IA (aplica como tema personalizado ao escolher) */}
      {aiEnabled && (
        <AiImageModal
          open={aiOpen}
          onClose={() => setAiOpen(false)}
          onPick={applyAiImage}
          scope="bg"
          eventId={eventId}
        />
      )}

      {/* Editor inline do tema personalizado */}
      {customEnabled && customOpen && onSaveCustom && onClearCustom && (
        <div className="rounded-lg border-2 border-brand-300 bg-brand-50/30 p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold">✨ Tema personalizado</h3>
              <p className="mt-0.5 text-xs text-gray-600">
                Carregue uma imagem (foto da decoração, arte do tema, capa). A paleta da página
                é extraída automaticamente — nada de mexer em códigos hex.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCustomOpen(false)}
              className="shrink-0 rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              aria-label="Fechar editor"
            >
              ✕
            </button>
          </div>
          <CustomThemeEditor
            currentBgUrl={customBgUrl ?? null}
            currentPalette={customPalette ?? null}
            onSave={onSaveCustom}
            onClear={onClearCustom}
            eventId={eventId}
            enableAi={aiEnabled}
          />
        </div>
      )}
    </div>
  );
}
