import { useCallback, useMemo, useState } from 'react';
import { auditDataset } from '../lib/data-core';
import type { Dataset } from '../lib/data-core';
import { applyOperation } from '../features/cleaning/apply-operation';
import {
  commitOperation,
  createHistory,
  currentDataset,
  moveHistory,
} from '../features/cleaning/history';
import type { HistoryState, Operation, OperationResult } from '../features/cleaning/types';

export function useCleaningHistory(notify: (text: string, error?: boolean) => void) {
  const [history, setHistory] = useState<HistoryState | null>(null);
  const [preview, setPreview] = useState<{ base: Dataset; result: OperationResult } | null>(null);
  const dataset = history ? currentDataset(history) : null;
  const original = history?.original ?? null;
  const audit = useMemo(() => (dataset ? auditDataset(dataset) : null), [dataset]);
  const originalAudit = useMemo(() => (original ? auditDataset(original) : null), [original]);
  const previewAudit = useMemo(
    () => (preview ? auditDataset(preview.result.dataset) : null),
    [preview],
  );

  const acceptDataset = useCallback(
    (next: Dataset, sample: boolean) => {
      const original = { ...next, metadata: { ...next.metadata, sample } };
      setPreview(null);
      setHistory(createHistory(original));
      notify(`已读取 ${next.rows.length} 条记录、${next.columns.length} 个字段`);
    },
    [notify],
  );

  function propose(operation: Operation): string | null {
    if (!dataset) return '请先导入一份数据。';
    try {
      setPreview({ base: dataset, result: applyOperation(dataset, operation) });
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : '操作无法执行，请检查参数。';
    }
  }

  function confirmPreview() {
    if (!history || !preview) return;
    if (currentDataset(history) !== preview.base) {
      setPreview(null);
      notify('当前数据已发生变化，请重新预览操作。', true);
      return;
    }
    const next = commitOperation(history, preview.result.operation);
    setHistory(next);
    setPreview(null);
    notify(next === history ? '本次操作没有修改数据。' : `已执行：${preview.result.title}`);
  }

  function goTo(cursor: number) {
    if (!history) return;
    setHistory(moveHistory(history, cursor));
    setPreview(null);
    notify(cursor === 0 ? '已回到原始数据，可重做后续步骤。' : `已回到第 ${cursor} 步`);
  }

  return {
    history,
    dataset,
    original,
    audit,
    originalAudit,
    preview,
    previewAudit,
    acceptDataset,
    propose,
    confirmPreview,
    closePreview: () => setPreview(null),
    goTo,
    replaceHistory: setHistory,
  };
}
