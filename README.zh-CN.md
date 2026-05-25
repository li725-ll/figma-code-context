# Figma Code Context

将 Figma API 数据转换为 AI 友好格式的 MCP server，让 LLM 能够从设计稿生成像素级精确的前端代码。

## 功能特性

- **MCP 工具** — 14 个工具用于提取 Figma 数据（节点、组件、变量、样式、图片、SVG、CSS/Tailwind）
- **智能压缩** — 压缩格式节省 60%+ token，同时保留完整结构信息
- **像素级模式** — 输出完整 CSS 属性，精确还原设计稿
- **Skills** — 预置的 Claude Code 斜杠命令，覆盖常见工作流
- **自动 SVG 导出** — 自动检测并导出矢量图标

## 快速开始

### 安装到你的项目

```bash
npx figma-ai-init --dir /path/to/your/project
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

| 命令                       | 说明                                        |
| -------------------------- | ------------------------------------------- |
| `/figma:gen-component`     | 从 Figma 设计稿生成组件                     |
| `/figma:gen-page`          | 生成完整页面，智能拆分组件                  |
| `/figma:gen-pixel-perfect` | 像素级精确还原                              |
| `/figma:tweak-style`       | 对比设计稿与实现，修正样式差异              |
| `/figma:sync-tokens`       | 同步 Figma Variables/Styles 为 design token |

所有 skill 会自动检测项目技术栈（框架、样式方案、命名规范），并优先复用项目已有组件而非创建新组件。

## MCP 工具列表

| 工具                     | 说明                                      |
| ------------------------ | ----------------------------------------- |
| `get_node`               | 获取节点的 AI 友好数据（JSON 或压缩格式） |
| `get_node_css`           | 将节点转换为 CSS 或 Tailwind 类名         |
| `get_file_structure`     | 文件概览：页面和顶层 frame 结构           |
| `get_components`         | 获取文件中所有组件列表                    |
| `get_component_variants` | 获取 COMPONENT_SET 的变体属性             |
| `get_variables`          | 获取设计变量/token                        |
| `get_styles`             | 获取已发布的颜色、文字、效果样式          |
| `get_texts`              | 提取节点/文件中的所有文字内容             |
| `get_images`             | 导出节点为 PNG/SVG/PDF/JPG                |
| `export_svg`             | 下载矢量节点的 SVG 内容                   |
| `get_icons_index`        | 当前会话已导出图标的索引                  |
| `get_page_for_codegen`   | 一站式获取代码生成所需的完整上下文        |
| `search_nodes`           | 按名称或类型搜索节点                      |
| `diff_nodes`             | 对比两个节点或追踪版本变化                |
| `get_versions`           | 文件版本历史                              |

## 项目结构

```
packages/
├── client/       — Figma API 客户端，含重试和限流
├── core/         — 数据转换（简化、压缩、CSS 生成、diff）
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

# 创建 changeset（发布前）
pnpm changeset

# 从 changeset 更新版本号
pnpm version

# 发布到 npm
pnpm release
```

## 发布流程

项目使用 [Changesets](https://github.com/changesets/changesets) 管理版本：

1. 完成代码修改
2. 运行 `pnpm changeset` 描述变更内容
3. 将 changeset 文件随代码一起提交
4. 准备发布时运行 `pnpm version` 更新版本号并生成 CHANGELOG
5. 运行 `pnpm release` 构建并发布到 npm

只有 `figma-code-context` 包会发布到 npm。内部包（`@figma/client`、`@figma/core`）通过 tsup 打包进发布产物。

## 环境要求

- Node.js >= 18
- pnpm >= 10
- Figma 个人访问令牌

## 许可证

MIT
