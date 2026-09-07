# -*- coding: utf-8 -*-
# 校验 batch.tsv 的 anchor 是否命中 scope 文件（模拟 merge-batches.ps1 §8）
import os, re, sys

REPO = r'E:\angkorgit_zh\build\angkorgit'
GLOBS = {
    'website': ['apps/website/src/**/*.ts', 'apps/website/src/**/*.tsx', 'apps/website/src/**/*.astro'],
    'docs': ['README.md', 'docs/**/*.md', 'CHANGELOG.md', 'SECURITY.md', 'CODE_OF_CONDUCT.md'],
}

def glob_re(g):
    e = re.escape(g).replace(r'\*\*/', '(?:.*/)?').replace(r'\*\*', '.*').replace(r'\*', '[^/]*')
    return '^' + e + '$'

files = {}
for scope, gs in GLOBS.items():
    rxs = [re.compile(glob_re(g)) for g in gs]
    lst = []
    for root, _d, fs in os.walk(REPO):
        if '.git' in root.split(os.sep):
            continue
        for f in fs:
            rel = os.path.relpath(os.path.join(root, f), REPO).replace(os.sep, '/')
            for rx in rxs:
                if rx.match(rel):
                    lst.append(rel)
                    break
    files[scope] = lst

miss = []
for ln in open(os.path.join(REPO, 'zh-dict', 'batches', 'web', 'batch.tsv'), encoding='utf-8'):
    ln = ln.rstrip('\n')
    if not ln or ln.startswith('#'):
        continue
    c = ln.split('\t')
    if len(c) < 4:
        continue
    scope, src, anchor = c[0], c[1], c[3]
    hit = False
    for rel in files.get(scope, []):
        p = os.path.join(REPO, rel.replace('/', os.sep))
        try:
            with open(p, encoding='utf-8', errors='replace') as fh:
                if any(re.search(anchor, l) for l in fh):
                    hit = True
                    break
        except FileNotFoundError:
            pass
    if not hit:
        miss.append((scope, src, anchor))

print('anchor 未命中:', len(miss))
for m in miss:
    print(' ', m)
