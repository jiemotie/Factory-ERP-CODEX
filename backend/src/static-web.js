import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { extname, join, normalize } from 'node:path';

const webRoot = fileURLToPath(new URL('../../web/', import.meta.url));

const staticRoutes = new Map([
  ['/', 'index.html'],
  ['/index.html', 'index.html'],
  ['/web', 'index.html'],
  ['/web/', 'index.html'],
  ['/web/index.html', 'index.html'],
  ['/web/app.js', 'src/app.js'],
  ['/web/styles.css', 'src/styles.css']
]);

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8'
};

function resolveWebFile(pathname) {
  const relativePath = staticRoutes.get(pathname);
  if (!relativePath) {
    return undefined;
  }

  const normalized = normalize(relativePath);
  if (normalized.startsWith('..')) {
    return undefined;
  }
  return join(webRoot, normalized);
}

export async function serveWebAsset(request, response, pathname) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return false;
  }

  const filePath = resolveWebFile(pathname);
  if (!filePath) {
    return false;
  }

  try {
    const content = await readFile(filePath);
    response.setHeader('Content-Type', contentTypes[extname(filePath)] ?? 'application/octet-stream');
    response.setHeader('Cache-Control', 'no-store');
    response.writeHead(200);
    response.end(request.method === 'HEAD' ? undefined : content);
    return true;
  } catch {
    return false;
  }
}
