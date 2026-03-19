import React from 'react';
import type { DriftSeverity } from '../types';

const FILTERS: { value: DriftSeverity | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'breaking', label: 'Breaking' },
  { value: 'warning', label: 'Warning' },
  { value: 'safe', label: 'Safe' },
  { value: 'info', label: 'Info' },
];

interface Props {
  active: DriftSeverity | 'all';
  onChange: (v: DriftSeverity | 'all') => void;
  counts: Record<string, number>;
}

export function FilterBar({ active, onChange, counts }: Props) {
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {FILTERS.map(f => {
        const isActive = active === f.value;
        const count = f.value === 'all'
          ? Object.values(counts).reduce((a, b) => a + b, 0)
          : (counts[f.value] || 0);

        if (f.value !== 'all' && count === 0) return null;

        return (
          <button
            key={f.value}
            onClick={() => onChange(f.value)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '5px 12px',
              borderRadius: 99,
              border: isActive ? '1px solid var(--border-strong)' : '1px solid var(--border)',
              background: isActive ? 'var(--text-primary)' : 'var(--bg-card)',
              color: isActive ? '#fff' : 'var(--text-secondary)',
              fontSize: 12,
              fontWeight: isActive ? 500 : 400,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {f.label}
            <span style={{
              fontSize: 10,
              padding: '1px 5px',
              borderRadius: 99,
              background: isActive ? 'rgba(255,255,255,0.2)' : 'var(--bg-editor)',
              color: isActive ? '#fff' : 'var(--text-tertiary)',
            }}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
