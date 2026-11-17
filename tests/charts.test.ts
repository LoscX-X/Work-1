import test from 'node:test';
import assert from 'node:assert/strict';
import { createDataset } from '../src/lib/data-core.ts';
import { buildChart, defaultChartSettings } from '../src/features/charts/options.ts';

test('analysis reports disjoint exclusion counts and fits only the included measurements', () => {
  const data = createDataset(
    ['x', 'y', '组'],
    [
      [0, 2, 'A'],
      [1, 5, 'A'],
      [2, 8, 'B'],
      [3, '', 'B'],
      [4, 'bad', 'B'],
      [5, 100, 'B'],
      [6, 20, 'B'],
      [7, 23, 'B'],
      [8, 26, 'B'],
      [9, 29, 'B'],
    ],
  );
  const settings = {
    ...defaultChartSettings(data),
    xColumnId: 0,
    yColumnId: 1,
    excludeImputed: true,
  };
  const result = buildChart(data, settings, new Set(['7:1']));
  assert.equal(result.used, 7);
  assert.deepEqual(result.excluded, { missing: 1, invalid: 1, imputed: 1 });
  assert.ok(result.regression);
  assert.ok(Math.abs(result.regression.slope - 3) < 1e-12);
  assert.ok(Math.abs(result.regression.intercept - 2) < 1e-12);
  assert.equal(
    result.used + Object.values(result.excluded).reduce((sum, count) => sum + count, 0),
    data.rows.length,
  );
});

test('histograms use the selected numeric field without requiring a complete X field', () => {
  const data = createDataset(
    ['x', 'y'],
    [
      ['', 1],
      ['', 2],
      ['', 3],
    ],
  );
  const settings = {
    ...defaultChartSettings(data),
    kind: 'histogram' as const,
    xColumnId: 0,
    yColumnId: 1,
  };
  const result = buildChart(data, settings);
  assert.equal(result.used, 3);
  assert.equal(result.regression, null);
  const series = result.option.series as { data: number[] }[];
  assert.equal(
    series[0].data.reduce((sum, count) => sum + count, 0),
    3,
  );
});

test('categorical and constant X axes do not claim a defined linear regression', () => {
  const data = createDataset(
    ['组', 'y'],
    [
      ['A', 1],
      ['B', 2],
      ['A', 3],
    ],
  );
  const result = buildChart(data, { ...defaultChartSettings(data), xColumnId: 0, yColumnId: 1 });
  assert.equal(result.regression, null);
  assert.equal(result.points[0].value[0], 'A');
  assert.equal(result.used, 3);
});
