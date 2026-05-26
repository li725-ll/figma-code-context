---
description: 从 Figma 文件一键生成完整应用（所有页面、组件、tokens），全自动闭环验证
---

# 一键生成完整应用

你将根据一个 Figma 文件 URL，全自动完成从设计到代码的完整流程。文件中包含所有页面。

## 核心原则

- **全程自主决策**，不中断用户（除非遇到无法推断的关键选择）
- **严格依赖顺序**：tokens → 共享组件 → 页面
- **先框架后细节**：先搭建完整骨架，再逐步填充
- **精度递进**：骨架(低) → 轮廓(中) → 细节(高) → 精修(最高)，每阶段用对应精度的工具
- **每个任务三步循环**：规划 → 开发 → 验证
- **闭环**：验证不通过 → 自动修复 → 重新验证，直到通过
- **最终整体验证**：所有任务完成后，再做一次全量校验

### 精度递进策略

| 阶段         | 目标       | 工具 + 参数                                                                                                       | 信息密度               |
| ------------ | ---------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------- |
| Round 1 骨架 | 页面级布局 | `get_file_structure` + `get_node(condensed, depth:3)`                                                             | 低 — 只看顶层区块      |
| Round 2 轮廓 | 组件级结构 | `get_node(condensed, depth:10)` / `get_page_for_codegen`                                                          | 中 — 完整节点树        |
| Round 3 细节 | 精确样式值 | `get_node_css(precision:"standard", recursive:true)`                                                              | 高 — 精确数值          |
| Round 4 精修 | 像素级校验 | `get_node_css(precision:"pixel-perfect", recursive:true)` + `get_node(json, precision:"pixel-perfect", depth:15)` | 最高 — 完整属性+富文本 |

---

## 阶段 1：分析与规划

### 1.1 检测项目技术栈

读取项目配置，确定：

1. `package.json` → 框架（React/Vue/Svelte/Next/Nuxt）、样式方案、路由库
2. `tsconfig.json` / `jsconfig.json` → 语言、路径别名
3. 扫描项目结构 → 页面目录、组件目录、布局目录、样式目录
4. 检查已有组件 → 列出名称和 Props，后续复用
5. 检查已有 token 文件 → tailwind.config / CSS 变量 / theme 对象

如果是空项目（无 package.json），根据设计稿复杂度推荐技术栈并搭建脚手架。

### 1.2 获取文件结构

调用 `get_file_structure` 获取 Figma 文件的所有页面和顶层 Frame：

- 记录每个页面名称和包含的 Frame
- 推断页面用途（首页、列表页、详情页、设置页等）
- 推断路由结构（从页面名/Frame 名推导路径）

### 1.3 识别共享组件

调用 `get_components` 获取文件中所有 Component 定义：

- 识别跨页面复用的组件（Header、Footer、NavBar、Button、Card 等）
- 构建组件依赖图（谁引用了谁）
- 与项目已有组件做匹配：
  - 已有 → 标记为"复用"
  - 部分匹配 → 标记为"扩展"
  - 不存在 → 标记为"新建"

### 1.4 识别设计系统

调用 `get_variables` + `get_styles`：

- 颜色体系（主色、中性色、语义色）
- 间距/尺寸 scale
- 字体 scale
- 阴影/圆角 token
- 主题模式（Light/Dark）

### 1.5 生成执行计划

输出计划摘要（仅展示，不等待确认）：

```
📋 执行计划：
├─ Design Tokens: N 个颜色 / N 个间距 / N 个字体
├─ 共享组件 (N 个): ComponentA, ComponentB, ...
├─ 页面 (N 个):
│   ├─ /home → 首页 (Frame: "Home")
│   ├─ /list → 列表页 (Frame: "Product List")
│   └─ ...
└─ 预计生成 N 个文件
```

---

## 阶段 2：基础设施 + 骨架（Round 1）

目标：搭建完整骨架，所有路由可访问，构建通过。
精度：**低** — 只需了解页面级布局结构，不需要节点细节。

### 2.1 同步 Design Tokens

1. 调用 `get_variables` 获取所有 Variables
2. 调用 `get_styles` 获取所有 Styles
3. 根据项目样式方案生成 token 文件：
   - Tailwind → 扩展 tailwind.config theme
   - CSS → 生成 CSS Custom Properties 文件
   - CSS-in-JS → 生成 theme 对象
4. 如有多主题（Light/Dark）→ 生成主题切换配置

### 2.2 项目脚手架（如需要）

如果项目为空或缺少必要配置：

- 初始化框架项目结构
- 配置路由
- 配置样式方案
- 安装必要依赖

### 2.3 创建所有页面空壳

获取每个页面的顶层结构：

- 调用 `get_node`（format: "condensed", depth: 3）— 只看顶层区块划分
- 推断页面布局方式（Header + Content + Footer？Sidebar + Main？）

为每个页面创建文件，内容仅包含：

- 正确的路由配置/文件路由位置
- 布局容器（使用正确的布局组件）
- 页面标题占位

### 2.4 创建所有共享组件占位

为每个需要新建的共享组件创建文件：

- 完整的 Props/类型接口（从 Figma 变体属性推断）
- 最小实现（返回一个带 className 的空容器）
- 正确的 export

### 质量关卡

```
验证项：
- [ ] pnpm build / npm run build 通过
- [ ] TypeScript 无类型错误
- [ ] 所有路由可访问（文件存在且 export 正确）
- [ ] 所有组件 import 不报错

不通过 → 修复 → 重新验证（最多 3 次）
```

---

## 阶段 3：结构填充（Round 2）

目标：所有组件和页面有完整的 DOM 结构，布局正确。
精度：**中** — 需要完整节点树，但不需要精确样式值。

### 3.1 填充共享组件

按依赖顺序（被依赖的先完成），对每个共享组件执行：

**规划：**

- 调用 `get_node`（format: "condensed", depth: 10）获取完整节点树
- 如果是 COMPONENT_SET，调用 `get_component_variants` 获取变体
- 分析结构：子节点层级、布局方式、内容类型

**开发：**

- 生成完整 DOM 结构（HTML/JSX）
- 实现所有变体的条件渲染
- 布局使用 flex/grid（从 Figma layoutMode 推断）
- 图片/图标节点用占位符标记

**验证：**

- 构建通过
- Props 类型正确
- 所有变体可渲染

### 3.2 填充页面结构

对每个页面执行：

**规划：**

- 调用 `get_page_for_codegen` 获取页面上下文（含结构+token+组件信息）
- 识别页面中使用的共享组件 → 直接 import
- 识别页面专属 UI 单元 → 决定是否提取为子组件

**开发：**

- 生成页面完整布局结构
- 引用已生成的共享组件
- 页面专属组件就地实现或提取到同级 components/
- 预留事件接口（导航、数据加载、表单提交）

**验证：**

- 构建通过
- 所有 import 正确
- 页面结构完整（无遗漏的 Frame）

### 3.3 导出资源

- 对所有有 `imageRef` 的节点调用 `get_images` 获取图片 URL
- 对所有矢量图标节点调用 `export_svg` 获取 SVG
- 将资源放到项目约定的资源目录（public/、assets/、src/assets/）
- 更新组件中的资源引用

### 质量关卡

```
验证项：
- [ ] 全量构建通过
- [ ] TypeScript 类型检查通过
- [ ] 所有组件 import 链完整
- [ ] 无未使用的 import 或变量

不通过 → 修复 → 重新验证（最多 3 次）
```

---

## 阶段 4：样式填充（Round 3）

目标：应用精确样式，视觉基本还原设计稿。
精度：**高** — 需要精确的数值（间距、颜色、字体），但不需要像素级完美。

### 4.1 应用 Design Tokens

- 将阶段 2 生成的 token 应用到组件和页面
- 颜色使用 token 变量（不硬编码 hex）
- 间距使用 token scale
- 字体使用 typography token

### 4.2 填充精确样式

对每个组件/页面：

**规划：**

- 调用 `get_node_css`（mode: 项目样式方案, precision: "standard", recursive: true）获取样式

**开发：**

- 应用精确样式值：
  - 间距（padding/margin/gap）
  - 颜色（背景、文字、边框）
  - 字体（family/size/weight/line-height/letter-spacing）
  - 圆角（四角独立值）
  - 阴影（x/y/blur/spread/color）
  - 边框（宽度/颜色/样式）
- 优先使用 token，token 中没有的才用精确值

**验证：**

- 构建通过
- 样式属性完整（无遗漏的视觉属性）

### 质量关卡

```
验证项：
- [ ] 全量构建通过
- [ ] lint 通过（如有配置）
- [ ] 所有颜色使用 token 或精确 hex
- [ ] 所有间距有明确值

不通过 → 修复 → 重新验证（最多 3 次）
```

---

## 阶段 5：精修闭环（Round 4）

目标：像素级精确，资源完整，最终交付。
核心原则：**自适应精度，以最小可视单位（MVU）为工作粒度，自上而下逐一校验，确保每个组件每个像素完整还原。**

### 5.1 全局评估与区块枚举

对每个页面执行：

1. 调用 `get_node`（format: "condensed", depth: 3）获取页面结构概览
2. 识别页面中的**最小可视单位（MVU）**：
   - 独立 UI 组件：Button, Card, NavItem, Input, Badge, Avatar
   - 内容区块：Hero Section, Feature Grid, Sidebar, Footer
   - 判断标准：用户能独立感知的最小视觉单元
3. 按从上到下顺序建立校验清单，记录每个 MVU 的 nodeId

```
📋 精修清单（PageName）：
├─ 1. Header (id: 12:345) — 简单，depth:6
├─ 2. Hero Section (id: 12:400) — 中等，depth:8
├─ 3. Feature Cards (id: 12:500) — 复杂，需拆分
├─ 4. Testimonials (id: 12:600) — 中等，depth:8
├─ 5. Footer (id: 12:700) — 简单，depth:6
└─ 总计 5 个 MVU
```

### 5.2 精度决策

根据 MVU 复杂度选择工具参数：

| MVU 类型                       | 子节点数 | 嵌套层级 | 工具调用                                                 |
| ------------------------------ | -------- | -------- | -------------------------------------------------------- |
| 简单（Button, Badge, Avatar）  | <5       | <3       | `get_node_css(recursive, depth:4, pixel-perfect)`        |
| 中等（Card, ListItem, NavBar） | 5-20     | 3-6      | `get_node_css(recursive, depth:8, pixel-perfect)`        |
| 复杂（Form, Table, Grid）      | 20-50    | 6+       | 先 `get_node(condensed, depth:2)` 枚举子单元，再逐一处理 |
| 超大（Dashboard, 长列表）      | 50+      | 8+       | 拆分为多个 MVU，递归本流程                               |

**严禁对整页调用 pixel-perfect。必须先枚举区块再逐一获取。**

### 5.3 逐单元校验循环

对校验清单中的每个 MVU，严格按顺序执行：

**A. 获取设计数据**

根据精度决策调用对应工具。如需完整原始属性（富文本段落样式等），追加：

- `get_node`（format: "json", precision: "pixel-perfect", depth: 15）

**B. 逐属性对比**

将获取的设计数据与已生成代码逐一对比：

- 颜色值是否完全一致？（hex/rgba/token）
- 间距是否精确到 px？（padding/margin/gap）
- 字体属性是否完整？（family/size/weight/line-height/letter-spacing）
- 布局行为是否正确？（flex 方向、对齐、sizing 策略、wrap）
- 圆角是否四角独立且精确？
- 阴影参数是否完整？（x/y/blur/spread/color）
- 边框是否正确？（宽度/颜色/样式/strokeAlign）
- 图片是否填充？（background-image URL、background-size/position）
- 尺寸约束是否正确？（min/max-width/height、固定尺寸 vs 自适应）
- opacity、overflow、z-index 是否正确？
- 富文本是否正确分段渲染？（不同样式的 span）

**C. 修复**

- 发现偏差 → 只改有偏差的属性，不动其他代码
- 修复后重新获取该 MVU 数据验证
- 最多 3 轮

**D. 标记进度**

- ✅ 通过 → 进入下一个 MVU
- ⚠️ 3 轮未通过 → 记录具体偏差，继续下一个

**E. 自动缩小范围**

如果对比中发现某个子区域偏差集中（>3 个属性偏差），对该子区域单独获取更高精度数据重新校验，而非反复修整个 MVU。

### 5.4 状态变体校验

对有多状态的组件（按钮、输入框、选项卡、开关等）：

1. 调用 `get_component_variants`（includeCSS: true）获取各状态的样式差异
2. 确认生成代码中每个状态都有对应的样式规则：
   - hover → `:hover` 或 `hover:` (Tailwind)
   - selected/active → `[data-selected]` / `aria-selected` / `:active`
   - disabled → `:disabled` / `[aria-disabled]`
   - focus → `:focus-visible`
3. 逐状态对比差异 CSS 是否已正确实现
4. 缺失的状态样式 → 补充实现

### 5.5 图片资源校验

对所有含 IMAGE fill 的节点：

1. 确认 CSS 中有 `background-image: url(...)` 或对应的 `<img src="...">`
2. 对缺失图片 URL 的节点，调用 `get_images` 获取真实下载 URL
3. 替换代码中的 imageRef 占位符为真实 URL 或本地资源路径
4. 确认 background-size/position 与 Figma scaleMode 一致：
   - FILL → `background-size: cover; background-position: center;`
   - FIT → `background-size: contain; background-position: center;`
   - TILE → `background-repeat: repeat;`
5. 对矢量图标确认已通过 `export_svg` 导出并正确引用

### 5.6 最终全量验证

```
最终验证清单：
- [ ] pnpm build 通过（零错误）
- [ ] TypeScript 类型检查通过
- [ ] lint 通过（如有配置）
- [ ] 所有路由可访问
- [ ] 所有组件 import 链完整
- [ ] 所有图片/图标资源存在且正确引用
- [ ] 所有组件状态样式完整（hover/selected/disabled）
- [ ] 无 console.error / 未处理的 Promise

发现问题 → 定位原因 → 修复 → 重新验证
```

### 5.7 输出最终报告

```
✅ 生成完成！

📁 文件概览：
├─ Design Tokens: src/styles/tokens.css (N 个变量)
├─ 共享组件 (N 个): src/components/...
├─ 页面 (N 个): src/pages/...
└─ 资源: public/images/... (N 张图片, N 个 SVG)

🗺️ 路由结构：
├─ / → 首页
├─ /products → 产品列表
├─ /products/:id → 产品详情
└─ ...

🔍 精修结果：
├─ 总 MVU 数: N
├─ 通过: N ✅
├─ 有残留偏差: N ⚠️
└─ 偏差详情（如有）：
    ├─ [组件名] - 具体偏差描述
    └─ ...

⚠️ 已知限制（如有）：
├─ [组件名] - 原因
└─ ...

📝 后续建议：
├─ 接入数据源（API endpoints 已预留）
├─ 实现交互逻辑（事件接口已预留）
├─ 添加动画/过渡效果
└─ 配置部署
```

---

## 错误处理策略

| 错误类型               | 处理方式                                |
| ---------------------- | --------------------------------------- |
| API 429 (限流)         | 等待 30s 后重试，最多 3 次              |
| API 404 (节点不存在)   | 跳过该节点，记录到延迟列表              |
| API 500+ (服务端错误)  | 等待后重试 1 次，仍失败则跳过           |
| 构建错误               | 分析错误信息 → 修复 → 重试（最多 3 次） |
| 类型错误               | 修复类型定义 → 重试                     |
| 超大节点 (>500 子节点) | 降低 depth + 使用 condensed 格式        |
| 3 次修复仍失败         | 记录到"延迟列表"，继续下一个任务        |

## 上下文窗口管理

- 每个组件/页面处理完后，不保留其完整 Figma 原始数据
- 始终使用 `condensed` 格式（节省 60%+ token），仅在阶段 5 精修时用 pixel-perfect
- 超过 20 个页面 → 分批处理（每批 5 个页面）
- 大型页面（节点 > 200）→ 分区块获取，逐区块生成
- **阶段 5 精修：严禁对整页调用 pixel-perfect，必须先枚举区块再逐一获取**
- 组件依赖图和执行计划始终保留在上下文中
