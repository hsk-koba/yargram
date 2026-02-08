import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Terminal, Wifi, X, Download, FileJson, FileText, LogOut } from 'lucide-react';
import type { LogEntry, LogWindowTab, NetworkEntry } from './types';
import { LogEntryRow } from './LogEntryRow';
import { NetworkEntryRow } from './NetworkEntryRow';
import { LoginForm } from '../LoginWindow/LoginForm';
import '../LoginWindow/LoginWindow.css';
import './LogWindow.css';

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export type LogWindowProps = {
  /** 表示するログエントリの配列 */
  entries?: LogEntry[];
  /** Networks タブで表示するネットワークエントリ（REST / GraphQL） */
  networkEntries?: NetworkEntry[];
  /** アクティブなタブ（未指定時は 'logs'） */
  defaultTab?: LogWindowTab;
  /** タブ切り替え時のコールバック */
  onTabChange?: (tab: LogWindowTab) => void;
  /** 高さ（CSS 値）。未指定時は max-height: 320px */
  height?: string | number;
  /** 表示する行数（2, 3 など）。指定時はボディ高さを行数に合わせる。height より優先 */
  visibleRows?: number;
  className?: string;
  /** true のときヘッダーをドラッグしてウィンドウを移動できる */
  draggable?: boolean;
  /** draggable 時の初期位置（未指定時は { x: 100, y: 100 }） */
  defaultPosition?: { x: number; y: number };
  /** true のとき表示時に Windows 風のスケール＋フェードインアニメーションを行う */
  animateOnOpen?: boolean;
  /** 右上の赤ボタンで閉じる際に呼ばれる。指定時は赤ボタンが閉じるボタンになる */
  onClose?: () => void;
  /** 指定時はヘッダーにログアウトボタンを表示（認証連携用） */
  onLogout?: () => void;
  /** true のときボディにパスワード（ログイン）画面を表示（production/staging 用） */
  showLogin?: boolean;
  /** ログイン画面のタイトル */
  loginTitle?: string;
  /** ログイン送信 */
  onLogin?: (password: string) => Promise<void>;
  /** ログイン失敗メッセージ */
  loginError?: string;
  /** ログインエラーをクリア */
  onClearLoginError?: () => void;
};

const CLOSE_ANIMATION_MS = 200;
/** 1行あたりの高さ（.logWindowEntry の min-height 28px + padding 6*2） */
const LOG_ROW_HEIGHT_PX = 40;
const LOG_PANEL_PADDING_V = 16;

export function LogWindow({
  entries = [],
  networkEntries = [],
  defaultTab = 'logs',
  onTabChange,
  height,
  visibleRows,
  className = '',
  draggable = false,
  defaultPosition,
  animateOnOpen = false,
  onClose,
  onLogout,
  showLogin = false,
  loginTitle = 'Login',
  onLogin,
  loginError,
  onClearLoginError,
}: LogWindowProps) {
  const [activeTab, setActiveTab] = useState<LogWindowTab>(defaultTab);
  const [isClosing, setIsClosing] = useState(false);
  const [unreadLogsCount, setUnreadLogsCount] = useState(0);
  const [unreadNetworksCount, setUnreadNetworksCount] = useState(0);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevEntriesLengthRef = useRef(entries.length);
  const prevNetworkEntriesLengthRef = useRef(networkEntries.length);
  const logsPanelRef = useRef<HTMLDivElement>(null);
  const networksPanelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ x: number; y: number }>(() =>
    draggable ? defaultPosition ?? { x: 100, y: 100 } : { x: 0, y: 0 }
  );
  const dragStartRef = useRef<{ x: number; y: number; clientX: number; clientY: number } | null>(null);

  useEffect(() => {
    const prevLogs = prevEntriesLengthRef.current;
    const prevNetworks = prevNetworkEntriesLengthRef.current;
    if (entries.length > prevLogs && activeTab === 'networks') {
      setUnreadLogsCount((c) => c + (entries.length - prevLogs));
    }
    prevEntriesLengthRef.current = entries.length;
    if (networkEntries.length > prevNetworks && activeTab === 'logs') {
      setUnreadNetworksCount((c) => c + (networkEntries.length - prevNetworks));
    }
    prevNetworkEntriesLengthRef.current = networkEntries.length;
  }, [entries.length, networkEntries.length, activeTab]);

  useEffect(() => {
    const el = logsPanelRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries.length]);

  useEffect(() => {
    const el = networksPanelRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [networkEntries.length]);

  const handleTab = (tab: LogWindowTab) => {
    setActiveTab(tab);
    if (tab === 'logs') setUnreadLogsCount(0);
    if (tab === 'networks') setUnreadNetworksCount(0);
    onTabChange?.(tab);
  };

  const handleHeaderMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!draggable || e.button !== 0) return;
      e.preventDefault();
      dragStartRef.current = {
        x: position.x,
        y: position.y,
        clientX: e.clientX,
        clientY: e.clientY,
      };
    },
    [draggable, position]
  );

  useEffect(() => {
    if (!draggable) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (dragStartRef.current == null) return;
      setPosition({
        x: dragStartRef.current.x + (e.clientX - dragStartRef.current.clientX),
        y: dragStartRef.current.y + (e.clientY - dragStartRef.current.clientY),
      });
    };

    const handleMouseUp = () => {
      dragStartRef.current = null;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggable]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  const handleCloseClick = useCallback(() => {
    if (!onClose || isClosing) return;
    setIsClosing(true);
    closeTimeoutRef.current = setTimeout(() => {
      closeTimeoutRef.current = null;
      onClose();
    }, CLOSE_ANIMATION_MS);
  }, [onClose, isClosing]);

  const handleExportCsv = useCallback(() => {
    const header = 'level,message,source\n';
    const rows = entries.map((e) => {
      const msgStr = typeof e.message === 'string' ? e.message : JSON.stringify(e.message);
      return [e.level, escapeCsvCell(msgStr), escapeCsvCell(e.source)].join(',');
    });
    const csv = header + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    downloadBlob(blob, `logs-${Date.now()}.csv`);
    setExportDialogOpen(false);
  }, [entries]);

  const handleExportJson = useCallback(() => {
    const data = { logs: entries, networks: networkEntries };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    downloadBlob(blob, `logs-${Date.now()}.json`);
    setExportDialogOpen(false);
  }, [entries, networkEntries]);

  const bodyStyle: React.CSSProperties | undefined =
    visibleRows != null
      ? { maxHeight: visibleRows * LOG_ROW_HEIGHT_PX + LOG_PANEL_PADDING_V }
      : height != null
        ? { maxHeight: typeof height === 'number' ? `${height}px` : height }
        : undefined;

  const rootStyle: React.CSSProperties | undefined = draggable
    ? {
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 10000,
      }
    : undefined;

  const rootClassName = [
    'logWindow',
    animateOnOpen && !isClosing ? 'logWindowOpenAnimation' : '',
    isClosing ? 'logWindowCloseAnimation' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  const innerClassName = [
    'logWindowInner',
    showLogin && loginError ? 'logWindowLoginError' : '',
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  return (
    <div
      className={rootClassName.trim()}
      {...(rootStyle != null ? { style: rootStyle } : {})}
    >
      <div className={innerClassName}>
      <header
        className={`logWindowHeader ${draggable ? 'logWindowHeaderDraggable' : ''} ${showLogin ? 'logWindowHeaderLoginOnly' : ''}`}
        onMouseDown={handleHeaderMouseDown}
        role={draggable ? 'button' : undefined}
        tabIndex={draggable ? 0 : undefined}
        aria-label={draggable ? 'Move window' : undefined}
      >
        {!showLogin && (
          <div className="logWindowTabs">
            <button
              type="button"
              className={`logWindowTab ${activeTab === 'logs' ? 'logWindowTabActive' : ''}`}
              onClick={() => handleTab('logs')}
              onMouseDown={(e) => draggable && e.stopPropagation()}
              aria-pressed={activeTab === 'logs'}
            >
              <Terminal className="logWindowTabIcon logWindowTabIconTerminal" size={14} aria-hidden />
              Logs
              {activeTab !== 'logs' && unreadLogsCount > 0 && (
                <span className="logWindowTabBadge" aria-label={`New logs: ${unreadLogsCount}`}>
                  {unreadLogsCount > 99 ? '99+' : unreadLogsCount}
                </span>
              )}
            </button>
            <button
              type="button"
              className={`logWindowTab ${activeTab === 'networks' ? 'logWindowTabActive' : ''}`}
              onClick={() => handleTab('networks')}
              onMouseDown={(e) => draggable && e.stopPropagation()}
              aria-pressed={activeTab === 'networks'}
            >
              <Wifi className="logWindowTabIcon logWindowTabIconWifi" size={14} aria-hidden />
              Networks
              {activeTab !== 'networks' && unreadNetworksCount > 0 && (
                <span className="logWindowTabBadge" aria-label={`New networks: ${unreadNetworksCount}`}>
                  {unreadNetworksCount > 99 ? '99+' : unreadNetworksCount}
                </span>
              )}
            </button>
          </div>
        )}
        {showLogin && <span className="logWindowHeaderLoginTitle">{loginTitle}</span>}
        {onLogout && !showLogin && (
          <button
            type="button"
            className="logWindowLogoutButton"
            onClick={onLogout}
            aria-label="Log out"
            title="Log out"
          >
            <LogOut size={14} aria-hidden />
            <span>Log out</span>
          </button>
        )}
        {onClose ? (
          <button
            type="button"
            className="logWindowCloseButton"
            onClick={handleCloseClick}
            disabled={isClosing}
            aria-label="close"
            title="close"
          >
            <X size={16} fill="currentColor" aria-hidden />
          </button>
        ) : (
          <span className="logWindowIndicator" title="Recording / Active">
            <X size={16} fill="currentColor" aria-hidden />
          </span>
        )}
      </header>
      <div className="logWindowBody" style={bodyStyle}>
        {showLogin && onLogin ? (
          <LoginForm
            title={loginTitle}
            onLogin={onLogin}
            errorMessage={loginError}
            onClearError={onClearLoginError}
          />
        ) : (
          <div
            className="logWindowBodySlider"
            style={{
              transform: activeTab === 'logs' ? 'translateX(0)' : 'translateX(-50%)',
            }}
          >
            <div ref={logsPanelRef} className="logWindowBodyPanel">
              {entries.map((entry) => (
                <LogEntryRow key={entry.id} entry={entry} />
              ))}
            </div>
            <div ref={networksPanelRef} className="logWindowBodyPanel">
              {networkEntries.length > 0 ? (
                networkEntries.map((entry) => (
                  <NetworkEntryRow key={entry.id} entry={entry} />
                ))
              ) : (
                <div className="logWindowEntry logWindowEntryInfo" style={{ color: 'var(--logw-text-muted)' }}>
                  Network requests will appear here.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {!showLogin && (
      <footer className="logWindowFooter">
        <button
          type="button"
          className="logWindowExportButton"
          onClick={() => setExportDialogOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={exportDialogOpen}
        >
          <Download size={14} aria-hidden />
          Export
        </button>
      </footer>
      )}
      {exportDialogOpen && (
        <div
          className="logWindowExportOverlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="logWindowExportDialogTitle"
        >
          <div className="logWindowExportDialog">
            <h3 id="logWindowExportDialogTitle" className="logWindowExportDialogTitle">
              Export format
            </h3>
            <p className="logWindowExportDialogDescription">CSV でエクスポートしますか、JSON でエクスポートしますか？</p>
            <div className="logWindowExportDialogActions">
              <button
                type="button"
                className="logWindowExportFormatButton"
                onClick={handleExportCsv}
              >
                <FileText size={18} aria-hidden />
                CSV
              </button>
              <button
                type="button"
                className="logWindowExportFormatButton"
                onClick={handleExportJson}
              >
                <FileJson size={18} aria-hidden />
                JSON
              </button>
            </div>
            <button
              type="button"
              className="logWindowExportDialogCancel"
              onClick={() => setExportDialogOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
