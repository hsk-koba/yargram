import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiProvider, useApi } from './ApiContext';
function Consumer() {
    const api = useApi();
    const [result, setResult] = React.useState('');
    const callGet = () => {
        if (api.provider !== 'rest')
            return;
        api.get('/test').then((r) => setResult(`${r.status}`)).catch(() => setResult('error'));
    };
    return (_jsxs("div", { children: [_jsx("span", { "data-testid": "provider", children: api.provider }), _jsx("button", { type: "button", onClick: callGet, children: "GET" }), _jsx("span", { "data-testid": "result", children: result })] }));
}
describe('ApiProvider (REST)', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            statusText: 'OK',
            clone: () => ({ text: () => Promise.resolve('{}') }),
        }));
    });
    it('provides REST api and useApi returns provider rest', () => {
        render(_jsx(ApiProvider, { provider: "rest", baseUrl: "https://api.example.com", children: _jsx(Consumer, {}) }));
        expect(screen.getByTestId('provider')).toHaveTextContent('rest');
    });
    it('get() calls fetch with correct url', async () => {
        const user = userEvent.setup();
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            statusText: 'OK',
            clone: () => ({ text: () => Promise.resolve('[]') }),
        });
        vi.stubGlobal('fetch', fetchMock);
        render(_jsx(ApiProvider, { provider: "rest", baseUrl: "https://api.example.com", children: _jsx(Consumer, {}) }));
        await user.click(screen.getByRole('button', { name: /get/i }));
        expect(fetchMock).toHaveBeenCalledWith('https://api.example.com/test', expect.objectContaining({ method: 'GET' }));
        expect(screen.getByTestId('result')).toHaveTextContent('200');
    });
    it('useApi throws when used outside provider', () => {
        expect(() => render(_jsx(Consumer, {}))).toThrow('useApi must be used within ApiProvider');
    });
});
