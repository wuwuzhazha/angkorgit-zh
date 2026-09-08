import sys, io, re, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
# find UI strings for: Lane color band, ' of ' counters, 'selected', '/^Staged/' handling
base = r'E:\angkorgit_zh\build\angkorgit'
pats = ['Lane color band', ' of ', 'selected', 'Staged', 'spills', 'clipped']
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
                    if pat in ln and ('`' in ln or "'" in ln or '"' in ln):
                        print(rel, ':', i, ':', ln.strip()[:160])
                # avoid huge dumps for ' of '
                if pat == ' of ':
                    break
