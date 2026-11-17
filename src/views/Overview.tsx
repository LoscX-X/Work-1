import { useMemo } from 'react';
import { ISSUE_LABELS, toNumber } from '../lib/data-core';
import type { Dataset, AuditResult, IssueKind } from '../lib/data-core';
import { numberText } from '../lib/format';
import { Button, Chart, Panel } from '../components/ui';
import { Icon } from '../components/Icon';
import { SummaryCards } from '../components/SummaryCards';

interface OverviewProps {
  dataset: Dataset;
  audit: AuditResult;
  onInspect(kind: IssueKind | 'all', rowId?: number): void;
  onClean(): void;
  cleaningAvailable?: boolean;
}

export function Overview({ dataset, audit, onInspect, onClean, cleaningAvailable = false }: OverviewProps) {
  const numericColumns = dataset.columns.filter(column => column.type === 'number');
  const x = numericColumns.find(column => /参考压力/.test(column.name)) || numericColumns[0];
  const y = numericColumns.find(column => /输出/.test(column.name) && column.id !== x?.id) || numericColumns.find(column => column.id !== x?.id);
  const option = useMemo(() => {
    const points = x && y ? dataset.rows.flatMap(row => {
      const px = toNumber(row.values[x.id]), py = toNumber(row.values[y.id]);
      if (px === null || py === null) return [];
      return [{ value: [px, py], rowId: row.id, itemStyle: { color: audit.rowFlags.get(row.id)?.has('outlier') ? '#d4a37a' : '#93b181' } }];
    }) : [];
    return {
      animationDuration: 350,
      grid: { top: 18, bottom: 38, left: 52, right: 24 },
      tooltip: { trigger: 'item', renderMode: 'richText' },
      xAxis: { type: 'value', name: x?.name ?? 'X', nameLocation: 'middle', nameGap: 26, nameTextStyle: { fontSize: 10, color: '#98a6b5' }, axisLine: { lineStyle: { color: '#e6ebf0' } }, axisLabel: { fontSize: 9, color: '#a3afbc' }, splitLine: { show: false } },
      yAxis: { type: 'value', scale: true, name: y?.name ?? 'Y', nameTextStyle: { fontSize: 9, color: '#a3afbc' }, axisLabel: { fontSize: 9, color: '#a3afbc' }, splitLine: { lineStyle: { type: 'dashed', color: '#edf0f3' } } },
      series: [{ type: 'scatter', symbolSize: 5, data: points, emphasis: { scale: 1.6 } }],
    };
  }, [dataset, audit, x, y]);
  const totalIssues = Object.values(audit.counts).reduce((sum, count) => sum + count, 0);
  const kinds = Object.keys(ISSUE_LABELS) as IssueKind[];
  const recent = kinds.flatMap(kind => audit.issues.filter(issue => issue.kind === kind).slice(0, 1));
  return <>
    <SummaryCards dataset={dataset} audit={audit} />
    <div className="audit-grid">
      <Panel title="测量关系预览" description={x && y ? `${x.name} × ${y.name}` : '确认至少两个数值字段后显示散点图'} action={<div className="chart-legend"><span><i className="legend-dot" />有效测量</span><span>点击数据点定位源记录</span></div>}>
        {x && y ? <Chart option={option} className="preview-chart" onRowClick={id => onInspect('all', id)} /> : <div className="history-empty">当前缺少可绘制的数值字段。</div>}
      </Panel>
      <Panel title="数据质量检查" description="点击问题类型，查看受影响的源记录" action={<span className="small muted">{totalIssues} 项</span>}>
        <div className="issue-grid">{kinds.map(kind => <button key={kind} className={`issue-card ${kind}`} onClick={() => onInspect(kind)}><span className="issue-icon"><Icon name={kind} /></span><strong>{audit.counts[kind]}</strong><div className="issue-label">{ISSUE_LABELS[kind]}</div></button>)}</div>
        <div className="panel-foot"><Icon name="info" />异常值按 1.5 × IQR 检出，需结合实验背景确认。</div>
      </Panel>
    </div>
    <div className="overview-bottom">
      <Panel title="字段完整度" description="显示非空单元格占当前记录的比例" action={<button className="inline-link" onClick={() => onInspect('all')}>查看数据<Icon name="arrow" /></button>}>
        <div className="column-list">{audit.byColumn.map(column => {
          const ratio = dataset.rows.length ? 100 * (1 - column.counts.missing / dataset.rows.length) : 0;
          return <div className="column-row" key={column.id}><div className="column-name"><span className="type-glyph">{column.type === 'number' ? '#' : column.type === 'date' ? '◷' : 'Aa'}</span><span className="ellipsis">{column.name}</span></div><div className="progress-track"><div style={{ width: `${ratio}%` }} /></div><span className="column-ratio">{numberText(ratio, 1)}%</span></div>;
        })}</div>
        {dataset.metadata.sample && <div className="sample-note"><Icon name="flask" />当前为固定种子生成的合成教学数据，含已知数据问题。</div>}
      </Panel>
      <Panel title="问题定位" description="原始记录序号在清洗后保持不变" action={<button className="inline-link" onClick={() => onInspect('all')}>全部<Icon name="arrow" /></button>}>
        {recent.length ? recent.map(issue => <div key={issue.kind} className={`recent-issue ${issue.kind}`}><span className="issue-dot" /><div><h3>{issue.column} · {ISSUE_LABELS[issue.kind]}</h3><p>{issue.kind === 'duplicate' ? `保留首次记录 #${issue.originalRowId}` : issue.value || '空单元格'}</p></div><button className="source-row inline-link" onClick={() => onInspect('all', issue.rowId)}>#{issue.rowId}<Icon name="chevron" /></button></div>) : <div className="history-empty"><Icon name="check" /><h3>当前检查未发现问题</h3><p>可继续确认列类型与实验数据合理性。</p></div>}
      </Panel>
    </div>
    <div className="action-strip"><Icon name="clean" /><div><h3>处理之前，先查看数据会发生什么变化</h3><p>每次清洗均保留参数与源记录，确认后执行，支持撤销和重做。</p></div><Button kind="lime" onClick={onClean} disabled={!cleaningAvailable}>进入清洗工作流<Icon name="arrow" /></Button></div>
  </>;
}
