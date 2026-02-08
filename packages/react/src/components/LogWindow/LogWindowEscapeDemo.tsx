import React from 'react';
import { createPortal } from 'react-dom';
import { LogWindow } from './LogWindow';
import { useLogWindowShortcut } from '../../hooks/useLogWindowShortcut';
import type { LogEntry, NetworkEntry } from './types';
import './LogWindow.css';

const demoStyles: React.CSSProperties = {
  position: 'relative',
  minHeight: 300,
  padding: 24,
  background: 'var(--logw-bg, #1e1e1e)',
  borderRadius: 8,
  color: 'var(--logw-text, #d4d4d4)',
  fontFamily: 'ui-monospace, monospace',
};

const overlayStyles: React.CSSProperties = {
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

const instructionStyles: React.CSSProperties = {
  marginBottom: 16,
  fontSize: 14,
  color: 'var(--logw-text-muted, #858585)',
};

const countStyles: React.CSSProperties = {
  fontSize: 12,
  marginTop: 8,
  padding: '6px 12px',
  background: 'rgba(255,255,255,0.08)',
  borderRadius: 4,
  display: 'inline-block',
};

const ESCAPE_COUNT = 5;

export type LogWindowEscapeDemoProps = {
  entries?: LogEntry[];
  networkEntries?: NetworkEntry[];
};

/**
 * Escape を 5 回押すとログウィンドウを表示するデモ。
 * Storybook でテスト用に利用。
 */
export function LogWindowEscapeDemo({
  entries = [],
  networkEntries = [],
}: LogWindowEscapeDemoProps) {
  const { isOpen, close, escapeCount: count } = useLogWindowShortcut({
    escapeCount: ESCAPE_COUNT,
    resetAfterMs: 1500,
    closeOnEscape: true,
  });

  return (
    <div style={demoStyles}>
      <div style={instructionStyles}>
        <strong>Escape キーを {ESCAPE_COUNT} 回押すとログウィンドウが開きます。</strong>
      </div>
      <div style={countStyles}>
        Escape: {count} / {ESCAPE_COUNT}
      </div>

      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            style={overlayStyles}
            role="presentation"
          >
            <div onClick={(e) => e.stopPropagation()}>
              <LogWindow
                entries={entries}
                networkEntries={networkEntries}
                draggable
                animateOnOpen
                onClose={close}
                defaultPosition={{
                  x: typeof window !== 'undefined' ? Math.max(0, (window.innerWidth - 696) / 2) : 100,
                  y: typeof window !== 'undefined' ? Math.max(0, (window.innerHeight - 466) / 2) : 100,
                }}
              />
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
