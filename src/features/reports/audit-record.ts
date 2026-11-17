import { auditDataset } from '../../lib/data-core.ts';
import type { HistoryState } from '../cleaning/types.ts';
import { currentDataset } from '../cleaning/history.ts';
import { deriveLineage } from '../cleaning/lineage.ts';
import type { ChartSettings } from '../charts/types.ts';
import { buildChart } from '../charts/options.ts';
import { imputedCellKeys } from '../cleaning/lineage.ts';

export function buildAuditRecord(history: HistoryState, settings: ChartSettings) {
  const dataset = currentDataset(history);
  const original = { ...history.original, columns: dataset.columns };
  const before = auditDataset(original);
  const after = auditDataset(dataset);
  const analysis = buildChart(dataset, settings, imputedCellKeys(history));
  const originalAnalysis = buildChart(original, settings);
  return {
    format: 'lablens.audit-record',
    version: 1,
    generatedAt: new Date().toISOString(),
    source: history.original.metadata,
    schema: dataset.columns,
    before: {
      rows: original.rows.length,
      issueCounts: before.counts,
      affectedCells: before.affectedCells.size,
      qualityReference: before.quality,
    },
    after: {
      rows: dataset.rows.length,
      issueCounts: after.counts,
      affectedCells: after.affectedCells.size,
      qualityReference: after.quality,
    },
    analysis: {
      settings,
      xName: analysis.xName,
      yName: analysis.yName,
      used: analysis.used,
      excluded: analysis.excluded,
      summary: analysis.summary,
      regression: analysis.regression,
      original: {
        used: originalAnalysis.used,
        excluded: originalAnalysis.excluded,
        regression: originalAnalysis.regression,
        summary: originalAnalysis.summary,
      },
    },
    operations: history.entries
      .slice(0, history.cursor)
      .map((entry, index) => ({
        step: index + 1,
        id: entry.id,
        timestamp: entry.timestamp,
        title: entry.result.title,
        description: entry.result.description,
        parameters: entry.result.operation,
        changedCells: entry.result.changedCells,
        removedSourceRecordIds: entry.result.removedRowIds,
        schemaChanged: entry.result.schemaChanged,
        rowsAfter: entry.result.dataset.rows.length,
      })),
    lineage: Array.from(deriveLineage(history), ([cell, provenance]) => ({ cell, ...provenance })),
    replay: history.replay || null,
    methods: {
      outliers: 'Tukey fences: [Q1 - 1.5 * IQR, Q3 + 1.5 * IQR], sample count >= 4 and IQR > 0',
      quantiles: 'Linear interpolation at (n - 1) * p',
      standardDeviation: 'Sample standard deviation (n - 1)',
      regression:
        'Unweighted ordinary least squares on included X/Y pairs; no defined R² for constant Y',
      quality:
        '100 * (1 - unique affected cells / all cells), rounded; extra duplicate rows affect every cell; zero cells yields null',
      rowIdentifiers:
        'One-based source record positions including the header; CSV blank-only records are omitted by the parser; Excel positions are worksheet row numbers',
      originalComparison: 'Original values interpreted using the currently confirmed column types',
    },
  };
}
