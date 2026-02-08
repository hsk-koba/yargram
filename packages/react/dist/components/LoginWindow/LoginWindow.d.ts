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
export declare function LoginWindow({ onLogin, title, submitLabel, errorMessage, onClearError, }: LoginWindowProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=LoginWindow.d.ts.map