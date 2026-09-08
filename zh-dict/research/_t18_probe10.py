import sys, io, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
raw = open(r'zh-dict/batches/v011b/ui-web/gen.mjs', encoding='utf-8').read()
for probe in ['Lane color', 'Clear', 'selected', 'Apply {', 'of {diffs', 'picked.size}', 'spills', 'Virtualized rows']:
    print('=== probe:', probe)
    for m in re.finditer(re.escape(probe), raw):
        s = max(0, m.start() - 70)
        print('  ...', raw[s:m.end() + 150].replace('\n', ' '))
