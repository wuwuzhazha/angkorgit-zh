import sys, io, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
raw = open(r'zh-dict/batches/v011b/ui-web/gen.mjs', encoding='utf-8').read()
for probe in ['menuMulti.paths.length} files', 'Stash this file', 'Stash {menuMulti', 'Stage ${', 'picked.size']:
    print('=== probe:', probe)
    for m in re.finditer(re.escape(probe), raw):
        s = max(0, m.start() - 90)
        print('  ...', raw[s:m.end() + 150].replace('\n', ' '))
