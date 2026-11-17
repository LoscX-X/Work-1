interface ExcelCellValue {
  richText?: { text: string }[];
  formula?: string;
  sharedFormula?: string;
  result?: unknown;
  error?: string;
  text?: string;
}

interface ExcelCell {
  address: string;
  value: string | number | boolean | Date | ExcelCellValue | null;
}

interface ExcelRow {
  cellCount: number;
  getCell(index: number): ExcelCell;
}

interface ExcelWorksheet {
  id: number;
  name: string;
  rowCount: number;
  columnCount: number;
  getRow(index: number): ExcelRow;
}

interface ExcelWorkbook {
  worksheets: ExcelWorksheet[];
  xlsx: { load(bytes: ArrayBuffer): Promise<unknown> };
  getWorksheet(id: number): ExcelWorksheet | undefined;
}

declare const ExcelJS: { Workbook: new () => ExcelWorkbook };

declare const Papa: {
  parse(text: string, options: { delimiter: string; skipEmptyLines: string; dynamicTyping: boolean }): {
    data: string[][];
    errors: { code: string; message: string; row?: number }[];
    meta: { delimiter: string };
  };
};

interface ChartInstance {
  setOption(option: Record<string, unknown>, options?: { notMerge?: boolean }): void;
  resize(): void;
  dispose(): void;
  getDataURL(options?: { type?: string; pixelRatio?: number; backgroundColor?: string }): string;
  on(name: string, callback: (event: { data?: unknown }) => void): void;
  off(name: string): void;
}

declare const echarts: {
  init(element: HTMLElement, theme?: string | null, options?: { renderer?: string }): ChartInstance;
};
