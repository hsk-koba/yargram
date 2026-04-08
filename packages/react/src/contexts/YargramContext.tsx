import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useId,
  useRef,
  useEffect,
} from 'react';
import { createPortal } from 'react-dom';
import { createPrinter } from '@yargram/core';
import {
  ApolloClient,
  ApolloProvider,
  InMemoryCache,
  HttpLink,
} from '@apollo/client';
import { getOperationAST, print } from 'graphql';
import { ApiProvider, ApiContext } from './ApiContext';
import type {
  RestApiContextValue,
  GraphqlApiContextValue,
  YargramGraphqlQueryOptions,
  YargramGraphqlMutationOptions,
} from './ApiContext';
import { PrinterProvider } from './PrinterContext';
import { useLogWindowShortcut } from '../hooks/useLogWindowShortcut';
import { LogWindow } from '../components/LogWindow/LogWindow';
import type { LogEntry, LogMessage, NetworkEntry } from '../components/LogWindow/types';
import type { Env } from '@yargram/core';
import { base64ToArrayBuffer, decryptText, importPrivateKey } from '../crypto/rsaOaep';
import type {
  ApolloClient as ApolloClientType,
  NormalizedCacheObject,
  QueryOptions,
  MutationOptions,
  OperationVariables,
} from '@apollo/client';
import '../components/LogWindow/LogWindow.css';

const AUTH_STORAGE_KEY = 'yargram_auth_token';

/** localStorage に保存するログイン情報の形 */
type StoredAuthToken = {
  token: string;
  domain: string;
  expiresAt: number;
};

const DEFAULT_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7日

function isProductionOrStaging(): boolean {
  if (typeof process === 'undefined') return false;
  const env = process.env?.NODE_ENV;
  return env === 'production' || env === 'staging';
}

function isStorybook(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as Window & { IS_STORYBOOK?: boolean; __STORYBOOK_CLIENT_API__?: unknown };
  return w.IS_STORYBOOK === true || Boolean(w.__STORYBOOK_CLIENT_API__);
}

function storybookSimulateProduction(prop?: boolean): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as Window & { __YARGRAM_STORYBOOK_SIMULATE_PRODUCTION__?: boolean };
  return prop === true || w.__YARGRAM_STORYBOOK_SIMULATE_PRODUCTION__ === true;
}

function getCurrentDomain(): string {
  if (typeof window === 'undefined') return '';
  return window.location.hostname || '';
}

function loadPersistedAuth(): boolean {
  if (typeof localStorage === 'undefined') return false;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw) as unknown;
    if (
      data &&
      typeof data === 'object' &&
      'token' in data &&
      'domain' in data &&
      'expiresAt' in data &&
      typeof (data as StoredAuthToken).domain === 'string' &&
      typeof (data as StoredAuthToken).expiresAt === 'number'
    ) {
      const { domain, expiresAt } = data as StoredAuthToken;
      const now = Date.now();
      return domain === getCurrentDomain() && expiresAt > now;
    }
    return false;
  } catch {
    return false;
  }
}

function persistAuth(value: boolean, ttlMs: number = DEFAULT_TOKEN_TTL_MS) {
  if (typeof localStorage === 'undefined') return;
  try {
    if (value) {
      const token =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `t-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const domain = getCurrentDomain();
      const expiresAt = Date.now() + ttlMs;
      const data: StoredAuthToken = { token, domain, expiresAt };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

type YargramEncryptedData =
  | { format: 'base64'; value: string }
  | { format: 'arrayBuffer'; value: ArrayBuffer };

async function resolveEncryptedData(data: YargramEncryptedData | (() => Promise<YargramEncryptedData>)) {
  const resolved = typeof data === 'function' ? await data() : data;
  return resolved.format === 'base64'
    ? base64ToArrayBuffer(resolved.value)
    : resolved.value;
}

function resolveBody(body?: BodyInit | Record<string, unknown>): BodyInit | undefined {
  if (body == null) return undefined;
  if (
    typeof body === 'string' ||
    body instanceof ArrayBuffer ||
    ArrayBuffer.isView(body) ||
    body instanceof FormData ||
    body instanceof URLSearchParams
  ) {
    return body;
  }
  return JSON.stringify(body);
}

function mergeHeaders(base?: HeadersInit, override?: HeadersInit): Headers | undefined {
  if (!base && !override) return undefined;
  const h = new Headers(base);
  if (override) {
    new Headers(override).forEach((value, key) => {
      h.set(key, value);
    });
  }
  return h;
}

function headersInitToRecord(headers?: HeadersInit): Record<string, string> | undefined {
  if (!headers) return undefined;
  const record: Record<string, string> = {};
  new Headers(headers).forEach((value, key) => {
    record[key] = value;
  });
  return record;
}

function normalizeGraphqlOptions<T extends { context?: any; noCache?: boolean; cache?: RequestCache; dedupe?: boolean; fetchPolicy?: any }>(
  options: T
): Omit<T, 'noCache' | 'cache' | 'dedupe'> {
  const { noCache, cache, dedupe, context, ...rest } = options;
  const next: any = { ...rest };

  if (noCache === true && next.fetchPolicy == null) {
    next.fetchPolicy = 'no-cache';
  }

  if (cache != null || dedupe != null) {
    next.context = {
      ...(context ?? {}),
      ...(dedupe != null ? { queryDeduplication: dedupe } : {}),
      ...(cache != null
        ? {
            fetchOptions: {
              ...((context as any)?.fetchOptions ?? {}),
              cache,
            },
          }
        : {}),
    };
  } else if (context != null) {
    next.context = context;
  }

  return next;
}

/** Api 設定（ApiProvider の props から children を除いたもの） */
type YargramApiConfig =
  | { provider: 'rest'; baseUrl?: string; headers?: HeadersInit }
  | {
      provider: 'graphql';
      uri?: string;
      client?: ApolloClient<NormalizedCacheObject>;
      headers?: HeadersInit;
    };

/** Printer 設定 */
type YargramPrinterConfig = {
  env?: Env;
};

/** LogWindow 設定（Escape 5 回で表示） */
type YargramLogWindowConfig = {
  /** 表示する行数（2, 3 など）。未指定時はウィンドウのデフォルト高さ */
  visibleRows?: number;
};

/** 認証設定。本番のみログインを要求する場合は true、カスタム時はオブジェクト */
type YargramAuthConfig =
  | {
      /** 本番時のみ認証（デフォルト true） */
      productionOnly?: boolean;
      /** Storybook 時のみ本番として扱う（ログイン要求する） */
      storybookSimulateProduction?: boolean;
      /** ログインウィンドウのタイトル */
      loginTitle?: string;
      /**
       * 公開鍵（SPKI DER の base64。YARGRAM_PUBLIC_KEY_DER_BASE64 を想定）。
       * サーバー側の暗号化で利用する想定。
       */
      publicKey: string;
      /**
       * サーバーから取得した暗号化データ。
       * base64 か ArrayBuffer を指定（または遅延取得関数）。
       */
      encryptedData: YargramEncryptedData | (() => Promise<YargramEncryptedData>);
      /**
       * 復号後のプレーンテキストを受け取って検証/初期化する（成功で resolve）。
       * 未指定の場合、復号できた時点で認証成功とみなす。
       */
      onDecrypted?: (plaintext: string) => Promise<void>;
      /**
       * ログイン後のトークン有効期限（ミリ秒）。未指定時は 7 日。
       */
      tokenTtlMs?: number;
    };

type YargramContextValue = {
  addLogEntry: (entry: Omit<LogEntry, 'id'> | LogEntry) => void;
  addNetworkEntry: (entry: Omit<NetworkEntry, 'id'> | NetworkEntry) => void;
  openLogWindow: () => void;
  closeLogWindow: () => void;
  logEntries: LogEntry[];
  networkEntries: NetworkEntry[];
  isLogWindowOpen: boolean;
  publicKey?: string;
};

const YargramContext = createContext<YargramContextValue | null>(null);

export type YargramProviderProps = {
  children: React.ReactNode;
  /** Api 設定（REST または GraphQL） */
  api: YargramApiConfig;
  /** Printer 設定 */
  printer?: YargramPrinterConfig;
  /** LogWindow を Escape で出せるようにする設定。省略時は LogWindow 機能なし */
  logWindow?: YargramLogWindowConfig;
  /**
   * 認証を有効にする。指定時は本番（NODE_ENV=production/staging）でログイン（秘密鍵復号）を要求する。
   * ログインは「秘密鍵ファイル（PKCS#8 PEM）で暗号化データを復号できたら成功」として扱う。
   */
  auth?: YargramAuthConfig;
};

/** 認証有効時の子要素ラッパー（ログアウトは LogWindow 内のボタンから行う） */
function AuthEscapeToLogin({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

/** 認証時はログウィンドウをポータル表示。未認証時は LogWindow 内にパスワード画面（production/staging のみ） */
function LogWindowGate({
  instanceId,
  defaultPosition,
  loginTitle,
  isAuthenticated,
  login,
  logout,
  loginError,
  clearLoginError,
  logEntries,
  networkEntries,
  isLogWindowOpen,
  closeLogWindow,
  logWindowConfig,
}: {
  instanceId: string;
  defaultPosition: { x: number; y: number };
  loginTitle?: string;
  isAuthenticated: boolean;
  login: (pem: string) => Promise<void>;
  logout: () => void;
  loginError: string | undefined;
  clearLoginError: () => void;
  logEntries: LogEntry[];
  networkEntries: NetworkEntry[];
  isLogWindowOpen: boolean;
  closeLogWindow: () => void;
  logWindowConfig?: YargramLogWindowConfig;
}) {
  if (!isLogWindowOpen || typeof document === 'undefined') {
    return null;
  }
  return createPortal(
    <div onClick={(e) => e.stopPropagation()}>
      <LogWindow
        key={instanceId}
        entries={logEntries}
        networkEntries={networkEntries}
        visibleRows={logWindowConfig?.visibleRows}
        draggable
        animateOnOpen
        onClose={closeLogWindow}
        onLogout={isAuthenticated ? logout : undefined}
        defaultPosition={defaultPosition}
        showLogin={!isAuthenticated}
        loginTitle={loginTitle}
        onLogin={!isAuthenticated ? login : undefined}
        loginError={loginError}
        onClearLoginError={clearLoginError}
      />
    </div>,
    document.body
  );
}

function generateId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Math.random().toString(36).slice(2)}`;
}

export function YargramProvider({
  children,
  api,
  printer = {},
  logWindow,
  auth,
}: YargramProviderProps) {
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [networkEntries, setNetworkEntries] = useState<NetworkEntry[]>([]);
  const instanceId = useId();

  const simulateProduction =
    auth && typeof auth === 'object' && isStorybook() && storybookSimulateProduction(auth.storybookSimulateProduction);
  const requiresAuth =
    auth && typeof auth === 'object' && (auth.productionOnly !== false)
      ? isProductionOrStaging() || !!simulateProduction
      : false;
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    auth && requiresAuth ? loadPersistedAuth() : false
  );
  const [loginError, setLoginError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!requiresAuth) return;
    setIsAuthenticated(loadPersistedAuth());
  }, [requiresAuth]);

  const encryptedData = auth && typeof auth === 'object' ? auth.encryptedData : undefined;
  const publicKey = auth && typeof auth === 'object' ? auth.publicKey : undefined;
  const onDecrypted = auth && typeof auth === 'object' ? auth.onDecrypted : undefined;
  const tokenTtlMs =
    auth && typeof auth === 'object' && auth.tokenTtlMs != null
      ? auth.tokenTtlMs
      : DEFAULT_TOKEN_TTL_MS;

  const login = useCallback(
    async (pem: string) => {
      if (!pem) throw new Error('Private key is required.');
      if (/BEGIN RSA PRIVATE KEY/.test(pem)) {
        throw new Error('This looks like PKCS#1 (BEGIN RSA PRIVATE KEY). Please provide PKCS#8 (BEGIN PRIVATE KEY).');
      }
      if (!/BEGIN PRIVATE KEY/.test(pem)) {
        throw new Error('Not a PKCS#8 private key PEM. Expected BEGIN PRIVATE KEY.');
      }
      if (!encryptedData) {
        throw new Error('auth.encryptedData is required for decryption login.');
      }

      const key = await importPrivateKey(pem);
      const ciphertext = await resolveEncryptedData(encryptedData);
      const plaintext = await decryptText(key, ciphertext);
      if (onDecrypted) {
        await onDecrypted(plaintext);
      }
      setLoginError(undefined);
      setIsAuthenticated(true);
      persistAuth(true, tokenTtlMs);
    },
    [encryptedData, onDecrypted, tokenTtlMs]
  );
  const logout = useCallback(() => {
    setIsAuthenticated(false);
    persistAuth(false);
  }, []);
  const handleLogin = useCallback(
    async (pem: string) => {
      setLoginError(undefined);
      try {
        await login(pem);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Login failed.';
        setLoginError(message);
        throw err;
      }
    },
    [login]
  );
  const clearLoginError = useCallback(() => setLoginError(undefined), []);

  const addLogEntry = useCallback((entry: Omit<LogEntry, 'id'> | LogEntry) => {
    const id = 'id' in entry && entry.id ? entry.id : generateId();
    setLogEntries((prev) => [...prev, { ...entry, id } as LogEntry]);
  }, []);

  const addLogEntryRef = useRef(addLogEntry);
  useEffect(() => {
    addLogEntryRef.current = addLogEntry;
  }, [addLogEntry]);

  const addNetworkEntry = useCallback((entry: Omit<NetworkEntry, 'id'> | NetworkEntry) => {
    const id = 'id' in entry && entry.id ? entry.id : generateId();
    setNetworkEntries((prev) => [...prev, { ...entry, id } as NetworkEntry]);
  }, []);

  const env = printer.env ?? 'local';

  const wrappedPrinter = useMemo(() => {
    const base = createPrinter(env);
    const toConsoleStr = (msg: LogMessage): string =>
      typeof msg === 'string' ? msg : JSON.stringify(msg);
    return {
      info: (msg: LogMessage) => {
        base.info(toConsoleStr(msg));
        addLogEntryRef.current({ level: 'info', message: msg, source: 'app' });
      },
      warn: (msg: LogMessage) => {
        base.warn(toConsoleStr(msg));
        addLogEntryRef.current({ level: 'warn', message: msg, source: 'app' });
      },
      error: (msg: LogMessage) => {
        base.error(toConsoleStr(msg));
        addLogEntryRef.current({ level: 'error', message: msg, source: 'app' });
      },
    };
  }, [env]);

  const restBaseUrl =
    api.provider === 'rest'
      ? (api.baseUrl ?? (typeof process !== 'undefined' ? process.env?.ENDPOINT_URL : '') ?? '')
      : '';
  const restHeaders = api.provider === 'rest' ? api.headers : undefined;

  const makeRestRequest = useCallback(
    (method: string, path: string, body?: BodyInit | Record<string, unknown>, options?: RequestInit) => {
      const url = restBaseUrl + path;
      const isJson =
        body != null &&
        typeof body === 'object' &&
        !(body instanceof FormData) &&
        !(body instanceof URLSearchParams);
      const init: RequestInit = {
        ...options,
        method,
        body: resolveBody(body),
        headers: isJson
          ? mergeHeaders({ 'Content-Type': 'application/json', ...(restHeaders as any) }, options?.headers)
          : mergeHeaders(restHeaders, options?.headers),
      };
      const requestStr =
        method === 'GET' || method === 'DELETE'
          ? `${method} ${path}`
          : body != null
            ? typeof body === 'object' && !(body instanceof FormData) && !(body instanceof URLSearchParams)
              ? JSON.stringify(body)
              : String(body)
            : `${method} ${path}`;
      const addEntry = (status: number, statusText: string, response: string) => {
        addNetworkEntry({
          type: 'rest',
          method,
          url,
          status,
          statusText,
          request: requestStr,
          response,
        });
      };

      return fetch(url, init)
        .then(async (res) => {
          const text = await res.clone().text().catch(() => '(read failed)');
          addEntry(res.status, res.statusText, text);
          return res;
        })
        .catch((err) => {
          addEntry(0, 'Error', String(err?.message ?? err));
          throw err;
        });
    },
    [restBaseUrl, restHeaders, addNetworkEntry]
  );

  const wrappedRestApi = useMemo<RestApiContextValue>(
    () => ({
      provider: 'rest',
      get: (path, options) => makeRestRequest('GET', path, undefined, options),
      post: (path, body, options) => makeRestRequest('POST', path, body, options),
      put: (path, body, options) => makeRestRequest('PUT', path, body, options),
      delete: (path, options) => makeRestRequest('DELETE', path, undefined, options),
    }),
    [makeRestRequest]
  );

  const graphqlUri =
    api.provider === 'graphql'
      ? (api.uri ?? (typeof process !== 'undefined' ? process.env?.GRAPHQL_URI : '') ?? '')
      : '';
  const graphqlClient = useMemo(() => {
    if (api.provider !== 'graphql') return null;
    const clientOpt = api.client;
    if (clientOpt) return clientOpt as ApolloClientType<NormalizedCacheObject>;
    const graphqlHeaders = api.headers;
    return new ApolloClient({
      link: new HttpLink({ uri: graphqlUri || '/graphql', headers: headersInitToRecord(graphqlHeaders) }),
      cache: new InMemoryCache(),
    });
  }, [api, graphqlUri]);

  const wrappedGraphqlApi = useMemo<GraphqlApiContextValue | null>(() => {
    if (!graphqlClient || api.provider !== 'graphql') return null;
    const url = graphqlUri || '/graphql';
    return {
      provider: 'graphql',
      ransack: (options) => {
        const requestStr = JSON.stringify({
          query: print(options.query),
          variables: options.variables,
        });
        const op = getOperationAST(options.query);
        const operationName = op?.name?.value ?? 'Query';
        return graphqlClient
          .query(
            normalizeGraphqlOptions(options as YargramGraphqlQueryOptions<OperationVariables, unknown>) as QueryOptions<
              OperationVariables,
              unknown
            >
          )
          .then((result: any) => {
            addNetworkEntry({
              type: 'graphql',
              operationName,
              url,
              status: 200,
              statusText: 'OK',
              request: requestStr,
              response: JSON.stringify(result.data ?? result),
            });
            return result;
          })
          .catch((err: any) => {
            addNetworkEntry({
              type: 'graphql',
              operationName,
              url,
              status: 0,
              statusText: 'Error',
              request: requestStr,
              response: String(err?.message ?? err),
            });
            throw err;
          });
      },
      handing: (options) => {
        const requestStr = JSON.stringify({
          mutation: print(options.mutation),
          variables: options.variables,
        });
        const op = getOperationAST(options.mutation);
        const operationName = op?.name?.value ?? 'Mutation';
        return graphqlClient
          .mutate(
            normalizeGraphqlOptions(options as YargramGraphqlMutationOptions<unknown, OperationVariables>) as MutationOptions<
              unknown,
              OperationVariables
            >
          )
          .then((result: any) => {
            addNetworkEntry({
              type: 'graphql',
              operationName,
              url,
              status: 200,
              statusText: 'OK',
              request: requestStr,
              response: JSON.stringify(result.data ?? result),
            });
            return result;
          })
          .catch((err: any) => {
            addNetworkEntry({
              type: 'graphql',
              operationName,
              url,
              status: 0,
              statusText: 'Error',
              request: requestStr,
              response: String(err?.message ?? err),
            });
            throw err;
          });
      },
    };
  }, [graphqlClient, api.provider, graphqlUri, addNetworkEntry]);

  const logWindowShortcut = useLogWindowShortcut(
    logWindow
      ? {
          escapeCount: 5,
          resetAfterMs: 1500,
          closeOnEscape: true,
        }
      : { escapeCount: 5, resetAfterMs: 1500 }
  );

  const { isOpen: isLogWindowOpen, close: closeLogWindow, open: openLogWindow } = logWindowShortcut;

  const defaultLogWindowPosition = useMemo(
    () => ({
      x: typeof window !== 'undefined' ? Math.max(0, (window.innerWidth - 696) / 2) : 100,
      y: typeof window !== 'undefined' ? Math.max(0, (window.innerHeight - 466) / 2) : 100,
    }),
    []
  );

  const yargramValue = useMemo<YargramContextValue>(
    () => ({
      addLogEntry,
      addNetworkEntry,
      openLogWindow,
      closeLogWindow,
      logEntries,
      networkEntries,
      isLogWindowOpen,
      publicKey,
    }),
    [
      addLogEntry,
      addNetworkEntry,
      openLogWindow,
      closeLogWindow,
      logEntries,
      networkEntries,
      isLogWindowOpen,
      publicKey,
    ]
  );

  const apiElement =
    api.provider === 'rest' ? (
      <ApiContext.Provider value={wrappedRestApi}>{children}</ApiContext.Provider>
    ) : wrappedGraphqlApi && graphqlClient ? (
      <ApolloProvider client={graphqlClient}>
        <ApiContext.Provider value={wrappedGraphqlApi}>{children}</ApiContext.Provider>
      </ApolloProvider>
    ) : (
      <ApiProvider provider="graphql" uri={api.uri} client={api.client}>
        {children}
      </ApiProvider>
    );

  /** 認証なしのときのみここでログウィンドウを表示。認証ありのときは LogWindowGate で表示 */
  const logWindowElement =
    !auth &&
    isLogWindowOpen &&
    typeof document !== 'undefined' &&
    createPortal(
      <div onClick={(e) => e.stopPropagation()}>
        <LogWindow
          key={instanceId}
          entries={logEntries}
          networkEntries={networkEntries}
          visibleRows={logWindow?.visibleRows}
          draggable
          animateOnOpen
          onClose={closeLogWindow}
          defaultPosition={defaultLogWindowPosition}
        />
      </div>,
      document.body
    );

  const content = (
    <PrinterProvider env={env} printer={wrappedPrinter}>
      {apiElement}
    </PrinterProvider>
  );

  return (
    <YargramContext.Provider value={yargramValue}>
      {auth ? (
        <>
          <AuthEscapeToLogin>{content}</AuthEscapeToLogin>
          <LogWindowGate
            instanceId={instanceId}
            defaultPosition={defaultLogWindowPosition}
            loginTitle={typeof auth === 'object' ? auth.loginTitle : undefined}
            isAuthenticated={isAuthenticated}
            login={handleLogin}
            logout={logout}
            loginError={loginError}
            clearLoginError={clearLoginError}
            logEntries={logEntries}
            networkEntries={networkEntries}
            isLogWindowOpen={isLogWindowOpen}
            closeLogWindow={closeLogWindow}
            logWindowConfig={logWindow}
          />
        </>
      ) : (
        content
      )}
      {logWindowElement}
    </YargramContext.Provider>
  );
}

export function useYargram(): YargramContextValue {
  const ctx = useContext(YargramContext);
  if (!ctx) {
    throw new Error('useYargram must be used within YargramProvider');
  }
  return ctx;
}
