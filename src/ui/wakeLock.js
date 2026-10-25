import { useEffect } from 'react';
export function useWakeLock(active) {
    useEffect(() => {
        if (!active || !('wakeLock' in navigator))
            return;
        let lock = null;
        let released = false;
        const acquire = async () => {
            try {
                lock = await navigator.wakeLock.request('screen');
            }
            catch {
                lock = null;
            }
        };
        const onVisible = () => {
            if (document.visibilityState === 'visible' && !released)
                void acquire();
        };
        void acquire();
        document.addEventListener('visibilitychange', onVisible);
        return () => {
            released = true;
            document.removeEventListener('visibilitychange', onVisible);
            void lock?.release();
        };
    }, [active]);
}
