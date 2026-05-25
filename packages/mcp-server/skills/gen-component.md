---
description: 从 Figma 设计稿生成前端组件，自动检测技术栈、拆分组件、预留事件接口
---

# 从 Figma 生成组件

你将根据 Figma 设计稿 URL 生成完整的前端组件代码。

## 第一步：检测项目技术栈

在生成任何代码之前，先读取当前项目的配置来确定技术栈：

1. 读取 `package.json` → 识别框架（react/vue/svelte/angular/solid）和样式方案（tailwindcss/styled-components/@emotion/sass/css-modules）
2. 读取 `tsconfig.json` 或 `jsconfig.json` → 确定语言（TS/JS）、路径别名（@/、~/）
3. 扫描已有组件文件（找到 src/components 或类似目录下的文件）→ 匹配：
   - 命名规范（PascalCase.tsx / kebab-case.vue / camelCase.ts）
   - 导出风格（export default vs named export）
   - Props 定义模式（interface vs type vs defineProps）
   - 文件组织（单文件 vs 目录+index）
   - 样式写法（className vs class vs :class，内联 vs 外部文件）

## 第二步：获取 Figma 设计数据

使用 MCP 工具获取设计稿信息：

1. 调用 `get_node` 获取目标节点的结构数据（使用 condensed 格式）
2. 如果节点是 COMPONENT_SET，调用 `get_component_variants` 获取所有变体和属性组合
3. 调用 `get_node_css` 获取样式信息（根据项目使用 css 或 tailwind 模式）
4. 调用 `get_variables` 获取设计 token（如果项目有 token 体系）

## 第三步：确定文件放置位置

根据项目结构决定组件文件放在哪里：

1. 识别项目的组件目录结构（src/components/、app/components/、components/）
2. 判断组件归属：
   - 如果是通用 UI 组件（Button、Input、Modal）→ 放到 shared/common/ui 目录
   - 如果是业务组件 → 放到对应业务模块目录
   - 如果是页面级组件 → 放到对应页面目录
3. **如果无法确定归属，询问用户**："这个组件应该放在哪个目录？它属于哪个模块？"

## 第四步：生成组件代码

### Props / 接口设计

- 从 Figma 变体属性生成 props 类型（如 variant、size、state）
- 从节点内容推断数据 props（如 title、description、items）
- 添加事件 handler props（见事件预留规则）

### 事件预留规则

根据组件语义角色自动添加事件接口：

| 组件类型              | 预留事件                            |
| --------------------- | ----------------------------------- |
| Button/CTA            | onClick, onSubmit                   |
| Input/TextField       | onChange, onBlur, onFocus, onSubmit |
| Link/Nav              | onClick, href (prop)                |
| List/Card             | onItemClick, onSelect               |
| Modal/Dialog          | onClose, onConfirm, onCancel        |
| Form                  | onSubmit, onReset, onValidate       |
| Tab/Accordion         | onChange, onTabClick                |
| Checkbox/Radio/Switch | onChange, checked (prop)            |
| Dropdown/Select       | onChange, onOpen, onClose           |
| 可拖拽元素            | onDragStart, onDragEnd, onDrop      |

事件 props 必须是可选的（`?`），类型完整但不实现具体逻辑。

### 样式生成

- 使用项目已有的样式方案（不引入新方案）
- 优先使用项目已有的 design token / CSS 变量
- 颜色、间距、字体大小等使用 token 而非硬编码值
- 响应式：如果项目有响应式模式，遵循已有断点

### 代码规范

- 遵循项目已有的 ESLint/Prettier 配置
- 组件内部不写注释（除非有隐含约束）
- 导出方式与项目已有组件一致
- 如果项目使用 barrel exports（index.ts），更新对应的 index 文件

## 第五步：输出

生成完整的组件文件并写入正确位置。如果组件有多个相关文件（样式文件、类型文件、测试文件），一并生成。

完成后简要说明：

- 生成了哪些文件
- 组件支持哪些 props/变体
- 预留了哪些事件接口
