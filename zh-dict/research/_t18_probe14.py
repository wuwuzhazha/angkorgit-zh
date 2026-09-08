import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
# Check forward ui batch1 for all e2e-sync-relevant UI sources + gen.mjs targets
pats = ['Reset branch to its remote?', 'Reset branch', 'Pop latest stash', 'Stash selected changes', 'Filter changed files…',
        'Hide file filter', 'Clear filter', 'Commit files', 'Filter files', 'Filter files…', 'Lane color band',
        'Apply ${diff.path} from the stash', 'Select ${diff.path} to apply', 'Applied ${basename(files[0])} from the stash',
        'Applied ${files.length} files from the stash', 'The stash itself is unchanged.',
        'This is a stash. Tick files to apply only those to the working copy.', 'Drop this stash?',
        'Stash this file…', 'Stash {menuMulti.paths.length} files…', 'Stage ${menuMulti.paths.length} files',
        'Apply {picked.size}', 'picked.size} of {diffs.length} selected', 'Checkout ${name}', 'Reset ${name} to ${ref.shorthand}',
        'only on the local branch will be lost.', 'Pop latest stash (nothing stashed)']
print('=== batch1.tsv (forward ui) coverage ===')
for ln in open(r'zh-dict/research/batch1.tsv', encoding='utf-8'):
    ln = ln.rstrip('\n')
    if not ln or ln.startswith('#'):
        continue
    f = ln.split('\t')
    src = f[1]
    for p in pats:
        if src == p or p in src:
            print(' ', f[0], '|', repr(src[:110]))
            break
