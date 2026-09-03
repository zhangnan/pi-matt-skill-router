# @moo/pi-matt-skill-router

> **简体中文**: [README.zh-CN.md](./README.zh-CN.md)

A [Pi](https://pi.dev) extension that routes a request to the appropriate installed [Matt Pocock Skills](https://www.skills.sh/mattpocock/skills). It does not copy, install, or impersonate a Skill. It tells the agent to read the actual `SKILL.md` before working.

## What it does

- Catalogues the 37 real `SKILL.md` entries from Matt Pocock's 2026-09-02 guide; removed/legacy website entries are mapped to real skills only where that is safe.
- Routes only high-confidence task signals and orders stages: diagnosis → discovery → synthesis → implementation.
- Executes only Skills Pi has actually loaded; missing matches are disclosed, never fabricated.
- Respects explicit `/skill:name` and explicit requests to skip a workflow.
- Labels host-specific workflows as `native`, `Pi-adapted`, or `unsupported in Pi`.
- Shows the selected route in the Pi TUI status line. Run `/matt-route <task>` for its reason, phase, compatibility, configuration state, and availability.

## Install

```bash
# Global
pi install npm:@moo/pi-matt-skill-router

# Project-local
pi install -l npm:@moo/pi-matt-skill-router
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

Defaults enable only the `engineering` category. `productivity`, `writing`, and `adapted` are opt-in; `unsupported` entries are never automatically selected.

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
