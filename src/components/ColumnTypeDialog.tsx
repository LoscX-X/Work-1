import { useState } from 'react';
import type { ColumnType, DataColumn } from '../lib/data-core';
import { Button, Modal } from './ui';

export function ColumnTypeDialog({ column, onSave, onClose }: { column: DataColumn; onSave(type: ColumnType): void; onClose(): void }) {
  const [type, setType] = useState<ColumnType>(column.type);
  return <Modal title={`确认字段类型 · ${column.name}`} onClose={onClose} footer={<><Button onClick={onClose}>取消</Button><Button kind="primary" onClick={() => { onSave(type); onClose(); }}>应用类型</Button></>}>
    <label className="field"><span>数据类型</span><select value={type} onChange={event => setType(event.target.value as ColumnType)}><option value="text">文本 · 保留编号与原始写法</option><option value="number">数值 · 检查数值格式与 IQR 异常值</option><option value="date">日期 · 检查日期是否有效</option></select></label>
    <p>自动识别可手动修正。编号、编码和带前导零的字段优先保留为文本，避免改变标识含义。</p>
    <div className="warning-box">更改类型会重新解释和检查该列，单元格的原始内容保持可追溯。缺失值和无法解析的值会分别标记。</div>
  </Modal>;
}
