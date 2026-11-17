import { Icon } from './Icon';

export type ViewId = 'overview' | 'data' | 'clean' | 'charts' | 'history';

const navigation: { id: ViewId; title: string; icon: string }[] = [
  { id: 'overview', title: '数据概览', icon: 'grid' },
  { id: 'data', title: '数据与问题', icon: 'table' },
  { id: 'clean', title: '清洗工作流', icon: 'clean' },
  { id: 'charts', title: '可视化分析', icon: 'chart' },
  { id: 'history', title: '追溯与导出', icon: 'history' },
];

export function Sidebar({ view, onNavigate, issues, available = ['overview', 'data'] }: { view: ViewId; onNavigate(view: ViewId): void; issues: number; available?: ViewId[] }) {
  return <aside className="sidebar">
    <div className="brand"><span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></span><strong>LabLens</strong></div>
    <div className="sidebar-label">实验数据工作区</div>
    <nav aria-label="工作区导航">
      {navigation.map(item => <button key={item.id} className={`nav-button ${view === item.id ? 'active' : ''}`} onClick={() => onNavigate(item.id)} disabled={!available.includes(item.id)} aria-current={view === item.id ? 'page' : undefined} title={item.title}>
        <Icon name={item.icon} /><span className="nav-label">{item.title}</span>{item.id === 'data' && issues > 0 && <span className="count">{issues}</span>}
      </button>)}
    </nav>
    <div className="sidebar-bottom">
      <div className="local-note"><strong><Icon name="shield" /> 浏览器本地处理</strong><br />文件读取、检查与图表计算<br />均在当前设备中完成。</div>
      <div className="sidebar-footer"><Icon name="flask" /> 实验数据工作台<span className="version">v1.0</span></div>
    </div>
  </aside>;
}
