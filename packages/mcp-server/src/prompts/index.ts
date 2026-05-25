import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerPrompts(server: McpServer) {
  server.prompt(
    "gen-app",
    "从 Figma 文件一键生成完整应用（所有页面、组件、tokens），全自动闭环验证",
    { url: z.string().describe("Figma 文件 URL（包含所有页面）") },
    async ({ url }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: buildGenAppPrompt(url),
          },
        },
      ],
    })
  );

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

  server.prompt(
    "gen-pixel-perfect",
    "从 Figma 设计稿像素级精确还原前端组件/页面",
    { url: z.string().describe("Figma 组件/页面 URL") },
    async ({ url }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: buildGenPixelPerfectPrompt(url),
          },
        },
      ],
    })
  );

  server.prompt(
    "tweak-style",
    "对比 Figma 设计稿与当前实现，局部修正样式差异",
    { url: z.string().describe("Figma 节点 URL") },
    async ({ url }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: buildTweakStylePrompt(url),
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
- 生成前先检查项目中是否已有同名或功能相似的组件，如果已有，优先扩展而非新建
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
- 生成页面前必须先扫描项目已有组件，能复用的直接 import，不重复生成
- 已有组件缺少变体时扩展已有组件，而非新建
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

function buildGenPixelPerfectPrompt(url: string): string {
  return `请根据以下 Figma 设计稿进行像素级精确还原，生成前端代码。

Figma URL: ${url}

## 工作流程

1. **检测技术栈**：读取 package.json、tsconfig.json、项目结构，确定框架和样式方案
2. **获取设计数据（精确模式）**：
   - 调用 get_node，参数：precision: "pixel-perfect", format: "json", depth: 15
   - 对有 imageRef 的节点调用 get_images 获取图片 URL
   - 对图标/矢量节点调用 export_svg 获取 SVG 文件
   - 调用 get_variables 获取设计 token
3. **逐节点精确转换**：
   - 布局：flex-direction、gap、justify-content、align-items、flex-wrap
   - 子元素尺寸：FILL→flex:1, HUG→fit-content, FIXED→精确px
   - 定位：absolute + top/left 精确偏移
   - 视觉：颜色精确hex、渐变精确参数、圆角四角独立、阴影完整参数
   - 边框：strokeAlign(inside用box-shadow)、四边独立、虚线
   - 文字：font-family/size/weight/line-height/letter-spacing/align/decoration/transform/truncation
   - 溢出：clipsContent→overflow:hidden、滚动方向
   - 变换：rotation→transform:rotate
   - 图片：所有 IMAGE fill 获取实际 URL
4. **生成代码**：使用项目技术栈，每个数值精确匹配设计稿
5. **自检**：逐项验证颜色、间距、字体、布局、圆角、阴影、图片

## 精度要求
- 颜色值必须与设计稿 hex 完全一致，不做近似
- 间距/尺寸精确到 px，不做四舍五入到 4/8 的倍数
- 字体属性完整：family + size + weight + line-height + letter-spacing
- 布局行为精确：flex 子元素的 sizing 策略必须正确
- 图片/图标不能缺失，必须有正确引用`;
}

function buildTweakStylePrompt(url: string): string {
  return `请对比以下 Figma 设计稿与当前实现，找出样式差异并进行局部修正。

Figma URL: ${url}

## 工作流程

1. **确认范围**：确认需要修正的文件/组件，以及具体偏差方面（间距、颜色、字体、布局、尺寸等）
2. **获取设计数据**：
   - 调用 get_node，参数：precision: "pixel-perfect", format: "json", depth: 15
   - 调用 get_node_css 获取精确样式
   - 如有图片/图标差异，调用 get_images 或 export_svg
3. **读取当前实现**：读取组件文件，识别样式方案，解析当前样式值
4. **逐项对比**：列出设计稿值 vs 当前实现值的差异表
5. **精准修正**：只修改有偏差的属性，保持代码风格和逻辑不变
6. **验证**：确认所有标记的偏差已修正，未引入新问题

## 修正原则
- 最小改动：只改有偏差的属性，不动其他代码
- 保持风格：使用项目已有的样式写法
- 保留逻辑：不改动交互逻辑、事件处理、状态管理
- 尊重 token：优先使用项目已有的 design token`;
}

function buildGenAppPrompt(url: string): string {
  return `请根据以下 Figma 文件 URL，全自动生成完整应用代码。文件中包含所有页面。

Figma 文件 URL: ${url}

## 核心原则

- 全程自主决策，不中断用户
- 严格依赖顺序：tokens → 共享组件 → 页面
- 先框架后细节：先搭建完整骨架（Round 1），再填充结构（Round 2），再样式（Round 3），最后精修（Round 4）
- 每个任务三步循环：规划 → 开发 → 验证
- 闭环：验证不通过 → 自动修复 → 重新验证，直到通过
- 所有 Round 完成后，执行一次整体全量验证

## 工作流程

### 阶段 1：分析与规划

1. **检测项目技术栈**：读取 package.json、tsconfig.json、项目结构，确定框架、样式方案、路由方式
2. **获取文件结构**：调用 get_file_structure 获取所有页面和顶层 Frame
3. **识别共享组件**：调用 get_components，构建组件依赖图，与项目已有组件匹配（复用/扩展/新建）
4. **识别设计系统**：调用 get_variables + get_styles，分析颜色、间距、字体、阴影 token
5. **输出执行计划**：页面清单、组件依赖图、路由结构、生成顺序

### 阶段 2：基础设施 + 骨架（Round 1）

1. **同步 Design Tokens**：get_variables + get_styles → 生成 token 文件（匹配项目样式方案）
2. **项目脚手架**（如需要）：初始化框架、配置路由、安装依赖
3. **创建所有页面空壳**：正确路由位置 + 布局容器 + 页面标题占位
4. **创建所有共享组件占位**：完整 Props 接口 + 最小实现
5. **质量关卡**：pnpm build 通过，所有路由可访问

### 阶段 3：结构填充（Round 2）

对每个共享组件（按依赖顺序）和每个页面执行：
1. **规划**：调用 get_node（condensed）或 get_page_for_codegen 获取设计数据
2. **开发**：生成完整 DOM 结构，引用已有组件，导出图片/SVG 资源
3. **验证**：构建通过 + 类型检查通过
4. **质量关卡**：全量构建通过

### 阶段 4：样式填充（Round 3）

对每个组件/页面：
1. **规划**：调用 get_node_css（recursive: true）获取样式
2. **开发**：应用 design tokens + 精确样式值（间距、颜色、字体、圆角、阴影）
3. **验证**：构建通过 + 样式属性完整
4. **质量关卡**：全量构建通过 + lint 通过

### 阶段 5：精修闭环（Round 4）

1. **Pixel-Perfect 校验**：对每个页面/组件调用 get_node_css（precision: pixel-perfect, recursive: true），逐属性对比，发现偏差自动修复（最多 3 轮）
2. **资源完整性**：确认所有图片/SVG 已导出并正确引用
3. **最终全量验证**：构建通过 + 类型检查 + lint + 所有 import 完整
4. **输出最终报告**：文件概览、路由结构、已知限制、后续建议

## 错误处理

- API 429 → 等待 30s 重试（最多 3 次）
- 构建失败 → 分析错误 → 修复 → 重试（最多 3 次）
- 3 次仍失败 → 记录到延迟列表，继续下一个
- 超大节点 → 降低 depth + condensed 格式

## 上下文管理

- 使用 condensed 格式（省 60%+ token），仅精修阶段用 pixel-perfect
- 每个组件/页面处理完后不保留 Figma 原始数据
- 超过 20 页 → 分批处理（每批 5 页）
- 组件依赖图和执行计划始终保留`;
}
