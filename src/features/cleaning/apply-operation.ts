import type { Dataset } from '../../lib/data-core.ts';
import type { CellChange, Operation, OperationResult } from './types.ts';
import {
  fillMissing,
  getColumn,
  invalidToMissing,
  normalizeNumbers,
  setCell,
  trimValues,
} from './value-operations.ts';
import { dropMissing, dropOutliers, removeDuplicates } from './row-operations.ts';

function describeOperation(
  dataset: Dataset,
  operation: Operation,
): { title: string; description: string } {
  const field =
    'columnId' in operation && operation.columnId !== null
      ? getColumn(dataset, operation.columnId).name
      : '全部字段';
  switch (operation.kind) {
    case 'trim':
      return { title: '清除首尾空白', description: `${field}，保留单元格内部字符与原始记录标识` };
    case 'normalize_numbers':
      return {
        title: '规范数值写法',
        description: `${field}，解析千位分隔符和科学计数法；无效值保留供确认`,
      };
    case 'invalid_to_missing':
      return { title: '格式错误转为空值', description: `${field}，清空无法按当前类型解析的值` };
    case 'fill_missing':
      return {
        title: '填充缺失值',
        description: `${field}，${operation.method === 'constant' ? `使用指定值 ${operation.value}` : operation.method === 'mean' ? '使用有效数值的均值' : '使用有效数值的中位数'}`,
      };
    case 'drop_missing':
      return { title: '删除包含缺失值的记录', description: `${field}，整条记录将从当前结果中移除` };
    case 'remove_duplicates':
      return { title: '移除额外重复记录', description: '按当前整行值精确比较，保留首次出现的记录' };
    case 'drop_outliers':
      return {
        title: '移除已确认的疑似异常记录',
        description: `${field}，按当前数据的 1.5 × IQR 阈值检查，整条记录移除`,
      };
    case 'change_type':
      return {
        title: '确认字段类型',
        description: `${field} → ${operation.type === 'number' ? '数值' : operation.type === 'date' ? '日期' : '文本'}`,
      };
    case 'set_cell':
      return {
        title: '修正单元格',
        description: `源记录 #${operation.rowId}，${field} → ${operation.value || '空值'}`,
      };
  }
}

export function applyOperation(dataset: Dataset, operation: Operation): OperationResult {
  const description = describeOperation(dataset, operation);
  let next: Dataset;
  switch (operation.kind) {
    case 'trim':
      next = trimValues(dataset, operation.columnId);
      break;
    case 'normalize_numbers':
      next = normalizeNumbers(dataset, operation.columnId);
      break;
    case 'invalid_to_missing':
      next = invalidToMissing(dataset, operation.columnId);
      break;
    case 'fill_missing':
      next = fillMissing(dataset, operation.columnId, operation.method, operation.value);
      break;
    case 'drop_missing':
      next = dropMissing(dataset, operation.columnId);
      break;
    case 'remove_duplicates':
      next = removeDuplicates(dataset);
      break;
    case 'drop_outliers':
      next = dropOutliers(dataset, operation.columnId);
      break;
    case 'change_type':
      next = {
        ...dataset,
        columns: dataset.columns.map((column) =>
          column.id === operation.columnId ? { ...column, type: operation.type } : column,
        ),
      };
      break;
    case 'set_cell':
      next = setCell(dataset, operation.columnId, operation.rowId, operation.value);
      break;
  }
  const before = new Map(dataset.rows.map((row) => [row.id, row]));
  const remaining = new Set(next.rows.map((row) => row.id));
  const changedCells: CellChange[] = [];
  for (const row of next.rows) {
    for (const column of next.columns) {
      const previous = before.get(row.id)!.values[column.id];
      if (previous !== row.values[column.id])
        changedCells.push({
          rowId: row.id,
          columnId: column.id,
          column: column.name,
          before: previous,
          after: row.values[column.id],
        });
    }
  }
  const removedRowIds = dataset.rows.filter((row) => !remaining.has(row.id)).map((row) => row.id);
  const schemaChanged = dataset.columns.some(
    (column, index) => column.type !== next.columns[index].type,
  );
  return { dataset: next, operation, ...description, changedCells, removedRowIds, schemaChanged };
}
