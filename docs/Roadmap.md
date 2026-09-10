# 路线图

Updated for v0.12.0 (September 2026). [CHANGELOG.md](../CHANGELOG.md) is the
authoritative record of what shipped in each release; this file tracks
direction.

## Shipped (0.1.0 → 0.12.0)

- [x] Repository: open, clone (with progress), recents, search, repository tabs (drag to reorder)
- [x] Commit: stage files, hunks, and individual lines; unstage, commit, amend; per-repo commit drafts; multi-select in the working copy with bulk stage/unstage/stash/discard; discard for staged files; path filter over changed files and commit files
- [x] History: virtualized animated graph, find in graph by message, hash or author with an n of m stepper (the lanes never collapse), branch filter, refs/tags/HEAD/merges, file history with a one-click jump to the whole commit
- [x] Branch: create, delete, rename, checkout (incl. remote), merge, rebase (+continue/abort), interactive rebase (reorder/reword/squash/fixup/drop), cherry-pick (single or multi-commit, optional "(cherry picked from commit …)" reference), reset (soft/mixed/hard) — explicit merges always record a merge commit; abort merge from the commit box
- [x] Remote: fetch, pull, push, force push, push a branch straight from its tip commit's menu, push/fetch tags, background auto fetch
- [x] Conflicts: visual resolver — aligned A/B panes with line numbers, one take-all checkbox per side (mixed while partly picked) plus hover-to-pick lines that land in file order, a Result pane with in-place editing and its own line numbers behind a draggable split, keyboard control (↑/↓, A/B, ⌘⏎), conflict and file navigation that opens the next conflicted file after each save, guards against losing picks and hand edits, AI explanations
- [x] Worktrees: sidebar section with branch/dirty/missing state, open any worktree as its own tab, create from a branch or commit into a sibling folder, safe remove and prune, branches held elsewhere marked in the sidebar and graph
- [x] Stash: create (whole tree or chosen files), apply, pop (one click from the toolbar), drop; stashes as rows in the graph with their own node and menu; apply single files from a stash · Tags: create (annotated/lightweight), delete, checkout · Submodules: list & update
- [x] Built-in PTY terminal at repo root; built-in file editor
- [x] Diff: inline & side-by-side, syntax highlight, word diff, image diff, find in diff (⌘F), minimap, previous/next change and file navigation (N/P, [/]), opens directly at the first change (no scroll animation), reloads live as the file changes on disk, file history one click from the header; → / ↑ ↓ / ← walk from the graph into a commit's files and back
- [x] Settings: sixteen themes (Angkor Dusk default) with accents & zoom, identity profiles (repo-local) with linked accounts, SSH key management & generation, hosting accounts with verified tokens (Secret Service on Linux, missing tokens flagged), AI providers & commit style, keyboard reference
- [x] Sidebar: accordion sections with pinned headers and collapse-all, row menus on hover and right-click everywhere, empty-state cards; graph display options and column headers; welcome page with keyboard navigation and missing-folder detection
- [x] AI: provider-agnostic (OpenAI, Anthropic, Gemini, Ollama, LM Studio) plus installed AI CLIs (Claude Code, Codex, Gemini CLI, OpenCode, Antigravity) — commit messages, diff/conflict explanations, PR descriptions, staged-change review with team conventions (global + per-repo `.angkorgit/review.md`), background execution with stop, full-size reading views
- [x] Undo/redo for recent operations; drag-and-drop merge/rebase
- [x] Auto-update: pull-based from GitHub releases, signature-verified
- [x] Commit signing: SSH and GPG, driven by existing git config (commit.gpgSign, gpg.format, user.signingKey) — covers commit, amend, merge
- [x] Pull requests: sidebar list, checkout and in-app create with reviewer selection for GitHub, GitLab (incl. self-hosted) and Bitbucket Cloud, through the connected account; browser fallback without one
- [x] Graph search: message text, a hash or prefix, and author all find matches in the full graph, centered and highlighted, with an n of m control; ⌘F focuses the search
- [x] Performance: fast startup (splash waits for the app, not a timer; heavy views load on first use), a quiet file watcher, on-demand commit diffs, loading overlay on slow repository switches

## Next

- [ ] Blame view
- [ ] 工作树：从其行内在工作树中启动已安装的 AI CLI、每仓库创建后设置命令、合并徽标与一键清理
- [ ] 通过关联账户获取提供方头像，叠加在 Gravatar 之上

## 以后——互联（架构已就位，见 Architecture.md）

- [ ] Azure DevOps 与 Bitbucket Server 适配器（GitHub、GitLab 与 Bitbucket Cloud 已完成）
- [ ] 只读拉取请求详情视图（提交、CI 状态、审查状态）
- [ ] Issue 查看器

## 以后——强力功能

- [ ] 插件宿主（命令面板命令、侧边栏分区、检查器标签页）
- [ ] 多仓库工作区
- [ ] 性能：提交图文件支持，实现瞬时冷启动

非目标：企业级管理工具、内置 CI 仪表盘、应用内代码审查（评论、批准与合并都在 forge 的网页 UI 上实时进行，一键可达），以及任何复制 forge 网页 UI 却没有日常价值的东西。
