export type RouteCategory = "engineering" | "productivity" | "writing" | "adapted";
export type Compatibility = "native" | "adapted" | "unsupported";

export type RouteDefinition = {
	id: string;
	aliases?: string[];
	category: RouteCategory;
	compatibility: Compatibility;
	phase: string;
	reason: string;
	triggers: string[];
	adaptation?: string;
	suppressedBy?: string[];
};

const engineering = (id: string, reason: string, triggers: string[], phase = "current", extra: Partial<RouteDefinition> = {}) =>
	({ id, category: "engineering", compatibility: "native", phase, reason, triggers, ...extra }) as const;
const productivity = (id: string, reason: string, triggers: string[], extra: Partial<RouteDefinition> = {}) =>
	({ id, category: "productivity", compatibility: "native", phase: "standalone", reason, triggers, ...extra }) as const;
const writing = (id: string, reason: string, triggers: string[], extra: Partial<RouteDefinition> = {}) =>
	({ id, category: "writing", compatibility: "native", phase: "standalone", reason, triggers, ...extra }) as const;
const adapted = (id: string, reason: string, triggers: string[], adaptation: string, unsupported = false, extra: Partial<RouteDefinition> = {}) =>
	({ id, category: "adapted", compatibility: unsupported ? "unsupported" : "adapted", phase: "current", reason, triggers, adaptation, ...extra }) as const;
const piAdaptedEngineering = (id: string, reason: string, triggers: string[], adaptation: string, phase = "current", extra: Partial<RouteDefinition> = {}) =>
	({ id, category: "engineering", compatibility: "adapted", phase, reason, triggers, adaptation, ...extra }) as const;

// Source of truth: Matt Pocock Skills Chinese guide, based on upstream commit 6654f6b (2026-09-02).
// The guide lists 37 real SKILL.md files. Removed/legacy website entries are folded into triggers or aliases
// for their closest real skill only when the mapping is safe.
export const catalog: readonly RouteDefinition[] = [
	// Engineering: main chain, routing entry points, and codebase vocabulary.
	engineering("ask-matt", "The user explicitly asks which Matt skill or workflow to use before doing the work.", ["ask matt", "which skill", "what skill", "which workflow", "用哪个 skill", "用哪个技能", "下一步用什么", "该走哪个流程"]),
	piAdaptedEngineering("code-review", "The user asks to review a branch, PR, diff, or completed implementation against standards and spec.", ["code review", "pr review", "review this branch", "review diff", "review changes", "审查 pr", "审查代码", "代码审查", "检查改动", "检查 diff"], "Pi may lack the skill's sub-agent runtime; perform its Standards and Spec axes serially if delegation is unavailable."),
	engineering("codebase-design", "The request concerns module depth, public interfaces, seams, adapters, or code boundaries rather than business terminology.", ["codebase design", "deep module", "module boundary", "interface design", "design an interface", "api design", "seam", "adapter", "模块边界", "深模块", "接口设计", "设计接口", "可测试性", "我不确定这个接口设计", "我不确定这个模块设计", "我不确定这个边界", "我觉得这个模块", "我觉得这个接口"], "discovery"),
	engineering("diagnosing-bugs", "A real failure, regression, exception, flake, or performance problem requires a tight diagnostic loop before changing code.", ["diagnosing bugs", "diagnose", "/diagnose", "debug", "bug", "regression", "broken", "failing", "fails", "error", "exception", "slow", "performance", "报错", "异常", "故障", "回归", "不工作", "失败", "变慢", "性能", "修复 bug"], "diagnosis", { aliases: ["diagnose"] }),
	engineering("domain-modeling", "The request changes domain terminology, ubiquitous language, glossary, CONTEXT.md, or ADRs.", ["domain model", "domain modeling", "ubiquitous language", "glossary", "context.md", "adr", "architecture glossary", "global context", "maintain context", "领域模型", "共同语言", "统一术语", "业务术语", "决策记录", "词汇表", "架构", "维护", "全局", "架构术语", "全局术语", "维护 context", "维护上下文"], "discovery", { suppressedBy: ["codebase-design", "improve-codebase-architecture"] }),
	engineering("grill-with-docs", "A repository-scoped plan or product decision needs sustained clarification plus durable ADR/glossary updates.", ["grill with docs", "clarify with docs", "澄清并写文档", "带文档澄清", "访谈并沉淀", "写 adr", "沉淀 glossary", "我有一个想法", "讨论一个想法", "梳理一个想法", "澄清一个想法", "我不确定这个方案", "我不确定这个设计", "我不确定这个决策", "想确认这个方案", "想确认这个设计"], "discovery"),
	engineering("implement", "The user asks to implement one already-described spec, ticket, issue, or narrow task.", ["implement ticket", "implement issue", "execute ticket", "执行工单", "实现工单", "处理工单", "按票实现", "按规格实现", "按需求实现"], "implementation", { suppressedBy: ["implement-spec"] }),
	engineering("improve-codebase-architecture", "The user asks for architectural health, refactor opportunities, deepening opportunities, or module-shape improvements.", ["improve codebase architecture", "codebase architecture", "architecture health", "deepening opportunities", "refactor plan", "request refactor plan", "架构健康", "架构扫描", "架构改进", "架构改进机会", "重构计划", "重构方案", "模块形状"], "discovery"),
	engineering("prototype", "A disposable runnable experiment is needed to answer a UI, logic, or state-model design question before production work.", ["prototype", "proof of concept", "poc", "spike", "throwaway", "原型", "概念验证", "丢弃式", "状态机验证", "ui 原型", "验证想法", "验证点子", "试一下想法", "试一下点子", "做个原型验证", "想法验证", "点子验证"], "discovery"),
	piAdaptedEngineering("research", "The user requests primary-source research into official docs, APIs, SDKs, source code, or vendor facts.", ["research", "investigate", "official docs", "primary sources", "source research", "api docs", "sdk docs", "研究", "调研", "一手资料", "官方文档", "核对 api", "查官方", "供应商文档"], "Pi may lack background agents; research in the current session or use the configured Pi-equivalent delegation mechanism.", "discovery"),
	engineering("resolving-merge-conflicts", "A git merge or rebase is in progress and conflicts must be resolved hunk by hunk without aborting.", ["merge conflict", "rebase conflict", "resolve conflict", "resolving merge conflicts", "合并冲突", "变基冲突", "解决冲突", "冲突解决"], "diagnosis"),
	adapted("setup-matt-pocock-skills", "The repository needs the one-time Matt workflow/tracker/domain-doc setup.", ["setup matt pocock skills", "setup matt skills", "配置 matt skills", "初始化 matt workflow", "配置 tracker"], "Pi has no bundled tracker integration; follow the skill's repository setup steps."),
	engineering("tdd", "The user explicitly requests test-first or Red-Green-Refactor implementation, or an implement flow calls for a tight behavior test loop.", ["tdd", "test first", "red green refactor", "red-green-refactor", "测试驱动", "先写测试", "红绿重构", "集成测试"], "implementation"),
	engineering("to-spec", "Settled discussion needs to be synthesized into a coherent implementation spec; no more interviewing unless blocked.", ["to spec", "write a spec", "create spec", "specification", "prd", "product requirements", "形成规格", "写规格", "整理成 spec", "产品需求文档", "需求文档", "把想法整理成 spec", "把点子整理成需求", "把想法写成规格", "把想法变成需求文档"], "synthesis"),
	engineering("to-tickets", "A settled spec or plan needs to be split into agent-ready tracer-bullet tickets with blocking edges.", ["to tickets", "split into tickets", "create tickets", "to issues", "create issues", "拆分工单", "拆成工单", "创建 tickets", "创建 issues", "拆成 issue", "任务拆分"], "synthesis"),
	engineering("triage", "External or messy issues, PRs, backlog items, or tickets need classification, missing-info checks, and agent-ready briefs.", ["triage", "issue triage", "backlog triage", "整理 issue", "工单分流", "分诊", "分流", "整理 backlog", "梳理 issue", "外来请求"], "diagnosis"),
	engineering("wayfinder", "A large, multi-session, path-unclear project needs a decision-ticket map before specs or tickets.", ["wayfinder", "huge project", "large project", "too big for one session", "multi-session", "decision map", "decision mapping", "大型项目", "复杂项目", "跨多会话", "路线图", "决策地图", "路径不明"], "discovery"),
	engineering("wizard", "The user needs an interactive human-operated script for provisioning, credentials, dashboards, CI secrets, or one-off migrations.", ["wizard", "manual setup wizard", "human in the loop", "interactive setup", "provisioning", "credentials", "ci secrets", "配置向导", "交互式向导", "人工步骤", "密钥配置", "授权配置"]),

	// In-progress upstream skills. Keep their triggers explicit to avoid surprising automatic selection.
	adapted("claude-handoff", "The user wants Claude Code's background-agent handoff specifically.", ["claude handoff", "claude --bg", "claude 后台交接", "后台 claude"], "Pi has no Claude background-agent command; use `handoff` or a Pi sub-agent extension instead.", true),
	piAdaptedEngineering("implement-spec", "The user wants to execute an entire ticketed spec, often with frontier/blocker coordination across multiple tasks.", ["implement spec", "implement-spec", "execute spec", "整份 spec", "实现整份规格", "执行整个 spec", "根据规格实现", "批量执行工单"], "Pi may lack subagents/worktrees; coordinate sequentially unless an equivalent Pi extension is installed.", "implementation"),
	productivity("loop-me", "The user wants to design a recurring workflow or life/work loop as a stateful workflow spec.", ["loop me", "recurring workflow", "workflow spec", "设计工作流循环", "重复工作流", "周期性流程"]),
	adapted("retro", "The user asks for a retrospective of a coding session to improve future agent environment, docs, and seams.", ["retro", "retrospective", "session retro", "复盘", "复盘编码会话", "会话复盘"], "Load `writing-for-agents`; substitute Pi configuration for Claude-specific environment changes."),
	engineering("setup-ts-deep-modules", "The user asks to enforce TypeScript deep-module boundaries, usually with dependency-cruiser.", ["setup ts deep modules", "dependency-cruiser", "deep modules", "typescript 深模块", "ts 边界", "依赖边界"], "implementation"),
	writing("writing-fragments", "The user wants to explore raw writing fragments without imposing structure yet.", ["writing fragments", "raw fragments", "写作碎片", "发散写作", "收集素材"]),
	writing("writing-shape", "The user wants to shape a fixed pile of writing material into article sections, arguments, and transitions.", ["writing shape", "shape article", "article shape", "整理成文章", "文章结构", "塑造成文"]),
	writing("writing-beats", "The user wants to organize an article as reader-facing narrative beats and concept grounding.", ["writing beats", "article beats", "beats", "文章节拍", "叙事节拍", "读者旅程"]),

	// Miscellaneous real skills.
	adapted("git-guardrails-claude-code", "The user asks for Claude Code hooks that block destructive git commands.", ["git guardrails", "claude code git", "block git push", "block reset hard", "阻止 git push", "阻止 reset", "git 安全钩子"], "This is Claude Code-specific; use only when that environment is present.", true),
	engineering("migrate-to-shoehorn", "The user requests migrating tests away from `as` assertions to @total-typescript/shoehorn helpers.", ["shoehorn", "@total-typescript/shoehorn", "replace as assertions", "as assertions", "替换 as 断言", "测试断言迁移"], "implementation"),
	engineering("scaffold-exercises", "The user asks to scaffold lintable course exercise sections, problems, solutions, or explainers.", ["scaffold exercises", "exercise scaffold", "course exercises", "脚手架练习", "练习脚手架", "课程练习"], "implementation"),
	engineering("setup-pre-commit", "The user asks to add Husky/lint-staged/Prettier/typecheck/test pre-commit quality gates.", ["setup pre commit", "pre-commit", "husky", "lint-staged", "pre commit hook", "提交前钩子", "提交前检查", "格式化 gate"], "implementation"),

	// Productivity and writing support skills.
	productivity("grill-me", "The user wants a plan or design stress-tested without repository documentation output.", ["grill me", "grill my", "stress test my", "拷问我", "质询方案", "压力测试方案", "挑战我的计划"]),
	productivity("grilling", "The user wants the raw grilling interview primitive: relentless questions about assumptions, constraints, failures, and tradeoffs.", ["grilling", "grill", "stress test", "拷问", "质询", "追问", "压力测试"], { suppressedBy: ["grill-me", "grill-with-docs"] }),
	productivity("handoff", "The user wants a portable cross-session or cross-harness handoff document, not merely normal compaction.", ["handoff", "交接", "换会话", "跨会话", "交接文档", "交给同事", "换目录继续"], { suppressedBy: ["claude-handoff"] }),
	productivity("teach", "The user wants a stateful learning flow with lessons, exercises, mission, and resources.", ["teach me", "teach", "learn", "learning plan", "教我", "学习", "学习计划", "课程"]),
	productivity("to-questionnaire", "The user needs to turn unknowns into a questionnaire for another human or team.", ["to questionnaire", "create questionnaire", "questionnaire", "ask someone else", "问卷", "调查问卷", "给别人提问", "询问法务", "采访他人"]),
	productivity("wait-what", "The user says the previous explanation did not land and wants an immediate plain-language re-explanation.", ["wait what", "i don't get it", "explain again", "没听懂", "重新解释", "再说一遍", "什么意思", "听不懂", "我认为你做的不对", "你说的不对", "纠正一下", "请纠正", "调整一下", "请调整"]),
	productivity("writing-for-agents", "The user asks to write or improve agent-facing docs, Skills, AGENTS.md, CLAUDE.md, or context pointers.", ["writing for agents", "write a skill", "create a skill", "writing great skills", "agents.md", "claude.md", "skill 写作", "写好 skill", "开发 skill", "创建 skill", "为 agent 写文档", "agent 文档"]),
];
