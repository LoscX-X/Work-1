import { useEffect, useRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon } from './Icon';

type ButtonKind = 'primary' | 'secondary' | 'ghost' | 'lime' | 'danger';
type BadgeKind = 'neutral' | 'green' | 'orange' | 'red' | 'blue';

export function Button({ children, kind = 'secondary', icon, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { kind?: ButtonKind; icon?: string }) {
  return <button type="button" className={`button ${kind} ${className}`} {...props}>{icon && <Icon name={icon} />}{children}</button>;
}

export function Badge({ children, kind = 'neutral' }: { children: ReactNode; kind?: BadgeKind }) {
  return <span className={`badge ${kind}`}>{children}</span>;
}

export function Panel({ title, description, action, children, className = '' }: { title?: string; description?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`panel ${className}`}>
    {title && <div className="panel-heading"><div><h2>{title}</h2>{description && <p>{description}</p>}</div>{action && <div className="right">{action}</div>}</div>}
    {children}
  </section>;
}

export function Modal({ title, children, footer, onClose }: { title: string; children: ReactNode; footer?: ReactNode; onClose(): void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = ref.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  return <dialog ref={ref} onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === ref.current) onClose(); }}>
    <div className="dialog-header"><h2>{title}</h2><Button kind="ghost" className="icon-only" aria-label="关闭对话框" icon="close" onClick={onClose} /></div>
    <div className="dialog-body">{children}</div>
    {footer && <div className="dialog-footer">{footer}</div>}
  </dialog>;
}

export function EmptyState({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return <div className="empty-state"><Icon name="flask" /><h2>{title}</h2><p>{description}</p>{children}</div>;
}

export function Chart({ option, className = '', onReady, onRowClick }: { option: Record<string, unknown>; className?: string; onReady?(chart: ChartInstance | null): void; onRowClick?(id: number): void }) {
  const ref = useRef<HTMLDivElement>(null);
  const chart = useRef<ChartInstance | null>(null);
  const rowClick = useRef(onRowClick);
  rowClick.current = onRowClick;
  const ready = useRef(onReady);
  ready.current = onReady;
  useEffect(() => {
    if (!ref.current) return;
    const instance = echarts.init(ref.current, null, { renderer: 'canvas' });
    chart.current = instance;
    ready.current?.(instance);
    instance.on('click', event => {
      const data = event.data;
      if (data && typeof data === 'object' && 'rowId' in data && typeof data.rowId === 'number') rowClick.current?.(data.rowId);
    });
    const observer = new ResizeObserver(() => instance.resize());
    observer.observe(ref.current);
    return () => {
      observer.disconnect();
      ready.current?.(null);
      instance.dispose();
      chart.current = null;
    };
  }, []);
  useEffect(() => { chart.current?.setOption(option, { notMerge: true }); }, [option]);
  return <div ref={ref} className={className} role="img" aria-label="交互式实验数据图表" />;
}
