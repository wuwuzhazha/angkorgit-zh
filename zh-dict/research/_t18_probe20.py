import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
raw = open(r'zh-dict/batches/v011b/ui-web/gen.mjs', encoding='utf-8').read()
# check Lane color band / Apply {picked.size} targets in t17 gen.mjs (E array + SKIP array)
for probe in ['Lane color band', 'Apply {picked', 'Apply 4', 'picked.size} {picked', 'files}']:
    print('=== probe:', probe)
    pos = 0
    while True:
        i = raw.find(probe, pos)
        if i < 0:
            break
        print('  ...', raw[max(0, i - 60):i + 140].replace('\n', ' '))
        pos = i + 1
        if pos > len(raw):
            break
