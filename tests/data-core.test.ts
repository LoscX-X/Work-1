import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createDataset,
  auditDataset,
  toNumber,
  toDate,
  linearRegression,
  histogram,
  csvText,
} from '../src/lib/data-core.ts';

test('sample identifiers retain leading zeros and duplicate row locations stay stable', () => {
  const data = createDataset(
    ['样本编号', '测量值'],
    [
      ['001', '10'],
      ['002', '11'],
      ['003', '12'],
      ['004', '13'],
      ['005', '错误'],
      ['006', ''],
      ['002', '11'],
    ],
  );
  assert.equal(data.columns[0].type, 'text');
  assert.equal(data.rows[0].values[0], '001');
  const audit = auditDataset(data);
  assert.equal(audit.counts.missing, 1);
  assert.equal(audit.counts.invalid, 1);
  assert.equal(audit.counts.duplicate, 1);
  const duplicate = audit.issues.find((issue) => issue.kind === 'duplicate');
  assert.ok(duplicate);
  assert.equal(duplicate.originalRowId, 3);
  assert.equal(duplicate.rowId, 8);
});

test('numeric parsing rejects partial values and non-finite numbers', () => {
  assert.equal(toNumber('1,234.5'), 1234.5);
  assert.equal(toNumber('−1.2e2'), -120);
  assert.equal(toNumber('12mg'), null);
  assert.equal(toNumber('1,23'), null);
  assert.equal(toNumber('1e999'), null);
  assert.equal(toNumber('  '), null);
});

test('calendar parsing rejects rollover dates and accepts leap days', () => {
  assert.equal(toDate('2026-02-30'), null);
  assert.equal(toDate('2026-02-29'), null);
  assert.notEqual(toDate('2024-02-29'), null);
  assert.notEqual(toDate('0000-02-29'), null);
  assert.equal(toDate('0100-02-29'), null);
  assert.notEqual(toDate('2026/11/18'), null);
  assert.equal(toDate('2026-11-18T24:00:00Z'), null);
});

test('repeated and suffixed headers always produce unique field names', () => {
  const data = createDataset(['x', 'x', 'x_2', '', '未命名列_4'], [[1, 2, 3, 4, 5]]);
  assert.equal(new Set(data.columns.map((column) => column.name)).size, 5);
  assert.deepEqual(data.rows[0].values, ['1', '2', '3', '4', '5']);
});

test('outliers are suggestions and issue overlap is counted once in the quality score', () => {
  const data = createDataset(
    ['x'],
    [[1], [2], [3], [4], [5], [6], [7], [8], [9], [10], [100], [100]],
  );
  const audit = auditDataset(data);
  assert.equal(audit.counts.outlier, 2);
  assert.equal(audit.counts.duplicate, 1);
  assert.equal(audit.affectedCells.size, 2);
  assert.equal(audit.quality, 83);
  assert.equal(data.rows.length, 12);
});

test('regression and histogram conserve the valid observations', () => {
  const regression = linearRegression([
    [0, 2],
    [1, 5],
    [2, 8],
    [NaN, 3],
  ]);
  assert.ok(regression);
  assert.equal(regression.slope, 3);
  assert.equal(regression.intercept, 2);
  assert.equal(regression.r2, 1);
  assert.equal(
    linearRegression([
      [1, 2],
      [1, 3],
    ]),
    null,
  );
  const result = histogram([1, 2, 3, 4, 5, 'error'], 3);
  assert.equal(
    result.bins.reduce((sum, bin) => sum + bin.count, 0),
    5,
  );
});

test('CSV export preserves text, embedded quotes, commas, and line breaks', () => {
  const data = createDataset(['编号', '备注'], [['001', 'a,"b"\nc']]);
  assert.equal(csvText(data), '\uFEFF编号,备注\r\n001,"a,""b""\nc"');
});

test('finite large inputs do not overflow representable mean, median, or regression', async () => {
  const { numericSummary, quantile } = await import('../src/lib/data-core.ts');
  const summary = numericSummary([1e308, 1e308]);
  assert.equal(summary.mean, 1e308);
  assert.equal(summary.sd, 0);
  assert.equal(quantile([-1e308, 1e308], 0.5), 0);
  const fit = linearRegression([
    [0, 0],
    [1e154, 2e154],
    [2e154, 4e154],
  ]);
  assert.ok(fit);
  assert.ok(Math.abs(fit.slope - 2) < 1e-12);
  assert.equal(fit.r2, 1);
  const bins = histogram([-1e308, 0, 1e308], 3);
  assert.equal(
    bins.bins.reduce((sum, bin) => sum + bin.count, 0),
    3,
  );
  assert.ok(bins.bins.every((bin) => Number.isFinite(bin.start) && Number.isFinite(bin.end)));
});
