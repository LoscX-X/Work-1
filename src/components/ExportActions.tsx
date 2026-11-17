import { Button } from './ui';

export function ExportActions({
  exporting,
  recipeBusy,
  onCsv,
  onHtml,
  onAudit,
  onRecipe,
  onImportRecipe,
}: {
  exporting: boolean;
  recipeBusy: boolean;
  onCsv(): void;
  onHtml(): void;
  onAudit(): void;
  onRecipe(): void;
  onImportRecipe(): void;
}) {
  return (
    <div className="export-buttons">
      <Button icon="download" kind="primary" onClick={onCsv}>
        当前结果 CSV
      </Button>
      <Button icon="file" onClick={onHtml} disabled={exporting}>
        {exporting ? '正在生成图表与报告…' : '当前结果报告 HTML'}
      </Button>
      <Button icon="history" onClick={onAudit}>
        完整处理记录 JSON
      </Button>
      <Button icon="grid" onClick={onRecipe}>
        清洗配置 JSON
      </Button>
      <Button icon="upload" onClick={onImportRecipe} disabled={recipeBusy}>
        {recipeBusy ? '正在校验回放…' : '导入配置并回放'}
      </Button>
    </div>
  );
}
