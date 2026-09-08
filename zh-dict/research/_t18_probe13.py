import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
# UI residual for Lane color band / Staged header / Apply picked / of counters
for ln in open(r'zh-dict/research/residual.tsv', encoding='utf-8'):
    ln = ln.rstrip('\n')
    if not ln or ln.startswith('#'):
        continue
    f = ln.split('\t')
    if len(f) < 9:
        continue
    if f[0] == 'ui' and ('Lane color' in f[1] or f[1] in ('Staged', 'Changes') or 'picked.size' in f[1] or 'of {diffs' in f[1]):
        print('UI-RESIDUAL:', f[1][:100], '|', f[2], '|', f[8])
# e2e assertions still English in smoke.spec related to reset/stash/filter/keyboard (line scan)
print('=== e2e residual reset/stash/filter keyboard ===')
for ln in open(r'zh-dict/research/residual.tsv', encoding='utf-8'):
    ln = ln.rstrip('\n')
    if not ln or ln.startswith('#'):
        continue
    f = ln.split('\t')
    if len(f) < 9:
        continue
    if f[0] == 'e2e' and f[2] == 'translate' and any(k in f[1] for k in ['2 commits', 'will be lost', 'Stash', 'Reset branch', 'Pop latest', 'Filter', 'Clear filter', 'Commit files', 'Lane color', 'Apply ', 'Applied ', 'Stage ', 'Staged']):
        print(' ', repr(f[1][:90]), '|', f[8])
