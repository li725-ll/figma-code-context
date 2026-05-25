import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerPrompts(server: McpServer) {
  server.prompt(
    "gen-component",
    "从 Figma 设计稿生成前端组件，自动检测技术栈、预留事件接口",
    { url: z.string().describe("Figma 组件/Frame URL") },
    async ({ url }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: buildGenComponentPrompt(url),
          },
        },
      ],
    })
  );

  server.prompt(
    "gen-page",
    "从 Figma 页面设计稿生成完整页面，智能拆分组件",
    { url: z.string().describe("Figma 页面/Frame URL") },
    async ({ url }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: buildGenPagePrompt(url),
          },
        },
      ],
    })
  );

  server.prompt(
    "sync-tokens",
    "将 Figma Variables 和 Styles 同步为项目的 design token 文件",
    { url: z.string().describe("Figma 文件 URL") },
    async ({ url }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: buildSyncTokensPrompt(url),
          },
        },
      ],
    })
  );
}

function buildGenComponentPrompt(url: string): string {
  return `请根据以下 Figma 设计稿生成前端组件。

Figma URL: ${url}

## 工作流程

1. **检测技术栈**：读取项目的 package.json、tsconfig.json 和已有组件，确定框架、样式方案、命名规范
2. **获取设计数据**：
   - 调用 get_node 获取节点结构（condensed 格式）
   - 如果是 COMPONENT_SET，调用 get_component_variants 获取变体
   - 调用 get_node_css 获取样式（根据项目选择 css 或 tailwind 模式）
3. **确定文件位置**：根据项目结构决定组件放在哪里，不确定时询问我
4. **生成组件**：
   - Props 从 Figma 变体属性推断
   - 事件接口预留（onClick、onChange 等，根据组件语义）
   - 样式使用项目已有方案和 token
   - 遵循项目已有的代码规范和文件组织方式

## 要求
- 事件 props 可选，类型完整但不实现逻辑
- 优先使用项目已有的 design token / CSS 变量
- 不引入项目中没有的新依赖`;
}

function buildGenPagePrompt(url: string): string {
  return `请根据以下 Figma 页面设计稿生成完整的前端页面。

Figma URL: ${url}

## 工作流程

1. **检测技术栈**：读取 package.json、tsconfig.json、项目结构，确定框架、路由方案、页面目录
2. **获取设计数据**：
   - 调用 get_page_for_codegen 获取完整上下文
   - 调用 get_node 获取详细节点树（depth 15+）
   - 如有引用组件，调用 get_component_variants
3. **分析复杂度并决定拆分策略**：
   - 简单页面（≤5 个组件）→ 直接拆分，一次性生成
   - 复杂页面（>5 个组件）→ 先实现完整 UI，再拆分组件
4. **组件拆分标准**：
   - 重复 2 次以上的模式 → 提取
   - 有独立交互的区域 → 提取
   - Figma 中定义为 Component 的 → 提取
   - 纯布局容器、单一文本/图标 → 不提取
5. **确定文件位置**：
   - 页面 → pages/views/routes 目录
   - 页面专属组件 → 页面同级 components/
   - 可复用组件 → 公共组件目录
   - 不确定时询问我
6. **生成代码**：预留路由事件、数据加载接口、表单提交等

## 要求
- 先生成被依赖的组件，再生成页面
- 事件接口预留完整但不实现
- 如果是 SSR/SSG 框架，生成对应数据获取函数`;
}

function buildSyncTokensPrompt(url: string): string {
  return `请从以下 Figma 文件同步 design tokens 到当前项目。

Figma URL: ${url}

## 工作流程

1. **检测项目 token 体系**：
   - 查找已有 token 文件（tailwind.config、CSS 变量文件、theme 对象等）
   - 确定输出格式（Tailwind extend / CSS Custom Properties / JS theme）
   - 不确定时询问我
2. **获取 Figma 数据**：
   - 调用 get_variables 获取所有 Variables
   - 调用 get_styles 获取所有 Styles
3. **转换 Token**：
   - 颜色 → 保留命名层级（primary/500 → --color-primary-500）
   - 间距/尺寸 → spacing scale
   - 字体 → typography scale
   - 效果 → shadow/blur token
   - 多 Mode（Light/Dark）→ 主题变体
4. **合并输出**：
   - 已有 token → 更新值
   - 新 token → 追加
   - 项目有但 Figma 没有的 → 保留
   - 生成前展示变更摘要让我确认

## 要求
- 合并而非覆盖已有 token 文件
- 保留 Figma 中的语义命名
- 如果有多主题，说明切换方式`;
}
