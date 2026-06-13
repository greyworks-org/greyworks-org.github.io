# Greyworks recruiter twin service

Minimal recruiter-twin service with:

- a public recruiter page at `/utku-bozkurt/`
- a text chat API at `POST /v1/digital-twin/chat`
- local asset serving for the recruiter page shell

## Scope

- LLM access stays server-side only.
- Supports either Gemini or an OpenAI-compatible upstream.
- Default local runtime is the Dobby budget proxy on `http://127.0.0.1:8787/v1`.
- Text only.
- `voice_available` is always `false`.
- Off-topic, personal, or abusive prompts are declined.
- If Gemini is unavailable, the service returns a degraded `503` with a contact-first message.

## Environment

- `AI_PROVIDER` optional: `openai-compatible` (default) or `gemini`
- `UPSTREAM_API_BASE` optional, defaults to `http://127.0.0.1:8787/v1`
- `UPSTREAM_API_KEY` required for `openai-compatible`
- `UPSTREAM_MODEL` optional, defaults to `xiaomi/mimo-v2.5-pro`
- `GEMINI_API_KEY` required only for `gemini`
- `GEMINI_MODEL` optional, defaults to `gemini-2.5-flash`
- `ALLOW_ORIGIN` optional, defaults to `*`
- `PORT` optional, defaults to `8788`

## Run locally

```bash
npm run start:twin-service
```

Run the full public app shell + API on one origin:

```bash
npm run start:twin-public
```

## Test

```bash
npm run test:twin-service
npm run test:twin-public
```

## Contract

Request:

```json
{
  "text": "What do you do at WASK?",
  "history": [
    { "role": "user", "text": "Hi" },
    { "role": "assistant", "text": "Hello" }
  ]
}
```

Healthy response:

```json
{
  "answer": "...",
  "voice_available": false
}
```

Degraded response:

```json
{
  "message": "The secure chat service is temporarily unavailable. Please use LinkedIn, email, or phone for now.",
  "voice_available": false
}
```

## Endpoints

- `POST /v1/digital-twin/chat`
- `OPTIONS /v1/digital-twin/chat`
- `GET /healthz`
- `GET /utku-bozkurt/`
- `GET /utku-profile.jpeg`

## Recommended VPS launch

If you want to run against the local budget proxy without exposing secrets in git, load the proxy key from `/srv/dobby/dobby-ops/.env` into the shell and start:

```bash
python3 - <<'PY'
from pathlib import Path
import os, subprocess

vals = {}
for line in Path('/srv/dobby/dobby-ops/.env').read_text().splitlines():
    line = line.strip()
    if line and not line.startswith('#') and '=' in line:
        k, v = line.split('=', 1)
        vals[k.strip()] = v.strip()

env = dict(os.environ)
env.update({
    'AI_PROVIDER': 'openai-compatible',
    'UPSTREAM_API_BASE': 'http://127.0.0.1:8787/v1',
    'UPSTREAM_API_KEY': vals['DOBBY_BUDGET_PROXY_KEY'],
    'UPSTREAM_MODEL': 'xiaomi/mimo-v2.5-pro',
    'ALLOW_ORIGIN': '*',
    'PORT': '8788',
})

subprocess.run(['npm', 'run', 'start:twin-public'], env=env, check=True)
PY
```
