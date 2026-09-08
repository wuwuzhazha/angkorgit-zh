import sys, io, re, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
REPO = r'E:\angkorgit_zh\build\angkorgit'
BATCH = os.path.join(REPO, 'zh-dict', 'batches', 'v011b', 'rust-e2e', 'batch.tsv')
SKIP = os.path.join(REPO, 'zh-dict', 'batches', 'v011b', 'rust-e2e', 'skip.tsv')

scopeRe = re.compile(r'^(ui|rust|core|website|docs|meta|e2e|test)(,(ui|rust|core|website|docs|meta|e2e|test))*$')
errs = []
n = 0
dups = {}
for ln in open(BATCH, encoding='utf-8'):
    ln = ln.rstrip('\n')
    if not ln or ln.startswith('#'):
        continue
    n += 1
    c = ln.split('\t')
    if len(c) < 3 or len(c) > 4:
        errs.append(f'L{n} 列数 {len(c)}')
        continue
    if not scopeRe.match(c[0]):
        errs.append(f'L{n} scope 非法: {c[0]}')
    if not c[2].strip() or c[1].strip() == c[2].strip():
        errs.append(f'L{n} 译文缺失/未变: {c[1][:50]}')
    if not re.search(r'\s', c[1]) and len(c) < 4:
        errs.append(f'L{n} 单单词缺 anchor: {c[1]}')
    if len(c) > 3:
        try:
            re.compile(c[3])
        except re.error as e:
            errs.append(f'L{n} anchor 非法 [{c[1][:40]}]: {e}')
    dups[c[1]] = dups.get(c[1], 0) + 1
nd = [k for k, v in dups.items() if v > 1]
print(f'batch 数据行: {n} | 格式错误: {len(errs)} | 重复 source: {len(nd)}')
for e in errs[:10]:
    print('  ERR', e)
for d in nd[:10]:
    print('  DUP', d)

# ---- skip 行数与类别 ----
cat = {}
for ln in open(SKIP, encoding='utf-8'):
    ln = ln.rstrip('\n')
    if not ln or ln.startswith('#'):
        continue
    c = ln.split('\t')
    if len(c) >= 2:
        cat[c[1]] = cat.get(c[1], 0) + 1
print('skip 行数:', sum(cat.values()), '| 类别:', dict(sorted(cat.items())))

# ---- 覆盖核对：forward batch3 的 rust/e2e translate 行 → batch 或 skip ----
batch_srcs = []
skip_srcs = []
for ln in open(BATCH, encoding='utf-8'):
    ln = ln.rstrip('\n')
    if not ln or ln.startswith('#'):
        continue
    batch_srcs.append(ln.split('\t')[1])
for ln in open(SKIP, encoding='utf-8'):
    ln = ln.rstrip('\n')
    if not ln or ln.startswith('#'):
        continue
    skip_srcs.append(ln.split('\t')[0])

def covered(src):
    if src in batch_srcs or src in skip_srcs:
        return True
    for b in batch_srcs:
        if src in b:
            return True
    return False

miss = 0
tot = 0
for ln in open(os.path.join(REPO, 'zh-dict', 'research', 'batch3.tsv'), encoding='utf-8'):
    ln = ln.rstrip('\n')
    if not ln or ln.startswith('#'):
        continue
    f = ln.split('\t')
    if f[0] in ('rust', 'e2e'):
        tot += 1
        if not covered(f[1]):
            miss += 1
            print('  MISS:', f[0], repr(f[1][:80]), f[5] if len(f) > 5 else '')
print(f'forward batch3 rust+e2e translate 共 {tot} 条，未覆盖 {miss} 条')

# ---- F7 e2e 断言 10 处 ----
f7_lines = [738, 742, 768, 770, 776, 795, 797, 822, 925, 948]
spec = open(os.path.join(REPO, 'tests', 'e2e', 'smoke.spec.ts'), encoding='utf-8').read().splitlines()
for lineno in f7_lines:
    text = spec[lineno - 1]
    ok = any(text == b or b in text for b in batch_srcs)
    print(f'  F7 line {lineno}: {"OK" if ok else "MISS"} | {text.strip()[:80]}')
