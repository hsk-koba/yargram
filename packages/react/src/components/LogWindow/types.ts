export type LogLevel = 'info' | 'warn' | 'error';

/** ログメッセージ（文字列のほか、連想配列・配列の場合はアコーディオンで展開表示） */
export type LogMessage = string | Record<string, unknown> | unknown[];

export type LogEntry = {
  id: string;
  level: LogLevel;
  message: LogMessage;
  source: string;
};

export type LogWindowTab = 'logs' | 'networks';

/** REST API のネットワークエントリ */
export type NetworkEntryRest = {
  id: string;
  type: 'rest';
  method: string;
  url: string;
  status?: number;
  statusText?: string;
  /** アコーディオン展開時の Request 表示用 */
  request?: string;
  /** アコーディオン展開時の Response 表示用 */
  response?: string;
};

/** GraphQL のネットワークエントリ */
export type NetworkEntryGraphql = {
  id: string;
  type: 'graphql';
  operationName?: string;
  url: string;
  status?: number;
  statusText?: string;
  /** アコーディオン展開時の Request 表示用 */
  request?: string;
  /** アコーディオン展開時の Response 表示用 */
  response?: string;
};

export type NetworkEntry = NetworkEntryRest | NetworkEntryGraphql;
