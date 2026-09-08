import sys, io, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
raw = open(r'zh-dict/batches/v011b/ui-web/gen.mjs', encoding='utf-8').read()
# Find full tuple entries for specific UI strings
targets = ['Lane color band', 'Apply ${', 'Stage ${', 'Applied ${', 'Only this file is stashed', 'Checkout ${', 'Reset ${', 'Pop latest stash (nothing stashed)', 'Stash {menuMulti', "Stash {menuMulti.paths.length} files"]
for probe in targets:
    print('=== probe:', probe)
    idx = 0
    for m in re.finditer(re.escape(probe), raw):
        # print enclosing tuple (from previous '[' to following ']')
        s = raw.rfind('[', 0, m.start())
        e = raw.find(']', m.end())
        if s >= 0 and e > m.start():
            print('  TUPLE:', raw[s:e+1].replace('\n', ' ')[:300])
        idx += 1
        if idx > 6:
            break
