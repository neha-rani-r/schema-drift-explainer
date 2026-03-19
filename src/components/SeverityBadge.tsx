import React from 'react';
import type { DriftSeverity } from '../types';

const CONFIG: Record<DriftSeverity, { label: string; color: string; bg: string; border: string; dot: string }> = {
  breaking: {
    label: 'Breaking',
    color: 'var(--breaking)',
    bg: 'var(--breaking-bg)',
    border: 'var(--breaking-border)',
    dot: '#e74c3c',
  },
  warning: {
    label: 'Warning',
    color: 'var(--warning)',
    bg: 'var(--warning-bg)',
    border: 'var(--warning-border)',
    dot: '#e67e22',
  },
  safe: {
    label: 'Safe',
    color: 'var(--safe)',
    bg: 'var(--safe-bg)',
    border: 'var(--safe-border)',
    dot: '#27ae60',
  },
  info: {
    label: 'Info',
    color: 'var(--info)',
    bg: 'var(--info-bg)',
    border: 'var(--info-border)',
    dot: '#2980b9',
  },
};

interface Props {
  severity: DriftSeverity;
  size?: 'sm' | 'md';
}

export function SeverityBadge({ severity, size = 'md' }: Props) {
  const cfg = CONFIG[severity];
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: size === 'sm' ? '2px 8px' : '3px 10px',
      borderRadius: 99,
      border: `1px solid ${cfg.border}`,
      background: cfg.bg,
      color: cfg.color,
      fontSize: size === 'sm' ? 11 : 12,
      fontWeight: 500,
      letterSpacing: '0.01em',
      whiteSpace: 'nowrap',
    }}>
      <span style={{
        width: size === 'sm' ? 5 : 6,
        height: size === 'sm' ? 5 : 6,
        borderRadius: '50%',
        background: cfg.dot,
        flexShrink: 0,
      }} />
      {cfg.label}
    </span>
  );
}
