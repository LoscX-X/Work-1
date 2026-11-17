import type { AuditResult, Dataset } from '../lib/data-core';
import type { HistoryState } from '../features/cleaning/types';
import { operationDetails } from '../components/OperationForm';
import type { OperationFormKind } from '../components/OperationForm';
import { Icon } from '../components/Icon';
import { Button, Panel } from '../components/ui';
import { OperationList } from '../components/OperationList';

export function CleanView({
  dataset,
  original,
  audit,
  originalAudit,
  history,
  onChoose,
  onGoTo,
}: {
  dataset: Dataset;
  original: Dataset;
  audit: AuditResult;
  originalAudit: AuditResult;
  history: HistoryState;
  onChoose(kind: OperationFormKind): void;
  onGoTo(cursor: number): void;
}) {
  return (
    <div className="clean-layout">
      <Panel title="选择清洗操作" description="每次操作均先预览，再确认执行">
        <div className="clean-options">
          {(Object.keys(operationDetails) as OperationFormKind[]).map((kind) => (
            <button className="clean-option" key={kind} onClick={() => onChoose(kind)}>
              <Icon name={operationDetails[kind].icon} />
              <div>
                <strong>{operationDetails[kind].title}</strong>
                <p>{operationDetails[kind].description}</p>
              </div>
            </button>
          ))}
          <p className="helper">原始数据保留。操作参数、实际变更和记录移除会随处理历史一起导出。</p>
        </div>
      </Panel>
      <div>
        <div className="comparison-grid">
          <div className="comparison-box">
            <span className="label">当前保留记录</span>
            <div className="value">
              {dataset.rows.length}
              <small> / {original.rows.length}</small>
            </div>
            <p>累计移除 {original.rows.length - dataset.rows.length} 条源记录</p>
          </div>
          <div className="comparison-box">
            <span className="label">当前待确认项</span>
            <div className="value">
              {audit.issues.length}
              <small> / {originalAudit.issues.length}</small>
            </div>
            <p>使用相同检查规则对照原始数据</p>
          </div>
        </div>
        <Panel title="处理工作流" description="可回到任意已保留步骤，重新核对处理结果">
          <div className="clean-status">
            <span>
              当前处于第 <strong>{history.cursor}</strong> 步，共 {history.entries.length} 步
            </span>
            <div className="flex">
              <Button
                icon="undo"
                disabled={!history.cursor}
                onClick={() => onGoTo(history.cursor - 1)}
              >
                撤销
              </Button>
              <Button
                icon="redo"
                disabled={history.cursor >= history.entries.length}
                onClick={() => onGoTo(history.cursor + 1)}
              >
                重做
              </Button>
              <Button kind="ghost" disabled={!history.cursor} onClick={() => onGoTo(0)}>
                回到原始
              </Button>
            </div>
          </div>
          <OperationList history={history} onGoTo={onGoTo} />
        </Panel>
      </div>
    </div>
  );
}
