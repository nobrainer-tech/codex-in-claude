# codex-in-claude

Independent fork of openai/codex-plugin-cc. Preserve Apache-2.0 license and NOTICE.
Use nobrainer-tech-flow, bounded changes, native workers only when the owner's requested model is actually dispatchable, and evidence-based completion.
One canonical checkout; preserve local WIP. Never modify Codex databases, credentials, provider routing or daemon configuration.
New session commands must use exact UUIDs, read-only discovery, explicit human send authorization, and distinguish preview, queued, consumed and completed.
No automatic resuming, cancellation, archive, session creation, retries of uncertain writes or model/effort overrides.
Run npm test, npm run check-version and git diff --check. Live sends need a specifically authorized target and message; fixture success alone is not end-to-end proof.
