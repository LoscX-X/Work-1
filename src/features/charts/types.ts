import type { NumericSummary } from '../../lib/data-core.ts';
import type { linearRegression } from '../../lib/data-core.ts';

export type ChartKind = 'scatter' | 'line' | 'histogram';

export interface ChartSettings {
  kind: ChartKind;
  xColumnId: number | null;
  yColumnId: number | null;
  groupColumnId: number | null;
  showFit: boolean;
  excludeImputed: boolean;
  bins: number;
}

export interface ChartPoint {
  value: [number | string, number];
  rowId: number;
  group: string;
}

export interface ChartAnalysis {
  option: Record<string, unknown>;
  points: ChartPoint[];
  used: number;
  excluded: { missing: number; invalid: number; imputed: number };
  regression: ReturnType<typeof linearRegression>;
  summary: NumericSummary;
  xName: string;
  yName: string;
  emptyReason?: string;
}
