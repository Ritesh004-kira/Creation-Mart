# Documentation release — 14 October 2026

This record supersedes old deployment/source identifiers only for the evaluator-documentation release. The existing complete application source was synchronized to main at `2379109`.

## Delivered content

- Full README and evaluation guide covering all four USPs, features, user journeys, architecture, API routes, access controls, setup, evidence and limitations.
- Public `/project-overview` HTML, `/llms.txt` and `/project-overview.json`; discoverable from navigation, footer, About page and sitemap.
- Shared catalog at `src/content/project-overview.json`.

## Verification and deployment

Release validation and deployment status will be appended after actual checks. Historical evidence remains linked and is explicitly dated; no complete retest of authenticated journeys is implied by this documentation change.

Local verification: ESLint passed; all 70 unit tests passed; production compilation, type validation and static-page generation passed. Remote publication and public URL status are pending verification.
Production build completed successfully (including the new /project-overview, robots.txt and sitemap.xml routes).
