import { useState } from 'react';
import type { HistoryState } from '../features/cleaning/types';
import type { ChartSettings } from '../features/charts/types';
import { currentDataset } from '../features/cleaning/history';
import { imputedCellKeys } from '../features/cleaning/lineage';
import { csvText } from '../lib/data-core';
import { buildChart } from '../features/charts/options';
import { buildAuditRecord } from '../features/reports/audit-record';
import { createHtmlReport } from '../features/reports/html-report';
import { renderChartImage } from '../features/reports/render-chart';
import { downloadBlob, filenameStem } from '../lib/format';

export function useReportExport(
  history: HistoryState | null,
  settings: ChartSettings,
  notify: (text: string, error?: boolean) => void,
) {
  const [exporting, setExporting] = useState(false);

  function exportCsv() {
    if (!history) return;
    const data = currentDataset(history);
    downloadBlob(
      csvText(data),
      `${filenameStem(data.metadata.filename || '实验数据')}-当前结果.csv`,
      'text/csv;charset=utf-8',
    );
    notify(`已导出 ${data.rows.length} 条当前结果记录。`);
  }

  function exportAudit() {
    if (!history) return;
    const record = buildAuditRecord(history, settings);
    downloadBlob(
      JSON.stringify(record, null, 2),
      `${filenameStem(history.original.metadata.filename || '实验数据')}-完整处理记录.json`,
      'application/json;charset=utf-8',
    );
    notify('已导出逐格变更、移除记录与当前统计口径。');
  }

  async function exportHtml() {
    if (!history) return;
    const snapshot = history;
    setExporting(true);
    try {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
      const data = currentDataset(snapshot);
      const analysis = buildChart(data, settings, imputedCellKeys(snapshot));
      const image = analysis.emptyReason ? undefined : renderChartImage(analysis.option);
      const report = createHtmlReport(snapshot, settings, image);
      downloadBlob(
        report,
        `${filenameStem(data.metadata.filename || '实验数据')}-实验数据报告.html`,
        'text/html;charset=utf-8',
      );
      notify('报告已导出，包含图表、当前结果预览与完整处理参数。');
    } catch (error) {
      notify(error instanceof Error ? error.message : '报告导出失败。', true);
    } finally {
      setExporting(false);
    }
  }

  return { exporting, exportCsv, exportAudit, exportHtml };
}
