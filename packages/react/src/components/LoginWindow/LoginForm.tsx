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

export type LoginFormProps = {
  onLogin: (pem: string) => Promise<void>;
  title?: string;
  submitLabel?: string;
  errorMessage?: string;
  onClearError?: () => void;
};

/** ログイン用フォーム（LogWindow 内などに埋め込む用。オーバーレイなし） */
export function LoginForm({
  onLogin,
  title = 'Login',
  submitLabel = 'Log in',
  errorMessage,
  onClearError,
}: LoginFormProps) {
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
    <div className="loginFormWrap">
      {title && (
        <div className="loginFormHeader">
          <Lock size={18} className="loginFormHeaderIcon" aria-hidden />
          <h3 className="loginFormTitle">{title}</h3>
        </div>
      )}
      <form onSubmit={handleSubmit} className="loginWindowForm">
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
  );
}
