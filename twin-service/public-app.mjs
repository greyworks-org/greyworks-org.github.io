import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

import { createRequestHandler, getEnv } from './server.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

// Load .env file from repo root
function loadEnvFile() {
  try {
    const envPath = path.resolve(REPO_ROOT, '.env');
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch { /* .env file optional */ }
}
loadEnvFile();

const DEFAULT_STATIC_FILES = new Map([
  ['/utku-bozkurt/', path.join(REPO_ROOT, 'utku-bozkurt', 'index.html')],
  ['/utku-profile.jpeg', path.join(REPO_ROOT, 'utku-profile.jpeg')],
]);

function contentType(filePath) {
  if (filePath.endsWith('.html')) return 'text/html; charset=utf-8';
  if (filePath.endsWith('.jpeg') || filePath.endsWith('.jpg')) return 'image/jpeg';
  if (filePath.endsWith('.png')) return 'image/png';
  if (filePath.endsWith('.svg')) return 'image/svg+xml';
  return 'application/octet-stream';
}

async function serveFile(response, filePath) {
  try {
    const body = await readFile(filePath);
    response.writeHead(200, {
      'content-type': contentType(filePath),
      'cache-control': filePath.endsWith('.html') ? 'no-store' : 'public, max-age=3600',
    });
    response.end(body);
  } catch (error) {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  }
}

export function createPublicApp(options = {}) {
  const apiHandler = createRequestHandler(options);
  const staticFiles = options.staticFiles || DEFAULT_STATIC_FILES;

  return http.createServer(async (request, response) => {
    if (request.method === 'GET' && request.url === '/') {
      response.writeHead(302, { location: '/utku-bozkurt/' });
      response.end();
      return;
    }

    if (request.method === 'GET' && request.url === '/utku-bozkurt') {
      response.writeHead(302, { location: '/utku-bozkurt/' });
      response.end();
      return;
    }

    if (request.method === 'GET' && staticFiles.has(request.url)) {
      await serveFile(response, staticFiles.get(request.url));
      return;
    }

    await apiHandler(request, response);
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const env = getEnv(process.env);
  const server = createPublicApp({ env });
  server.listen(Number(env.PORT), '0.0.0.0', () => {
    console.log(`greyworks-twin-public listening on :${env.PORT}`);
  });
}