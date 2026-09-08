import sys, io, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
raw = open(r'zh-dict/batches/v011b/ui-web/gen.mjs', encoding='utf-8').read()
for probe in ['泳道', 'color band', 'Color band', '色带', 'Lane', 'lane', 'tail', 'Tail']:
    print('=== probe:', probe)
    for m in re.finditer(re.escape(probe), raw):
        s = max(0, m.start() - 70)
        print('  ...', raw[s:m.end() + 140].replace('\n', ' '))
