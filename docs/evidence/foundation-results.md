# Foundation evidence

These results cover the identity/profile foundation only, not the complete marketplace.

- Node 22.23.3 downloaded from the official distribution and SHA-256 verified.
- Next 15.5.27 production build passed; typecheck and lint passed.
- 52 unit fixtures passed, including exact capability pairing, rights rules, brief readiness, requirements and redirect escapes.
- 13 actual hosted Auth/RLS/RPC checks passed with real creator, brand and anonymous clients. Profile save/reload, stale version rejection, immutable roles, exact onboarding replay/body conflict, protected fields, metadata escalation and direct unguarded update denial were tested.
- Five Playwright foundation checks passed with isolated Edge contexts. Public page at 375/768/1440, keyboard skip navigation, creator password sign-in/profile save/reload/sign-out and brand denial of creator editing passed.
- After aligning hero sizes with the specification, all three public viewport checks passed again.
- Screenshot files are actual browser output. Initial production screenshots were visually inspected at all three widths; refreshed screenshots reflect the size adjustment.
- npm audit reports zero vulnerabilities after patching PostCSS and replacing the lint preset's unpatched glob dependency with TypeScript parsing and React hook rules. Next's missing preset plugin notice is a build warning; no test result is hidden.
- Supabase security advisor reports leaked-password protection disabled. Demo passwords are high-entropy, locally generated and encrypted with Windows user-bound DPAPI. No paid feature was activated. Private operational tables have explicit deny policies; application table RLS is enabled.

## Resource and source state

Existing repository Ritesh004-kira/Creation-Mart, GitHub owner ID 233903883, repository ID 1416675972. It now reports public through both connector and CLI. The agent did not change visibility.

Existing Supabase Free project kfwmhbmkauiosobpqbdu; migrations 20261013093256_identity_catalog and 20261013094129_profile_version_guard applied through the connector. Canonical source filenames match actual migration history. The first file used the native connector path while CLI download was unavailable; subsequent files are initialized through the checksum-verified CLI and aligned to provider-assigned versions.

Two run-tagged demo Auth identities were created by a scoped management bootstrap with locally computed bcrypt hashes, followed by actual Supabase password sessions and normal guarded onboarding. Plaintext passwords never entered SQL, chat or Git. The public signup attempt rejected example.com demo addresses before user creation; no auth bypass or role-switch endpoint was added.

The Vercel target is the existing creation-mart project prj_qNFGM4QpWt5foIgAkpJ8eYI51rGy. No application deployment has been made. AWS remains unchanged; no worker or billable resources launched.
