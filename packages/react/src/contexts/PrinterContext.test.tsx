import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PrinterProvider, usePrinter } from './PrinterContext';

function Consumer() {
  const printer = usePrinter();
  return (
    <div>
      <button type="button" onClick={() => printer.info('info message')}>
        Info
      </button>
      <button type="button" onClick={() => printer.warn('warn message')}>
        Warn
      </button>
      <button type="button" onClick={() => printer.error('error message')}>
        Error
      </button>
    </div>
  );
}

describe('PrinterProvider', () => {
  it('renders children', () => {
    render(
      <PrinterProvider>
        <Consumer />
      </PrinterProvider>
    );
    expect(screen.getByRole('button', { name: /info/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /warn/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /error/i })).toBeInTheDocument();
  });

  it('usePrinter throws when used outside provider', () => {
    expect(() => render(<Consumer />)).toThrow('usePrinter must be used within PrinterProvider');
  });
});
