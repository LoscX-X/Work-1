import type { CSSProperties } from 'react';
import type { AuditResult, Dataset } from '../lib/data-core';
import { numberText } from '../lib/format';
import { Icon } from './Icon';

export function SummaryCards({ dataset, audit }: { dataset: Dataset; audit: AuditResult }) {
  return (
    <div className="summary-grid">
      <div className="stat-card">
        <div className="stat-label">
          <Icon name="table" /> 数据记录
        </div>
        <div className="stat-value">
          {numberText(dataset.rows.length, 0)}
          <small>行</small>
        </div>
        <p className="stat-foot">保留源记录序号，支持问题回溯</p>
      </div>
      <div className="stat-card">
        <div className="stat-label">
          <Icon name="grid" /> 数据字段
        </div>
        <div className="stat-value">
          {numberText(dataset.columns.length, 0)}
          <small>列</small>
        </div>
        <p className="stat-foot">
          {dataset.columns.filter((column) => column.type === 'number').length} 个数值字段 ·
          可手动确认类型
        </p>
      </div>
      <div className="stat-card">
        <div className="stat-label">
          <Icon name="alert" /> 待检查问题
        </div>
        <div className="stat-value">
          {numberText(audit.issues.length, 0)}
          <small>项</small>
        </div>
        <p className="stat-foot">
          涉及 {numberText(audit.affectedRows, 0)} 条记录，异常值需人工确认
        </p>
      </div>
      <div className="stat-card quality">
        <div className="quality-ring" style={{ '--score': audit.quality ?? 0 } as CSSProperties}>
          <div className="ring-inner">{audit.quality ?? '—'}</div>
        </div>
        <div>
          <div className="stat-label">数据质量参考分</div>
          <div className="stat-value">
            {audit.quality === null
              ? '暂无数据'
              : audit.issues.length
                ? '存在待核对项'
                : '当前检查通过'}
          </div>
          <p className="stat-foot">按受影响单元格比例计算</p>
        </div>
      </div>
    </div>
  );
}
