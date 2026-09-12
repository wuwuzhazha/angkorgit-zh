# 为 AngKorGit 做贡献

感谢你让日常 Git 变得令人愉悦！🙏

## 基本规则

- 友善待人。我们遵循[贡献者公约](https://www.contributor-covenant.org/version/2/1/code_of_conduct/)。
- **Quality over quantity.** AngKorGit deliberately implements few features exceptionally well. New feature proposals should explain why the feature is *daily-use* — "GitKraken 有它" is not a reason.
- 先讨论再动手：任何大于一次修复的改动，先开 issue。

## Workflow

1. Fork 并从 `main` 建分支：`feature/<short-name>` 或 `fix/<short-name>`。
2. 按 [Development.md](Development.md) 搭建环境；按 [Coding-Standards.md](Coding-Standards.md) 做出改动。
3. 确保本地门禁通过：
   ```bash
   pnpm typecheck && pnpm test
   cd apps/desktop/src-tauri && cargo fmt --check && cargo clippy --all-targets -- -D warnings && cargo test
   ```
4. Open a PR with a conventional-commit title, a short "why", and screenshots for UI changes.
5. Keep commit messages clean. `Co-authored-by` is for people who wrote the change with
   you. Trailers left by coding tools (`Co-authored-by: Cursor`, `Generated with …`,
   a robot emoji) fail the "Commit messages" CI check, so amend or squash them away
   before you push.

## 怎样的首个贡献最合适

- 新增语法高亮语言（`src/shared/highlight.ts`）
- 新增 AI 提供方适配器（`packages/core/src/ai/providers.ts`）
- 提交图渲染打磨、新增键盘快捷键、无障碍改进
- 引擎测试覆盖（`tests/git_engine.rs`）

## 报告缺陷

请包含：操作系统、应用版本、你执行的操作、预期与实际，以及——若仓库状态相关——一个能复现仓库形态的最小脚本。切勿包含私有仓库内容。
