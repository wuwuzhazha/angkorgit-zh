import sys, io, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
raw = open(r'zh-dict/batches/v011b/ui-web/gen.mjs', encoding='utf-8').read()
for probe in ['Lane color band', 'Apply 4 files', 'Stage 3 files', 'Select ', 'to apply', '4 of 5', 'selected', 'Tick files', 'Reset ${name}', 'Checkout ${name}', 'will be lost', 'only on the local', 'Applied ${files.length}', 'Apply ${diff.path}', 'This is a stash']:
    print('=== probe:', probe)
    for m in re.finditer(re.escape(probe), raw):
        s = max(0, m.start() - 60)
        print('  ...', raw[s:m.end() + 160].replace('\n', ' '))
