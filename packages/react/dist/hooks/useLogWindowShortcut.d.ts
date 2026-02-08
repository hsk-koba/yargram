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
export declare function useLogWindowShortcut(options?: UseLogWindowShortcutOptions): UseLogWindowShortcutResult;
//# sourceMappingURL=useLogWindowShortcut.d.ts.map