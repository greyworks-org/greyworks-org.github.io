import http from 'node:http';

import { buildSystemInstruction, SCOPE_REFUSAL } from './policy-pack.mjs';

const DEFAULT_ALLOWED_ORIGIN = '*';
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';
const DEFAULT_OPENAI_BASE = 'http://127.0.0.1:8787/v1';
const DEFAULT_OPENAI_MODEL = 'xiaomi/mimo-v2.5-pro';
const DEFAULT_PORT = '8788';
const DEGRADED_MESSAGE = 'The secure chat service is temporarily unavailable. Please use LinkedIn, email, or phone for now.';
const MAX_TEXT_LENGTH = 2400;
const MAX_HISTORY_ITEMS = 12;

const OFF_TOPIC_PATTERNS = [
  /favorite\s+(movie|film|song|music|food|color|colour|book|team|sport)/i,
  /what\s+do\s+you\s+do\s+for\s+fun/i,
  /hobby|hobbies/i,
  /dating|girlfriend|boyfriend|wife|husband|sex/i,
  /religion|politics|political\s+view/i,
  /zodiac|horoscope|star\s*sign/i,
];

const ABUSIVE_PATTERNS = [
  /kill yourself/i,
  /hate you/i,
  /stupid|idiot|moron/i,
  /racial slur/i,
];

function normalizeBaseUrl(value, fallback = '') {
  return String(value || fallback).trim().replace(/\/$/, '');
}

export function getEnv(env = process.env) {
  const upstreamApiBase = normalizeBaseUrl(env.UPSTREAM_API_BASE || env.OPENAI_BASE_URL, DEFAULT_OPENAI_BASE);
  const upstreamModel = env.UPSTREAM_MODEL || env.OPENAI_MODEL || env.DOBBY_FALLBACK_MODEL || DEFAULT_OPENAI_MODEL;
  const provider = env.AI_PROVIDER || (env.GEMINI_API_KEY ? 'gemini' : 'openai-compatible');

  return {
    AI_PROVIDER: provider,
    GEMINI_API_KEY: env.GEMINI_API_KEY || '',
    GEMINI_MODEL: env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
    UPSTREAM_API_BASE: upstreamApiBase,
    UPSTREAM_API_KEY: env.UPSTREAM_API_KEY || env.OPENAI_API_KEY || env.DOBBY_BUDGET_PROXY_KEY || '',
    UPSTREAM_MODEL: upstreamModel,
    ALLOW_ORIGIN: env.ALLOW_ORIGIN || DEFAULT_ALLOWED_ORIGIN,
    PORT: env.PORT || DEFAULT_PORT,
  };
}

function json(response, status, body) {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  });
  response.end(JSON.stringify(body));
}

function allowedOrigin(requestOrigin, env) {
  const raw = String(env.ALLOW_ORIGIN || '').trim();
  if (!raw) return '';
  const origins = raw.split(',').map((item) => item.trim()).filter(Boolean);
  if (!origins.length) return '';
  if (origins.includes('*')) {
    return requestOrigin || '*';
  }
  if (!requestOrigin) {
    return origins[0];
  }
  return origins.includes(requestOrigin) ? requestOrigin : '';
}

function applyCors(request, response, env) {
  const origin = allowedOrigin(request.headers.origin, env);
  if (origin) {
    response.setHeader('access-control-allow-origin', origin);
    response.setHeader('vary', 'Origin');
  }
  response.setHeader('access-control-allow-methods', 'POST, OPTIONS');
  response.setHeader('access-control-allow-headers', 'content-type, authorization');
  response.setHeader('access-control-max-age', '86400');
}

function parseJsonBody(request) {
  return new Promise((resolve, reject) => {
    let raw = '';
    request.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 100_000) {
        reject(new Error('Body too large'));
        request.destroy();
      }
    });
    request.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    request.on('error', reject);
  });
}

function normalizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter((item) => item && (item.role === 'user' || item.role === 'assistant') && typeof item.text === 'string')
    .slice(-MAX_HISTORY_ITEMS)
    .map((item) => ({
      role: item.role,
      text: item.text.trim().slice(0, MAX_TEXT_LENGTH),
    }))
    .filter((item) => item.text.length > 0);
}

function shouldRefusePrompt(text) {
  return [...OFF_TOPIC_PATTERNS, ...ABUSIVE_PATTERNS].some((pattern) => pattern.test(text));
}

function buildGeminiPayload({ message, history }) {
  const contents = history.map((item) => ({
    role: item.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: item.text }],
  }));

  if (!history.length || history[history.length - 1].role !== 'user' || history[history.length - 1].text !== message) {
    contents.push({ role: 'user', parts: [{ text: message }] });
  }

  return {
    system_instruction: {
      parts: [{ text: buildSystemInstruction() }],
    },
    contents,
    generationConfig: {
      temperature: 0.35,
      topP: 0.9,
      maxOutputTokens: 320,
    },
  };
}

function buildOpenAiPayload({ env, message, history }) {
  return {
    model: env.UPSTREAM_MODEL,
    messages: [
      { role: 'system', content: buildSystemInstruction() },
      ...history.map((item) => ({ role: item.role, content: item.text })),
      { role: 'user', content: message },
    ],
    temperature: 0.35,
    top_p: 0.9,
    max_tokens: 320,
  };
}

async function callGemini({ env, message, history, fetchImpl = fetch }) {
  const payload = buildGeminiPayload({ message, history });
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(env.GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`;
  const response = await fetchImpl(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const reason = data?.error?.message || `Gemini ${response.status}`;
    throw new Error(reason);
  }

  const answer = data?.candidates?.[0]?.content?.parts?.map((part) => part?.text || '').join('').trim();
  if (!answer) {
    throw new Error('Gemini returned no answer');
  }

  return { answer, raw: data };
}

async function callOpenAiCompatible({ env, message, history, fetchImpl = fetch }) {
  const payload = buildOpenAiPayload({ env, message, history });
  const endpoint = `${env.UPSTREAM_API_BASE}/chat/completions`;
  const response = await fetchImpl(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${env.UPSTREAM_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const reason = data?.error?.message || `Upstream ${response.status}`;
    throw new Error(reason);
  }

  const answer = data?.choices?.[0]?.message?.content?.trim();
  if (!answer) {
    throw new Error('Upstream returned no answer');
  }

  return { answer, raw: data };
}

function isChatConfigured(env) {
  if (env.AI_PROVIDER === 'gemini') {
    return Boolean(env.GEMINI_API_KEY);
  }
  return Boolean(env.UPSTREAM_API_BASE && env.UPSTREAM_API_KEY && env.UPSTREAM_MODEL);
}

function defaultGenerate({ env, fetchImpl }) {
  if (env.AI_PROVIDER === 'gemini') {
    return (request) => callGemini({ ...request, env, fetchImpl });
  }
  return (request) => callOpenAiCompatible({ ...request, env, fetchImpl });
}

async function handleChat({ request, response, env, llmGenerate }) {
  if (!isChatConfigured(env)) {
    json(response, 503, { message: DEGRADED_MESSAGE, voice_available: false });
    return;
  }

  let body;
  try {
    body = await parseJsonBody(request);
  } catch (error) {
    json(response, 400, { message: error.message, voice_available: false });
    return;
  }

  const text = typeof body.text === 'string' ? body.text.trim().slice(0, MAX_TEXT_LENGTH) : '';
  if (!text) {
    json(response, 400, { message: 'text is required', voice_available: false });
    return;
  }

  const history = normalizeHistory(body.history);

  if (shouldRefusePrompt(text)) {
    json(response, 200, { answer: SCOPE_REFUSAL, voice_available: false });
    return;
  }

  try {
    const result = await llmGenerate({ message: text, history, env });
    json(response, 200, { answer: result.answer, voice_available: false });
  } catch (error) {
    console.error('digital-twin-chat error:', error.message);
    json(response, 503, { message: DEGRADED_MESSAGE, voice_available: false });
  }
}

export function createRequestHandler({ env: rawEnv = process.env, llmGenerate, geminiGenerate, fetchImpl } = {}) {
  const env = getEnv(rawEnv);
  const generate = llmGenerate || geminiGenerate || defaultGenerate({ env, fetchImpl });

  return async function requestHandler(request, response) {
    applyCors(request, response, env);

    if (request.url === '/healthz' && request.method === 'GET') {
      json(response, 200, {
        ok: true,
        service: 'digital-twin-chat',
        provider: env.AI_PROVIDER,
        model: env.AI_PROVIDER === 'gemini' ? env.GEMINI_MODEL : env.UPSTREAM_MODEL,
        chat_configured: isChatConfigured(env),
        gemini_configured: env.AI_PROVIDER === 'gemini' ? isChatConfigured(env) : false,
      });
      return;
    }

    if (request.url === '/v1/digital-twin/chat' && request.method === 'OPTIONS') {
      response.writeHead(204);
      response.end();
      return;
    }

    if (request.url === '/v1/digital-twin/chat' && request.method === 'POST') {
      await handleChat({ request, response, env, llmGenerate: generate });
      return;
    }

    if (request.url === '/v1/digital-twin/chat') {
      json(response, 405, { message: 'Method not allowed', voice_available: false });
      return;
    }

    json(response, 404, { message: 'Not found' });
  };
}

export function createServer(options = {}) {
  return http.createServer(createRequestHandler(options));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const env = getEnv(process.env);
  const server = createServer({ env });
  server.listen(Number(env.PORT), '0.0.0.0', () => {
    console.log(`digital-twin-chat listening on :${env.PORT}`);
  });
}