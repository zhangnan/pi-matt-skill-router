import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { RouterConfig } from "./routing.js";

const FILE_NAME = "matt-skill-router.json";

function readConfig(path: string): RouterConfig {
	if (!existsSync(path)) return {};
	try {
		const value: unknown = JSON.parse(readFileSync(path, "utf8"));
		return value && typeof value === "object" && !Array.isArray(value) ? (value as RouterConfig) : {};
	} catch {
		return {};
	}
}

export function loadConfig(cwd: string, trusted: boolean, configDirName = ".pi"): { global: RouterConfig; project: RouterConfig } {
	const agentDir = process.env.PI_CODING_AGENT_DIR ?? join(homedir(), ".pi", "agent");
	return {
		global: readConfig(join(agentDir, FILE_NAME)),
		project: trusted ? readConfig(join(cwd, configDirName, FILE_NAME)) : {},
	};
}

export { FILE_NAME };
