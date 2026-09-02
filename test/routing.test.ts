import assert from "node:assert/strict";
import test from "node:test";
import { catalog } from "../src/catalog.js";
import { executableRoutes, matchingRoutes, mergeConfig, renderRouteReport, renderRoutingGuidance } from "../src/routing.js";

test("catalog covers the real SKILL.md entries from the 2026-09-02 guide", () => {
	assert.equal(catalog.length, 37);
	assert.equal(new Set(catalog.map((route) => route.id)).size, 37);
	assert.equal(catalog.some((route) => route.id === "qa"), false);
	assert.equal(catalog.some((route) => route.id === "to-prd"), false);
});

test("routes a Chinese bug report to diagnosing-bugs", () => {
	assert.deepEqual(
		executableRoutes(matchingRoutes("这个回归报错了，帮我修", ["diagnosing-bugs"])).map((route) => route.id),
		["diagnosing-bugs"],
	);
});

test("reports a matching skill that is not loaded instead of pretending it ran", () => {
	const matches = matchingRoutes("请研究官方文档", []);
	assert.match(renderRoutingGuidance(matches) ?? "", /not loaded/);
	assert.match(renderRouteReport(matches), /not loaded/);
});

test("uses broad intent routing when no catalogue trigger matches", () => {
	assert.deepEqual(executableRoutes(matchingRoutes("检查当前最新的任务", ["triage"])).map((route) => route.id), ["triage"]);
	assert.deepEqual(executableRoutes(matchingRoutes("执行", ["implement"])).map((route) => route.id), ["implement"]);
	assert.deepEqual(executableRoutes(matchingRoutes("为什么这里不工作", ["diagnosing-bugs"])).map((route) => route.id), ["diagnosing-bugs"]);
});

test("defaults to engineering only and allows an explicit productivity category", () => {
	assert.equal(executableRoutes(matchingRoutes("请 grill 我的方案", ["grilling"])).length, 0);
	assert.deepEqual(
		executableRoutes(matchingRoutes("请 grill 我的方案", ["grilling"], { enabledCategories: ["engineering", "productivity"] })).map((route) => route.id),
		["grilling"],
	);
});

test("orders diagnosis before implementation", () => {
	assert.deepEqual(
		executableRoutes(matchingRoutes("diagnose this regression then implement spec", ["diagnosing-bugs", "implement-spec"])).map((route) => route.id),
		["diagnosing-bugs", "implement-spec"],
	);
});

test("marks Claude-specific routes unsupported and excludes generic handoff when a more specific route matches", () => {
	const matches = matchingRoutes("create a claude handoff", ["claude-handoff", "handoff"], { enabledCategories: ["adapted", "productivity"] });
	assert.deepEqual(matches.map((route) => route.id), ["claude-handoff"]);
	assert.equal(executableRoutes(matches).length, 0);
	assert.match(renderRoutingGuidance(matches) ?? "", /unsupported in Pi/);
});

test("folds removed website entries into real skills where safe", () => {
	assert.deepEqual(executableRoutes(matchingRoutes("write a PRD", ["to-spec"])).map((route) => route.id), ["to-spec"]);
	assert.deepEqual(executableRoutes(matchingRoutes("create issues from this spec", ["to-tickets"])).map((route) => route.id), ["to-tickets"]);
	assert.deepEqual(executableRoutes(matchingRoutes("design an interface", ["codebase-design"])).map((route) => route.id), ["codebase-design"]);
});

test("does not route generic project planning to wayfinder unless the task is large or path-unclear", () => {
	assert.deepEqual(executableRoutes(matchingRoutes("帮我梳理这个方案", ["grill-with-docs"])).map((route) => route.id), ["grill-with-docs"]);
	assert.deepEqual(executableRoutes(matchingRoutes("帮我规划大型迁移项目路线图", ["wayfinder"])).map((route) => route.id), ["wayfinder"]);
});

test("project configuration overrides categories while disabled skills accumulate", () => {
	assert.deepEqual(
		mergeConfig({ enabledCategories: ["engineering"], disabledSkills: ["tdd"] }, { enabledCategories: ["writing"], disabledSkills: ["research"] }),
		{ enabledCategories: ["writing"], disabledSkills: ["tdd", "research"], extraTriggers: {} },
	);
});
