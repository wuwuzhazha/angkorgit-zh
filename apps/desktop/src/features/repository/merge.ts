import { toast } from 'sonner';
import { ipc } from '@/core/ipc';
import { confirmDialog } from '@/components/confirm';
import { useRepo } from '@/features/repository/store';
import { useGraph } from '@/features/graph/store';
import { useCommitDraft } from '@/features/commit/draftStore';

export async function abortMergeFlow(path: string): Promise<void> {
  const ok = await confirmDialog({
    title: '中止合并？',
    description: '这会将工作副本重置为合并开始前的状态。',
    confirmLabel: '中止合并',
    destructive: true,
  });
  if (!ok) return;
  try {
    await ipc.mergeAbort(path);
  } catch (error) {
    toast.error(`中止失败：${(error as { message?: string }).message ?? error}`);
    return;
  }
  toast.success('已中止合并');
  useCommitDraft.getState().setDraft(path, '');
  try {
    await useRepo.getState().refresh();
    await useGraph.getState().reload(path);
  } catch (error) {
    toast.error(`刷新失败：${(error as { message?: string }).message ?? error}`);
  }
}
