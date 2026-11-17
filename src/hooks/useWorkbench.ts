import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { auditDataset } from '../lib/data-core';
import type { ColumnType, Dataset } from '../lib/data-core';
import { readFile } from '../lib/importers';
import type { ImportedFile } from '../lib/importers';

export function useWorkbench() {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [original, setOriginal] = useState<Dataset | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [pendingWorkbook, setPendingWorkbook] = useState<{ imported: ImportedFile; sample: boolean } | null>(null);
  const importSequence = useRef(0);

  const notify = useCallback((text: string, error = false) => setMessage({ text, error }), []);
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 4500);
    return () => clearTimeout(timer);
  }, [message]);

  const acceptDataset = useCallback((next: Dataset, sample: boolean) => {
    next = { ...next, metadata: { ...next.metadata, sample } };
    setOriginal(next);
    setDataset(next);
    notify(`已读取 ${next.rows.length} 条记录、${next.columns.length} 个字段`);
  }, [notify]);

  const importFile = useCallback(async (file: File, sample = false) => {
    const sequence = ++importSequence.current;
    setBusy(true);
    setPendingWorkbook(null);
    try {
      const imported = await readFile(file);
      if (sequence !== importSequence.current) return;
      if (imported.sheets.length > 1) setPendingWorkbook({ imported, sample });
      else acceptDataset(imported.select(), sample);
    } catch (error) {
      if (sequence === importSequence.current) notify(error instanceof Error ? error.message : '文件读取失败，请检查文件格式。', true);
    } finally {
      if (sequence === importSequence.current) setBusy(false);
    }
  }, [acceptDataset, notify]);

  const loadSample = useCallback(async () => {
    try {
      const response = await fetch('./samples/sensor-calibration.csv');
      if (!response.ok) throw new Error('示例数据读取失败。');
      const blob = await response.blob();
      await importFile(new File([blob], '传感器标定实验.csv', { type: 'text/csv' }), true);
    } catch (error) {
      notify(error instanceof Error ? error.message : '示例数据读取失败。', true);
    }
  }, [importFile, notify]);

  useEffect(() => {
    void loadSample();
    return () => { importSequence.current += 1; };
  }, [loadSample]);

  const selectSheet = (id: number) => {
    if (!pendingWorkbook) return;
    try {
      acceptDataset(pendingWorkbook.imported.select(id), pendingWorkbook.sample);
      setPendingWorkbook(null);
    } catch (error) {
      notify(error instanceof Error ? error.message : '工作表读取失败。', true);
    }
  };

  const changeType = (columnId: number, type: ColumnType) => {
    setDataset(current => current && { ...current, columns: current.columns.map(column => column.id === columnId ? { ...column, type } : column) });
  };

  const audit = useMemo(() => dataset ? auditDataset(dataset) : null, [dataset]);
  const originalAudit = useMemo(() => original ? auditDataset(original) : null, [original]);

  return { dataset, setDataset, original, audit, originalAudit, busy, message, pendingWorkbook, closeWorkbook: () => setPendingWorkbook(null), importFile, loadSample, selectSheet, changeType, notify };
}
