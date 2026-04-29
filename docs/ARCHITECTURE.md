## Architecture (v0)

See also: `docs/ROADMAP.md`

### Goals
- **Fast iteration** on game meta + economy while keeping simulation deterministic in the client.
- **Hybrid**: Unity for game client; TypeScript for gateway, SDK, web/mobile companion, ops integration.
- **SSOT Protocol**: all client↔server payloads share a single schema + runtime validation.

### Repo layout
- `packages/protocol`
  - SSOT message schemas (Zod) and exported TypeScript types.
  - Next: generate JSON Schema (for docs), plus C# DTOs for Unity.
- `services/gateway`
  - HTTP API surface, auth, rate limits, ecosystem integrations.
- `packages/sdk-ts`
  - Typed client wrapper around gateway endpoints for web/mobile.

### Determinism boundary
- Unity client owns: match simulation, replayability, local prediction.
- Gateway owns: accounts, inventory snapshots, receipts, leaderboards, anti-abuse, ecosystem hooks.

