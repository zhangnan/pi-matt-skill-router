import { CONFIG_DIR_NAME, type ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { loadConfig } from "../src/config.js";
import { discoverMattSkills, mergeDiscoveredSkills } from "../src/skill-discovery.js";
import { executableRoutes, matchingRoutes, mergeConfig, renderRouteReport, renderRoutingGuidance } from "../src/routing.js";

export default function mattSkillRouter(pi: ExtensionAPI) {
	let explicitSkillRequested = false;

	pi.on("input", (event) => {
		explicitSkillRequested = /^\/skill:[a-z0-9-]+/i.test(event.text.trim());
		return { action: "continue" };
	});

	pi.on("before_agent_start", (event, ctx) => {
		if (explicitSkillRequested) {
			explicitSkillRequested = false;
			return;
		}
		const { global, project } = loadConfig(ctx.cwd, ctx.isProjectTrusted(), CONFIG_DIR_NAME);
		const config = mergeConfig(global, project);
		const loadedSkills = event.systemPromptOptions.skills?.map((skill) => ({ name: skill.name, filePath: skill.filePath })) ?? [];
		const installedSkills = mergeDiscoveredSkills(loadedSkills, discoverMattSkills(ctx.cwd, CONFIG_DIR_NAME));
		const matches = matchingRoutes(event.prompt, installedSkills, config);
		const guidance = renderRoutingGuidance(matches, config.warnMissingSkills ?? true);
		const selected = executableRoutes(matches);
		if (ctx.mode === "tui" && selected.length > 0) {
			ctx.ui.setStatus("matt-skill-router", `skills: ${selected.map((route) => route.installedName).join(" → ")}`);
		}
		if (!guidance) return;
		return { systemPrompt: `${event.systemPrompt}\n\n${guidance}` };
	});

	pi.on("agent_settled", (_event, ctx) => ctx.ui.setStatus("matt-skill-router", undefined));
	pi.on("session_shutdown", (_event, ctx) => ctx.ui.setStatus("matt-skill-router", undefined));

	pi.registerCommand("matt-route", {
		description: "Explain Matt Skills routing for a task",
		handler: async (args, ctx) => {
			const task = args.trim();
			if (!task) {
				ctx.ui.notify("Usage: /matt-route <task description>", "warning");
				return;
			}
			const { global, project } = loadConfig(ctx.cwd, ctx.isProjectTrusted(), CONFIG_DIR_NAME);
			const config = mergeConfig(global, project);
			const loadedSkills = ctx.getSystemPromptOptions().skills?.map((skill) => ({ name: skill.name, filePath: skill.filePath })) ?? [];
			const installedSkills = mergeDiscoveredSkills(loadedSkills, discoverMattSkills(ctx.cwd, CONFIG_DIR_NAME));
			ctx.ui.notify(renderRouteReport(matchingRoutes(task, installedSkills, config)), "info");
		},
	});
}
