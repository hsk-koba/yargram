import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useMemo } from 'react';
import { createPrinter } from '@yargram/core';
const PrinterContext = createContext(null);
export function PrinterProvider({ children, env = 'local', printer: printerProp }) {
    const defaultPrinter = useMemo(() => createPrinter(env), [env]);
    const printer = printerProp ?? defaultPrinter;
    const value = useMemo(() => ({ printer }), [printer]);
    return (_jsx(PrinterContext.Provider, { value: value, children: children }));
}
export function usePrinter() {
    const ctx = useContext(PrinterContext);
    if (!ctx) {
        throw new Error('usePrinter must be used within PrinterProvider');
    }
    return ctx.printer;
}
