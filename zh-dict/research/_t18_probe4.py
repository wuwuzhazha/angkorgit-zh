import sys, io, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
raw = open(r'zh-dict/batches/v011b/ui-web/gen.mjs', encoding='utf-8').read()
for probe in ['Lane color', 'Apply ', 'Applied ${basename', 'stash itself is unchanged', 'Apply ${files.length}', 'to the working copy', 'Apply 4', 'selected', 'count', 'reset', 'Reset ']:
    print('=== probe:', probe)
    for m in re.finditer(re.escape(probe), raw):
        s = max(0, m.start() - 60)
        print('  ...', raw[s:m.end() + 170].replace('\n', ' '))
