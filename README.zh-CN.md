# Figma Code Context

将 Figma API 数据转换为 AI 友好格式的 MCP server，让 LLM 能够从设计稿生成像素级精确的前端代码。

## 功能特性

- **6 个精简工具** — 精简工具集，最大化 UI 还原度，最小化模型决策负担
- **视觉效果优先** — 目标是浏览器渲染效果与设计稿一致，而非属性逐一对应
- **压缩格式** — 高效的视觉层级表示，包含布局和样式信息
- **像素级 CSS** — 精确的 CSS/Tailwind 输出，精准还原视觉效果
- **Skills** — 预置的 Claude Code 斜杠命令，覆盖端到端工作流
- **自动 SVG 导出** — 自动检测并导出矢量图标

## 快速开始

### 安装到你的项目

```bash
npx figma-code-context init --dir /path/to/your/project
```

这会：

1. 复制 Claude Code skills 到 `.claude/commands/figma/`
2. 在 `.mcp.json` 中配置 MCP server

### 配置 Figma Token

从 [Figma 开发者设置](https://www.figma.com/developers/api#access-tokens) 获取个人访问令牌，然后添加到 `.mcp.json`：

```json
{
  "mcpServers": {
    "figma-code-context": {
      "command": "npx",
      "args": ["figma-code-context"],
      "env": {
        "FIGMA_TOKEN": "your-token-here"
      }
    }
  }
}
```

## Skills（斜杠命令）

安装后，在 Claude Code 中使用：

| 命令                       | 说明                                 |
| -------------------------- | ------------------------------------ |
| `/figma:gen-ui`            | 通用入口，自动选择组件/页面粒度      |
| `/figma:gen-component`     | 从 Figma 设计稿生成组件              |
| `/figma:gen-page`          | 生成完整页面，智能拆分组件           |
| `/figma:gen-app`           | 从 Figma 文件生成完整应用            |
| `/figma:gen-pixel-perfect` | 像素级精修，对比设计稿与实现修正差异 |
| `/figma:tweak-style`       | 局部修正样式差异                     |

所有 skill 会自动检测项目技术栈（框架、样式方案、命名规范），并优先复用项目已有组件而非创建新组件。

## MCP 工具列表

| 工具                     | 阶段        | 说明                            |
| ------------------------ | ----------- | ------------------------------- |
| `get_file_structure`     | 探索        | 文件概览：页面和顶层 frame 结构 |
| `get_node`               | 探索 → 实现 | 压缩格式的视觉层级结构          |
| `get_node_css`           | 实现 → 精修 | 精确的 CSS 或 Tailwind 输出     |
| `search_nodes`           | 探索        | 按名称或类型搜索节点            |
| `get_component_variants` | 实现        | 组件变体属性和状态 CSS 差异     |
| `export_svg`             | 实现        | 批量导出矢量图标为 SVG          |

### 设计理念

工具是**无状态的数据管道** — 提供参数（如 `depth`）控制粒度，但不做工作流决策。**Prompts/Skills 负责编排**工作流，决定在每个阶段调用什么工具。

## 项目结构

```
packages/
├── client/       — Figma API 客户端，含重试和限流
├── core/         — 数据转换（简化、压缩、CSS 生成）
├── mcp-server/   — MCP server 入口、工具、prompts 和 skills
└── debug-server/ — 开发调试工具
```

## 开发

```bash
# 安装依赖
pnpm install

# 构建所有包
pnpm build

# 监听模式
pnpm dev

# 代码检查和格式化
pnpm lint
pnpm format
```

## 发布

```bash
cd packages/mcp-server
npm version patch  # 或 minor/major
pnpm build
npm publish
```

只有 `figma-code-context` 包会发布到 npm。内部包（`@figma/client`、`@figma/core`）通过 tsup 打包进发布产物。

## 环境要求

- Node.js >= 18
- pnpm >= 10
- Figma 个人访问令牌

## 许可证

MIT
