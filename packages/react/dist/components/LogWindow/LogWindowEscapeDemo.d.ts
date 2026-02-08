import type { LogEntry, NetworkEntry } from './types';
import './LogWindow.css';
export type LogWindowEscapeDemoProps = {
    entries?: LogEntry[];
    networkEntries?: NetworkEntry[];
};
/**
 * Escape を 5 回押すとログウィンドウを表示するデモ。
 * Storybook でテスト用に利用。
 */
export declare function LogWindowEscapeDemo({ entries, networkEntries, }: LogWindowEscapeDemoProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=LogWindowEscapeDemo.d.ts.map