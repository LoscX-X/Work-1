import { useEffect, useState } from 'react';
import type { Dataset } from '../lib/data-core';
import { defaultChartSettings } from '../features/charts/options';
import type { ChartSettings } from '../features/charts/types';

const initial: ChartSettings = {
  kind: 'scatter',
  xColumnId: null,
  yColumnId: null,
  groupColumnId: null,
  showFit: true,
  excludeImputed: true,
  bins: 12,
};

export function useChartSettings(original: Dataset | null, current: Dataset | null) {
  const [settings, setSettings] = useState<ChartSettings>(initial);
  useEffect(() => {
    if (original) setSettings(defaultChartSettings(original));
  }, [original]);
  useEffect(() => {
    if (!current) return;
    setSettings((previous) => {
      if (previous.yColumnId !== null && current.columns[previous.yColumnId]?.type === 'number')
        return previous;
      return {
        ...previous,
        yColumnId: current.columns.find((column) => column.type === 'number')?.id ?? null,
      };
    });
  }, [current?.columns]);
  return {
    settings,
    updateSettings: (partial: Partial<ChartSettings>) =>
      setSettings((previous) => ({ ...previous, ...partial })),
  };
}
