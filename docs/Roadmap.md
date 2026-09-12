# 路线图

Updated for v0.13.0 (September 2026). [CHANGELOG.md](../CHANGELOG.md) is the
authoritative record of what shipped in each release; this file tracks
direction.

## Shipped (0.1.0 → 0.13.0)

- [x] 仓库：打开、克隆（带进度）、最近、搜索、仓库标签页（可拖动排序）
- [x] 提交：暂存文件、代码块与单行；取消暂存、提交、修订；按仓库保存提交草稿; multi-select in the working copy with bulk stage/unstage/stash/discard; discard for staged files; path filter over changed files and commit files
- [x] History: virtualized animated graph, find in graph by message, hash or author with an n / m stepper (the lanes never collapse), branch filter, refs/tags/HEAD/merges, file history with a one-click jump to the whole commit
- [x] 分支：创建、删除、重命名、检出（含远端）、合并、变基（+继续/中止）、交互式变基（重排/改写/压缩/丢弃）、拣选（单个或多个提交，可选“(cherry picked from commit …)”引用）、重置（软/混合/硬）——显式合并始终记录合并提交；可从提交框中止合并
- [x] Remote: fetch, pull, push, force push, push a branch straight from its tip commit's menu, push/fetch tags, background auto fetch
- [x] Conflicts: visual resolver — aligned A/B panes with line numbers, one take-all checkbox per side (mixed while partly picked) plus hover-to-pick lines that land in file order, a Result pane with in-place editing and its own line numbers behind a draggable split, keyboard control (↑/↓, A/B, ⌘⏎), conflict and file navigation that opens the next conflicted file after each save, guards against losing picks and hand edits, AI explanations
- [x] 工作树：侧边栏分区显示分支/脏/缺失状态，任意工作树可作独立标签页打开，可从分支或提交在相邻文件夹创建，安全移除与清理，别处持有的分支在侧边栏与提交图中标记
- [x] 暂存：创建（整棵树或所选文件）、应用、弹出（工具栏一键）、丢弃；暂存作为提交图中的行，带有自己的节点与菜单；可从暂存中应用单个文件 · 标签：创建（附注/轻量）、删除、检出 · 子模块：列出与更新
- [x] 仓库根目录内置 PTY 终端；内置文件编辑器
- [x] Diff：内联与并排、语法高亮、词级 diff、图片 diff、diff 内查找（⌘F）、缩略图、上一处/下一处更改与文件导航（N/P、[/]），直接打开到第一处更改（无滚动动画）, reloads live as the file changes on disk, file history one click from the header; → / ↑ ↓ / ← walk from the graph into a commit's files and back
- [x] Settings: sixteen themes (Angkor Dusk default) with accents & zoom, identity profiles (repo-local) with linked accounts, SSH key management & generation, hosting accounts with verified tokens (Secret Service on Linux, missing tokens flagged), AI providers & commit style, keyboard reference
- [x] Sidebar: accordion sections with pinned headers and collapse-all, row menus on hover and right-click everywhere, empty-state cards; graph display options and column headers; welcome page with keyboard navigation and missing-folder detection
- [x] AI: provider-agnostic (OpenAI, Anthropic, Gemini, Ollama, LM Studio) plus installed AI CLIs (Claude Code, Codex, Gemini CLI, OpenCode, Antigravity) — commit messages, diff/conflict explanations, PR descriptions, staged-change review with team conventions (global + per-repo `.angkorgit/review.md`), background execution with stop, full-size reading views
- [x] Undo/redo for recent operations; drag-and-drop merge/rebase
- [x] Auto-update: pull-based from GitHub releases, signature-verified
- [x] Commit signing: SSH and GPG, driven by existing git config (commit.gpgSign, gpg.format, user.signingKey) — covers commit, amend, merge
- [x] Pull requests: sidebar list, checkout and in-app create with reviewer selection for GitHub, GitLab (incl. self-hosted) and Bitbucket Cloud, through the connected account; browser fallback without one
- [x] Graph search: message text, a hash or prefix, and author all find matches in the full graph, centered and highlighted, with an n of m control; ⌘F focuses the search
- [x] Command line: `angkorgit` / `akg` installed from Settings — open the current folder, a path, or clone by URL or owner/repo into the app
- [x] Blame: a pane of file history with a Working copy row, per-hunk authors, jump to the commit, blame at or before any commit
- [x] External editor: detected editors (VS Code, Cursor, Zed, Sublime, JetBrains, Xcode, GNOME Builder…) from the toolbar, palette and file menus
- [x] Pull with rebase following `pull.rebase`, a merge/rebase choice per pull, and a status bar note of the last fetch
- [x] Performance: fast startup (splash waits for the app, not a timer; heavy views load on first use), a quiet file watcher, on-demand commit diffs, loading overlay on slow repository switches

## Next

- [ ] Worktrees: start an installed AI CLI inside a worktree from its row, a per-repo post-create setup command, merged badge with one-step cleanup
- [ ] Provider avatars via connected accounts, layered over Gravatar

## 以后——互联（架构已就位，见 Architecture.md）

- [ ] Azure DevOps 与 Bitbucket Server 适配器（GitHub、GitLab 与 Bitbucket Cloud 已完成）
- [ ] 只读拉取请求详情视图（提交、CI 状态、审查状态）
- [ ] Issue 查看器

## 以后——强力功能

- [ ] 插件宿主（命令面板命令、侧边栏分区、检查器标签页）
- [ ] 多仓库工作区
- [ ] 性能：提交图文件支持，实现瞬时冷启动

非目标：企业级管理工具、内置 CI 仪表盘、应用内代码审查（评论、批准与合并都在 forge 的网页 UI 上实时进行，一键可达），以及任何复制 forge 网页 UI 却没有日常价值的东西。
