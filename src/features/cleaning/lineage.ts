import type { HistoryState } from './types.ts';

export interface CellProvenance {
  origin: 'imputed' | 'edited' | 'cleared' | 'formatted';
  step: number;
  title: string;
  before: string;
  after: string;
}

export function deriveLineage(history: HistoryState): Map<string, CellProvenance> {
  const lineage = new Map<string, CellProvenance>();
  history.entries.slice(0, history.cursor).forEach((entry, index) => {
    for (const cell of entry.result.changedCells) {
      const key = `${cell.rowId}:${cell.columnId}`;
      const previous = lineage.get(key);
      const kind = entry.result.operation.kind;
      const origin =
        kind === 'fill_missing'
          ? 'imputed'
          : kind === 'set_cell'
            ? 'edited'
            : kind === 'invalid_to_missing'
              ? 'cleared'
              : previous?.origin || 'formatted';
      lineage.set(key, {
        origin,
        step: index + 1,
        title: entry.result.title,
        before: previous?.before ?? cell.before,
        after: cell.after,
      });
    }
  });
  return lineage;
}

export function imputedCellKeys(history: HistoryState): Set<string> {
  return new Set(
    Array.from(deriveLineage(history))
      .filter(([, provenance]) => provenance.origin === 'imputed')
      .map(([key]) => key),
  );
}
