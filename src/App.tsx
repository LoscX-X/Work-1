import { useRef, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import type { ViewId } from './components/Sidebar';
import { Button, Badge, EmptyState, Modal } from './components/ui';
import { Icon } from './components/Icon';
import { ColumnTypeDialog } from './components/ColumnTypeDialog';
import { useWorkbench } from './hooks/useWorkbench';
import { Overview } from './views/Overview';
import { DataView } from './views/DataView';
import { csvText } from './lib/data-core';
import type { IssueKind } from './lib/data-core';
import { downloadBlob, filenameStem } from './lib/format';

const titles: Record<ViewId, string> = { overview: '数据概览', data: '数据与问题', clean: '清洗工作流', charts: '可视化分析', history: '追溯与导出' };

export function App() {
  const workbench = useWorkbench();
  const [view, setView] = useState<ViewId>('overview');
  const [filter, setFilter] = useState<IssueKind | 'all'>('all');
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [columnId, setColumnId] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const { dataset, audit } = workbench;

  function inspect(kind: IssueKind | 'all', rowId?: number) {
    setFilter(kind);
    setSelectedRowId(rowId ?? null);
    setView('data');
  }

  async function importFile(file: File) {
    setColumnId(null);
    setSelectedRowId(null);
    setFilter('all');
    setView('overview');
    await workbench.importFile(file);
  }

  const filename = dataset?.metadata.filename || '导入实验数据';
  return <div onDragOver={event => { if (event.dataTransfer.types.includes('Files')) { event.preventDefault(); setDragging(true); } }} onDragLeave={event => { if (!event.relatedTarget) setDragging(false); }} onDrop={event => { event.preventDefault(); setDragging(false); const file = event.dataTransfer.files[0]; if (file) void importFile(file); }}>
    <input ref={input} type="file" accept=".csv,.tsv,.xlsx" hidden onChange={event => { const file = event.target.files?.[0]; if (file) void importFile(file); event.target.value = ''; }} />
    <Sidebar view={view} onNavigate={setView} issues={audit?.issues.length || 0} />
    <div className="workspace">
      <header className="topbar"><div className="breadcrumb"><Icon name="grid" /><span>实验工作区</span><Icon name="chevron" /><strong>{titles[view]}</strong></div><div className="topbar-actions"><Button kind="ghost" icon="flask" onClick={() => { void workbench.loadSample(); setView('overview'); }} disabled={workbench.busy}>使用示例</Button><Button icon="upload" onClick={() => input.current?.click()} disabled={workbench.busy}>导入数据</Button><Button kind="primary" icon="download" disabled={!dataset} onClick={() => { if (dataset) downloadBlob(csvText(dataset), `${filenameStem(filename)}-当前数据.csv`, 'text/csv;charset=utf-8'); }}>导出数据</Button></div></header>
      {workbench.busy && <div className="busy-banner" role="status">正在读取文件并检查数据…</div>}
      <main className="main-content"><div className="page-heading"><div><h1>{titles[view]}</h1><p className="file-info"><Icon name="file" /><span className="file-name">{filename}</span>{dataset?.metadata.sheet && <span> / {dataset.metadata.sheet}</span>}{dataset && <><span className="separator">·</span><span>{dataset.metadata.encoding || 'XLSX'}</span></>}{dataset?.metadata.sample && <Badge kind="green">合成教学示例</Badge>}</p></div>{dataset && <div className="heading-actions"><Badge kind={audit?.issues.length ? 'orange' : 'green'}>{audit?.issues.length ? '存在待确认问题' : '当前检查通过'}</Badge></div>}</div>
        {dataset && audit ? <>
          {view === 'overview' && <Overview dataset={dataset} audit={audit} onInspect={inspect} onClean={() => setView('clean')} />}
          {view === 'data' && <DataView dataset={dataset} audit={audit} filter={filter} selectedRowId={selectedRowId} onFilter={kind => { setFilter(kind); setSelectedRowId(null); }} onColumnType={setColumnId} />}
        </> : <EmptyState title="从一份实验数据开始" description="支持 CSV、TSV 和 Excel（XLSX）。文件在浏览器本地处理，也可以先使用内置合成教学样例。"><Button kind="primary" icon="upload" onClick={() => input.current?.click()}>选择实验数据</Button></EmptyState>}
      </main>
    </div>
    {workbench.pendingWorkbook && <Modal title="选择 Excel 工作表" onClose={workbench.closeWorkbook}><p>每个工作表单独检查和处理，请选择要导入的实验数据。</p>{workbench.pendingWorkbook.imported.sheets.map(sheet => <button key={sheet.id} className="sheet-option" onClick={() => { workbench.selectSheet(sheet.id); setView('overview'); }}>{sheet.name}<span>{Math.max(0, sheet.rowCount - 1)} 条记录</span></button>)}</Modal>}
    {columnId !== null && dataset?.columns[columnId] && <ColumnTypeDialog key={columnId} column={dataset.columns[columnId]} onSave={type => workbench.changeType(columnId, type)} onClose={() => setColumnId(null)} />}
    {workbench.message && <div className={`toast ${workbench.message.error ? 'error' : ''}`} role="status">{workbench.message.text}</div>}
    {dragging && <div className="drop-overlay">松开以导入实验数据</div>}
  </div>;
}
