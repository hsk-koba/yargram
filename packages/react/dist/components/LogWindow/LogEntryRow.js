import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Info, AlertTriangle, CircleAlert, ChevronRight, ChevronDown } from 'lucide-react';
import './LogWindow.css';
const levelIcons = {
    info: Info,
    warn: AlertTriangle,
    error: CircleAlert,
};
function isExpandableMessage(msg) {
    return typeof msg === 'object' && msg !== null;
}
function getMessageSummary(msg) {
    if (Array.isArray(msg))
        return `Array (${msg.length})`;
    return `Object (${Object.keys(msg).length} keys)`;
}
function LogEntryMessage({ message }) {
    const [expanded, setExpanded] = useState(false);
    if (isExpandableMessage(message)) {
        const summary = getMessageSummary(message);
        return (_jsxs("div", { className: "logWindowEntryAccordion", children: [_jsxs("button", { type: "button", className: "logWindowEntryAccordionHeader", onClick: () => setExpanded((e) => !e), "aria-expanded": expanded, children: [_jsx("span", { className: "logWindowEntryAccordionChevron", children: expanded ? _jsx(ChevronDown, { size: 14, "aria-hidden": true }) : _jsx(ChevronRight, { size: 14, "aria-hidden": true }) }), _jsx("span", { className: "logWindowEntryAccordionSummary", children: summary })] }), _jsx("div", { className: `logWindowEntryAccordionBody ${expanded ? 'logWindowEntryAccordionBodyExpanded' : ''}`, "aria-hidden": !expanded, children: _jsx("div", { className: "logWindowEntryAccordionBodyInner", children: _jsx("pre", { className: "logWindowEntryAccordionPre", children: JSON.stringify(message, null, 2) }) }) })] }));
    }
    const text = typeof message === 'string' ? message : String(message);
    return _jsx("span", { className: "logWindowEntryMessageText", children: text });
}
export function LogEntryRow({ entry }) {
    const levelClass = `logWindowEntry${entry.level.charAt(0).toUpperCase() + entry.level.slice(1)}`;
    const iconClass = `logWindowEntryIcon${entry.level.charAt(0).toUpperCase() + entry.level.slice(1)}`;
    const IconComponent = levelIcons[entry.level];
    return (_jsxs("div", { className: `logWindowEntry ${levelClass}`, children: [_jsx("span", { className: `logWindowEntryIcon ${iconClass}`, children: _jsx(IconComponent, { size: 12 }) }), _jsx("span", { className: "logWindowEntryMessage", children: _jsx(LogEntryMessage, { message: entry.message }) }), _jsx("span", { className: "logWindowEntrySource", children: entry.source })] }));
}
