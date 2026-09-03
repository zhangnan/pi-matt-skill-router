# @zhangnan555/pi-matt-skill-router

> **简体中文**: [README.zh-CN.md](./README.zh-CN.md)

A [Pi](https://pi.dev) extension that routes a request to the appropriate installed [Matt Pocock Skills](https://www.skills.sh/mattpocock/skills). It does not copy, install, or impersonate a Skill. It tells the agent to read the actual `SKILL.md` before working.

## What it does

- Catalogues the 37 real `SKILL.md` entries from Matt Pocock's 2026-09-02 guide; removed/legacy website entries are mapped to real skills only where that is safe.
- Routes only high-confidence task signals and orders stages: diagnosis → discovery → synthesis → implementation.
- Executes only Skills Pi has actually loaded; missing matches are disclosed, never fabricated.
- Respects explicit `/skill:name` and explicit requests to skip a workflow.
- Labels host-specific workflows as `native`, `Pi-adapted`, or `unsupported in Pi`.
- Shows the selected route in the Pi TUI status line. Run `/matt-route <task>` for its reason, phase, compatibility, configuration state, and availability.

## How it works

A small example: you type “this endpoint keeps throwing errors.” The extension recognises that as a `diagnosing-bugs` task, so before the agent starts it quietly adds one reminder: “load the `diagnosing-bugs` SKILL.md and follow its diagnosis loop.”

1. Ship a small catalogue — each Matt Pocock skill maps to a set of high-confidence trigger phrases (e.g. `debug`, `regression`, `报错`, `回归` → `diagnosing-bugs`).
2. On every turn, compare your input against those triggers; when something matches, order the hits by phase: diagnosis → discovery → synthesis → implementation.
3. Only route to skills that are actually installed: append “load this SKILL.md and follow it” to the turn's system prompt, and show the route in the status bar.

## Why this design

- **No memorising.** You don't need to know 30+ skill names or type `/skill:` by hand — describing the task in plain words routes you to the right workflow.
- **No copying or impersonation.** The extension never duplicates a SKILL.md body, so the real skills stay a single source of truth and cannot drift out of sync.
- **Honest, and respects you.** It steps aside when you explicitly run `/skill:name`; if a matching skill isn't installed it says so instead of pretending it ran.
- **Zero overhead when unmatched; only a short hint when matched.** When no skill matches, nothing is injected into the system prompt — no extra tokens, no noise on every single request. When one does match, only a short routing hint is added (skill name + reason), and the agent is told to `read` the real SKILL.md rather than pasting its body into the prompt. This contrasts with always-on workflow-harness extensions that inject guidance into the system prompt on every turn whether or not the request needs it.
- **Configurable.** Toggle whole categories on/off, disable individual skills, or add your own trigger phrases.

## Install

```bash
# Global
pi install npm:@zhangnan555/pi-matt-skill-router

# Project-local
pi install -l npm:@zhangnan555/pi-matt-skill-router
```

For development from this checkout:

```bash
pi install .
# Restart Pi or run /reload.
```

Install Matt Pocock Skills separately; Pi must discover them normally from its configured Skill paths. This package does not bundle them.

## Configuration

Configuration is optional JSON. Project configuration is read only after Pi trusts the project.

1. `~/.pi/agent/matt-skill-router.json`
2. `<project>/.pi/matt-skill-router.json`

Project values override global values; `disabledSkills` accumulates.

```json
{
  "enabledCategories": ["engineering", "productivity", "writing", "adapted"],
  "disabledSkills": ["triage"],
  "extraTriggers": {
    "research": ["核对供应商 API"]
  },
  "warnMissingSkills": true
}
```

By default all four categories (`engineering`, `productivity`, `writing`, `adapted`) are enabled. `unsupported` entries are never automatically selected regardless of category settings.

## Catalogue updates

The route catalogue is intentionally versioned against the 2026-09-02 Matt Pocock Skills guide, rather than silently changing with `skills.sh`. Check it explicitly:

```bash
npm run check:catalog
```

The command reports additions/removals and fails on a difference. Add each new entry's category, compatibility, triggers, and tests before publishing a new package version.

## Verify

```bash
npm install
npm run typecheck
npm test
npm run check:catalog
```
