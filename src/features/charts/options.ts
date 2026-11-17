import { histogram, linearRegression, numericSummary } from '../../lib/data-core.ts';
import type { Dataset } from '../../lib/data-core.ts';
import { numberText } from '../../lib/format.ts';
import { collectPoints } from './collect-points.ts';
import type { ChartAnalysis, ChartPoint, ChartSettings } from './types.ts';

export function defaultChartSettings(dataset: Dataset): ChartSettings {
  const numeric = dataset.columns.filter((column) => column.type === 'number');
  const x = numeric.find((column) => /参考压力/.test(column.name)) || numeric[0];
  const y =
    numeric.find((column) => /输出/.test(column.name) && column.id !== x?.id) ||
    numeric.find((column) => column.id !== x?.id) ||
    numeric[0];
  return {
    kind: 'scatter',
    xColumnId: x && x.id !== y?.id ? x.id : null,
    yColumnId: y?.id ?? null,
    groupColumnId: null,
    showFit: true,
    excludeImputed: true,
    bins: 12,
  };
}

export function buildChart(
  dataset: Dataset,
  settings: ChartSettings,
  imputed: ReadonlySet<string> = new Set(),
): ChartAnalysis {
  const { points, excluded, xColumn, yColumn } = collectPoints(dataset, settings, imputed);
  const xName = xColumn?.name || '源记录序号';
  const yName = yColumn?.name || '数值字段';
  const summary = numericSummary(points.map((point) => point.value[1]));
  const numericX = xColumn?.type === 'number';
  const regression =
    settings.kind !== 'histogram' && numericX
      ? linearRegression(points.map((point) => [Number(point.value[0]), point.value[1]]))
      : null;
  const option: Record<string, unknown> = {
    color: ['#92ad79', '#7f9ec9', '#c7a077', '#ad96c4', '#78aaa2', '#c58c91'],
    animationDuration: 300,
    tooltip: {
      trigger: settings.kind === 'histogram' ? 'axis' : 'item',
      renderMode: 'richText',
      axisPointer: { type: 'shadow' },
    },
    grid: { top: 57, right: 29, bottom: 62, left: 67 },
    legend: {
      type: 'scroll',
      top: 9,
      left: 24,
      right: 24,
      textStyle: { fontSize: 10, color: '#7d8d9b' },
      itemWidth: 10,
      itemHeight: 7,
    },
    toolbox: { show: false },
  };
  if (settings.kind === 'histogram') {
    const result = histogram(
      points.map((point) => point.value[1]),
      settings.bins,
    );
    option.xAxis = {
      type: 'category',
      name: yName,
      nameLocation: 'middle',
      nameGap: 41,
      data: result.bins.map((bin) => `${numberText(bin.start, 2)}–${numberText(bin.end, 2)}`),
      axisLabel: { fontSize: 9, rotate: 22, color: '#99a7b5' },
      axisLine: { lineStyle: { color: '#e0e6eb' } },
    };
    option.yAxis = {
      type: 'value',
      name: '记录数',
      minInterval: 1,
      nameTextStyle: { fontSize: 10, color: '#8c9ba8' },
      axisLabel: { fontSize: 10, color: '#99a7b5' },
      splitLine: { lineStyle: { color: '#edf0f3', type: 'dashed' } },
    };
    option.series = [
      {
        name: '有效观测',
        type: 'bar',
        data: result.bins.map((bin) => bin.count),
        barMaxWidth: 42,
        itemStyle: { color: '#9bb887', borderRadius: [4, 4, 0, 0] },
      },
    ];
  } else {
    const groups = new Map<string, ChartPoint[]>();
    points.forEach((point) => {
      if (!groups.has(point.group)) groups.set(point.group, []);
      groups.get(point.group)!.push(point);
    });
    const category = xColumn?.type === 'text';
    const xType = category ? 'category' : xColumn?.type === 'date' ? 'time' : 'value';
    option.xAxis = {
      type: xType,
      name: xName,
      nameLocation: 'middle',
      nameGap: 35,
      nameTextStyle: { fontSize: 11, color: '#8b9ba9' },
      axisLabel: { fontSize: 10, color: '#99a7b5' },
      axisLine: { lineStyle: { color: '#e0e6eb' } },
      splitLine: { show: false },
      ...(category ? { data: Array.from(new Set(points.map((point) => point.value[0]))) } : {}),
    };
    option.yAxis = {
      type: 'value',
      scale: true,
      name: yName,
      nameTextStyle: { fontSize: 10, color: '#8b9ba9' },
      axisLabel: { fontSize: 10, color: '#99a7b5' },
      splitLine: { lineStyle: { color: '#edf0f3', type: 'dashed' } },
    };
    const series: Record<string, unknown>[] = Array.from(groups, ([name, values]) => ({
      name,
      type: settings.kind,
      data:
        settings.kind === 'line' && !category
          ? [...values].sort((a, b) => Number(a.value[0]) - Number(b.value[0]))
          : values,
      symbolSize: settings.kind === 'scatter' ? 6 : 4,
      showSymbol: values.length < 300,
      connectNulls: false,
      lineStyle: { width: 1.8 },
      emphasis: { focus: 'series' },
    }));
    if (settings.showFit && regression && points.length && numericX) {
      const xs = points.map((point) => Number(point.value[0]));
      const min = xs.reduce((result, value) => Math.min(result, value), Infinity);
      const max = xs.reduce((result, value) => Math.max(result, value), -Infinity);
      series.push({
        name: '整体线性拟合',
        type: 'line',
        data: [
          [min, regression.slope * min + regression.intercept],
          [max, regression.slope * max + regression.intercept],
        ],
        symbol: 'none',
        lineStyle: { color: '#6f8192', type: 'dashed', width: 1.5 },
        silent: true,
      });
    }
    option.series = series;
    option.dataZoom = [{ type: 'inside', filterMode: 'none' }];
  }
  const emptyReason = !yColumn
    ? '请先确认至少一个数值字段。'
    : !points.length
      ? '当前字段组合没有可用于分析的记录，请检查缺失值、类型或填充值筛选。'
      : undefined;
  return {
    option,
    points,
    used: points.length,
    excluded,
    regression,
    summary,
    xName,
    yName,
    emptyReason,
  };
}
