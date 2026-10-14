# Contact and AI implementation release

Implemented directly on main. Two additive migrations introduce owner/relationship-protected contact records and owner-private AI request controls; privileged functions live behind private-schema implementations with public invoker wrappers. Supabase reports no new schema-security findings. The pre-existing Free-project leaked-password advisory remains.

Completed before deployment: TypeScript and lint passed, 73 unit cases passed, optimized production build passed, and 16 real Supabase permission/concurrency/request-guard checks passed. Fixtures are fictional and original contact settings were restored.

Production model calls, HTTP user workflows and browser verification are pending the new deployment; results will be appended after actual checks.
