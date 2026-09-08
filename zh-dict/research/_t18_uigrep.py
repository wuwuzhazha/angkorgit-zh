import sys, io, re, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
# Find UI source for Lane color band / Apply 4 files / Stage / Applied basename
base = r'E:\angkorgit_zh\build\angkorgit'
pats = ['Lane color band', 'Apply ', 'Apply 4', 'files to apply', 'Stage ${menuMulti', 'Applied ${basename', 'Stash {menuMulti', 'only on the local branch will be lost', '2 commits only']
for root, _d, fs in os.walk(os.path.join(base, 'apps', 'desktop', 'src')):
    for f in fs:
        if not f.endswith(('.tsx', '.ts')):
            continue
        p = os.path.join(root, f)
        try:
            txt = open(p, encoding='utf-8', errors='replace').read()
        except Exception:
            continue
        for pat in pats:
            if pat in txt:
                rel = os.path.relpath(p, base)
                for i, ln in enumerate(txt.splitlines(), 1):
                    if pat in ln:
                        print(rel, ':', i, ':', ln.strip()[:150])
