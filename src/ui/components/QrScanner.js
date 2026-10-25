import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import jsQR from 'jsqr';
import { useEffect, useRef, useState } from 'react';
export function QrScanner({ onResult, title }) {
    const videoRef = useRef(null);
    const [error, setError] = useState(null);
    const [manual, setManual] = useState('');
    const doneRef = useRef(false);
    const resultRef = useRef(onResult);
    resultRef.current = onResult;
    useEffect(() => {
        let stream = null;
        let frame = 0;
        let cancelled = false;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        let detector = null;
        try {
            if (window.BarcodeDetector)
                detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        }
        catch {
            detector = null;
        }
        const finish = (text) => {
            if (doneRef.current || !text)
                return;
            doneRef.current = true;
            navigator.vibrate?.(60);
            resultRef.current(text);
        };
        const scan = async () => {
            if (cancelled || doneRef.current)
                return;
            const video = videoRef.current;
            if (video && video.readyState >= 2 && ctx) {
                const w = video.videoWidth;
                const h = video.videoHeight;
                if (w && h) {
                    if (detector) {
                        try {
                            const codes = await detector.detect(video);
                            if (codes[0]?.rawValue)
                                return finish(codes[0].rawValue);
                        }
                        catch {
                            detector = null;
                        }
                    }
                    else {
                        const scale = Math.min(1, 720 / Math.max(w, h));
                        canvas.width = Math.round(w * scale);
                        canvas.height = Math.round(h * scale);
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                        const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const code = jsQR(image.data, image.width, image.height, { inversionAttempts: 'dontInvert' });
                        if (code?.data)
                            return finish(code.data);
                    }
                }
            }
            frame = requestAnimationFrame(() => void scan());
        };
        (async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
                    audio: false,
                });
                if (cancelled)
                    return stream.getTracks().forEach((t) => t.stop());
                const video = videoRef.current;
                if (!video)
                    return;
                video.srcObject = stream;
                await video.play();
                void scan();
            }
            catch (e) {
                setError(e instanceof Error && e.name === 'NotAllowedError'
                    ? 'Accès à la caméra refusé. Autorisez-le ou collez le code à la main.'
                    : 'Caméra indisponible. Collez le code à la main.');
            }
        })();
        return () => {
            cancelled = true;
            cancelAnimationFrame(frame);
            stream?.getTracks().forEach((t) => t.stop());
        };
    }, []);
    return (_jsxs("div", { className: "scanner", children: [_jsx("p", { className: "scanner-title", children: title }), !error && (_jsxs("div", { className: "video-frame", children: [_jsx("video", { ref: videoRef, playsInline: true, muted: true }), _jsx("div", { className: "viewfinder" })] })), error && _jsx("p", { className: "error", children: error }), _jsxs("details", { className: "manual", children: [_jsx("summary", { children: "Saisir le code texte" }), _jsx("textarea", { value: manual, onChange: (e) => setManual(e.target.value), placeholder: "arc1.\u2026", rows: 3, spellCheck: false, autoCapitalize: "off", autoCorrect: "off" }), _jsx("button", { className: "secondary", disabled: !manual.trim(), onClick: () => onResult(manual), children: "Valider le code" })] })] }));
}
