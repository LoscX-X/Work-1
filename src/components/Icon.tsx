const paths: Record<string, string> = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.6"/><rect x="14" y="3" width="7" height="7" rx="1.6"/><rect x="3" y="14" width="7" height="7" rx="1.6"/><rect x="14" y="14" width="7" height="7" rx="1.6"/>',
  table: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 4v16M3 15h18"/>',
  clean: '<path d="m16 3 5 5-9 9-5-5 9-9Z"/><path d="m7 12-3 3a4 4 0 0 0 5 6l3-4M3 21h13"/>',
  chart: '<path d="M4 3v17h17M8 15l4-5 4 3 5-7"/><circle cx="8" cy="15" r="1"/><circle cx="12" cy="10" r="1"/><circle cx="16" cy="13" r="1"/>',
  history: '<path d="M3 11a9 9 0 1 1 3 7M3 4v7h7M12 7v5l3 2"/>',
  upload: '<path d="M12 16V3m-4 4 4-4 4 4M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/>',
  download: '<path d="M12 3v13m-4-4 4 4 4-4M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  chevrondown: '<path d="m5 9 7 7 7-7"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
  check: '<path d="m5 12 4 4L20 5"/>',
  shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/>',
  alert: '<path d="m12 3 10 18H2L12 3Z"/><path d="M12 9v4m0 4h.01"/>',
  missing: '<rect x="4" y="4" width="16" height="16" rx="3" stroke-dasharray="3 3"/><path d="M9 12h6"/>',
  invalid: '<circle cx="12" cy="12" r="9"/><path d="M12 7v6m0 4h.01"/>',
  duplicate: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
  outlier: '<path d="M4 18h16M6 14V9m6 5v-3m6 3V8"/><circle cx="18" cy="4" r="1.5"/>',
  undo: '<path d="m8 3-5 5 5 5M3 8h11a7 7 0 0 1 0 14"/>',
  redo: '<path d="m16 3 5 5-5 5m5-5H10a7 7 0 0 0 0 14"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  flask: '<path d="M9 3h6m-5 0v6L4 19a1.4 1.4 0 0 0 1 2h14a1.4 1.4 0 0 0 1-2L14 9V3M7 14h10"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>',
};

export function Icon({ name, className = "" }: { name: string; className?: string }) {
  return (
    <svg
      className={"icon " + className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: paths[name] || paths.grid }}
    />
  );
}
