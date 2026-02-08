import React, { useState } from 'react';
import { Globe, Database, ChevronRight, ChevronDown } from 'lucide-react';
import type { NetworkEntry } from './types';
import './LogWindow.css';

type NetworkEntryRowProps = {
  entry: NetworkEntry;
};

function getStatusColor(status?: number): string {
  if (status == null) return 'var(--logw-text-muted)';
  if (status >= 200 && status < 300) return '#4ec9b0';
  if (status >= 400) return '#f14c4c';
  return 'var(--logw-text-muted)';
}

export function NetworkEntryRow({ entry }: NetworkEntryRowProps) {
  const [expanded, setExpanded] = useState(false);
  const statusColor = getStatusColor(entry.status);
  const statusText = entry.statusText ?? (entry.status != null ? String(entry.status) : '—');
  const hasDetails = Boolean(entry.request ?? entry.response);

  const handleToggle = () => {
    if (hasDetails) setExpanded((e) => !e);
  };

  const header = (
    <div
      className={`logWindowNetworkEntry ${hasDetails ? 'logWindowNetworkEntryClickable' : ''}`}
      onClick={hasDetails ? handleToggle : undefined}
      onKeyDown={
        hasDetails
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleToggle();
              }
            }
          : undefined
      }
      role={hasDetails ? 'button' : undefined}
      tabIndex={hasDetails ? 0 : undefined}
      aria-expanded={hasDetails ? expanded : undefined}
    >
      <span className="logWindowNetworkEntryChevron">
        {hasDetails ? (
          expanded ? (
            <ChevronDown size={14} aria-hidden />
          ) : (
            <ChevronRight size={14} aria-hidden />
          )
        ) : null}
      </span>
      <span
        className={`logWindowNetworkEntryIcon ${entry.type === 'graphql' ? 'logWindowNetworkEntryIconGraphql' : ''}`}
        title={entry.type === 'rest' ? 'REST' : 'GraphQL'}
      >
        {entry.type === 'rest' ? <Globe size={12} /> : <Database size={12} />}
      </span>
      {entry.type === 'rest' ? (
        <>
          <span className="logWindowNetworkEntryMethod">{entry.method}</span>
          <span className="logWindowNetworkEntryUrl">{entry.url}</span>
        </>
      ) : (
        <span className="logWindowNetworkEntryOperation">
          {entry.operationName ?? '(anonymous)'}
        </span>
      )}
      <span className="logWindowNetworkEntryStatus" style={{ color: statusColor }}>
        {statusText}
      </span>
    </div>
  );

  return (
    <div className="logWindowNetworkEntryAccordion">
      {header}
      {hasDetails && (entry.request != null || entry.response != null) && (
        <div
          className={`logWindowNetworkEntryDetailsWrapper ${expanded ? 'logWindowNetworkEntryDetailsWrapperExpanded' : ''}`}
          aria-hidden={!expanded}
        >
          <div className="logWindowNetworkEntryDetails">
            {entry.request != null && (
              <div className="logWindowNetworkEntryDetailSection">
                <div className="logWindowNetworkEntryDetailLabel">Request</div>
                <pre className="logWindowNetworkEntryDetailContent">{entry.request}</pre>
              </div>
            )}
            {entry.response != null && (
              <div className="logWindowNetworkEntryDetailSection">
                <div className="logWindowNetworkEntryDetailLabel">Response</div>
                <pre className="logWindowNetworkEntryDetailContent">{entry.response}</pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
