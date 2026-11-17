import type { AuditResult, Dataset } from '../lib/data-core';
import { numberText } from '../lib/format';

export function SummaryCards({ dataset, audit }: { dataset: Dataset; audit: AuditResult }) {
  return (
    <div className="summary-grid">
      <div className="stat-card">
        <div className="stat-label">数据记录</div>
        <div className="stat-value">
          {numberText(dataset.rows.length, 0)}
          <small>行</small>
        </div>
        <p className="stat-foot">保留源记录序号</p>
      </div>
      <div className="stat-card">
        <div className="stat-label">数据字段</div>
        <div className="stat-value">
          {numberText(dataset.columns.length, 0)}
          <small>列</small>
        </div>
        <p className="stat-foot">
          {dataset.columns.filter((column) => column.type === 'number').length} 个数值字段
        </p>
      </div>
      <div className={`stat-card${audit.issues.length ? ' has-issues' : ''}`}>
        <div className="stat-label">待核对问题</div>
        <div className="stat-value">
          {numberText(audit.issues.length, 0)}
          <small>项</small>
        </div>
        <p className="stat-foot">涉及 {numberText(audit.affectedRows, 0)} 条记录</p>
      </div>
      <div className="stat-card">
        <div className="stat-label">数据质量参考分</div>
        <div className="stat-value">
          {audit.quality ?? '—'}
          {audit.quality !== null && <small>/ 100</small>}
        </div>
        <p className="stat-foot">按受影响单元格比例计算</p>
      </div>
    </div>
  );
}
