import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Spinner,
} from '@angkorgit/design-system';
import { shortenHome } from '@/shared/utils';
import { classify, type GroupResultKind, type GroupRepositoryResult } from './groupUpdate';

export interface GroupUpdateProgress {
  runId: string;
  name: string;
  pull: boolean;
  total: number;
  results: GroupRepositoryResult[];
  running: boolean;
  cancelling: boolean;
}

export function GroupUpdateDialog({ progress, onClose, onCancel }: {
  progress: GroupUpdateProgress | null;
  onClose: () => void;
  onCancel: () => void;
}) {
  if (!progress) return null;
  const { name, pull, total, results, running, cancelling } = progress;
  const counts: Record<GroupResultKind, number> = { updated: 0, unchanged: 0, skipped: 0, failed: 0, partial: 0, cancelled: 0 };
  for (const result of results) counts[classify(result)]++;
  const labels: Record<GroupResultKind, string> = {
    updated: '已更新', unchanged: pull ? '已是最新' : '无更改', skipped: '已跳过',
    failed: '失败', partial: '部分成功', cancelled: '已取消',
  };
  const tones: Record<GroupResultKind, 'success' | 'danger' | 'primary' | 'neutral'> = {
    updated: 'success', unchanged: 'neutral', skipped: 'neutral',
    failed: 'danger', partial: 'primary', cancelled: 'neutral',
  };
  return (
    <Dialog open onOpenChange={(open) => { if (!open && !running) onClose(); }}>
      <DialogContent
        className="max-w-2xl outline-none"
        onEscapeKeyDown={(e) => { if (running) e.preventDefault(); }}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{pull ? '全部拉取（仅限快进）' : '全部获取'} — {name}</DialogTitle>
          <DialogDescription>
            {pull ? '从上游快进当前检出的分支，同时保留无关的本地更改。' : '获取分组中每个仓库的全部已配置远端。'}
          </DialogDescription>
        </DialogHeader>
        <div className="mb-3 flex items-center gap-2 overflow-x-auto whitespace-nowrap text-xs" role="status" aria-live="polite">
          {running && <Spinner className="size-4 shrink-0" />}
          <span className="shrink-0">{cancelling ? '正在取消…' : running ? `${results.length} / ${total} 个仓库已完成` : `${total} 个仓库已完成`} · {counts.updated} 个已更新 · {counts.unchanged} {pull ? '已是最新' : '无更改'} · {counts.skipped} 个已跳过 · {counts.failed} 个失败{counts.partial > 0 && ` · ${counts.partial} 个部分成功`}{counts.cancelled > 0 && ` · ${counts.cancelled} 个已取消`}</span>
        </div>
        <div className="max-h-[55vh] space-y-4 overflow-y-auto pr-1" data-group-update-results>
          {results.map((result) => (
            <div key={result.repo.path} className="text-sm" data-group-update-row>
              <div className="flex items-center justify-between gap-3">
                <span className="min-w-0 truncate font-semibold" title={result.repo.path}>{result.repo.name}</span>
                <Badge tone={tones[classify(result)]}>{labels[classify(result)]}</Badge>
              </div>
              <p className="break-all text-xs text-muted">{shortenHome(result.repo.path)}</p>
              <p className="mt-1 break-words">{result.message}</p>
              {result.changes.map((change) => (
                <p key={change.name} className="mt-1 break-all font-mono text-xs text-muted">
                  {change.name.replace(/^refs\/(remotes|heads|tags)\//, '')}: {change.oldOid?.slice(0, 7) ?? '新'} → {change.newOid?.slice(0, 7) ?? '已删除'}
                  {change.commits !== null && `（${change.commits} 个提交）`}
                </p>
              ))}
              {!pull && result.status === 'ok' && result.changes.length === 0 && <p className="text-xs text-muted">没有引用发生变化。</p>}
            </div>
          ))}
        </div>
        <DialogFooter>
          {running && <Button variant="ghost" disabled={cancelling} onClick={onCancel}>取消本次运行</Button>}
          <Button disabled={running} onClick={onClose}>完成</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
