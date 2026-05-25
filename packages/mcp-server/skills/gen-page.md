---
description: 从 Figma 页面设计稿生成完整页面，智能拆分组件，自动放置文件
---

# 从 Figma 生成页面

你将根据 Figma 页面/Frame URL 生成完整的前端页面，包括智能组件拆分。

## 第一步：检测项目技术栈

在生成任何代码之前，先读取当前项目的配置：

1. 读取 `package.json` → 框架、样式方案、路由库（react-router/vue-router/next/nuxt）
2. 读取 `tsconfig.json` / `jsconfig.json` → 语言、路径别名
3. 扫描项目结构 → 识别：
   - 页面目录（pages/、views/、app/routes/、src/app/）
   - 组件目录（components/、src/components/）
   - 布局目录（layouts/、src/layouts/）
   - 路由配置方式（文件路由 vs 配置路由）
4. 读取已有页面文件 → 匹配页面组件的写法模式

## 第二步：获取 Figma 设计数据

1. 调用 `get_page_for_codegen` 一站式获取完整上下文（结构 + token + 组件 + 颜色字体）
2. 调用 `get_node` 获取详细节点树（condensed 格式，depth 设为 15+）
3. 如果页面引用了组件，调用 `get_component_variants` 获取变体信息
4. 调用 `get_variables` 和 `get_styles` 获取设计系统信息

## 第三步：分析页面复杂度并决定拆分策略

### 简单页面（节点层级 ≤ 3 层，可识别组件 ≤ 5 个）

直接拆分：

1. 分析设计稿，识别所有可复用单元
2. 一次性规划所有组件 + 页面结构
3. 生成所有文件

### 复杂页面（节点层级 > 3 层，或可识别组件 > 5 个）

分步实现：

1. **先实现完整 UI** — 将整个页面作为单一组件实现，确保结构和样式完整
2. **再拆分组件** — 从完整实现中识别重复模式和独立功能单元，逐步提取
3. **重构引用** — 页面改为引用子组件，确保功能不变

### 组件拆分判断标准

**应该提取为独立组件的：**

- 在页面内重复出现 2 次以上的 UI 模式
- 有独立交互逻辑的区域（表单、弹窗、下拉菜单）
- Figma 中已定义为 Component / ComponentSet 的节点
- 可在其他页面复用的通用模块（Header、Footer、Sidebar）
- 数据驱动的列表项（Card、ListItem、TableRow）

**不应该单独提取的：**

- 纯布局容器（仅做 flex/grid 包裹，无自身语义）
- 单一文本或图标节点
- 只在当前页面使用一次且无交互的静态区块
- 过度拆分会导致 props drilling 的情况

## 第四步：确定文件放置位置

1. **页面文件** → 放到项目的页面目录（pages/、views/、app/routes/）
2. **页面专属组件** → 放到页面同级的 components/ 子目录
3. **可复用组件** → 放到项目公共组件目录
4. **如果无法确定** → 询问用户：
   - "这个页面对应哪个路由路径？"
   - "这些组件（列出名称）是页面专属还是全局复用？"

## 第五步：生成代码

### 页面组件

- 包含完整布局结构
- 引用拆分出的子组件
- 预留路由相关事件（onNavigate、onBack、onRouteChange）
- 预留数据加载接口（如果页面有列表/详情模式）
- 如果项目使用 SSR/SSG 框架（Next.js/Nuxt），生成对应的数据获取函数

### 子组件

- 每个子组件遵循 gen-component 的规范
- Props 类型完整
- 事件接口预留（参考 gen-component 的事件规则）

### 事件预留（页面级）

| 场景     | 预留事件/接口                      |
| -------- | ---------------------------------- |
| 页面导航 | onNavigate, router hooks           |
| 数据加载 | fetchData / useQuery 占位          |
| 表单提交 | onSubmit, form validation          |
| 列表操作 | onItemClick, onLoadMore, onRefresh |
| 状态管理 | store/context 接入点               |

## 第六步：输出

按顺序生成所有文件：

1. 公共/复用组件（被依赖的先生成）
2. 页面专属组件
3. 页面主文件
4. 更新 barrel exports（如果项目使用）

完成后说明：

- 页面结构概览（组件树）
- 拆分了哪些组件及原因
- 预留了哪些事件/数据接口
- 需要用户后续接入的部分（路由配置、数据源、状态管理）
