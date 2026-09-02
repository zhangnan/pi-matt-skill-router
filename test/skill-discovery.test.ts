import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { discoverMattSkills, mergeDiscoveredSkills } from "../src/skill-discovery.js";

test("discovers Matt skills by real file path even when not present in system prompt options", () => {
	const oldAgentDir = process.env.PI_CODING_AGENT_DIR;
	const root = join(tmpdir(), `pi-matt-discovery-${Date.now()}`);
	const skillDir = join(root, "skills", "implement");
	mkdirSync(skillDir, { recursive: true });
	writeFileSync(join(skillDir, "SKILL.md"), "---\nname: implement\ndescription: implement\ndisable-model-invocation: true\n---\n");
	process.env.PI_CODING_AGENT_DIR = root;
	try {
		assert.deepEqual(discoverMattSkills(root).filter((skill) => typeof skill !== "string" && skill.name === "implement"), [
			{ name: "implement", filePath: join(skillDir, "SKILL.md") },
		]);
	} finally {
		if (oldAgentDir === undefined) delete process.env.PI_CODING_AGENT_DIR;
		else process.env.PI_CODING_AGENT_DIR = oldAgentDir;
	}
});

test("fallback discovery follows Pi auto-discovery precedence", () => {
	const oldAgentDir = process.env.PI_CODING_AGENT_DIR;
	const root = join(tmpdir(), `pi-matt-priority-${Date.now()}`);
	const cwd = join(root, "repo", "nested");
	const projectSkill = join(cwd, ".pi", "skills", "implement");
	const projectAgentsSkill = join(root, "repo", ".agents", "skills", "implement");
	const userSkill = join(root, "agent", "skills", "implement");
	for (const dir of [projectSkill, projectAgentsSkill, userSkill]) {
		mkdirSync(dir, { recursive: true });
		writeFileSync(join(dir, "SKILL.md"), "---\nname: implement\ndescription: implement\n---\n");
	}
	mkdirSync(join(root, "repo", ".git"), { recursive: true });
	process.env.PI_CODING_AGENT_DIR = join(root, "agent");
	try {
		assert.deepEqual(discoverMattSkills(cwd).filter((skill) => typeof skill !== "string" && skill.name === "implement"), [
			{ name: "implement", filePath: join(projectSkill, "SKILL.md") },
		]);
	} finally {
		if (oldAgentDir === undefined) delete process.env.PI_CODING_AGENT_DIR;
		else process.env.PI_CODING_AGENT_DIR = oldAgentDir;
	}
});

test("loaded skills win over fallback discovery when both exist", () => {
	assert.deepEqual(
		mergeDiscoveredSkills([{ name: "implement", filePath: "/loaded/SKILL.md" }], [{ name: "implement", filePath: "/found/SKILL.md" }]),
		[{ name: "implement", filePath: "/loaded/SKILL.md" }],
	);
});
