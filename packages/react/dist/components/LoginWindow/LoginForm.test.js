import { jsx as _jsx } from "react/jsx-runtime";
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';
describe('LoginForm', () => {
    it('renders password input and submit button', () => {
        const onLogin = vi.fn();
        render(_jsx(LoginForm, { onLogin: onLogin }));
        expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
    });
    it('submit button is disabled when password is empty', () => {
        const onLogin = vi.fn();
        render(_jsx(LoginForm, { onLogin: onLogin }));
        expect(screen.getByRole('button', { name: /log in/i })).toBeDisabled();
    });
    it('calls onLogin with password on submit', async () => {
        const user = userEvent.setup();
        const onLogin = vi.fn().mockResolvedValue(undefined);
        render(_jsx(LoginForm, { onLogin: onLogin }));
        await user.type(screen.getByPlaceholderText('••••••••'), 'secret');
        await user.click(screen.getByRole('button', { name: /log in/i }));
        expect(onLogin).toHaveBeenCalledWith('secret');
    });
    it('shows custom title when provided', () => {
        render(_jsx(LoginForm, { onLogin: vi.fn(), title: "Sign in" }));
        expect(screen.getByText('Sign in')).toBeInTheDocument();
    });
    it('shows custom submit label when provided', () => {
        render(_jsx(LoginForm, { onLogin: vi.fn(), submitLabel: "Submit" }));
        expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
    });
});
