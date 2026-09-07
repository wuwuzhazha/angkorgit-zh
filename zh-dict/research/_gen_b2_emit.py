# -*- coding: utf-8 -*-
# 生成 zh-dict/batches/web/batch.tsv + skip-web.tsv（translator-b · t3）
# 排序：source 长度降序（§4.7 长串优先），同长按字典序
import io, os, re, sys

REPO = r'E:\angkorgit_zh\build\angkorgit'
RESIDUAL = os.path.join(REPO, 'zh-dict', 'research', 'residual.tsv')
OUT_DIR = os.path.join(REPO, 'zh-dict', 'batches', 'web')

sys.path.insert(0, os.path.join(REPO, 'zh-dict', 'research'))
from _gen_b2_docs import DOCS
from _gen_b2_web import WEBSITE, WEBSITE_SKIP

# ---------- 收集 scope→文件 ----------
GLOBS = {
    'website': ['apps/website/src/**/*.ts', 'apps/website/src/**/*.tsx', 'apps/website/src/**/*.astro'],
    'docs': ['README.md', 'docs/**/*.md', 'CHANGELOG.md', 'SECURITY.md', 'CODE_OF_CONDUCT.md'],
}
def glob_to_regex(g):
    esc = re.escape(g)
    esc = esc.replace(r'\*\*/', '(?:.*/)?').replace(r'\*\*', '.*').replace(r'\*', '[^/]*')
    return '^' + esc + '$'

file_cache = {}
def file_lines(rel):
    if rel in file_cache:
        return file_cache[rel]
    abs = os.path.join(REPO, rel.replace('/', os.sep))
    if not os.path.exists(abs):
        file_cache[rel] = None
        return None
    with open(abs, encoding='utf-8', errors='replace') as fh:
        file_cache[rel] = fh.read().splitlines()
    return file_cache[rel]

scope_files = {}
for scope, gs in GLOBS.items():
    rxs = [re.compile(glob_to_regex(g)) for g in gs]
    found = []
    for root, _dirs, files in os.walk(REPO):
        if '.git' in root.split(os.sep):
            continue
        for f in files:
            rel = os.path.relpath(os.path.join(root, f), REPO).replace('\\', '/')
            for rx in rxs:
                if rx.match(rel):
                    found.append(rel)
                    break
    scope_files[scope] = found

def source_exists(scope, src):
    for rel in scope_files[scope]:
        lines = file_lines(rel)
        if not lines:
            continue
        if any(src in ln for ln in lines):
            return True
    return False

def anchor_hits(scope, anchor):
    for rel in scope_files[scope]:
        lines = file_lines(rel)
        if not lines:
            continue
        try:
            rx = re.compile(anchor)
        except re.error:
            return False
        if any(rx.search(ln) for ln in lines):
            return True
    return False

# ---------- 组装条目 ----------
entries = []  # (scope, source, target, anchor)
problems = []

# docs：t1 桶（307 = 271 translate + 36 verify→translate）
for src, tgt in DOCS.items():
    if not tgt or tgt.strip() == src.strip():
        problems.append(f'DOCS 译文缺失/未变: {src!r}')
        continue
    entries.append(('docs', src, tgt, ''))
    if not source_exists('docs', src):
        problems.append(f'DOCS source 未命中文件: {src!r}')

# website：WEBSITE 表（t1 桶 + 补充）
for src, tgt, anchor in WEBSITE:
    if not tgt or tgt.strip() == src.strip():
        problems.append(f'WEB 译文缺失/未变: {src!r}')
        continue
    if not source_exists('website', src):
        problems.append(f'WEB source 未命中: {src!r}')
    if anchor:
        if not anchor_hits('website', anchor):
            problems.append(f'WEB anchor 未命中: {src!r} anchor={anchor!r}')
        try:
            re.compile(anchor)
        except re.error as e:
            problems.append(f'WEB anchor 非法: {src!r} {e}')
    entries.append(('website', src, tgt, anchor))

# 单单词（无空白）必须带 anchor
for scope, src, tgt, anchor in entries:
    if not re.search(r'\s', src) and not anchor:
        problems.append(f'单单词缺 anchor: {src!r}')

# 重复 source（同 scope）
seen = set()
for scope, src, tgt, anchor in entries:
    k = (scope, src)
    if k in seen:
        problems.append(f'重复条目: {k}')
    seen.add(k)

# ---------- 排序（长串优先）----------
entries.sort(key=lambda e: (-len(e[1]), e[1]))

print('=== PROBLEMS ===')
for p in problems:
    print(p)
print('total problems:', len(problems))
print('entries:', len(entries))

# ---------- 写出 batch.tsv ----------
os.makedirs(OUT_DIR, exist_ok=True)
batch_path = os.path.join(OUT_DIR, 'batch.tsv')
with open(batch_path, 'w', encoding='utf-8', newline='') as fh:
    fh.write('# B2 翻译批次（translator-b · t3）：website + docs\n')
    fh.write('# 数据行 %d 条：docs %d（t1 桶 271 translate + 36 verify→translate）+ website %d（t1 桶 + mock 一致性补充）\n' % (
        len(entries), sum(1 for e in entries if e[0] == 'docs'), sum(1 for e in entries if e[0] == 'website')))
    fh.write('# 列：scope<TAB>source<TAB>target<TAB>anchor(可选)；source 与文件逐字一致；按长度降序（长串优先）\n')
    fh.write('# 说明：t1 中“s used for…/re about to commit…/t ship a model…/t save half a conflict…”等为引号处切分产物，\n')
    fh.write('#       本批以整行为 source 覆盖（§3.1 模板串整串产出）；docs 含版本/URL/路径行按 §4.5 保留受保护片段。\n')
    for scope, src, tgt, anchor in entries:
        line = scope + '\t' + src + '\t' + tgt
        if anchor:
            line += '\t' + anchor
        fh.write(line + '\n')

# ---------- 写出 skip-web.tsv ----------
skip_path = os.path.join(OUT_DIR, 'skip-web.tsv')
with open(skip_path, 'w', encoding='utf-8', newline='') as fh:
    fh.write('# B2 跳过清单（translator-b · t3）：裁决为不译的 t1 website 项（verify→skip 及 translate→skip 复核）\n')
    fh.write('# 列：source<TAB>category<TAB>reason\n')
    for src, cat, reason in WEBSITE_SKIP:
        fh.write(src + '\t' + cat + '\t' + reason + '\n')

print('wrote', batch_path)
print('wrote', skip_path)
