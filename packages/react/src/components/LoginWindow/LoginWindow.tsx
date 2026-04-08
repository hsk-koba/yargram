import React, { useState, useCallback } from 'react';
import { Lock, LogIn } from 'lucide-react';
import './LoginWindow.css';

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.readAsText(file);
  });
}

export type LoginWindowProps = {
  /** ログイン送信。成功で resolve、失敗で reject（メッセージは errorMessage で表示） */
  onLogin: (pem: string) => Promise<void>;
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
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onClearError?.();
      if (!file) return;
      setIsSubmitting(true);
      readFileAsText(file)
        .then((pem) => onLogin(pem))
        .then(() => setFile(null))
        .catch(() => {})
        .finally(() => {
          setIsSubmitting(false);
        });
    },
    [onLogin, file, onClearError]
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
            <span>Private key</span>
            <input
              type="file"
              className="loginWindowInput"
              accept=".pem,.key"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                onClearError?.();
              }}
              disabled={isSubmitting}
              autoFocus
            />
          </label>
          <button
            type="submit"
            className="loginWindowSubmit"
            disabled={isSubmitting || !file}
          >
            <LogIn size={16} aria-hidden />
            {isSubmitting ? '...' : submitLabel}
          </button>
        </form>
      </div>
    </div>
  );
}
