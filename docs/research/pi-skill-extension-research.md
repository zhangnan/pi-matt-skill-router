# Pi 插件与 Skill 集成调研

日期：2026-09-02

## 结论

Pi 的 **Skill** 与 **Extension** 是两层不同机制：Skill 是按需读取的 Markdown 工作流；Extension 是启动时加载的 TypeScript 模块。要实现“在合适时提醒 Agent 精确执行已有 Skill”，最小且合适的设计不是把每份 Skill 改写成工具，而是一个 Extension 在 `before_agent_start` 中检查 Pi 已加载的 Skill 名单，按用户任务路由，并把“先读取实际 `SKILL.md`、再遵守其步骤”的短指令追加到本轮 system prompt。

本仓库据此实现了 `pi-matt-skill-router`。它不会伪造 Skill、不会复制其正文、也不会推荐本轮没有加载的 Skill。

## Pi 的一手行为

1. Pi 启动时只将各 Skill 的名称和描述放入 system prompt；模型匹配任务后应以 `read` 加载完整 `SKILL.md`。这是渐进披露机制，因此“提到一个 Skill”不等价于执行它。  
   来源：[Pi Skills — How Skills Work](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/skills.md#how-skills-work)；本机安装文档：`/Users/moo/.nvm/versions/node/v24.19.0/lib/node_modules/@earendil-works/pi-coding-agent/docs/skills.md`。
2. `before_agent_start` 在用户输入（及 Skill/template 展开）之后、Agent loop 之前触发；处理器能返回替换后的 `systemPrompt`，并能通过 `systemPromptOptions.skills` 读取本轮已加载的 Skills。  
   来源：[Pi Extensions — lifecycle / before_agent_start](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/extensions.md#before_agent_start)；本机安装文档：`…/docs/extensions.md`。
3. Extension 的 `input` hook 在 Skill command 展开之前运行；本项目不在这里改写用户输入，以免截获用户明确的 `/skill:name` 选择。  
   来源：[Pi Extensions — Input Events](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/extensions.md#input-events)。
4. 可发布的 Pi package 可在 `package.json` 的 `pi.extensions` 与 `pi.skills` 中声明资源；核心 Pi 包应作为 `peerDependencies`，不应被打包。  
   来源：[Pi Packages — Creating a Pi Package / Dependencies](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/packages.md#creating-a-pi-package)。

## 已有“Skill + 插件”实例（源码而非二手介绍）

### `pi-skillful`：最接近本需求的模式

[jvm/pi-mono 的 `pi-skillful`](https://github.com/jvm/pi-mono/tree/main/packages/pi-skillful) 是一个只声明 Extension 的 Pi package。它在 `before_agent_start` 读取 `event.systemPromptOptions.skills`，构造更新过的 Skill 列表，并返回修改后的 system prompt；同时保留 Skill 的正常发现和执行机制。  
来源：[package.json](https://github.com/jvm/pi-mono/blob/main/packages/pi-skillful/package.json)、[session skill toggles](https://github.com/jvm/pi-mono/blob/main/packages/pi-skillful/src/extensions/session-skill-toggles.ts)、[skill visibility](https://github.com/jvm/pi-mono/blob/main/packages/pi-skillful/src/extensions/skill-visibility.ts)。

本项目直接借鉴这一模式，但只附加任务路由提示，不重写 Pi 的 `<available_skills>` 区块：这样与其它 Skill-visibility extension 的冲突面更小。

### `pi-skill-selector`：Skill 管理而非路由

[@jamiefutch/pi-skill-selector](https://github.com/jamiefutch/pi-skill-selector) 是一个通过 package `pi.extensions` 暴露 `/skills` 命令的 Extension。它管理全局、项目和 npm package Skills 的启停，并明确要求变更后 `/reload` 才会重新加载资源。  
来源：[package manifest](https://github.com/jamiefutch/pi-skill-selector/blob/main/package.json)、[extension entry point](https://github.com/jamiefutch/pi-skill-selector/blob/main/extensions/pi-skill-selector.ts)。

它证明了“用 Extension 操控/呈现 Skill”是成熟的 Pi package 形式；但它的目标是启停，不适合承担本需求的工作流意图判断。

### Pi 官方动态资源示例

Pi 官方 `dynamic-resources` example 在 `resources_discover` 事件中返回 `skillPaths`，从 Extension 动态贡献 Skill 路径。  
来源：[官方示例源码](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/examples/extensions/dynamic-resources/index.ts)。

本项目不采用它，因为用户已有一套位于正常发现路径的 Skills；额外注册或复制会造成名称冲突和维护分叉。

## 实现取舍

- **采用**：`before_agent_start` + 已加载 Skill 名单 + 小型、可测试的正则路由表。每轮只在确有匹配时增加 prompt，且只显示实际可用的 Skill。
- **不采用**：自动把原 prompt 变成 `/skill:name`。这会覆盖显式用户选择，且一次请求可同时需要诊断和 TDD 等多个 Skill。
- **不采用**：把 Skill 正文硬编码进 Extension。它会与原 Skill 漂移，失去 Skill 的渐进披露与单一事实来源。
- **不采用**：动态注册一份复制的 Skill。已有 Skills 已能被 Pi 发现；重复注册可能出现同名冲突。

## 本仓库产物

- `extensions/index.ts`：Pi Extension 入口、显式 Skill 调用让位、TUI 状态和 `/matt-route <task>` 命令。
- `src/catalog.ts`：`skills.sh/mattpocock/skills` 2026-09-02 快照中的 53 项路由元数据；每项有类别、阶段、兼容性和高精度触发语。
- `src/config.ts`、`src/routing.ts`：可信项目 > 全局 > 默认值配置合并、可执行路由筛选与 prompt 渲染。
- `scripts/update-catalog.mjs`：只报告上游清单差异，绝不未经审查重写路由规则。
- `test/routing.test.ts`：全量覆盖计数、中文 Bug、缺失 Skill、类别开关、阶段顺序、Pi 不支持项和配置优先级回归测试。
- `package.json`：可发布的 scoped Pi package manifest。
