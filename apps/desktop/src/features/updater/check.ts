import { toast } from 'sonner';
import { isTauri } from '@/core/ipc';

let checking = false;

export async function checkForUpdates(options: { silent: boolean }): Promise<void> {
  if (!isTauri() || checking) return;
  checking = true;
  try {
    const { check } = await import('@tauri-apps/plugin-updater');
    const update = await check();

    if (!update) {
      if (!options.silent) toast.success('AngKorGit 已是最新版本');
      return;
    }

    toast.info(`发现新版本 AngKorGit ${update.version}`, {
      description: '下载并重启即可更新。',
      duration: 15_000,
      action: {
        label: '立即更新',
        onClick: () => {
          void (async () => {
            try {
              toast.loading('正在下载更新…', { id: 'updater' });
              await update.downloadAndInstall();
              toast.success('更新已安装——正在重启', { id: 'updater' });
              const { relaunch } = await import('@tauri-apps/plugin-process');
              await relaunch();
            } catch (error) {
              toast.error(`更新失败：${(error as { message?: string }).message ?? error}`, {
                id: 'updater',
              });
            }
          })();
        },
      },
    });
  } catch (error) {
    if (!options.silent) {
      toast.error(`检查更新失败：${(error as { message?: string }).message ?? error}`);
    }
  } finally {
    checking = false;
  }
}
