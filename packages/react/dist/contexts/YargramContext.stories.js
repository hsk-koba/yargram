import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { gql } from '@apollo/client';
import { YargramProvider, useYargram } from './YargramContext';
import { usePrinter } from './PrinterContext';
import { useApi } from './ApiContext';
function DemoContent() {
    const { openLogWindow } = useYargram();
    const printer = usePrinter();
    const api = useApi();
    const addInfo = () => printer.info('Info from usePrinter');
    const addWarn = () => printer.warn('Warn from usePrinter');
    const addError = () => printer.error('Error from usePrinter');
    if (api.provider === 'rest') {
        return (_jsxs("div", { style: { padding: 24, fontFamily: 'sans-serif' }, children: [_jsx("h3", { children: "YargramProvider \u30C7\u30E2 (REST)" }), _jsx("p", { children: "Escape \u30AD\u30FC\u3092 5 \u56DE\u62BC\u3059\u3068\u30ED\u30B0\u30A6\u30A3\u30F3\u30C9\u30A6\u304C\u958B\u304D\u307E\u3059\u3002" }), _jsx("p", { style: { fontSize: 12, color: '#666', marginTop: 8 }, children: "usePrinter().info / warn / error \u2192 Log \u30BF\u30D6\u3002useApi().get / post / put / delete \u2192 Network \u30BF\u30D6\u306B\u53CD\u6620\u3002" }), _jsxs("div", { style: { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }, children: [_jsx("button", { type: "button", onClick: addInfo, children: "Log: Info" }), _jsx("button", { type: "button", onClick: addWarn, children: "Log: Warn" }), _jsx("button", { type: "button", onClick: addError, children: "Log: Error" }), _jsx("button", { type: "button", onClick: () => api.get('/posts').then((res) => printer.info(`Response: ${res.status} ${res.statusText}`)).catch((err) => printer.error(`Error: ${err.message}`)), children: "Network: GET /posts" }), _jsx("button", { type: "button", onClick: () => api
                                .post('/posts', { title: 'Storybook post', body: 'Body from demo', userId: 1 })
                                .then((res) => printer.info(`Response: ${res.status} ${res.statusText}`))
                                .catch((err) => printer.error(`Error: ${err.message}`)), children: "Network: POST /posts" }), _jsx("button", { type: "button", onClick: () => api
                                .put('/posts/1', { id: 1, title: 'Updated title', body: 'Updated body', userId: 1 })
                                .then((res) => printer.info(`Response: ${res.status} ${res.statusText}`))
                                .catch((err) => printer.error(`Error: ${err.message}`)), children: "Network: PUT /posts/1" }), _jsx("button", { type: "button", onClick: () => api.delete('/posts/1').then((res) => printer.info(`Response: ${res.status} ${res.statusText}`)).catch(() => { }), children: "Network: DELETE /posts/1" }), _jsx("button", { type: "button", onClick: openLogWindow, children: "\u30ED\u30B0\u30A6\u30A3\u30F3\u30C9\u30A6\u3092\u958B\u304F" })] })] }));
    }
    const runQuery = () => {
        api
            .ransack({
            query: gql `
          query GetUser { user(id: "1") { id name } }
        `,
        })
            .catch((err) => printer.error(`Error: ${err.message}`));
    };
    const runMutation = () => {
        api
            .handing({
            mutation: gql `
          mutation UpdateUser { updateUser(id: "1", name: "x") { id name } }
        `,
        })
            .catch((err) => printer.error(`Error: ${err.message}`));
    };
    return (_jsxs("div", { style: { padding: 24, fontFamily: 'sans-serif' }, children: [_jsx("h3", { children: "YargramProvider \u30C7\u30E2 (GraphQL)" }), _jsx("p", { children: "useApi().ransack (QUERY) / .handing (MUTATION) \u3067 Network \u30BF\u30D6\u306B\u53CD\u6620\u3002" }), _jsxs("div", { style: { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }, children: [_jsx("button", { type: "button", onClick: addInfo, children: "Log: Info" }), _jsx("button", { type: "button", onClick: runQuery, children: "Network: ransack (QUERY)" }), _jsx("button", { type: "button", onClick: runMutation, children: "Network: handing (MUTATION)" }), _jsx("button", { type: "button", onClick: openLogWindow, children: "\u30ED\u30B0\u30A6\u30A3\u30F3\u30C9\u30A6\u3092\u958B\u304F" })] })] }));
}
const meta = {
    title: 'Contexts/YargramProvider',
    component: YargramProvider,
    parameters: { layout: 'centered' },
    tags: ['autodocs'],
};
export default meta;
/** Api (REST) + Printer + LogWindow（Escape 5回で表示）。REST は JSONPlaceholder /posts を使用 */
export const Default = {
    render: () => (_jsx(YargramProvider, { api: { provider: 'rest', baseUrl: 'https://jsonplaceholder.typicode.com' }, printer: { env: 'local' }, logWindow: {}, children: _jsx(DemoContent, {}) })),
};
/**
 * 本番時のみ認証（auth: true）。
 * storybookSimulateProduction: true で Storybook 内だけ本番扱いし、ログイン画面を表示。
 * 本番ビルド時は NODE_ENV=production で同様にログイン要求。
 */
export const WithAuthProductionOnly = {
    render: () => (_jsx(YargramProvider, { api: { provider: 'rest', baseUrl: 'https://jsonplaceholder.typicode.com' }, printer: { env: 'local' }, logWindow: {}, auth: { storybookSimulateProduction: true }, children: _jsx(DemoContent, {}) })),
};
/** GraphQL: useApi().ransack (QUERY) / .handing (MUTATION) → Network */
export const GraphQL = {
    render: () => (_jsx(YargramProvider, { api: { provider: 'graphql', uri: 'https://api.example.com/graphql' }, printer: { env: 'local' }, logWindow: {}, children: _jsx(DemoContent, {}) })),
};
