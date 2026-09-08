import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
# Check Lane color band / Apply / selected / of N in forward batch1.tsv and dict.tsv
pats = ['Lane color band', 'Apply ', 'selected', ' of ', 'Staged', 'files', 'Stash', 'Stage ']
print('=== batch1.tsv (forward ui) matches ===')
for ln in open(r'zh-dict/research/batch1.tsv', encoding='utf-8'):
    ln = ln.rstrip('\n')
    if not ln or ln.startswith('#'):
        continue
    f = ln.split('\t')
    src = f[1]
    for k in ['Lane color band', 'Apply ', 'selected', ' of ', 'files', 'Stash ', 'Stage ', 'Pop latest', 'Reset branch', 'Filter ', 'Clear filter', 'Hide file', 'Commit files', 'Stash this file', 'Stash selected', 'This is a stash', 'Applied ', 'Select ', 'Stash {menuMulti', 'only on the local']:
        if k in src:
            print(' ', f[0], '|', src[:110], '|', (f[5] if len(f) > 5 else ''))
            break
print()
print('=== dict.tsv matches for Lane/Apply/selected/Staged ===')
for ln in open(r'zh-dict/dict.tsv', encoding='utf-8'):
    ln = ln.rstrip('\n')
    if not ln or ln.startswith('#'):
        continue
    f = ln.split('\t')
    if len(f) < 3:
        continue
    src = f[1]
    for k in ['Lane color band', 'Apply ', 'selected', 'Staged', 'Filter ', 'Pop latest', 'Stash ', 'of ']:
        if k in src and f[0].startswith('e2e'):
            print(' ', f[0], '|', src[:100], '|', f[2][:60])
            break
