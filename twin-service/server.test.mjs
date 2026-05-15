import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from './server.mjs';

async function startTestServer(options = {}) {
  const server = createServer(options);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  return {
    baseUrl,
    async close() {
      await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    },
  };
}

test('POST /v1/digital-twin/chat returns Gemini reply with voice disabled', async () => {
  let geminiRequest = null;
  const app = await startTestServer({
    env: { GEMINI_API_KEY: 'test-key', ALLOW_ORIGIN: 'https://greyworks.org' },
    geminiGenerate: async (request) => {
      geminiRequest = request;
      return { answer: 'I lead strategy and BD at WASK and can walk you through the role.', model: 'gemini-test' };
    },
  });

  const response = await fetch(`${app.baseUrl}/v1/digital-twin/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://greyworks.org' },
    body: JSON.stringify({
      text: 'What do you do at WASK?',
      history: [{ role: 'user', text: 'Hi' }],
    }),
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('access-control-allow-origin'), 'https://greyworks.org');
  assert.equal(response.headers.get('content-type'), 'application/json; charset=utf-8');
  assert.deepEqual(await response.json(), {
    answer: 'I lead strategy and BD at WASK and can walk you through the role.',
    voice_available: false,
  });
  assert.ok(geminiRequest);
  assert.equal(geminiRequest.message, 'What do you do at WASK?');
  assert.equal(geminiRequest.history.length, 1);

  await app.close();
});

test('POST /v1/digital-twin/chat declines off-topic prompts without calling Gemini', async () => {
  let callCount = 0;
  const app = await startTestServer({
    env: { GEMINI_API_KEY: 'test-key', ALLOW_ORIGIN: 'https://greyworks.org' },
    geminiGenerate: async () => {
      callCount += 1;
      return { answer: 'should not happen' };
    },
  });

  const response = await fetch(`${app.baseUrl}/v1/digital-twin/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://greyworks.org' },
    body: JSON.stringify({
      text: 'What is your favorite movie?',
      history: [],
    }),
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    answer: 'I keep this twin focused on Utku’s professional background, leadership work, and recruiter-relevant topics. If you want to explore fit, ask about experience, strategy, growth, fundraising, partnerships, or product work.',
    voice_available: false,
  });
  assert.equal(callCount, 0);

  await app.close();
});

test('POST /v1/digital-twin/chat returns degraded 503 when Gemini is unavailable', async () => {
  const app = await startTestServer({
    env: { ALLOW_ORIGIN: 'https://greyworks.org' },
  });

  const response = await fetch(`${app.baseUrl}/v1/digital-twin/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://greyworks.org' },
    body: JSON.stringify({
      text: 'Tell me about your background.',
      history: [],
    }),
  });

  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    message: 'The secure chat service is temporarily unavailable. Please use LinkedIn, email, or phone for now.',
    voice_available: false,
  });

  await app.close();
});

test('OPTIONS /v1/digital-twin/chat responds with CORS headers', async () => {
  const app = await startTestServer({
    env: { GEMINI_API_KEY: 'test-key', ALLOW_ORIGIN: 'https://greyworks.org' },
  });

  const response = await fetch(`${app.baseUrl}/v1/digital-twin/chat`, {
    method: 'OPTIONS',
    headers: {
      origin: 'https://greyworks.org',
      'access-control-request-method': 'POST',
    },
  });

  assert.equal(response.status, 204);
  assert.equal(response.headers.get('access-control-allow-origin'), 'https://greyworks.org');
  assert.match(response.headers.get('access-control-allow-methods') || '', /POST/);

  await app.close();
});
