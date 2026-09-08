import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
# e2e rows from residual: classify. Print full detail.
for ln in open(r'zh-dict/research/residual.tsv', encoding='utf-8'):
    ln = ln.rstrip('\n')
    if not ln or ln.startswith('#'):
        continue
    f = ln.split('\t')
    if len(f) < 9:
        continue
    if f[0] == 'e2e' and f[2] in ('translate', 'verify'):
        print('SRC=', repr(f[1]), '| verdict=', f[2], '| reason=', f[3], '| kind=', f[5], '| anchor_req=', f[6], '| sync=', f[7], '| loc=', f[8])
