# Creation Mart

Creation Mart is a personal hackathon prototype for matching creators to production briefs using declared capabilities, documented workflows, usage permissions and actual delivery files. It uses the existing Creation-Mart GitHub repository, Supabase Free project and Vercel Hobby project. All seeded people, brands and projects are fictional. No payments or real commercial marketplace service is enabled.

## Run

Use Node 22. Copy `.env.example` to `.env.local` and set the existing Supabase URL, publishable key and application origin. Run `npm ci` and `npm run dev`. Only public configuration belongs in the web runtime. Never add an AWS credential or Supabase privileged key.

`npm run build`, `npm run lint`, `npm run test:unit` and `npm run test:e2e` verify the application. Hosted integration scripts in `scripts/test-*.mjs` use the run-owned demo accounts and create scoped fixtures; they require the encrypted local credential store. Browser tests accept `BASE_URL` for the same deployed application. Run `npm run smoke:deployment -- https://creation-mart.vercel.app` after a deployment is READY.

## Demonstrate

1. Sign in as `asha` to publish a production passport with a checked preview and declared workflow.
2. Sign in as `lumaleaf` to write and publish the six-section brief. Structure the idea using the explicitly labeled template assistant.
3. Discover eligible creators, inspect the six fit components and rights receipt, save the shortlist and compare up to three creators.
4. As the creator, apply to the current brief revision. As the brand, select the application.
5. Upload and submit v1, request changes tied to a requirement, upload v2, review its permissions and accept the latest delivery. Download the accepted files privately.

Use separate browser profiles for the two roles. On this Windows account, `node scripts/demo-access.mjs` lists aliases. Explicit `--copy-email` and `--copy-password` actions copy the chosen field into the clipboard without logging its value. Credentials live outside the repository in Windows user-bound encryption at `C:/Users/rites/.codex/secrets/creation-mart/c213484a-0c12-4cd6-a2a0-e4f67ae38db8.dpapi`. Clear the clipboard after use. GitHub OAuth is also configured; new human users choose their own immutable role during onboarding.

## Verified behavior and limits

Production passports distinguish creator assertions from actual byte/hash/header/dimension checks. These checks establish neither identity, authorship, licensing nor malware safety. The originals are procedural images, playable video, audio and text. 3D examples show metadata and a poster; the application does not render a 3D model.

The database enforces ownership, private evidence, participant-only deliveries, file quotas, current versions, actor-scoped idempotency, one winning selection and frozen engagement snapshots. Cancelled uploads retain a reserved one-byte blocker for two hours plus a safety margin so an old signed upload cannot recreate a file. They count against the active-file quota until expiry cleanup. Run `node scripts/cleanup-expired-uploads.mjs` to report expired blockers for demo users, then add `--apply` to remove them. Human users can retry Remove after expiry.

Optional inference is disabled. Brief assistance is deterministic template mode; no model, paid API, worker or AWS compute is running. Scoped AWS IAM resources are configured and their policies were simulated; no live operator session is claimed. See `infrastructure/aws/iam-config.json` and `docs/resource-cleanup.md`.

Actual release status, source revision, evidence and remaining gates are recorded in `docs/run-state.json`, `docs/capability-ledger.md` and `docs/requirements-checklist.md`. Upstream reuse is limited to the attributed MIT button adaptation in `THIRD_PARTY_NOTICES.md`; all original demo assets are labeled accordingly. The five System specifications and `System/Master_Goal.md` remain the requirements authority. The application has not been submitted to a hackathon by this agent.
