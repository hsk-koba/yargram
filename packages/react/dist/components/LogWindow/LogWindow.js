import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useCallback, useEffect } from 'react';
import { Terminal, Wifi, X, Download, FileJson, FileText, LogOut } from 'lucide-react';
import { LogEntryRow } from './LogEntryRow';
import { NetworkEntryRow } from './NetworkEntryRow';
import { LoginForm } from '../LoginWindow/LoginForm';
import '../LoginWindow/LoginWindow.css';
import './LogWindow.css';
function escapeCsvCell(value) {
    if (/[",\n\r]/.test(value))
        return `"${value.replace(/"/g, '""')}"`;
    return value;
}
function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
const CLOSE_ANIMATION_MS = 200;
export function LogWindow({ entries = [], networkEntries = [], defaultTab = 'logs', onTabChange, height, className = '', draggable = false, defaultPosition, animateOnOpen = false, onClose, onLogout, showLogin = false, loginTitle = 'Login', onLogin, loginError, onClearLoginError, }) {
    const [activeTab, setActiveTab] = useState(defaultTab);
    const [isClosing, setIsClosing] = useState(false);
    const [unreadLogsCount, setUnreadLogsCount] = useState(0);
    const [unreadNetworksCount, setUnreadNetworksCount] = useState(0);
    const [exportDialogOpen, setExportDialogOpen] = useState(false);
    const closeTimeoutRef = useRef(null);
    const prevEntriesLengthRef = useRef(entries.length);
    const prevNetworkEntriesLengthRef = useRef(networkEntries.length);
    const [position, setPosition] = useState(() => draggable ? defaultPosition ?? { x: 100, y: 100 } : { x: 0, y: 0 });
    const dragStartRef = useRef(null);
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
    const handleTab = (tab) => {
        setActiveTab(tab);
        if (tab === 'logs')
            setUnreadLogsCount(0);
        if (tab === 'networks')
            setUnreadNetworksCount(0);
        onTabChange?.(tab);
    };
    const handleHeaderMouseDown = useCallback((e) => {
        if (!draggable || e.button !== 0)
            return;
        e.preventDefault();
        dragStartRef.current = {
            x: position.x,
            y: position.y,
            clientX: e.clientX,
            clientY: e.clientY,
        };
    }, [draggable, position]);
    useEffect(() => {
        if (!draggable)
            return;
        const handleMouseMove = (e) => {
            if (dragStartRef.current == null)
                return;
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
            if (closeTimeoutRef.current)
                clearTimeout(closeTimeoutRef.current);
        };
    }, []);
    const handleCloseClick = useCallback(() => {
        if (!onClose || isClosing)
            return;
        setIsClosing(true);
        closeTimeoutRef.current = setTimeout(() => {
            closeTimeoutRef.current = null;
            onClose();
        }, CLOSE_ANIMATION_MS);
    }, [onClose, isClosing]);
    const handleExportCsv = useCallback(() => {
        const header = 'level,message,source\n';
        const rows = entries.map((e) => [e.level, escapeCsvCell(e.message), escapeCsvCell(e.source)].join(','));
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
    const bodyStyle = height != null ? { maxHeight: typeof height === 'number' ? `${height}px` : height } : undefined;
    const rootStyle = draggable
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
    return (_jsx("div", { className: rootClassName.trim(), ...(rootStyle != null ? { style: rootStyle } : {}), children: _jsxs("div", { className: innerClassName, children: [_jsxs("header", { className: `logWindowHeader ${draggable ? 'logWindowHeaderDraggable' : ''} ${showLogin ? 'logWindowHeaderLoginOnly' : ''}`, onMouseDown: handleHeaderMouseDown, role: draggable ? 'button' : undefined, tabIndex: draggable ? 0 : undefined, "aria-label": draggable ? 'Move window' : undefined, children: [!showLogin && (_jsxs("div", { className: "logWindowTabs", children: [_jsxs("button", { type: "button", className: `logWindowTab ${activeTab === 'logs' ? 'logWindowTabActive' : ''}`, onClick: () => handleTab('logs'), onMouseDown: (e) => draggable && e.stopPropagation(), "aria-pressed": activeTab === 'logs', children: [_jsx(Terminal, { className: "logWindowTabIcon logWindowTabIconTerminal", size: 14, "aria-hidden": true }), "Logs", activeTab !== 'logs' && unreadLogsCount > 0 && (_jsx("span", { className: "logWindowTabBadge", "aria-label": `New logs: ${unreadLogsCount}`, children: unreadLogsCount > 99 ? '99+' : unreadLogsCount }))] }), _jsxs("button", { type: "button", className: `logWindowTab ${activeTab === 'networks' ? 'logWindowTabActive' : ''}`, onClick: () => handleTab('networks'), onMouseDown: (e) => draggable && e.stopPropagation(), "aria-pressed": activeTab === 'networks', children: [_jsx(Wifi, { className: "logWindowTabIcon logWindowTabIconWifi", size: 14, "aria-hidden": true }), "Networks", activeTab !== 'networks' && unreadNetworksCount > 0 && (_jsx("span", { className: "logWindowTabBadge", "aria-label": `New networks: ${unreadNetworksCount}`, children: unreadNetworksCount > 99 ? '99+' : unreadNetworksCount }))] })] })), showLogin && _jsx("span", { className: "logWindowHeaderLoginTitle", children: loginTitle }), onLogout && !showLogin && (_jsxs("button", { type: "button", className: "logWindowLogoutButton", onClick: onLogout, "aria-label": "Log out", title: "Log out", children: [_jsx(LogOut, { size: 14, "aria-hidden": true }), _jsx("span", { children: "Log out" })] })), onClose ? (_jsx("button", { type: "button", className: "logWindowCloseButton", onClick: handleCloseClick, disabled: isClosing, "aria-label": "close", title: "close", children: _jsx(X, { size: 16, fill: "currentColor", "aria-hidden": true }) })) : (_jsx("span", { className: "logWindowIndicator", title: "Recording / Active", children: _jsx(X, { size: 16, fill: "currentColor", "aria-hidden": true }) }))] }), _jsx("div", { className: "logWindowBody", style: bodyStyle, children: showLogin && onLogin ? (_jsx(LoginForm, { title: loginTitle, onLogin: onLogin, errorMessage: loginError, onClearError: onClearLoginError })) : (_jsxs("div", { className: "logWindowBodySlider", style: {
                            transform: activeTab === 'logs' ? 'translateX(0)' : 'translateX(-50%)',
                        }, children: [_jsx("div", { className: "logWindowBodyPanel", children: entries.map((entry) => (_jsx(LogEntryRow, { entry: entry }, entry.id))) }), _jsx("div", { className: "logWindowBodyPanel", children: networkEntries.length > 0 ? (networkEntries.map((entry) => (_jsx(NetworkEntryRow, { entry: entry }, entry.id)))) : (_jsx("div", { className: "logWindowEntry logWindowEntryInfo", style: { color: 'var(--logw-text-muted)' }, children: "Network requests will appear here." })) })] })) }), !showLogin && (_jsx("footer", { className: "logWindowFooter", children: _jsxs("button", { type: "button", className: "logWindowExportButton", onClick: () => setExportDialogOpen(true), "aria-haspopup": "dialog", "aria-expanded": exportDialogOpen, children: [_jsx(Download, { size: 14, "aria-hidden": true }), "Export"] }) })), exportDialogOpen && (_jsx("div", { className: "logWindowExportOverlay", role: "dialog", "aria-modal": "true", "aria-labelledby": "logWindowExportDialogTitle", children: _jsxs("div", { className: "logWindowExportDialog", children: [_jsx("h3", { id: "logWindowExportDialogTitle", className: "logWindowExportDialogTitle", children: "Export format" }), _jsx("p", { className: "logWindowExportDialogDescription", children: "CSV \u3067\u30A8\u30AF\u30B9\u30DD\u30FC\u30C8\u3057\u307E\u3059\u304B\u3001JSON \u3067\u30A8\u30AF\u30B9\u30DD\u30FC\u30C8\u3057\u307E\u3059\u304B\uFF1F" }), _jsxs("div", { className: "logWindowExportDialogActions", children: [_jsxs("button", { type: "button", className: "logWindowExportFormatButton", onClick: handleExportCsv, children: [_jsx(FileText, { size: 18, "aria-hidden": true }), "CSV"] }), _jsxs("button", { type: "button", className: "logWindowExportFormatButton", onClick: handleExportJson, children: [_jsx(FileJson, { size: 18, "aria-hidden": true }), "JSON"] })] }), _jsx("button", { type: "button", className: "logWindowExportDialogCancel", onClick: () => setExportDialogOpen(false), children: "Cancel" })] }) }))] }) }));
}
