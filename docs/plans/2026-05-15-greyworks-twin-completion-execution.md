# Greyworks Twin completion and execution plan

## Goal
Close the gap between the current functional recruiter twin and a production-ready Greyworks handoff.

## Repo evidence reviewed
- Recent commits show the twin page, backend wiring, security, and public hostname changes were already attempted.
- `twin-service/server.mjs` supports Gemini and OpenAI-compatible upstreams with `/healthz` and `POST /v1/digital-twin/chat`.
- `twin-service/public-app.mjs` serves `/utku-bozkurt/` and local assets from the same origin as the API.
- `twin-service/README.md` documents a public runtime on port `8788`.
- `docs/plans/2026-05-14-greyworks-twin-runtime-status.md` confirms the twin is functional on direct IP and a temporary Cloudflare tunnel.
- Current working tree still has uncommitted twin assets: `package.json`, `twin-service/`, `utku-bozkurt/index.html`, `smoke-check.sh`, and `docs/`.

## Current state
The twin is functionally complete for recruiter-safe text chat and public page serving. The remaining production gap is operational, not product-level: the current public reachability depends on direct IP and a temporary tunnel, while the approved permanent Greyworks hostname/runtime path is still unresolved.

## Assumptions
1. The current uncommitted twin files in this repo are the intended source of truth for the next deploy candidate.
2. The direct-IP runtime on port `8788` is still available or can be recreated from repo state.
3. Permanent completion requires an approved Greyworks hostname or equivalent approved proxy target, not another temporary tunnel.

## Phases

### Phase 1 — Lock the deployable repo state
Scope:
- Review the current uncommitted twin files against the existing runtime docs.
- Commit only the files required for the recruiter page, twin runtime, tests, and smoke checks.
- Leave unrelated site work untouched.

Acceptance criteria:
- Twin runtime files are committed on a task branch.
- `npm run test:twin-service` passes.
- `npm run test:twin-public` passes.
- `bash ./smoke-check.sh <local-base-url>` passes against a local candidate.

Effort:
- 0.5 day

Jarvis needs:
- Current branch access in `/srv/dobby/repos/greyworks-redesign`
- Permission to commit the existing twin-service working tree as the deployment candidate

### Phase 2 — Promote to an approved public Greyworks endpoint
Scope:
- Replace temporary tunnel dependency with an approved permanent Greyworks hostname or approved proxy target.
- Point the public recruiter page and chat API at the same approved origin.
- Confirm restart and watchdog behavior for the chosen runtime.

Acceptance criteria:
- A permanent approved public URL serves `/utku-bozkurt/`.
- `GET /healthz` returns `ok: true` and `chat_configured: true` on the approved endpoint.
- `POST /v1/digital-twin/chat` returns recruiter-safe answers on the approved endpoint.
- No browser-side secret exposure is introduced.

Effort:
- 0.5 to 1 day after hostname/proxy approval exists

Jarvis needs:
- Approved hostname or proxy target
- DNS or reverse-proxy access
- Runtime secrets for the upstream model path
- Access to the runtime watchdog or service launcher already documented in the repo notes

### Phase 3 — Final public verification and handoff
Scope:
- Re-run smoke checks against the approved endpoint.
- Verify recruiter journey, About tab content, and chat/refusal behavior.
- Capture the final public URL and rollback note.

Acceptance criteria:
- Public smoke checks pass on the approved endpoint.
- Recruiter-safe prompt returns a useful answer.
- Off-topic prompt returns the expected refusal.
- Final handoff note includes the canonical URL, health URL, and operator rollback path.

Effort:
- 0.25 day

Jarvis needs:
- Approved public endpoint from Phase 2
- Browser and shell access for verification

## Risks and mitigations
1. Uncommitted repo state drifts from the runtime already documented.
   - Impact: deploy candidate becomes unreproducible.
   - Mitigation: Phase 1 commits the exact twin files before any further promotion.
2. Permanent hostname approval stays blocked.
   - Impact: twin remains functional but not fully complete for Greyworks handoff.
   - Mitigation: keep the direct-IP runtime as fallback while routing approval through the existing blocked Mission Control task.
3. Runtime secrets or proxy credentials differ from the README assumptions.
   - Impact: approved endpoint goes live with chat degraded.
   - Mitigation: verify `/healthz` and a real chat prompt immediately after deployment before public signoff.

## Mission Control mapping
- Phase 1: new Jarvis task created from this plan.
- Phase 2: covered by existing blocked task `20260508T143557Z-deploy-greyworks-twin-backend-behind-an-approved-public-runtime-or-proxy-target`.
- Phase 3: new Jarvis task created from this plan because the earlier verification run closed with the approved-hostname gap still unresolved.

## Definition of complete
Greyworks Twin is complete when the committed repo state is deployable, the recruiter page and chat API run on one approved permanent Greyworks endpoint, and the final public verification passes end to end.
