import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Globe, Database, ChevronRight, ChevronDown } from 'lucide-react';
import './LogWindow.css';
function getStatusColor(status) {
    if (status == null)
        return 'var(--logw-text-muted)';
    if (status >= 200 && status < 300)
        return '#4ec9b0';
    if (status >= 400)
        return '#f14c4c';
    return 'var(--logw-text-muted)';
}
export function NetworkEntryRow({ entry }) {
    const [expanded, setExpanded] = useState(false);
    const statusColor = getStatusColor(entry.status);
    const statusText = entry.statusText ?? (entry.status != null ? String(entry.status) : '—');
    const hasDetails = Boolean(entry.request ?? entry.response);
    const handleToggle = () => {
        if (hasDetails)
            setExpanded((e) => !e);
    };
    const header = (_jsxs("div", { className: `logWindowNetworkEntry ${hasDetails ? 'logWindowNetworkEntryClickable' : ''}`, onClick: hasDetails ? handleToggle : undefined, onKeyDown: hasDetails
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleToggle();
                }
            }
            : undefined, role: hasDetails ? 'button' : undefined, tabIndex: hasDetails ? 0 : undefined, "aria-expanded": hasDetails ? expanded : undefined, children: [_jsx("span", { className: "logWindowNetworkEntryChevron", children: hasDetails ? (expanded ? (_jsx(ChevronDown, { size: 14, "aria-hidden": true })) : (_jsx(ChevronRight, { size: 14, "aria-hidden": true }))) : null }), _jsx("span", { className: `logWindowNetworkEntryIcon ${entry.type === 'graphql' ? 'logWindowNetworkEntryIconGraphql' : ''}`, title: entry.type === 'rest' ? 'REST' : 'GraphQL', children: entry.type === 'rest' ? _jsx(Globe, { size: 12 }) : _jsx(Database, { size: 12 }) }), entry.type === 'rest' ? (_jsxs(_Fragment, { children: [_jsx("span", { className: "logWindowNetworkEntryMethod", children: entry.method }), _jsx("span", { className: "logWindowNetworkEntryUrl", children: entry.url })] })) : (_jsx("span", { className: "logWindowNetworkEntryOperation", children: entry.operationName ?? '(anonymous)' })), _jsx("span", { className: "logWindowNetworkEntryStatus", style: { color: statusColor }, children: statusText })] }));
    return (_jsxs("div", { className: "logWindowNetworkEntryAccordion", children: [header, hasDetails && (entry.request != null || entry.response != null) && (_jsx("div", { className: `logWindowNetworkEntryDetailsWrapper ${expanded ? 'logWindowNetworkEntryDetailsWrapperExpanded' : ''}`, "aria-hidden": !expanded, children: _jsxs("div", { className: "logWindowNetworkEntryDetails", children: [entry.request != null && (_jsxs("div", { className: "logWindowNetworkEntryDetailSection", children: [_jsx("div", { className: "logWindowNetworkEntryDetailLabel", children: "Request" }), _jsx("pre", { className: "logWindowNetworkEntryDetailContent", children: entry.request })] })), entry.response != null && (_jsxs("div", { className: "logWindowNetworkEntryDetailSection", children: [_jsx("div", { className: "logWindowNetworkEntryDetailLabel", children: "Response" }), _jsx("pre", { className: "logWindowNetworkEntryDetailContent", children: entry.response })] }))] }) }))] }));
}
