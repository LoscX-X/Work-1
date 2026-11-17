import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dataset } from '../lib/data-core';
import { readFile } from '../lib/importers';
import type { ImportedFile } from '../lib/importers';

export function useDataImport(
  accept: (dataset: Dataset, sample: boolean) => void,
  notify: (text: string, error?: boolean) => void,
) {
  const [busy, setBusy] = useState(false);
  const [pendingWorkbook, setPendingWorkbook] = useState<{
    imported: ImportedFile;
    sample: boolean;
  } | null>(null);
  const sequence = useRef(0);

  const parseFile = useCallback(
    async (file: File, sample: boolean, request: number) => {
      try {
        const imported = await readFile(file);
        if (request !== sequence.current) return;
        if (imported.sheets.length > 1) setPendingWorkbook({ imported, sample });
        else accept(imported.select(), sample);
      } catch (error) {
        if (request === sequence.current)
          notify(error instanceof Error ? error.message : '文件读取失败，请检查文件格式。', true);
      } finally {
        if (request === sequence.current) setBusy(false);
      }
    },
    [accept, notify],
  );

  const importFile = useCallback(
    async (file: File, sample = false) => {
      const request = ++sequence.current;
      setBusy(true);
      setPendingWorkbook(null);
      await parseFile(file, sample, request);
    },
    [parseFile],
  );

  const loadSample = useCallback(async () => {
    const request = ++sequence.current;
    setBusy(true);
    setPendingWorkbook(null);
    try {
      const response = await fetch('./samples/sensor-calibration.csv');
      if (!response.ok) throw new Error('示例数据读取失败。');
      const blob = await response.blob();
      if (request !== sequence.current) return;
      await parseFile(new File([blob], '传感器标定实验.csv', { type: 'text/csv' }), true, request);
    } catch (error) {
      if (request === sequence.current) {
        setBusy(false);
        notify(error instanceof Error ? error.message : '示例数据读取失败。', true);
      }
    }
  }, [parseFile, notify]);

  useEffect(() => {
    void loadSample();
    return () => {
      sequence.current += 1;
    };
  }, [loadSample]);

  const selectSheet = (id: number) => {
    if (!pendingWorkbook) return;
    try {
      accept(pendingWorkbook.imported.select(id), pendingWorkbook.sample);
      setPendingWorkbook(null);
    } catch (error) {
      notify(error instanceof Error ? error.message : '工作表读取失败。', true);
    }
  };

  return {
    busy,
    pendingWorkbook,
    closeWorkbook: () => setPendingWorkbook(null),
    importFile,
    loadSample,
    selectSheet,
  };
}
