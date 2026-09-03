# @zhangnan555/pi-matt-skill-router

> **English**: [README.md](./README.md)

一个 [Pi](https://pi.dev) 扩展：把请求路由到合适的已安装 [Matt Pocock Skills](https://www.skills.sh/mattpocock/skills)。它不会复制、安装或冒充某个 Skill——它只是告诉 agent 在干活之前先去读取真实的 `SKILL.md`。

## 它能做什么

- 收录 Matt Pocock 2026-09-02 指南中的 37 个真实 `SKILL.md` 条目；已删除/遗留的网站条目仅在被认为安全时才映射到真实技能。
- 只对高置信度的任务信号进行路由，并按阶段排序：诊断 → 探索 → 综合 → 实现。
- 只执行 Pi 实际已加载的 Skills；缺失的匹配会如实披露，绝不捏造。
- 尊重显式的 `/skill:name` 与显式跳过工作流的请求。
- 把宿主相关的工作流标注为 `native`（原生）、`Pi-adapted`（Pi 适配）或 `unsupported in Pi`（Pi 不支持）。
- 在 Pi TUI 状态栏显示选中的路由。运行 `/matt-route <任务>` 可查看其理由、阶段、兼容性、配置状态与可用性。

## 它是如何工作的

举个简单的例子：你说“这个接口一直报错”，插件会认出这属于 `diagnosing-bugs`（排查 bug），于是在 agent 开工前悄悄补一句提醒：“先读取 `diagnosing-bugs` 的 SKILL.md，按它的诊断流程执行。”

1. 内置一份“技能目录”——每个 Matt Pocock 技能配一组高置信度的中英文触发词（如 `debug`、`regression`、`报错`、`回归` → `diagnosing-bugs`）。
2. 你每发一条消息，它就拿输入去比对触发词；命中后按阶段排序：诊断 → 探索 → 综合 → 实现。
3. 只路由到真实已安装的技能：把“读取哪个 SKILL.md 并照做”追加进本轮 system prompt，并在状态栏显示选中的路由。

## 为什么这样设计（好处）

- **不用背技能名。** 你不需要记住 30+ 个技能、也不用手动敲 `/skill:`——用大白话描述需求，就会被引导到正确的工作流。
- **不复制、不冒充。** 插件从不复制 SKILL.md 正文，技能内容始终以原仓库为单一事实来源，不会因复制而漂移过期。
- **诚实且尊重你。** 你自己显式运行 `/skill:name` 时它会主动让路；匹配到的技能没安装就明说“未安装”，绝不假装执行过。
- **可配置。** 可以整体开关类别、禁用个别技能，也可以补充你自己的触发词。

## 安装

```bash
# 全局
pi install npm:@zhangnan555/pi-matt-skill-router

# 项目本地
pi install -l npm:@zhangnan555/pi-matt-skill-router
```

从本仓库开发安装：

```bash
pi install .
# 重启 Pi 或运行 /reload。
```

Matt Pocock Skills 需要单独安装；Pi 必须能从其配置的 Skill 路径正常发现它们。本包不捆绑它们。

## 配置

配置为可选的 JSON。项目配置仅在 Pi 信任该项目后才会读取。

1. `~/.pi/agent/matt-skill-router.json`
2. `<项目>/.pi/matt-skill-router.json`

项目配置覆盖全局配置；`disabledSkills` 会累积合并。

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

默认启用全部四个类别（`engineering`、`productivity`、`writing`、`adapted`）。无论类别设置如何，`unsupported` 条目永远不会被自动选中。

## 目录更新

路由目录刻意固定版本到 2026-09-02 的 Matt Pocock Skills 指南，而不是随 `skills.sh` 静默变化。显式检查：

```bash
npm run check:catalog
```

该命令会报告增删项，若有差异则失败。发布新版本前，为每个新条目补充类别、兼容性、触发词与测试。

## 验证

```bash
npm install
npm run typecheck
npm test
npm run check:catalog
```
