#!/usr/bin/env node
/**
 * Verifies src/catalog.ts against the Matt Pocock Skills guide used as this
 * package's source of truth. The guide is based on upstream commit 6654f6b
 * (2026-09-02) and lists 37 real SKILL.md files. Do not silently follow the
 * broader skills.sh website list: it includes removed/legacy entries that this
 * router should not execute as standalone skills.
 */
import { readFile } from "node:fs/promises";

const expected = [
	"ask-matt",
	"claude-handoff",
	"code-review",
	"codebase-design",
	"diagnosing-bugs",
	"domain-modeling",
	"git-guardrails-claude-code",
	"grill-me",
	"grill-with-docs",
	"grilling",
	"handoff",
	"implement",
	"implement-spec",
	"improve-codebase-architecture",
	"loop-me",
	"migrate-to-shoehorn",
	"prototype",
	"research",
	"resolving-merge-conflicts",
	"retro",
	"scaffold-exercises",
	"setup-matt-pocock-skills",
	"setup-pre-commit",
	"setup-ts-deep-modules",
	"tdd",
	"teach",
	"to-questionnaire",
	"to-spec",
	"to-tickets",
	"triage",
	"wait-what",
	"wayfinder",
	"wizard",
	"writing-beats",
	"writing-for-agents",
	"writing-fragments",
	"writing-shape",
].sort();

const source = await readFile(new URL("../src/catalog.ts", import.meta.url), "utf8");
const local = [...source.matchAll(/(?:engineering|productivity|writing|adapted|piAdaptedEngineering)\("([a-z0-9-]+)"/g)].map((match) => match[1]).sort();
const only = (left, right) => left.filter((item) => !right.includes(item));

console.log(`guide expected: ${expected.length}; local catalogue: ${local.length}`);
console.log(`Missing local entries: ${only(expected, local).join(", ") || "none"}`);
console.log(`Unexpected local entries: ${only(local, expected).join(", ") || "none"}`);
process.exitCode = expected.length === local.length && only(expected, local).length === 0 && only(local, expected).length === 0 ? 0 : 1;
