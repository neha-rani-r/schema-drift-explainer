export type DriftSeverity = 'breaking' | 'warning' | 'safe' | 'info';

export interface DriftItem {
  id: string;
  field: string;
  changeType: string;
  severity: DriftSeverity;
  oldValue: string;
  newValue: string;
  whyItMatters: string;
  howToFix: string;
}

export interface DriftReport {
  summary: string;
  breakingCount: number;
  warningCount: number;
  safeCount: number;
  drifts: DriftItem[];
  migrationNote: string;
  schemaType: string;
}

export type SchemaFormat = 'json' | 'avro' | 'sql' | 'auto';

export interface AnalysisState {
  status: 'idle' | 'loading' | 'success' | 'error';
  report: DriftReport | null;
  error: string | null;
}
