import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { catalog } from "./catalog.js";
import type { InstalledSkill } from "./routing.js";

const skillNames = catalog.flatMap((route) => [route.id, ...(route.aliases ?? [])]);

function findGitRepoRoot(cwd: string): string | undefined {
	let current = resolve(cwd);
	while (true) {
		if (existsSync(join(current, ".git"))) return current;
		const parent = dirname(current);
		if (parent === current) return undefined;
		current = parent;
	}
}

function agentsSkillDirs(cwd: string): string[] {
	const dirs: string[] = [];
	const gitRoot = findGitRepoRoot(cwd);
	let current = resolve(cwd);
	while (true) {
		dirs.push(join(current, ".agents", "skills"));
		if (gitRoot && current === gitRoot) return dirs;
		const parent = dirname(current);
		if (parent === current) return dirs;
		current = parent;
	}
}

function addIfPresent(skills: Map<string, InstalledSkill>, name: string, filePath: string): void {
	if (!skills.has(name) && existsSync(filePath)) skills.set(name, { name, filePath });
}

export function discoverMattSkills(cwd: string, configDirName = ".pi"): InstalledSkill[] {
	const skills = new Map<string, InstalledSkill>();
	const agentDir = process.env.PI_CODING_AGENT_DIR ?? join(homedir(), ".pi", "agent");
	const roots = [
		// Match Pi auto-discovery precedence for fallback path discovery:
		// project auto-discovered skills first, then user auto-discovered skills.
		join(resolve(cwd), configDirName, "skills"),
		...agentsSkillDirs(cwd),
		join(agentDir, "skills"),
		join(homedir(), ".agents", "skills"),
	];
	for (const root of roots) {
		for (const name of skillNames) addIfPresent(skills, name, join(root, name, "SKILL.md"));
	}
	return [...skills.values()];
}

export function mergeDiscoveredSkills(loadedSkills: InstalledSkill[], discoveredSkills: InstalledSkill[]): InstalledSkill[] {
	const merged = new Map<string, InstalledSkill>();
	for (const skill of [...loadedSkills, ...discoveredSkills]) {
		const name = typeof skill === "string" ? skill : skill.name;
		if (!merged.has(name)) merged.set(name, skill);
	}
	return [...merged.values()];
}
