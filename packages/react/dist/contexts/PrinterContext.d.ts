import React from 'react';
import { createPrinter, type Env } from '@yargram/core';
export type Printer = ReturnType<typeof createPrinter>;
export type PrinterProviderProps = {
    children: React.ReactNode;
    env?: Env;
    /** 指定時は createPrinter(env) の代わりにこの printer を利用（YargramProvider で addLogEntry 連携用） */
    printer?: Printer;
};
export declare function PrinterProvider({ children, env, printer: printerProp }: PrinterProviderProps): import("react/jsx-runtime").JSX.Element;
export declare function usePrinter(): Printer;
//# sourceMappingURL=PrinterContext.d.ts.map