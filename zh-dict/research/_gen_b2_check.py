# -*- coding: utf-8 -*-
# 生成 zh-dict/batches/web/batch.tsv + skip-web.tsv，并做源串命中校验
import io, os, re, sys

REPO = r'E:\angkorgit_zh\build\angkorgit'
OUT_DIR = os.path.join(REPO, 'zh-dict', 'batches', 'web')

sys.path.insert(0, os.path.join(REPO, 'zh-dict', 'research'))
from _gen_b2_docs import DOCS
from _gen_b2_web import WEBSITE, WEBSITE_SKIP

# ---- 收集 scope→文件列表（与 merge-batches.ps1 §8 一致）----
GLOBS = {
    'website': ['apps/website/src/**/*.ts', 'apps/website/src/**/*.tsx', 'apps/website/src/**/*.astro'],
    'docs': ['README.md', 'docs/**/*.md', 'CHANGELOG.md', 'SECURITY.md', 'CODE_OF_CONDUCT.md'],
}
def glob_to_regex(g):
    esc = re.escape(g)
    esc = esc.replace(r'\*\*/', '(?:.*/)?').replace(r'\*\*', '.*').replace(r'\*', '[^/]*')
    return '^' + esc + '$'

file_cache = {}  # rel -> content lines
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

# ---- 校验 website 源串命中 ----
miss = []
for src, tgt, anchor in WEBSITE:
    hit = False
    for rel in scope_files['website']:
        lines = file_lines(rel)
        if not lines:
            continue
        for ln in lines:
            if src in ln:
                hit = True
                break
        if hit:
            break
    if not hit:
        miss.append(('website', src))

# ---- 校验 docs 源串命中（按残差清单 first_loc 文件）----
residual_src = {}
for ln in open(os.path.join(REPO, 'zh-dict', 'research', 'residual.tsv'), encoding='utf-8'):
    ln = ln.rstrip('\n')
    if not ln or ln.startswith('#'):
        continue
    f = ln.split('\t')
    if len(f) < 9:
        continue
    if f[0] == 'docs' and f[2] in ('translate', 'verify'):
        residual_src[f[1]] = f[8].split(':')[0]

for src, tgt in DOCS.items():
    rel = residual_src.get(src, '')
    if rel:
        lines = file_lines(rel)
        if lines is None:
            miss.append(('docs-missing-file', src, rel))
            continue
        if not any(src in ln for ln in lines):
            miss.append(('docs', src, rel))
    else:
        miss.append(('docs-no-loc', src))

print('=== MISS ===')
for m in miss:
    print(m)
print('total miss:', len(miss))

# ---- anchor 命中校验 ----
anchor_miss = []
for src, tgt, anchor in WEBSITE:
    if not anchor:
        continue
    hit = False
    for rel in scope_files['website']:
        lines = file_lines(rel)
        if not lines:
            continue
        for ln in lines:
            try:
                if re.search(anchor, ln):
                    hit = True
                    break
            except re.error as e:
                anchor_miss.append(('anchor-regex-err', src, anchor, str(e)))
                hit = True
                break
        if hit:
            break
    if not hit:
        anchor_miss.append(('anchor-no-hit', src, anchor))
print('=== ANCHOR MISS ===')
for m in anchor_miss:
    print(m)
