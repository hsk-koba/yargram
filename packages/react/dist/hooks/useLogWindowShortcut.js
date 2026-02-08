import { useState, useEffect, useCallback, useRef } from 'react';
export function useLogWindowShortcut(options = {}) {
    const { escapeCount: threshold = 5, resetAfterMs = 1500, closeOnEscape = true, onTrigger, } = options;
    const [isOpen, setIsOpen] = useState(false);
    const [escapeCount, setEscapeCount] = useState(0);
    const lastEscapeAt = useRef(0);
    const resetTimer = useRef(null);
    const open = useCallback(() => setIsOpen(true), []);
    const close = useCallback(() => setIsOpen(false), []);
    const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key !== 'Escape')
                return;
            if (isOpen) {
                if (closeOnEscape) {
                    close();
                }
                return;
            }
            const now = Date.now();
            if (now - lastEscapeAt.current > resetAfterMs) {
                setEscapeCount(1);
            }
            else {
                setEscapeCount((c) => {
                    const next = c + 1;
                    if (next >= threshold) {
                        lastEscapeAt.current = 0;
                        if (resetTimer.current) {
                            clearTimeout(resetTimer.current);
                            resetTimer.current = null;
                        }
                        if (onTrigger) {
                            onTrigger();
                        }
                        else {
                            open();
                        }
                        return 0;
                    }
                    return next;
                });
            }
            lastEscapeAt.current = now;
            if (resetTimer.current)
                clearTimeout(resetTimer.current);
            resetTimer.current = setTimeout(() => {
                setEscapeCount(0);
                resetTimer.current = null;
            }, resetAfterMs);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            if (resetTimer.current)
                clearTimeout(resetTimer.current);
        };
    }, [isOpen, threshold, resetAfterMs, closeOnEscape, open, close, onTrigger]);
    return { isOpen, open, close, toggle, escapeCount };
}
