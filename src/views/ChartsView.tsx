import { useMemo, useRef } from 'react';
import type { Dataset } from '../lib/data-core';
import type { HistoryState } from '../features/cleaning/types';
import type { ChartSettings } from '../features/charts/types';
import { buildChart } from '../features/charts/options';
import { imputedCellKeys } from '../features/cleaning/lineage';
import { Button, Chart, EmptyState, Panel } from '../components/ui';
import { ChartControls } from '../components/ChartControls';
import { AnalysisStatistics } from '../components/AnalysisStatistics';
import { DataVersionTabs } from '../components/DataVersionTabs';
import type { DataVersion } from '../components/DataVersionTabs';
import { downloadDataURL, filenameStem, numberText } from '../lib/format';

export function ChartsView({
  dataset,
  originalView,
  history,
  settings,
  onSettings,
  version,
  onVersion,
  onInspect,
  onNotify,
}: {
  dataset: Dataset;
  originalView: Dataset;
  history: HistoryState;
  settings: ChartSettings;
  onSettings(settings: Partial<ChartSettings>): void;
  version: DataVersion;
  onVersion(version: DataVersion): void;
  onInspect(rowId: number, version: DataVersion): void;
  onNotify(text: string, error?: boolean): void;
}) {
  const instance = useRef<ChartInstance | null>(null);
  const imputed = useMemo(() => imputedCellKeys(history), [history]);
  const active = version === 'current' ? dataset : originalView;
  const analysis = useMemo(
    () => buildChart(active, settings, version === 'current' ? imputed : new Set()),
    [active, settings, version, imputed],
  );
  const baseline = useMemo(() => buildChart(originalView, settings), [originalView, settings]);
  const name =
    settings.kind === 'histogram'
      ? `${analysis.yName} · 数值分布`
      : `${analysis.xName} × ${analysis.yName}`;
  const excluded = Object.values(analysis.excluded).reduce((sum, value) => sum + value, 0);

  function exportPng() {
    if (!instance.current || analysis.emptyReason) return;
    try {
      downloadDataURL(
        instance.current.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#ffffff' }),
        `${filenameStem(dataset.metadata.filename || '实验数据')}-${version}-${settings.kind}.png`,
      );
      onNotify('图表已导出，保留当前字段和数据版本。');
    } catch (error) {
      onNotify(error instanceof Error ? error.message : '图表导出失败。', true);
    }
  }

  return (
    <>
      <div className="chart-version-bar">
        <DataVersionTabs value={version} onChange={onVersion} />
        <span className="small muted">原始值与当前结果使用相同的已确认字段类型</span>
        <span className="spacer" />
        <Button icon="download" onClick={exportPng} disabled={!!analysis.emptyReason}>
          导出图表 PNG
        </Button>
      </div>
      <div className="chart-layout">
        <Panel
          title={name}
          description={
            version === 'current'
              ? '当前处理结果 · 点击数据点定位源记录'
              : '原始文件值 · 点击数据点回到原始记录'
          }
        >
          {analysis.emptyReason ? (
            <EmptyState title="当前没有可绘制数据" description={analysis.emptyReason} />
          ) : (
            <Chart
              option={analysis.option}
              className="chart-main"
              onReady={(chart) => {
                instance.current = chart;
              }}
              onRowClick={(id) => onInspect(id, version)}
            />
          )}
          <AnalysisStatistics analysis={analysis} kind={settings.kind} />
          <div className="chart-note">
            当前数据版本共 {active.rows.length} 行，参与分析 {analysis.used} 行。排除 {excluded}{' '}
            行，其中缺失 {analysis.excluded.missing}、格式错误 {analysis.excluded.invalid}、填充值{' '}
            {analysis.excluded.imputed}。
          </div>
        </Panel>
        <Panel title="分析设置">
          <ChartControls dataset={dataset} settings={settings} onChange={onSettings} />
        </Panel>
      </div>
      <div className="analysis-compare">
        <div>
          <span>原始有效观测</span>
          <strong>{baseline.used}</strong>
        </div>
        <div>
          <span>当前显示有效观测</span>
          <strong>{analysis.used}</strong>
        </div>
        <div>
          <span>{settings.kind === 'histogram' ? '原始均值' : '原始线性拟合 R²'}</span>
          <strong>
            {numberText(
              settings.kind === 'histogram' ? baseline.summary.mean : baseline.regression?.r2,
              5,
            )}
          </strong>
        </div>
        <div>
          <span>{settings.kind === 'histogram' ? '当前显示均值' : '当前显示线性拟合 R²'}</span>
          <strong>
            {numberText(
              settings.kind === 'histogram' ? analysis.summary.mean : analysis.regression?.r2,
              5,
            )}
          </strong>
        </div>
      </div>
      {analysis.regression && settings.kind !== 'histogram' && (
        <div className="method-caption">
          整体普通最小二乘拟合：y = {numberText(analysis.regression.slope, 5)} × x{' '}
          {analysis.regression.intercept < 0 ? '−' : '+'}{' '}
          {numberText(Math.abs(analysis.regression.intercept), 5)}。R²
          描述当前观测的线性拟合程度，排除项和填充策略会影响参与样本。
        </div>
      )}
    </>
  );
}
