# codex-in-claude implementation

Outcome: extend the upstream plugin with local Codex session discovery grouped by real sections and authorized messages to an exact existing session. Preserve upstream review/rescue/transfer.
Base: openai/codex-plugin-cc db52e28f4d9ded852ab3942cea316258ae4ef346 (1.0.6).
Scope: plugin identity/commands, session transport, tests, README and compatibility. No account/routing/settings changes or database access.

- [x] Upstream has no arbitrary-target send or section listing command.
- [x] Local API exposes threadSection/list, section filters and native queue.
- [x] Implement bounded commands; 99/99 tests, build, manifest and diff checks pass.
- [x] Read back live sections and a send preview.
- [x] Native queue delivered an authorized handoff-confirmation message; recipient answered in its existing thread.
- [x] GitHub fork created; implementation publication is the remaining delivery step; global installation is not authorized by this fork request.

Terra native subagents are not advertised by this dispatch tool; MAIN performs implementation/review without a silent model substitution.
Native queue uses shared-daemon discovery; JSONL over raw app-server proxy timed out at initialize. Read-only metadata uses a short-lived app-server with experimental capabilities; sending delegates to native codex queue. No automatic daemon restart or fallback write.
