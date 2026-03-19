import React, { useState } from 'react';
import type { DriftItem } from '../types';
import { SeverityBadge } from './SeverityBadge';

interface Props {
  drift: DriftItem;
  index: number;
}

export function DriftCard({ drift, index }: Props) {
  const [expanded, setExpanded] = useState(drift.severity === 'breaking');

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-strong)')}
      onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)')}
    >
      {/* Card header */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          background: 'transparent',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          textAlign: 'left',
          cursor: 'pointer',
          borderBottom: expanded ? '1px solid var(--border)' : 'none',
        }}
      >
        <span style={{
          fontSize: 11,
          color: 'var(--text-tertiary)',
          fontFamily: 'var(--font-mono)',
          minWidth: 24,
          flexShrink: 0,
        }}>
          {String(index + 1).padStart(2, '0')}
        </span>

        <code style={{
          fontSize: 13,
          fontWeight: 500,
          background: 'var(--bg-editor)',
          padding: '2px 8px',
          borderRadius: 4,
          color: 'var(--text-mono)',
          flexShrink: 0,
        }}>
          {drift.field}
        </code>

        <span style={{
          fontSize: 12,
          color: 'var(--text-secondary)',
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {drift.changeType}
        </span>

        <SeverityBadge severity={drift.severity} size="sm" />

        <span style={{
          fontSize: 14,
          color: 'var(--text-tertiary)',
          marginLeft: 4,
          transition: 'transform 0.2s',
          transform: expanded ? 'rotate(180deg)' : 'none',
          display: 'inline-block',
        }}>
          ↓
        </span>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Old → New diff */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <ValueBox label="Before" value={drift.oldValue} variant="old" />
            <ValueBox label="After" value={drift.newValue} variant="new" />
          </div>

          {/* Why it matters */}
          <Section
            icon="⚡"
            label="Why it matters"
            content={drift.whyItMatters}
            color={drift.severity === 'breaking' ? 'var(--breaking)' : drift.severity === 'warning' ? 'var(--warning)' : 'var(--text-secondary)'}
          />

          {/* How to fix */}
          <Section
            icon="→"
            label="How to fix"
            content={drift.howToFix}
            color="var(--text-secondary)"
          />
        </div>
      )}
    </div>
  );
}

function ValueBox({ label, value, variant }: { label: string; value: string; variant: 'old' | 'new' }) {
  return (
    <div style={{
      borderRadius: 'var(--radius-sm)',
      overflow: 'hidden',
      border: `1px solid ${variant === 'old' ? '#e5e3dc' : variant === 'new' ? '#dce8e0' : 'var(--border)'}`,
    }}>
      <div style={{
        padding: '4px 10px',
        fontSize: 10,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        fontWeight: 500,
        background: variant === 'old' ? '#f7f6f3' : '#f0f7f4',
        color: variant === 'old' ? 'var(--text-tertiary)' : 'var(--safe)',
        borderBottom: `1px solid ${variant === 'old' ? '#e5e3dc' : '#dce8e0'}`,
      }}>
        {label}
      </div>
      <div style={{
        padding: '8px 10px',
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        color: 'var(--text-mono)',
        background: variant === 'old' ? '#fafaf9' : '#f7fdf9',
        minHeight: 34,
        wordBreak: 'break-word',
      }}>
        {value || <em style={{ color: 'var(--text-tertiary)' }}>—</em>}
      </div>
    </div>
  );
}

function Section({ icon, label, content, color }: { icon: string; label: string; content: string; color: string }) {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <span style={{ fontSize: 13, color, flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 3, fontWeight: 500 }}>
          {label}
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>{content}</p>
      </div>
    </div>
  );
}
