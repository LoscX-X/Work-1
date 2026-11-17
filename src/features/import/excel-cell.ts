import { isIdentifierName } from '../../lib/data-core.ts';

function excelValue(value: ExcelCell['value'], address: string): string {
  if (value == null) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') {
    if (value.richText) return value.richText.map((part) => part.text).join('');
    if ('formula' in value || 'sharedFormula' in value) {
      if (value.result === undefined) {
        throw new Error(`单元格 ${address} 的公式没有缓存结果，请先在 Excel 中重新计算并保存。`);
      }
      return excelValue(value.result as ExcelCell['value'], address);
    }
    if (value.error) return value.error;
    if (value.text != null) return value.text;
  }
  return String(value);
}

export function excelCell(cell: ExcelCell, header = ''): string {
  const value = excelValue(cell.value, cell.address);
  // Identifier fields with Excel's simple zero mask retain their displayed zeros.
  // Measurement fields use the underlying value, preserving numeric precision.
  if (isIdentifierName(header) && /^0{2,}$/.test(cell.numFmt ?? '') && /^\d+$/.test(value)) {
    return value.padStart(cell.numFmt!.length, '0');
  }
  return value;
}
