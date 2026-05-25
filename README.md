# Figma Code Context

MCP server that transforms Figma API data into AI-friendly formats, enabling LLMs to generate pixel-perfect frontend code from design files.

## Features

- **MCP Tools** — 14 tools for extracting Figma data (nodes, components, variables, styles, images, SVGs, CSS/Tailwind)
- **Smart Compression** — Condensed format saves 60%+ tokens while preserving structural information
- **Pixel-Perfect Mode** — Full CSS property output for exact design reproduction
- **Skills** — Pre-built Claude Code slash commands for common workflows
- **Auto SVG Export** — Detects and exports vector icons automatically

## Quick Start

### Install to your project

```bash
npx figma-code-init --dir /path/to/your/project
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

| Command                    | Description                                         |
| -------------------------- | --------------------------------------------------- |
| `/figma:gen-component`     | Generate a component from Figma design              |
| `/figma:gen-page`          | Generate a full page with smart component splitting |
| `/figma:gen-pixel-perfect` | Pixel-perfect code generation                       |
| `/figma:tweak-style`       | Compare and fix style differences                   |
| `/figma:sync-tokens`       | Sync Figma Variables/Styles as design tokens        |

All skills auto-detect your project's tech stack (framework, styling, naming conventions) and prioritize reusing existing components over creating new ones.

## MCP Tools

| Tool                     | Description                                          |
| ------------------------ | ---------------------------------------------------- |
| `get_node`               | Get AI-friendly node data (JSON or condensed format) |
| `get_node_css`           | Convert node to CSS or Tailwind classes              |
| `get_file_structure`     | File overview with pages and top-level frames        |
| `get_components`         | List all components in a file                        |
| `get_component_variants` | Get variant properties for a COMPONENT_SET           |
| `get_variables`          | Get design variables/tokens                          |
| `get_styles`             | Get published color, text, and effect styles         |
| `get_texts`              | Extract all text content from a node/file            |
| `get_images`             | Export nodes as PNG/SVG/PDF/JPG                      |
| `export_svg`             | Download SVG content for vector nodes                |
| `get_icons_index`        | Index of all exported icons in current session       |
| `get_page_for_codegen`   | One-shot context for code generation                 |
| `search_nodes`           | Search nodes by name or type                         |
| `diff_nodes`             | Compare two nodes or track changes across versions   |
| `get_versions`           | File version history                                 |

## Project Structure

```
packages/
├── client/       — Figma API client with retry and rate limiting
├── core/         — Data transformation (simplify, condense, CSS generation, diff)
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

# Create a changeset (before releasing)
pnpm changeset

# Bump versions from changesets
pnpm version

# Publish to npm
pnpm release
```

## Release Workflow

This project uses [Changesets](https://github.com/changesets/changesets) for version management:

1. Make your changes
2. Run `pnpm changeset` to describe what changed
3. Commit the changeset file along with your code
4. When ready to release, run `pnpm version` to bump versions and generate CHANGELOG
5. Run `pnpm release` to build and publish to npm

Only the `figma-code-context` package is published. Internal packages (`@figma/client`, `@figma/core`) are bundled into the published output via tsup.

## Requirements

- Node.js >= 18
- pnpm >= 10
- Figma Personal Access Token

## License

MIT
