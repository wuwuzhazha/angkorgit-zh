import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
# Confirm t17 gen.mjs targets for all F7 sync strings (exact tuples)
raw = open(r'zh-dict/batches/v011b/ui-web/gen.mjs', encoding='utf-8').read()
need = ['Reset branch to its remote?', 'Reset branch', 'Pop latest stash', 'Stash selected changes',
        'Filter changed files…', 'Hide file filter', 'Clear filter', 'Commit files', 'Filter files', 'Filter files…',
        'Stash this file…', 'Stash {menuMulti.paths.length} files…', 'Stage ${menuMulti.paths.length} files',
        'Apply ${diff.path} from the stash', 'Select ${diff.path} to apply',
        'Applied ${basename(files[0])} from the stash', 'Applied ${files.length} files from the stash',
        'The stash itself is unchanged.', 'This is a stash. Tick files to apply only those to the working copy.',
        'Drop this stash?', 'aria-label="Stash"', '${stash.message} — click to preview, right-click for actions',
        'Checkout ${name}', 'Reset ${name} to ${ref.shorthand}', 'Pop latest stash (nothing stashed)',
        'Lane color band', 'Apply {picked.size}', 'picked.size} of {diffs.length} selected']
for n in need:
    idx = raw.find(repr(n)[1:-1] if False else n)
    # simpler: search literal in raw
    pos = raw.find(n)
    if pos >= 0:
        seg = raw[pos:pos + 220].replace('\n', ' ')
        print('FOUND:', repr(n[:60]), '=>', seg[:200])
    else:
        print('MISS :', repr(n[:60]))
