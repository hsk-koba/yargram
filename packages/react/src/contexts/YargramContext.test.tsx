import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { YargramProvider, useYargram } from './YargramContext';
import { usePrinter } from './PrinterContext';
import { useApi } from './ApiContext';

vi.mock('react-dom', async () => {
  const actual = await vi.importActual<typeof import('react-dom')>('react-dom');
  return {
    ...actual,
    createPortal: (children: React.ReactNode) => children,
  };
});

function Consumer() {
  const yargram = useYargram();
  const printer = usePrinter();
  const api = useApi();
  return (
    <div>
      <span data-testid="is-open">{String(yargram.isLogWindowOpen)}</span>
      <span data-testid="log-entries-count">{yargram.logEntries.length}</span>
      <button type="button" onClick={yargram.openLogWindow}>
        Open
      </button>
      <button type="button" onClick={yargram.closeLogWindow} data-testid="close-log-window-btn">
        Close
      </button>
      <button
        type="button"
        onClick={() => {
          printer.info('hello');
          yargram.addLogEntry({ level: 'info', message: 'manual', source: 'test' });
        }}
      >
        Add log
      </button>
    </div>
  );
}

describe('YargramProvider', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, statusText: 'OK', clone: () => ({ text: () => Promise.resolve('{}') }) }));
  });

  it('renders children and provides useYargram', () => {
    render(
      <YargramProvider
        api={{ provider: 'rest', baseUrl: 'https://api.example.com' }}
        logWindow={{}}
      >
        <Consumer />
      </YargramProvider>
    );
    expect(screen.getByTestId('is-open')).toHaveTextContent('false');
    expect(screen.getByTestId('log-entries-count')).toHaveTextContent('0');
  });

  it('openLogWindow sets isLogWindowOpen to true', async () => {
    const user = userEvent.setup();
    render(
      <YargramProvider
        api={{ provider: 'rest', baseUrl: 'https://api.example.com' }}
        logWindow={{}}
      >
        <Consumer />
      </YargramProvider>
    );
    await user.click(screen.getByRole('button', { name: /open/i }));
    expect(screen.getByTestId('is-open')).toHaveTextContent('true');
  });

  it('addLogEntry adds to logEntries', async () => {
    const user = userEvent.setup();
    render(
      <YargramProvider
        api={{ provider: 'rest', baseUrl: 'https://api.example.com' }}
        logWindow={{}}
      >
        <Consumer />
      </YargramProvider>
    );
    expect(screen.getByTestId('log-entries-count')).toHaveTextContent('0');
    await user.click(screen.getByRole('button', { name: /add log/i }));
    expect(screen.getByTestId('log-entries-count')).toHaveTextContent('2');
  });

  it('closeLogWindow sets isLogWindowOpen to false', async () => {
    const user = userEvent.setup();
    render(
      <YargramProvider
        api={{ provider: 'rest', baseUrl: 'https://api.example.com' }}
        logWindow={{}}
      >
        <Consumer />
      </YargramProvider>
    );
    await user.click(screen.getByRole('button', { name: /open/i }));
    expect(screen.getByTestId('is-open')).toHaveTextContent('true');
    await user.click(screen.getByTestId('close-log-window-btn'));
    expect(screen.getByTestId('is-open')).toHaveTextContent('false');
  });
});
