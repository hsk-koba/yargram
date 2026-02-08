import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiProvider, useApi } from './ApiContext';

function Consumer() {
  const api = useApi();
  const [result, setResult] = React.useState<string>('');
  const callGet = () => {
    if (api.provider !== 'rest') return;
    api.get('/test').then((r: Response) => setResult(`${r.status}`)).catch(() => setResult('error'));
  };
  return (
    <div>
      <span data-testid="provider">{api.provider}</span>
      <button type="button" onClick={callGet}>
        GET
      </button>
      <span data-testid="result">{result}</span>
    </div>
  );
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
    render(
      <ApiProvider provider="rest" baseUrl="https://api.example.com">
        <Consumer />
      </ApiProvider>
    );
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
    render(
      <ApiProvider provider="rest" baseUrl="https://api.example.com">
        <Consumer />
      </ApiProvider>
    );
    await user.click(screen.getByRole('button', { name: /get/i }));
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/test',
      expect.objectContaining({ method: 'GET' })
    );
    expect(screen.getByTestId('result')).toHaveTextContent('200');
  });

  it('useApi throws when used outside provider', () => {
    expect(() => render(<Consumer />)).toThrow('useApi must be used within ApiProvider');
  });
});
