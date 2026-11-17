import type { AuditResult, DataRow, Dataset, IssueKind } from '../lib/data-core';
import { ISSUE_LABELS } from '../lib/data-core';
import { Icon } from './Icon';
import type { CellProvenance } from '../features/cleaning/lineage';

const glyphs = { text: 'Aa', number: '#', date: '◷' };

export function DataTable({
  dataset,
  audit,
  rows,
  selectedRowId,
  onColumnType,
  onEditCell,
  lineage,
}: {
  dataset: Dataset;
  audit: AuditResult;
  rows: DataRow[];
  selectedRowId?: number | null;
  onColumnType?(columnId: number): void;
  onEditCell?(rowId: number, columnId: number): void;
  lineage?: ReadonlyMap<string, CellProvenance>;
}) {
  const cellIssues = new Map<string, { kind: IssueKind; reason: string }[]>();
  for (const issue of audit.issues) {
    if (issue.columnId === null) continue;
    const key = `${issue.rowId}:${issue.columnId}`;
    if (!cellIssues.has(key)) cellIssues.set(key, []);
    cellIssues.get(key)!.push({ kind: issue.kind, reason: issue.reason });
  }
  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th title="包含表头位置的源记录序号，清洗后保持不变">源记录</th>
            {dataset.columns.map((column) => (
              <th key={column.id}>
                <div className="column-header">
                  <span className="type-glyph">{glyphs[column.type]}</span>
                  {onColumnType ? (
                    <button
                      type="button"
                      title={`确认 ${column.name} 的数据类型`}
                      onClick={() => onColumnType?.(column.id)}
                    >
                      {column.name}
                      <Icon name="chevrondown" />
                    </button>
                  ) : (
                    <span>{column.name}</span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className={row.id === selectedRowId ? 'row-selected' : ''}>
              <td>{String(row.id).padStart(3, '0')}</td>
              {dataset.columns.map((column) => {
                const issues = cellIssues.get(`${row.id}:${column.id}`) || [];
                const duplicate = audit.rowFlags.get(row.id)?.has('duplicate');
                const provenance = lineage?.get(`${row.id}:${column.id}`);
                const names = issues.map((issue) => `${ISSUE_LABELS[issue.kind]}：${issue.reason}`);
                if (duplicate) names.push('额外重复记录');
                if (provenance)
                  names.push(
                    `来源：第 ${provenance.step} 步 ${provenance.title}，原值 ${provenance.before || '空值'}`,
                  );
                return (
                  <td
                    key={column.id}
                    className={`${issues.map((issue) => `cell-${issue.kind}`).join(' ')} ${duplicate ? 'cell-duplicate' : ''} ${provenance?.origin === 'imputed' ? 'cell-imputed' : ''}`}
                    title={names.length ? names.join('\n') : row.values[column.id]}
                    onDoubleClick={() => onEditCell?.(row.id, column.id)}
                  >
                    {row.values[column.id].trim() ? (
                      row.values[column.id]
                    ) : (
                      <span aria-label="空值">—</span>
                    )}
                    {provenance?.origin === 'imputed' && <span className="cell-origin">填</span>}
                    {provenance?.origin === 'edited' && (
                      <span className="cell-origin edited">改</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
