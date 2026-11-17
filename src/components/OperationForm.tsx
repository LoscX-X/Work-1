import { useState } from 'react';
import type { AuditResult, Dataset } from '../lib/data-core';
import type { Operation } from '../features/cleaning/types';
import { Button, Modal } from './ui';

export type OperationFormKind = Exclude<Operation['kind'], 'change_type' | 'set_cell'>;

export const operationDetails: Record<
  OperationFormKind,
  { title: string; description: string; icon: string }
> = {
  trim: { title: '清除首尾空白', description: '统一文本边界，保留编号和内部字符', icon: 'clean' },
  remove_duplicates: {
    title: '移除额外重复记录',
    description: '保留首次记录，移除整行重复项',
    icon: 'duplicate',
  },
  invalid_to_missing: {
    title: '格式错误转为空值',
    description: '将无法解析的数值或日期置空',
    icon: 'invalid',
  },
  fill_missing: { title: '填充缺失值', description: '按中位数、均值或指定值填充', icon: 'missing' },
  drop_missing: { title: '移除缺失记录', description: '排除指定字段不完整的记录', icon: 'table' },
  drop_outliers: {
    title: '处理疑似异常记录',
    description: '结合背景确认后，按 IQR 规则排除',
    icon: 'outlier',
  },
  normalize_numbers: {
    title: '规范数值写法',
    description: '统一千位符号与科学计数法表示',
    icon: 'grid',
  },
};

export function OperationForm({
  kind,
  dataset,
  audit,
  onPreview,
  onClose,
}: {
  kind: OperationFormKind;
  dataset: Dataset;
  audit: AuditResult;
  onPreview(operation: Operation): string | null;
  onClose(): void;
}) {
  const allAllowed = kind === 'trim' || kind === 'normalize_numbers' || kind === 'drop_missing';
  const columns = dataset.columns.filter((column) => {
    if (kind === 'drop_outliers' || kind === 'normalize_numbers') return column.type === 'number';
    if (kind === 'invalid_to_missing') return column.type !== 'text';
    return true;
  });
  const preferred =
    columns.find((column) =>
      kind === 'invalid_to_missing'
        ? audit.byColumn[column.id].counts.invalid > 0
        : kind === 'drop_outliers'
          ? audit.byColumn[column.id].counts.outlier > 0
          : audit.byColumn[column.id].counts.missing > 0,
    ) || columns[0];
  const [columnValue, setColumnValue] = useState(allAllowed ? 'all' : String(preferred?.id ?? ''));
  const selectedColumn = columns.find((column) => String(column.id) === columnValue);
  const [method, setMethod] = useState<'mean' | 'median' | 'constant'>(
    preferred?.type === 'number' ? 'median' : 'constant',
  );
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  function propose() {
    const columnId = columnValue === 'all' ? null : Number(columnValue);
    let operation: Operation;
    switch (kind) {
      case 'remove_duplicates':
        operation = { kind };
        break;
      case 'trim':
      case 'normalize_numbers':
      case 'drop_missing':
        operation = { kind, columnId };
        break;
      case 'invalid_to_missing':
      case 'drop_outliers': {
        if (columnId === null || !selectedColumn) {
          setError('请先选择要处理的字段。');
          return;
        }
        operation = { kind, columnId };
        break;
      }
      case 'fill_missing': {
        if (columnId === null || !selectedColumn) {
          setError('请先选择要填充的字段。');
          return;
        }
        operation = { kind, columnId, method, value };
        break;
      }
    }
    const message = onPreview(operation);
    setError(message);
    if (!message) onClose();
  }

  return (
    <Modal
      title={operationDetails[kind].title}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>取消</Button>
          <Button
            kind="primary"
            onClick={propose}
            disabled={kind !== 'remove_duplicates' && !allAllowed && !columns.length}
          >
            查看影响预览
          </Button>
        </>
      }
    >
      <p>{operationDetails[kind].description}</p>
      {kind !== 'remove_duplicates' && (
        <label className="field form-spaced">
          <span>处理字段</span>
          <select
            value={columnValue}
            onChange={(event) => {
              setColumnValue(event.target.value);
              const column = columns.find((item) => String(item.id) === event.target.value);
              if (column?.type !== 'number') setMethod('constant');
              else if (method === 'constant' && !value) setMethod('median');
            }}
          >
            {allAllowed && <option value="all">全部符合条件的字段</option>}
            {columns.map((column) => (
              <option key={column.id} value={column.id}>
                {column.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {kind === 'fill_missing' && (
        <>
          <label className="field">
            <span>填充方法</span>
            <select
              value={method}
              onChange={(event) => setMethod(event.target.value as typeof method)}
            >
              {selectedColumn?.type === 'number' && (
                <>
                  <option value="median">有效数值的中位数</option>
                  <option value="mean">有效数值的均值</option>
                </>
              )}
              <option value="constant">指定值</option>
            </select>
          </label>
          {method === 'constant' && (
            <label className="field">
              <span>填充值</span>
              <input
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder="输入明确的替代值"
              />
            </label>
          )}
          <p className="field-help">
            请先确认疑似异常值。当前数据中的有效数值参与计算，填充值及参数会进入操作记录。
          </p>
        </>
      )}
      {kind === 'remove_duplicates' && (
        <div className="warning-box">
          按全部字段的当前值逐行精确比较，保留首次出现的记录。若空白字符应视为相同，先执行首尾空白处理。
        </div>
      )}
      {kind === 'drop_outliers' && (
        <div className="warning-box">
          IQR
          提供统计筛选依据。请先查看具体记录并结合实验背景确认。预览会显示阈值影响和将移除的源记录。
        </div>
      )}
      {error && (
        <div className="warning-box" role="alert">
          {error}
        </div>
      )}
    </Modal>
  );
}
