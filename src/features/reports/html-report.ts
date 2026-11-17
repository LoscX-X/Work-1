import { auditDataset, ISSUE_LABELS } from '../../lib/data-core.ts';
import { currentDataset } from '../cleaning/history.ts';
import type { HistoryState } from '../cleaning/types.ts';
import type { ChartSettings } from '../charts/types.ts';
import { buildChart } from '../charts/options.ts';
import { imputedCellKeys } from '../cleaning/lineage.ts';
import { escapeHtml, numberText } from '../../lib/format.ts';
import { buildAuditRecord } from './audit-record.ts';

export function createHtmlReport(
  history: HistoryState,
  settings: ChartSettings,
  chartImage?: string,
): string {
  const data = currentDataset(history);
  const audit = auditDataset(data);
  const record = buildAuditRecord(history, settings);
  const analysis = buildChart(data, settings, imputedCellKeys(history));
  const html = escapeHtml;
  const metric = (label: string, value: unknown) =>
    `<div class="metric"><span>${html(label)}</span><strong>${html(value)}</strong></div>`;
  const operationRows = record.operations
    .map(
      (operation) =>
        `<tr><td>${operation.step}</td><td>${html(operation.title)}</td><td>${html(operation.description)}</td><td>${operation.changedCells.length}</td><td>${operation.removedSourceRecordIds.length}</td></tr>`,
    )
    .join('');
  const fieldRows = audit.byColumn
    .map(
      (column) =>
        `<tr><td>${html(column.name)}</td><td>${html(column.type)}</td><td>${column.counts.missing}</td><td>${column.counts.invalid}</td><td>${column.counts.outlier}</td><td>${html(numberText(column.summary?.mean, 5))}</td><td>${html(numberText(column.summary?.sd, 5))}</td></tr>`,
    )
    .join('');
  const previewRows = data.rows
    .slice(0, 20)
    .map(
      (row) =>
        `<tr><td>${row.id}</td>${row.values.map((value) => `<td>${html(value)}</td>`).join('')}</tr>`,
    )
    .join('');
  const issueRows = audit.issues
    .slice(0, 30)
    .map(
      (issue) =>
        `<tr><td>${issue.rowId}</td><td>${html(issue.column)}</td><td>${html(ISSUE_LABELS[issue.kind])}</td><td>${html(issue.value || '空值')}</td><td>${html(issue.reason)}</td></tr>`,
    )
    .join('');
  const score =
    record.after.qualityReference === null ? '—' : `${record.after.qualityReference} / 100`;
  const analysisMetrics =
    settings.kind === 'histogram'
      ? metric('中位数', numberText(analysis.summary.median, 5)) +
        metric('样本标准差', numberText(analysis.summary.sd, 5))
      : metric('线性拟合斜率', numberText(analysis.regression?.slope, 5)) +
        metric('线性拟合 R²', numberText(analysis.regression?.r2, 5));
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>LabLens 数据处理报告 · ${html(data.metadata.filename)}</title><style>
body{font-family:system-ui,"Microsoft YaHei",sans-serif;color:#263441;background:#f4f6f8;margin:0;line-height:1.75}main{max-width:1100px;margin:36px auto;padding:48px;background:white;border:1px solid #e2e7ec;border-radius:16px}header{border-bottom:2px solid #accc8b;padding-bottom:24px;margin-bottom:28px}.brand{font-size:12px;letter-spacing:2px;color:#789465}h1{font-size:27px;margin:10px 0}h2{font-size:18px;margin:34px 0 14px}p{font-size:13px;color:#778695}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.metric{border:1px solid #e4e9ee;border-radius:10px;padding:17px}.metric span{font-size:12px;color:#7f8c99;display:block}.metric strong{font-size:25px;color:#647f50;display:block;margin-top:5px}table{width:100%;border-collapse:collapse;font-size:11px}th,td{padding:10px 9px;border-bottom:1px solid #e8ecf0;text-align:left;vertical-align:top;overflow-wrap:anywhere}th{background:#f5f7fa;color:#687989;font-weight:600}.table-wrap{overflow-x:auto}code,pre{font-family:Consolas,monospace;font-size:11px;overflow-wrap:anywhere;white-space:pre-wrap}.meta{padding:18px 20px;background:#f6f9f3;border-radius:10px;font-size:12px}.figure{width:100%;border:1px solid #e6eaed;border-radius:10px;margin:12px 0}.note{padding:13px 16px;background:#faf5e9;border:1px solid #f0e4c8;border-radius:8px;font-size:12px;color:#9a8762}footer{margin-top:36px;padding-top:18px;border-top:1px solid #e5e9ed;color:#9aa6b1;font-size:11px}details{margin:15px 0}summary{cursor:pointer;font-size:12px;color:#748d60}@media print{body{background:white}main{border:0;margin:0;padding:20px}h2{break-after:avoid}.metrics,.figure{break-inside:avoid}thead{display:table-header-group}}@media(max-width:700px){main{margin:0;padding:22px;border:0;border-radius:0}.metrics{grid-template-columns:1fr 1fr}}
</style></head><body><main><header><div class="brand">LABLENS / 实验数据工作台</div><h1>实验数据处理与分析报告</h1><p>${html(data.metadata.filename)}${data.metadata.sheet ? ` · ${html(data.metadata.sheet)}` : ''} · ${html(new Date(record.generatedAt).toLocaleString('zh-CN'))}</p></header>
<div class="metrics">${metric('原始记录', record.before.rows)}${metric('当前记录', record.after.rows)}${metric('已执行操作', history.cursor)}${metric('数据质量参考分', score)}</div>
<p>当前结果仍有 ${audit.issues.length} 个待确认检查项。参考分按受影响单元格比例计算，异常值需结合实验背景确认。</p>
<h2>来源与复现信息</h2><div class="meta">源文件 SHA-256<br><code>${html(data.metadata.sha256)}</code><br>处理前 ${record.before.rows} 行，处理后 ${record.after.rows} 行，累计移除 ${record.before.rows - record.after.rows} 行。原始值对照采用当前已确认的字段类型。${history.replay ? `<br>本次工作区由配置 ${html(history.replay.configName)} 于 ${html(history.replay.loadedAt)} 回放。` : ''}</div>
<h2>字段检查</h2><div class="table-wrap"><table><thead><tr><th>字段</th><th>类型</th><th>缺失</th><th>格式错误</th><th>疑似异常</th><th>数值均值</th><th>样本标准差</th></tr></thead><tbody>${fieldRows}</tbody></table></div>
<h2>处理工作流</h2>${operationRows ? `<table><thead><tr><th>步骤</th><th>操作</th><th>参数说明</th><th>修改格数</th><th>移除记录</th></tr></thead><tbody>${operationRows}</tbody></table>` : '<p>当前使用原始数据，尚未执行清洗操作。</p>'}
<h2>当前图表与统计口径</h2><p>${html(analysis.xName)} × ${html(analysis.yName)} · ${html(settings.kind)}。当前版本 ${data.rows.length} 行，参与分析 ${analysis.used} 行，排除缺失 ${analysis.excluded.missing}、格式错误 ${analysis.excluded.invalid}、填充值 ${analysis.excluded.imputed}。</p>
${chartImage ? `<img class="figure" src="${html(chartImage)}" alt="当前结果的实验数据图表">` : '<p>本报告未嵌入图像，字段和统计口径已保留。</p>'}
<div class="metrics">${metric('有效观测数', analysis.used)}${metric('Y 均值', numberText(analysis.summary.mean, 5))}${analysisMetrics}</div>
<div class="note">均值、中位数和指定值填充属于替代值，是否参与图表分析由配置明确记录。R² 描述已纳入观测的线性拟合程度。无有效观测、常量 X 或超出数值表示范围时不生成拟合；常量 Y 的 R² 显示为空。</div>
<h2>当前结果预览</h2><p>显示前 ${Math.min(20, data.rows.length)} 条，完整结果请同时导出 CSV。源记录序号在清洗后保持不变。</p><div class="table-wrap"><table><thead><tr><th>源记录</th>${data.columns.map((column) => `<th>${html(column.name)}</th>`).join('')}</tr></thead><tbody>${previewRows}</tbody></table></div>
${issueRows ? `<h2>待确认问题摘录</h2><p>显示前 ${Math.min(30, audit.issues.length)} 项。</p><table><thead><tr><th>源记录</th><th>字段</th><th>类型</th><th>值</th><th>依据</th></tr></thead><tbody>${issueRows}</tbody></table>` : ''}
<details><summary>查看完整处理记录与统计参数</summary><pre>${html(JSON.stringify(record, null, 2))}</pre></details>
<footer>LabLens 原创实验数据工作台 · 本报告在当前浏览器生成，无需外部脚本即可查看。数值统计使用有限数值；标准差采用 n−1 分母，分位数采用线性插值，异常值采用 1.5×IQR 阈值。</footer></main></body></html>`;
}
