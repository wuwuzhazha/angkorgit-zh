# merge-batches.ps1 — t6 合并器：batch-1/2/3.tsv 合并进 dict.tsv（契约 §7）
# 规则：与 dict 同 source（Trim 后精确相等）→ scope 并集 + 复用 dict target/anchor；
#       批次间同 source → scope 并集 + target 必须一致（不一致取批次号小者并报告）；
#       protect.txt 命中 → 拒绝；anchor 正则非法 / 单单词缺 anchor / 译文缺失 → 报告并丢弃；
#       新增条目按分节（首 scope）插入，节内按 source 长度降序（长串在前）；
#       同 scope 跨节子串遮蔽（未带 anchor 的短条目先于长条目）自动搬迁短条目到长条目之后。
# 用法：pwsh -NoProfile -File zh-dict/merge-batches.ps1
$ErrorActionPreference = 'Stop'
$zh = 'E:\angkorgit_zh\zh-dict'
$upstream = 'E:\angkorgit_zh\.tmp-analysis\upstream'
$dictPath = Join-Path $zh 'dict.tsv'
$utf8 = New-Object System.Text.UTF8Encoding($false)
$report = New-Object System.Collections.Generic.List[string]
function Rpt([string]$m) { $script:report.Add($m) }

# ---------- 0. 读取 dict.tsv ----------
$rawDict = [System.IO.File]::ReadAllText($dictPath)
if ($rawDict[0] -eq [char]0xFEFF) { $rawDict = $rawDict.Substring(1) }
$nl = if ($rawDict.Contains("`r`n")) { "`r`n" } else { "`n" }
Rpt ("dict.tsv 换行符: " + $(if ($nl -eq "`r`n") { 'CRLF' } else { 'LF' }) + "，原数据行 578（基线）")

$sections = @{}   # 头注释 → scope 名
$sectionMap = [ordered]@{
  'A. 桌面 UI'  = 'ui'
  'B. Rust'     = 'rust'
  'C. core'     = 'core'
  'D. 文档'     = 'docs'
  'E. 元数据'   = 'meta'
  'F. 网站'     = 'website'
  'e2e 断言'    = 'e2e'
}
$items = New-Object System.Collections.Generic.List[object]   # 行级条目
$curSection = ''
$baselineDupKeys = [System.Collections.Generic.Dictionary[string,int]]::new([System.StringComparer]::Ordinal)   # baseline (source+scope-set) 重复键（预先存在的合法重复）
$baselineCount = 0
foreach ($dl in [regex]::Split($rawDict, "\r\n|\n")) {
  $trim = $dl.Trim()
  if ($dl -match '^\s*#') {
    foreach ($k in $sectionMap.Keys) {
      if ($dl -match [regex]::Escape($k)) { $curSection = $sectionMap[$k]; break }
    }
    $items.Add([pscustomobject]@{ Kind = 'comment'; Text = $dl; Section = $curSection })
    continue
  }
  if ($trim -eq '') { $items.Add([pscustomobject]@{ Kind = 'blank'; Text = $dl; Section = $curSection }); continue }
  $f = $dl -split "`t"
  if ($f.Count -lt 3) { Rpt "!! dict.tsv 数据行列数异常，跳过: $dl"; continue }
  $scopes = @($f[0] -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' })
  $src = $f[1]; $tgt = $f[2]; $anchor = if ($f.Count -gt 3) { $f[3] } else { '' }
  $items.Add([pscustomobject]@{ Kind = 'data'; Text = $dl; Section = $curSection; Scopes = $scopes; Source = $src; Target = $tgt; Anchor = $anchor; Origin = 'dict' })
  $baselineCount++
  $key = (($scopes | Sort-Object) -join '|') + '::' + $src.Trim()
  if ($baselineDupKeys.ContainsKey($key)) { $baselineDupKeys[$key]++ } else { $baselineDupKeys[$key] = 1 }
}
Rpt ("dict.tsv 解析数据行: $baselineCount；基线已有重复 (source+scope) 键: $(($baselineDupKeys.GetEnumerator() | Where-Object { $_.Value -gt 1 } | ForEach-Object { "$($_.Key) x$($_.Value)" }) -join ' / ' -replace 'x1$','')")

# ---------- 1. 保护正则 ----------
$protect = @()
foreach ($pl in [System.IO.File]::ReadAllLines((Join-Path $zh 'protect.txt'))) {
  if ($pl -match '^\s*#' -or $pl.Trim() -eq '') { continue }
  $protect += , [regex]::new($pl)
}
function Test-Protect([string]$s) {
  foreach ($p in $protect) { if ($p.IsMatch($s)) { return $true } }
  return $false
}

# ---------- 2. 读批次 ----------
$scopeTokenRe = '^(ui|rust|core|website|docs|meta|e2e)(,(ui|rust|core|website|docs|meta|e2e))*$'
$batchEntries = New-Object System.Collections.Generic.List[object]
$dropped = New-Object System.Collections.Generic.List[string]
foreach ($bn in 1, 2, 3) {
  $bf = Join-Path $zh "batch-$bn.tsv"
  if (-not (Test-Path -LiteralPath $bf)) { Rpt "!! 缺批次文件: $bf"; continue }
  $raw = [System.IO.File]::ReadAllText($bf)
  if ($raw[0] -eq [char]0xFEFF) { $raw = $raw.Substring(1) }
  $ln = 0
  foreach ($l in [regex]::Split($raw, "\r\n|\n")) {
    $ln++
    if ($l -match '^\s*#' -or $l.Trim() -eq '') { continue }
    $c = $l -split "`t"
    $why = ''
    if ($c.Count -lt 3 -or $c.Count -gt 4) { $why = "列数 $($c.Count)" }
    elseif ($c[0] -notmatch $scopeTokenRe) { $why = "scope 非法 [$($c[0])]" }
    elseif ([string]::IsNullOrWhiteSpace($c[2]) -or $c[1].Trim() -eq $c[2].Trim()) { $why = '译文缺失/未变' }
    elseif ($c[1].Trim() -eq '') { $why = 'source 为空' }
    elseif ($c[1] -notmatch '\s' -and $c.Count -lt 4) { $why = '单单词缺 anchor' }
    elseif (Test-Protect $c[1]) { $why = 'source 命中 protect.txt（禁止入词库）' }
    if ($why -ne '') { $dropped.Add("batch-$bn.tsv:$ln [$($c[1])] $why"); continue }
    $anchor = if ($c.Count -gt 3) { $c[3] } else { '' }
    if ($anchor -ne '') {
      try { $null = [regex]::new($anchor) } catch { $dropped.Add("batch-$bn.tsv:$ln [$($c[1])] anchor 正则非法: $anchor"); continue }
    }
    $scopes = @($c[0] -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' })
    $batchEntries.Add([pscustomobject]@{ Batch = $bn; Line = $ln; Scopes = $scopes; Source = $c[1]; Target = $c[2]; Anchor = $anchor })
  }
}
Rpt ("批次数据行合计: $($batchEntries.Count)；丢弃: $($dropped.Count)")
foreach ($d in $dropped) { Rpt "  DROP $d" }

# ---------- 3. 合并去重 ----------
# 注意：必须用 Ordinal（大小写敏感）——契约 §7.3 大小写变体各留一份（folder missing/Folder missing 并存）
$dictBySrc = [System.Collections.Generic.Dictionary[string,object]]::new([System.StringComparer]::Ordinal)   # trim(source) → List[int] 条目索引
for ($i = 0; $i -lt $items.Count; $i++) {
  if ($items[$i].Kind -ne 'data') { continue }
  $k = $items[$i].Source.Trim()
  if (-not $dictBySrc.ContainsKey($k)) { $dictBySrc[$k] = New-Object System.Collections.Generic.List[int] }
  $dictBySrc[$k].Add($i)
}
$seenBatch = [System.Collections.Generic.Dictionary[string,object]]::new([System.StringComparer]::Ordinal)   # trim(source) → 首见批次条目（pscustomobject + 已合 scope）
$newEntries = @{}  # section → List[entry]
$updated = New-Object System.Collections.Generic.List[string]
$conflict = New-Object System.Collections.Generic.List[string]

foreach ($e in $batchEntries) {
  $k = $e.Source.Trim()
  if ($dictBySrc.ContainsKey($k)) {
    # 与 dict 合并：scope 并集 + 复用 target/anchor；target 不一致 → 作废报告
    $idx = $dictBySrc[$k][0]
    $di = $items[$idx]
    if ($di.Target -ne $e.Target) {
      $conflict.Add("batch$($e.Batch):$($e.Line) [$($e.Source)] target 与 dict 不一致（batch='$($e.Target)' dict='$($di.Target)'）→ 作废")
      continue
    }
    $union = New-Object System.Collections.Generic.List[string]
    foreach ($s in $di.Scopes) { if (-not $union.Contains($s)) { $union.Add($s) } }
    foreach ($s in $e.Scopes) { if (-not $union.Contains($s)) { $union.Add($s) } }
    $newScopeStr = $union -join ','
    if ($newScopeStr -ne ($di.Scopes -join ',')) {
      $updated.Add("dict 条目 [$($di.Source)] scope $(($di.Scopes -join ',')) → $newScopeStr")
      $di.Scopes = @($union)
      $di.Text = $newScopeStr + "`t" + $di.Source + "`t" + $di.Target + $(if ($di.Anchor -ne '') { "`t" + $di.Anchor } else { '' })
    }
    continue
  }
  if ($seenBatch.ContainsKey($k)) {
    # 批次间同 source：scope 并集 + target 一致（不一致取批次号小者）
    $prev = $seenBatch[$k]
    if ($prev.Target -ne $e.Target) {
      $conflict.Add("batch$($e.Batch):$($e.Line) [$($e.Source)] target 与 batch$($prev.Batch):$($prev.Line) 不一致（'$($e.Target)' vs '$($prev.Target)'）→ 保留批次号小者")
      continue
    }
    $union = New-Object System.Collections.Generic.List[string]
    foreach ($s in $prev.Scopes) { if (-not $union.Contains($s)) { $union.Add($s) } }
    foreach ($s in $e.Scopes) { if (-not $union.Contains($s)) { $union.Add($s) } }
    $prev.Scopes = @($union)
    continue
  }
  $seenBatch[$k] = $e
}
# 批次间并集完成后，才把最终 scope 集写入新条目（修复：并集不能丢后批次 scope）
foreach ($kv in $seenBatch.GetEnumerator()) {
  $e = $kv.Value
  $sec = $e.Scopes[0]
  if (-not $newEntries.ContainsKey($sec)) { $newEntries[$sec] = New-Object System.Collections.Generic.List[object] }
  $newEntries[$sec].Add([pscustomobject]@{ Scopes = $e.Scopes; Source = $e.Source; Target = $e.Target; Anchor = $e.Anchor; Batch = $e.Batch; Line = $e.Line })
}
Rpt ("scope 扩展（dict 就地更新）: $($updated.Count)")
foreach ($u in $updated) { Rpt "  EXT $u" }
Rpt ("target 冲突作废: $($conflict.Count)")
foreach ($c2 in $conflict) { Rpt "  CONFLICT $c2" }
Rpt ("新增条目（未在 dict/前批次出现）: $(($newEntries.Values | ForEach-Object { $_.Count } | Measure-Object -Sum).Sum)")

# ---------- 4. 分节插入（长串优先） ----------
$inserted = New-Object System.Collections.Generic.List[string]
foreach ($sec in $sectionMap.Values) {
  if (-not $newEntries.ContainsKey($sec)) { continue }
  $list = $newEntries[$sec]
  $sorted = @($list | Sort-Object @{ Expression = { $_.Source.Length }; Descending = $true }, @{ Expression = { $_.Batch } }, @{ Expression = { $_.Line } })
  foreach ($n in $sorted) {
    # 节内数据行位置
    $dataPos = New-Object System.Collections.Generic.List[int]
    for ($i = 0; $i -lt $items.Count; $i++) {
      if ($items[$i].Kind -eq 'data' -and $items[$i].Section -eq $sec) { $dataPos.Add($i) }
    }
    $insertAt = -1
    foreach ($p in $dataPos) {
      $ex = $items[$p]
      if ($ex.Source.Length -lt $n.Source.Length -and $n.Source.Contains($ex.Source)) { $insertAt = $p; break }
    }
    if ($insertAt -ge 0) {
      $items.Insert($insertAt, [pscustomobject]@{ Kind = 'data'; Text = ''; Section = $sec; Scopes = $n.Scopes; Source = $n.Source; Target = $n.Target; Anchor = $n.Anchor; Origin = 'batch' })
      $inserted.Add("节[$sec] 前插 [$($n.Source)]（长串优先，位于 [$($items[$insertAt+1].Source)] 之前）")
    } else {
      $last = $dataPos[$dataPos.Count - 1]
      $items.Insert($last + 1, [pscustomobject]@{ Kind = 'data'; Text = ''; Section = $sec; Scopes = $n.Scopes; Source = $n.Source; Target = $n.Target; Anchor = $n.Anchor; Origin = 'batch' })
      $inserted.Add("节[$sec] 尾追 [$($n.Source)]")
    }
  }
}
Rpt ("插入明细: $($inserted.Count) 条")
foreach ($i2 in $inserted) { Rpt "  INS $i2" }

# ---------- 5. 同 scope 跨节子串遮蔽修复（短未锚条目移到长条目之后） ----------
$moves = New-Object System.Collections.Generic.List[string]
$iter = 0
while ($iter -lt 60) {
  $iter++
  $viol = $null
  foreach ($s in $sectionMap.Values) {
    $scoped = New-Object System.Collections.Generic.List[int]
    for ($i = 0; $i -lt $items.Count; $i++) {
      if ($items[$i].Kind -eq 'data' -and ($items[$i].Scopes -contains $s)) { $scoped.Add($i) }
    }
    for ($a = 0; $a -lt $scoped.Count -and -not $viol; $a++) {
      $itA = $items[$scoped[$a]]
      if ($itA.Anchor -ne '') { continue }   # 带 anchor 的短条目按契约合法（消歧锚）
      for ($b = $a + 1; $b -lt $scoped.Count; $b++) {
        $itB = $items[$scoped[$b]]
        if ($itA.Source.Length -lt $itB.Source.Length -and $itB.Source.Contains($itA.Source)) {
          $viol = @{ A = $scoped[$a]; B = $scoped[$b]; S = $s }
          break
        }
      }
    }
    if ($viol) { break }
  }
  if (-not $viol) { break }
  $item = $items[$viol.A]
  $items.RemoveAt($viol.A)
  $newPos = if ($viol.B -gt $viol.A) { $viol.B } else { $viol.B }   # 移除后 B 的索引
  $items.Insert($newPos, $item)
  $moves.Add("scope[$($viol.S)] 短条目 [$($item.Source)] 移到 [$($items[$newPos-1].Source)] 之后")
}
Rpt ("遮蔽修复搬迁: $($moves.Count) 次")
foreach ($m in $moves) { Rpt "  MOVE $m" }

# ---------- 6. 序列化 ----------
$sb = New-Object System.Text.StringBuilder
foreach ($it in $items) {
  if ($it.Kind -eq 'data') {
    $line = ($it.Scopes -join ',') + "`t" + $it.Source + "`t" + $it.Target + $(if ($it.Anchor -ne '') { "`t" + $it.Anchor } else { '' })
    [void]$sb.Append($line).Append($nl)
  } else {
    [void]$sb.Append($it.Text).Append($nl)
  }
}
$outText = $sb.ToString().TrimEnd("`r", "`n")
[System.IO.File]::WriteAllText($dictPath, $outText + $nl, $utf8)
$finalLines = [System.IO.File]::ReadAllLines($dictPath)
$finalData = @($finalLines | Where-Object { $_ -notmatch '^\s*#' -and $_.Trim() -ne '' })
Rpt ("合并后 dict.tsv 数据行: $($finalData.Count)（基线 $baselineCount，新增 $($finalData.Count - $baselineCount)）")
Rpt ("文件已写出: $dictPath（UTF-8 无 BOM，$($(if ($nl -eq "`r`n") { 'CRLF' } else { 'LF' }))）")

# ---------- 7. 合并后校验 ----------
$batchSrcSet = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::Ordinal)
foreach ($e in $batchEntries) { [void]$batchSrcSet.Add($e.Source.Trim()) }
$errs = New-Object System.Collections.Generic.List[string]
$baseInfo = New-Object System.Collections.Generic.List[string]
$dupKeys = [System.Collections.Generic.Dictionary[string,int]]::new([System.StringComparer]::Ordinal)
foreach ($l in $finalLines) {
  if ($l -match '^\s*#' -or $l.Trim() -eq '') { continue }
  $c = $l -split "`t"
  $isBatch = ($c.Count -ge 2) -and $batchSrcSet.Contains($c[1].Trim())
  if ($c.Count -lt 3 -or $c.Count -gt 4) { $errs.Add("列数错误: $l"); continue }
  if ($c[0] -notmatch $scopeTokenRe) { $errs.Add("scope 非法: $l"); continue }
  if ([string]::IsNullOrWhiteSpace($c[2]) -or $c[1] -eq $c[2]) { $errs.Add("译文缺失/未变: $l"); continue }
  if ($c[1] -notmatch '\s' -and $c.Count -lt 4) { $errs.Add("单单词缺 anchor: $l"); continue }
  if ($c.Count -gt 3) { try { $null = [regex]::new($c[3]) } catch { $errs.Add("anchor 非法: $l") } }
  if (Test-Protect $c[1]) {
    if ($isBatch) { $errs.Add("source 命中 protect: $l") }
    else { $baseInfo.Add("基线既有条目 source 命中 protect（引擎 bypass 语义，维持原状）: [$($c[1])]") }
  }
  $scopes = @($c[0] -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' })
  $key = (($scopes | Sort-Object) -join '|') + '::' + $c[1].Trim()
  if ($dupKeys.ContainsKey($key)) { $dupKeys[$key]++ } else { $dupKeys[$key] = 1 }
}
Rpt ("合并后格式/保护校验错误（批次来源）: $($errs.Count)")
foreach ($er in $errs) { Rpt "  ERR $er" }
Rpt ("基线既有 protect 命中条目（info，非本次引入）: $($baseInfo.Count)")
foreach ($bi in $baseInfo) { Rpt "  INFO $bi" }
$newDups = @($dupKeys.GetEnumerator() | Where-Object { $_.Value -gt 1 -and (-not $baselineDupKeys.ContainsKey($_.Key) -or $baselineDupKeys[$_.Key] -lt $_.Value) })
Rpt ("新增 (source+scope) 重复键: $($newDups.Count)（基线既有的 ui Commit x2 属设计内）")
foreach ($d2 in $newDups) { Rpt "  DUP $($d2.Key) x$($d2.Value)" }
# 批次覆盖核对：每个批次 source（Ordinal 精确）必须在最终文件出现
$missingBatch = New-Object System.Collections.Generic.List[string]
$finalSrcSet = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::Ordinal)
foreach ($l in $finalLines) {
  if ($l -match '^\s*#' -or $l.Trim() -eq '') { continue }
  $c = $l -split "`t"
  if ($c.Count -ge 2) { [void]$finalSrcSet.Add($c[1].Trim()) }
}
foreach ($s in $batchSrcSet) { if (-not $finalSrcSet.Contains($s)) { $missingBatch.Add($s) } }
Rpt ("批次 source 覆盖核对：应 $($batchSrcSet.Count) 条，缺失 $($missingBatch.Count)")
foreach ($m3 in $missingBatch) { Rpt "  LOST $m3" }

# ---------- 8. anchor 命中校验（递归版，替代契约 §6.2 的不递归 ** glob） ----------
$globDefs = @{
  ui      = @('apps/desktop/src/**/*.ts', 'apps/desktop/src/**/*.tsx')
  rust    = @('apps/desktop/src-tauri/src/**/*.rs')
  core    = @('packages/core/src/**/*.ts')
  website = @('apps/website/src/**/*.ts', 'apps/website/src/**/*.tsx', 'apps/website/src/**/*.astro')
  meta    = @('apps/desktop/src-tauri/tauri.conf.json', 'package.json', 'apps/desktop/package.json', 'apps/desktop/src-tauri/Cargo.toml', 'apps/desktop/index.html')
  docs    = @('README.md', 'docs/**/*.md', 'CHANGELOG.md', 'SECURITY.md', 'CODE_OF_CONDUCT.md')
  e2e     = @('tests/e2e/**/*.ts')
}
function ConvertTo-GlobRegex2([string]$Glob) {
  $esc = [regex]::Escape($Glob)
  $esc = $esc -replace '\\\*\\\*/', '(?:.*/)?' -replace '\\\*\\\*', '.*' -replace '\\\*', '[^/]*'
  return '^' + $esc + '$'
}
$scopeFileLists = @{}
foreach ($k in $globDefs.Keys) {
  $rx = @($globDefs[$k] | ForEach-Object { [regex]::new((ConvertTo-GlobRegex2 $_)) })
  $found = New-Object System.Collections.Generic.List[string]
  $all = @(Get-ChildItem -LiteralPath $upstream -Recurse -Force -File | Where-Object { $_.FullName -notmatch '\\\.git\\' })
  foreach ($f in $all) {
    $rel = $f.FullName.Substring($upstream.Length + 1).Replace('\', '/')
    foreach ($r in $rx) { if ($r.IsMatch($rel)) { $found.Add($f.FullName); break } }
  }
  $scopeFileLists[$k] = @($found)
}
$hitCache = @{}
function Test-AnchorHit([string]$anchor, [string[]]$scopes) {
  $key = ($scopes -join ',') + '::' + $anchor
  if ($hitCache.ContainsKey($key)) { return $hitCache[$key] }
  $hit = $false
  foreach ($s in $scopes) {
    if (-not $scopeFileLists.ContainsKey($s)) { continue }
    foreach ($f in $scopeFileLists[$s]) {
      if (Select-String -Path $f -Pattern $anchor -Quiet) { $hit = $true; break }
    }
    if ($hit) { break }
  }
  $hitCache[$key] = $hit
  return $hit
}
$misses = New-Object System.Collections.Generic.List[string]
$baseMisses = New-Object System.Collections.Generic.List[string]
$checked = 0
foreach ($l in $finalLines) {
  if ($l -match '^\s*#' -or $l.Trim() -eq '') { continue }
  $c = $l -split "`t"
  if ($c.Count -lt 4) { continue }
  $scopes = @($c[0] -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' })
  $checked++
  if (-not (Test-AnchorHit $c[3] $scopes)) {
    if ($batchSrcSet.Contains($c[1].Trim())) { $misses.Add("[$($c[1])] anchor 未命中任何源文件: [$($c[3])] scope=$($c[0])") }
    else { $baseMisses.Add("[$($c[1])] anchor 未命中（基线既有死锚）: [$($c[3])] scope=$($c[0])") }
  }
}
Rpt ("anchor 命中校验：检查 $checked 条带锚条目；批次来源未命中 $($misses.Count)；基线既有未命中 $($baseMisses.Count)")
foreach ($m2 in $misses) { Rpt "  MISS $m2" }
foreach ($m2 in $baseMisses) { Rpt "  BASEMISS $m2" }

# ---------- 9. 同 scope 长串优先最终复核（短未锚在前 → 违例） ----------
$orderVio = New-Object System.Collections.Generic.List[string]
foreach ($s in $sectionMap.Values) {
  $scoped = New-Object System.Collections.Generic.List[object]
  foreach ($l in $finalLines) {
    if ($l -match '^\s*#' -or $l.Trim() -eq '') { continue }
    $c = $l -split "`t"
    $ss = @($c[0] -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' })
    if ($ss -contains $s) { $scoped.Add([pscustomobject]@{ Source = $c[1]; Anchor = $(if ($c.Count -gt 3) { $c[3] } else { '' }) }) }
  }
  for ($a = 0; $a -lt $scoped.Count; $a++) {
    for ($b = $a + 1; $b -lt $scoped.Count; $b++) {
      if ($scoped[$a].Source.Length -lt $scoped[$b].Source.Length -and $scoped[$b].Source.Contains($scoped[$a].Source)) {
        if ($scoped[$a].Anchor -eq '') {
          $orderVio.Add("scope[$s] 短未锚在前: [$($scoped[$a].Source)] 先于 [$($scoped[$b].Source)]")
        }
      }
    }
  }
}
Rpt ("同 scope 长串优先复核：未锚短串在前违例 $($orderVio.Count)")
foreach ($o in $orderVio) { Rpt "  VIOL $o" }

Rpt ''
Rpt '========== 汇总 =========='
Rpt "最终数据行: $($finalData.Count) / 基线 $baselineCount（新增 $($finalData.Count - $baselineCount)）"
Rpt "批次来源错误: $($errs.Count) | 冲突作废: $($conflict.Count) | 丢弃: $($dropped.Count) | 批次 anchor 未命中: $($misses.Count) | 排序违例: $($orderVio.Count) | 新增重复键: $($newDups.Count) | 批次 source 缺失: $($missingBatch.Count)"
$report | Write-Host
