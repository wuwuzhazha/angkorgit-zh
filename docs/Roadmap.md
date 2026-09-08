# 路线图

更新至 v0.11.0（2026 年 9 月）。[CHANGELOG.md](../CHANGELOG.md) 是
每个版本发布内容的权威记录；本文件跟踪
direction.

## Shipped (0.1.0 → 0.11.0)

- [x] 仓库：打开、克隆（带进度）、最近、搜索、仓库标签页（可拖动排序）
- [x] 提交：暂存文件、代码块与单行；取消暂存、提交、修订；按仓库保存提交草稿; multi-select in the working copy with bulk stage/unstage/stash/discard; discard for staged files; path filter over changed files and commit files
- [x] 历史：虚拟化动画提交图、搜索、作者/分支过滤、refs/tags/HEAD/合并、文件历史
- [x] 分支：创建、删除、重命名、检出（含远端）、合并、变基（+继续/中止）、交互式变基（重排/改写/压缩/丢弃）、拣选（单个或多个提交，可选“(cherry picked from commit …)”引用）、重置（软/混合/硬）——显式合并始终记录合并提交；可从提交框中止合并
- [x] 远端：拉取、拉取、推送、强制推送、推送/拉取标签、后台自动拉取
- [x] 冲突：可视化解决器——对齐的 A/B 面板带行号，每侧一个全选复选框并可悬停选行，结果面板支持就地编辑且自带行号，冲突导航，AI 解释
- [x] 工作树：侧边栏分区显示分支/脏/缺失状态，任意工作树可作独立标签页打开，可从分支或提交在相邻文件夹创建，安全移除与清理，别处持有的分支在侧边栏与提交图中标记
- [x] 暂存：创建（整棵树或所选文件）、应用、弹出（工具栏一键）、丢弃；暂存作为提交图中的行，带有自己的节点与菜单；可从暂存中应用单个文件 · 标签：创建（附注/轻量）、删除、检出 · 子模块：列出与更新
- [x] 仓库根目录内置 PTY 终端；内置文件编辑器
- [x] Diff：内联与并排、语法高亮、词级 diff、图片 diff、diff 内查找（⌘F）、缩略图、上一处/下一处更改与文件导航（N/P、[/]），直接打开到第一处更改（无滚动动画）, reloads live as the file changes on disk, file history one click from the header; → / ↑ ↓ / ← walk from the graph into a commit's files and back
- [x] 设置：十六款主题（默认 Angkor Dusk）带强调色与缩放、身份配置（仓库级）关联账户、SSH 密钥管理与生成、带已验证令牌的托管账户、AI 提供方与提交风格、键盘参考
- [x] 侧边栏：手风琴分区，标题固定且可全部折叠，处处支持悬停与右键行菜单，空状态卡片；提交图显示选项与列标题；欢迎页支持键盘导航并检测缺失文件夹
- [x] AI：与提供方无关（OpenAI、Anthropic、Gemini、Ollama、LM Studio），外加已安装的 AI CLI（Claude Code、Codex、Gemini CLI、OpenCode、Antigravity）——提交消息、diff/冲突解释、PR 描述、按团队约定的暂存更改审查（全局 + 每仓库 `.angkorgit/review.md`）、可停止的后台执行、全尺寸阅读视图
- [x] 最近操作的撤销/重做；拖放式合并/变基
- [x] 自动更新：从 GitHub releases 拉取，签名校验
- [x] 提交签名：SSH 与 GPG，由现有 git 配置驱动（commit.gpgSign、gpg.format、user.signingKey）——覆盖提交、修订、合并
- [x] 拉取请求: sidebar list, checkout and in-app create with reviewer selection for GitHub, GitLab (incl. self-hosted) and Bitbucket Cloud, through the connected account; browser fallback without one
- [x] 提交图搜索：提交哈希（完整或短至 4 字符的前缀）跳转到完整图中的对应提交，居中并高亮；⌘F 聚焦搜索框
- [x] 性能：快速启动（启动画面等应用就绪而非定时器；重型视图首次使用时才加载）、安静的文件监视器、按需的提交 diff、慢速仓库切换时的加载遮罩

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
