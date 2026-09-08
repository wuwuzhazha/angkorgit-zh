import sys, io, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
raw = open(r'zh-dict/batches/v011b/ui-web/gen.mjs', encoding='utf-8').read()
for probe in ['lane', 'Lane', 'band', 'Apply ', '4 files', 'only on the local', 'will be lost', 'losing', 'multi', 'files.length} files', 'files.length}']:
    print('=== probe:', probe)
    for m in re.finditer(re.escape(probe), raw):
        s = max(0, m.start() - 70)
        print('  ...', raw[s:m.end() + 180].replace('\n', ' '))
