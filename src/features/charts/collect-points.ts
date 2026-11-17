import { isMissing, toDate, toNumber } from '../../lib/data-core.ts';
import type { Dataset } from '../../lib/data-core.ts';
import type { ChartPoint, ChartSettings } from './types.ts';

export function collectPoints(
  dataset: Dataset,
  settings: ChartSettings,
  imputed: ReadonlySet<string> = new Set(),
) {
  const xColumn = settings.xColumnId === null ? null : dataset.columns[settings.xColumnId];
  const yColumn = settings.yColumnId === null ? null : dataset.columns[settings.yColumnId];
  const excluded = { missing: 0, invalid: 0, imputed: 0 };
  const points: ChartPoint[] = [];
  if (!yColumn || yColumn.type !== 'number') return { points, excluded, xColumn, yColumn };
  for (const row of dataset.rows) {
    const rawY = row.values[yColumn.id];
    const rawX = xColumn ? row.values[xColumn.id] : String(row.id);
    if (isMissing(rawY) || (settings.kind !== 'histogram' && isMissing(rawX))) {
      excluded.missing += 1;
      continue;
    }
    const y = toNumber(rawY);
    const x =
      settings.kind === 'histogram' || xColumn === null
        ? row.id
        : xColumn.type === 'number'
          ? toNumber(rawX)
          : xColumn.type === 'date'
            ? toDate(rawX)
            : rawX;
    if (y === null || x === null) {
      excluded.invalid += 1;
      continue;
    }
    if (
      settings.excludeImputed &&
      (imputed.has(`${row.id}:${yColumn.id}`) ||
        (settings.kind !== 'histogram' && xColumn && imputed.has(`${row.id}:${xColumn.id}`)))
    ) {
      excluded.imputed += 1;
      continue;
    }
    const group =
      settings.groupColumnId === null
        ? '全部记录'
        : row.values[settings.groupColumnId] || '（分组缺失）';
    points.push({ value: [x, y], rowId: row.id, group });
  }
  return { points, excluded, xColumn, yColumn };
}
