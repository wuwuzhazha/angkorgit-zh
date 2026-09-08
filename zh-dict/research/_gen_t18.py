# -*- coding: utf-8 -*-
# t18 B2 批次：0.11.0 rust + e2e（translator-b）
# 产物：zh-dict/batches/v011b/rust-e2e/batch.tsv + skip.tsv
# batch 条目手工精选（用户可见/断言同步）；skip 由 batch3.tsv 精确 source 驱动，确保覆盖无遗漏
import io, os, re, sys

REPO = r'E:\angkorgit_zh\build\angkorgit'
OUT_DIR = os.path.join(REPO, 'zh-dict', 'batches', 'v011b', 'rust-e2e')
B3 = os.path.join(REPO, 'zh-dict', 'research', 'batch3.tsv')

# ---------------- e2e 翻译（与 t17 ui-web 译文一致） ----------------
E2E = [
('e2e', 'Reset branch to its remote?', '将分支重置到其远端？', ''),
('e2e', 'Reset branch', '重置分支', ''),
('e2e', 'Pop latest stash', '弹出最新暂存', ''),
('e2e', 'Stash selected changes', '暂存选中的更改', ''),
('e2e', 'Filter changed files…', '过滤更改的文件…', ''),
('e2e', 'Hide file filter', '隐藏文件过滤', ''),
('e2e', 'Clear filter', '清除过滤条件', ''),
('e2e', 'Commit files', '提交文件', ''),
('e2e', 'Filter files', '过滤文件', ''),
('e2e', 'Filter files…', '过滤文件…', ''),
('e2e', 'Apply src/features/graph/GraphRow.tsx from the stash', '从暂存中应用 src/features/graph/GraphRow.tsx', ''),
('e2e', 'Select src/features/graph/CommitGraph.tsx to apply', '选择 src/features/graph/CommitGraph.tsx 以应用', ''),
('e2e', 'Applied GraphRow.tsx from the stash', '已从暂存中应用 GraphRow.tsx', ''),
('e2e', 'Applied 4 files from the stash', '已从暂存中应用 4 个文件', ''),
('e2e', 'This is a stash.', '这是一个暂存。', ''),
('e2e', 'Stage 3 files', '暂存 3 个文件', ''),
('e2e', '/Stash this file/', '/暂存此文件/', ''),
('e2e', '/Stash 3 files/', '/暂存 3 个文件/', ''),
('e2e', "name: 'Stash'", "name: '暂存'", "name: 'Stash'"),
('e2e', '/2 commits only on the local branch will be lost/', '/2 个提交仅存在于本地分支，将被丢弃/', ''),
]

# ---------------- rust 翻译（仅用户可见运行时错误） ----------------
RUST = [
('rust', 'nothing to stash in the selected files', '所选文件中没有可暂存的内容', ''),
('rust', 'could not run git stash {verb}: {e}', '无法运行 git stash {verb}：{e}', ''),
('rust', '{file} is not part of this stash', '{file} 不属于此暂存', ''),
('rust', '{file} has no changes to stash', '{file} 没有可暂存的更改', ''),
('rust', 'stash {index} does not exist', '暂存 {index} 不存在', ''),
('rust', '{file} is untracked', '{file} 是未跟踪文件', ''),
('test', 'not part of this stash', '不属于此暂存', ''),
]

# ---------------- e2e skip 决策（精确 source 来自 batch3） ----------------
E2E_SKIP_REASON = {
    'feat(worktrees): list, create and remove linked worktrees': ('fixture', '测试输入：提交摘要样例（demo 提交消息）'),
    'section[aria-label^="文件差异："] div.overflow-y-auto': ('css', 'CSS 选择器（aria 已是中文）'),
    'section[aria-label^="文件差异："] span.font-mono': ('css', 'CSS 选择器（aria 已是中文）'),
    'section[aria-label*=" 的历史"]': ('css', 'CSS 选择器（aria 已是中文）'),
    'src/features/graph/CommitGraph.tsx 的历史': ('cjk', '已含中文标签'),
    '丢弃 src/features/graph/CommitGraph.tsx': ('cjk', '已含中文标签'),
    '${String(name)} spills right': ('test-name', 'expect 断言标签（开发向）'),
    '${String(name)} spills left': ('test-name', 'expect 断言标签（开发向）'),
    'spills right': ('test-name', 'expect 断言标签（开发向）'),
    'spills left': ('test-name', 'expect 断言标签（开发向）'),
    'clipped: ${part.text}': ('test-name', 'expect 断言标签（开发向）'),
    'spills: ${part.text}': ('test-name', 'expect 断言标签（开发向）'),
    'Explains the why.': ('fixture', '测试输入：提交说明样例'),
    'arrow keys walk from the graph into a commit\u2019s files and back': ('test-name', 'e2e 测试用例名'),
    'pnpm --filter @angkorgit/desktop dev': ('command', '启动命令'),
    '.font-mono': ('css', 'CSS 选择器'),
    'dialog geometry missing': ('test-name', '测试内 throw 的错误消息（开发向）'),
    'Virtualized rows keep large graphs smooth': ('demo', 'demo 提交消息断言（demo.ts 不译）'),
    '4 of 5 selected': ('css', '计数断言（数字+of 结构，保留）'),
    '1 of 2': ('css', '计数断言（数字+of 结构，保留）'),
    '1 of 5': ('css', '计数断言（数字+of 结构，保留）'),
    'WIP on main: experiment with lane colors': ('demo', 'demo 暂存消息（demo.ts 不译，保持英文）'),
    'Apply 4 files': ('ui-sync', 'UI 侧未入词条（CommitDetails:583 模板），断言保持英文与 UI 一致'),
    'Lane color band': ('ui-sync', 'UI 侧未入词条（CommitGraph:440），断言保持英文与 UI 一致'),
}

# ---------------- rust skip 决策 ----------------
RUST_SKIP_REASON = {
    'unexpected http status code: 403; class=Http (34)': ('code', 'libgit2 错误文本解析标记'),
    'unexpected http status code: 401': ('code', 'libgit2 错误文本解析标记'),
    'unexpected http status code: 402': ('code', 'libgit2 错误文本解析标记'),
    'unexpected http status code: 500': ('code', 'libgit2 错误文本解析标记'),
    'unexpected http status code:': ('code', 'HTTP_STATUS_MARKER 常量'),
    'Bearer {token}': ('code', 'Authorization 头协议值'),
    'Basic {basic}': ('code', 'Authorization Basic 协议值'),
    '[GNUPG:] SIG_CREATED': ('code', 'gpg --status-fd 输出解析标记'),
    '{file_header}@@ -{start},{old_count} +{start},{new_count} @@\\n{body}': ('code', 'diff hunk 头语法拼接串'),
    'Revert \\"{summary}\\"\\n\\nThis reverts commit {full_oid}.': ('code', 'git revert 惯例文案（GitHub 依赖识别）'),
    '\\\\ No newline at end of file\\n': ('code', '统一 diff 协议标记行'),
    'uncommitted changes exist in the index': ('code', 'libgit2 错误文本匹配标记（stash 回退判定）'),
    'commit: {}': ('gitraw', 'reflog 消息'),
    'fast-forward merge {branch}': ('gitraw', 'reflog 消息'),
    'pull request checkout': ('gitraw', 'reflog 消息'),
    'checkout: fast-forward {local_name} to its upstream': ('gitraw', 'reflog 消息'),
    'index on {branch}: {short} {summary}': ('gitraw', 'stash 提交消息格式（git 惯例）'),
    'WIP on {branch}: {short} {summary}': ('gitraw', 'stash 提交消息格式（git 惯例）'),
    'untracked files on {branch}: {short} {summary}': ('gitraw', 'stash 提交消息格式（git 惯例）'),
    'untracked files on': ('gitraw', 'stash 提交消息格式片段'),
    'command -v {name} || true': ('command', 'shell 命令片段（PATH 探测）'),
    'github.com=dara-work, gitlab.com=dara': ('fixture', 'parse_account_bindings 模块测试夹具'),
    'nonsense,=user,host=, GitHub.com=Dara': ('fixture', 'parse_account_bindings 模块测试夹具'),
    'diff mentioning {OUTPUT_FILE_PLACEHOLDER} literally': ('fixture', 'ai_cli 模块测试提示词夹具'),
    'Test User': ('fixture', 'sign 模块测试 git 身份夹具'),
    'AI CLI': ('ident', '类别术语（未知 CLI 回退标签）'),
    'checked above': ('test-name', 'expect 消息标签'),
    'checkout must refuse a branch checked out in a worktree': ('test-name', 'git_engine 测试用例名'),
    'adding a worktree for the checked-out branch must fail': ('test-name', 'git_engine 测试用例名'),
    'dirty worktree must not be removed': ('test-name', 'git_engine 测试用例名'),
    'main repo stays intact': ('test-name', 'git_engine 断言消息'),
    'missing origin line in: {engine_message:?}': ('test-name', 'git_engine 断言消息'),
    'message {message:?}': ('test-name', 'git_engine 断言消息'),
    'line should be staged': ('test-name', 'git_engine 断言消息'),
    'fix: adjust\\n\\nSigned-off-by: Test User <test@angkorgit.dev>': ('fixture', 'git_engine 夹具提交消息（verify 裁决）'),
}

# ---------------- 组装：从 batch3 精确 source 构建 skip ----------------
batch_srcs = set()
for scope, src, tgt, anchor in E2E + RUST:
    batch_srcs.add(src)

b3_rows = []
for ln in open(B3, encoding='utf-8'):
    ln = ln.rstrip('\n')
    if not ln or ln.startswith('#'):
        continue
    f = ln.split('\t')
    if f[0] in ('rust', 'e2e'):
        b3_rows.append(f)

problems = []
# verify.tsv 裁决（rust/e2e scope）：全部 skip，理由归类
skips = [
    ('arrow keys walk from the graph into a commit\u2019s files and back', 'test-name', 'e2e 测试用例名（verify 裁决）'),
    ('pnpm --filter @angkorgit/desktop dev', 'command', '启动命令（verify 裁决）'),
    ('.font-mono', 'css', 'CSS 选择器（verify 裁决）'),
    ('fix: adjust\\n\\nSigned-off-by: Test User <test@angkorgit.dev>', 'fixture', 'git_engine 夹具提交消息（verify 裁决）'),
]
unclassified = []
for f in b3_rows:
    scope, src = f[0], f[1]
    if src in batch_srcs:
        continue
    if scope == 'e2e':
        if src in E2E_SKIP_REASON:
            cat, reason = E2E_SKIP_REASON[src]
            skips.append((src, cat, reason))
        else:
            unclassified.append((scope, src))
    else:
        if src in RUST_SKIP_REASON:
            cat, reason = RUST_SKIP_REASON[src]
            skips.append((src, cat, reason))
        elif 'git_engine.rs' in (f[5] if len(f) > 5 else ''):
            # 集成测试夹具：短提交消息样例 / 断言子串
            if re.search(r'\s', src) and len(src) < 60:
                skips.append((src, 'fixture', 'git_engine 夹具提交消息/断言子串'))
            else:
                unclassified.append((scope, src))
        else:
            unclassified.append((scope, src))

print('=== UNCLASSIFIED（需复核） ===')
for scope, src in unclassified:
    print(' ', scope, repr(src[:100]))
print('unclassified:', len(unclassified))
print('batch entries:', len(batch_srcs), '| skip entries:', len(skips))

# ---------------- 校验 batch ----------------
entries = list(E2E) + list(RUST)
problems2 = []
for scope, src, tgt, anchor in entries:
    if not re.search(r'\s', src) and not anchor:
        problems2.append(f'单单词缺 anchor: {src!r}')
    if src in E2E_SKIP_REASON or src in RUST_SKIP_REASON:
        problems2.append(f'batch 与 skip 重复: {src!r}')
seen = set()
for scope, src, tgt, anchor in entries:
    if src in seen:
        problems2.append(f'重复 source: {src!r}')
    seen.add(src)
print('batch 校验问题:', len(problems2))
for p in problems2:
    print('  ', p)

# source 命中
def hit(scope, src):
    if scope == 'e2e':
        p = os.path.join(REPO, 'tests', 'e2e', 'smoke.spec.ts')
    elif scope == 'test':
        p = os.path.join(REPO, 'apps', 'desktop', 'src-tauri', 'tests', 'git_engine.rs')
    else:
        return None  # rust：宽松校验（src 或 tests）
    return src in open(p, encoding='utf-8', errors='replace').read()

miss_hit = []
for scope, src, tgt, anchor in entries:
    if scope == 'e2e' and not hit('e2e', src):
        miss_hit.append(('e2e', src))
    if scope == 'test' and not hit('test', src):
        miss_hit.append(('test', src))
print('source 未命中:', len(miss_hit))
for m in miss_hit:
    print('  ', m)

# 排序
entries.sort(key=lambda e: (-len(e[1]), e[1]))
skips.sort(key=lambda s: s[0])

os.makedirs(OUT_DIR, exist_ok=True)
with open(os.path.join(OUT_DIR, 'batch.tsv'), 'w', encoding='utf-8', newline='') as fh:
    fh.write('# 0.11.0 rust + e2e 翻译批次（translator-b · t18）\n')
    fh.write('# 数据行 %d：e2e %d（F7 断言同步 + forward e2e 断言）+ rust %d + test 断言同步 %d\n' % (
        len(entries),
        sum(1 for e in entries if e[0] == 'e2e'),
        sum(1 for e in entries if e[0] == 'rust'),
        sum(1 for e in entries if e[0] == 'test')))
    fh.write('# 列：scope<TAB>source<TAB>target<TAB>anchor(可选)；按长度降序\n')
    fh.write('# e2e 目标与 t17 ui-web 词条一致（F7 家族）；rust 仅译用户可见错误，耦合串/夹具进 skip\n')
    for scope, src, tgt, anchor in entries:
        line = scope + '\t' + src + '\t' + tgt
        if anchor:
            line += '\t' + anchor
        fh.write(line + '\n')

with open(os.path.join(OUT_DIR, 'skip.tsv'), 'w', encoding='utf-8', newline='') as fh:
    fh.write('# 0.11.0 rust + e2e 跳过清单（translator-b · t18）\n')
    fh.write('# 列：source<TAB>category<TAB>reason\n')
    for src, cat, reason in skips:
        fh.write(src + '\t' + cat + '\t' + reason + '\n')

print('wrote', os.path.join(OUT_DIR, 'batch.tsv'))
print('wrote', os.path.join(OUT_DIR, 'skip.tsv'))
