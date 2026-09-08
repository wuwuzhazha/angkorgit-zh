import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
# Check ui residual for Apply {picked / of {diffs / Lane color band / Staged header, and e2e skip reasons
for ln in open(r'zh-dict/research/residual.tsv', encoding='utf-8'):
    ln = ln.rstrip('\n')
    if not ln or ln.startswith('#'):
        continue
    f = ln.split('\t')
    if len(f) < 9:
        continue
    if any(k in f[1] for k in ['picked.size', 'of {diffs', 'Lane color', 'Apply {picked', 'selected']):
        print(f[0], '|', f[2], '|', f[3], '|', repr(f[1][:90]), '|', f[8])
print('--- e2e skip reasons for of-N selected / spills / geometry ---')
for ln in open(r'zh-dict/research/residual.tsv', encoding='utf-8'):
    ln = ln.rstrip('\n')
    if not ln or ln.startswith('#'):
        continue
    f = ln.split('\t')
    if len(f) < 9:
        continue
    if f[0] == 'e2e' and any(k in f[1] for k in ['4 of 5', '1 of 2', '1 of 5', 'spills', 'clipped', 'dialog geometry', 'Virtualized rows', 'Explains the why', 'feat(worktrees)']):
        print(f[1][:80], '|', f[2], '|', f[3], '|', f[8])
