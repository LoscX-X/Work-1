import test from 'node:test';
import assert from 'node:assert/strict';
import { excelCell } from '../src/features/import/excel-cell.ts';

test('Excel zero masks preserve identifier text without rounding measurements', () => {
  assert.equal(excelCell({ address: 'A2', value: 1, numFmt: '000' }, '样本编号'), '001');
  assert.equal(excelCell({ address: 'B2', value: 1.234567, numFmt: '0.00' }, '读数'), '1.234567');
  assert.equal(excelCell({ address: 'A2', value: '001' }, '样本编号'), '001');
});

test('Excel cached formulas retain zero and errors; uncached formulas require recalculation', () => {
  assert.equal(excelCell({ address: 'B2', value: { formula: '1-1', result: 0 } }), '0');
  assert.equal(
    excelCell({ address: 'B2', value: { formula: '1/0', result: { error: '#DIV/0!' } } }),
    '#DIV/0!',
  );
  assert.throws(() => excelCell({ address: 'B2', value: { formula: '1+1' } }), /B2.*缓存结果/);
});
