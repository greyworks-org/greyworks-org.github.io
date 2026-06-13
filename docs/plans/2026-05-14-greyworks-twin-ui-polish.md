# Greyworks Twin UI Polish Plan

> **For Hermes:** Use subagent-driven-development skill if further iterations are needed.

**Goal:** Make the recruiter-facing Greyworks Twin page feel like a credible candidate landing page first and an AI chat surface second.

**Architecture:** Keep the single-file React page in `utku-bozkurt/index.html`, but reorganize the surface around recruiter scanability, direct contact, and graceful fallback when chat is offline. Reuse the same-origin chat contract and existing contact/profile data while improving the information hierarchy.

**Tech Stack:** Static HTML with inline React, same-origin Node public app, existing smoke tests and Node tests.

---

## Task 1: Reframe the page header and metadata for recruiter-first positioning

**Objective:** Make the first impression read like a candidate profile, not a novelty twin demo.

**Files:**
- Modify: `utku-bozkurt/index.html`
- Test: `twin-service/public-app.test.mjs`

**Steps:**
1. Update `<title>` and meta description to emphasize Utku as a strategy / BD leader.
2. Add shared recruiter identity constants near the top of the inline script.
3. Replace the chat empty-state hero copy with recruiter-first framing plus role-fit language.
4. Add a compact recruiter summary under the avatar/status area.
5. Update public page test copy assertions if needed.

## Task 2: Add persistent recruiter CTAs and a deliberate offline fallback

**Objective:** Remove dead-end behavior when chat is offline and make direct outreach obvious.

**Files:**
- Modify: `utku-bozkurt/index.html`
- Modify: `smoke-check.sh`

**Steps:**
1. Add shared CTA data for LinkedIn, email, phone, and CV.
2. Render a CTA strip near the top of both Chat and About tabs.
3. When chat is offline, show a fallback panel with direct outreach actions instead of only a disabled composer.
4. Keep the composer visible only when chat is ready.
5. Update smoke assertions to match the new recruiter-first copy.

## Task 3: Turn the About tab into a recruiter brief

**Objective:** Surface the highest-value professional facts in a fast-scan layout.

**Files:**
- Modify: `utku-bozkurt/index.html`
- Test: `twin-service/public-app.test.mjs`

**Steps:**
1. Change the About heading/copy to “Recruiter brief” language.
2. Add a quick-scan snapshot section with role, focus, location, work authorization, founder history, and fundraising/growth signals.
3. Add a “Best-fit roles” / “What recruiters usually ask” section.
4. Keep the career timeline and proof/recognition sections, but subordinate them under the summary.
5. Add a small verified-links / proof section.

## Task 4: Verify and tighten content consistency

**Objective:** Ensure the source, tests, and smoke checks reflect the new positioning.

**Files:**
- Modify: `twin-service/public-app.test.mjs`
- Modify: `smoke-check.sh`
- Verify: `utku-bozkurt/index.html`

**Steps:**
1. Run `node --check` on extracted inline JS.
2. Run `npm run test:twin-public`.
3. Run `npm run test:twin-service`.
4. Run `bash ./smoke-check.sh http://127.0.0.1:4173` against a local static server.
5. Review rendered copy via headless Chromium DOM dump if assertions pass.

## Acceptance Criteria

- Above-the-fold content immediately explains who Utku is, what roles he fits, and how to contact him.
- Recruiters can reach LinkedIn, email, phone, and CV from either tab without hunting.
- Offline chat state looks intentionally designed, not broken.
- About tab reads as a recruiter brief with fast-scan facts before narrative detail.
- Existing public-app and server tests pass, plus updated smoke checks pass.
