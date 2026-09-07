# 编码规范

## 无代码注释

代码库刻意**不含行内注释**——代码必须自己说话：
靠命名与结构说明意图。一切值得解释的内容都在
真正的文档里：行为与架构在 `docs/`，来之不易的
坑记在 `CLAUDE.md`（G1+ 注意事项），用户可见行为记在 `CHANGELOG.md`。
唯一看起来像注释的行是机器指令：
`// eslint-disable…`、`@ts-expect-error`、`/// <reference…>`，以及 Rust/clippy
属性。添加解释性注释的 PR 应把内容移入文档。

## TypeScript

- `strict` 模式；禁用 `any`（用 `unknown` + 收窄）。测试与可证明安全的布局代码之外不得使用非空 `!`。
- 功能文件夹自持状态：功能的 store 只能通过其公共模块导入。跨功能读取走 hooks，绝不使用内部 setter。
- 纯逻辑（解析、布局、diff）位于 `@angkorgit/core`，不依赖框架且有单元测试。React 组件保持轻薄。
- 组件：仅函数组件 + hooks。列表行用 `memo`；仅在需要记忆化子组件的地方用 `useCallback` 提供稳定回调。
- 导入：应用内用 `@/` 别名；工作区包按名称引用。禁止深层相对路径（`../../..`）。
- 命名：组件 `PascalCase`、函数/值 `camelCase`、常量 `SCREAMING_SNAKE`。文件名与其默认导出一致。
- IPC 错误为 `{ code, message }` ——始终通过 toast 把 `message` 呈现给用户，绝不吞掉。

## Rust

- `rustfmt` + `clippy -D warnings` 是 CI 门禁。
- 库错误转换为 `AppError`；测试之外绝不 `unwrap()`。
- Tauri 命令是薄适配器；领域逻辑位于 `core/*`，无需 Tauri 即可测试。
- 阻塞性 git 操作一律走 `spawn_blocking`。
- 公共引擎函数接受 `&str` 路径，返回镜像 `@angkorgit/core` 的 serde 类型——修改任一侧时保持两侧同步。

## CSS / design

- 仅用 Tailwind 工具类；token 来自设计系统（`bg-surface`、`text-muted`、…）。组件内禁用十六进制颜色。
- 8px 间距体系；禁止任意值（`p-[13px]` 属于审查阻断项）。
- Angkor Dusk 是默认主题；每个视觉改动至少要在 Angkor Dusk 和一个浅色主题中检查（共内置十六款主题）。

## 提交与 PR

- 约定式提交：`feat(graph): …`、`fix(engine): …`、`docs: …`。
- 一个 PR 只做一件事；UI 改动附上截图/录屏。
- 测试伴随行为：引擎改动 → `git_engine.rs`，领域逻辑 → `tests/unit`，流程 → Playwright。
