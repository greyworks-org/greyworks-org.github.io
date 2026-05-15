import test from 'node:test';
import assert from 'node:assert/strict';

import { createPublicApp } from './public-app.mjs';

async function startTestServer(options = {}) {
  const server = createPublicApp(options);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    async close() {
      await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    },
  };
}

test('GET / redirects to the recruiter twin page', async () => {
  const app = await startTestServer({ env: { UPSTREAM_API_KEY: 'proxy-key' } });

  const response = await fetch(`${app.baseUrl}/`, { redirect: 'manual' });
  assert.equal(response.status, 302);
  assert.equal(response.headers.get('location'), '/utku-bozkurt/');

  await app.close();
});

test('GET /utku-bozkurt/ serves the public recruiter page shell', async () => {
  const app = await startTestServer({ env: { UPSTREAM_API_KEY: 'proxy-key' } });

  const response = await fetch(`${app.baseUrl}/utku-bozkurt/`);
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type') || '', /text\/html/);
  assert.match(html, /Strategy & business development leader for SaaS, AdTech, and AI product growth/);
  assert.match(html, /Quick recruiter snapshot/);

  await app.close();
});

test('GET /utku-profile.jpeg serves the local profile asset', async () => {
  const app = await startTestServer({ env: { UPSTREAM_API_KEY: 'proxy-key' } });

  const response = await fetch(`${app.baseUrl}/utku-profile.jpeg`);
  const body = await response.arrayBuffer();
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type') || '', /image\/jpeg/);
  assert.ok(body.byteLength > 1000);

  await app.close();
});