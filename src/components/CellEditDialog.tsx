import { useState } from 'react';
import { Button, Modal } from './ui';

export function CellEditDialog({
  rowId,
  column,
  value,
  onPreview,
  onClose,
}: {
  rowId: number;
  column: string;
  value: string;
  onPreview(value: string): string | null;
  onClose(): void;
}) {
  const [next, setNext] = useState(value);
  const [error, setError] = useState<string | null>(null);
  return (
    <Modal
      title={`修正单元格 · #${rowId}`}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>取消</Button>
          <Button
            kind="primary"
            onClick={() => {
              const error = onPreview(next);
              setError(error);
              if (!error) onClose();
            }}
          >
            查看变更预览
          </Button>
        </>
      }
    >
      <label className="field">
        <span>{column}</span>
        <input value={next} onChange={(event) => setNext(event.target.value)} autoFocus />
      </label>
      <p>修正值会重新接受当前字段类型的检查，操作历史保留修改前后的内容。</p>
      {error && <div className="warning-box">{error}</div>}
    </Modal>
  );
}
