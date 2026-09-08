import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
for p, pat in [
    ('apps/desktop/src-tauri/tests/git_engine.rs', 'feat: two'),
    ('apps/desktop/src-tauri/src/core/commit.rs', 'This reverts commit'),
    ('apps/desktop/src-tauri/src/core/stage.rs', 'No newline'),
    ('apps/desktop/src-tauri/src/core/stage.rs', '{file_header}'),
    ('apps/desktop/src-tauri/tests/git_engine.rs', 'add bad file'),
]:
    for i, l in enumerate(open(p, encoding='utf-8'), 1):
        if pat in l:
            print(p, i, repr(l.rstrip()[:140]))
            break
