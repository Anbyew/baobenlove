import { useState } from 'react';
import { X } from 'lucide-react';
import { buildPaymentMemo } from '../lib/venmo';
import { trackClick } from '../lib/auth';

const ZELLE_EMAIL = 'bkrakoff@gmail.com';
const ZELLE_PHONE = '480-406-7028';

interface Props {
  amount: number;
  note: string;
  sessionToken?: string;
  className?: string;
}

export function ZelleButton({ amount, note, sessionToken, className = '' }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<'email' | 'phone' | null>(null);
  const [copyBlocked, setCopyBlocked] = useState(false);
  const memo = buildPaymentMemo(amount, note);

  const handleOpen = () => {
    setOpen(true);
    trackClick({ sessionToken, label: 'zelle_view', metadata: { amount, note } });
  };

  const copy = async (text: string, type: 'email' | 'phone') => {
    setCopyBlocked(false);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopyBlocked(true);
    }
  };

  return (
    <div className="flex-1">
      <button
        type="button"
        onClick={handleOpen}
        className={`w-full py-2.5 rounded-full border border-foreground/20 hover:border-foreground/40 text-foreground/70 hover:text-foreground text-xs tracking-[0.2em] uppercase font-light transition-colors ${className}`}
      >
        {amount > 0 ? `$${amount} via Zelle` : 'Pay via Zelle'}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/15 backdrop-blur-[2px] flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl border border-white/70 p-6 text-left"
            onClick={e => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 w-7 h-7 rounded-full border border-foreground/10 text-foreground/35 hover:text-foreground/70 hover:border-foreground/20 flex items-center justify-center transition-colors"
              aria-label="Close Zelle details"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            <p className="text-[11px] tracking-[0.2em] uppercase text-primary/55 font-light mb-2">
              Zelle Details
            </p>
            <h3 className="text-xl font-light text-foreground mb-1">Send ${amount}</h3>
            <p className="text-xs font-light text-foreground/50 leading-relaxed mb-5">
              Open Zelle in your bank app and use either contact below.
            </p>

            <div className="space-y-2 mb-5">
              {[
                { label: 'Email', value: ZELLE_EMAIL, type: 'email' as const },
                { label: 'Phone', value: ZELLE_PHONE, type: 'phone' as const },
              ].map(item => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => copy(item.value, item.type)}
                  className="w-full rounded-xl border border-foreground/10 hover:border-primary/30 bg-background/60 px-4 py-3 text-left transition-colors"
                >
                  <span className="block text-[10px] tracking-[0.18em] uppercase text-foreground/35 font-light mb-1">
                    {item.label}
                  </span>
                  <span className="flex items-center justify-between gap-3">
                    <span className="text-sm font-light text-foreground/75 break-all">{item.value}</span>
                    <span className="text-[10px] tracking-wider uppercase text-primary/60 font-light shrink-0">
                      {copied === item.type ? 'Copied' : 'Copy'}
                    </span>
                  </span>
                </button>
              ))}
            </div>
            {copyBlocked && (
              <p className="text-xs font-light text-foreground/45 mb-5">
                Copy is blocked in this browser. You can select the contact above manually.
              </p>
            )}

            <div className="rounded-xl bg-primary/5 border border-primary/10 p-3">
              <p className="text-[10px] tracking-[0.18em] uppercase text-primary/55 font-light mb-1">Memo</p>
              <p className="text-xs font-light text-foreground/60 leading-relaxed">{memo}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
