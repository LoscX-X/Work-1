import type { HistoryState } from '../features/cleaning/types';
import { Icon } from './Icon';
import { Button } from './ui';

export function OperationList({
  history,
  onGoTo,
}: {
  history: HistoryState;
  onGoTo(cursor: number): void;
}) {
  if (!history.entries.length)
    return (
      <div className="history-empty">
        <Icon name="history" />
        <h3>从一次明确的数据处理开始</h3>
        <p>选择操作、查看预览，确认后这里会保留参数与变更记录。</p>
      </div>
    );
  return (
    <div>
      {history.entries.map((entry, index) => (
        <div
          key={entry.id}
          className={`operation-row ${index >= history.cursor ? 'inactive' : ''}`}
        >
          <div className="operation-index">{index + 1}</div>
          <div className="operation-description">
            <h3>{entry.result.title}</h3>
            <p>{entry.result.description}</p>
            <div className="change-pills">
              <span>{entry.result.changedCells.length} 个单元格修改</span>
              <span>{entry.result.removedRowIds.length} 条记录移除</span>
              {entry.result.schemaChanged && <span>字段类型已确认</span>}
            </div>
          </div>
          <div className="operation-meta">
            {new Date(entry.timestamp).toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
            <br />
            <Button
              kind="ghost"
              onClick={() => onGoTo(index + 1)}
              disabled={history.cursor === index + 1}
            >
              回到此步
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
