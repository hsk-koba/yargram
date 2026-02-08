import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useContext, useState, useCallback, useMemo, useId, useRef, useEffect, } from 'react';
import { createPortal } from 'react-dom';
import { createPrinter } from '@yargram/core';
import { ApolloClient, ApolloProvider, InMemoryCache, } from '@apollo/client';
import { getOperationAST, print } from 'graphql';
import { ApiProvider, ApiContext } from './ApiContext';
import { PrinterProvider } from './PrinterContext';
import { useLogWindowShortcut } from '../hooks/useLogWindowShortcut';
import { LogWindow } from '../components/LogWindow/LogWindow';
import '../components/LogWindow/LogWindow.css';
const AUTH_STORAGE_KEY = 'yargram_auth_token';
const DEFAULT_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7日
function isProductionOrStaging() {
    if (typeof process === 'undefined')
        return false;
    const env = process.env?.NODE_ENV;
    return env === 'production' || env === 'staging';
}
function isStorybook() {
    if (typeof window === 'undefined')
        return false;
    const w = window;
    return w.IS_STORYBOOK === true || Boolean(w.__STORYBOOK_CLIENT_API__);
}
function storybookSimulateProduction(prop) {
    if (typeof window === 'undefined')
        return false;
    const w = window;
    return prop === true || w.__YARGRAM_STORYBOOK_SIMULATE_PRODUCTION__ === true;
}
function getCurrentDomain() {
    if (typeof window === 'undefined')
        return '';
    return window.location.hostname || '';
}
function loadPersistedAuth() {
    if (typeof localStorage === 'undefined')
        return false;
    try {
        const raw = localStorage.getItem(AUTH_STORAGE_KEY);
        if (!raw)
            return false;
        const data = JSON.parse(raw);
        if (data &&
            typeof data === 'object' &&
            'token' in data &&
            'domain' in data &&
            'expiresAt' in data &&
            typeof data.domain === 'string' &&
            typeof data.expiresAt === 'number') {
            const { domain, expiresAt } = data;
            const now = Date.now();
            return domain === getCurrentDomain() && expiresAt > now;
        }
        return false;
    }
    catch {
        return false;
    }
}
function persistAuth(value, ttlMs = DEFAULT_TOKEN_TTL_MS) {
    if (typeof localStorage === 'undefined')
        return;
    try {
        if (value) {
            const token = typeof crypto !== 'undefined' && crypto.randomUUID
                ? crypto.randomUUID()
                : `t-${Date.now()}-${Math.random().toString(36).slice(2)}`;
            const domain = getCurrentDomain();
            const expiresAt = Date.now() + ttlMs;
            const data = { token, domain, expiresAt };
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
        }
        else {
            localStorage.removeItem(AUTH_STORAGE_KEY);
        }
    }
    catch {
        // ignore
    }
}
/** デフォルトパスワード "12345678" の SHA-256 (hex) */
const DEFAULT_PASSWORD_HASH = 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f';
/**
 * 環境変数からログイン用パスワードハッシュを取得。未設定時はデフォルト（12345678 の SHA-256）。
 * パスワードを変更する場合は YAHMAN_LOGIN_PASSWORD_HASH または VITE_YAHMAN_LOGIN_PASSWORD_HASH に、
 * 希望するパスワードの SHA-256 ハッシュ（hex）を設定する。
 */
function getAcceptedPasswordHash() {
    const fromProcess = typeof process !== 'undefined' && process.env?.YAHMAN_LOGIN_PASSWORD_HASH
        ? String(process.env.YAHMAN_LOGIN_PASSWORD_HASH).trim()
        : '';
    const meta = typeof import.meta !== 'undefined' ? import.meta : null;
    const viteHash = meta?.env?.VITE_YAHMAN_LOGIN_PASSWORD_HASH;
    const fromMeta = viteHash ? String(viteHash).trim() : '';
    const fromEnv = fromProcess || fromMeta;
    return fromEnv || DEFAULT_PASSWORD_HASH;
}
/** 文字列を SHA-256 でハッシュし hex 文字列で返す */
async function sha256Hex(str) {
    const buf = new TextEncoder().encode(str);
    const hash = typeof crypto !== 'undefined' && crypto.subtle
        ? await crypto.subtle.digest('SHA-256', buf)
        : new Uint8Array(0);
    return Array.from(new Uint8Array(hash))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}
function resolveBody(body) {
    if (body == null)
        return undefined;
    if (typeof body === 'string' ||
        body instanceof ArrayBuffer ||
        ArrayBuffer.isView(body) ||
        body instanceof FormData ||
        body instanceof URLSearchParams) {
        return body;
    }
    return JSON.stringify(body);
}
const YargramContext = createContext(null);
/** 認証有効時の子要素ラッパー（ログアウトは LogWindow 内のボタンから行う） */
function AuthEscapeToLogin({ children }) {
    return _jsx(_Fragment, { children: children });
}
/** 認証時はログウィンドウをポータル表示。未認証時は LogWindow 内にパスワード画面（production/staging のみ） */
function LogWindowGate({ instanceId, defaultPosition, loginTitle, isAuthenticated, login, logout, loginError, clearLoginError, logEntries, networkEntries, isLogWindowOpen, closeLogWindow, }) {
    if (!isLogWindowOpen || typeof document === 'undefined') {
        return null;
    }
    return createPortal(_jsx("div", { onClick: (e) => e.stopPropagation(), children: _jsx(LogWindow, { entries: logEntries, networkEntries: networkEntries, draggable: true, animateOnOpen: true, onClose: closeLogWindow, onLogout: isAuthenticated ? logout : undefined, defaultPosition: defaultPosition, showLogin: !isAuthenticated, loginTitle: loginTitle, onLogin: !isAuthenticated ? login : undefined, loginError: loginError, onClearLoginError: clearLoginError }, instanceId) }), document.body);
}
function generateId() {
    return typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `id-${Math.random().toString(36).slice(2)}`;
}
export function YargramProvider({ children, api, printer = {}, logWindow, auth, }) {
    const [logEntries, setLogEntries] = useState([]);
    const [networkEntries, setNetworkEntries] = useState([]);
    const instanceId = useId();
    const simulateProduction = auth && typeof auth === 'object' && isStorybook() && storybookSimulateProduction(auth.storybookSimulateProduction);
    const requiresAuth = auth && (auth === true || (typeof auth === 'object' && (auth.productionOnly !== false)))
        ? isProductionOrStaging() || !!simulateProduction
        : false;
    const [isAuthenticated, setIsAuthenticated] = useState(() => auth && requiresAuth ? loadPersistedAuth() : false);
    const [loginError, setLoginError] = useState(undefined);
    useEffect(() => {
        if (!requiresAuth)
            return;
        setIsAuthenticated(loadPersistedAuth());
    }, [requiresAuth]);
    const onLoginProp = auth && typeof auth === 'object' ? auth.onLogin : undefined;
    const authPasswordHash = auth && typeof auth === 'object' && auth.passwordHash?.trim()
        ? auth.passwordHash.trim()
        : '';
    const tokenTtlMs = auth && typeof auth === 'object' && auth.tokenTtlMs != null
        ? auth.tokenTtlMs
        : DEFAULT_TOKEN_TTL_MS;
    const login = useCallback(async (password) => {
        if (onLoginProp) {
            await onLoginProp(password);
            setLoginError(undefined);
            setIsAuthenticated(true);
            persistAuth(true, tokenTtlMs);
        }
        else {
            if (!password)
                throw new Error('Password is required.');
            const inputHash = await sha256Hex(password);
            const accepted = authPasswordHash || getAcceptedPasswordHash();
            if (inputHash.toLowerCase() !== accepted.toLowerCase()) {
                setLoginError('Invalid password.');
            }
            else {
                setLoginError(undefined);
                setIsAuthenticated(true);
                persistAuth(true, tokenTtlMs);
            }
        }
    }, [onLoginProp, authPasswordHash, tokenTtlMs]);
    const logout = useCallback(() => {
        setIsAuthenticated(false);
        persistAuth(false);
    }, []);
    const handleLogin = useCallback(async (password) => {
        setLoginError(undefined);
        try {
            await login(password);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Login failed.';
            setLoginError(message);
            throw err;
        }
    }, [login]);
    const clearLoginError = useCallback(() => setLoginError(undefined), []);
    const addLogEntry = useCallback((entry) => {
        const id = 'id' in entry && entry.id ? entry.id : generateId();
        setLogEntries((prev) => [...prev, { ...entry, id }]);
    }, []);
    const addLogEntryRef = useRef(addLogEntry);
    useEffect(() => {
        addLogEntryRef.current = addLogEntry;
    }, [addLogEntry]);
    const addNetworkEntry = useCallback((entry) => {
        const id = 'id' in entry && entry.id ? entry.id : generateId();
        setNetworkEntries((prev) => [...prev, { ...entry, id }]);
    }, []);
    const env = printer.env ?? 'local';
    const wrappedPrinter = useMemo(() => {
        const base = createPrinter(env);
        return {
            info: (msg) => {
                base.info(msg);
                addLogEntryRef.current({ level: 'info', message: msg, source: 'app' });
            },
            warn: (msg) => {
                base.warn(msg);
                addLogEntryRef.current({ level: 'warn', message: msg, source: 'app' });
            },
            error: (msg) => {
                base.error(msg);
                addLogEntryRef.current({ level: 'error', message: msg, source: 'app' });
            },
        };
    }, [env]);
    const restBaseUrl = api.provider === 'rest'
        ? (api.baseUrl ?? (typeof process !== 'undefined' ? process.env?.ENDPOINT_URL : '') ?? '')
        : '';
    const makeRestRequest = useCallback((method, path, body, options) => {
        const url = restBaseUrl + path;
        const isJson = body != null &&
            typeof body === 'object' &&
            !(body instanceof FormData) &&
            !(body instanceof URLSearchParams);
        const init = {
            ...options,
            method,
            body: resolveBody(body),
            headers: isJson ? { 'Content-Type': 'application/json', ...options?.headers } : options?.headers,
        };
        const requestStr = method === 'GET' || method === 'DELETE'
            ? `${method} ${path}`
            : body != null
                ? typeof body === 'object' && !(body instanceof FormData) && !(body instanceof URLSearchParams)
                    ? JSON.stringify(body)
                    : String(body)
                : `${method} ${path}`;
        const addEntry = (status, statusText, response) => {
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
    }, [restBaseUrl, addNetworkEntry]);
    const wrappedRestApi = useMemo(() => ({
        provider: 'rest',
        get: (path, options) => makeRestRequest('GET', path, undefined, options),
        post: (path, body, options) => makeRestRequest('POST', path, body, options),
        put: (path, body, options) => makeRestRequest('PUT', path, body, options),
        delete: (path, options) => makeRestRequest('DELETE', path, undefined, options),
    }), [makeRestRequest]);
    const graphqlUri = api.provider === 'graphql'
        ? (api.uri ?? (typeof process !== 'undefined' ? process.env?.GRAPHQL_URI : '') ?? '')
        : '';
    const graphqlClient = useMemo(() => {
        if (api.provider !== 'graphql')
            return null;
        const clientOpt = api.client;
        if (clientOpt)
            return clientOpt;
        return new ApolloClient({
            uri: graphqlUri || '/graphql',
            cache: new InMemoryCache(),
        });
    }, [api, graphqlUri]);
    const wrappedGraphqlApi = useMemo(() => {
        if (!graphqlClient || api.provider !== 'graphql')
            return null;
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
                    .query(options)
                    .then((result) => {
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
                    .catch((err) => {
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
                    .mutate(options)
                    .then((result) => {
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
                    .catch((err) => {
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
    const logWindowShortcut = useLogWindowShortcut(logWindow
        ? {
            escapeCount: 5,
            resetAfterMs: 1500,
            closeOnEscape: true,
        }
        : { escapeCount: 5, resetAfterMs: 1500 });
    const { isOpen: isLogWindowOpen, close: closeLogWindow, open: openLogWindow } = logWindowShortcut;
    const defaultLogWindowPosition = useMemo(() => ({
        x: typeof window !== 'undefined' ? Math.max(0, (window.innerWidth - 696) / 2) : 100,
        y: typeof window !== 'undefined' ? Math.max(0, (window.innerHeight - 466) / 2) : 100,
    }), []);
    const yargramValue = useMemo(() => ({
        addLogEntry,
        addNetworkEntry,
        openLogWindow,
        closeLogWindow,
        logEntries,
        networkEntries,
        isLogWindowOpen,
    }), [
        addLogEntry,
        addNetworkEntry,
        openLogWindow,
        closeLogWindow,
        logEntries,
        networkEntries,
        isLogWindowOpen,
    ]);
    const apiElement = api.provider === 'rest' ? (_jsx(ApiContext.Provider, { value: wrappedRestApi, children: children })) : wrappedGraphqlApi && graphqlClient ? (_jsx(ApolloProvider, { client: graphqlClient, children: _jsx(ApiContext.Provider, { value: wrappedGraphqlApi, children: children }) })) : (_jsx(ApiProvider, { provider: "graphql", uri: api.uri, client: api.client, children: children }));
    /** 認証なしのときのみここでログウィンドウを表示。認証ありのときは LogWindowGate で表示 */
    const logWindowElement = !auth &&
        isLogWindowOpen &&
        typeof document !== 'undefined' &&
        createPortal(_jsx("div", { onClick: (e) => e.stopPropagation(), children: _jsx(LogWindow, { entries: logEntries, networkEntries: networkEntries, draggable: true, animateOnOpen: true, onClose: closeLogWindow, defaultPosition: defaultLogWindowPosition }, instanceId) }), document.body);
    const content = (_jsx(PrinterProvider, { env: env, printer: wrappedPrinter, children: apiElement }));
    return (_jsxs(YargramContext.Provider, { value: yargramValue, children: [auth ? (_jsxs(_Fragment, { children: [_jsx(AuthEscapeToLogin, { children: content }), _jsx(LogWindowGate, { instanceId: instanceId, defaultPosition: defaultLogWindowPosition, loginTitle: typeof auth === 'object' ? auth.loginTitle : undefined, isAuthenticated: isAuthenticated, login: handleLogin, logout: logout, loginError: loginError, clearLoginError: clearLoginError, logEntries: logEntries, networkEntries: networkEntries, isLogWindowOpen: isLogWindowOpen, closeLogWindow: closeLogWindow })] })) : (content), logWindowElement] }));
}
export function useYargram() {
    const ctx = useContext(YargramContext);
    if (!ctx) {
        throw new Error('useYargram must be used within YargramProvider');
    }
    return ctx;
}
