import React from 'react';
import type { DriftReport } from '../types';

interface Props {
  report: DriftReport;
}

export function SummaryBar({ report }: Props) {
  const total = report.drifts.length;

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
            Analysis complete · {report.schemaType}
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5, maxWidth: 620 }}>
            {report.summary}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <StatChip count={report.breakingCount} label="Breaking" color="var(--breaking)" bg="var(--breaking-bg)" border="var(--breaking-border)" />
          <StatChip count={report.warningCount} label="Warning" color="var(--warning)" bg="var(--warning-bg)" border="var(--warning-border)" />
          <StatChip count={report.safeCount} label="Safe" color="var(--safe)" bg="var(--safe-bg)" border="var(--safe-border)" />
          <StatChip count={total} label="Total" color="var(--text-secondary)" bg="var(--bg-editor)" border="var(--border)" />
        </div>
      </div>

      {report.breakingCount > 0 && (
        <div style={{
          background: 'var(--breaking-bg)',
          border: '1px solid var(--breaking-border)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 14px',
          fontSize: 13,
          color: 'var(--breaking)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
        }}>
          <span style={{ marginTop: 1, flexShrink: 0 }}>⚠</span>
          <span>
            <strong>{report.breakingCount} breaking change{report.breakingCount > 1 ? 's' : ''} detected.</strong>{' '}
            {report.migrationNote}
          </span>
        </div>
      )}
    </div>
  );
}

function StatChip({ count, label, color, bg, border }: {
  count: number; label: string; color: string; bg: string; border: string;
}) {
  return (
    <div style={{
      textAlign: 'center',
      background: bg,
      border: `1px solid ${border}`,
      borderRadius: 'var(--radius-md)',
      padding: '8px 14px',
      minWidth: 56,
    }}>
      <div style={{ fontSize: 20, fontWeight: 600, color, lineHeight: 1 }}>{count}</div>
      <div style={{ fontSize: 11, color, marginTop: 3, opacity: 0.8 }}>{label}</div>
    </div>
  );
}
