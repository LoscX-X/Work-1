import type { Dataset } from '../lib/data-core';
import type { ChartKind, ChartSettings } from '../features/charts/types';
import { Button } from './ui';

export function ChartControls({
  dataset,
  settings,
  onChange,
}: {
  dataset: Dataset;
  settings: ChartSettings;
  onChange(settings: Partial<ChartSettings>): void;
}) {
  const numeric = dataset.columns.filter((column) => column.type === 'number');
  const chartKinds: { kind: ChartKind; label: string }[] = [
    { kind: 'scatter', label: '散点图' },
    { kind: 'line', label: '趋势图' },
    { kind: 'histogram', label: '分布图' },
  ];
  const canFit =
    settings.xColumnId !== null &&
    dataset.columns[settings.xColumnId]?.type === 'number' &&
    settings.kind !== 'histogram';
  return (
    <div className="chart-controls">
      <div className="field-label">图表类型</div>
      <div className="chart-type-buttons">
        {chartKinds.map((item) => (
          <Button
            key={item.kind}
            className={settings.kind === item.kind ? 'active' : ''}
            onClick={() => onChange({ kind: item.kind })}
          >
            {item.label}
          </Button>
        ))}
      </div>
      {settings.kind !== 'histogram' && (
        <label className="field">
          <span>X 轴字段</span>
          <select
            value={settings.xColumnId ?? ''}
            onChange={(event) =>
              onChange({ xColumnId: event.target.value === '' ? null : Number(event.target.value) })
            }
          >
            <option value="">源记录序号</option>
            {dataset.columns.map((column) => (
              <option key={column.id} value={column.id}>
                {column.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="field">
        <span>{settings.kind === 'histogram' ? '分布字段' : 'Y 轴字段'}</span>
        <select
          value={settings.yColumnId ?? ''}
          onChange={(event) =>
            onChange({ yColumnId: event.target.value === '' ? null : Number(event.target.value) })
          }
        >
          {!numeric.length && <option value="">暂无数值字段</option>}
          {numeric.map((column) => (
            <option key={column.id} value={column.id}>
              {column.name}
            </option>
          ))}
        </select>
      </label>
      {settings.kind !== 'histogram' && (
        <label className="field">
          <span>分组字段</span>
          <select
            value={settings.groupColumnId ?? ''}
            onChange={(event) =>
              onChange({
                groupColumnId: event.target.value === '' ? null : Number(event.target.value),
              })
            }
          >
            <option value="">不分组</option>
            {dataset.columns.map((column) => (
              <option key={column.id} value={column.id}>
                {column.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {settings.kind === 'histogram' && (
        <label className="field">
          <span>分箱数量 · {settings.bins}</span>
          <input
            type="range"
            min="3"
            max="30"
            value={settings.bins}
            onChange={(event) => onChange({ bins: Number(event.target.value) })}
          />
        </label>
      )}
      <label className="toggle-label">
        <input
          type="checkbox"
          checked={settings.excludeImputed}
          onChange={(event) => onChange({ excludeImputed: event.target.checked })}
        />
        排除 X/Y 轴上的填充值
      </label>
      {settings.kind !== 'histogram' && (
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={settings.showFit}
            disabled={!canFit}
            onChange={(event) => onChange({ showFit: event.target.checked })}
          />
          显示整体线性拟合
        </label>
      )}
      <p className="field-help">
        统计使用当前有效观测。填充值和人工修正保留来源，未进入分析的记录数会在图表下方列明。
      </p>
    </div>
  );
}
