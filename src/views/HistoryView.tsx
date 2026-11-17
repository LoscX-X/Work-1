import type { HistoryState } from '../features/cleaning/types';
import { OperationList } from '../components/OperationList';
import { SourceMetadata } from '../components/SourceMetadata';
import { ExportActions } from '../components/ExportActions';
import { Button, Panel } from '../components/ui';

export function HistoryView({
  history,
  exporting,
  recipeBusy,
  onGoTo,
  onCsv,
  onHtml,
  onAudit,
  onRecipe,
  onImportRecipe,
  onNotify,
}: {
  history: HistoryState;
  exporting: boolean;
  recipeBusy: boolean;
  onGoTo(cursor: number): void;
  onCsv(): void;
  onHtml(): void;
  onAudit(): void;
  onRecipe(): void;
  onImportRecipe(): void;
  onNotify(text: string, error?: boolean): void;
}) {
  return (
    <div className="detail-grid">
      <div>
        <Panel
          title="数据处理记录"
          description="当前生效的操作可导出为配置，在同一原始文件上核验回放"
          action={
            <Button kind="ghost" onClick={() => onGoTo(0)} disabled={!history.cursor}>
              回到原始
            </Button>
          }
        >
          <div className="clean-status">
            <span>
              生效 {history.cursor} 步 / 已保留 {history.entries.length} 步
            </span>
            <span className="small muted">灰色步骤当前未生效</span>
          </div>
          <OperationList history={history} onGoTo={onGoTo} />
        </Panel>
        <div className="method-card">
          <h2>导出与复现口径</h2>
          <p>
            CSV 保存当前结果全表。HTML 报告包含当前图表、字段统计、处理参数和前 20
            条结果预览。完整处理记录保存每个修改单元格及移除的源记录。
          </p>
          <p>
            清洗配置保存已生效的操作序列，并记录源文件及最终结果指纹。先导入同一原文件、选择同一工作表，再导入配置；通过校验和确认后一次性应用。
          </p>
          <p>
            均值、中位数和指定值填充会保留来源，图表默认排除所选轴上的填充值。原始值对照使用当前确认的字段类型。
          </p>
        </div>
      </div>
      <div className="side-panels">
        <Panel title="导出当前结果">
          <ExportActions
            exporting={exporting}
            recipeBusy={recipeBusy}
            onCsv={onCsv}
            onHtml={onHtml}
            onAudit={onAudit}
            onRecipe={onRecipe}
            onImportRecipe={onImportRecipe}
          />
          <div className="panel-foot">所有文件在当前浏览器生成。</div>
        </Panel>
        <Panel title="原始数据来源">
          <SourceMetadata history={history} onNotify={onNotify} />
        </Panel>
      </div>
    </div>
  );
}
