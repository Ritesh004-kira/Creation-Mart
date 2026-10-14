# Run-owned resources and cleanup

Run: `c213484a-0c12-4cd6-a2a0-e4f67ae38db8`. Existing GitHub, Supabase and Vercel projects were reused. No purchase, plan upgrade, domain purchase or AWS compute activation occurred.

## AWS account 797129634517

The created IAM resources use path `/creation-mart/`, Project=CreationMart and the exact RunId: roles `CreationMart-Worker-c213484a` and `CreationMart-Operator-c213484a`, worker instance profile `CreationMart-Worker-c213484a`, and dormant user `CreationMart-Operator-c213484a`. Policies and trust documents are in `infrastructure/aws/iam-config.json`; policy readback and simulations are recorded in `docs/evidence/aws-iam-verification.json`.

The operator has no compute launch permission, access keys or login password. The worker role has SSM core access and explicit denies for secrets, IAM, EC2 and S3. No live assumed-role session or worker has been tested. No billable worker, volume, address, endpoint or inference resource was created; there is no active expiry timer. IAM resources persist and have no automatic expiry.

To remove only these IAM resources after the demo: remove the worker role from its named profile, delete that profile, detach its AmazonSSMManagedInstanceCore policy and delete its named inline deny, delete the worker role; delete the operator role's named inline policy and role; delete the dormant user's named AssumeExactOperator inline policy and user. Read and compare path/tags/names before removal. Do not delete pre-existing account resources. No cleanup was performed against unrelated AWS resources.

The account FREE plan/credits were read successfully, but individual compute service coverage and uncovered charges remain unverified. Optional inference is disabled, so activation is outside this release. Any future worker still requires verified coverage, a $5 gross envelope, one-worker ceiling and automatic cleanup within 24 hours.

## Supabase kfwmhbmkauiosobpqbdu

Fourteen canonical migrations, private portfolio-media/creator-evidence/engagement-files buckets, finalizer Edge v4 and scoped fictional accounts/records were added. Preserve the existing project and the human GitHub identity. The original seed comprises 12 creators, 24 items, two brands and three briefs; additional clearly labeled test records exercise the real workflow. IDs are in the ignored local `work/seed-manifest.json` and probe manifests.

Cancelled links are blocked by a one-byte retained object until their two-hour capability expires plus a one-minute margin. Cleanup reports only records owned by encrypted run demo users: `node scripts/cleanup-expired-uploads.mjs`. Add `--apply` to delete expired blockers. `--protect-recent --apply` repairs recent pre-guard rejected fixtures; it was run for this deployment. A blocker counts against active files until removed. Ready immutable delivery history remains for demonstration.

After the demonstration, use the run manifests and exact ownership checks to archive demo briefs/profiles, remove their Storage objects, and remove only run-owned demo identities if desired. Do not reset the schema or delete all users. Demo credentials are Windows DPAPI-encrypted outside the repository; do not commit them or share their values.

## Vercel and GitHub

Existing Vercel project `prj_qNFGM4QpWt5foIgAkpJ8eYI51rGy` remains on Hobby; public configuration contains only the publishable Supabase key/URL, app origin and demo flags. This release is a personal fictional educational prototype without payments, advertisements, commerce transactions or real client fulfillment, consistent with the [Hobby policy](https://vercel.com/docs/plans/hobby) and [fair-use guidance](https://vercel.com/docs/limits/fair-use-guidelines). This eligibility conclusion is limited to the current demo, not a future commercial launch.

The implementation branch is `implementation/creatormatch` in `Ritesh004-kira/Creation-Mart`; no merge or repository-visibility change was made by this agent. Deployment history and final URL/status are recorded in run-state. To retire the demo, remove its aliases/deployments in this existing project after saving the required evidence; preserve the project/repository unless the owner requests removal.
