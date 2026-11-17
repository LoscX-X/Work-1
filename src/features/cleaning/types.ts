import type { ColumnType, Dataset } from '../../lib/data-core.ts';

export type Operation =
  | { kind: 'trim'; columnId: number | null }
  | { kind: 'normalize_numbers'; columnId: number | null }
  | { kind: 'invalid_to_missing'; columnId: number }
  | {
      kind: 'fill_missing';
      columnId: number;
      method: 'mean' | 'median' | 'constant';
      value?: string;
    }
  | { kind: 'drop_missing'; columnId: number | null }
  | { kind: 'remove_duplicates' }
  | { kind: 'drop_outliers'; columnId: number }
  | { kind: 'change_type'; columnId: number; type: ColumnType }
  | { kind: 'set_cell'; columnId: number; rowId: number; value: string };

export interface CellChange {
  rowId: number;
  columnId: number;
  column: string;
  before: string;
  after: string;
}

export interface OperationResult {
  dataset: Dataset;
  operation: Operation;
  title: string;
  description: string;
  changedCells: CellChange[];
  removedRowIds: number[];
  schemaChanged: boolean;
}

export interface OperationEntry {
  id: string;
  timestamp: string;
  result: OperationResult;
}

export interface HistoryState {
  original: Dataset;
  entries: OperationEntry[];
  cursor: number;
}
