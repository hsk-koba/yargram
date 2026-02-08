import React, { useState, useCallback } from 'react';
import { Lock, LogIn } from 'lucide-react';
import './LoginWindow.css';

export type LoginFormProps = {
  onLogin: (password: string) => Promise<void>;
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
  );
}
