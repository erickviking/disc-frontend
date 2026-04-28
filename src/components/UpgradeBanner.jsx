import { useState } from 'react';
import { X, ArrowRight } from 'lucide-react';

const DISMISS_KEY = 'upgrade_banner_dismissed_at';
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const CHECKOUT_URL = 'https://pay.hotmart.com/N105573480U';

function readInitialDismissed() {
  if (typeof window === 'undefined') return true;
  const ts = window.localStorage.getItem(DISMISS_KEY);
  if (!ts) return false;
  const elapsed = Date.now() - Number(ts);
  if (Number.isNaN(elapsed) || elapsed >= DISMISS_TTL_MS) {
    window.localStorage.removeItem(DISMISS_KEY);
    return false;
  }
  return true;
}

export function UpgradeBanner({ userEmail }) {
  const [dismissed, setDismissed] = useState(readInitialDismissed);

  if (dismissed) return null;

  const handleDismiss = () => {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissed(true);
  };

  const handleCTA = () => {
    const url = CHECKOUT_URL + (userEmail ? '?email=' + encodeURIComponent(userEmail) : '');
    window.open(url, '_blank');
  };

  return (
    <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-primary/15 via-surface-container to-surface-container border border-primary/30 p-6 md:p-7">
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Fechar banner"
        className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-surface-container-high/60 hover:bg-surface-container-high text-on-surface-variant transition-colors"
      >
        <X size={14} />
      </button>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 md:gap-6 items-center">
        <div className="pr-8 md:pr-0">
          <h3 className="font-headline text-lg md:text-xl font-bold text-on-surface">
            Acesso completo às 6 ferramentas
          </h3>
          <p className="mt-1.5 text-sm text-on-surface-variant leading-relaxed">
            DISC, Roda da Vida, Inteligência Emocional, Valores Pessoais, Metas SMART e Sabotadores Internos — em uma única plataforma.
          </p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-sm text-on-surface-variant line-through">R$997</span>
            <span className="font-headline text-2xl font-bold text-primary">R$297</span>
            <span className="text-xs text-on-surface-variant">/ano</span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleCTA}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-on-primary uppercase tracking-widest hover:bg-primary/90 transition-colors shadow-lg whitespace-nowrap"
        >
          Quero acesso completo <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
