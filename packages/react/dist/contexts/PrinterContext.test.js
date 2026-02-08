import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PrinterProvider, usePrinter } from './PrinterContext';
function Consumer() {
    const printer = usePrinter();
    return (_jsxs("div", { children: [_jsx("button", { type: "button", onClick: () => printer.info('info message'), children: "Info" }), _jsx("button", { type: "button", onClick: () => printer.warn('warn message'), children: "Warn" }), _jsx("button", { type: "button", onClick: () => printer.error('error message'), children: "Error" })] }));
}
describe('PrinterProvider', () => {
    it('renders children', () => {
        render(_jsx(PrinterProvider, { children: _jsx(Consumer, {}) }));
        expect(screen.getByRole('button', { name: /info/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /warn/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /error/i })).toBeInTheDocument();
    });
    it('usePrinter throws when used outside provider', () => {
        expect(() => render(_jsx(Consumer, {}))).toThrow('usePrinter must be used within PrinterProvider');
    });
});
