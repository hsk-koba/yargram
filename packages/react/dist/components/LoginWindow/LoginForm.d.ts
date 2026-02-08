import './LoginWindow.css';
export type LoginFormProps = {
    onLogin: (password: string) => Promise<void>;
    title?: string;
    submitLabel?: string;
    errorMessage?: string;
    onClearError?: () => void;
};
/** ログイン用フォーム（LogWindow 内などに埋め込む用。オーバーレイなし） */
export declare function LoginForm({ onLogin, title, submitLabel, errorMessage, onClearError, }: LoginFormProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=LoginForm.d.ts.map