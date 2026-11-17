import { createDataset } from './data-core';
import type { Dataset, DatasetMetadata } from './data-core';
import { excelCell } from '../features/import/excel-cell';

export interface ImportedFile {
  sheets: { id: number; name: string; rowCount: number }[];
  select(sheetId?: number): Dataset;
}

export async function readFile(file: File): Promise<ImportedFile> {
  const bytes = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const hash = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
  const metadata: DatasetMetadata = {
    filename: file.name,
    bytes: file.size,
    sha256: hash,
    importedAt: new Date().toISOString(),
  };
  if (/\.xlsx$/i.test(file.name)) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(bytes);
    const sheets = workbook.worksheets.filter((sheet) => sheet.rowCount > 0);
    if (!sheets.length) throw new Error('Excel 文件中没有包含数据的工作表。');
    return {
      sheets: sheets.map((sheet) => ({ id: sheet.id, name: sheet.name, rowCount: sheet.rowCount })),
      select: (sheetId = sheets[0].id) => {
        const sheet = workbook.getWorksheet(sheetId);
        if (!sheet) throw new Error('工作表不存在。');
        const columnCount = Math.max(sheet.getRow(1).cellCount, sheet.columnCount);
        const headers = Array.from({ length: columnCount }, (_, index) =>
          excelCell(sheet.getRow(1).getCell(index + 1)),
        );
        const rows: string[][] = [];
        for (let row = 2; row <= sheet.rowCount; row += 1) {
          rows.push(
            Array.from({ length: columnCount }, (_, index) =>
              excelCell(sheet.getRow(row).getCell(index + 1), headers[index]),
            ),
          );
        }
        return createDataset(headers, rows, { ...metadata, sheet: sheet.name, format: 'xlsx' });
      },
    };
  }
  if (!/\.(csv|tsv)$/i.test(file.name)) throw new Error('请选择 CSV、TSV 或 XLSX 文件。');
  let text, encoding;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    encoding = 'UTF-8';
  } catch {
    text = new TextDecoder('gb18030', { fatal: true }).decode(bytes);
    encoding = 'GB18030';
  }
  const parsed = Papa.parse(text.replace(/^\uFEFF/, ''), {
    delimiter: /\.tsv$/i.test(file.name) ? '\t' : '',
    skipEmptyLines: 'greedy',
    dynamicTyping: false,
  });
  const errors = parsed.errors.filter((error) => error.code !== 'UndetectableDelimiter');
  if (errors.length) throw new Error(`文件解析失败：${errors[0].message}。请检查引号和分隔符。`);
  if (!parsed.data.length) throw new Error('文件中没有可用数据。');
  const dataset = createDataset(parsed.data[0], parsed.data.slice(1), {
    ...metadata,
    encoding,
    delimiter: parsed.meta.delimiter,
    format: 'csv',
  });
  return { sheets: [], select: () => dataset };
}
