# 残留英文翻译契约（researcher · t1 · 终版）

> 生效范围：angkorGit-zh 全仓库（HEAD 824ef8b，工作树除 Cargo.lock 行尾噪音外干净）。
> 配套机器实现：`zh-dict/research/scan_residual.py`（可复跑，产出全部清单）。
> 输入：`zh-dict/dict.tsv`（1139 行）、`protect.txt`、`skip-files.txt`、`scripts/sync-localize.ps1`（行级 anchor、长串优先、protect 拦截、`${}` 字面替换）。

---

## 1. 现状基线（可复跑验证）

| 指标 | 值 | 说明 |
| --- | --- | --- |
| 原始候选（未去重） | 7,167 | JSX 文本 + 属性 + TS 字符串 + 模板字面量 + Rust 串 + docs 散文 |
| 去重后候选 | 3,784 | 按 (scope, source) 去重 |
| **translate（推荐直接入词库）** | **634** | 由翻译批次产出词条 |
| **verify（需人工/译者裁决）** | **62** | 裁决后转 translate 或 skip，见 §5.4 |
| skip（不可译，含理由类目） | 3,088 | 类目见 §3.2，全部有 reason 可审计 |

批次行数：`batch1.tsv`（ui）=123、`batch2.tsv`（website+docs）=325、`batch3.tsv`（rust+core+meta+e2e/test）=186。
工作量估算（字符加权）：B1≈125、B2≈484、B3≈214——B2 为长文档批次，符合"website+docs 并行"计划。

## 2. 产物清单（`zh-dict/research/`，均为 UTF-8 TSV/JSON/MD）

| 文件 | 内容 |
| --- | --- |
| `scan_residual.py` | 增强扫描器（python3 直跑：`python zh-dict/research/scan_residual.py --repo <repo>`） |
| `residual.tsv` | 去重候选：scope/source/verdict/reason/hint/kind/require_anchor/sync/first_loc/occurrences |
| `residual-lines.tsv` | 明细定位：scope/file/line/source/kind（工程核验用） |
| `residual-stats.json` | scope×verdict 汇总 + 批次工作量 |
| `batch1.tsv` · `batch2.tsv` · `batch3.tsv` | 三批待译行（含 sync/require_anchor/hint/first_loc） |
| `verify.tsv` | 待决清单（按 scope 分配给译者，逐条给结论） |
| `protect-blocked.tsv` | 受 `protect.txt`（legacy）拦截的 translate/verify 行——升级 protect 后消除（§6.1） |
| `translation-contract.md` | 本文件 |

**列约定（residual.tsv）**：`scope`=ui/rust/core/website/docs/meta/e2e/test；`source`=与文件中逐字一致的原文（含 `${x}`、`{}`、转义 `\n` 原样）；`verdict`=translate/verify/skip；`reason`=甄别类目；`kind`=提取来源（jsx-text/attr:* /template/string/rust-fmt/rust/md-prose/json/test-name…）；`require_anchor`=yes 表示该 source 无空格，入词库必须带 anchor；`sync`=该 source 同时出现于 e2e/test（需 scope 并集或同名词条）。

## 3. 扫描与甄别

### 3.1 提取覆盖（相对 sync-localize.ps1 的 Scan-Pending 增强）
1. JSX 文本节点（`<p>text</p>` 等，单行；代码残渣另有过滤）；
2. JSX/HTML 属性文案（`aria-label`、`title`、`placeholder`、`alt`、`description`、`tooltip`、`label`、`message` 等白名单 → translate；`class/className/style/id/key/variant/size/type/…` → skip）；
3. TS/TSX 字符串与**模板字面量**：`${id}`/`${a.b}` 等简单表达式原样保留为占位符并产出整串（引擎按字面替换）；跨行模板、含三元/函数调用的复杂表达式不产出整串（引擎行级替换无法处理），其内嵌引号文案单独抽取；
4. Rust 字符串/raw 串 + `format!/println!/anyhow!/bail!/panic!` 等宏的格式串（`{}`/`{:?}`/`{named}` 保留）；
5. Astro：frontmatter 按 TS、正文按 TSX；
6. docs Markdown：候选=**原始行**（trimmed，含 Markdown 语法与行内代码——引擎按字面匹配，译者须原样保留语法与反引号内容）；跳过围栏代码块、表格行、图片行、引用式链接定义。
7. 转义序列按文件原文保留（`\n` 记为反斜杠+n 两字符），保证 source 与文件逐字一致。

### 3.2 甄别类目（reason 全集，skip 按此审计）
| reason | 含义 | 处置 |
| --- | --- | --- |
| `code` | 无字母/快捷键/SVG/URL 路径/选择器/函数式/纯占位符拼接/键值对 | skip |
| `ident` | 标识符/域名/glue-key/版本/日期/hash/base64/camelCase/含数字 token | skip |
| `css` | Tailwind/CSS 值（全小写 token，≥50% 含 `-[:(/%数字`） | skip |
| `test-name` | vitest `test/it/describe` 用例名 | skip |
| `demo` | demo.ts 演示数据；`(demo)` 断言；测试选择器 | skip |
| `brand` | 品牌/产品/主题名（保留英文，见 §4.2） | skip |
| `protect` | source 命中 protect 正则（短串） | skip |
| `command` | CLI 命令/脚本片段 | skip |
| `gitraw` | git 原始输出/提交模板/冲突标记 | skip |
| `fixture` | 测试提交消息/夹具字符串 | skip |
| `prompt` | AI 提示词/探针 | skip |
| `dup` | 已入 dict.tsv | skip |
| `cjk` | 已含中文 | skip |
| `changelog`/`policy` | CHANGELOG.md / SECURITY.md / CODE_OF_CONDUCT.md 文件级裁决 | skip（建议进 skip-files） |
| `single-word` | 无空格裸词（ui/website/e2e）：**可译但必须带 anchor**（如 `>Amend<`、`\+ ' Review'`） | verify |
| `protect-mixed` | 含 URL/版本/路径/单位等受保护片段的长句：**可译，译时必须原样保留这些片段** | verify |
| `md-mixed` | 符号占比高的文档行 | verify |

### 3.3 verify 裁决归属
`verify.tsv` 按 scope 分给对应译者（B1 处理 ui/e2e，B2 处理 website/docs，B3 处理 rust/core/meta/test）。裁决规则：
- `single-word`：确认是 UI 文案 → 产出带 anchor 词条；是标识符/CSS → skip 并记入批次 skip 文件；
- `protect-mixed`：人话 → 翻译（保留片段）；命令/夹具 → skip。

## 4. 翻译规则（译者必须逐条遵守）

### 4.1 模板占位符（零容忍）
- JS/TS `${name}` / `${a.b}`：**逐字保留**，位置可随语序调整，但内文不得改动。例：
  - `#${pr.number} ${pr.title} — ${pr.author} wants to merge ${pr.sourceBranch} into ${pr.targetBranch}.`
    → `#${pr.number} ${pr.title} — ${pr.author} 想要将 ${pr.sourceBranch} 合并到 ${pr.targetBranch}。`
- Rust `{}`、`{:?}`、`{named}`：逐字保留；`{{`/`}}` 转义花括号保持原样。例：
  - `{} already exists — pick a folder that does not exist yet` → `{} 已存在——请选择尚不存在的文件夹`
- 转义序列：`\n`、`\"`、`\\` 按两字符原样保留在 source 中，target 如需换行沿用 `\n`。

### 4.2 专名/品牌/命令保留清单（原文不动）
`AngKorGit`、`Angkor Dawn/Dusk`、各主题名、`Git`/`GitHub`/`GitLab`/`Bitbucket`、`Claude Code`/`Codex CLI`/`Gemini CLI`/`OpenCode`/`Antigravity CLI`、`Ollama`/`LM Studio`/`OpenAI`/`Anthropic`、`Tauri`/`Rust`/`React`/`TypeScript`/`Astro`/`Vite`/`Playwright`、`macOS`/`Windows`/`Linux`、`Homebrew`/`Gatekeeper`、文件路径（`~/.ssh/…`、`docs/…`）、命令（`pnpm …`/`cargo …`/`git …`）、快捷键（⌘K、⇧Z）与端口/URL 保留原文。出现在句子中时仅翻译周边文案。

### 4.3 术语一致性（复用 dict.tsv 既有译法；冲突以 dict 为准）
已定：Commit=提交、Fetch=获取、Pull=拉取、Push=推送、Stash=暂存、Cherry-pick=拣选、Amend=修订、staged=已暂存、unstaged=未暂存、Conflicts=冲突、Branches=分支、Remotes=远端、Stashes=暂存列表、Worktrees=工作树、Submodules=子模块、Summary=摘要、Dismiss=关闭、Resolve=解决、Rename=重命名、Retry=重试、Cancel=取消、Create=创建、Clone=克隆、Author=作者、Message=消息、Title=标题、Results=结果、Appearance=外观、Shortcuts=快捷键。
新译术语若与既有词条语义重叠，先查 `dict.tsv` 对应译法。

### 4.4 格式/风格
- Markdown 行：**标题 `#`、`**`、反引号代码段、链接 `[t](u)`、HTML 标签原样保留**；仅翻译散文文字。
- Rust 错误消息：沿用 rust 现有风格（小写开头、不加句号），与既有 rust 词条一致。
- 时间/数字/单位不换算、不本地化格式。
- 全角标点仅在中文语境使用（`——`、`、`、`“”`），与既有译文风格一致。
- 避免冗余“的/了”；命令与占位符前后空格按中文排版习惯。

### 4.5 受保护片段（protect-mixed 类）
source 内含 URL、版本号、哈希、`~/.ssh` 路径、单位值时：target **必须逐字复制**这些片段（引擎对含 protect 片段的 source 走 bypass 整串替换，target 丢了片段 = 数据损坏）。

### 4.6 anchor 规则（engine 强制）
- 无空格 source（裸词）**必须**带 anchor（dict.tsv 校验：单单词无 anchor 直接报错退出）。
- anchor 用行级正则限定上下文，优先用文件里真实邻接串，如 `>Amend<`、`\+ ' Review'`、`^\s*Retry$`、`'Committed'`。
- 一个 source 多处出现且上下文不同 → 拆多条（各带不同 anchor）或保守选择出现最密集的 anchor；不确定时保留一条最宽 anchor 并人工验证。

### 4.7 长串优先与重叠规避
- 批次内按 **source 长度降序**排列（长句先入 dict.tsv，引擎按文件顺序应用）；同长按字典序。
- 若词条 B 的 source 是词条 A 的 source 的**子串**，B 不得排在 A 之前（避免 A 被 B 抢先替换导致 A 失配）。
- 同一 source 跨 scope（如 ui 与 e2e）：产出一条 `scope=ui,e2e` 词条（或 ui 与 e2e 各一条同 source）+ 见 §4.8。

### 4.8 e2e/test 断言同步
- `residual.tsv` 的 `sync` 列=yes 的行：e2e/test 中的同 source 断言必须与 UI 词条同译（scope 写并集），否则翻译后 Playwright/vitest 断言失配。
- 断言对象是 demo 数据/选择器/夹具的行已归 skip（demo 模式不译，断言保持英文）。

## 5. 批次切分

| 批次 | 文件 | scope 归属 | 行数 | 工作量 | 特则 |
| --- | --- | --- | --- | --- | --- |
| B1 | `batch1.tsv` | ui（+ui 侧 sync） | 123 | ~125 | 模板 `${}` 保留；裸词必须 anchor；改动最多集中在 Sidebar/dialogs/toasts，术语查 dict；`verify.tsv` 中 ui/e2e 行一并裁决 |
| B2 | `batch2.tsv` | website + docs | 325 | ~484 | 文档行=原始行，保留 Markdown/代码/链接；Distribution/Launch-Checklist 的 URL、命令、IP 保持；`Copied!` 等裸词带 anchor；`verify.tsv` 中 website/docs 行裁决（36 条 docs 为含版本/URL 长句→大多可译） |
| B3 | `batch3.tsv` | rust + core + meta + e2e/test 余量 | 186 | ~214 | Rust `{}`/`{named}` 保留；错误消息小写开头；`\n` 转义保留；测试断言与 rust/ui 词条同步 scope；夹具不译；`verify.tsv` 中 rust/core/meta/test 行裁决（meta 8 条 pnpm 命令→skip） |

**批次产出格式（沿用 archive 惯例）**：`scope<TAB>source<TAB>target<TAB>anchor(可选)`；每批附带 `skip.tsv` 记录裁决为不译的 verify 行及理由。
**合并**：engineer 按 §4.7 排序规则并入 `dict.tsv`（去重/source 不变/长串优先/anchor 校验）。

## 6. 需要同步修改的配置（engineer 执行，researcher 建议）

### 6.1 protect.txt —— **必改**（消除 pending 噪音，使引擎与扫描器语义一致）
当前 `[a-z][a-z0-9]*(-[a-z0-9]+)+` 会命中**单连字符英文词**（`right-click`、`side-by-side`、`notify-based`…），导致这些串永不进入引擎 pending 清单（假清零），且 183 行候选被 protect-blocked.tsv 列证。
**替换为**（kebab 标识符需含数字段，纯英文连字符词放行）：
```
[a-z][a-z0-9]*(-[a-z0-9]*[0-9][a-z0-9]*)+
```
另建议追加（CSS 变量/类选择器防护）：
```
--[a-z][a-z0-9-]*
```
> 影响面核对：替换后引擎对含"数字段 kebab"（`shrink-0`、`text-[10px]`、`min-w-0`）的保护不变；纯英文连字符词所在长句可被整句替换（其本身不是需要保护的标识符）。

### 6.2 skip-files.txt —— **必加**
```
CHANGELOG.md
```
（CHANGELOG 984 行历史发布说明不译；不排除则 docs 词库需吞上千行、pending 永不收敛。）
**建议加**（低价值模板文件，保持英文惯例）：
```
SECURITY.md
CODE_OF_CONDUCT.md
```

### 6.3 引擎语义确认（无需改动，写清即可）
- 含 protect 片段的 source：引擎 **bypass**（整串替换），故 protect-mixed 类可安全入词库，前提是 target 保留片段（§4.5）。
- `${}` 字面替换：脚本用 `[regex]::Escape(source)` 字面匹配，模板串可直接入词库（dict.tsv 已有先例）。

## 7. 验收标准（engineer 合并后必须全绿）

1. **可译项清零**：重跑 `scan_residual.py`，`translate=0`；`verify=0`（或全部给出裁决：转 translate 已入词库 / 转 skip 有 reason）。
2. **词库合法性**：`dict.tsv` 无重复 source、无单单词缺 anchor、anchor 正则可编译（sync-localize.ps1 启动即校验）。
3. **引擎一致性**：`sync-localize.ps1 -Repo … -SkipSync` 重跑后 `StatsReplacements > 0` 且再次运行 diff 为空（幂等），`pending.tsv` 不再新增 translate 级串。
4. **三套测试**（CI 同名命令）：`pnpm typecheck`、`pnpm test`（vitest）、`cd apps/desktop/src-tauri && cargo test`（36 项 git 引擎测试）、`pnpm test:e2e`（Playwright demo 模式）全绿——断言同步（§4.8）即为此服务。
5. **commit/push**：`chore(i18n): …` 提交推送 main，远端 CI（ci.yml：typecheck/test/e2e + rust matrix）通过。

## 8. 已知限制（不入词库的领域）
- 多行模板字面量：引擎行级替换无法处理，不产出（其单行片段不作为候选）。
- `README.md`、`CLAUDE.md`（默认）、`docs/README.zh.md`、`apps/desktop/src/core/demo.ts`、`scripts/**`、`.github/**`、锁文件、图片/字体等由 skip-files 排除（与引擎一致）。
- JSX 文本仅捕获单行节点；跨行文本节点可能漏报（不产生误报）。
- `.astro` 正文按 TSX 近似解析（影响极小）。
- 非 UI 的 AI 提示词、git 输出模板、测试夹具不译（类目见 §3.2）。

---
*生成：researcher · t1 · 2026 分支；清单与统计可一键复现：`python zh-dict/research/scan_residual.py --repo E:\angkorgit_zh\build\angkorgit`*