import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const BASE_DIR = path.join(os.homedir(), ".figma-code-context");

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
  private baseDir: string;
  private sessionId: string;
  private sessionDir: string;
  svgDir: string;
  private cacheDir: string;
  private logsDir: string;
  iconsIndexPath: string;
  debugMode: boolean;

  constructor(baseDir: string = BASE_DIR, debugMode: boolean = isFigmaDebugEnabled()) {
    this.baseDir = baseDir;
    this.sessionId = Date.now().toString(36);
    this.sessionDir = path.join(baseDir, "sessions", this.sessionId);
    this.svgDir = path.join(this.sessionDir, "svg");
    this.cacheDir = path.join(baseDir, "cache");
    this.logsDir = path.join(baseDir, "logs");
    this.iconsIndexPath = path.join(this.sessionDir, "icons", "index.json");
    this.debugMode = debugMode;
  }

  init(): void {
    fs.mkdirSync(this.sessionDir, { recursive: true });
    fs.mkdirSync(this.svgDir, { recursive: true });
    fs.mkdirSync(path.join(this.sessionDir, "icons"), { recursive: true });
    fs.mkdirSync(this.cacheDir, { recursive: true });
    fs.mkdirSync(this.logsDir, { recursive: true });
    if (!fs.existsSync(this.iconsIndexPath)) {
      fs.writeFileSync(this.iconsIndexPath, JSON.stringify({ icons: [] }, null, 2), "utf-8");
    }
    this._cleanOldSessions(24 * 60 * 60 * 1000);
  }

  private _cleanOldSessions(maxAge: number): void {
    try {
      const sessionsDir = path.join(this.baseDir, "sessions");
      const entries = fs.readdirSync(sessionsDir, { withFileTypes: true });
      const now = Date.now();
      for (const entry of entries) {
        if (!entry.isDirectory() || entry.name === this.sessionId) continue;
        const sessionPath = path.join(sessionsDir, entry.name);
        try {
          const stat = fs.statSync(sessionPath);
          if (now - stat.mtimeMs > maxAge) {
            fs.rmSync(sessionPath, { recursive: true, force: true });
          }
        } catch {
          // skip inaccessible sessions
        }
      }
    } catch {
      // sessions dir may not exist yet
    }
  }

  writeSvg(filename: string, content: string): string | null {
    try {
      fs.mkdirSync(this.svgDir, { recursive: true });
      const filePath = path.join(this.svgDir, filename);
      fs.writeFileSync(filePath, content, "utf-8");
      return filePath;
    } catch {
      return null;
    }
  }

  writeRaw(fileKey: string, nodeId: string, data: unknown): string | null {
    return this._writeJson("raw", fileKey, nodeId, data);
  }

  writeOptimized(fileKey: string, nodeId: string, data: unknown): string | null {
    return this._writeJson("optimized", fileKey, nodeId, data);
  }

  writeCondensed(fileKey: string, nodeId: string, content: string): string | null {
    try {
      const dir = path.join(this.cacheDir, fileKey, "condensed");
      fs.mkdirSync(dir, { recursive: true });
      const safeNodeId = nodeId.replace(/:/g, "-");
      const filePath = path.join(dir, `${safeNodeId}.txt`);
      fs.writeFileSync(filePath, content, "utf-8");
      return filePath;
    } catch {
      return null;
    }
  }

  private _writeJson(subdir: string, fileKey: string, nodeId: string, data: unknown): string | null {
    try {
      const dir = path.join(this.cacheDir, fileKey, subdir);
      fs.mkdirSync(dir, { recursive: true });
      const safeNodeId = nodeId.replace(/:/g, "-");
      const filePath = path.join(dir, `${safeNodeId}.json`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
      return filePath;
    } catch {
      return null;
    }
  }

  addIcon(entry: IconEntry): void {
    this.addIcons([entry]);
  }

  addIcons(entries: IconEntry[]): void {
    try {
      const index = this._readIconsIndex();
      for (const entry of entries) {
        const existing = index.icons.findIndex((i) => i.nodeId === entry.nodeId && i.fileKey === entry.fileKey);
        if (existing >= 0) {
          index.icons[existing] = { ...index.icons[existing], ...entry, updatedAt: new Date().toISOString() };
        } else {
          index.icons.push({ ...entry, createdAt: new Date().toISOString() });
        }
      }
      fs.mkdirSync(path.dirname(this.iconsIndexPath), { recursive: true });
      fs.writeFileSync(this.iconsIndexPath, JSON.stringify(index, null, 2), "utf-8");
    } catch {
      // icon index write failure is non-fatal
    }
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
    try {
      fs.mkdirSync(this.logsDir, { recursive: true });
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `${timestamp}_${toolName}_${type}.json`;
      const filePath = path.join(this.logsDir, filename);
      const content = JSON.stringify(data, null, 2);
      fs.writeFile(filePath, content, "utf-8", () => {});
      return filePath;
    } catch {
      return null;
    }
  }
}
