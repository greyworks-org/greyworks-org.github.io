# Greyworks Twin runtime status — 2026-05-14

## Current live endpoints
- Stable direct runtime: `http://46.62.134.122:8788/utku-bozkurt/`
- Stable health check: `http://46.62.134.122:8788/healthz`
- Stable chat API: `http://46.62.134.122:8788/v1/digital-twin/chat`
- Temporary Cloudflare quick tunnel: `https://materials-unnecessary-newly-travelling.trycloudflare.com/utku-bozkurt/`

## Runtime shape
- Process launcher: `/srv/dobby/workspace/greyworks-twin/start_public_runtime.py`
- Watchdog: `/srv/dobby/workspace/greyworks-twin/ensure_public_runtime.py`
- Watchdog cron job: `019940527b1f` (`greyworks-twin-runtime-watchdog`, every 5 minutes, local delivery)
- Node app script: `npm run start:twin-public`
- Bound port: `8788`

## Verification completed
- `npm run test:twin-service`
- `npm run test:twin-public`
- `node --check` on extracted inline recruiter page script
- `bash twin-service/smoke-public.sh http://127.0.0.1:8788`
- `bash twin-service/smoke-public.sh https://materials-unnecessary-newly-travelling.trycloudflare.com`
- `bash twin-service/smoke-public.sh http://46.62.134.122:8788`
- Public chat prompt test for a recruiter-safe question
- Public chat refusal test for an off-topic question
- Public DOM dump and screenshot capture through headless Chromium

## What is ready
- Recruiter page serves from the same runtime as the API
- Health endpoint reports `chat_configured: true`
- Recruiter-safe chat answers work through the Dobby budget proxy
- Off-topic prompts are refused with a professional boundary message
- Runtime is reachable directly by public IP and monitored by a watchdog

## Remaining caveat
This is functional and publicly reachable, but it is not yet on an approved permanent Greyworks hostname. The quick tunnel is temporary. The direct IP endpoint is the most stable reachable handoff available from the current permissions and infrastructure state.
