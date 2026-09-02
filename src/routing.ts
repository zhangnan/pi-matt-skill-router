import { catalog, type Compatibility, type RouteCategory, type RouteDefinition } from "./catalog.js";

export type RouterConfig = {
	enabledCategories?: RouteCategory[];
	disabledSkills?: string[];
	extraTriggers?: Record<string, string[]>;
	warnMissingSkills?: boolean;
};

export type InstalledSkill = string | { name: string; filePath?: string };

export type RouteMatch = RouteDefinition & {
	installedName: string | undefined;
	installedPath: string | undefined;
	enabled: boolean;
};

const defaultCategories: RouteCategory[] = ["engineering"];
const phaseOrder = ["diagnosis", "discovery", "synthesis", "implementation", "current", "standalone"];

const broadIntentRules: Array<{ routeIds: string[]; patterns: RegExp[] }> = [
	{
		routeIds: ["triage"],
		patterns: [/(检查|查看|寻找|找|确认|梳理).{0,12}(任务|工单|issue|ticket|backlog)/i, /(current|latest).{0,12}(task|ticket|issue)/i],
	},
	{
		routeIds: ["implement"],
		patterns: [/^(执行|开始|处理|继续|落实|做)$/i, /(执行|开始|处理|继续|落实).{0,12}(任务|工单|ticket|issue|spec|规格|需求|计划|方案)/i],
	},
	{
		routeIds: ["diagnosing-bugs"],
		patterns: [/(为什么|原因|怎么回事|哪里不对|失败|报错|异常|故障|不工作|修一下)/i, /\b(why|reason|fail|fails|error|broken|fix)\b/i],
	},
	{
		routeIds: ["research"],
		patterns: [/(查找|寻找|查询|核对|调研|研究).{0,16}(资料|文档|官方|api|来源|证据)/i, /\b(find|search|look up|research|docs?|api)\b/i],
	},
	{
		routeIds: ["code-review"],
		patterns: [/(检查|查看|审查|review).{0,12}(代码|分支|pr|diff|改动)/i, /\b(review|inspect).{0,16}(code|branch|pr|diff|changes)\b/i],
	},
	{
		routeIds: ["wayfinder"],
		patterns: [/(大型|复杂|跨多会话|多 session|路径不明|路线图).{0,16}(项目|迁移|计划|规划|方案|怎么做)/i, /\b(huge|large|complex|multi-session|too big|unclear path).{0,24}(project|migration|plan|roadmap|approach)\b/i],
	},
	{
		routeIds: ["grill-with-docs"],
		patterns: [/(澄清|梳理|讨论|设计|确定).{0,16}(方案|计划|需求|决策|取舍)/i, /\b(clarify|work through|discuss|shape).{0,20}(plan|design|decision|requirements|tradeoffs)\b/i],
	},
];

export function mergeConfig(globalConfig: RouterConfig, projectConfig: RouterConfig): RouterConfig {
	return {
		...globalConfig,
		...projectConfig,
		enabledCategories: projectConfig.enabledCategories ?? globalConfig.enabledCategories,
		disabledSkills: [...new Set([...(globalConfig.disabledSkills ?? []), ...(projectConfig.disabledSkills ?? [])])],
		extraTriggers: { ...globalConfig.extraTriggers, ...projectConfig.extraTriggers },
	};
}

function escapeRegExp(text: string): string {
	return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function includesTrigger(text: string, trigger: string): boolean {
	const normalizedText = text.toLocaleLowerCase();
	const normalizedTrigger = trigger.toLocaleLowerCase().trim();
	if (/^[a-z0-9][a-z0-9\s/_-]*$/i.test(normalizedTrigger)) {
		return new RegExp(`(^|[^a-z0-9])${escapeRegExp(normalizedTrigger)}([^a-z0-9]|$)`, "i").test(normalizedText);
	}
	return normalizedText.includes(normalizedTrigger);
}

function skillMap(installedSkills: Iterable<InstalledSkill>): Map<string, string | undefined> {
	return new Map(
		[...installedSkills].map((skill) => typeof skill === "string" ? [skill, undefined] : [skill.name, skill.filePath]),
	);
}

function installedName(route: RouteDefinition, skills: Map<string, string | undefined>): string | undefined {
	return [route.id, ...(route.aliases ?? [])].find((name) => skills.has(name));
}

function routeMatch(route: RouteDefinition, skills: Map<string, string | undefined>, enabledCategories: Set<RouteCategory>, disabled: Set<string>): RouteMatch {
	const installed = installedName(route, skills);
	return {
		...route,
		installedName: installed,
		installedPath: installed ? skills.get(installed) : undefined,
		enabled: enabledCategories.has(route.category) && !disabled.has(route.id),
	};
}

function broadIntentRouteIds(text: string): string[] {
	for (const rule of broadIntentRules) {
		if (rule.patterns.some((pattern) => pattern.test(text))) return rule.routeIds;
	}
	return [];
}

export function matchingRoutes(text: string, installedSkills: Iterable<InstalledSkill>, config: RouterConfig = {}): RouteMatch[] {
	const skills = skillMap(installedSkills);
	const enabledCategories = new Set(config.enabledCategories ?? defaultCategories);
	const disabled = new Set(config.disabledSkills ?? []);

	const explicitMatches = catalog
		.map((route) => {
			const triggers = [...route.triggers, ...(config.extraTriggers?.[route.id] ?? [])];
			const matches = triggers.some((trigger) => includesTrigger(text, trigger));
			if (!matches) return undefined;
			return routeMatch(route, skills, enabledCategories, disabled);
		})
		.filter((route): route is RouteMatch => route !== undefined);

	const matches = explicitMatches.length > 0
		? explicitMatches
		: broadIntentRouteIds(text)
			.map((id) => catalog.find((route) => route.id === id))
			.filter((route): route is RouteDefinition => route !== undefined)
			.map((route) => routeMatch(route, skills, enabledCategories, disabled));

	const matchedIds = new Set(matches.map((route) => route.id));
	return matches
		.filter((route) => !route.suppressedBy?.some((id) => matchedIds.has(id)))
		.sort((a, b) => phaseOrder.indexOf(a.phase) - phaseOrder.indexOf(b.phase));
}

export function executableRoutes(matches: RouteMatch[]): RouteMatch[] {
	return matches.filter((route) => route.enabled && route.installedName && route.compatibility !== "unsupported");
}

function label(compatibility: Compatibility): string {
	return compatibility === "native" ? "native" : compatibility === "adapted" ? "Pi-adapted" : "unsupported in Pi";
}

export function renderRoutingGuidance(matches: RouteMatch[], warnMissingSkills = true): string | undefined {
	const executable = executableRoutes(matches);
	const missing = matches.filter((route) => route.enabled && !route.installedName);
	const unsupported = matches.filter((route) => route.enabled && route.installedName && route.compatibility === "unsupported");
	if (executable.length === 0 && (!warnMissingSkills || missing.length === 0) && unsupported.length === 0) return undefined;

	const lines: string[] = ["## Matt Skills routing"];
	if (executable.length > 0) {
		lines.push("Follow these stages in order; before substantive work, use `read` to load every listed real SKILL.md and follow it exactly. Treat these routed skills as the selected workflow for this turn, and do not load unrelated skills merely because their default descriptions are also visible:");
		for (const route of executable) {
			const location = route.installedPath ? ` (${route.installedPath})` : "";
			lines.push(`- [${route.phase}; ${label(route.compatibility)}] \`${route.installedName}\`${location} — ${route.reason}`);
			if (route.adaptation) lines.push(`  Pi adaptation: ${route.adaptation}`);
		}
	}
	if (warnMissingSkills && missing.length > 0) {
		lines.push(`Matching skills not loaded in this session: ${missing.map((route) => `\`${route.id}\``).join(", ")}. State this briefly if relevant; do not claim to have executed or installed them.`);
	}
	for (const route of unsupported) {
		lines.push(`\`${route.installedName}\` is unsupported in Pi: ${route.adaptation ?? "do not assume its host-specific capability exists."}`);
	}
	lines.push("An explicit user `/skill:name` invocation or instruction to skip a workflow takes precedence; do not replace it.");
	return lines.join("\n");
}

export function renderRouteReport(matches: RouteMatch[]): string {
	if (matches.length === 0) return "No high-confidence Matt Skills route matched this task.";
	return matches
		.map((route) => {
			const availability = route.installedName ? `loaded as \`${route.installedName}\`${route.installedPath ? ` at ${route.installedPath}` : ""}` : "not loaded";
			const state = route.enabled ? "enabled" : "disabled by configuration";
			return `- \`${route.id}\` — ${route.phase}; ${label(route.compatibility)}; ${availability}; ${state}. ${route.reason}`;
		})
		.join("\n");
}
