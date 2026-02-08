import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Info, AlertTriangle, CircleAlert } from 'lucide-react';
import './LogWindow.css';
const levelIcons = {
    info: Info,
    warn: AlertTriangle,
    error: CircleAlert,
};
export function LogEntryRow({ entry }) {
    const levelClass = `logWindowEntry${entry.level.charAt(0).toUpperCase() + entry.level.slice(1)}`;
    const iconClass = `logWindowEntryIcon${entry.level.charAt(0).toUpperCase() + entry.level.slice(1)}`;
    const IconComponent = levelIcons[entry.level];
    return (_jsxs("div", { className: `logWindowEntry ${levelClass}`, children: [_jsx("span", { className: `logWindowEntryIcon ${iconClass}`, children: _jsx(IconComponent, { size: 12 }) }), _jsx("span", { className: "logWindowEntryMessage", children: entry.message }), _jsx("span", { className: "logWindowEntrySource", children: entry.source })] }));
}
