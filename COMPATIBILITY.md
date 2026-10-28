# Compatibility and verification

Compared on 2026-10-28 with upstream `openai/codex-plugin-cc` commit `db52e28f4d9ded852ab3942cea316258ae4ef346`, manifest 1.0.6. Fork manifest: 1.0.6-nb.1.

Verified locally with Codex CLI 0.163.0:

- `threadSection/list`, paginated `thread/list` filtered by section, including an unassigned group. Named sections use `section_position`; unassigned threads use `updated_at` because the API rejects section-position sort without a non-null section.
- Exact-ID `thread/read` send preview preserves model, reasoning effort and cwd.
- Native `codex queue` returned a queue receipt for an authorized message. Independent readback of the existing recipient's next completed turn confirmed the requested acknowledgment.
- `npm test`: 99 passed, 0 failed. `npm run prebuild` and `npm run build` passed; version consistency and diff whitespace checks passed.
- Claude plugin and marketplace validation passed with warnings about the owner-selected name and a missing catalog icon. These are not runtime installation proof.

The read connection starts a short-lived app-server with experimental capabilities and never resumes a thread. Sending uses the native CLI's shared-server discovery. Raw JSONL through `codex app-server proxy` did not initialize on this host and is not used as a write fallback.

Limitations: local Codex home only; no remote-host enumeration or ChatGPT conversations, no guarantee of Desktop's visual section order, and no automatic queue consumption or completion guarantee. Metadata reads from a separate app-server may show `notLoaded` even while Desktop is running a turn. A live send/receipt test does not prove installation or discovery in a fresh Claude session. Model-specific native independent review was unavailable; local review is not an independent release approval. No global plugin installation or production deployment was performed.

On use, compare upstream again when this successful check is older than seven days. Record failures as CHECK_FAILED or UNVERIFIED. A source version, installed cache version, loaded plugin and Codex CLI API version are separate facts; never update them by editing caches or account configuration.
