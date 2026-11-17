import type { Dataset } from '../../lib/data-core.ts';
import { commitOperation, createHistory, currentDataset } from './history.ts';
import type { HistoryState, Operation } from './types.ts';

export interface Recipe {
  format: 'lablens.recipe';
  version: 1;
  algorithmVersion: 1;
  generatedAt: string;
  source: {
    sha256: string;
    filename: string;
    sheet: string | null;
    rowCount: number;
    columns: string[];
  };
  operations: { timestamp: string; parameters: Operation }[];
  expected: { rows: number; fingerprint: string };
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function columnId(value: unknown, nullable = false): number | null {
  if (nullable && value === null) return null;
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0)
    throw new Error('处理配置包含无效字段编号。');
  return value;
}

function readOperation(value: unknown): Operation {
  if (!record(value) || typeof value.kind !== 'string') throw new Error('处理配置缺少有效操作。');
  switch (value.kind) {
    case 'remove_duplicates':
      return { kind: value.kind };
    case 'trim':
    case 'normalize_numbers':
    case 'drop_missing':
      return { kind: value.kind, columnId: columnId(value.columnId, true) };
    case 'invalid_to_missing':
    case 'drop_outliers':
      return { kind: value.kind, columnId: columnId(value.columnId)! };
    case 'fill_missing': {
      if (value.method !== 'mean' && value.method !== 'median' && value.method !== 'constant')
        throw new Error('处理配置包含未知填充方法。');
      if (value.value !== undefined && typeof value.value !== 'string')
        throw new Error('处理配置的填充值必须是文本。');
      return {
        kind: value.kind,
        columnId: columnId(value.columnId)!,
        method: value.method,
        value: value.value,
      };
    }
    case 'change_type': {
      if (value.type !== 'text' && value.type !== 'number' && value.type !== 'date')
        throw new Error('处理配置包含未知字段类型。');
      return { kind: value.kind, columnId: columnId(value.columnId)!, type: value.type };
    }
    case 'set_cell': {
      if (
        typeof value.rowId !== 'number' ||
        !Number.isInteger(value.rowId) ||
        value.rowId < 2 ||
        typeof value.value !== 'string'
      )
        throw new Error('处理配置中的单元格修正参数不完整。');
      return {
        kind: value.kind,
        columnId: columnId(value.columnId)!,
        rowId: value.rowId,
        value: value.value,
      };
    }
    default:
      throw new Error(`处理配置包含不支持的操作：${value.kind}`);
  }
}

function hashString(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{64}$/i.test(value);
}

export function parseRecipe(text: string): Recipe {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error('处理配置不是有效的 JSON 文件。');
  }
  if (
    !record(value) ||
    value.format !== 'lablens.recipe' ||
    value.version !== 1 ||
    value.algorithmVersion !== 1
  )
    throw new Error('处理配置格式或版本不受支持。');
  const { source, expected } = value;
  if (
    !record(source) ||
    !hashString(source.sha256) ||
    typeof source.filename !== 'string' ||
    !Number.isInteger(source.rowCount) ||
    (source.rowCount as number) < 0 ||
    !Array.isArray(source.columns) ||
    !source.columns.every((name) => typeof name === 'string')
  )
    throw new Error('处理配置缺少完整的源文件信息。');
  if (source.sheet !== null && typeof source.sheet !== 'string')
    throw new Error('处理配置的工作表信息无效。');
  if (
    !record(expected) ||
    !hashString(expected.fingerprint) ||
    !Number.isInteger(expected.rows) ||
    (expected.rows as number) < 0
  )
    throw new Error('处理配置缺少结果校验信息。');
  if (
    typeof value.generatedAt !== 'string' ||
    !Number.isFinite(Date.parse(value.generatedAt)) ||
    !Array.isArray(value.operations)
  )
    throw new Error('处理配置的时间或操作序列无效。');
  const operations = value.operations.map((entry) => {
    if (
      !record(entry) ||
      typeof entry.timestamp !== 'string' ||
      !Number.isFinite(Date.parse(entry.timestamp))
    )
      throw new Error('处理配置包含无效操作时间。');
    return { timestamp: entry.timestamp, parameters: readOperation(entry.parameters) };
  });
  return {
    format: 'lablens.recipe',
    version: 1,
    algorithmVersion: 1,
    generatedAt: value.generatedAt,
    source: {
      sha256: source.sha256,
      filename: source.filename,
      sheet: source.sheet,
      rowCount: source.rowCount as number,
      columns: source.columns as string[],
    },
    expected: { rows: expected.rows as number, fingerprint: expected.fingerprint },
    operations,
  };
}

export async function datasetFingerprint(dataset: Dataset): Promise<string> {
  const canonical = JSON.stringify({
    columns: dataset.columns.map((column) => [column.id, column.name, column.type]),
    rows: dataset.rows.map((row) => [row.id, row.values]),
  });
  const bytes = new TextEncoder().encode(canonical);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function createRecipe(history: HistoryState): Promise<Recipe> {
  const original = history.original;
  if (!original.metadata.sha256)
    throw new Error('原始文件缺少指纹，请从文件导入后再导出处理配置。');
  const current = currentDataset(history);
  return {
    format: 'lablens.recipe',
    version: 1,
    algorithmVersion: 1,
    generatedAt: new Date().toISOString(),
    source: {
      sha256: original.metadata.sha256,
      filename: original.metadata.filename || '数据文件',
      sheet: original.metadata.sheet || null,
      rowCount: original.rows.length,
      columns: original.columns.map((column) => column.name),
    },
    operations: history.entries
      .slice(0, history.cursor)
      .map((entry) => ({ timestamp: entry.timestamp, parameters: entry.result.operation })),
    expected: { rows: current.rows.length, fingerprint: await datasetFingerprint(current) },
  };
}

export async function replayRecipe(original: Dataset, recipe: Recipe): Promise<HistoryState> {
  if (original.metadata.sha256 !== recipe.source.sha256)
    throw new Error('原文件 SHA-256 与配置不一致，请先导入生成该配置时使用的同一份文件。');
  if ((original.metadata.sheet || null) !== recipe.source.sheet)
    throw new Error('当前工作表与处理配置不一致。');
  if (
    original.rows.length !== recipe.source.rowCount ||
    JSON.stringify(original.columns.map((column) => column.name)) !==
      JSON.stringify(recipe.source.columns)
  )
    throw new Error('当前文件的记录数或字段结构与配置不一致。');
  let history = createHistory(original);
  for (const entry of recipe.operations)
    history = commitOperation(history, entry.parameters, entry.timestamp);
  const final = currentDataset(history);
  if (
    final.rows.length !== recipe.expected.rows ||
    (await datasetFingerprint(final)) !== recipe.expected.fingerprint
  )
    throw new Error('回放结果与配置中的校验值不一致，当前工作区保持原状态。');
  return history;
}
