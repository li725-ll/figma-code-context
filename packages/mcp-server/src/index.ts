#!/usr/bin/env node

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { FigmaClient, FigmaApiError } from "@figma/client";
import { TempManager } from "./temp-manager.js";
import { Logger } from "./logger.js";
import { SvgExporter } from "./svg-exporter.js";
import {
  generateSummary,
  simplifyNode,
  buildVariableMap,
  buildVariableMapFromNodes,
  toCondensedWithBudget,
  type CondensedSvgMap,
} from "@figma/core";
import {
  parseFigmaUrl,
  nodeToCSS,
  nodeToCSSRecursive,
  nodeToTailwind,
  nodeToTailwindRecursive,
  searchNodes,
} from "@figma/core";
import { registerPrompts } from "./prompts/index.js";

// Load .env from monorepo root
const __mcp_dirname = path.dirname(fileURLToPath(import.meta.url));
const MONOREPO_ROOT = path.resolve(__mcp_dirname, "../../..");
try {
  const envPath = path.join(MONOREPO_ROOT, ".env");
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
} catch {
  // .env file not found, rely on environment variables
}

// Handle "init" subcommand early, before token validation
const args = process.argv.slice(2);
if (args[0] === "init") {
  const initModule = await import("./init-run.js");
  initModule.run(args.slice(1));
} else {
  if (!process.env.FIGMA_TOKEN) {
    process.stderr.write(
      "Error: FIGMA_TOKEN 环境变量未设置。\n" +
        '请在 MCP 配置中添加: "env": { "FIGMA_TOKEN": "your-token" }\n' +
        "获取 token: https://www.figma.com/developers/api#access-tokens\n"
    );
    process.exit(1);
  }

  function formatError(error: unknown): { content: Array<{ type: "text"; text: string }> } {
    if (error instanceof FigmaApiError) {
      const status = error.status;
      let message: string;
      if (status === 401 || status === 403) {
        message = "Figma token 无效或无权限访问此文件，请检查 FIGMA_TOKEN 配置";
      } else if (status === 404) {
        message = "文件或节点不存在，请检查 fileKey 和 nodeId 是否正确";
      } else if (status === 429) {
        message = "Figma API 请求过于频繁，已重试多次仍失败，请稍后再试";
      } else if (status >= 500) {
        message = `Figma API 服务端错误 (${status})，请稍后重试`;
      } else {
        message = `Figma API 错误 (${status}): ${error.message}`;
      }
      return { content: [{ type: "text" as const, text: message }] };
    }

    if (error instanceof Error) {
      if (
        error.message.includes("fetch") ||
        error.message.includes("ECONNREFUSED") ||
        error.message.includes("ETIMEDOUT")
      ) {
        return { content: [{ type: "text" as const, text: "无法连接 Figma API，请检查网络连接" }] };
      }
      return { content: [{ type: "text" as const, text: `操作失败: ${error.message}` }] };
    }

    return { content: [{ type: "text" as const, text: "发生未知错误" }] };
  }

  const server = new McpServer({
    name: "figma-code-context",
    version: "1.4.0",
  });

  const tempManager = new TempManager();
  tempManager.init();

  const logger = new Logger(tempManager);
  const figma = new FigmaClient({ token: process.env.FIGMA_TOKEN });
  const svgExporter = new SvgExporter(figma, tempManager);

  figma.onResponse = (path, params, data) => {
    logger.logRaw("api", { path, params }, data);
  };

  server.registerTool(
    "get_file_structure",
    {
      description:
        "获取 Figma 文件的页面和顶层 frame 结构概览。这是最粗粒度的视图，作为探索文件的第一步使用，之后用 search_nodes 或 get_node 深入具体区域",
      inputSchema: {
        fileKey: z.string().describe("Figma 文件 Key"),
      },
    },
    async ({ fileKey }) => {
      try {
        const data = (await figma.getFile(fileKey, { depth: 2 })) as any;
        if (!data) return { content: [{ type: "text" as const, text: "获取文件失败，请检查 token 和 file key" }] };

        const pages = data.document.children.map((page: any) => ({
          id: page.id,
          name: page.name,
          frames: (page.children || [])
            .filter((c: any) => c.type === "FRAME" || c.type === "COMPONENT" || c.type === "COMPONENT_SET")
            .map((f: any) => ({
              id: f.id,
              name: f.name,
              type: f.type,
              width: f.absoluteBoundingBox?.width,
              height: f.absoluteBoundingBox?.height,
            })),
        }));

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ fileName: data.name, lastModified: data.lastModified, pages }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.registerTool(
    "get_node",
    {
      description:
        "获取指定节点的视觉层级结构（压缩格式），包含尺寸、间距、颜色、布局、字体等关键视觉属性。用于理解设计的视觉组成，是代码生成的基础。输出包含 CSS 变量绑定和自动检测的 SVG 图标导出",
      inputSchema: {
        fileKey: z.string().describe("Figma 文件 Key"),
        nodeId: z.string().describe("节点 ID，格式如 '312:33667' 或 '312-33667'"),
        depth: z.number().optional().default(10).describe("递归深度，默认 10"),
      },
    },
    async ({ fileKey, nodeId, depth }) => {
      try {
        const normalizedId = nodeId.replace(/-/g, ":");
        const data = (await figma.getFileNodes(fileKey, [normalizedId])) as any;
        if (!data) return { content: [{ type: "text" as const, text: "获取节点失败" }] };

        const nodeData = data.nodes[normalizedId];
        if (!nodeData) return { content: [{ type: "text" as const, text: `节点 ${normalizedId} 不存在` }] };

        tempManager.writeRaw(fileKey, normalizedId, nodeData);

        const simplified = simplifyNode(nodeData.document, 0, depth);
        const summary = generateSummary(simplified);

        const exportableNodes = svgExporter.detectExportableNodes(nodeData.document);
        let svgSection = "";
        const svgMap: CondensedSvgMap = {};
        if (exportableNodes.length > 0) {
          try {
            const svgResults = await svgExporter.exportNodes(fileKey, exportableNodes);
            svgSection = svgExporter.formatExportResults(svgResults);
            const iconEntries: any[] = [];
            for (const [nodeIdKey, svgInfo] of svgResults.entries()) {
              svgMap[nodeIdKey] = {
                filename: svgInfo.filename,
                path: svgInfo.path,
              };
              iconEntries.push({
                fileKey,
                nodeId: nodeIdKey,
                name: svgInfo.filename || nodeIdKey,
                svgPath: svgInfo.path || null,
                source: "get_node",
              });
            }
            if (iconEntries.length > 0) tempManager.addIcons(iconEntries);
          } catch (e: any) {
            svgSection = `\n\n# SVG Export Error\n${e.message}`;
          }
        }

        let variableMap: Record<string, string> | null = null;
        try {
          const varsData = await figma.getVariables(fileKey);
          variableMap = buildVariableMap(varsData);
        } catch {
          const nodeVarMap = buildVariableMapFromNodes(nodeData.document);
          if (Object.keys(nodeVarMap).length > 0) {
            variableMap = {};
            for (const [id, entry] of Object.entries(nodeVarMap)) {
              variableMap[id] = entry.cssVar;
            }
          }
        }

        const condensed = toCondensedWithBudget(nodeData.document, 80000, variableMap, svgMap, "pixel-perfect");

        let varSection = "";
        const nodeVarMap = buildVariableMapFromNodes(nodeData.document);
        if (Object.keys(nodeVarMap).length > 0) {
          const varLines = Object.entries(nodeVarMap).map(([_id, entry]) => `  ${entry.cssVar}: ${entry.color};`);
          varSection = `\n\n# CSS 变量\n:root {\n${varLines.join("\n")}\n}`;
        }

        tempManager.writeOptimized(fileKey, normalizedId, { summary, condensed, variables: nodeVarMap });
        tempManager.writeCondensed(fileKey, normalizedId, condensed + varSection + svgSection);

        return {
          content: [
            {
              type: "text" as const,
              text: `# ${summary.rootName} (${summary.rootType}) ${summary.rootSize}\n节点总数: ${summary.totalNodes}\n\n# 结构\n${condensed}${varSection}${svgSection}`,
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.registerTool(
    "search_nodes",
    {
      description:
        "按名称、类型搜索文件中的节点，返回匹配节点的 ID、名称、类型和路径。适合在大文件中快速定位特定组件或元素",
      inputSchema: {
        fileKey: z.string().describe("Figma 文件 Key"),
        query: z.string().optional().describe("名称模糊匹配（不区分大小写）"),
        type: z.string().optional().describe("节点类型过滤，如 FRAME, COMPONENT, TEXT, INSTANCE, COMPONENT_SET 等"),
        parentId: z.string().optional().describe("限定搜索范围到某个父节点下"),
        maxResults: z.number().optional().default(20).describe("最大返回数量，默认 20"),
      },
    },
    async ({ fileKey, query, type, parentId, maxResults }) => {
      try {
        if (!query && !type) {
          return { content: [{ type: "text" as const, text: "请至少提供 query（名称搜索）或 type（类型过滤）参数" }] };
        }

        let rootNode: any;

        if (parentId) {
          const normalizedId = parentId.replace(/-/g, ":");
          const data = (await figma.getFileNodes(fileKey, [normalizedId])) as any;
          if (!data) return { content: [{ type: "text" as const, text: "获取节点失败" }] };
          const nodeData = data.nodes[normalizedId];
          if (!nodeData) return { content: [{ type: "text" as const, text: `父节点 ${normalizedId} 不存在` }] };
          rootNode = nodeData.document;
        } else {
          const data = (await figma.getFile(fileKey, {})) as any;
          if (!data) return { content: [{ type: "text" as const, text: "获取文件失败" }] };
          rootNode = data.document;
        }

        const results = searchNodes(rootNode, { query, type, maxResults });

        if (results.length === 0) {
          return { content: [{ type: "text" as const, text: "未找到匹配的节点" }] };
        }

        const output = results
          .map((r, i) => `${i + 1}. [${r.type}] ${r.name} (id: ${r.id})\n   路径: ${r.path}`)
          .join("\n\n");

        return {
          content: [
            {
              type: "text" as const,
              text: `# 搜索结果 (共 ${results.length} 条)\n\n${output}`,
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.registerTool(
    "get_component_variants",
    {
      description:
        "获取 COMPONENT_SET 的所有变体属性和 CSS 差异。用于生成组件 props 接口和状态样式（hover/active/disabled 等）",
      inputSchema: {
        fileKey: z.string().describe("Figma 文件 Key"),
        nodeId: z.string().describe("COMPONENT_SET 的节点 ID"),
      },
    },
    async ({ fileKey, nodeId }) => {
      try {
        const normalizedId = nodeId.replace(/-/g, ":");
        const data = (await figma.getFileNodes(fileKey, [normalizedId])) as any;
        if (!data) return { content: [{ type: "text" as const, text: "获取节点失败" }] };

        const nodeData = data.nodes[normalizedId];
        if (!nodeData) return { content: [{ type: "text" as const, text: `节点 ${normalizedId} 不存在` }] };

        const node = nodeData.document;
        if (node.type !== "COMPONENT_SET") {
          return {
            content: [
              {
                type: "text" as const,
                text: `节点 ${node.name} 类型为 ${node.type}，不是 COMPONENT_SET。请传入组件集的节点 ID`,
              },
            ],
          };
        }

        const properties: Record<string, Set<string>> = {};
        const variants: Array<{ name: string; id: string; props: Record<string, string>; node: any }> = [];

        for (const child of node.children || []) {
          if (child.type !== "COMPONENT") continue;
          const props: Record<string, string> = {};
          const parts = child.name.split(",").map((s: string) => s.trim());
          for (const part of parts) {
            const [key, value] = part.split("=").map((s: string) => s.trim());
            if (key && value) {
              props[key] = value;
              if (!properties[key]) properties[key] = new Set();
              properties[key].add(value);
            }
          }
          variants.push({ name: child.name, id: child.id, props, node: child });
        }

        const output: string[] = [`# ${node.name}`, ``, `## 属性定义`];

        for (const [prop, values] of Object.entries(properties)) {
          output.push(`- **${prop}**: ${[...values].join(" | ")}`);
        }

        output.push(``, `## Variants (${variants.length})`);
        for (const v of variants) {
          const propsStr = Object.entries(v.props)
            .map(([k, val]) => `${k}=${val}`)
            .join(", ");
          output.push(`- ${propsStr} (id: ${v.id})`);
        }

        if (variants.length > 0) {
          output.push(``, `## CSS 差异`);
          const baseCSS = nodeToCSS(variants[0].node);
          output.push(``, `### 基准: ${variants[0].name}`);
          output.push("```css");
          output.push(baseCSS);
          output.push("```");

          const baseLines = new Set(
            baseCSS
              .split("\n")
              .map((l) => l.trim())
              .filter(Boolean)
          );

          for (let i = 1; i < variants.length; i++) {
            const variantCSS = nodeToCSS(variants[i].node);
            const variantLines = variantCSS
              .split("\n")
              .map((l) => l.trim())
              .filter(Boolean);
            const diff = variantLines.filter(
              (l) => !baseLines.has(l) && !l.startsWith("/*") && !l.startsWith(".") && l !== "}"
            );
            if (diff.length > 0) {
              output.push(``, `### 差异: ${variants[i].name}`);
              output.push("```css");
              output.push(diff.join("\n"));
              output.push("```");
            } else {
              output.push(``, `### 差异: ${variants[i].name}`);
              output.push("（与基准相同）");
            }
          }
        }

        return {
          content: [{ type: "text" as const, text: output.join("\n") }],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.registerTool(
    "get_node_css",
    {
      description: "获取节点的精确 CSS 或 Tailwind 样式。当你已理解组件结构，需要具体样式来实现或修正视觉差异时使用",
      inputSchema: {
        fileKey: z.string().describe("Figma 文件 Key"),
        nodeId: z.string().describe("节点 ID"),
        mode: z.enum(["css", "tailwind"]).optional().default("css").describe("输出模式：css 或 tailwind"),
        recursive: z.boolean().optional().default(true).describe("是否递归生成子节点样式，默认 true"),
        depth: z.number().optional().default(8).describe("递归深度，默认 8"),
      },
    },
    async ({ fileKey, nodeId, mode, recursive, depth }) => {
      try {
        const normalizedId = nodeId.replace(/-/g, ":");
        const data = (await figma.getFileNodes(fileKey, [normalizedId])) as any;
        if (!data) return { content: [{ type: "text" as const, text: "获取节点失败" }] };

        const nodeData = data.nodes[normalizedId];
        if (!nodeData) return { content: [{ type: "text" as const, text: `节点 ${normalizedId} 不存在` }] };

        let variableMap: Record<string, string> | null = null;
        try {
          const varsData = await figma.getVariables(fileKey);
          variableMap = buildVariableMap(varsData);
        } catch {
          /* variable map is optional */
        }

        const options = { precision: "pixel-perfect" as const, variableMap };
        let output: string;
        if (mode === "tailwind") {
          output = recursive
            ? nodeToTailwindRecursive(nodeData.document, 0, depth, undefined, options)
            : nodeToTailwind(nodeData.document, undefined, options);
        } else {
          output = recursive
            ? nodeToCSSRecursive(nodeData.document, 0, depth, undefined, options)
            : nodeToCSS(nodeData.document, undefined, options);
        }

        return {
          content: [{ type: "text" as const, text: output }],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.registerTool(
    "export_svg",
    {
      description:
        "导出指定节点为 SVG 格式，下载 SVG 内容并保存到临时目录。适用于导出图标、矢量图形等。对于光栅图片（照片、截图），使用 get_images 配合 png/jpg 格式",
      inputSchema: {
        fileKey: z.string().describe("Figma 文件 Key"),
        nodeIds: z.array(z.string()).describe("要导出的节点 ID 数组"),
      },
    },
    async ({ fileKey, nodeIds }) => {
      try {
        const ids = nodeIds.map((id) => id.replace(/-/g, ":"));
        const nodes = ids.map((id) => ({ id, name: id, role: "export" }));

        try {
          const results = await svgExporter.exportNodes(fileKey, nodes);
          if (results.size === 0) {
            return { content: [{ type: "text" as const, text: "未能导出任何 SVG，请检查节点 ID 是否正确" }] };
          }

          const output = svgExporter.formatExportResults(results);
          const iconEntries: any[] = [];
          for (const [nodeIdKey, svgInfo] of results.entries()) {
            iconEntries.push({
              fileKey,
              nodeId: nodeIdKey,
              name: svgInfo.filename || nodeIdKey,
              svgPath: svgInfo.path || null,
              source: "export_svg",
            });
          }
          if (iconEntries.length > 0) tempManager.addIcons(iconEntries);

          logger.logOptimized("export_svg", { fileKey, nodeIds: ids }, { exportedCount: results.size });
          return { content: [{ type: "text" as const, text: output }] };
        } catch (e: any) {
          return { content: [{ type: "text" as const, text: `SVG 导出失败: ${e.message}` }] };
        }
      } catch (error) {
        return formatError(error);
      }
    }
  );

  registerPrompts(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
} // end of else block (init subcommand check)

process.on("uncaughtException", (err) => {
  process.stderr.write(`[figma-code-context] Uncaught exception: ${err?.message || err}\n`);
});
process.on("unhandledRejection", (err) => {
  process.stderr.write(`[figma-code-context] Unhandled rejection: ${err}\n`);
});
