# Plan.md

> Entry point for autonomous implementation. Give Codex this file and the other four files in this folder, then ask it to implement CM-2.0 in the authorized workspace. The user's confirmed “CVA” interpretation is reliable Codex execution plus browser verification. Do not treat this document as proof of deployment or unrestricted connector access.

## Shared contract — CM-2.0

**Target:** CreatorMatch, one end-to-end AI creator marketplace built in 15 hours by an experienced engineer using Codex. **Research date:** 13 October 2026. This is a proposed implementation contract, not a built product or production certification.

**One app / one identity / one database:** Next.js 15 App Router, Node 22, React, TypeScript, Tailwind 4, accessible Radix/CVA primitives, Zod, Supabase Auth/Postgres/private Storage/one finalizer Edge Function, GitHub, Vitest and Playwright. Resolve current security-patched compatible versions and pin lockfiles.

**Reuse:** a small original application with selected MIT components/patterns from JobHorizons, selected domain ideas from Freelancezero, and a rewritten CreatorBrief AI brief module. Do not merge their whole backends, auth systems, schemas or package manifests. PromptHub and Collabry remain reference-only unless a usable license is subsequently established.

**Four USPs:** U1 AI Production Passport (Workflow Proofcards); U2 Explainable Brief Fit; U3 Rights Fit Receipts; U4 Executable Brief Copilot. Ranking weights: outcomes 35, style 20, workflow 15, format 15, availability 5, evidence completeness 10; normalized over applicable dimensions.

**Integrations:** Supabase and GitHub are core. Vercel Hobby hosts only if actual use meets personal/non-commercial terms; otherwise AWS Amplify under verified eligible credits, or local hosting. Optional AWS CPU inference downloads pinned Qwen2.5-0.5B-Instruct GGUF from Hugging Face. No Instagram, YouTube, TikTok, social scraping, follower analytics, external posting, paid generation API, payments, subscriptions or purchased domain.

**AI:** immediate deterministic draft; optional outbound-only AWS worker claims minimized Supabase jobs. One inference at a time, 256 output tokens, 15-second inference budget, 20-second total deadline, strict schema validation and no automatic overwrite. Core discovery never calls a model.

**Trust/rights:** claim-specific creator_declared / evidence_attached / platform_checked / independently_verified. Rights results: compatible_declared / needs_review / blocked. Technical metadata, a hash, OAuth login and a model assessment do not prove authorship, legal identity or licensing.

**Security:** RLS on every exposed table; ownership/participant guards, private buckets, signed URLs, protected system columns, strict uploads and transactional transitions. No Supabase service key in browser, Next.js host or AWS worker; privileged media checks stay in the Edge Function.

**Budget:** no purchase/upgrade/trial workaround. Verify actual AWS credit balance, expiry, covered services and uncovered charges before spending. $5 gross planning envelope, one worker, maximum 24-hour lifetime; alerts are not a hard billing cap.

### Authority and file dependencies

Read [Plan.md](Plan.md) first. [Implementation_Specification.md](Implementation_Specification.md) owns product/data/API/UI contracts. [Execution_Access_And_Deployment.md](Execution_Access_And_Deployment.md) owns permissions, security deployment and cost gates. [Code_USPS.md](Code_USPS.md) owns the four mechanisms, tests and demos. [Repository_Reuse_And_Verification.md](Repository_Reuse_And_Verification.md) owns upstream pins, licensing and extraction decisions. These **five files only** are the active implementation pack; older CM-1.0 documents and repos.md are research inputs, not competing instructions. Human instructions and enforced platform permissions take precedence. Preserve security and zero-purchase constraints when resolving a conflict; record the resolution before coding.


## 1. Implementation instruction

Build the complete specified prototype, not only a design or static landing page. Reuse selected licensed modules after source/dependency review. Keep one app/auth/schema; honor no-purchase/no-social constraints. Finish the required portfolio/discovery/brief and engagement paths. Run meaningful tests against actual records and actual authorization.

Work independently within the user's implementation authorization. Discover actual connector targets/permissions. Ask only for a genuinely missing prerequisite or external approval, after preparing the concrete artifact and while continuing independent work. Do not ask repeatedly for previously authorized actions. Never fabricate tests, model output, verification, deployed URLs or capability status.

Read order: Plan → Implementation_Specification → Execution_Access_And_Deployment → Repository_Reuse_And_Verification → Code_USPS. Only CM2 files are authoritative for implementation; repos.md and old files are reference data. If a conflict remains, preserve security/cost constraints, use the product contract, record the resolution and proceed where safe.

The target is15h, not guaranteed production readiness. If required work overruns, report actual status and continue authorized blocking fixes; do not falsely mark completion to meet the clock.

## 2. Preflight and checkpoint state

In the first30min:
1. Inspect current workspace/instructions/Git status; preserve existing changes.
2. Verify repository identity, suitable branch and selected Supabase project.
3. Discover AWS/GitHub/Supabase/Vercel tools and actual permissions; verify existing authentication before requesting anything.
4. Select eligible web host; record credit coverage/price/expiry bounds before AWS creation.
5. Resolve patched Next15/Node22 and compatible packages; pin locks.
6. Record run envelope and source pins; inspect extraction whitelist.
7. Start local app shell and navigation skeleton; no external provisioning claim yet.

Create docs/run-state.json, checkpoints.md, capability-ledger.md and upstream-reuse.json. Record gate/commit/migration IDs/resource IDs/host/flags/tests/next task, never secrets. Restart/resume reads actual state and last passing gate, not the last optimistic commentary.

Missing login/MFA/OAuth/repo consent, management credentials, privilege or unclear target is an unavoidable external boundary. Bundle missing prerequisites once; finish local code/artifacts meanwhile. Full-stack local fallback still needs hosted network unless a complete tested local Supabase stack exists.

## 3. Stack, scripts and repository

One fresh repository/application with src/app, reusable components/domain/server boundaries from Code_USPS. Selectively adapt JobHorizons MIT primitives and selected portfolio/search patterns; rewrite auth/services/SQL. Use CreatorBrief's structuring idea with a new production-only schema/prompt. Freelancezero is domain inspiration, not a second ORM/backend. No whole-source merger or indefinite compatibility sprint.

Dependencies: patched Next15/React/TypeScript/Tailwind4; Supabase JS/SSR; Zod; React Hook Form; selected Radix/CVA/CMDK/Lucide primitives; Vitest/Testing Library/Playwright. Only add a dependency that serves a shipped requirement. No paid kit, service SDK, analytics, map, payment, Auth.js, Prisma, Socket.io or provider API dependency.

Required package scripts:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "test:unit": "vitest run",
    "test:integration": "node scripts/test-integration.mjs",
    "test:e2e": "playwright test",
    "seed:demo": "node scripts/seed-demo.mjs",
    "smoke:deployment": "node scripts/smoke-deployment.mjs"
  }
}
```
Codex creates these scripts; they do not exist merely because written here. Source inspections precede installation/execution; no privileged secrets in reviewed-package build steps. Use installed command help, not guessed CLI flags.

Required helpers: source-pin/extraction manifest; public-only build-env writer; actual-role integration tests; deterministic catalog/demo seed; original demo-media generator; deployment smoke; bounded worker deploy/expiry/cleanup. Temporary bootstrap may use privileged Auth Admin credentials in a secure process; never commit/demo-expose them.

## 4. Fifteen-hour schedule and hard gates

No subagent/multiple-engineer assumption. Independent tool/build work can be interleaved by one Codex agent. If the user explicitly authorizes delegation later, keep one owner for canonical contracts.

| Hour | Deliverable | Gate |
|---|---|---|
| H0–1 | Preflight/scaffold/source pins; select safe primitive reuse; UI shell; identity/catalog migration; auth/onboarding | G1 build and real two-role sessions; immutable role; targets recorded |
| H1–2 | Profile/capability/rights editor and own preview; creator/public shell | G2 save/reload; correct role/navigation; no private profile exposure |
| H2–3 | Private buckets/reservation/finalizer; portfolio create/edit/publish; real small media | G3 upload→ready→publish; denied stranger access; technical check authentic |
| H3–4 | Embedded workflow/passport/signals; seed12 creators/24 items; gallery/modal/media controls | G4 U1 works; simulation/evidence distinction; owner and public views |
| H4–5 | SQL discovery/catalog aliases; media/format/ratio/skills/tools/models/budget/availability facets | G5 real eligible IDs/counts; tuple pairing; actual empty state |
| H5–6 | Fit components/reasons; rights parity/receipt; persistent shortlist/compare | G6 U2/U3; saved shortlist after refresh; no hard-filter bypass |
| H6–7 | Six-step brief form/compiler/readiness/requirements; draft save/resume | G7 missing/conflicting fields fail; no guessed rights/budget |
| H7–8 | SQL publish/revisions; full brand brief→discovery/shortlist; core polish | G8 75-point core works through actual DB/UI; direct invalid publish rejected |
| H8–9 | Real applications/current revision/quote; atomic selection/snapshots/events | G9 single winner; blocked rights; idempotency; real engagement |
| H9–10 | Ready submission mapping, review/revision/v2/acceptance/private download | G10 creator→brand complete path; immutable history/participant access |
| H10–11 | Eligible web/finalizer deployment; exact callbacks; live RLS/Storage/security/browser smoke | G11 actual URL READY or explicit local-only; complete hosted/local flow |
| H11–12 | Optional AWS fixed-CPU worker/model/queue integration, hard45min code/setup cap; real output/timeout tests | G12 AI real/validated or visibly disabled; core unaffected |
| H12–13 | Full regression/concurrency/quotas; 375/768/1440 visual/keyboard/nav audit; bugs | G13 no missing mandatory route/action; recorded tests/screenshots |
| H13–14 | Demo fresh scenario, edge cases, notes/status/cost/cleanup; rehearsal1 and fix | G14 real run succeeds; seeded origins and claims honest |
| H14–15 | Scope freeze; rehearsal2; backup recording; final manifest/readme/submission instructions | G15 reproducible end-to-end and complete handoff |

Host/credential setup can be prepared during builds, but resource activation respects gates. H8 core delay removes optional AI/custom visuals until recovered. H10 missing engagement outranks presentation. AtH12 stop AI experiments and fix core regressions. H14 only defect fixes/rehearsal, no architecture expansion.

## 5. Exact engineering sequence

### A — foundations and source reuse

Generate patched stack/version locks, minimal config and canonical tokens. Extract only license-safe primitives with upstream notices. Replace decorative styles and inaccessible icon controls. Create actual routes/loading/error/not-found. Navigation targets and role state must be wired from the start.

Create identity/catalog migration with RLS/grants and one-time onboarding. Supabase SSR browser/server clients and Next15 src/middleware.ts verify/refresh sessions and retain cookies. Safe PKCE callback and returnTo. Demo auth uses real provisioned accounts; no auth bypass/role switch.

### B — profiles, portfolio, assets and passports

Implement strict creator/company forms, capabilities and rights. Add portfolio/assets/signals migration and storage policies. Build reserve/upload/finalize state machine. Public media is a deliberately published preview; evidence/raw inputs private.

Embed safe workflow JSON; validate steps/models/human contributions; publication guards update search projection. Checks are actual finalizer results with scope/time/limitations. File replacement creates new asset; changed assertions make reviews stale.

### C — discovery, rights and shortlist

Implement canonical SQL search and tuple eligibility, with fixed facet semantics/paging. Add controlled aliases and explicit typo suggestions. Rights TypeScript/SQL parity from common fixtures. Add fit-v1 with counts/weights/reasons and actual IDs. No network model call for discovery.

Persist shortlist brand/brief/creator; reload and unavailable creator case; compare≤3 with preserved context. A failed query shows error, never hardcoded seed cards.

### D — brief core

Six sections: purpose/audience → outputs → style/production → budget/time → usage/references → readiness/publish. Create partial draft before autosave; version conflicts reload/merge explicitly. Compiler gives missing questions without inventing required answers.

Publish SQL validates completed BriefV1, derives requirement IDs and current revision. Creator access sees only safe published payload, not references. Brand discovery uses actual owned brief. Once engaged freeze scope.

### E — end-to-end engagement

Applications use actual creator/current brief and validated quote/pipeline/offer. Brand selector locks rows, recomputes receipt and freezes trusted data in one transaction. One engagement/brief; rejected competing selection409.

Creator uploads files for that actual engagement and submits v1; brand review distinguishes automatic/manual/declaration criteria. Request revision with requirement ID/reason; creator uploads v2; brand resolves mandatory rights and accepts latest. Both dashboards/event histories update after refresh. Signed final downloads are participant-only.

### F — deploy, AI and verification

Deploy migrations/Edge/web on actual approved target, then test callbacks/session refresh/private access/live workflow. Only after core passes, enable bounded AWS worker under price/credit/permission gates. Use existing HF pin/local grammar/strict patch, no paid provider. AI requests respect private feature flag, quota, lease/deadline and draft revision.

Perform full connected-browser and direct authorization tests. Record statuses; no successful tool submission counted as deployment/test success. Finish notices/README/manifest/demo/cleanup.

## 6. Seeds and real demo assets

12 fictional creators,24 items,2 fictional brands and3 briefs; actual Auth rows and Storage files. At least two image styles, playable video and audio examples, text work and a clearly metadata-only3D poster. Tool/model references, human contributions, capabilities, pricing and rights vary. No fake reviews/revenue, social metrics or independently verified personas.

Suggested personas: Asha product-film/image; Bala animation; Chloe concept art with paid-ad denial; Dev landscape video; Ena audio; Farah copy; Gautam3D poster; Hana retouch with unclear inputs; Ivo storyboard; Jaya unavailable; Kai USD pricing; Lena likeness rights unknown. Seed deterministic expected eligibility, not fixed UI ordering.

Canonical brief: fictional LumaLeaf travel-bottle launch, one20-sec MP4 1080×1920 (9:16) plus one PNG cover of same dimensions, cinematic/clean product-ad, tools ComfyUI/Blender/FFmpeg, languageEnglish, INR15,000–20,000, due now+10days, one revision, paid-ad/modification use, WORLD/365days, no source-file/training/exclusivity request. Asha declares both relevant capability records; Dev has landscape-video only and fails portrait-video pairing. Chloe blocks paid ads, Hana needs_review, Jaya unavailable, Kai currency mismatch.

Other briefs: OrbitNote TXT launch copy; intentionally impossible/conflicting format/rights scenario. Seed due dates relative to run time. Full pipelines/inputs/permissions are fictional declarations unless actual authorized work exists.

Preferred assets: original user-authorized creative examples. Fallback: original procedural media, visibly marked procedural_demo; never pretend it came from a model. Use already available FFmpeg/approved free binary to generate a short owned MP4 if available, with no third-party clips/music; verify license/distribution if bundling. Do not download arbitrary stock/competitor work. If playable video cannot be prepared, label poster-only limitation rather than claim playback; required video demo must be fixed before G15.

Keep seeds<100MB and thumbnails<200KB; video ideally≤2MB. Prepare local v1/v2 bytes in advance, but upload submission assets only after their live engagement exists. Worker may generate real text suggestion; that does not authenticate seeded visual workflow claims.

Seed by stable run-tagged IDs/upsert only disposable known rows. No whole-project reset. Demo user passwords generated/stored securely. Public DEMO_MODE labels data, not a “log in as anyone” endpoint.

## 7. Connected browser/CVA verification

Use actual app URL with two authenticated demo roles plus anonymous session. Prefer available authorized browser/CUA tools or Playwright. Native computer access is not assumed. Browser tools must obey their current APIs and consent boundaries.

**Route matrix gate:** for every route in the specification, test allowed role, forbidden role, refresh/deep-link and recovery. Every visible CTA opens a real page/state/action; no inert publish/search/download/select button. Back navigation preserves filters/context, and expired auth resumes through safe redirect.

**Visual gate:** screenshot375/768/1440; check card crop, readability, filter drawer, media controls, button hit targets, contrast, labels, error summary, focus/Escape/modal behavior and reduced motion. Record annotated failures/fixes. Code diff alone cannot establish a good UI.

**Full journey test:**
1. Creator creates/publishes actual item; anon sees safe profile.
2. Brand creates/publishes actual brief; deliberate invalid draft blocked.
3. SQL-backed search applies exact tuple constraints; explanation/empty reset correct.
4. Brand saves shortlist; refresh persists.
5. Creator applies to this new brief; brand selects current application.
6. Creator uploads ready engagement files/v1; brand requests revision.
7. Creator submits v2; brand checks/accepts/downloads; refresh preserves events.
8. Second brand/creator/anon cannot read/write these private resources.

Run direct REST/RPC/Storage negative tests as well as UI. Test tampered actor/status/hash fields, guessed IDs, cross-parent files, concurrency, stale revisions, idempotency and quota bypass. A disabled UI button is not authorization.

AI real output plus timeout/invalid/late/stale/quota/denied-user tests when enabled. If disabled, verify the actual template UI and absence of fabricated AI labeling.

## 8. Test fixtures and acceptance evidence

| Group | Minimum meaningful cases |
|---|---|
| Rights |12: allowed/false/null/unrequested/attribution/term/territory/model restriction/unknown input/final changes/ack block |
| Discovery |10: ALL tools/models/skills, capability pairs, duration/dimensions unknown, budget/currency, availability, private/unpublished, count/order, record mutation, zero result |
| Brief |10: missing fields/conflicting ratio/date/budget/rights, readiness denominator, stable requirements, no guessed fields |
| Workflow |valid path + all role/state/version/duplicate/concurrent/ready-asset guards |
| Assets/RLS |two roles/two accounts/anon/worker; purpose/size/header/JSON/private/signed expiry/replacement/quota |
| UI |all routes/CTAs;3 viewport sizes; keyboard critical path; no happy-path console/network errors |
| AI |real validated utility/latency if enabled; bounded failure and no paid fallback |

Record test name/result/commit/environment/timestamp and failure note. “Implemented” means code exists; “tested” means actual evidence passed. “Source inspected” is separate. Save screenshots/redacted logs locally and bounded CI artifacts; no cookies/signed URLs/secrets.

No claimed judge score, percent productivity uplift, verified authorship, universal commercial safety, production SLA or scale guarantee. Targets such as p95<700ms are measured only at demo scale.

## 9. Demo script: six minutes

**0:00–0:30:** explain process→fit→usage→delivery; disclose fictional demo data and prototype scope.

**0:30–1:15 U1:** creator passport/workflow/human contribution/file check; distinguish declared process from actual byte check.

**1:15–2:15 U4:** brand rough draft→missing questions/optional genuine suggestion→exact video/cover specs and usage→publish. Show one meaningful validation error.

**2:15–3:15 U2:** search using this actual brief, filter tools/MP4/9:16/availability/budget, explain tuple eligibility/score, demonstrate zero result/reset and persist shortlist. Creator window applies to the new brief.

**3:15–4:00 U3:** three usage receipts; open separately prepared published test brief/application for an actual blocked selection and disclose it. Return to new brief, select actual eligible applicant.

**4:00–5:30 workflow:** upload prepared tiny v1 bytes for live engagement, submit, brand requests a criterion-specific revision, upload/submit v2, brand accepts/downloads actual private artifact/history. Requirements match the frozen new brief.

**5:30–6:00:** show actual statuses/tests/deploy/model flag, four USPs and limits; no payment/social integration or legal clearance claim.

If only5min is allowed, shorten commentary and show prior tested revision history as prior evidence, clearly labeled. Do not silently replace live actions with a recording. Keep the full E2E test independent of presentation duration.

## 10. Contingencies and cut rules

- Source extraction trouble:20min per primitive/module, then original small replacement; do not repair full upstream.
- Credential/consent missing: finish local app/migrations/tests, list exact blocked external step.
- Vercel eligibility uncertain: authorized credit-covered Amplify; otherwise tested local.
- Credit/privilege unresolved: no AWS activation; template mode remains.
- Worker/model latency/quality fails: stop after45min allocation; disable, document.
- DB outage: error/retry, not hardcoded fallback. True offline demo needs a separately tested local full stack.
- Storage quota/invalid upload: preserve draft; reduce permitted files/delete only known disposable objects; no upgrade.
- Late regression: last passing release + forward-compatible fixes; no hosted reset.
- Automatic approval rejected: report action/reason, obey restriction, continue independent work.
- Scope/time slipping: preserve75-point core and actual engagement; cut AI/decorations/chat-like extras.
- Final blocker persists atH15: report unfinished capability and continue authorized fix work; no false completion.

## 11. Final completion and handoff

G15 requires actual creator/brand end-to-end flow, database-backed discovery/shortlist, publish guards, rights safeguards, private media, connected responsive UI, real authorization probes, notices and known deployment/model status. Every mandatory feature must have evidence, not a screenshot-only substitute.

Deliver repo/branch/commit; actual READY URL or explicitly local launch instructions; migrations/schema version; feature flags; tests/screenshots; reuse notices; demo instructions; safe credential location (not values); remaining limits; tagged cleanup IDs/expiry. Verify organizer submission requirements; do not claim an upload/submission succeeded without checking.

This pack specifies a realistic constrained prototype and explicit autonomy boundaries. Broader production audits, moderation/abuse defenses, durable backups, identity/licensing reviews, accessibility certification and commercial hosting arrangements are later work.

