import React from 'react';

interface Props {
  label: string;
  sublabel: string;
  value: string;
  onChange: (v: string) => void;
  accentColor?: string;
  placeholder?: string;
}

export function SchemaEditor({ label, sublabel, value, onChange, accentColor = 'var(--border-strong)', placeholder }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 0 }}>
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 8,
        paddingBottom: 2,
        borderBottom: `2px solid ${accentColor}`,
        marginBottom: 4,
      }}>
        <span style={{ fontWeight: 500, fontSize: 13, letterSpacing: '-0.01em' }}>{label}</span>
        <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{sublabel}</span>
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || 'Paste schema here...'}
        spellCheck={false}
        style={{ height: 320, minHeight: 200 }}
      />
    </div>
  );
}
