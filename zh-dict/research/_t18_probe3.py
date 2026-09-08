import sys, io, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
raw = open(r'zh-dict/batches/v011b/ui-web/gen.mjs', encoding='utf-8').read()
for probe in ['Lane color', 'Apply ${files', 'files to apply', ' of ', 'selected', 'Tick', 'Stash', '1 of', 'of 2', 'of 5']:
    print('=== probe:', probe)
    for m in re.finditer(re.escape(probe), raw):
        s = max(0, m.start() - 50)
        print('  ...', raw[s:m.end() + 150].replace('\n', ' '))
