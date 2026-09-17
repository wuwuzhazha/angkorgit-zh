# 上游更新分析与 v0.15.1 同步方案

日期：2026-09-17。

## 范围与来源

- 通知事实来源：[上游更新 Issue #4](https://github.com/wuwuzhazha/angkorgit-zh/issues/4)。
- 上游：[cheat2001/angkorgit](https://github.com/cheat2001/angkorgit)。
- 中文版发布仓库：[wuwuzhazha/angkorgit-zh](https://github.com/wuwuzhazha/angkorgit-zh)。
- 同步前主分支：`900c310146f34d45732fabc2084d6817e0f0a992`；已发布中文版为 v0.14.2。
- 共同祖先：`901815be00b84502e68299b59573b1eb3359dbe4`。
- 固定目标：`b3faaf16b087f15e60daf5cd85b051af94224ca5`，不是执行时任意漂移的上游 main。
- 用户确认：中文版 v0.15.1，通过 PR 与完整验证后，发布 Windows GitHub Release 及应用内更新。

## 上游差异

共 11 个提交，43 个文件，1,251 行新增、79 行删除。

| 类别 | 内容 | 主要路径 |
| --- | --- | --- |
| 协作功能 | 添加远端、跨 Fork PR/MR、目标仓库选择 | `apps/desktop/src/features/sidebar/Sidebar.tsx`、`apps/desktop/src/features/forge/CreatePrDialog.tsx`、`packages/core/src/forge` |
| 克隆与终端 | 默认克隆目录、终端右键菜单 | `apps/desktop/src/features/settings/SettingsDialog.tsx`、`apps/desktop/src/features/repository/CloneDialog.tsx`、`apps/desktop/src/features/terminal/TerminalPanel.tsx` |
| 差异显示 | 长行渲染上限、选区保持、横向滚动优化 | `apps/desktop/src/features/diff`、`packages/core/src/diff/renderCap.ts` |
| Windows | OpenSSL 版 libssh2；文件管理器正确定位 | `apps/desktop/src-tauri/Cargo.toml`、`apps/desktop/src-tauri/src/commands.rs` |
| Linux | 尽力应用紧凑 Wayland 标题栏，不影响启动 | `apps/desktop/src-tauri/src/lib.rs` |
| 测试与说明 | 远端、平台适配器、差异与浏览器回归 | `tests/unit`、`tests/e2e`、`apps/desktop/src-tauri/tests/git_engine.rs` |

## 风险与处理

1. **不能全量翻译扫描结果。** 通知中的 810 条是待译/待确认项，包含技术字符串；扫描还跳过模板插值和无引号的 JSX 文本，因此也不能用数量变少证明汉化完整。
2. **保留中文分支定制。** 合并后恢复 `README.md`、`docs`、`apps/website`，再人工迁移上游有效改动。保持包名 `angkorgit-zh`，保持更新地址及 `zh-dict/updater-pubkey.txt` 对应的公钥。
3. **短词使用严格约束。** 本次新增 43 条词典规则；短词使用整字面量匹配或行级锚点，带变量文案保留全部插值与技术标识符。
4. **错误消息与断言一起更新。** 新远端测试原先断言英文 `required`/`already exists`，但空名称错误已被旧词典译为中文，必须同步断言。
5. **Windows 构建依赖变化。** OpenSSL 编译需要原生 Windows Perl；Git Bash 内的 Cygwin Perl不能直接视为满足此要求。CI 的 Windows 原生工具链与正式构建都必须通过。
6. **下载渠道须与产物一致。** 本次只发布 Windows 中文版。macOS/Linux 下载链接明确指向上游原版，不能生成不存在的中文版下载地址。
7. **保留同步祖先关系。** PR 使用合并提交，不用压缩合并或变基合并丢失上游祖先；不强推主分支或覆盖已有发布标签。
8. **隔离用户工作区。** 在独立工作树与同步分支完成操作，不把原工作区的未跟踪文件加入提交，不改变原远端配置。

## 验证与发布闸门

- `pnpm check:dict`、`pnpm check:copy`。
- `pnpm typecheck`、`pnpm test`、桌面前端和网站构建。
- Playwright 全量测试，重点核验新增远端、克隆目录、终端菜单和差异选区。
- `cargo fmt --check`；GitHub CI 的 Linux/macOS/Windows clippy 与引擎测试。
- `tests/unit/localization.test.ts` 额外保护新功能文案、模板变量、GitLab 错误处理、版本号和更新公钥。
- PR 全绿后以匹配的头提交合并，按 `.github/workflows/release-zh.yml` 发布 v0.15.1。
- 核验 Release 标签、版本、NSIS/MSI、签名文件和 `latest.json`，并核验最终下载与更新地址。

分析和发布文案保存在 `docs`；机器日志、待译扫描和测试产物不放入文档目录。此文件记录范围、判断与验证要求，不将计划中的检查标记为已通过。

发布说明见 [docs/mcp-release-v0.15.1.md](mcp-release-v0.15.1.md)，长期流程见 [docs/Localization.md](Localization.md)。
