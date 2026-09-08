import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
# dict existing entries for F7/e2e sync sources
pats = ['Reset branch to its remote?', 'Reset branch', 'Pop latest stash', 'Stash selected changes',
        'Filter changed files', 'Hide file filter', 'Clear filter', 'Commit files', 'Filter files',
        'Stash this file', 'Stash {menuMulti', 'Stage ', 'Apply ', 'Applied ', 'Select ', 'This is a stash',
        'Drop this stash', 'Staged', 'Lane color band', 'name: \'Stash\'', '2 commits only', 'of {diffs', 'picked.size']
for ln in open(r'zh-dict/dict.tsv', encoding='utf-8'):
    ln = ln.rstrip('\n')
    if not ln or ln.startswith('#'):
        continue
    f = ln.split('\t')
    if len(f) < 3:
        continue
    src = f[1]
    for p in pats:
        if p in src:
            print(f[0], '|', repr(src[:100]), '|', repr(f[2][:70]), '|', (f[3] if len(f) > 3 else ''))
            break
