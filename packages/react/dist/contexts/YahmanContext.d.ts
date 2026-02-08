import React from 'react';
import { ApolloClient } from '@apollo/client';
import type { LogEntry, NetworkEntry } from '../components/LogWindow/types';
import type { Env } from '@yahman/core';
import type { NormalizedCacheObject } from '@apollo/client';
import '../components/LogWindow/LogWindow.css';
/** Api 設定（ApiProvider の props から children を除いたもの） */
type YahmanApiConfig = {
    provider: 'rest';
    baseUrl?: string;
} | {
    provider: 'graphql';
    uri?: string;
    client?: ApolloClient<NormalizedCacheObject>;
};
/** Printer 設定 */
type YahmanPrinterConfig = {
    env?: Env;
};
/** LogWindow 設定（Escape 5 回で表示） */
type YahmanLogWindowConfig = Record<string, never>;
/** 認証設定。本番のみログインを要求する場合は true、カスタム時はオブジェクト */
type YahmanAuthConfig = true | {
    /** 本番時のみ認証（デフォルト true） */
    productionOnly?: boolean;
    /** Storybook 時のみ本番として扱う（ログイン要求する） */
    storybookSimulateProduction?: boolean;
    /** カスタム認証（指定時は onLogin で検証。未指定時は passwordHash または env でハッシュ比較） */
    onLogin?: (password: string) => Promise<void>;
    /** ログインウィンドウのタイトル */
    loginTitle?: string;
    /**
     * ログイン用パスワードの SHA-256 ハッシュ（hex）。指定時は env より優先。
     * 未指定時は YAHMAN_LOGIN_PASSWORD_HASH / VITE_YAHMAN_LOGIN_PASSWORD_HASH、それも無ければデフォルト（12345678 のハッシュ）。
     */
    passwordHash?: string;
    /**
     * ログイン後のトークン有効期限（ミリ秒）。未指定時は 7 日。
     */
    tokenTtlMs?: number;
};
type YahmanContextValue = {
    addLogEntry: (entry: Omit<LogEntry, 'id'> | LogEntry) => void;
    addNetworkEntry: (entry: Omit<NetworkEntry, 'id'> | NetworkEntry) => void;
    openLogWindow: () => void;
    closeLogWindow: () => void;
    logEntries: LogEntry[];
    networkEntries: NetworkEntry[];
    isLogWindowOpen: boolean;
};
export type YahmanProviderProps = {
    children: React.ReactNode;
    /** Api 設定（REST または GraphQL） */
    api: YahmanApiConfig;
    /** Printer 設定 */
    printer?: YahmanPrinterConfig;
    /** LogWindow を Escape で出せるようにする設定。省略時は LogWindow 機能なし */
    logWindow?: YahmanLogWindowConfig;
    /**
     * 認証を有効にする。true のとき本番（NODE_ENV=production/staging）のみログインウィンドウを表示。
     * オブジェクトで productionOnly / onLogin / loginTitle / passwordHash を指定可能。
     * パスワードハッシュは auth.passwordHash → env（YAHMAN_LOGIN_PASSWORD_HASH 等）→ デフォルト（12345678 の SHA-256）の順で解決される。
     */
    auth?: YahmanAuthConfig;
};
export declare function YahmanProvider({ children, api, printer, logWindow, auth, }: YahmanProviderProps): import("react/jsx-runtime").JSX.Element;
export declare function useYahman(): YahmanContextValue;
export {};
//# sourceMappingURL=YahmanContext.d.ts.map