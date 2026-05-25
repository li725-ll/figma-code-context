#!/usr/bin/env node

import { readFileSync, writeFileSync, mkdirSync, existsSync, cpSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __init_dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILLS_SOURCE = path.resolve(__init_dirname, "../skills");
const PACKAGE_JSON_PATH = path.resolve(__init_dirname, "../package.json");

function findProjectRoot(startDir: string): string | null {
  let dir = startDir;
  while (true) {
    if (existsSync(path.join(dir, "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function getMcpServerCommand(): string {
  try {
    const pkg = JSON.parse(readFileSync(PACKAGE_JSON_PATH, "utf-8"));
    const binName = Object.keys(pkg.bin || {})[0];
    return binName || "figma-ai-context";
  } catch {
    return "figma-ai-context";
  }
}

function mergeSettings(projectRoot: string): void {
  const settingsDir = path.join(projectRoot, ".claude");
  const settingsPath = path.join(settingsDir, "settings.json");

  mkdirSync(settingsDir, { recursive: true });

  let settings: Record<string, unknown> = {};
  if (existsSync(settingsPath)) {
    try {
      settings = JSON.parse(readFileSync(settingsPath, "utf-8"));
    } catch {
      settings = {};
    }
  }

  const mcpServers = (settings.mcpServers ?? {}) as Record<string, unknown>;
  const existing = mcpServers["figma-ai-context"] as Record<string, unknown> | undefined;

  const serverBin = getMcpServerCommand();

  mcpServers["figma-ai-context"] = {
    command: "npx",
    args: [serverBin],
    env: {
      FIGMA_TOKEN: (existing?.env as Record<string, string>)?.FIGMA_TOKEN || "${FIGMA_TOKEN}",
    },
  };

  settings.mcpServers = mcpServers;
  writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n", "utf-8");
}

function copySkills(projectRoot: string): string[] {
  const targetDir = path.join(projectRoot, ".claude", "commands", "figma");
  mkdirSync(targetDir, { recursive: true });

  const copied: string[] = [];

  if (!existsSync(SKILLS_SOURCE)) {
    console.error("Error: skills source directory not found at", SKILLS_SOURCE);
    process.exit(1);
  }

  const files = ["gen-component.md", "gen-page.md", "sync-tokens.md"];

  for (const file of files) {
    const src = path.join(SKILLS_SOURCE, file);
    if (!existsSync(src)) {
      console.warn(`Warning: skill file not found: ${file}`);
      continue;
    }

    const content = readFileSync(src, "utf-8");
    const pkg = JSON.parse(readFileSync(PACKAGE_JSON_PATH, "utf-8"));
    const version = pkg.version || "unknown";
    const header = `<!-- figma-ai-context v${version} -->\n`;

    const dest = path.join(targetDir, file);
    writeFileSync(dest, header + content, "utf-8");
    copied.push(path.relative(projectRoot, dest));
  }

  return copied;
}

function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
figma-ai-init - 安装 Figma AI skills 到当前项目

用法:
  npx figma-ai-init [选项]

选项:
  --dir <path>   指定项目目录（默认：当前目录）
  --skip-mcp     跳过 MCP server 配置
  -h, --help     显示帮助

功能:
  1. 复制 Claude Code skills 到 .claude/commands/figma/
  2. 配置 MCP server 到 .claude/settings.json
`);
    process.exit(0);
  }

  const dirIdx = args.indexOf("--dir");
  const startDir = dirIdx !== -1 && args[dirIdx + 1] ? path.resolve(args[dirIdx + 1]) : process.cwd();
  const skipMcp = args.includes("--skip-mcp");

  const projectRoot = findProjectRoot(startDir);
  if (!projectRoot) {
    console.error("Error: 未找到项目根目录（没有 package.json）");
    process.exit(1);
  }

  console.log(`\n项目目录: ${projectRoot}\n`);

  const copied = copySkills(projectRoot);
  console.log(`已安装 ${copied.length} 个 skills:`);
  for (const f of copied) {
    console.log(`  + ${f}`);
  }

  if (!skipMcp) {
    mergeSettings(projectRoot);
    console.log(`\n已配置 MCP server → .claude/settings.json`);
    console.log(`  请确保设置 FIGMA_TOKEN 环境变量`);
  }

  console.log(`\n完成! 在 Claude Code 中使用:`);
  console.log(`  /project:figma/gen-component <figma-url>`);
  console.log(`  /project:figma/gen-page <figma-url>`);
  console.log(`  /project:figma/sync-tokens <figma-url>\n`);
}

main();
