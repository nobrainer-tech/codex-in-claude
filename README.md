<p align="center">
  <a href="https://nobrainer.tech/">
    <img src="docs/assets/nobrainer-logo.svg" width="72" alt="NoBrainer Tech">
  </a>
</p>

<h1 align="center">Codex in Claude</h1>

<p align="center"><strong>Your existing Codex sessions, within reach of Claude Code.</strong></p>
<p align="center">Find a session. Send it an instruction. Check its queue.<br>Review code and delegate work from the same place.</p>

<p align="center">
  <a href="#install">Install</a> ·
  <a href="#work-with-existing-sessions">Session commands</a> ·
  <a href="#command-reference">Command reference</a> ·
  <a href="COMPATIBILITY.md">Compatibility</a> ·
  <a href="#built-with-nobrainer-tech-flow">Built with NoBrainer Tech Flow</a>
</p>

---

**codex-in-claude** is an independent [NoBrainer Tech](https://nobrainer.tech/) fork of [OpenAI's Codex plugin for Claude Code](https://github.com/openai/codex-plugin-cc). It adds discovery and messaging for **existing local Codex sessions**, alongside the upstream review, delegation and transfer tools.

| What you want to do | What this fork adds |
| --- | --- |
| Find the right conversation | List local Codex sessions by their real sections, with exact session IDs. |
| Continue work in an existing session | Queue an authorized instruction to that session while preserving its model, effort, goal and working directory. |
| Check what is still waiting | Read pending queue IDs without displaying message bodies. |

The session features are merged in [fork PR #1](https://github.com/nobrainer-tech/codex-in-claude/pull/1). The separate [upstream proposal #833](https://github.com/openai/codex-plugin-cc/pull/833) tracks their submission to OpenAI. This fork is not an official OpenAI release.

## Install

You need Claude Code with plugin support, Node.js **18.18 or later**, and a local Codex CLI signed in to an account with Codex access. The session commands require Codex's experimental section and queue APIs; they were [verified with Codex CLI 0.163.0](COMPATIBILITY.md). Older versions may not expose them.

In Claude Code, run these commands in order. Complete the plugin installation prompts before reloading:

```text
/plugin marketplace add nobrainer-tech/codex-in-claude
/plugin install codex-in-claude@nobrainer-codex
/reload-plugins
/codex-in-claude:setup
```

The marketplace comes directly from this public repository. The command format follows the [Claude Code plugin installation guide](https://code.claude.com/docs/en/discover-plugins#add-a-marketplace).

If Codex is missing, setup can offer to install Codex for you. To install it yourself, run `npm install -g @openai/codex` in your terminal. Then use `!codex login` from Claude Code if you need to sign in. Your normal [Codex usage limits and pricing](https://developers.openai.com/codex/pricing/) apply.

The fork uses `/codex-in-claude:*`, so its commands can coexist with the official `/codex:*` plugin. For development from a checkout, replace the marketplace source with `/absolute/path/to/codex-in-claude`.

## Work with existing sessions

Start by listing sessions, then copy the exact UUID of the intended conversation:

```text
/codex-in-claude:sessions
```

After choosing the recipient, ask Claude Code to send your instruction. Replace `<session-uuid>` with the ID from the list:

```text
/codex-in-claude:send <session-uuid> Review the current diff and report any blockers. Do not edit files.
/codex-in-claude:queue <session-uuid>
```

| Command | Result |
| --- | --- |
| `/codex-in-claude:sessions` | Local, non-archived sessions grouped by section. Add `--archived` for archived sessions. |
| `/codex-in-claude:send <UUID> <instruction>` | Preview the target, then queue the instruction when you have explicitly authorized sending it. |
| `/codex-in-claude:queue <UUID>` | Pending queue IDs and request IDs. |

> [!IMPORTANT]
> **QUEUED means pending delivery.** The recipient may need to be opened, and an active goal loop may delay consumption. An empty queue does not prove completion. Check the recipient's response for the actual result.

Discovery covers the **local Codex home**. Remote hosts and ChatGPT conversations are excluded, and section order may differ from Desktop. The commands do not change the session's model, effort, goal or working directory, and do not automatically resume or interrupt it.

Do not send credentials or other secrets: the native `codex queue` command receives message text as a process argument. The wrapper accepts stdin and does not save message bodies. An uncertain send is reported as unknown and is never retried automatically. Read the [compatibility and verification notes](COMPATIBILITY.md) for the exact boundaries.

<details>
<summary><strong>Use the session commands directly from a checkout</strong></summary>

Run from the repository root. For the send commands, replace `<UUID>` with the exact target ID and create `instruction.txt` with the authorized message:

```sh
node plugins/codex/scripts/codex-sessions.mjs sessions --json
node plugins/codex/scripts/codex-sessions.mjs send --thread <UUID> < instruction.txt
# After checking the preview and confirming existing send authorization:
node plugins/codex/scripts/codex-sessions.mjs send --thread <UUID> --execute < instruction.txt
node plugins/codex/scripts/codex-sessions.mjs queue --thread <UUID>
```

The first `send` only previews the target; `--execute` queues the message. Section membership comes from `threadSection/list` and `thread/list`, without reading Codex databases. Unsupported runtimes fail explicitly; the commands do not upgrade Codex, restart its daemon or change its configuration.

</details>

## Built with NoBrainer Tech Flow

The session-routing extension and this documentation were developed using **[nobrainer-tech-flow](https://github.com/nobrainer-tech/nobrainer-tech-flow)** and its **[MCP server](https://github.com/nobrainer-tech/nobrainer-tech-flow/blob/main/mcp/README.md)**. The workflow defines the outcome and acceptance checks, guides implementation, records evidence and checks completion.

The MCP tools used for this work are `start_flow_task`, `check_flow_evidence` and `check_flow_done`. They check the task contract and submitted evidence; tests and runtime checks are run separately. Flow is a development workflow, not a runtime dependency of this plugin.

| Explore | What you will find |
| --- | --- |
| [NoBrainer Tech Flow](https://nobrainer.tech/flow/) | The workflow, examples and ways to get started. |
| [Source and installation](https://github.com/nobrainer-tech/nobrainer-tech-flow) | The open-source workflow and its modules. |
| [MCP setup](https://github.com/nobrainer-tech/nobrainer-tech-flow/blob/main/mcp/README.md#install) | Connect an MCP client to `https://mcp.nobrainer.tech/mcp`. |
| [This fork's verification](COMPATIBILITY.md) | Tested commands, runtime versions and known limitations. |

Try Flow on a small task with a checkable result: **[choose your setup](https://github.com/nobrainer-tech/nobrainer-tech-flow#install-safely)**.

## Command reference

### `/codex-in-claude:review`

Runs the native Codex review on your current work.

> [!NOTE]
> Code review especially for multi-file changes might take a while. It's generally recommended to run it in the background.

Use it when you want:

- a review of your current uncommitted changes
- a review of your branch compared to a base branch like `main`

Use `--base <ref>` for branch review. It also supports `--wait` and `--background`. It is not steerable and does not take custom focus text. Use [`/codex-in-claude:adversarial-review`](#codex-in-claudeadversarial-review) when you want to challenge a specific decision or risk area.

Examples:

```bash
/codex-in-claude:review
/codex-in-claude:review --base main
/codex-in-claude:review --background
```

This command is read-only and will not perform any changes. When run in the background you can use [`/codex-in-claude:status`](#codex-in-claudestatus) to check on the progress and [`/codex-in-claude:cancel`](#codex-in-claudecancel) to cancel the ongoing task.

### `/codex-in-claude:adversarial-review`

Runs a **steerable** review that questions the chosen implementation and design.

It can be used to pressure-test assumptions, tradeoffs, failure modes, and whether a different approach would have been safer or simpler.

It uses the same review target selection as `/codex-in-claude:review`, including `--base <ref>` for branch review.
It also supports `--wait` and `--background`. Unlike `/codex-in-claude:review`, it can take extra focus text after the flags.

Use it when you want:

- a review before shipping that challenges the direction, not just the code details
- review focused on design choices, tradeoffs, hidden assumptions, and alternative approaches
- pressure-testing around specific risk areas like auth, data loss, rollback, race conditions, or reliability

Examples:

```bash
/codex-in-claude:adversarial-review
/codex-in-claude:adversarial-review --base main challenge whether this was the right caching and retry design
/codex-in-claude:adversarial-review --background look for race conditions and question the chosen approach
```

This command is read-only. It does not fix code.

### `/codex-in-claude:rescue`

Hands a task to Codex through the `codex-in-claude:codex-rescue` subagent.

Use it when you want Codex to:

- investigate a bug
- try a fix
- continue a previous Codex task
- choose a different model for a delegated task

> [!NOTE]
> Depending on the task and the model you choose these tasks might take a long time and it's generally recommended to force the task to be in the background or move the agent to the background.

It supports `--background`, `--wait`, `--resume`, and `--fresh`. If you omit `--resume` and `--fresh`, the plugin can offer to continue the latest rescue thread for this repo.

Examples:

```bash
/codex-in-claude:rescue investigate why the tests started failing
/codex-in-claude:rescue fix the failing test with the smallest safe patch
/codex-in-claude:rescue --resume apply the top fix from the last run
/codex-in-claude:rescue --model gpt-5.4-mini --effort medium investigate the flaky integration test
/codex-in-claude:rescue --model spark fix the issue quickly
/codex-in-claude:rescue --background investigate the regression
```

You can also just ask for a task to be delegated to Codex:

```text
Ask Codex to redesign the database connection to be more resilient.
```

**Notes:**

- if you do not pass `--model` or `--effort`, Codex chooses its own defaults.
- if you say `spark`, the plugin maps that to `gpt-5.3-codex-spark`
- follow-up rescue requests can continue the latest Codex task in the repo

### `/codex-in-claude:transfer`

Creates a persistent Codex thread from the current Claude Code session and prints a `codex resume <session-id>` command.

Use it when you started a debugging or implementation conversation in Claude Code and want to continue that same context directly in Codex.

Examples:

```bash
/codex-in-claude:transfer
/codex-in-claude:transfer --source ~/.claude/projects/-Users-me-repo/<session-id>.jsonl
```

The plugin's existing `SessionStart` hook supplies the current transcript path automatically; `--source` is available as a manual override. The transfer uses Codex's external-agent session importer, so it follows the same conversion rules as importing Claude history in the Codex App and creates visible turns that can be continued in the App or TUI. The source must be under `~/.claude/projects`, and older Codex versions that do not expose session import must be upgraded before using this command.

### `/codex-in-claude:status`

Shows running and recent Codex jobs for the current repository.

Examples:

```bash
/codex-in-claude:status
/codex-in-claude:status task-abc123
```

Use it to:

- check progress on background work
- see the latest completed job
- confirm whether a task is still running

### `/codex-in-claude:result`

Shows the final stored Codex output for a finished job.
When available, it also includes the Codex session ID so you can reopen that run directly in Codex with `codex resume <session-id>`.

Examples:

```bash
/codex-in-claude:result
/codex-in-claude:result task-abc123
```

### `/codex-in-claude:cancel`

Cancels an active background Codex job.

Examples:

```bash
/codex-in-claude:cancel
/codex-in-claude:cancel task-abc123
```

### `/codex-in-claude:setup`

Checks whether Codex is installed and authenticated.
If Codex is missing and npm is available, it can offer to install Codex for you.

You can also use `/codex-in-claude:setup` to manage the optional review gate.

#### Enabling review gate

```bash
/codex-in-claude:setup --enable-review-gate
/codex-in-claude:setup --disable-review-gate
```

When the review gate is enabled, the plugin uses a `Stop` hook to run a targeted Codex review based on Claude's response. If that review finds issues, the stop is blocked so Claude can address them first.

> [!WARNING]
> The review gate can create a long-running Claude/Codex loop and may drain usage limits quickly. Only enable it when you plan to actively monitor the session.

## Codex Integration

The Codex plugin wraps the [Codex app server](https://developers.openai.com/codex/app-server). It uses the global `codex` binary installed in your environment and [applies the same configuration](https://developers.openai.com/codex/config-basic).

### Configuration

If you want to change the default reasoning effort or the default model that gets used by the plugin, you can define that inside your user-level or project-level `config.toml`. For example to always use `gpt-5.4-mini` on `high` for a specific project you can add the following to a `.codex/config.toml` file at the root of the directory you started Claude in:

```toml
model = "gpt-5.4-mini"
model_reasoning_effort = "high"
```

Your configuration will be picked up based on:

- user-level config in `~/.codex/config.toml`
- project-level overrides in `.codex/config.toml`
- project-level overrides only load when the [project is trusted](https://developers.openai.com/codex/config-advanced#project-config-files-codexconfigtoml)

Check out the Codex docs for more [configuration options](https://developers.openai.com/codex/config-reference).

### Moving The Work Over To Codex

Delegated tasks and any [stop gate](#enabling-review-gate) run can also be directly resumed inside Codex by running `codex resume` either with the specific session ID you received from running `/codex-in-claude:result` or `/codex-in-claude:status` or by selecting it from the list.

This way you can review the Codex work or continue the work there.

## FAQ

### Do I need a separate Codex account for this plugin?

If you are already signed into Codex on this machine, that account should work immediately here too. This plugin uses your local Codex CLI authentication.

If you only use Claude Code today and have not used Codex yet, you will also need to sign in to Codex with either a ChatGPT account or an API key. [Codex is available with your ChatGPT subscription](https://developers.openai.com/codex/pricing/), and [`codex login`](https://developers.openai.com/codex/cli/reference/#codex-login) supports both ChatGPT and API key sign-in. Run `/codex-in-claude:setup` to check whether Codex is ready, and use `!codex login` if it is not.

### Does the plugin use a separate Codex runtime?

No. This plugin delegates through your local [Codex CLI](https://developers.openai.com/codex/cli/) and [Codex app server](https://developers.openai.com/codex/app-server/) on the same machine.

That means:

- it uses the same Codex install you would use directly
- it uses the same local authentication state
- it uses the same repository checkout and machine-local environment

### Will it use the same Codex config I already have?

Yes. If you already use Codex, the plugin picks up the same [configuration](#configuration).

### Can I keep using my current API key or base URL setup?

Yes. Because the plugin uses your local Codex CLI, your existing sign-in method and config still apply.

If you need to point the built-in OpenAI provider at a different endpoint, set `openai_base_url` in your [Codex config](https://developers.openai.com/codex/config-advanced/#config-and-state-locations).

## Development

From a checkout, install the development dependencies and run the repository checks:

```sh
npm ci
npm test
npm run check-version
npm run build
git diff --check
```

The build's `prebuild` step generates types from your installed Codex CLI. Verification results and their limits are recorded in [COMPATIBILITY.md](COMPATIBILITY.md); a passing local test suite is not proof of installation in a fresh Claude session.

## Credits and license

Based on [openai/codex-plugin-cc](https://github.com/openai/codex-plugin-cc) at commit [`db52e28`](https://github.com/openai/codex-plugin-cc/commit/db52e28f4d9ded852ab3942cea316258ae4ef346), upstream version 1.0.6. The fork's session-routing work is maintained by [NoBrainer Tech](https://nobrainer.tech/).

The original copyright, [Apache-2.0 license](LICENSE) and [NOTICE](NOTICE) are preserved. The NoBrainer Tech logo is the canonical brand mark. The separate [nobrainer-tech-flow project](https://github.com/nobrainer-tech/nobrainer-tech-flow) is MIT-licensed.
