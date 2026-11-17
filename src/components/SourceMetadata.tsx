import type { HistoryState } from '../features/cleaning/types';
import { Button } from './ui';

export function SourceMetadata({
  history,
  onNotify,
}: {
  history: HistoryState;
  onNotify(text: string, error?: boolean): void;
}) {
  const metadata = history.original.metadata;
  async function copyHash() {
    if (!metadata.sha256) return;
    try {
      await navigator.clipboard.writeText(metadata.sha256);
      onNotify('已复制原始文件 SHA-256。');
    } catch {
      onNotify('复制失败，可从完整处理记录中读取文件指纹。', true);
    }
  }
  return (
    <dl className="metadata-list">
      <div className="metadata-item">
        <dt>原始文件</dt>
        <dd>{metadata.filename}</dd>
      </div>
      {metadata.sheet && (
        <div className="metadata-item">
          <dt>Excel 工作表</dt>
          <dd>{metadata.sheet}</dd>
        </div>
      )}
      <div className="metadata-item">
        <dt>文件字节数</dt>
        <dd>{metadata.bytes?.toLocaleString() ?? '—'} bytes</dd>
      </div>
      <div className="metadata-item">
        <dt>导入时间</dt>
        <dd>{metadata.importedAt ? new Date(metadata.importedAt).toLocaleString('zh-CN') : '—'}</dd>
      </div>
      <div className="metadata-item">
        <dt>SHA-256 指纹</dt>
        <dd className="mono">{metadata.sha256}</dd>
        <Button kind="ghost" onClick={copyHash}>
          复制指纹
        </Button>
      </div>
      {metadata.sample && (
        <div className="metadata-item">
          <dt>数据来源</dt>
          <dd>固定种子生成的合成教学样例。</dd>
        </div>
      )}
      {history.replay && (
        <div className="metadata-item">
          <dt>配置回放</dt>
          <dd>
            {history.replay.configName}
            <br />
            {new Date(history.replay.loadedAt).toLocaleString('zh-CN')}
          </dd>
        </div>
      )}
    </dl>
  );
}
