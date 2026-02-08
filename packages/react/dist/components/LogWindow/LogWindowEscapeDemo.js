import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { createPortal } from 'react-dom';
import { LogWindow } from './LogWindow';
import { useLogWindowShortcut } from '../../hooks/useLogWindowShortcut';
import './LogWindow.css';
const demoStyles = {
    position: 'relative',
    minHeight: 300,
    padding: 24,
    background: 'var(--logw-bg, #1e1e1e)',
    borderRadius: 8,
    color: 'var(--logw-text, #d4d4d4)',
    fontFamily: 'ui-monospace, monospace',
};
const overlayStyles = {
    position: 'fixed',
    inset: 0,
    background: 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: 24,
    boxSizing: 'border-box',
};
const instructionStyles = {
    marginBottom: 16,
    fontSize: 14,
    color: 'var(--logw-text-muted, #858585)',
};
const countStyles = {
    fontSize: 12,
    marginTop: 8,
    padding: '6px 12px',
    background: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    display: 'inline-block',
};
const ESCAPE_COUNT = 5;
/**
 * Escape を 5 回押すとログウィンドウを表示するデモ。
 * Storybook でテスト用に利用。
 */
export function LogWindowEscapeDemo({ entries = [], networkEntries = [], }) {
    const { isOpen, close, escapeCount: count } = useLogWindowShortcut({
        escapeCount: ESCAPE_COUNT,
        resetAfterMs: 1500,
        closeOnEscape: true,
    });
    return (_jsxs("div", { style: demoStyles, children: [_jsx("div", { style: instructionStyles, children: _jsxs("strong", { children: ["Escape \u30AD\u30FC\u3092 ", ESCAPE_COUNT, " \u56DE\u62BC\u3059\u3068\u30ED\u30B0\u30A6\u30A3\u30F3\u30C9\u30A6\u304C\u958B\u304D\u307E\u3059\u3002"] }) }), _jsxs("div", { style: countStyles, children: ["Escape: ", count, " / ", ESCAPE_COUNT] }), isOpen &&
                typeof document !== 'undefined' &&
                createPortal(_jsx("div", { style: overlayStyles, role: "presentation", children: _jsx("div", { onClick: (e) => e.stopPropagation(), children: _jsx(LogWindow, { entries: entries, networkEntries: networkEntries, draggable: true, animateOnOpen: true, onClose: close, defaultPosition: {
                                x: typeof window !== 'undefined' ? Math.max(0, (window.innerWidth - 696) / 2) : 100,
                                y: typeof window !== 'undefined' ? Math.max(0, (window.innerHeight - 466) / 2) : 100,
                            } }) }) }), document.body)] }));
}
