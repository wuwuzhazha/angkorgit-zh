import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
# check residual + dict for Lane color band / Apply {picked / selected / Staged / of counters
for ln in open(r'zh-dict/research/residual.tsv', encoding='utf-8'):
    ln = ln.rstrip('\n')
    if not ln or ln.startswith('#'):
        continue
    f = ln.split('\t')
    if len(f) < 9:
        continue
    if 'Lane color' in f[1] or 'picked.size' in f[1] or 'of {diffs' in f[1] or f[1] in ('Staged', 'Commit files'):
        print('RESIDUAL:', f[0], '|', f[2], '|', f[3], '|', repr(f[1][:100]), '|', f[8])
print('--- dict Lane/Commit files ---')
for ln in open(r'zh-dict/dict.tsv', encoding='utf-8'):
    ln = ln.rstrip('\n')
    if not ln or ln.startswith('#'):
        continue
    f = ln.split('\t')
    if len(f) < 3:
        continue
    if 'Lane color' in f[1] or 'Commit files' in f[1] or 'Staged' == f[1] or f[1].startswith('Staged'):
        print('DICT:', f[0], '|', repr(f[1][:80]), '|', repr(f[2][:60]), '|', (f[3] if len(f) > 3 else ''))
