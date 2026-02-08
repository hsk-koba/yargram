import type { LogEntry, LogWindowTab, NetworkEntry } from './types';
import '../LoginWindow/LoginWindow.css';
import './LogWindow.css';
export type LogWindowProps = {
    /** 表示するログエントリの配列 */
    entries?: LogEntry[];
    /** Networks タブで表示するネットワークエントリ（REST / GraphQL） */
    networkEntries?: NetworkEntry[];
    /** アクティブなタブ（未指定時は 'logs'） */
    defaultTab?: LogWindowTab;
    /** タブ切り替え時のコールバック */
    onTabChange?: (tab: LogWindowTab) => void;
    /** 高さ（CSS 値）。未指定時は max-height: 320px */
    height?: string | number;
    className?: string;
    /** true のときヘッダーをドラッグしてウィンドウを移動できる */
    draggable?: boolean;
    /** draggable 時の初期位置（未指定時は { x: 100, y: 100 }） */
    defaultPosition?: {
        x: number;
        y: number;
    };
    /** true のとき表示時に Windows 風のスケール＋フェードインアニメーションを行う */
    animateOnOpen?: boolean;
    /** 右上の赤ボタンで閉じる際に呼ばれる。指定時は赤ボタンが閉じるボタンになる */
    onClose?: () => void;
    /** 指定時はヘッダーにログアウトボタンを表示（認証連携用） */
    onLogout?: () => void;
    /** true のときボディにパスワード（ログイン）画面を表示（production/staging 用） */
    showLogin?: boolean;
    /** ログイン画面のタイトル */
    loginTitle?: string;
    /** ログイン送信 */
    onLogin?: (password: string) => Promise<void>;
    /** ログイン失敗メッセージ */
    loginError?: string;
    /** ログインエラーをクリア */
    onClearLoginError?: () => void;
};
export declare function LogWindow({ entries, networkEntries, defaultTab, onTabChange, height, className, draggable, defaultPosition, animateOnOpen, onClose, onLogout, showLogin, loginTitle, onLogin, loginError, onClearLoginError, }: LogWindowProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=LogWindow.d.ts.map