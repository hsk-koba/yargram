import React, { useState, useCallback } from 'react';
import { Lock, LogIn } from 'lucide-react';
import './LoginWindow.css';

export type LoginWindowProps = {
  /** ログイン送信。成功で resolve、失敗で reject（メッセージは errorMessage で表示） */
  onLogin: (password: string) => Promise<void>;
  /** ウィンドウタイトル */
  title?: string;
  /** 送信ボタンラベル */
  submitLabel?: string;
  /** エラー表示用（onLogin が reject したとき） */
  errorMessage?: string;
  /** エラーをクリアする（入力変更時などに親から渡す） */
  onClearError?: () => void;
};

export function LoginWindow({
  onLogin,
  title = 'Login',
  submitLabel = 'Log in',
  errorMessage,
  onClearError,
}: LoginWindowProps) {
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onClearError?.();
      if (!password) return;
      setIsSubmitting(true);
      onLogin(password)
        .then(() => {
          setPassword('');
        })
        .catch(() => {})
        .finally(() => {
          setIsSubmitting(false);
        });
    },
    [onLogin, password, onClearError]
  );

  return (
    <div className="loginWindowOverlay" role="dialog" aria-modal="true" aria-labelledby="loginWindowTitle">
      <div className="loginWindow">
        <div className="loginWindowHeader">
          <Lock size={20} className="loginWindowHeaderIcon" aria-hidden />
          <h2 id="loginWindowTitle" className="loginWindowTitle">
            {title}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="loginWindowForm">
          {errorMessage && (
            <div className="loginWindowError" role="alert">
              {errorMessage}
            </div>
          )}
          <label className="loginWindowLabel">
            <Lock size={16} className="loginWindowLabelIcon" aria-hidden />
            <span>Password</span>
            <input
              type="password"
              className="loginWindowInput"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                onClearError?.();
              }}
              autoComplete="current-password"
              placeholder="••••••••"
              disabled={isSubmitting}
              autoFocus
            />
          </label>
          <button
            type="submit"
            className="loginWindowSubmit"
            disabled={isSubmitting || !password}
          >
            <LogIn size={16} aria-hidden />
            {isSubmitting ? '...' : submitLabel}
          </button>
        </form>
      </div>
    </div>
  );
}
