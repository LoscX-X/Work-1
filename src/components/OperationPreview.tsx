import type { AuditResult, Dataset } from '../lib/data-core';
import type { OperationResult } from '../features/cleaning/types';
import { Badge, Button, Modal } from './ui';

export function OperationPreview({
  before,
  beforeAudit,
  afterAudit,
  result,
  onConfirm,
  onClose,
}: {
  before: Dataset;
  beforeAudit: AuditResult;
  afterAudit: AuditResult;
  result: OperationResult;
  onConfirm(): void;
  onClose(): void;
}) {
  const changed = result.changedCells.length || result.removedRowIds.length || result.schemaChanged;
  return (
    <Modal
      title={`预览 · ${result.title}`}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>取消预览</Button>
          <Button
            kind={result.removedRowIds.length ? 'danger' : 'primary'}
            onClick={onConfirm}
            disabled={!changed}
          >
            确认执行
          </Button>
        </>
      }
    >
      <p>{result.description}</p>
      <div className="preview-change">
        <div>
          <strong>{result.changedCells.length}</strong>
          <span>个单元格将被修改</span>
        </div>
        <div>
          <strong>{result.removedRowIds.length}</strong>
          <span>条记录将被移除</span>
        </div>
      </div>
      <div className="preview-summary">
        <span>
          记录数{' '}
          <b>
            {before.rows.length} → {result.dataset.rows.length}
          </b>
        </span>
        <span>
          待确认项{' '}
          <b>
            {beforeAudit.issues.length} → {afterAudit.issues.length}
          </b>
        </span>
      </div>
      {result.schemaChanged && (
        <p>
          <Badge kind="blue">字段类型将更新</Badge>
        </p>
      )}
      {result.changedCells.length > 0 && (
        <div className="preview-table">
          <table>
            <thead>
              <tr>
                <th>源记录 / 字段</th>
                <th>处理前</th>
                <th>处理后</th>
              </tr>
            </thead>
            <tbody>
              {result.changedCells.slice(0, 6).map((cell) => (
                <tr key={`${cell.rowId}:${cell.columnId}`}>
                  <td>
                    #{cell.rowId} · {cell.column}
                  </td>
                  <td>{cell.before || '空值'}</td>
                  <td>{cell.after || '空值'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {result.changedCells.length > 6 && (
            <p className="helper">显示前 6 处变更，完整变更会保留在处理记录中。</p>
          )}
        </div>
      )}
      {result.removedRowIds.length > 0 && (
        <div className="warning-box">
          将移除源记录{' '}
          {result.removedRowIds
            .slice(0, 15)
            .map((id) => `#${id}`)
            .join('、')}
          {result.removedRowIds.length > 15 && ' 等'}
          。请确认这些记录应从当前分析中排除，执行后可撤销。
        </div>
      )}
      {result.operation.kind === 'fill_missing' && (
        <div className="warning-box">
          填充值是按当前有效数据计算或由你指定的替代值。它们会记录在操作历史中，分析时应区分测量值与填充值。
        </div>
      )}
      {!changed && <p className="helper">按照当前参数，没有需要修改的数据。</p>}
    </Modal>
  );
}
