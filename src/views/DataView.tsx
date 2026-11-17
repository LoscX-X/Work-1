import { useEffect, useMemo, useState } from 'react';
import type { AuditResult, Dataset, IssueKind } from '../lib/data-core';
import { ISSUE_LABELS } from '../lib/data-core';
import { numberText } from '../lib/format';
import { Button, Panel } from '../components/ui';
import { Icon } from '../components/Icon';
import { DataTable } from '../components/DataTable';

interface DataViewProps {
  dataset: Dataset;
  audit: AuditResult;
  filter: IssueKind | 'all';
  selectedRowId: number | null;
  onFilter(filter: IssueKind | 'all'): void;
  onColumnType(id: number): void;
  onEditCell?(rowId: number, columnId: number): void;
}

export function DataView({ dataset, audit, filter, selectedRowId, onFilter, onColumnType, onEditCell }: DataViewProps) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 15;
  const rows = useMemo(() => dataset.rows.filter(row => {
    if (filter !== 'all' && !audit.rowFlags.get(row.id)?.has(filter)) return false;
    if (query && !row.values.some(value => value.toLocaleLowerCase().includes(query.toLocaleLowerCase())) && !String(row.id).includes(query)) return false;
    return true;
  }), [dataset, audit, filter, query]);
  useEffect(() => {
    const index = selectedRowId === null ? -1 : rows.findIndex(row => row.id === selectedRowId);
    setPage(index >= 0 ? Math.floor(index / pageSize) : 0);
  }, [rows, selectedRowId]);
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pages - 1);
  const start = currentPage * pageSize;
  const counts = (Object.keys(ISSUE_LABELS) as IssueKind[]).map(kind => ({ kind, label: ISSUE_LABELS[kind], count: Array.from(audit.rowFlags.values()).filter(flags => flags.has(kind)).length }));
  return <>
    <Panel>
      <div className="table-toolbar"><div className="segments" aria-label="问题筛选"><button className={filter === 'all' ? 'active' : ''} onClick={() => onFilter('all')}>全部记录<span>{dataset.rows.length}</span></button>{counts.map(item => <button key={item.kind} className={filter === item.kind ? 'active' : ''} onClick={() => onFilter(item.kind)}>{item.label}<span>{item.count}</span></button>)}</div><label className="search"><Icon name="search" /><input aria-label="搜索数据内容或源记录序号" placeholder="搜索数据或源记录…" value={query} onChange={event => setQuery(event.target.value)} /></label></div>
      <DataTable dataset={dataset} audit={audit} rows={rows.slice(start, start + pageSize)} selectedRowId={selectedRowId} onColumnType={onColumnType} onEditCell={onEditCell} />
      {!rows.length && <div className="history-empty"><h3>没有匹配记录</h3><p>可以切换问题类型或清空搜索条件。</p></div>}
      <div className="table-pagination"><span>显示 {rows.length ? start + 1 : 0}—{Math.min(start + pageSize, rows.length)} 条，共 {numberText(rows.length, 0)} 条</span><div className="pagination-buttons"><Button disabled={!currentPage} onClick={() => setPage(currentPage - 1)}>上一页</Button><span className="flex">{currentPage + 1} / {pages}</span><Button disabled={currentPage >= pages - 1} onClick={() => setPage(currentPage + 1)}>下一页</Button></div></div>
    </Panel>
    <div className="issue-explainer">{(Object.keys(ISSUE_LABELS) as IssueKind[]).map(kind => <span key={kind}><i className={`key-box ${kind}`} />{ISSUE_LABELS[kind]}</span>)}<span className="spacer" /><span>悬停查看判定依据 · 点击表头确认类型{onEditCell && ' · 双击单元格编辑'}</span></div>
  </>;
}
