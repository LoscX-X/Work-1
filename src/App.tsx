import { useRef, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import type { ViewId } from './components/Sidebar';
import { Button, Badge, EmptyState, Modal } from './components/ui';
import { Icon } from './components/Icon';
import { ColumnTypeDialog } from './components/ColumnTypeDialog';
import { useWorkbench } from './hooks/useWorkbench';
import { Overview } from './views/Overview';
import { DataView } from './views/DataView';
import { CleanView } from './views/CleanView';
import { OperationForm } from './components/OperationForm';
import type { OperationFormKind } from './components/OperationForm';
import { OperationPreview } from './components/OperationPreview';
import { CellEditDialog } from './components/CellEditDialog';
import type { IssueKind } from './lib/data-core';
import { ChartsView } from './views/ChartsView';
import { useChartSettings } from './hooks/useChartSettings';
import type { DataVersion } from './components/DataVersionTabs';
import { HistoryView } from './views/HistoryView';
import { useReportExport } from './hooks/useReportExport';
import { RecipePreview } from './components/RecipePreview';

const titles: Record<ViewId, string> = {
  overview: '数据概览',
  data: '数据与问题',
  clean: '清洗工作流',
  charts: '可视化分析',
  history: '追溯与导出',
};

export function App() {
  const workbench = useWorkbench();
  const [view, setView] = useState<ViewId>('overview');
  const [filter, setFilter] = useState<IssueKind | 'all'>('all');
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [columnId, setColumnId] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [operationKind, setOperationKind] = useState<OperationFormKind | null>(null);
  const [editCell, setEditCell] = useState<{ rowId: number; columnId: number } | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const recipeInput = useRef<HTMLInputElement>(null);
  const { dataset, audit } = workbench;
  const [dataVersion, setDataVersion] = useState<DataVersion>('current');
  const chartSettings = useChartSettings(workbench.original, dataset);
  const reports = useReportExport(workbench.history, chartSettings.settings, workbench.notify);
  const tableDataset =
    dataVersion === 'original' && workbench.originalView ? workbench.originalView : dataset;
  const tableAudit =
    dataVersion === 'original' && workbench.originalAudit ? workbench.originalAudit : audit;

  function inspect(kind: IssueKind | 'all', rowId?: number, version: DataVersion = 'current') {
    setDataVersion(version);
    setFilter(kind);
    setSelectedRowId(rowId ?? null);
    setView('data');
  }

  async function importFile(file: File) {
    setColumnId(null);
    setDataVersion('current');
    setOperationKind(null);
    setEditCell(null);
    setSelectedRowId(null);
    setFilter('all');
    setView('overview');
    await workbench.importFile(file);
  }

  const filename = dataset?.metadata.filename || '导入实验数据';
  return (
    <div
      onDragOver={(event) => {
        if (event.dataTransfer.types.includes('Files')) {
          event.preventDefault();
          setDragging(true);
        }
      }}
      onDragLeave={(event) => {
        if (!event.relatedTarget) setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        const file = event.dataTransfer.files[0];
        if (file) void importFile(file);
      }}
    >
      <input
        ref={input}
        type="file"
        accept=".csv,.tsv,.xlsx"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void importFile(file);
          event.target.value = '';
        }}
      />
      <input
        ref={recipeInput}
        type="file"
        accept=".json"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void workbench.importRecipe(file);
          event.target.value = '';
        }}
      />
      <Sidebar
        view={view}
        onNavigate={setView}
        issues={audit?.issues.length || 0}
        available={['overview', 'data', 'clean', 'charts', 'history']}
      />
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            <Icon name="grid" />
            <span>实验工作区</span>
            <Icon name="chevron" />
            <strong>{titles[view]}</strong>
          </div>
          <div className="topbar-actions">
            <Button
              kind="ghost"
              icon="flask"
              onClick={() => {
                void workbench.loadSample();
                setView('overview');
              }}
              disabled={workbench.busy}
            >
              使用示例
            </Button>
            <Button icon="upload" onClick={() => input.current?.click()} disabled={workbench.busy}>
              导入数据
            </Button>
            <Button
              kind="primary"
              icon="download"
              disabled={!dataset}
              onClick={() => setView('history')}
            >
              导出数据
            </Button>
          </div>
        </header>
        {workbench.busy && (
          <div className="busy-banner" role="status">
            正在读取文件并检查数据…
          </div>
        )}
        <main className="main-content">
          <div className="page-heading">
            <div>
              <h1>{titles[view]}</h1>
              <p className="file-info">
                <Icon name="file" />
                <span className="file-name">{filename}</span>
                {dataset?.metadata.sheet && <span> / {dataset.metadata.sheet}</span>}
                {dataset && (
                  <>
                    <span className="separator">·</span>
                    <span>{dataset.metadata.encoding || 'XLSX'}</span>
                  </>
                )}
                {dataset?.metadata.sample && <Badge kind="green">合成教学示例</Badge>}
              </p>
            </div>
            {dataset && (
              <div className="heading-actions">
                <Badge kind={audit?.issues.length ? 'orange' : 'green'}>
                  {audit?.issues.length ? '存在待确认问题' : '当前检查通过'}
                </Badge>
              </div>
            )}
          </div>
          {dataset && audit ? (
            <>
              {view === 'overview' && (
                <Overview
                  dataset={dataset}
                  audit={audit}
                  onInspect={inspect}
                  onClean={() => setView('clean')}
                  cleaningAvailable
                />
              )}
              {view === 'data' && tableDataset && tableAudit && (
                <DataView
                  dataset={tableDataset}
                  audit={tableAudit}
                  filter={filter}
                  selectedRowId={selectedRowId}
                  onFilter={(kind) => {
                    setFilter(kind);
                    setSelectedRowId(null);
                  }}
                  onColumnType={dataVersion === 'current' ? setColumnId : undefined}
                  onEditCell={
                    dataVersion === 'current'
                      ? (rowId, columnId) => setEditCell({ rowId, columnId })
                      : undefined
                  }
                  version={dataVersion}
                  onVersion={(value) => {
                    setDataVersion(value);
                    setSelectedRowId(null);
                  }}
                  lineage={dataVersion === 'current' ? workbench.lineage : undefined}
                />
              )}
              {view === 'clean' &&
                workbench.original &&
                workbench.originalAudit &&
                workbench.history && (
                  <CleanView
                    dataset={dataset}
                    original={workbench.original}
                    audit={audit}
                    originalAudit={workbench.originalAudit}
                    history={workbench.history}
                    onChoose={setOperationKind}
                    onGoTo={workbench.goTo}
                  />
                )}
              {view === 'charts' && workbench.originalView && workbench.history && (
                <ChartsView
                  dataset={dataset}
                  originalView={workbench.originalView}
                  history={workbench.history}
                  settings={chartSettings.settings}
                  onSettings={chartSettings.updateSettings}
                  version={dataVersion}
                  onVersion={setDataVersion}
                  onInspect={(id, version) => inspect('all', id, version)}
                  onNotify={workbench.notify}
                />
              )}
              {view === 'history' && workbench.history && (
                <HistoryView
                  history={workbench.history}
                  exporting={reports.exporting}
                  recipeBusy={workbench.recipeBusy}
                  onGoTo={workbench.goTo}
                  onCsv={reports.exportCsv}
                  onHtml={() => {
                    void reports.exportHtml();
                  }}
                  onAudit={reports.exportAudit}
                  onRecipe={() => {
                    void workbench.exportRecipe();
                  }}
                  onImportRecipe={() => recipeInput.current?.click()}
                  onNotify={workbench.notify}
                />
              )}
            </>
          ) : (
            <EmptyState
              title="从一份实验数据开始"
              description="支持 CSV、TSV 和 Excel（XLSX）。文件在浏览器本地处理，也可以先使用内置合成教学样例。"
            >
              <Button kind="primary" icon="upload" onClick={() => input.current?.click()}>
                选择实验数据
              </Button>
            </EmptyState>
          )}
        </main>
      </div>
      {workbench.pendingWorkbook && (
        <Modal title="选择 Excel 工作表" onClose={workbench.closeWorkbook}>
          <p>每个工作表单独检查和处理，请选择要导入的实验数据。</p>
          {workbench.pendingWorkbook.imported.sheets.map((sheet) => (
            <button
              key={sheet.id}
              className="sheet-option"
              onClick={() => {
                workbench.selectSheet(sheet.id);
                setView('overview');
              }}
            >
              {sheet.name}
              <span>{Math.max(0, sheet.rowCount - 1)} 条记录</span>
            </button>
          ))}
        </Modal>
      )}
      {columnId !== null && dataset?.columns[columnId] && (
        <ColumnTypeDialog
          key={columnId}
          column={dataset.columns[columnId]}
          onSave={(type) => {
            const error = workbench.propose({ kind: 'change_type', columnId, type });
            if (error) workbench.notify(error, true);
          }}
          onClose={() => setColumnId(null)}
        />
      )}
      {operationKind && dataset && audit && (
        <OperationForm
          key={operationKind}
          kind={operationKind}
          dataset={dataset}
          audit={audit}
          onPreview={workbench.propose}
          onClose={() => setOperationKind(null)}
        />
      )}
      {editCell && dataset && (
        <CellEditDialog
          rowId={editCell.rowId}
          column={dataset.columns[editCell.columnId].name}
          value={
            dataset.rows.find((row) => row.id === editCell.rowId)?.values[editCell.columnId] || ''
          }
          onPreview={(value) => workbench.propose({ kind: 'set_cell', ...editCell, value })}
          onClose={() => setEditCell(null)}
        />
      )}
      {workbench.preview && workbench.previewAudit && dataset && audit && (
        <OperationPreview
          before={dataset}
          beforeAudit={audit}
          afterAudit={workbench.previewAudit}
          result={workbench.preview.result}
          onConfirm={workbench.confirmPreview}
          onClose={workbench.closePreview}
        />
      )}
      {workbench.message && (
        <div className={`toast ${workbench.message.error ? 'error' : ''}`} role="status">
          {workbench.message.text}
        </div>
      )}
      {workbench.pendingRecipe && (
        <RecipePreview
          recipe={workbench.pendingRecipe.recipe}
          filename={workbench.pendingRecipe.filename}
          disabled={workbench.busy}
          onConfirm={workbench.confirmRecipe}
          onClose={workbench.closeRecipe}
        />
      )}
      {dragging && <div className="drop-overlay">松开以导入实验数据</div>}
    </div>
  );
}
