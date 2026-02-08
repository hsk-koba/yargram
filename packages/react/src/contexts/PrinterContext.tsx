import React, { createContext, useContext, useMemo } from 'react';
import { createPrinter, type Env } from '@yargram/core';

export type Printer = ReturnType<typeof createPrinter>;

type PrinterContextValue = {
  printer: Printer;
};

const PrinterContext = createContext<PrinterContextValue | null>(null);

export type PrinterProviderProps = {
  children: React.ReactNode;
  env?: Env;
  /** 指定時は createPrinter(env) の代わりにこの printer を利用（YargramProvider で addLogEntry 連携用） */
  printer?: Printer;
};

export function PrinterProvider({ children, env = 'local', printer: printerProp }: PrinterProviderProps) {
  const defaultPrinter = useMemo(() => createPrinter(env), [env]);
  const printer = printerProp ?? defaultPrinter;
  const value = useMemo(() => ({ printer }), [printer]);

  return (
    <PrinterContext.Provider value={value}>{children}</PrinterContext.Provider>
  );
}

export function usePrinter(): Printer {
  const ctx = useContext(PrinterContext);
  if (!ctx) {
    throw new Error('usePrinter must be used within PrinterProvider');
  }
  return ctx.printer;
}
