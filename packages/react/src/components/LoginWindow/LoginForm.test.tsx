import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('renders file input and submit button', () => {
    const onLogin = vi.fn();
    render(<LoginForm onLogin={onLogin} />);
    expect(screen.getByLabelText(/private key/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  it('submit button is disabled when file is not selected', () => {
    const onLogin = vi.fn();
    render(<LoginForm onLogin={onLogin} />);
    expect(screen.getByRole('button', { name: /log in/i })).toBeDisabled();
  });

  it('calls onLogin with pem text on submit', async () => {
    const user = userEvent.setup();
    const onLogin = vi.fn().mockResolvedValue(undefined);
    render(<LoginForm onLogin={onLogin} />);

    const pem = '-----BEGIN PRIVATE KEY-----\nZm9v\n-----END PRIVATE KEY-----\n';
    const file = new File([pem], 'private_key.pem', { type: 'application/x-pem-file' });
    await user.upload(screen.getByLabelText(/private key/i), file);

    await user.click(screen.getByRole('button', { name: /log in/i }));
    expect(onLogin).toHaveBeenCalledWith(pem);
  });

  it('shows custom title when provided', () => {
    render(<LoginForm onLogin={vi.fn()} title="Sign in" />);
    expect(screen.getByText('Sign in')).toBeInTheDocument();
  });

  it('shows custom submit label when provided', () => {
    render(<LoginForm onLogin={vi.fn()} submitLabel="Submit" />);
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });
});
