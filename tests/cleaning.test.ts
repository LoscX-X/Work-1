import test from 'node:test';
import assert from 'node:assert/strict';
import { createDataset, auditDataset } from '../src/lib/data-core.ts';
import { applyOperation } from '../src/features/cleaning/apply-operation.ts';
import {
  commitOperation,
  createHistory,
  currentDataset,
  moveHistory,
} from '../src/features/cleaning/history.ts';

function fixture() {
  return createDataset(
    ['编号', '读数', '组别'],
    [
      ['001', '1', ' A '],
      ['002', '2', 'A'],
      ['003', '', 'B'],
      ['004', 'bad', 'B'],
      ['005', '3', 'A'],
      ['006', '4', 'A'],
      ['007', '5', 'B'],
      ['002', '2', 'A'],
    ],
  );
}

test('preview preserves its input and reports exact cell and row changes', () => {
  const data = fixture();
  const snapshot = structuredClone(data);
  const result = applyOperation(data, { kind: 'trim', columnId: null });
  assert.deepEqual(data, snapshot);
  assert.equal(result.changedCells.length, 1);
  assert.equal(result.changedCells[0].before, ' A ');
  assert.equal(result.changedCells[0].after, 'A');
  const deduplicated = applyOperation(result.dataset, { kind: 'remove_duplicates' });
  assert.deepEqual(deduplicated.removedRowIds, [9]);
  assert.equal(deduplicated.dataset.rows[1].id, 3);
});

test('invalid-to-missing and median fill follow the declared type', () => {
  const data = fixture();
  const normalized = applyOperation(data, { kind: 'invalid_to_missing', columnId: 1 });
  assert.equal(auditDataset(normalized.dataset).counts.invalid, 0);
  assert.equal(auditDataset(normalized.dataset).counts.missing, 2);
  const filled = applyOperation(normalized.dataset, {
    kind: 'fill_missing',
    columnId: 1,
    method: 'median',
  });
  assert.equal(filled.changedCells.length, 2);
  assert.equal(filled.dataset.rows[2].values[1], '2.5');
  assert.equal(auditDataset(filled.dataset).counts.missing, 0);
  assert.throws(
    () => applyOperation(data, { kind: 'fill_missing', columnId: 2, method: 'mean' }),
    /数值字段/,
  );
});

test('all-missing numeric columns and invalid constants give actionable errors', () => {
  const data = createDataset(['读数'], [[''], ['']]);
  const numeric = applyOperation(data, {
    kind: 'change_type',
    columnId: 0,
    type: 'number',
  }).dataset;
  assert.throws(
    () => applyOperation(numeric, { kind: 'fill_missing', columnId: 0, method: 'mean' }),
    /没有可用于/,
  );
  assert.throws(
    () =>
      applyOperation(numeric, {
        kind: 'fill_missing',
        columnId: 0,
        method: 'constant',
        value: 'mg',
      }),
    /有效数值/,
  );
});

test('undo and redo restore exact values and a new branch discards old redo states', () => {
  const data = fixture();
  const first = commitOperation(createHistory(data), { kind: 'trim', columnId: null });
  const second = commitOperation(first, { kind: 'remove_duplicates' });
  assert.equal(currentDataset(second).rows.length, 7);
  const undo = moveHistory(second, 1);
  assert.equal(currentDataset(undo).rows.length, 8);
  assert.deepEqual(currentDataset(moveHistory(undo, 2)), currentDataset(second));
  const branch = commitOperation(undo, { kind: 'set_cell', rowId: 2, columnId: 1, value: '12' });
  assert.equal(branch.entries.length, 2);
  assert.equal(branch.entries[1].result.operation.kind, 'set_cell');
  assert.equal(currentDataset(branch).rows.length, 8);
  assert.equal(data.rows[0].values[1], '1');
});

test('operations that change nothing do not create misleading history entries', () => {
  const data = fixture();
  const history = createHistory(data);
  assert.equal(
    commitOperation(history, { kind: 'set_cell', rowId: 2, columnId: 1, value: '1' }),
    history,
  );
  assert.throws(() => moveHistory(history, 1), /不存在/);
});

test('drop operations preserve original row identifiers and permit an empty result', () => {
  const data = fixture();
  const result = applyOperation(data, { kind: 'drop_missing', columnId: 1 });
  assert.equal(result.dataset.rows.length, 7);
  assert.equal(
    result.dataset.rows.some((row) => row.id === 4),
    false,
  );
  const empty = applyOperation(createDataset(['a'], [['']]), {
    kind: 'drop_missing',
    columnId: null,
  });
  assert.equal(empty.dataset.rows.length, 0);
  assert.equal(auditDataset(empty.dataset).quality, null);
});
