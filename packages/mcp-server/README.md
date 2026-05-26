# Figma Code Context

MCP server that transforms Figma API data into AI-friendly formats for LLM code generation.

## Features

- **6 Focused Tools** — Streamlined toolset for maximum UI fidelity with minimal decision overhead
- **Visual Fidelity First** — Goal is browser rendering matching the design, not property-level replication
- **Condensed Format** — Token-efficient visual hierarchy representation with layout and style info
- **Pixel-Perfect CSS** — Precise CSS/Tailwind output for exact visual reproduction
- **Skills** — Pre-built Claude Code slash commands for end-to-end workflows
- **Auto SVG Export** — Detects and exports vector icons automatically

## Quick Start

### Install to your project

```bash
npx figma-code-context init --dir /path/to/your/project
```

This will:

1. Copy Claude Code skills to `.claude/commands/figma/`
2. Configure the MCP server in `.mcp.json`

### Set up Figma token

Get a personal access token from [Figma Developer Settings](https://www.figma.com/developers/api#access-tokens), then add it to your `.mcp.json`:

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

## Skills (Slash Commands)

After installation, use these in Claude Code:

| Command                    | Description                                                        |
| -------------------------- | ------------------------------------------------------------------ |
| `/figma:gen-ui`            | Universal entry point for UI generation (auto-selects granularity) |
| `/figma:gen-component`     | Generate a component from Figma design                             |
| `/figma:gen-page`          | Generate a full page with smart component splitting                |
| `/figma:gen-app`           | Generate a complete app from Figma file                            |
| `/figma:gen-pixel-perfect` | Visual diff and pixel-perfect refinement                           |
| `/figma:tweak-style`       | Compare and fix local style differences                            |

All skills auto-detect your project's tech stack (framework, styling, naming conventions) and prioritize reusing existing components over creating new ones.

## MCP Tools

| Tool                     | Stage               | Description                                   |
| ------------------------ | ------------------- | --------------------------------------------- |
| `get_file_structure`     | Explore             | File overview with pages and top-level frames |
| `get_node`               | Explore → Implement | Visual hierarchy in condensed format          |
| `get_node_css`           | Implement → Refine  | Precise CSS or Tailwind output                |
| `search_nodes`           | Explore             | Search nodes by name or type                  |
| `get_component_variants` | Implement           | Variant properties and state CSS diffs        |
| `export_svg`             | Implement           | Batch export vector icons as SVG              |

### Design Philosophy

Tools are **stateless data pipelines** — they provide parameters (like `depth`) for granularity control but don't make workflow decisions. The **prompts/skills orchestrate** the workflow, deciding what to call at each stage.

## Project Structure

```
packages/
├── client/       — Figma API client with retry and rate limiting
├── core/         — Data transformation (simplify, condense, CSS generation)
├── mcp-server/   — MCP server entry point, tools, prompts, and skills
└── debug-server/ — Development/debugging utilities
```

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Watch mode
pnpm dev

# Lint & format
pnpm lint
pnpm format
```

## Release

```bash
cd packages/mcp-server
npm version patch  # or minor/major
pnpm build
npm publish
```

Only the `figma-code-context` package is published. Internal packages (`@figma/client`, `@figma/core`) are bundled into the output via tsup.

## Requirements

- Node.js >= 18
- pnpm >= 10
- Figma Personal Access Token

## License

MIT
