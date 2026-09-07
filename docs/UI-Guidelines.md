# UI 指南

AngKorGit 的界面应像一款专业开发者工具：极简、快速、易发现。视觉灵感——Linear 的克制、Raycast 的键盘聚焦、VS Code 的密度、GitKraken 的提交图清晰度——是重新诠释，绝非照搬。

## Layout

- **左侧边栏**——仓库上下文：分支、远端、标签、暂存、子模块。可过滤。
- **中央**——提交图（应用的核心），终端停靠在下方。
- **右侧检查器**——默认为工作副本（暂存 + 提交）；选中提交时显示提交详情。
- 所有面板都可调整大小（`react-resizable-panels`）并持久化尺寸。

## 设计令牌

所有视觉都来自 CSS 变量：基础深/浅色板位于
`packages/design-system/src/tokens.css`，而每个其他主题（包括
默认的 **Angkor Dusk** 及其浅色对应 **Angkor Dawn**）会重新定义
`packages/design-system/src/themes.css` 中的同一批令牌。共内置十六款主题，
一个改动至少要经受住默认 Angkor Dusk 加一款浅色主题的检验
theme.

| Token | Base dark values | Purpose |
| --- | --- | --- |
| `--primary` | Temple Gold `#D97706` | actions, HEAD, brand |
| `--background` / `--surface` / `--surface-raised` / `--surface-overlay` | slate scale around `#111827` (Angkor Dusk: warm laterite around `#1e150d`) | depth levels 0–3 |
| `--danger` | `#EF4444` | destructive actions, deletions |
| `--success` | `#22C55E` | additions, confirmations |
| `--graph-0…9` | 10-color wheel | commit graph lanes |

kbach 廊柱装饰（`TemplePattern`）只出现在欢迎页与
启动画面，仅限 Angkor Dusk/Dawn 主题，低透明度——绝不
出现在提交图、diff 或代码之后，并在所有其他主题中不可见。

Rules:

- **8px 节奏。** 间距使用 Tailwind 体系（`gap-2`、`p-4`…）。禁止任意像素值。
- **字体。** UI 用 Inter，任何 Git 相关内容——哈希、路径、diff、正在撰写的消息——用 JetBrains Mono。
- **圆角。** 控件用 `rounded-md`，表面用 `rounded-lg`。没有尖锐的角，除徽标外没有药丸形。
- **层次。** 优先用边框（`border-border-subtle`）而非阴影；`shadow-soft` 仅用于浮层。
- **颜色即含义。** 绿色是新增/成功，红色是删除/危险，金色是主色/HEAD，蓝色是远端/信息。绝不为装饰而用色。

## Motion

克制、有目的、可中断：

- 时长 150–250ms；缓动 `cubic-bezier(0.16, 1, 0.3, 1)`。
- 只动画不透明度/变换——滚动列表中绝不动画布局属性。
- 启动画面 Logo 绘制（1.6s）是应用内唯一的“主角”动画。
- Respect the *减少动效* setting.

## 交互原则

- **一切皆可键盘到达。** 菜单中的每个操作也都在 ⌘K 命令面板中。快捷键显示在标签旁（`Kbd`）。
- **可发现。** 图标按钮始终有工具提示；空状态说明下一步该做什么。
- **默认安全。** 破坏性操作（硬重置、丢弃、强制推送）需要明确确认，并使用 `danger` 样式。
- **100ms 内反馈。** 长操作在工具栏显示忙碌标签；结果以 toast 呈现。冲突结果是警告（琥珀色），不是失败。
- **安全处乐观更新。** 暂存/取消暂存只刷新状态；只有历史实际变化时提交图才重新加载。

## 写作风格

Sentence case everywhere ("新建分支", not "Create Branch"). Errors say what failed and what to do: "推送失败：没有上游——请改用“设置上游”推送。" No jargon beyond Git's own vocabulary.
