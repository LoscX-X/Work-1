export type DataVersion = 'current' | 'original';

export function DataVersionTabs({
  value,
  onChange,
}: {
  value: DataVersion;
  onChange(value: DataVersion): void;
}) {
  return (
    <div className="segments" aria-label="数据版本">
      <button className={value === 'current' ? 'active' : ''} onClick={() => onChange('current')}>
        当前结果
      </button>
      <button className={value === 'original' ? 'active' : ''} onClick={() => onChange('original')}>
        原始数据
      </button>
    </div>
  );
}
