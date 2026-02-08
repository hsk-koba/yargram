import React, { useState } from 'react';
import { Info, AlertTriangle, CircleAlert, ChevronRight, ChevronDown } from 'lucide-react';
import type { LogEntry as LogEntryType, LogLevel, LogMessage } from './types';
import './LogWindow.css';

type LogEntryRowProps = {
  entry: LogEntryType;
};

const levelIcons: Record<LogLevel, React.ComponentType<{ size?: number | string; className?: string }>> = {
  info: Info,
  warn: AlertTriangle,
  error: CircleAlert,
};

function isExpandableMessage(msg: LogMessage): msg is Record<string, unknown> | unknown[] {
  return typeof msg === 'object' && msg !== null;
}

function getMessageSummary(msg: Record<string, unknown> | unknown[]): string {
  if (Array.isArray(msg)) return `Array (${msg.length})`;
  return `Object (${Object.keys(msg).length} keys)`;
}

type LogEntryMessageProps = {
  message: LogMessage;
};

function LogEntryMessage({ message }: LogEntryMessageProps) {
  const [expanded, setExpanded] = useState(false);

  if (isExpandableMessage(message)) {
    const summary = getMessageSummary(message);
    return (
      <div className="logWindowEntryAccordion">
        <button
          type="button"
          className="logWindowEntryAccordionHeader"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
        >
          <span className="logWindowEntryAccordionChevron">
            {expanded ? <ChevronDown size={14} aria-hidden /> : <ChevronRight size={14} aria-hidden />}
          </span>
          <span className="logWindowEntryAccordionSummary">{summary}</span>
        </button>
        <div
          className={`logWindowEntryAccordionBody ${expanded ? 'logWindowEntryAccordionBodyExpanded' : ''}`}
          aria-hidden={!expanded}
        >
          <div className="logWindowEntryAccordionBodyInner">
            <pre className="logWindowEntryAccordionPre">{JSON.stringify(message, null, 2)}</pre>
          </div>
        </div>
      </div>
    );
  }

  const text = typeof message === 'string' ? message : String(message);
  return <span className="logWindowEntryMessageText">{text}</span>;
}

export function LogEntryRow({ entry }: LogEntryRowProps) {
  const levelClass = `logWindowEntry${entry.level.charAt(0).toUpperCase() + entry.level.slice(1)}` as
    | 'logWindowEntryInfo'
    | 'logWindowEntryWarn'
    | 'logWindowEntryError';
  const iconClass = `logWindowEntryIcon${entry.level.charAt(0).toUpperCase() + entry.level.slice(1)}` as
    | 'logWindowEntryIconInfo'
    | 'logWindowEntryIconWarn'
    | 'logWindowEntryIconError';

  const IconComponent = levelIcons[entry.level];

  return (
    <div className={`logWindowEntry ${levelClass}`}>
      <span className={`logWindowEntryIcon ${iconClass}`}>
        <IconComponent size={12} />
      </span>
      <span className="logWindowEntryMessage">
        <LogEntryMessage message={entry.message} />
      </span>
      <span className="logWindowEntrySource">{entry.source}</span>
    </div>
  );
}
