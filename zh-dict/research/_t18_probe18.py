import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
# UI residual for CommitDetails:583 Apply template and 568 selected counter, Lane color band
for ln in open(r'zh-dict/research/residual.tsv', encoding='utf-8'):
    ln = ln.rstrip('\n')
    if not ln or ln.startswith('#'):
        continue
    f = ln.split('\t')
    if len(f) < 9:
        continue
    if f[0] == 'ui' and ('Apply {picked' in f[1] or 'selected' in f[1] or 'picked.size' in f[1] or 'of {diffs' in f[1] or 'Lane color' in f[1] or 'files}' in f[1]):
        print(f[0], '|', f[2], '|', f[3], '|', repr(f[1][:110]), '|', f[8])
# also check batch1.tsv for the exact Apply template at CommitDetails:583
print('=== batch1 CommitDetails:583 / 568 ===')
for ln in open(r'zh-dict/research/batch1.tsv', encoding='utf-8'):
    ln = ln.rstrip('\n')
    if not ln or ln.startswith('#'):
        continue
    f = ln.split('\t')
    if len(f) > 5 and f[5] in ('apps/desktop/src/features/inspector/CommitDetails.tsx:583', 'apps/desktop/src/features/inspector/CommitDetails.tsx:568'):
        print(f[0], '|', repr(f[1][:110]))
