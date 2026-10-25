import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { play } from '../sfx';

export interface ConfirmOptions {
  title: string;
  message: React.ReactNode;
  icon?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'default' | 'danger';
}

interface Pending extends ConfirmOptions {
  resolve: (ok: boolean) => void;
}

const DialogContext = createContext<(options: ConfirmOptions) => Promise<boolean>>(() => Promise.resolve(false));

export function useConfirm() {
  return useContext(DialogContext);
}

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  const ask = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        play('card');
        navigator.vibrate?.(20);
        setPending({ ...options, resolve });
      }),
    [],
  );

  const close = useCallback(
    (ok: boolean) => {
      pending?.resolve(ok);
      setPending(null);
    },
    [pending],
  );

  useEffect(() => {
    if (!pending) return;
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pending, close]);

  return (
    <DialogContext.Provider value={ask}>
      {children}
      {pending && (
        <div className="dialog-backdrop" onClick={() => close(false)}>
          <div
            className={`dialog tone-${pending.tone ?? 'default'}`}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="dialog-corner tl" />
            <span className="dialog-corner tr" />
            <span className="dialog-corner bl" />
            <span className="dialog-corner br" />
            <div className="dialog-icon">{pending.icon ?? (pending.tone === 'danger' ? '⚠️' : '🌳')}</div>
            <h2 id="dialog-title">{pending.title}</h2>
            <div className="dialog-message">{pending.message}</div>
            <div className="dialog-actions">
              <button className="secondary big" onClick={() => close(false)}>
                {pending.cancelLabel ?? 'Annuler'}
              </button>
              <button ref={confirmRef} className={`big ${pending.tone === 'danger' ? 'danger-solid' : 'primary'}`} onClick={() => close(true)}>
                {pending.confirmLabel ?? 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}
