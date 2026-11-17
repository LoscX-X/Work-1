export function numberText(value: number | null | undefined, digits = 3): string {
  if (value == null || !Number.isFinite(value)) return '—';
  if (Math.abs(value) >= 1e7 || (value !== 0 && Math.abs(value) < 1e-4))
    return value.toExponential(Math.min(5, digits));
  return value.toLocaleString('zh-CN', { maximumFractionDigits: digits });
}

export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!,
  );
}

export function downloadBlob(
  content: string | Blob,
  name: string,
  type = 'text/plain;charset=utf-8',
): void {
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

export function downloadDataURL(url: string, name: string): void {
  const [header, payload] = url.split(',');
  const type = /^data:([^;]+);base64$/.exec(header)?.[1];
  if (!type || !payload) throw new Error('图像数据无效，请重新生成图表。');
  const bytes = Uint8Array.from(atob(payload), (character) => character.charCodeAt(0));
  downloadBlob(new Blob([bytes], { type }), name, type);
}
