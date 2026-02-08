import { jsx as _jsx } from "react/jsx-runtime";
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LogWindow } from './LogWindow';
describe('LogWindow', () => {
    it('renders with empty entries by default', () => {
        render(_jsx(LogWindow, {}));
        expect(screen.getByRole('button', { name: /logs/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /networks/i })).toBeInTheDocument();
    });
    it('renders log entries', () => {
        const entries = [
            { id: '1', level: 'info', message: 'Test message', source: 'app' },
            { id: '2', level: 'warn', message: 'Warning', source: 'app' },
        ];
        render(_jsx(LogWindow, { entries: entries }));
        expect(screen.getByText('Test message')).toBeInTheDocument();
        expect(screen.getByText('Warning')).toBeInTheDocument();
    });
    it('renders network entries in Networks tab', async () => {
        const user = userEvent.setup();
        const networkEntries = [
            {
                id: 'n1',
                type: 'rest',
                method: 'GET',
                url: 'https://api.example.com/posts',
                status: 200,
                statusText: 'OK',
                request: 'GET /posts',
                response: '[]',
            },
        ];
        render(_jsx(LogWindow, { networkEntries: networkEntries }));
        const networksTab = screen.getByRole('button', { name: /networks/i });
        await user.click(networksTab);
        expect(screen.getByText(/GET.*posts/i)).toBeInTheDocument();
    });
    it('shows login form when showLogin is true and onLogin provided', () => {
        const onLogin = vi.fn().mockResolvedValue(undefined);
        render(_jsx(LogWindow, { showLogin: true, loginTitle: "Sign in", onLogin: onLogin }));
        expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
        expect(screen.getAllByText('Sign in').length).toBeGreaterThan(0);
    });
    it('when showLogin, does not show Logs/Networks tabs', () => {
        render(_jsx(LogWindow, { showLogin: true, onLogin: async () => { } }));
        expect(screen.queryByRole('button', { name: /^logs$/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /^networks$/i })).not.toBeInTheDocument();
    });
    it('calls onClose when close button is clicked', async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();
        render(_jsx(LogWindow, { onClose: onClose }));
        const closeBtn = screen.getByRole('button', { name: /close/i });
        await user.click(closeBtn);
        await new Promise((r) => setTimeout(r, 250));
        expect(onClose).toHaveBeenCalled();
    });
});
