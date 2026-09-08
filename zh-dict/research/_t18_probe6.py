import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
pats = ['Lane color band', 'Apply ', 'picked.size', 'Stage ${menuMulti', 'Stash {menuMulti', 'Pop latest stash', 'Reset branch', 'Stash this file', 'Stash selected changes', 'Apply {picked', 'Apply {files']
for ln in open(r'zh-dict/research/batch1.tsv', encoding='utf-8'):
    ln = ln.rstrip('\n')
    if not ln or ln.startswith('#'):
        continue
    f = ln.split('\t')
    src = f[1]
    for k in pats:
        if k in src:
            print(f[0], '|', src[:110], '|', (f[5] if len(f) > 5 else ''))
            break
