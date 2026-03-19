import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { SchemaEditor } from './components/SchemaEditor';
import { SummaryBar } from './components/SummaryBar';
import { DriftCard } from './components/DriftCard';
import { FilterBar } from './components/FilterBar';
import { SeverityBadge } from './components/SeverityBadge';
import { analyzeDrift } from './utils/api';
import { exportAsMarkdown, copyToClipboard } from './utils/export';
import { SAMPLES } from './utils/samples';
import type { AnalysisState, DriftSeverity } from './types';

export default function App() {
  const [oldSchema, setOldSchema] = useState('');
  const [newSchema, setNewSchema] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisState>({ status: 'idle', report: null, error: null });
  const [filter, setFilter] = useState<DriftSeverity | 'all'>('all');
  const [copied, setCopied] = useState(false);
  const [activeSample, setActiveSample] = useState<string | null>(null);

  const filteredDrifts = useMemo(() => {
    if (!analysis.report) return [];
    if (filter === 'all') return analysis.report.drifts;
    return analysis.report.drifts.filter(d => d.severity === filter);
  }, [analysis.report, filter]);

  const counts = useMemo(() => {
    if (!analysis.report) return {};
    return analysis.report.drifts.reduce((acc, d) => {
      acc[d.severity] = (acc[d.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [analysis.report]);

  const handleAnalyze = async () => {
    if (!oldSchema.trim() || !newSchema.trim()) return;
    setAnalysis({ status: 'loading', report: null, error: null });
    setFilter('all');
    try {
      const report = await analyzeDrift(oldSchema, newSchema);
      setAnalysis({ status: 'success', report, error: null });
    } catch (err) {
      setAnalysis({ status: 'idle', report: null, error: (err as Error).message });
    }
  };

  const handleLoadSample = (key: string) => {
    const s = SAMPLES[key];
    setOldSchema(s.old);
    setNewSchema(s.new);
    setActiveSample(key);
    setAnalysis({ status: 'idle', report: null, error: null });
    setFilter('all');
  };

  const handleCopyReport = async () => {
    if (!analysis.report) return;
    await copyToClipboard(exportAsMarkdown(analysis.report));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const canAnalyze = oldSchema.trim().length > 10 && newSchema.trim().length > 10;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />

      <main style={{ flex: 1, maxWidth: 1100, margin: '0 auto', width: '100%', padding: '32px 24px 64px' }}>

        {/* Hero */}
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.03em', marginBottom: 8 }}>
            Schema Drift Explainer
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, maxWidth: 540, lineHeight: 1.6 }}>
            Paste two schemas — JSON, Avro, or SQL DDL. Get an AI-powered breakdown of every drift: what changed, what broke, and exactly how to fix it.
          </p>
        </div>

        {/* Sample loaders */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Try a sample:</span>
          {Object.entries(SAMPLES).map(([key, s]) => (
            <button
              key={key}
              onClick={() => handleLoadSample(key)}
              style={{
                padding: '4px 12px',
                borderRadius: 99,
                border: `1px solid ${activeSample === key ? 'var(--border-strong)' : 'var(--border)'}`,
                background: activeSample === key ? 'var(--bg-hover)' : 'var(--bg-card)',
                fontSize: 12,
                color: activeSample === key ? 'var(--text-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: activeSample === key ? 500 : 400,
                transition: 'all 0.15s',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Schema editors */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <SchemaEditor
            label="Old Schema"
            sublabel="baseline / production"
            value={oldSchema}
            onChange={v => { setOldSchema(v); setActiveSample(null); }}
            accentColor="var(--border-strong)"
            placeholder={`Paste your old schema here...\n\nSupports: JSON Schema, Apache Avro, SQL DDL`}
          />
          <SchemaEditor
            label="New Schema"
            sublabel="proposed / updated"
            value={newSchema}
            onChange={v => { setNewSchema(v); setActiveSample(null); }}
            accentColor="#a3c4a3"
            placeholder={`Paste your new schema here...\n\nSupports: JSON Schema, Apache Avro, SQL DDL`}
          />
        </div>

        {/* Analyze button */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 36 }}>
          <button
            onClick={handleAnalyze}
            disabled={!canAnalyze || analysis.status === 'loading'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '11px 28px',
              borderRadius: 'var(--radius-md)',
              background: canAnalyze && analysis.status !== 'loading' ? 'var(--text-primary)' : 'var(--bg-editor)',
              color: canAnalyze && analysis.status !== 'loading' ? '#fff' : 'var(--text-tertiary)',
              fontSize: 14,
              fontWeight: 500,
              letterSpacing: '-0.01em',
              cursor: canAnalyze && analysis.status !== 'loading' ? 'pointer' : 'not-allowed',
              border: 'none',
              transition: 'all 0.2s',
              minWidth: 200,
              justifyContent: 'center',
            }}
          >
            {analysis.status === 'loading' ? (
              <>
                <Spinner />
                Analyzing drifts...
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                Detect Schema Drift
              </>
            )}
          </button>
        </div>

        {/* Error */}
        {analysis.error && (
          <div style={{
            background: 'var(--breaking-bg)',
            border: '1px solid var(--breaking-border)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            fontSize: 13,
            color: 'var(--breaking)',
            marginBottom: 24,
          }}>
            <strong>Error:</strong> {analysis.error}
          </div>
        )}

        {/* Results */}
        {analysis.status === 'success' && analysis.report && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <SummaryBar report={analysis.report} />

            {/* Controls row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <FilterBar active={filter} onChange={setFilter} counts={counts} />

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleCopyReport}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-card)',
                    fontSize: 12,
                    color: copied ? 'var(--safe)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {copied ? '✓ Copied!' : '↗ Export Markdown'}
                </button>
              </div>
            </div>

            {/* Drift cards */}
            {filteredDrifts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-tertiary)', fontSize: 14 }}>
                No drifts in this category.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filteredDrifts.map((drift, i) => (
                  <DriftCard key={drift.id || i} drift={drift} index={i} />
                ))}
              </div>
            )}

            {/* Legend */}
            <div style={{
              borderTop: '1px solid var(--border)',
              paddingTop: 20,
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Severity guide:</span>
              {(['breaking', 'warning', 'safe', 'info'] as const).map(s => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <SeverityBadge severity={s} size="sm" />
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                    {s === 'breaking' && '— consumers will fail'}
                    {s === 'warning' && '— consumers may fail'}
                    {s === 'safe' && '— backward compatible'}
                    {s === 'info' && '— metadata only'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {analysis.status === 'idle' && !analysis.error && (
          <EmptyState />
        )}
      </main>

      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '16px 24px',
        textAlign: 'center',
        fontSize: 12,
        color: 'var(--text-tertiary)',
      }}>
        Built by{' '}
        <a href="https://www.linkedin.com/in/neha-rani-r/" target="_blank" rel="noopener noreferrer"
          style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
          Neha Rani
        </a>
        {' '}· Month 2 of 12 · DataForge Series · Powered by Groq + Llama 3.3 70B
      </footer>
    </div>
  );
}

function Spinner() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      style={{ animation: 'spin 0.8s linear infinite' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  );
}

function EmptyState() {
  return (
    <div style={{
      border: '1px dashed var(--border-strong)',
      borderRadius: 'var(--radius-lg)',
      padding: '48px 32px',
      textAlign: 'center',
      color: 'var(--text-tertiary)',
    }}>
      <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.4 }}>⇄</div>
      <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
        Paste two schemas to get started
      </div>
      <p style={{ fontSize: 13, maxWidth: 380, margin: '0 auto', lineHeight: 1.6 }}>
        Supports JSON Schema, Apache Avro, and SQL DDL. Load a sample above to see a live example.
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 28, fontSize: 12, color: 'var(--text-tertiary)' }}>
        {['Type changes', 'Removed fields', 'Required additions', 'Enum drift', 'Namespace changes'].map(tag => (
          <span key={tag} style={{
            padding: '4px 10px',
            borderRadius: 99,
            background: 'var(--bg-editor)',
            border: '1px solid var(--border)',
          }}>
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
