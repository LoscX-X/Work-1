import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { extname, resolve, sep } from 'node:path';

const root = resolve(fileURLToPath(new URL('./dist/', import.meta.url)));
const port = Number(process.env.PORT || 4173);
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.tsv': 'text/tab-separated-values; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

createServer((request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  } catch {
    response.writeHead(400).end('Invalid URL');
    return;
  }
  const target = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
  if (!target.startsWith(root + sep) || !existsSync(target) || !statSync(target).isFile()) {
    response.writeHead(404).end('Not found');
    return;
  }
  response.writeHead(200, {
    'Content-Type': contentTypes[extname(target)] || 'application/octet-stream',
    'Cache-Control': 'no-cache',
    'X-Content-Type-Options': 'nosniff',
  });
  createReadStream(target).pipe(response);
}).listen(port, '127.0.0.1', () => {
  console.log(`LabLens is running at http://127.0.0.1:${port}`);
});
