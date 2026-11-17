import test from 'node:test';
import assert from 'node:assert/strict';
import { createDataset } from '../src/lib/data-core.ts';
import {
  commitOperation,
  createHistory,
  currentDataset,
  moveHistory,
} from '../src/features/cleaning/history.ts';
import {
  createRecipe,
  datasetFingerprint,
  parseRecipe,
  replayRecipe,
} from '../src/features/cleaning/recipe.ts';
import { deriveLineage, imputedCellKeys } from '../src/features/cleaning/lineage.ts';

function fixture() {
  return createDataset(
    ['编号', '读数'],
    [
      ['001', '1'],
      ['002', '2'],
      ['003', ''],
      ['004', 'bad'],
      ['005', '3'],
      ['006', '4'],
      ['007', '5'],
    ],
    { sha256: 'a'.repeat(64), filename: 'data.csv' },
  );
}

test('recipe round-trips the active operation prefix and validates identical results', async () => {
  const original = fixture();
  let history = commitOperation(createHistory(original), {
    kind: 'invalid_to_missing',
    columnId: 1,
  });
  history = commitOperation(history, { kind: 'fill_missing', columnId: 1, method: 'median' });
  history = commitOperation(history, { kind: 'trim', columnId: null });
  const recipe = parseRecipe(JSON.stringify(await createRecipe(history)));
  const replay = await replayRecipe(original, recipe);
  assert.deepEqual(currentDataset(replay), currentDataset(history));
  assert.equal(await datasetFingerprint(currentDataset(replay)), recipe.expected.fingerprint);
  assert.equal(recipe.operations.length, history.cursor);
  const undone = await createRecipe(moveHistory(history, 1));
  assert.equal(undone.operations.length, 1);
});

test('wrong source, sheet, and final checksum reject replay without mutating input', async () => {
  const original = fixture();
  const recipe = await createRecipe(
    commitOperation(createHistory(original), { kind: 'drop_missing', columnId: null }),
  );
  const snapshot = structuredClone(original);
  await assert.rejects(
    replayRecipe(
      { ...original, metadata: { ...original.metadata, sha256: 'b'.repeat(64) } },
      recipe,
    ),
    /SHA-256/,
  );
  await assert.rejects(
    replayRecipe({ ...original, metadata: { ...original.metadata, sheet: 'other' } }, recipe),
    /工作表/,
  );
  await assert.rejects(
    replayRecipe(original, {
      ...recipe,
      expected: { ...recipe.expected, fingerprint: 'f'.repeat(64) },
    }),
    /校验/,
  );
  assert.deepEqual(original, snapshot);
});

test('unknown operations and malformed parameters are rejected at the import boundary', async () => {
  const valid = await createRecipe(createHistory(fixture()));
  assert.throws(() => parseRecipe('not json'), /JSON/);
  assert.throws(() => parseRecipe(JSON.stringify({ ...valid, version: 2 })), /版本/);
  assert.throws(
    () =>
      parseRecipe(
        JSON.stringify({
          ...valid,
          operations: [{ timestamp: valid.generatedAt, parameters: { kind: 'execute_code' } }],
        }),
      ),
    /不支持的操作/,
  );
  assert.throws(
    () =>
      parseRecipe(
        JSON.stringify({
          ...valid,
          operations: [
            { timestamp: valid.generatedAt, parameters: { kind: 'trim', columnId: -1 } },
          ],
        }),
      ),
    /字段编号/,
  );
});

test('imputation lineage survives formatting and changes after an explicit manual correction', () => {
  let history = commitOperation(createHistory(fixture()), {
    kind: 'fill_missing',
    columnId: 1,
    method: 'median',
  });
  assert.ok(imputedCellKeys(history).has('4:1'));
  history = commitOperation(history, { kind: 'set_cell', rowId: 4, columnId: 1, value: '3.2' });
  assert.equal(imputedCellKeys(history).has('4:1'), false);
  assert.equal(deriveLineage(history).get('4:1')?.origin, 'edited');
  assert.equal(imputedCellKeys(moveHistory(history, 1)).has('4:1'), true);
});
