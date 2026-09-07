// gen.mjs — generate batch.tsv + skip-ui.tsv for UI batch (translator-a · t2)
// Run: node zh-dict/batches/ui/gen.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');
const batch1 = readFileSync(join(root, 'zh-dict', 'research', 'batch1.tsv'), 'utf8')
  .split(/\r?\n/)
  .filter((l) => l && !l.startsWith('#'))
  .map((l) => l.split('\t'))
  .filter((c) => c[0] === 'ui');

// [source, target, anchor?]
const ENTRIES = [
  [`#\${pr.number} \${pr.title} — \${pr.author} wants to merge \${pr.sourceBranch} into \${pr.targetBranch}. Double-click to check out, right-click for actions.`,
   `#\${pr.number} \${pr.title} — \${pr.author} 想要将 \${pr.sourceBranch} 合并到 \${pr.targetBranch}。双击检出，右键查看更多操作。`],
  ['Replays {dropAction.source}\'s commits on top of {dropAction.target} — rewrites history',
   '重放 {dropAction.source} 在 {dropAction.target} 之上的提交——这会重写历史'],
  ['Could not read ${PROJECT_REVIEW_FILE} — reviewing without project conventions',
   '无法读取 ${PROJECT_REVIEW_FILE}——将不按项目约定进行审查'],
  ['${cleanHost} is unreachable right now — saving without verification',
   '${cleanHost} 当前不可达——将不经验证保存'],
  ['${branch.name} — click to filter graph, double-click to checkout',
   '${branch.name} — 点击筛选提交图，双击检出'],
  ['Could not reach ${host} — check your network or VPN, then retry.',
   '无法访问 ${host}——请检查网络或 VPN 后重试。'],
  ['Link ${account.username} on ${account.host} to ${profile.label}',
   '将 ${account.host} 上的 ${account.username} 关联到 ${profile.label}'],
  ['Can\'t redo "${entry.label}" — the repository has changed since',
   '无法重做“${entry.label}”——仓库此后已发生变化'],
  ['Can\'t undo "${entry.label}" — the repository has changed since',
   '无法撤销“${entry.label}”——仓库此后已发生变化'],
  ['${branch.name} — drag onto a local branch to merge or rebase',
   '${branch.name} — 拖到本地分支上进行合并或变基'],
  ['${dropAction.target} will be checked out first when merging.',
   '合并时将先检出 ${dropAction.target}。'],
  ['Saved ${cleanHost} as ${finalUsername} — token not verified',
   '已将 ${finalUsername} 保存到 ${cleanHost}——令牌未验证'],
  ['${account.username} is now the default for ${account.host}',
   '${account.username} 现在是 ${account.host} 的默认账户'],
  ['Could not discard "${file}" — the change is still present.',
   '无法丢弃“${file}”——更改仍然存在。'],
  ['Which profile for {request?.repoName}?', '为 {request?.repoName} 选择哪个配置文件？'],
  ['// demo mode — editing is available in the desktop app\\n',
   '// 演示模式——编辑功能可在桌面应用中使用\\n'],
  ['Can\'t redo "${entry.label}" — the branch has moved since',
   '无法重做“${entry.label}”——分支此后已移动'],
  ['Can\'t undo "${entry.label}" — the branch has moved since',
   '无法撤销“${entry.label}”——分支此后已移动'],
  ['· type any name or load the list your key can access',
   '· 输入任意名称，或加载你的密钥可访问的列表'],
  ['Remove ${account.username} on ${account.host}?',
   '移除 ${account.host} 上的 ${account.username}？'],
  ['Removed ${account.username} on ${account.host}',
   '已移除 ${account.host} 上的 ${account.username}'],
  ['Take empty ${side} side (deletes this section)',
   '选择空的 ${side} 侧（删除此部分）'],
  ['${wt.path} — click to switch to this worktree',
   '${wt.path} — 点击切换到该工作树'],
  ['Bitbucket rejected the token (${res.status})',
   'Bitbucket 拒绝了该令牌（${res.status}）'],
  ['Connected ${cleanHost} as ${finalUsername}',
   '已以 ${finalUsername} 身份连接到 ${cleanHost}'],
  ['${branch.name} — double-click to checkout',
   '${branch.name} — 双击检出'],
  ['${wt.path} — this folder no longer exists',
   '${wt.path} — 此文件夹已不存在'],
  ['GitHub rejected the token (${res.status})',
   'GitHub 拒绝了该令牌（${res.status}）'],
  ['GitLab rejected the token (${res.status})',
   'GitLab 拒绝了该令牌（${res.status}）'],
  ['Delete branch ${branchMenu.branch.name}',
   '删除分支 ${branchMenu.branch.name}'],
  ['double-click to switch to that worktree',
   '双击切换到该工作树'],
  ['Rebase onto ${branchMenu.branch.name}',
   '变基到 ${branchMenu.branch.name}'],
  ['${title} — enter a path (demo mode)',
   '${title} — 输入路径（演示模式）'],
  ['The folder is deleted.${branchNote}',
   '此文件夹已删除。${branchNote}'],
  ['Checkout ${branchMenu.branch.name}',
   '检出 ${branchMenu.branch.name}'],
  ['Cherry-pick ${oids.length} commits',
   '拣选 ${oids.length} 个提交'],
  ['Pull request #${pr.number} actions',
   '拉取请求 #${pr.number} 的操作'],
  ['Could not load commit: ${message}',
   '无法加载提交：${message}'],
  ['Merge ${branchMenu.branch.name}',
   '合并 ${branchMenu.branch.name}'],
  ['Rebase ${source} onto ${target}',
   '将 ${source} 变基到 ${target}'],
  ['Merge ${source} into ${target}',
   '将 ${source} 合并到 ${target}'],
  ['Pull ${branchMenu.branch.name}',
   '拉取 ${branchMenu.branch.name}'],
  ['Push ${branchMenu.branch.name}',
   '推送 ${branchMenu.branch.name}'],
  ['Update remote ${edit.original}',
   '更新远端 ${edit.original}'],
  ['· token in the system keychain',
   '· 令牌保存在系统钥匙串中'],
  ['${wt.path} — open in this tab',
   '${wt.path} — 在此标签页中打开'],
  ['Remote ${remote.name} actions',
   '远端 ${remote.name} 的操作'],
  ['Could not load file history:',
   '无法加载文件历史：'],
  ['Could not load more commits:',
   '无法加载更多提交：'],
  ['Could not load the history:',
   '无法加载历史记录：'],
  ['Removed worktree ${wt.name}',
   '已移除工作树 ${wt.name}'],
  ['--- demo staged patch ---',
   '--- 演示暂存补丁 ---'],
  ['Clear ${repoState} state?',
   '清除 ${repoState} 状态？'],
  ['double-click to checkout',
   '双击检出'],
  ['Checkout ${branch.name}',
   '检出 ${branch.name}'],
  ['${branch.name} actions',
   '分支 ${branch.name} 的操作'],
  ['Checkout #${pr.number}',
   '检出 #${pr.number}'],
  ['Delete tag ${tag.name}',
   '删除标签 ${tag.name}'],
  ['Redid: ${entry.label}',
   '已重做：${entry.label}'],
  ['Undid: ${entry.label}',
   '已撤销：${entry.label}'],
  ['Checkout ${tag.name}',
   '检出 ${tag.name}'],
  ['Discard ${file.path}',
   '丢弃 ${file.path}'],
  ['GitLab (self-hosted)',
   'GitLab（自托管）'],
  ['Push tag ${tag.name}',
   '推送标签 ${tag.name}'],
  ['Unstage ${file.path}',
   '取消暂存 ${file.path}'],
  ['${sub.name} actions',
   '子模块 ${sub.name} 的操作'],
  ['${tag.name} actions',
   '标签 ${tag.name} 的操作'],
  ['Contents of ${file}',
   '${file} 的内容'],
  ['commit "${summary}"',
   '提交“${summary}”'],
  ['${path} (worktree)',
   '${path}（工作树）'],
  ['${wt.name} actions',
   '工作树 ${wt.name} 的操作'],
  ['Checkout ${source}',
   '检出 ${source}'],
  ['Checkout ${target}',
   '检出 ${target}'],
  ['Stage ${file.path}',
   '暂存 ${file.path}'],
  ['Update ${sub.name}',
   '更新 ${sub.name}'],
  ['${label} complete',
   '${label} 完成'],
  ['Forget ${wt.name}',
   '忘记 ${wt.name}'],
  ['Cherry-pick done',
   '拣选完成'],
  ['Remove ${r.name}',
   '移除 ${r.name}'],
  ['Editing ${file}',
   '正在编辑 ${file}'],
  ['Fetch ${r.name}',
   '获取 ${r.name}'],
  ['${file} saved',
   '${file} 已保存'],
  ['(no message)',
   '（无消息）', '\\(no message\\)<'],
  ['Demo User',
   '演示用户', "'Demo User'"],
  ['· checked',
   '· 已验证', '· checked \\{'],
  ['Profiles',
   '配置文件', 'title="Profiles"'],
  ['Provider',
   '提供方', 'title="Provider"'],
  ['Worktree',
   '工作树', 'aria-label="Worktree"'],
  ['· origin',
   '· 远端', "\\? ' · origin' :"],
  ['Opening {name}…',
   '正在打开 {name}…'],
  ['· local',
   '· 本地', "\\? ' · local' :"],
  ['Draft',
   '草稿', '>Draft<'],
  ['Theme',
   '主题', 'title="Theme"'],
  ['Token',
   '令牌', 'label="Token"'],
  ['Work',
   '工作', 'placeholder="Work"'],
  ['Zoom',
   '缩放', 'title="Zoom"'],
];

// skip: batch1-sourced skips [source, category]; verify skips [scope, source, category]
const BATCH1_SKIP = [
  ['s commits on top of {dropAction.target} — rewrites history',
   'partial-snippet：扫描器提取残片（缺失 Replays {dropAction.source}\'s），已用完整词条替换'],
  ['s identity and',
   'partial-snippet：跨行 JSX 描述残片（profilePrompt.tsx:53），整句跨行无法字面替换'],
  ['Which profile for',
   'partial-snippet：已用完整词条 Which profile for {request?.repoName}? 替换'],
  ['Opening',
   'partial-snippet：已用完整词条 Opening {name}… 替换'],
  ['(folder: TreeFolder',
   'code：TS 函数签名（FileTree.tsx:109）被 JSX 扫描误报'],
  ['): number',
   'code：TS 函数签名（ConflictResolver.tsx:113）被 JSX 扫描误报'],
  ['): string',
   'code：TS 函数签名（AccountsTab.tsx:99）被 JSX 扫描误报'],
  ['\\b \\b',
   'code：终端退格控制序列（TerminalPanel.tsx:45）'],
  ["'JetBrains Mono', monospace",
   'css：字体族字符串（TerminalPanel.tsx:19）'],
  ['Bearer ${token}',
   'code：HTTP Authorization 认证头（AccountsTab.tsx:146）'],
  ['gitlab.example.com',
   'ident：示例占位域名（placeholder），保留英文'],
  ['v1.0.0',
   'ident：版本号示例（placeholder），保留原文'],
  ['sk-…',
   'ident：API 密钥前缀示例（placeholder），保留原文'],
  ['Esc',
   'key：快捷键键名，保留原文'],
  ['Home / End',
   'key：快捷键键名，保留原文'],
  ['A / C',
   'key：快捷键键名，保留原文'],
  ['K / P',
   'key：快捷键键名，保留原文'],
  ['P / N',
   'key：快捷键键名，保留原文'],
  ['SSH',
   'term：协议名，保留英文（与 dict 既有 SSH 词条一致）'],
  ['AngKorGit v${version}',
   'brand：品牌名 + 版本号，保留原文'],
  ['Cherry-picked ${oids.length} commits (demo)',
   'demo：演示模式 toast，e2e 断言引用（smoke.spec.ts:150），保持英文'],
  ['Cherry-picked (demo)',
   'demo：演示模式 toast，e2e 断言引用（smoke.spec.ts:130），保持英文'],
  ['Merged ${name} (demo)',
   'demo：演示模式 toast（ipc.ts demo 分支），保持英文'],
  ['Rebased onto ${upstream} (demo)',
   'demo：演示模式 toast（ipc.ts demo 分支），保持英文'],
  ['Rebase complete (demo)',
   'demo：演示模式 toast（ipc.ts demo 分支），保持英文'],
  ['Pushed to ${remote} (demo)',
   'demo：演示模式 toast（ipc.ts demo 分支），保持英文'],
  ['Fetched ${remote} (demo)',
   'demo：演示模式 toast（ipc.ts demo 分支），保持英文'],
  ['Pulled ${branch} (demo)',
   'demo：演示模式 toast（ipc.ts demo 分支），保持英文'],
  ['Pushed tag ${tag} (demo)',
   'demo：演示模式 toast（ipc.ts demo 分支），保持英文'],
  ['Reverted (demo)',
   'demo：演示模式 toast（ipc.ts demo 分支），保持英文'],
];

const VERIFY_SKIP = [
  ['ui', '12px "JetBrains Mono", monospace', 'css：字体栈字符串（VirtualDiff.tsx:68）'],
  ['ui', '.svg', 'ident：文件扩展名（DiffViewer.tsx:153）'],
  ['ui', '\\n\\n', 'code：空白字符串（CommitDetails.tsx:70）'],
  ['ui', '\\x7f', 'code：控制字符（TerminalPanel.tsx:45）'],
  ['e2e', '.font-mono', 'css：CSS 选择器（smoke.spec.ts:147）'],
  ['e2e', 'pnpm --filter @angkorgit/desktop dev', 'command：CLI 命令（playwright.config.ts:12）'],
];

// ---- long-source-first sort (contract §4.7) ----
ENTRIES.sort((a, b) => b[0].length - a[0].length || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));

// ---- validation ----
const batchSrcs = new Set(ENTRIES.map((e) => e[0]));
const skipSrcs = new Set(BATCH1_SKIP.map((e) => e[0]));
const dup = ENTRIES.filter((e, i) => ENTRIES.findIndex((x) => x[0] === e[0]) !== i);
if (dup.length) throw new Error(`duplicate sources in ENTRIES: ${dup.map((d) => d[0]).join(' | ')}`);
for (const e of ENTRIES) {
  if (skipSrcs.has(e[0])) throw new Error(`entry also in BATCH1_SKIP: ${e[0]}`);
  const cj = (e[1].match(/[\u4e00-\u9fff]/g) || []).length;
  if (cj === 0) throw new Error(`target has no CJK: ${e[0]}`);
}
// every batch1 translate row must be covered (exact, or by a longer full-string entry)
const missing = [];
for (const row of batch1) {
  const src = row[1];
  if (skipSrcs.has(src)) continue;
  if (batchSrcs.has(src)) continue;
  const cover = [...batchSrcs].find((s) => s.includes(src));
  if (!cover) missing.push(src);
}
if (missing.length) {
  console.error('UNCOVERED batch1 rows:', missing);
  process.exit(1);
}

// ---- write ----
mkdirSync(here, { recursive: true });
const head = [
  '# B1 翻译批次（translator-a · t2）：batch1.tsv 全 123 行处置 —— 可译 92 条（含 3 条完整词条替换残片）/ 不可译 31 条',
  '# 列：scope<TAB>source<TAB>target<TAB>anchor(可选)；source 按长度降序（长串优先，契约 §4.7）',
  '# 占位符 ${...}/{...} 与转义 \\n 原样保留（契约 §4.1）；裸词条全部带 anchor（契约 §4.6）',
  '# 不可译 31 条（demo x11 / key x5 / partial-snippet x4 / code x5 / css x2 / ident x3 / brand x1 / term x1）见 skip-ui.tsv',
];
const lines = [...head, ...ENTRIES.map(([s, t, a]) => `ui\t${s}\t${t}${a ? `\t${a}` : ''}`)];
writeFileSync(join(here, 'batch.tsv'), lines.join('\n') + '\n', 'utf8');

const skipHead = [
  '# skip-ui.tsv — B1（batch1.tsv）不可译清单 + verify.tsv ui/e2e 裁决',
  '# 列：scope<TAB>source<TAB>category',
  '# batch1.tsv 全部 123 行均有处置：本文件 31 条 + batch.tsv 92 条词条',
];
const verifyLines = VERIFY_SKIP.map(([s, src, c]) => `${s}\t${src}\t${c}`);
const batchSkipLines = BATCH1_SKIP.map(([src, c]) => `ui\t${src}\t${c}`);
writeFileSync(join(here, 'skip-ui.tsv'), [...skipHead, ...verifyLines, '', '# ---- batch1.tsv 裁决 ----', ...batchSkipLines].join('\n') + '\n', 'utf8');

console.log(`OK entries=${ENTRIES.length} batch1Skip=${BATCH1_SKIP.length} verifySkip=${VERIFY_SKIP.length}`);