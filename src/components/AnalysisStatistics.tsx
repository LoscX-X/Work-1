import type { ChartAnalysis, ChartKind } from '../features/charts/types';
import { numberText } from '../lib/format';

export function AnalysisStatistics({
  analysis,
  kind,
}: {
  analysis: ChartAnalysis;
  kind: ChartKind;
}) {
  const values =
    kind === 'histogram'
      ? [
          { label: '参与分布的记录', value: String(analysis.used) },
          { label: '有效数值均值', value: numberText(analysis.summary.mean, 4) },
          { label: '有效数值中位数', value: numberText(analysis.summary.median, 4) },
        ]
      : [
          { label: '有效观测对数', value: String(analysis.used) },
          { label: '线性拟合斜率', value: numberText(analysis.regression?.slope, 5) },
          { label: '决定系数 R²', value: numberText(analysis.regression?.r2, 5) },
        ];
  return (
    <div className="fit-stats">
      {values.map((item) => (
        <div key={item.label} className="fit-stat">
          <div className="label">{item.label}</div>
          <div className="value">{item.value}</div>
        </div>
      ))}
    </div>
  );
}
