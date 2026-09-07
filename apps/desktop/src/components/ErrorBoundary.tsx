import { Component, type ReactNode } from 'react';
import { AlertTriangle, ClipboardCopy, RotateCcw } from 'lucide-react';
import { Button, Logo } from '@angkorgit/design-system';

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    console.error('AngKorGit 崩溃了：', error, info.componentStack);
  }

  private copyDetails = () => {
    const { error } = this.state;
    void navigator.clipboard.writeText(
      `AngKorGit error report\n\n${error?.name}: ${error?.message}\n\n${error?.stack ?? ''}`,
    );
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-background p-8 text-center">
        <Logo size={48} className="text-foreground" />
        <div className="flex items-center gap-2 text-danger">
          <AlertTriangle className="size-5" />
          <h1 className="text-lg font-semibold text-foreground">出了点问题</h1>
        </div>
        <p className="max-w-md text-sm text-muted">
          AngKorGit 遇到了意外错误。你的仓库是安全的——这只会影响
          界面。重启通常能解决；如果反复出现，请报告下面的
          详细信息。
        </p>
        <pre className="max-h-40 max-w-lg overflow-auto rounded-lg border border-border bg-surface p-3 text-left font-mono text-xs text-danger">
          {error.name}: {error.message}
        </pre>
        <div className="flex gap-2">
          <Button onClick={() => window.location.reload()}>
            <RotateCcw /> 重启界面
          </Button>
          <Button variant="secondary" onClick={this.copyDetails}>
            <ClipboardCopy /> 复制错误详情
          </Button>
        </div>
      </div>
    );
  }
}
