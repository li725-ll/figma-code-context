# Changelog

All notable changes to this project will be documented in this file.

## [1.4.0] - 2025-05-25

### Added

- **Changesets** — Automated version management and CHANGELOG generation
- **tsup Bundling** — Internal packages bundled into single publishable output
- **README** — English and Chinese documentation

### Changed

- **Renamed to `figma-code-context`** — New npm package name, CLI command updated accordingly
- **Release workflow** — `pnpm changeset` → `pnpm version` → `pnpm release`

## [1.3.5] - 2025-05-25

### Added

- **Component Reuse Priority** — All generation skills (gen-page, gen-component, gen-pixel-perfect) now prioritize reusing existing project components over creating new ones
- **Tweak Style Skill** — New skill for comparing Figma designs with current implementation and fixing style differences locally
- **Pixel-Perfect Mode** — `precision: "pixel-perfect"` parameter for exact CSS property output, covering layout, sizing, positioning, visual properties, and typography
- **Skills Distribution** — `figma-ai-init` CLI to install Claude Code skills and configure MCP server in target projects
- **MCP Prompts** — Programmatic prompt templates (gen-component, gen-page, sync-tokens, gen-pixel-perfect, tweak-style)
- **SVG Auto-Export** — Automatic detection and export of vector/icon nodes
- **.env Support** — Load `FIGMA_TOKEN` from `.env` file at monorepo root

### Fixed

- **Precision Gaps** — Complete data transformation pipeline for pixel-perfect mode (fills, strokes, effects, constraints, layout properties)
- **API Client URL** — Fix URL construction dropping `/v1` path prefix
- **Debug Server** — Fix JS syntax error in debug-web, add missing index.html

## [1.0.0] - 2025-05-20

### Added

- Initial monorepo setup with four packages:
  - `@figma/client` — Figma API client with retry and rate limiting
  - `@figma/core` — Data transformation (simplify, condense, CSS/Tailwind generation, diff)
  - `@figma/mcp-server` — MCP server with 14 tools for Figma data extraction
  - `@figma/debug-server` — Development/debugging utilities
- MCP tools: `get_node`, `get_node_css`, `get_file_structure`, `get_components`, `get_component_variants`, `get_variables`, `get_styles`, `get_texts`, `get_images`, `export_svg`, `get_icons_index`, `get_page_for_codegen`, `search_nodes`, `diff_nodes`, `get_versions`
- Condensed format for 60%+ token savings
- Tailwind and CSS output modes
- Node diff and version tracking
