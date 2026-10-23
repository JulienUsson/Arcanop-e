import { useState } from 'react';

export function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };
  return (
    <details className="copy-code">
      <summary>Pas de caméra ? Utiliser le code texte</summary>
      <code data-testid="signal-code">{code}</code>
      <div className="row">
        <button className="secondary" onClick={() => void copy()}>
          {copied ? 'Copié ✓' : 'Copier'}
        </button>
        {'share' in navigator && (
          <button className="secondary" onClick={() => void navigator.share({ text: code }).catch(() => {})}>
            Partager
          </button>
        )}
      </div>
    </details>
  );
}
