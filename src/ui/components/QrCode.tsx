import QRCode from 'qrcode';
import { useEffect, useRef, useState } from 'react';

interface Props {
  value: string;
  alphanumeric?: boolean;
  label?: string;
}

export function QrCode({ value, alphanumeric, label }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const segments = alphanumeric ? [{ data: value, mode: 'alphanumeric' as const }] : value;
    QRCode.toCanvas(canvas, segments, { errorCorrectionLevel: 'L', margin: 3, scale: 8, color: { dark: '#000', light: '#fff' } })
      .then(() => setError(null))
      .catch((e: Error) => setError(e.message));
  }, [value, alphanumeric]);

  return (
    <figure className="qr">
      <canvas ref={canvasRef} aria-label={label ?? 'QR code'} />
      {error && <figcaption className="error">{error}</figcaption>}
    </figure>
  );
}
