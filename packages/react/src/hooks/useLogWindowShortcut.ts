import { useState, useEffect, useCallback, useRef } from 'react';

export type UseLogWindowShortcutOptions = {
  /** ログウィンドウを開くために必要な Escape の連続押下回数 */
  escapeCount?: number;
  /** この時間（ms）以内に次の Escape が押されないとカウントをリセットする */
  resetAfterMs?: number;
  /** ログウィンドウ表示中に Escape を押したら閉じる */
  closeOnEscape?: boolean;
  /** 指定時は threshold 到達時に open の代わりにこのコールバックを呼ぶ（例: 認証時はログアウトしてログインウィンドウ表示） */
  onTrigger?: () => void;
};

export type UseLogWindowShortcutResult = {
  /** ログウィンドウを表示するか */
  isOpen: boolean;
  /** ログウィンドウを開く */
  open: () => void;
  /** ログウィンドウを閉じる */
  close: () => void;
  /** トグル */
  toggle: () => void;
  /** 現在の Escape カウント（0 〜 escapeCount-1）。デバッグ・UI 表示用 */
  escapeCount: number;
};

export function useLogWindowShortcut(
  options: UseLogWindowShortcutOptions = {}
): UseLogWindowShortcutResult {
  const {
    escapeCount: threshold = 5,
    resetAfterMs = 1500,
    closeOnEscape = true,
    onTrigger,
  } = options;

  const [isOpen, setIsOpen] = useState(false);
  const [escapeCount, setEscapeCount] = useState(0);
  const lastEscapeAt = useRef<number>(0);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;

      if (isOpen) {
        if (closeOnEscape) {
          close();
        }
        return;
      }

      const now = Date.now();
      if (now - lastEscapeAt.current > resetAfterMs) {
        setEscapeCount(1);
      } else {
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
            } else {
              open();
            }
            return 0;
          }
          return next;
        });
      }
      lastEscapeAt.current = now;

      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => {
        setEscapeCount(0);
        resetTimer.current = null;
      }, resetAfterMs);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, [isOpen, threshold, resetAfterMs, closeOnEscape, open, close, onTrigger]);

  return { isOpen, open, close, toggle, escapeCount };
}
