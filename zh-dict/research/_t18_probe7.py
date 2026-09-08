import sys, io, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
raw = open(r'zh-dict/batches/v011b/ui-web/gen.mjs', encoding='utf-8').read()
# search for Lane color band and Apply {picked / Apply this file targets in gen.mjs
for probe in ['Lane color band', 'Lane color', 'picked.size', 'Apply this file', 'Apply {picked', 'Apply {files', 'files}', 'band']:
    print('=== probe:', probe)
    hits = 0
    for m in re.finditer(re.escape(probe), raw):
        s = max(0, m.start() - 80)
        print('  ...', raw[s:m.end() + 160].replace('\n', ' '))
        hits += 1
        if hits > 5:
            break
