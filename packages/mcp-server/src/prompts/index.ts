import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerPrompts(server: McpServer) {
  server.prompt(
    "gen-ui",
    "从 Figma 设计稿还原 UI，通用入口（自动选择组件/页面粒度）",
    { url: z.string().describe("Figma URL") },
    async ({ url }) => ({
      messages: [
        {
          role: "user" as const,
          content: { type: "text" as const, text: buildGenUiPrompt(url) },
        },
      ],
    })
  );

  server.prompt(
    "gen-component",
    "从 Figma 设计稿生成前端组件",
    { url: z.string().describe("Figma 组件/Frame URL") },
    async ({ url }) => ({
      messages: [
        {
          role: "user" as const,
          content: { type: "text" as const, text: buildGenComponentPrompt(url) },
        },
      ],
    })
  );

  server.prompt(
    "gen-page",
    "从 Figma 页面设计稿生成完整页面",
    { url: z.string().describe("Figma 页面/Frame URL") },
    async ({ url }) => ({
      messages: [
        {
          role: "user" as const,
          content: { type: "text" as const, text: buildGenPagePrompt(url) },
        },
      ],
    })
  );

  server.prompt(
    "gen-app",
    "从 Figma 文件生成完整应用",
    { url: z.string().describe("Figma 文件 URL") },
    async ({ url }) => ({
      messages: [
        {
          role: "user" as const,
          content: { type: "text" as const, text: buildGenAppPrompt(url) },
        },
      ],
    })
  );

  server.prompt(
    "gen-pixel-perfect",
    "像素级精修：对比设计稿与实现，修正视觉差异",
    { url: z.string().describe("Figma 节点 URL") },
    async ({ url }) => ({
      messages: [
        {
          role: "user" as const,
          content: { type: "text" as const, text: buildGenPixelPerfectPrompt(url) },
        },
      ],
    })
  );

  server.prompt("tweak-style", "局部修正样式差异", { url: z.string().describe("Figma 节点 URL") }, async ({ url }) => ({
    messages: [
      {
        role: "user" as const,
        content: { type: "text" as const, text: buildTweakStylePrompt(url) },
      },
    ],
  }));
}

function buildGenUiPrompt(url: string): string {
  return `请根据以下 Figma 设计稿还原 UI。

Figma URL: ${url}

## 核心原则

目标是浏览器中的**视觉效果**与设计稿一致，而不是每个 Figma 节点属性都一一对应到代码。
- Figma 的内部结构（嵌套 frame、auto-layout、constraints）是设计工具的实现方式，不需要在代码中复刻
- 用最简洁的 HTML/CSS 实现相同的视觉效果
- 关键是最终渲染结果看起来一样：颜色、尺寸、间距、字体、圆角、阴影、层叠关系

## 工作流程

1. **检测技术栈**：读取 package.json、tsconfig.json、项目结构，确定框架和样式方案
2. **理解设计结构**：调用 get_node(depth: 8) 获取视觉层级，理解组件的视觉组成
3. **获取实现样式**：调用 get_node_css(recursive: true) 获取 CSS
4. **导出资源**：如有图标/矢量图，调用 export_svg
5. **处理组件状态**：如有 COMPONENT_SET，调用 get_component_variants 获取变体和状态 CSS
6. **生成代码**：使用项目技术栈实现，目标是视觉效果一致
7. **验证**：启动 dev server，确认视觉效果与设计稿一致

## 要求
- 优先复用项目已有组件和 design token
- 不引入项目中没有的新依赖
- 事件接口预留但不实现逻辑`;
}

function buildGenComponentPrompt(url: string): string {
  return `请根据以下 Figma 设计稿生成前端组件。

Figma URL: ${url}

## 核心原则

目标是组件在浏览器中的视觉效果与设计稿一致。Figma 内部结构不需要在代码中复刻。

## 工作流程

1. **检测技术栈**：读取 package.json、tsconfig.json 和已有组件，确定框架、样式方案、命名规范
2. **获取设计数据**：
   - 调用 get_node 获取节点视觉结构
   - 如果是 COMPONENT_SET，调用 get_component_variants 获取变体和状态 CSS
   - 调用 get_node_css 获取样式（根据项目选择 css 或 tailwind 模式）
3. **确定文件位置**：根据项目结构决定组件放在哪里，不确定时询问我
4. **生成组件**：
   - Props 从 Figma 变体属性推断
   - 事件接口预留（onClick、onChange 等）
   - 样式使用项目已有方案和 token
   - 遵循项目已有的代码规范

## 要求
- 生成前先检查项目中是否已有同名或功能相似的组件，优先扩展而非新建
- 优先使用项目已有的 design token / CSS 变量
- 不引入项目中没有的新依赖`;
}

function buildGenPagePrompt(url: string): string {
  return `请根据以下 Figma 页面设计稿生成完整的前端页面。

Figma URL: ${url}

## 核心原则

目标是页面在浏览器中的视觉效果与设计稿一致。用最简洁的代码结构实现相同视觉效果。

## 工作流程

1. **检测技术栈**：读取 package.json、tsconfig.json、项目结构，确定框架、路由方案、页面目录
2. **获取设计数据**：
   - 调用 get_node(depth: 10) 获取页面完整视觉结构
   - 调用 get_node_css(recursive: true) 获取样式
   - 如有引用组件，调用 get_component_variants
3. **分析复杂度并决定拆分策略**：
   - 简单页面（≤5 个区块）→ 直接生成
   - 复杂页面（>5 个区块）→ 先实现完整 UI，再拆分组件
4. **组件拆分标准**：
   - 重复 2 次以上的模式 → 提取
   - 有独立交互的区域 → 提取
   - 其余保持内联
5. **生成代码**：页面 + 拆分出的组件
6. **验证**：构建通过 + dev server 中视觉效果正确

## 要求
- 优先复用项目已有组件
- 页面放在项目约定的页面目录中
- 响应式布局遵循设计稿的断点（如有）`;
}

function buildGenAppPrompt(url: string): string {
  return `请根据以下 Figma 文件生成完整应用。

Figma URL: ${url}

## 核心原则

目标是应用中每个页面的视觉效果与设计稿一致。不追求 Figma 内部结构的 1:1 复刻。

## 工作流程

### 阶段 1：分析与规划

1. **检测项目技术栈**：读取 package.json、tsconfig.json、项目结构
2. **获取文件结构**：调用 get_file_structure 获取所有页面和顶层 Frame
3. **识别共享组件**：调用 search_nodes(type: 'COMPONENT_SET') 找到组件集
4. **输出执行计划**：页面清单、组件依赖、路由结构、生成顺序

### 阶段 2：基础设施

1. **项目脚手架**（如需要）：初始化框架、配置路由
2. **创建所有页面空壳**：正确路由位置 + 布局容器
3. **创建共享组件占位**：Props 接口 + 最小实现
4. **质量关卡**：构建通过

### 阶段 3：结构填充

对每个组件和页面：
1. 调用 get_node 获取视觉结构
2. 生成完整 DOM 结构，引用已有组件
3. 如有图标/矢量 → export_svg
4. 质量关卡：构建通过

### 阶段 4：样式填充

对每个组件/页面：
1. 调用 get_node_css(recursive: true) 获取样式
2. 应用精确样式值
3. 质量关卡：构建通过

### 阶段 5：精修

1. 对每个页面/组件调用 get_node_css，对比视觉效果，修正差异（最多 3 轮）
2. 确认所有资源已正确引用
3. 最终全量验证

## 错误处理

- API 429 → 等待 30s 重试（最多 3 次）
- 构建失败 → 分析错误 → 修复 → 重试（最多 3 次）
- 3 次仍失败 → 记录，继续下一个`;
}

function buildGenPixelPerfectPrompt(url: string): string {
  return `请对比以下 Figma 设计稿与当前实现，进行像素级精修。

Figma URL: ${url}

## 核心原则

目标是修正**视觉差异**，让浏览器渲染效果与设计稿一致。不是逐属性对比，而是关注用户能看到的差异。

## 工作流程

1. **获取设计数据**：调用 get_node_css(recursive: true) 获取完整 CSS
2. **读取当前实现**：找到对应的组件/页面代码
3. **视觉对比**：关注以下维度的差异
   - 尺寸和间距（width/height/margin/padding/gap）
   - 颜色（background/color/border-color）
   - 字体（font-size/weight/line-height/letter-spacing）
   - 圆角和阴影（border-radius/box-shadow）
   - 布局方向和对齐（flex-direction/align/justify）
4. **修正差异**：逐个修复发现的视觉差异
5. **验证**：构建通过 + 视觉效果一致

## 注意
- 不要为了"属性对齐"而改动已经视觉正确的代码
- 如果当前实现用了不同的 CSS 方式但视觉效果相同，不需要修改
- 最多 3 轮精修，每轮聚焦最明显的差异`;
}

function buildTweakStylePrompt(url: string): string {
  return `请对比以下 Figma 设计稿与当前实现，局部修正样式差异。

Figma URL: ${url}

## 工作流程

1. **获取设计样式**：调用 get_node_css 获取目标节点的 CSS
2. **读取当前实现**：找到对应代码
3. **对比并修正**：只修改有视觉差异的属性，不动已经正确的部分
4. **验证**：确认修改后视觉效果与设计稿一致

## 注意
- 最小化改动范围，只修正有差异的部分
- 保持代码风格与项目一致`;
}
