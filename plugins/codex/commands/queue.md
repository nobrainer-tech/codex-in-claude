---
description: Inspect pending message IDs in one existing local Codex session
argument-hint: "<thread UUID>"
allowed-tools: Bash(node:*)
---

User request: $ARGUMENTS
Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/codex-sessions.mjs" queue --thread <UUID>`.
This only reads queue metadata and omits message bodies. Report pending IDs faithfully.
An empty queue is not proof of execution or successful task completion. Do not delete,
reorder, start, resend, interrupt or change settings without an explicit user request.
