# 开发指南

## Prerequisites

- Node 20+ 与 pnpm 10+（`corepack enable`——仓库通过 `packageManager` 固定精确版本）
- 通过 [rustup](https://rustup.rs) 安装 Rust stable
- Tauri v2 系统依赖——见[官方清单](https://v2.tauri.app/start/prerequisites/)：
  - **macOS**：Xcode 命令行工具
  - **Linux**: `libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf libssl-dev`
  - **Windows**：WebView2（Win 11 已预装）、MSVC 构建工具

## 常用命令

| Command | What it does |
| --- | --- |
| `pnpm install` | install all workspace deps |
| `pnpm icons` | generate placeholder app icons (required once before `tauri dev`) |
| `pnpm tauri:dev` | run the full desktop app (Vite + Rust, hot reload both sides) |
| `pnpm dev` | frontend only, in the browser, on the built-in **demo dataset** |
| `pnpm typecheck` | TypeScript across all packages |
| `pnpm test` / `pnpm test:watch` | unit tests (Vitest) |
| `pnpm test:e2e` | Playwright against demo mode |
| `cd apps/desktop/src-tauri && cargo test` | git engine integration tests (real temp repos) |
| `pnpm tauri:build` | production bundles (.dmg/.msi/.deb/.AppImage) |
| `pnpm release:mac` | build, then open the folder containing the .dmg |
| `pnpm install:mac` | copy the built AngKorGit.app into /Applications and launch it |
| `pnpm website` | dev-server the marketing site (http://localhost:4321/) |
| `pnpm website:build` / `pnpm website:preview` | build / preview the static site |
| `pnpm website:images` | regenerate WebP screenshots + og.png from `docs/assets` |

## Demo mode

`src/core/ipc.ts` 检测自身是否运行在 Tauri 内。在外部（纯浏览器）时，每个命令由 `src/core/demo.ts` 应答——一个确定性的 400 次提交合成仓库，含分支、合并、脏工作副本与冲突样例。所有 UI 开发都用它；CI 的 Playwright 任务测的也是它。

## 在 Rust 引擎上开发

引擎位于 `apps/desktop/src-tauri/src/core/`，每个领域一个模块。约定：

- 命令层（`commands.rs`）保持轻薄——解析参数、调用 `core::*`、返回 serde 类型。
- 一切阻塞操作都经过 `blocking()` 辅助函数（`spawn_blocking`）。
- 任何可能让仓库处于中间状态的操作（合并、变基、拣选）都返回 `OpOutcome`，`status: "conflicts"` 而非错误。
- 每个新引擎函数都要在 `tests/git_engine.rs` 中补充集成测试——测试在临时目录创建真实仓库。

## 新增 AI 提供方

1. 在 `packages/core/src/ai/providers.ts` 中实现适配器（一个函数，约 40 行）。
2. 在 `createAiProvider` 和 `AI_PROVIDER_PRESETS` 中注册它。
3. 完成——设置 UI、能力与传输层会自动接管。

已安装的 AI-CLI 代理（Claude Code、Codex、Gemini CLI、OpenCode）遵循另一条
路径：在 `packages/core/src/ai/cliAgents.ts` 中加入代理的 argv/stdin 形态，并把它的
二进制加入 `apps/desktop/src-tauri/src/ai_cli.rs` 的白名单。

## Release

打上 `v*` 标签并推送：`.github/workflows/release.yml` 通过 `tauri-action` 构建 macOS（universal）、Windows 与 Linux 安装包，并附加到草稿版 GitHub release。
