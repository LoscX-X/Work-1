export type ColumnType = 'text' | 'number' | 'date';
export type IssueKind = 'missing' | 'invalid' | 'duplicate' | 'outlier';

export interface DataColumn {
  id: number;
  name: string;
  type: ColumnType;
}

export interface DataRow {
  id: number;
  values: string[];
}

export interface DatasetMetadata {
  filename?: string;
  bytes?: number;
  sha256?: string;
  importedAt?: string;
  sheet?: string;
  format?: 'csv' | 'xlsx';
  encoding?: string;
  delimiter?: string;
  sample?: boolean;
}

export interface Dataset {
  columns: DataColumn[];
  rows: DataRow[];
  metadata: DatasetMetadata;
}

export interface NumericSummary {
  count: number;
  min: number | null;
  max: number | null;
  mean: number | null;
  median: number | null;
  q1: number | null;
  q3: number | null;
  sd: number | null;
}

export interface DataIssue {
  kind: IssueKind;
  rowId: number;
  columnId: number | null;
  column: string;
  value: string;
  reason: string;
  lower?: number;
  upper?: number;
  originalRowId?: number;
}

export interface ColumnAudit extends DataColumn {
  counts: Record<'missing' | 'invalid' | 'outlier', number>;
  summary: NumericSummary | null;
}

export interface AuditResult {
  issues: DataIssue[];
  counts: Record<IssueKind, number>;
  byColumn: ColumnAudit[];
  rowFlags: Map<number, Set<IssueKind>>;
  affectedCells: Set<string>;
  affectedRows: number;
  totalCells: number;
  quality: number | null;
}

export const ISSUE_LABELS: Record<IssueKind, string> = {
  missing: '缺失值',
  invalid: '格式错误',
  duplicate: '重复记录',
  outlier: '疑似异常值',
};

export function isMissing(value: unknown): boolean {
  return value == null || String(value).trim() === '';
}

export function toNumber(value: unknown): number | null {
  if (isMissing(value)) return null;
  const text = String(value).trim().replace(/\u2212/g, '-');
  const plain = /^[+-]?(?:(?:\d+\.?\d*)|(?:\.\d+))(?:e[+-]?\d+)?$/i;
  const grouped = /^[+-]?\d{1,3}(?:,\d{3})+(?:\.\d+)?(?:e[+-]?\d+)?$/i;
  if (!plain.test(text) && !grouped.test(text)) return null;
  const result = Number(text.replace(/,/g, ''));
  return Number.isFinite(result) ? result : null;
}

export function toDate(value: unknown): number | null {
  const text = String(value ?? '').trim();
  const match = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T ](\d{1,2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|[+-]\d{2}:?\d{2})?)?$/.exec(text);
  if (!match) return null;
  const [, year, month, day, hour = '0', minute = '0', second = '0'] = match;
  const y = Number(year), m = Number(month), d = Number(day);
  const hh = Number(hour), mm = Number(minute), ss = Number(second);
  if (m < 1 || m > 12 || d < 1 || d > new Date(Date.UTC(y, m, 0)).getUTCDate()) return null;
  if (hh > 23 || mm > 59 || ss > 59) return null;
  const normalized = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:${second.padStart(2, '0')}${match[7] ? `.${match[7]}` : ''}${match[8] || 'Z'}`;
  const timestamp = Date.parse(normalized);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function inferType(name: string, values: string[]): ColumnType {
  const nonempty = values.filter(value => !isMissing(value));
  if (!nonempty.length) return 'text';
  if (/(?:^|[_\s-])id(?:$|[_\s-])|编号|序号|学号|邮编|电话|编码/i.test(name)) return 'text';
  if (nonempty.some(value => /^[+-]?0\d+\s*$/.test(String(value)))) return 'text';
  if (nonempty.filter(value => toNumber(value) !== null).length / nonempty.length >= 0.8) return 'number';
  if (nonempty.filter(value => toDate(value) !== null).length / nonempty.length >= 0.8) return 'date';
  return 'text';
}

export function createDataset(headers: readonly unknown[], matrix: readonly (readonly unknown[])[], metadata: DatasetMetadata = {}): Dataset {
  if (!headers.length) throw new Error('文件中没有可用表头。');
  const used = new Map<string, number>();
  const names = headers.map((header, index) => {
    const name = String(header ?? '').trim() || `未命名列_${index + 1}`;
    const count = (used.get(name) || 0) + 1;
    used.set(name, count);
    return count === 1 ? name : `${name}_${count}`;
  });
  const rows = matrix.map((values, index) => {
    if (values.length > names.length && values.slice(names.length).some(value => !isMissing(value))) {
      throw new Error(`源文件第 ${index + 2} 行的字段数多于表头，请先检查分隔符或引号。`);
    }
    return {
      id: index + 2,
      values: names.map((_, column) => {
        const value = values[column];
        if (value instanceof Date) return value.toISOString();
        return value == null ? '' : String(value);
      }),
    };
  });
  return {
    columns: names.map((name, index) => ({
      id: index,
      name,
      type: inferType(name, rows.map(row => row.values[index])),
    })),
    rows,
    metadata: { ...metadata },
  };
}

export function quantile(sortedValues: readonly number[], fraction: number): number | null {
  if (!sortedValues.length) return null;
  const position = (sortedValues.length - 1) * fraction;
  const lower = Math.floor(position);
  const weight = position - lower;
  return sortedValues[lower] + (sortedValues[Math.min(lower + 1, sortedValues.length - 1)] - sortedValues[lower]) * weight;
}

export function numericSummary(values: readonly unknown[]): NumericSummary {
  const numbers = values.map(toNumber).filter(value => value !== null).sort((a, b) => a - b);
  if (!numbers.length) return { count: 0, min: null, max: null, mean: null, median: null, q1: null, q3: null, sd: null };
  const mean = numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
  const variance = numbers.length > 1 ? numbers.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (numbers.length - 1) : null;
  return {
    count: numbers.length,
    min: numbers[0],
    max: numbers[numbers.length - 1],
    mean,
    median: quantile(numbers, 0.5),
    q1: quantile(numbers, 0.25),
    q3: quantile(numbers, 0.75),
    sd: variance === null ? null : Math.sqrt(variance),
  };
}

export function auditDataset(dataset: Dataset): AuditResult {
  const issues: DataIssue[] = [];
  const counts = { missing: 0, invalid: 0, duplicate: 0, outlier: 0 };
  const affectedCells = new Set<string>();
  const byColumn: ColumnAudit[] = dataset.columns.map(column => ({ ...column, counts: { missing: 0, invalid: 0, outlier: 0 }, summary: null }));
  const rowFlags = new Map<number, Set<IssueKind>>();
  function addIssue(kind: IssueKind, row: DataRow, column: DataColumn | null, reason: string, extra: Partial<Pick<DataIssue, 'lower' | 'upper' | 'originalRowId'>> = {}) {
    const issue = { kind, rowId: row.id, columnId: column?.id ?? null, column: column?.name ?? '整行', value: column ? row.values[column.id] : '', reason, ...extra };
    issues.push(issue);
    counts[kind] += 1;
    if (!rowFlags.has(row.id)) rowFlags.set(row.id, new Set());
    rowFlags.get(row.id)!.add(kind);
    if (column) {
      affectedCells.add(`${row.id}:${column.id}`);
      if (kind !== 'duplicate') byColumn[column.id].counts[kind] += 1;
    } else {
      dataset.columns.forEach(item => affectedCells.add(`${row.id}:${item.id}`));
    }
  }
  for (const column of dataset.columns) {
    const numeric = column.type === 'number' ? numericSummary(dataset.rows.map(row => row.values[column.id])) : null;
    byColumn[column.id].summary = numeric;
    const q1 = numeric?.q1 ?? null;
    const q3 = numeric?.q3 ?? null;
    const spread = q1 !== null && q3 !== null ? q3 - q1 : 0;
    const lower = numeric && numeric.count >= 4 && q1 !== null && spread > 0 ? q1 - 1.5 * spread : null;
    const upper = numeric && numeric.count >= 4 && q3 !== null && spread > 0 ? q3 + 1.5 * spread : null;
    for (const row of dataset.rows) {
      const value = row.values[column.id];
      if (isMissing(value)) {
        addIssue('missing', row, column, '单元格为空或仅包含空白字符');
      } else if (column.type === 'number') {
        const number = toNumber(value);
        if (number === null) {
          addIssue('invalid', row, column, '该列已确认为数值列，此值无法解析为有限数值');
        } else if (lower !== null && upper !== null && (number < lower || number > upper)) {
          addIssue('outlier', row, column, '超出 Q1 − 1.5×IQR 至 Q3 + 1.5×IQR 的范围，需结合实验背景确认', { lower, upper });
        }
      } else if (column.type === 'date' && toDate(value) === null) {
        addIssue('invalid', row, column, '日期应为有效的 YYYY-MM-DD、YYYY/MM/DD 或 ISO 日期时间');
      }
    }
  }
  const firstRows = new Map<string, number>();
  for (const row of dataset.rows) {
    const signature = JSON.stringify(row.values);
    if (firstRows.has(signature)) {
      addIssue('duplicate', row, null, `与源文件第 ${firstRows.get(signature)} 行完全相同，保留首次记录`, { originalRowId: firstRows.get(signature) });
    } else {
      firstRows.set(signature, row.id);
    }
  }
  const totalCells = dataset.rows.length * dataset.columns.length;
  return {
    issues,
    counts,
    byColumn,
    rowFlags,
    affectedCells,
    affectedRows: rowFlags.size,
    totalCells,
    quality: totalCells ? Math.round(100 * (1 - affectedCells.size / totalCells)) : null,
  };
}

export function linearRegression(pairs: readonly (readonly number[])[]) {
  const points = pairs.filter(point => point.length >= 2 && point.slice(0, 2).every(Number.isFinite));
  if (points.length < 2) return null;
  const meanX = points.reduce((sum, point) => sum + point[0], 0) / points.length;
  const meanY = points.reduce((sum, point) => sum + point[1], 0) / points.length;
  let xx = 0, yy = 0, xy = 0;
  for (const [x, y] of points) {
    xx += (x - meanX) ** 2;
    yy += (y - meanY) ** 2;
    xy += (x - meanX) * (y - meanY);
  }
  if (xx === 0) return null;
  const slope = xy / xx;
  const intercept = meanY - slope * meanX;
  const correlation = yy === 0 ? null : xy / Math.sqrt(xx * yy);
  return { count: points.length, slope, intercept, correlation, r2: correlation === null ? null : correlation ** 2 };
}

export function histogram(values: readonly unknown[], requestedBins = 12) {
  const numbers = values.map(toNumber).filter(value => value !== null);
  if (!numbers.length) return { bins: [], count: 0 };
  const min = Math.min(...numbers), max = Math.max(...numbers);
  if (min === max) return { bins: [{ start: min, end: max, count: numbers.length }], count: numbers.length };
  const count = Math.max(1, Math.min(60, Math.round(requestedBins)));
  const width = (max - min) / count;
  const bins = Array.from({ length: count }, (_, index) => ({ start: min + index * width, end: min + (index + 1) * width, count: 0 }));
  numbers.forEach(value => { bins[Math.min(count - 1, Math.floor((value - min) / width))].count += 1; });
  return { bins, count: numbers.length };
}

export function csvText(dataset: Dataset): string {
  const quote = (value: unknown) => {
    const text = String(value ?? '');
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return '\uFEFF' + [dataset.columns.map(column => column.name), ...dataset.rows.map(row => row.values)].map(row => row.map(quote).join(',')).join('\r\n');
}
