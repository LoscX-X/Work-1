import test from 'node:test';
import assert from 'node:assert/strict';
import { createDataset, csvText } from '../src/lib/data-core.ts';
import {
  commitOperation,
  createHistory,
  currentDataset,
} from '../src/features/cleaning/history.ts';
import { defaultChartSettings } from '../src/features/charts/options.ts';
import { buildAuditRecord } from '../src/features/reports/audit-record.ts';
import { createHtmlReport } from '../src/features/reports/html-report.ts';

test('report and CSV describe the same active result after undo', () => {
  const original = createDataset(
    ['编号', '测量值'],
    [
      ['001', '1'],
      ['002', '2'],
      ['002', '2'],
    ],
    { filename: 'sample.csv', sha256: 'a'.repeat(64) },
  );
  const history = commitOperation(createHistory(original), { kind: 'remove_duplicates' });
  const settings = defaultChartSettings(currentDataset(history));
  const record = buildAuditRecord(history, settings);
  assert.equal(record.before.rows, 3);
  assert.equal(record.after.rows, 2);
  assert.equal(record.operations.length, 1);
  assert.deepEqual(record.operations[0].removedSourceRecordIds, [4]);
  assert.equal(csvText(currentDataset(history)).split('\r\n').length, 3);
  const report = createHtmlReport(history, settings);
  assert.ok(report.includes('处理前 3 行，处理后 2 行'));
  assert.ok(report.includes('sample.csv'));
  assert.ok(!report.includes('<script src='));
});

test('HTML reports preserve input text as text rather than executable markup', () => {
  const payload = '<img src=x onerror=alert(1)>';
  const original = createDataset(['字段'], [[payload]], {
    filename: payload,
    sha256: 'b'.repeat(64),
  });
  const history = createHistory(original);
  const report = createHtmlReport(history, defaultChartSettings(original));
  assert.ok(report.includes('&lt;img src=x onerror=alert(1)&gt;'));
  assert.ok(!report.includes(payload));
});
