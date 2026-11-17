export function renderChartImage(option: Record<string, unknown>): string {
  const host = document.createElement('div');
  host.style.position = 'fixed';
  host.style.left = '-10000px';
  host.style.top = '0';
  host.style.width = '1200px';
  host.style.height = '600px';
  document.body.append(host);
  const chart = echarts.init(host, null, { renderer: 'canvas' });
  try {
    const series = Array.isArray(option.series)
      ? option.series.map((item) => ({ ...item, progressive: 0, animation: false }))
      : option.series;
    chart.setOption({ ...option, series, animation: false }, { notMerge: true });
    return chart.getDataURL({ type: 'png', pixelRatio: 1.5, backgroundColor: '#ffffff' });
  } finally {
    chart.dispose();
    host.remove();
  }
}
