export function numberText(value: number | null | undefined, digits = 3): string {
  return value == null || !Number.isFinite(value) ? '—' : value.toLocaleString('zh-CN', { maximumFractionDigits: digits });
}

export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!);
}

export function downloadBlob(content: string | Blob, name: string, type = 'text/plain;charset=utf-8'): void {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export function filenameStem(filename: string): string {
  return filename.replace(/\.[^.]+$/, '').replace(/[<>:"/\\|?*]/g, '_');
}
