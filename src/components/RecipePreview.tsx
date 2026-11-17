import type { Recipe } from '../features/cleaning/recipe';
import { Button, Modal } from './ui';

export function RecipePreview({
  recipe,
  filename,
  disabled,
  onConfirm,
  onClose,
}: {
  recipe: Recipe;
  filename: string;
  disabled: boolean;
  onConfirm(): void;
  onClose(): void;
}) {
  return (
    <Modal
      title="回放处理配置"
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>取消</Button>
          <Button kind="primary" onClick={onConfirm} disabled={disabled}>
            确认回放
          </Button>
        </>
      }
    >
      <p>{filename}</p>
      <div className="preview-change">
        <div>
          <strong>{recipe.operations.length}</strong>
          <span>步操作已完成试运行</span>
        </div>
        <div>
          <strong>{recipe.expected.rows}</strong>
          <span>条最终记录已通过指纹校验</span>
        </div>
      </div>
      <dl className="metadata-list">
        <div className="metadata-item">
          <dt>原始文件</dt>
          <dd>
            {recipe.source.filename}
            {recipe.source.sheet ? ` / ${recipe.source.sheet}` : ''}
          </dd>
        </div>
        <div className="metadata-item">
          <dt>源文件 SHA-256</dt>
          <dd className="mono">{recipe.source.sha256}</dd>
        </div>
      </dl>
      <div className="warning-box">
        确认后将从原始文件重新执行此配置，用已校验结果替换当前处理工作流。原文件、操作顺序、参数和最终结果都已核对。
      </div>
    </Modal>
  );
}
