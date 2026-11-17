import { isMissing, numericSummary, toDate, toNumber } from '../../lib/data-core.ts';
import type { Dataset, DataColumn } from '../../lib/data-core.ts';

export function getColumn(dataset: Dataset, id: number): DataColumn {
  const column = dataset.columns.find((item) => item.id === id);
  if (!column) throw new Error('要处理的字段不存在，请重新选择。');
  return column;
}

export function mapValues(
  dataset: Dataset,
  transform: (value: string, column: DataColumn, rowId: number) => string,
): Dataset {
  return {
    ...dataset,
    rows: dataset.rows.map((row) => ({
      ...row,
      values: row.values.map((value, index) => transform(value, dataset.columns[index], row.id)),
    })),
  };
}

export function trimValues(dataset: Dataset, columnId: number | null): Dataset {
  return mapValues(dataset, (value, column) =>
    columnId === null || column.id === columnId ? value.trim() : value,
  );
}

export function normalizeNumbers(dataset: Dataset, columnId: number | null): Dataset {
  return mapValues(dataset, (value, column) => {
    if (column.type !== 'number' || (columnId !== null && column.id !== columnId)) return value;
    const number = toNumber(value);
    return number === null ? value : String(number);
  });
}

export function invalidToMissing(dataset: Dataset, columnId: number): Dataset {
  const column = getColumn(dataset, columnId);
  if (column.type === 'text') throw new Error('文本字段没有数值或日期格式约束，请先确认字段类型。');
  return mapValues(dataset, (value, item) => {
    if (item.id !== columnId || isMissing(value)) return value;
    const parsed = column.type === 'number' ? toNumber(value) : toDate(value);
    return parsed === null ? '' : value;
  });
}

export function fillMissing(
  dataset: Dataset,
  columnId: number,
  method: 'mean' | 'median' | 'constant',
  constant?: string,
): Dataset {
  const column = getColumn(dataset, columnId);
  let replacement: string;
  if (method === 'constant') {
    replacement = constant ?? '';
    if (isMissing(replacement)) throw new Error('请输入用于填充的明确值。');
    if (column.type === 'number' && toNumber(replacement) === null)
      throw new Error('数值字段的填充值必须是有效数值。');
    if (column.type === 'date' && toDate(replacement) === null)
      throw new Error('日期字段的填充值必须是有效日期。');
  } else {
    if (column.type !== 'number') throw new Error('均值和中位数填充适用于数值字段。');
    const summary = numericSummary(dataset.rows.map((row) => row.values[columnId]));
    const value = method === 'mean' ? summary.mean : summary.median;
    if (value === null || !Number.isFinite(value))
      throw new Error('该列没有可用于计算填充值的有效数值。');
    replacement = String(value);
  }
  return mapValues(dataset, (value, item) =>
    item.id === columnId && isMissing(value) ? replacement : value,
  );
}

export function setCell(
  dataset: Dataset,
  columnId: number,
  rowId: number,
  replacement: string,
): Dataset {
  getColumn(dataset, columnId);
  if (!dataset.rows.some((row) => row.id === rowId)) throw new Error('要修正的源记录不存在。');
  return mapValues(dataset, (value, column, id) =>
    column.id === columnId && id === rowId ? replacement : value,
  );
}
