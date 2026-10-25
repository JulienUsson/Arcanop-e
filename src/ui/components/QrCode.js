import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import QRCode from 'qrcode';
import { useEffect, useRef, useState } from 'react';
export function QrCode({ value, alphanumeric, label }) {
    const canvasRef = useRef(null);
    const [error, setError] = useState(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas)
            return;
        const segments = alphanumeric ? [{ data: value, mode: 'alphanumeric' }] : value;
        QRCode.toCanvas(canvas, segments, { errorCorrectionLevel: 'L', margin: 3, scale: 8, color: { dark: '#000', light: '#fff' } })
            .then(() => setError(null))
            .catch((e) => setError(e.message));
    }, [value, alphanumeric]);
    return (_jsxs("figure", { className: "qr", children: [_jsx("canvas", { ref: canvasRef, "aria-label": label ?? 'QR code' }), error && _jsx("figcaption", { className: "error", children: error })] }));
}
