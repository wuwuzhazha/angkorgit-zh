import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
rows = []
for ln in open(r'zh-dict/research/batch3.tsv', encoding='utf-8'):
    ln = ln.rstrip('\n')
    if not ln or ln.startswith('#'):
        continue
    f = ln.split('\t')
    if f[0] == 'rust':
        rows.append((f[5] if len(f) > 5 else '', f[1], f[4] if len(f) > 4 else ''))
src_rows = [r for r in rows if 'src-tauri/src/' in r[0]]
test_rows = [r for r in rows if 'git_engine.rs' in r[0] or 'src-tauri/tests/' in r[0]]
print('=== SRC runtime rows (%d) ===' % len(src_rows))
for loc, s, hint in src_rows:
    print(loc, '|', repr(s))
print()
print('=== TEST rows (%d) ===' % len(test_rows))
for loc, s, hint in test_rows:
    print(loc, '|', repr(s))
