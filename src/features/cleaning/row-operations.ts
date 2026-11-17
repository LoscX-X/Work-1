import { auditDataset, isMissing } from '../../lib/data-core.ts';
import type { Dataset } from '../../lib/data-core.ts';
import { getColumn } from './value-operations.ts';

export function removeDuplicates(dataset: Dataset): Dataset {
  const seen = new Set<string>();
  const rows = dataset.rows.filter((row) => {
    const key = JSON.stringify(row.values);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return { ...dataset, rows };
}

export function dropMissing(dataset: Dataset, columnId: number | null): Dataset {
  if (columnId !== null) getColumn(dataset, columnId);
  const rows = dataset.rows.filter((row) =>
    columnId === null ? !row.values.some(isMissing) : !isMissing(row.values[columnId]),
  );
  return { ...dataset, rows };
}

export function dropOutliers(dataset: Dataset, columnId: number): Dataset {
  const column = getColumn(dataset, columnId);
  if (column.type !== 'number') throw new Error('IQR 异常值检查只适用于数值字段。');
  const excluded = new Set(
    auditDataset(dataset)
      .issues.filter((issue) => issue.kind === 'outlier' && issue.columnId === columnId)
      .map((issue) => issue.rowId),
  );
  return { ...dataset, rows: dataset.rows.filter((row) => !excluded.has(row.id)) };
}
