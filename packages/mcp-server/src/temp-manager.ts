import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

export interface IconEntry {
  fileKey: string;
  nodeId: string;
  name: string;
  svgPath: string | null;
  source: string;
  createdAt?: string;
  updatedAt?: string;
}

interface IconsIndex {
  icons: IconEntry[];
}

export function isFigmaDebugEnabled(value: string | undefined = process.env.FIGMA_DEBUG): boolean {
  if (!value) return false;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

export class TempManager {
  tempDir: string;
  logsDir: string;
  svgDir: string;
  rawDir: string;
  optimizedDir: string;
  condensedDir: string;
  iconsDir: string;
  iconsIndexPath: string;
  debugMode: boolean;

  constructor(projectRoot: string = PROJECT_ROOT, debugMode: boolean = isFigmaDebugEnabled()) {
    this.tempDir = path.join(projectRoot, ".figma-temp");
    this.logsDir = path.join(this.tempDir, "logs");
    this.svgDir = path.join(this.tempDir, "svg");
    this.rawDir = path.join(this.tempDir, "raw");
    this.optimizedDir = path.join(this.tempDir, "optimized");
    this.condensedDir = path.join(this.tempDir, "condensed");
    this.iconsDir = path.join(this.tempDir, "icons");
    this.iconsIndexPath = path.join(this.iconsDir, "index.json");
    this.debugMode = debugMode;
  }

  init(): void {
    if (fs.existsSync(this.tempDir)) {
      fs.rmSync(this.tempDir, { recursive: true, force: true });
    }
    this.ensure();
  }

  ensure(): void {
    fs.mkdirSync(this.logsDir, { recursive: true });
    fs.mkdirSync(this.svgDir, { recursive: true });
    fs.mkdirSync(this.rawDir, { recursive: true });
    fs.mkdirSync(this.optimizedDir, { recursive: true });
    fs.mkdirSync(this.condensedDir, { recursive: true });
    fs.mkdirSync(this.iconsDir, { recursive: true });
    if (!fs.existsSync(this.iconsIndexPath)) {
      fs.writeFileSync(this.iconsIndexPath, JSON.stringify({ icons: [] }, null, 2), "utf-8");
    }
  }

  writeSvg(filename: string, content: string): string {
    const filePath = path.join(this.svgDir, filename);
    fs.writeFileSync(filePath, content, "utf-8");
    return filePath;
  }

  writeRaw(fileKey: string, nodeId: string, data: unknown): string | null {
    return this._writeJson(this.rawDir, fileKey, nodeId, data);
  }

  writeOptimized(fileKey: string, nodeId: string, data: unknown): string | null {
    return this._writeJson(this.optimizedDir, fileKey, nodeId, data);
  }

  writeCondensed(fileKey: string, nodeId: string, content: string): string | null {
    const safeNodeId = nodeId.replace(/:/g, "-");
    const filePath = path.join(this.condensedDir, `${fileKey}_${safeNodeId}.txt`);
    fs.writeFileSync(filePath, content, "utf-8");
    return filePath;
  }

  private _writeJson(dir: string, fileKey: string, nodeId: string, data: unknown): string {
    const safeNodeId = nodeId.replace(/:/g, "-");
    const filePath = path.join(dir, `${fileKey}_${safeNodeId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    return filePath;
  }

  addIcon(entry: IconEntry): void {
    this.addIcons([entry]);
  }

  addIcons(entries: IconEntry[]): void {
    const index = this._readIconsIndex();
    for (const entry of entries) {
      const existing = index.icons.findIndex((i) => i.nodeId === entry.nodeId && i.fileKey === entry.fileKey);
      if (existing >= 0) {
        index.icons[existing] = { ...index.icons[existing], ...entry, updatedAt: new Date().toISOString() };
      } else {
        index.icons.push({ ...entry, createdAt: new Date().toISOString() });
      }
    }
    fs.writeFileSync(this.iconsIndexPath, JSON.stringify(index, null, 2), "utf-8");
  }

  getIconsIndex(): IconsIndex {
    return this._readIconsIndex();
  }

  private _readIconsIndex(): IconsIndex {
    try {
      const content = fs.readFileSync(this.iconsIndexPath, "utf-8");
      return JSON.parse(content);
    } catch {
      return { icons: [] };
    }
  }

  writeLog(toolName: string, type: string, data: unknown): string | null {
    if (!this.debugMode) return null;
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `${timestamp}_${toolName}_${type}.json`;
    const filePath = path.join(this.logsDir, filename);
    const content = JSON.stringify(data, null, 2);
    fs.writeFile(filePath, content, "utf-8", () => {});
    return filePath;
  }
}
