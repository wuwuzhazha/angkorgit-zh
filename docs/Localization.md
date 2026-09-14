# 中文化与上游同步

本仓库是 [cheat2001/angkorgit](https://github.com/cheat2001/angkorgit) 的简体中文分支。
本地化与上游同步刻意**拆成四步**：自动检测 → 自动准备 PR → 人工校对合并 → 测试通过后手动发布。
翻译是需要判断的工作，绝不放进无人值守、会自动发布的流水线。

## 工作流总览

| 工作流 | 触发 | 做什么 | 不做什么 |
| --- | --- | --- | --- |
| `upstream-watch.yml` 上游更新检测 | 每天 01:00 UTC / 手动 | 检测上游新提交，创建（或复用）带 `upstream-sync` 标签的 Issue，并在正文 @ 仓库所有者 | 不写 main、不构建、不发布 |
| `localize.yml` 同步并汉化（PR） | 手动 | 合并上游 → 恢复自维护文件 → 应用词库 → `check:copy` → 开 PR | 不推 main、不发布 |
| `ci.yml` | push / PR | `check:copy`、typecheck、单元测试、Playwright、Rust 三平台 | — |
| `release-zh.yml` 发布中文版 | 手动 | 先跑完整测试（含 e2e），再构建 Windows 安装包、签名、生成 `latest.json`、发布 Release | 不改版本号，版本必须已在仓库中 |

### 通知方式

Issue 是唯一事实来源：GitHub 会给仓库关注者发送 Issue 邮件通知，正文里 `@owner` 再兜底一次。
Issue 带 `upstream-sync` 标签，同一上游提交不会重复创建。

> 前置条件：仓库必须**启用 Issues**（Settings → Features → Issues）。本仓库已启用。

## 人工流程

1. 收到「上游更新：<sha>」Issue。
2. Actions → **同步并汉化（PR）** → Run workflow（可填 `version` 顺带升版本号）。
3. 工作流产出 PR `chore(i18n): 同步上游并汉化`。
4. 在 PR 里查看 `check:copy` 结果与 CI；对照 **pending-strings** 构建产物
   （`zh-dict/pending.tsv`，列出所有未翻译英文串）把新增串补进 `zh-dict/dict.tsv`。
5. CI 全绿后合并。
6. 需要发版时：确认 `package.json` 版本已是要发布的版本 → 运行 **发布中文版**。

## 词典 `zh-dict/dict.tsv`

> `zh-dict/pending.tsv` 是脚本生成的待译清单，已加入 `.gitignore`，不再提交；
> 每次「同步并汉化（PR）」会把它作为构建产物上传，PR 正文里也给出条目数。

每行 `TAB` 分隔，字段依次为：

```
作用域<TAB>源文<TAB>译文<TAB>锚点(可选)<TAB>匹配模式(可选)
```

- **作用域**：`ui` `rust` `core` `website` `meta` `docs` `e2e` `test`，逗号分隔可多选。
- **锚点**：正则，只有当该行匹配锚点时才替换；**单单词词条必须给锚点**。
- **匹配模式**：留空 = 子串替换；`whole` = 只匹配完整的字符串字面量
  （`'…'` / `"…"` / `` `…` ``）。

### 两条硬规则

1. **最长源优先**：加载后按源文长度从长到短排序，保证完整短语先于它的前缀被替换
   （例如 `Open repository in browser` 会先于 `Open repository` 命中）。
2. **单单词必须锚定**：要么给 `锚点`，要么标 `whole`，否则脚本直接报错退出。

### 迁移到 `whole`

`whole` 用于彻底消除"短词命中更长句子前缀"的问题，例如：

```
ui	Open repository	打开仓库		whole
```

它只会替换 `'Open repository'`，不会碰 `'Open repository in browser'`。
注意 `whole` 只适用于**带引号的字面量**；JSX 文本节点（如 `>Cancel<`）仍需用子串 + 锚点。
迁移应逐条进行，并本地跑一次 `pnpm check:copy` 与 `pnpm test:e2e` 验证。

## 混排文案检查 `scripts/check-copy.mjs`

`pnpm check:copy` 扫描 `apps/desktop/src`、`packages/core/src`、`tests/e2e`、`apps/website/src`，
只要**中文与未列入允许表的英文单词出现在同一片段**就失败（如 `打开 in browser`、`复制 public key`）。
路径、标识符、版本号（含 `. / _ - :` 的 token）自动忽略。

允许表在 `scripts/copy-allowlist.json`：`phrases` 放多词专有名词，`words` 放单词技术术语/品牌。
**只允许真正的专有名词或技术术语**，不要用它掩盖半翻译。

## 为什么不自动发布

旧流水线"合并上游 → 自动汉化 → 推 main → 直接发布"有三个结构性问题：

- 子串词典会切坏文案（`Open repository in browser` → `打开仓库 in browser`）；
- 发布前不跑任何测试，坏文案随安装包发出去；
- 自动推 main 会触发 CI 变红，发布却已完成。

现在：**自动做机械且易错的活，人做需要判断的活，PR + CI 当闸门，发布前必过测试。**
