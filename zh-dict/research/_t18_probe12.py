import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
# 1) dict entries for Staged header + e2e
print('=== dict Staged / /^Staged/ ===')
for ln in open(r'zh-dict/dict.tsv', encoding='utf-8'):
    ln = ln.rstrip('\n')
    if not ln or ln.startswith('#'):
        continue
    f = ln.split('\t')
    if len(f) < 3:
        continue
    if 'Staged' in f[1] or f[1] in ('Staged',):
        print(' ', f[0], '|', repr(f[1]), '|', repr(f[2]), '|', (f[3] if len(f) > 3 else ''))
# 2) WorkingCopyPanel section header text
print('=== WorkingCopyPanel headers ===')
for i, ln in enumerate(open(r'apps/desktop/src/features/commit/WorkingCopyPanel.tsx', encoding='utf-8'), 1):
    t = ln.strip()
    if 'Staged' in t or '已暂存' in t or 'Changes' in t or '更改' in t:
        if "'" in t or '"' in t or '>' in t:
            print(' ', i, ':', t[:110])
# 3) ui residual for Lane color band
print('=== residual ui Lane color band ===')
for ln in open(r'zh-dict/research/residual.tsv', encoding='utf-8'):
    ln = ln.rstrip('\n')
    if not ln or ln.startswith('#'):
        continue
    f = ln.split('\t')
    if len(f) < 9:
        continue
    if 'Lane color' in f[1]:
        print(' ', f[0], '|', f[2], '|', f[8])
