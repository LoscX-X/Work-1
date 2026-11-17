import type { Dataset } from '../../lib/data-core.ts';
import type { HistoryState, Operation, OperationEntry } from './types.ts';
import { applyOperation } from './apply-operation.ts';

export function createHistory(original: Dataset): HistoryState {
  return { original, entries: [], cursor: 0 };
}

export function currentDataset(history: HistoryState): Dataset {
  return history.cursor === 0
    ? history.original
    : history.entries[history.cursor - 1].result.dataset;
}

export function commitOperation(
  history: HistoryState,
  operation: Operation,
  timestamp = new Date().toISOString(),
): HistoryState {
  const result = applyOperation(currentDataset(history), operation);
  if (!result.changedCells.length && !result.removedRowIds.length && !result.schemaChanged)
    return history;
  const entry: OperationEntry = { id: crypto.randomUUID(), timestamp, result };
  const entries = [...history.entries.slice(0, history.cursor), entry];
  return { ...history, entries, cursor: entries.length };
}

export function moveHistory(history: HistoryState, cursor: number): HistoryState {
  if (!Number.isInteger(cursor) || cursor < 0 || cursor > history.entries.length)
    throw new Error('指定的历史位置不存在。');
  return { ...history, cursor };
}
