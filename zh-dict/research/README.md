# zh-dict/research/ — 残留英文扫描与翻译契约（researcher · t1）

| 文件 | 用途 |
| --- | --- |
| `scan_residual.py` | 增强扫描器，一键复跑全部产物 |
| `residual.tsv` | 全量去重候选（scope/source/verdict/reason/hint/…） |
| `residual-lines.tsv` | 逐行定位明细（工程核验） |
| `residual-stats.json` | scope×verdict 统计 + 批次工作量 |
| `batch1.tsv` | **B1 待译：桌面 UI（123 行）** |
| `batch2.tsv` | **B2 待译：website + docs（325 行）** |
| `batch3.tsv` | **B3 待译：rust + core + meta + e2e/test（186 行）** |
| `verify.tsv` | 待决清单（62 条，按 scope 分给译者裁决） |
| `protect-blocked.tsv` | 受旧 protect 规则拦截的候选（升级 protect 后消除） |
| `translation-contract.md` | **翻译契约（规则 + 批次 + 验收）** |
| `protect-additions.txt` | protect.txt / skip-files.txt 变更补丁 |

复跑：`python zh-dict/research/scan_residual.py --repo E:\angkorgit_zh\build\angkorgit`

当前基线（HEAD 824ef8b）：translate=634 · verify=62 · skip=3088（dedup 3,784）。