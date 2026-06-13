# Greyworks Twin Completion Plan

> **For Hermes:** Use subagent-driven-development skill if further iterations are needed.

**Goal:** Ship a publicly usable recruiter twin with a working page, server-side chat, and verified end-to-end behavior.

**Architecture:** Serve the recruiter page and chat API from one Node app so the browser uses a same-origin `/v1/digital-twin/chat` call. Use the local Dobby budget proxy as the default upstream model path so the service is functional now without depending on a separate Gemini key.

**Tech Stack:** Static HTML/React page, Node HTTP server, Dobby budget proxy (`http://127.0.0.1:8787/v1`), Cloudflare quick tunnel for public reachability.

---

## Execution Tasks

1. Convert the twin backend from Gemini-only to provider-agnostic server-side chat.
2. Add a public app wrapper that serves `/utku-bozkurt/` and local assets on the same origin as the API.
3. Patch the recruiter page so health checks accept generic chat readiness and localize the profile asset.
4. Add tests for the public app shell and rerun the existing API tests.
5. Launch the public app against the budget proxy on port `8788`.
6. Expose the app with a public Cloudflare quick tunnel.
7. Run local smoke checks and public browser verification before handing off.

## Acceptance Criteria

- `/healthz` reports `chat_configured: true`.
- `POST /v1/digital-twin/chat` returns recruiter-safe answers through the upstream model path.
- `/utku-bozkurt/` loads without broken local assets.
- Public URL supports recruiter-page load, about tab content, and working chat replies.
- Smoke tests pass with no obvious broken UI elements or dead routes.
