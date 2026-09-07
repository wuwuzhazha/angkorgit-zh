# -*- coding: utf-8 -*-
# B2 website 翻译表（translator-b · t3）：source = 文件中逐字原文
# (source, target, anchor)
WEBSITE = [
# ---- Questions.astro（FAQ 答案，t1 桶）----
("Faster to open, lighter, and narrower on purpose. GitKraken took the workflow ideas further than anyone and I learned from it, but I wanted the twenty-five features that matter rather than the hundred. Fork is closer in spirit, though it is not open source and not on Linux.",
 "打开更快、更轻，而且刻意做得更克制。GitKraken 把工作流理念推得比任何人都远，我从它那里学到很多，但我想要的是真正要紧的二十五个功能，而不是一百个。Fork 在精神上更接近，但它不是开源的，也没有 Linux 版。", ""),
("The build isn't signed with an Apple developer certificate yet, so Gatekeeper asks once. Right-click and Open, or install through Homebrew, which clears the flag for you. After that the updater handles new versions and verifies each one with a signature.",
 "构建目前还没有用 Apple 开发者证书签名，所以 Gatekeeper 会询问一次。右键点击并选择“打开”，或通过 Homebrew 安装，它会自动清除该标记。之后更新器会接管新版本，并逐一用签名验证。", ""),
("Not signed with an Apple certificate, so macOS asks once. Right-click, Open, or use Homebrew below and it never asks.",
 "未用 Apple 证书签名，所以 macOS 会询问一次。右键点击并选择“打开”，或使用下方的 Homebrew，之后就再也不会询问。", ""),
("Anything else, ", "还有其他问题，", ""),
("open an issue", "开一个 issue", ""),
(". I read them all.", "，我都会读。", ""),

# ---- Install.astro（t1 桶 + 补充）----
("Something odd on first launch? The <a href=\"/docs/getting-started/\" class=\"link-underline text-foreground\">getting started page</a>",
 "首次启动遇到奇怪的问题？请查看<a href=\"/docs/getting-started/\" class=\"link-underline text-foreground\">快速开始页面</a>", ""),
("walks through each prompt. All versions are on the <a href={SITE.releases} class=\"link-underline text-foreground\">releases page</a>.",
 "，它会逐步讲解每个提示。所有版本都在<a href={SITE.releases} class=\"link-underline text-foreground\">发布页面</a>上。", ""),
("Install · v", "安装 · v", ""),
("Install from the terminal without Homebrew", "不使用 Homebrew，从终端安装", ""),
("Download", "下载", "^\\s*Download$"),
("Download AngKorGit", "下载 AngKorGit", ""),

# ---- AiSection.astro（t1 片段→整行 + 补充）----
("AngKorGit doesn't ship a model or a token wallet. If you've got Claude Code, Codex, Gemini CLI or OpenCode",
 "AngKorGit 不自带模型或令牌钱包。如果你装了 Claude Code、Codex、Gemini CLI 或 OpenCode，", ""),
("installed, it finds the binary and uses your own login and quota. No key to paste.",
 "它会找到对应程序，使用你自己的登录与配额，无需粘贴密钥。", ""),
("Or point it at an API 密钥, or at Ollama on your own machine. Whatever you pick, requests go straight from",
 "或者指向 API 密钥，或指向你自己机器上的 Ollama。无论选哪个，请求都直接从", ""),
("your computer to that provider. There is no server of mine in between.",
 "你的电脑发往该提供方，中间没有我的服务器。", ""),
("What it's used for: a commit message from the staged diff, a plain-language explanation of a commit or a",
 "它的用途：为暂存差异生成提交消息、用通俗语言解释某个提交或", ""),
("conflict, a review of what you're about to commit, and a pull request description. Every one of those has",
 "冲突、审查你即将提交的内容，以及生成拉取请求描述。每一项都带", ""),
("a Stop button.", "一个停止按钮。", ""),

# ---- index.astro（t1 片段→整行 + 补充正文）----
("Both sides in one view, with line numbers on each so you can talk about line 43 with a colleague. One",
 "两侧同屏，各带行号，你可以和同事聊“第 43 行”。一个", ""),
("checkbox takes a whole side. Hover a line and a plus takes just that one.",
 "复选框即可取走整侧。悬停某行，加号只取那一行。", ""),
("The result pane is an editor. Click a line and type. Nothing touches the file until you press Mark",
 "结果面板就是编辑器：点一行就能输入。在你按下“标记已解决”之前，文件不会有任何改动，", ""),
("resolved, and the markers are guarded so you can't save half a conflict by accident.",
 "并且标记受到保护，所以你不可能意外保存半个冲突。", ""),
("A worktree is a second checkout of the same repository in a sibling folder. Run a hotfix or an AI agent",
 "工作树是同一仓库在相邻文件夹中的第二份检出。在那里跑热修复或 AI 代理，", ""),
("there while your real work sits untouched. No stash, no \"让我先提交这个 WIP\".",
 "而你的正式工作保持不动。无需暂存，也不会有“让我先提交这个 WIP”。", ""),
("The sidebar lists every worktree with its branch and whether it has changes. Each opens as its own tab.",
 "侧边栏列出每个工作树及其分支与是否有改动，每个都可作为独立标签页打开。", ""),
("Try to check out a branch that's already open in another folder and it takes you there instead, the same",
 "尝试检出已在另一个文件夹中打开的分支时，它会直接带你到那里，就像", ""),
("way git refuses on the command line.", "git 在命令行中也会拒绝一样。", ""),
("The graph is virtualized, so a hundred thousand commits scroll like fifty. Ref chips show the whole name or",
 "提交图已虚拟化，十万次提交滚动起来像五十次。引用标签显示完整名称，或", ""),
("fold behind a count, never half a word. Paste a hash into the search and it jumps there.",
 "折叠成计数，绝不显示半个词。把哈希粘贴进搜索框，它就会跳过去。", ""),
("Merges from the app are always real merge commits. Right-click does what you'd expect, and ⌘Z undoes the",
 "应用内的合并始终是真正的合并提交。右键做你期望的事，⌘Z 撤销", ""),
("merge if you picked the wrong branch.", "你选错分支时的合并。", ""),
("Every command in the app is in the palette, including the ones buried in a right-click menu. Shortcuts are",
 "应用里的每个命令都在命令面板中，包括藏在右键菜单里的那些。快捷键会显示在", ""),
("printed next to the menu items so you learn them by using the mouse.",
 "菜单项旁边，用着用着鼠标就学会了。", ""),
("⌘Z undoes, ⌘⇧Z redoes, ⌘B hides the sidebar, [ and ] move between files in a diff. The Escape key closes",
 "⌘Z 撤销、⌘⇧Z 重做、⌘B 隐藏侧边栏，[ 和 ] 在 diff 中切换文件。Esc 一次只关闭", ""),
("exactly one thing at a time.", "一样东西。", ""),

# ---- Story.astro（补充正文）----
("I use Git all day, on a Mac that I like, and every client I tried felt like a website wearing a coat. Slow",
 "我整天都在用 Git，用着我喜欢的 Mac，试过的每个客户端都像穿了外套的网页。打开慢、", ""),
("to open, heavy on disk, a login screen before the first commit. The command line was faster, but a good",
 "占磁盘、第一次提交前还要先登录。命令行更快，但一张好的", ""),
("graph and a proper conflict view are worth having.",
 "提交图和像样的冲突视图是值得拥有的。", ""),
("So in August 2026 I started writing one. The engine is libgit2 through Rust, the window is the system",
 "于是在 2026 年 8 月我开始写一个。引擎是 Rust 之上的 libgit2，窗口用系统", ""),
("webview, and the rule for what gets in is simple: if GitKraken has a hundred features, I want the twenty-five",
 "webview，收录功能的规则很简单：如果 GitKraken 有一百个功能，我只要其中二十五个", ""),
("that matter, done properly.", "真正要紧的，并且做到位。", ""),
("其余 of this page is laid out like a history. Newest commit on top in the graph, oldest first as you",
 "本页其余部分像历史一样排布：最新提交在图顶，越往下越旧，", ""),
("scroll. The line on the left fills as you read.", "滚动时左侧的线随阅读进度填充。", ""),

# ---- Size.astro（补充正文）----
("Most Git 客户端s are a website wrapped in its own copy of a browser, which is why they take a moment to open",
 "大多数 Git 客户端本质上是套着自己浏览器外壳的网页，所以打开要等一会儿，", ""),
("and sit heavy on the disk. AngKorGit draws its window with the webview your OS already ships, and talks to the",
 "而且很占磁盘。AngKorGit 用操作系统自带的 webview 绘制窗口，并通过", ""),
("repository through libgit2 in the same process. It opens quickly, updates itself, and stays out of the way.",
 "libgit2 在同一进程中访问仓库。它打开快、自行更新、不碍事。", ""),

# ---- Footer.astro（补充）----
("Built by one person who wanted a Git 客户端 that gets out of the way. MIT licensed, no telemetry, no account. If it saves",
 "由一个人打造，想要一个不碍事的 Git 客户端。MIT 许可、无遥测、无账户。如果它为你省下了", ""),
("you time,", "时间，", ""),

# ---- Hero.astro（补充）----
("I got tired of Git 客户端s that were secretly browsers. This one is native, Rust and libgit2 underneath, and it",
 "我受够了那些其实是浏览器的 Git 客户端。这个应用是原生的，底层是 Rust 和 libgit2，它", ""),
("does the things you do every day without asking for an account or a subscription first.",
 "只做你每天都要做的事，不会先要求你注册账户或订阅。", ""),
("Download {version}", "下载 {version}", ""),
("Read the source on GitHub", "在 GitHub 上阅读源代码", ""),

# ---- 404.astro（补充）----
("The page you're looking for was never added to history. Let's get you back to a clean tree.",
 "你正在找的页面从未被加入历史。让我们带你回到一棵干净的工作树。", ""),
("Back to home", "返回首页", ""),
("Back to the repository", "返回仓库", ""),

# ---- Header.astro（补充）----
("Skip to content", "跳到内容", ""),

# ---- DocsLayout.astro / docs/index.astro（补充）----
("Home", "首页", ">Home<"),
("View on GitHub", "在 GitHub 上查看", ""),
("Everything you need to work on AngKorGit — from the architecture and coding standards to",
 "你在 AngKorGit 上工作所需的一切——从架构、编码规范到", ""),
("building, testing, and shipping a release. Source of truth lives in the",
 "构建、测试与发布。权威信息都在", ""),
("<a href={SITE.repo} target=\"_blank\" rel=\"noreferrer\"> repository</a>.",
 "<a href={SITE.repo} target=\"_blank\" rel=\"noreferrer\"> 仓库</a>。", ""),
("repository", "仓库", "noreferrer\"> repository<"),
# ---- HeroGraph.astro（补充）----
("Newest on top, like a real graph. Click a commit to jump.",
 "最新在上，如同真实提交图。点击提交即可跳转。", ""),
("init: why I made this", "init：为什么做这个", ""),

# ---- mock/AppFrame.astro（工具栏，ui 词条一致）----
("/> Fetch</span>", "/> 获取</span>", ""),
("/> Pull</span>", "/> 拉取</span>", ""),
("icon('up')} /> Push", "icon('up')} /> 推送", ""),

# ---- mock/Palette.astro（命令面板，ui 词条一致）----
("Type a command or branch name…", "输入命令或分支名…", ""),
("Actions", "操作", ">Actions<"),
("{ icon: 'down', label: 'Pull' }", "{ icon: 'down', label: '拉取' }", ""),
("{ icon: 'up', label: 'Push' }", "{ icon: 'up', label: '推送' }", ""),

# ---- mock/WorkingCopy.astro（ui 词条一致，scope 并集复用）----
("Conflicts", "冲突", "Conflicts <span"),
("Resolve", "解决", ">Resolve<"),
("Summary", "摘要", ">Summary<"),
("Description — what changed and why · ⌘⏎ to commit", "说明——改了什么以及为什么 · ⌘⏎ 提交", ""),

# ---- mock/Graph.astro（列头，ui 词条一致）----
(">Graph</span><span>Message</span><span>作者</span>", ">图表</span><span>消息</span><span>作者</span>", ">Graph<"),
("1y ago", "1 年前", ""),

# ---- Size.astro（t1 桶）----
("Native", "原生", ">Native<"),

# ---- mock/Conflicts.astro（冲突解决器，ui 词条一致）----
("Conflict 1 of 1", "冲突 1 / 1", ""),
("Conflict 1", "冲突 1", ""),
("Result", "结果", ">Result<"),
("Reset", "重置", ">Reset<"),

# ---- mock/Sidebar.astro（ui 词条一致）----
("Filter refs...", "过滤引用…", ""),
("Draft", "草稿", ">Draft<"),

# ---- mock/Worktree.astro（ui 词条一致）----
("New worktree", "新建工作树", ""),
("New branch", "新建分支", ""),
("Open it in a new tab", "在新标签页中打开", ""),

# ---- mock/TerminalBlock.astro（复制按钮，ui 词条一致）----
("Copy ${label} install command", "复制 ${label} 安装命令", ""),
("Copy", "复制", "(data-copy-label>Copy<|'Copy')"),
("Copied!", "已复制！", "'Copied!'"),

# ---- SpecSheet.astro（规格表，t1 桶）----
("Cherry-pick one or many, with the origin reference", "拣选一个或多个提交，可携带来源引用", ""),
("Commit details with parents, refs, and per-file counts", "提交详情：父提交、引用与各文件计数", ""),
("Built-in terminal per repository", "每个仓库内置终端", ""),
("Signature-verified updates from GitHub releases", "来自 GitHub releases 的签名验证更新", ""),
("In-app pull request review", "应用内拉取请求审查", ""),
("The whole list, in plain words. If it isn't here, it isn't in the app.",
 "整个清单，用大白话讲。如果这里没有，应用里就没有。", ""),
]

# ---- website skip（裁决不译，reason 归类）----
WEBSITE_SKIP = [
("return render(rows, { palette, animate: true });", "demo", "mock 冲突窗格中的示例代码内容"),
("return render(rows, { colors });", "demo", "mock 冲突窗格中的示例代码内容"),
("export function drawGraph(rows: Row[]) {", "demo", "mock 冲突窗格中的示例代码内容"),
("import { render } from './renderer';", "demo", "mock 冲突窗格中的示例代码内容"),
("const palette = useThemePalette();", "demo", "mock 冲突窗格中的示例代码内容"),
("const colors = legacyColors();", "demo", "mock 冲突窗格中的示例代码内容"),
("drawGraph.ts", "demo", "mock 中的示例文件名"),
("aspect-ratio: ${width} / ${height}", "css", "CSS 样式模板串"),
("Start-Process \"$env:TEMP\\\\AngKorGit-setup.exe\"", "command", "终端命令（PowerShell）"),
("WIP on main: experiment …", "demo", "mock 侧边栏示例暂存名"),
("feature/* → feat(scope):", "demo", "mock 中示例配置值（git 前缀规则样例）"),
("angkorgit-feature-di…", "demo", "mock 侧边栏示例工作树名"),
("angkorgit-fix-stash…", "demo", "mock 侧边栏示例工作树名"),
("angkorgit.app", "brand", "品牌/域名"),
("Tauri 2 · Rust · libgit2 · React", "brand", "技术栈品牌行"),
("macOS, Windows, Linux", "brand", "操作系统品牌枚举（JSON-LD）"),
("AngKorGit contributors", "brand", "JSON-LD 发布者名称（机构名保留）"),
("HEAD", "ident", "git 术语，dict 中 HEAD 一律保留英文"),
("init", "ident", "git 术语/装饰性 kicker（与 init: 前缀一致保留）"),
("Mac（Homebrew）", "cjk", "已本地化（全角括号已是词库目标形式）"),
("Windows（PowerShell）", "cjk", "已本地化（全角括号已是词库目标形式）"),
("WorkingCopyFileListItemContaine…", "demo", "mock 工作副本示例文件名"),
("!Launch-Checklist.md", "code", "content.config.ts glob 模式"),
(".terminal-block", "css", "CSS 类选择器"),
("*.md", "code", "content.config.ts glob 模式"),
("src…", "demo", "mock 工作副本示例目录"),
(".md", "code", "DocsLayout.astro 代码中的扩展名处理"),
]
