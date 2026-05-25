import {
  colorToString,
  gradientToCSS,
  fillsToCSS,
  effectsToCSS,
  parseEffects,
  inferSemanticRole,
} from "./transformer.js";

export interface ExtractedText {
  path: string;
  text: string;
  style?: string;
}

function rgbToHex(c: { r: number; g: number; b: number }): string {
  return `${Math.round(c.r * 255)
    .toString(16)
    .padStart(2, "0")}${Math.round(c.g * 255)
    .toString(16)
    .padStart(2, "0")}${Math.round(c.b * 255)
    .toString(16)
    .padStart(2, "0")}`;
}

export function parseFigmaUrl(url: string): { fileKey: string; nodeId?: string } | null {
  try {
    const u = new URL(url);
    const pathMatch = u.pathname.match(/\/(design|file|proto)\/([a-zA-Z0-9]+)/);
    if (!pathMatch) return null;
    const fileKey = pathMatch[2];
    const nodeId = u.searchParams.get("node-id") || undefined;
    return { fileKey, nodeId };
  } catch {
    return null;
  }
}

export function extractAllTexts(
  node: any,
  maxDepth: number = 20,
  path: string = "",
  depth: number = 0
): ExtractedText[] {
  if (!node || depth > maxDepth) return [];
  if (node.visible === false) return [];

  const results: ExtractedText[] = [];
  const currentPath = path ? `${path} > ${node.name}` : node.name;

  if (node.type === "TEXT" && node.characters) {
    const style = node.style;
    let styleStr = "";
    if (style) {
      const parts: string[] = [];
      if (style.fontFamily) parts.push(style.fontFamily);
      if (style.fontSize) parts.push(`${style.fontSize}px`);
      if (style.fontWeight && style.fontWeight !== 400) parts.push(`w${style.fontWeight}`);
      styleStr = parts.join(" ");
    }
    results.push({ path: currentPath, text: node.characters, style: styleStr || undefined });
  }

  if (node.children) {
    for (const child of node.children) {
      results.push(...extractAllTexts(child, maxDepth, currentPath, depth + 1));
    }
  }

  return results;
}

export function formatVariableValues(valuesByMode: Record<string, any>, modes: any[]): Record<string, any> {
  const result: Record<string, any> = {};
  for (const mode of modes) {
    const value = valuesByMode[mode.modeId];
    result[mode.name] = formatValue(value);
  }
  return result;
}

export function formatValue(value: any): string {
  if (!value) return "null";
  if (typeof value === "number" || typeof value === "string" || typeof value === "boolean") return String(value);
  if (value.r !== undefined) {
    return colorToString(value) || "#000000";
  }
  if (value.type === "VARIABLE_ALIAS") {
    return `alias(${value.id})`;
  }
  return JSON.stringify(value);
}

export function extractDesignInfo(
  node: any,
  colors: Set<string>,
  fonts: Set<string>,
  components: { name: string; componentId: string }[]
): void {
  if (!node) return;

  if (node.fills) {
    for (const fill of node.fills) {
      if (fill.visible === false) continue;
      if (fill.type === "SOLID" && fill.color) {
        const c = colorToString(fill.color, fill.opacity);
        if (c) colors.add(c);
      }
    }
  }

  if (node.type === "TEXT" && node.style) {
    if (node.style.fontFamily) fonts.add(node.style.fontFamily);
  }

  if (node.type === "INSTANCE" && node.componentId) {
    components.push({ name: node.name, componentId: node.componentId });
  }

  if (node.children) {
    for (const child of node.children) {
      extractDesignInfo(child, colors, fonts, components);
    }
  }
}

export function toCSSClass(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "element"
  );
}

function appendFlexAlignment(lines: string[], node: any): void {
  const mainMap: Record<string, string> = {
    MIN: "flex-start",
    CENTER: "center",
    MAX: "flex-end",
    SPACE_BETWEEN: "space-between",
    SPACE_AROUND: "space-around",
    SPACE_EVENLY: "space-evenly",
  };
  const crossMap: Record<string, string> = {
    MIN: "flex-start",
    CENTER: "center",
    MAX: "flex-end",
    BASELINE: "baseline",
  };
  if (node.primaryAxisAlignItems && mainMap[node.primaryAxisAlignItems]) {
    lines.push(`justify-content: ${mainMap[node.primaryAxisAlignItems]};`);
  }
  if (node.counterAxisAlignItems && crossMap[node.counterAxisAlignItems]) {
    lines.push(`align-items: ${crossMap[node.counterAxisAlignItems]};`);
  }
}

export function nodeToCSS(node: any, parentBBox?: { x: number; y: number }): string {
  const lines: string[] = [];
  const bbox = node.absoluteBoundingBox;

  // Positioning
  if (node.layoutPositioning === "ABSOLUTE") {
    lines.push(`position: absolute;`);
    if (bbox && parentBBox) {
      lines.push(`left: ${Math.round(bbox.x - parentBBox.x)}px;`);
      lines.push(`top: ${Math.round(bbox.y - parentBBox.y)}px;`);
    } else if (bbox) {
      lines.push(`left: ${Math.round(bbox.x)}px;`);
      lines.push(`top: ${Math.round(bbox.y)}px;`);
    }
  } else if (node.children?.some((c: any) => c.layoutPositioning === "ABSOLUTE")) {
    lines.push(`position: relative;`);
  }

  // Sizing
  if (bbox) {
    if (node.layoutSizingHorizontal === "FILL") {
      lines.push(`flex: 1 0 0;`);
    } else if (node.layoutSizingHorizontal === "HUG") {
      lines.push(`width: fit-content;`);
    } else {
      lines.push(`width: ${Math.round(bbox.width)}px;`);
    }
    if (node.layoutSizingVertical === "FILL") {
      lines.push(`align-self: stretch;`);
    } else if (node.layoutSizingVertical === "HUG") {
      lines.push(`height: fit-content;`);
    } else {
      lines.push(`height: ${Math.round(bbox.height)}px;`);
    }
  }

  // Min/max constraints
  if (node.minWidth) lines.push(`min-width: ${node.minWidth}px;`);
  if (node.maxWidth) lines.push(`max-width: ${node.maxWidth}px;`);
  if (node.minHeight) lines.push(`min-height: ${node.minHeight}px;`);
  if (node.maxHeight) lines.push(`max-height: ${node.maxHeight}px;`);

  // Flex grow
  if (node.layoutGrow && node.layoutGrow > 0) {
    lines.push(`flex-grow: ${node.layoutGrow};`);
  }

  // Layout align (STRETCH)
  if (node.layoutAlign === "STRETCH") {
    lines.push(`align-self: stretch;`);
  }

  const fills = (node.fills || []).filter((f: any) => f.visible !== false);
  if (node.type === "TEXT") {
    const solidFills = fills.filter((f: any) => f.type === "SOLID");
    if (solidFills.length > 0 && solidFills[0].color) {
      const c = solidFills[0].color;
      const a = solidFills[0].opacity;
      const hex = rgbToHex(c);
      if (a !== undefined && a < 1) {
        lines.push(
          `color: rgba(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}, ${Math.round(a * 100) / 100});`
        );
      } else {
        lines.push(`color: #${hex};`);
      }
    }
  } else {
    const fillCSS = fillsToCSS(fills);
    for (const [prop, value] of Object.entries(fillCSS)) {
      lines.push(`${prop}: ${value};`);
    }
  }

  const effectCSS = effectsToCSS(node.effects);
  for (const [prop, value] of Object.entries(effectCSS)) {
    lines.push(`${prop}: ${value};`);
  }

  const strokes = (node.strokes || []).filter((s: any) => s.visible !== false);
  if (strokes.length > 0) {
    const solidStrokes = strokes.filter((s: any) => s.type === "SOLID");
    const gradientStrokes = strokes.filter((s: any) => s.type?.startsWith("GRADIENT_"));

    if (node.individualStrokeWeights) {
      const { top, right, bottom, left } = node.individualStrokeWeights;
      if (solidStrokes.length > 0 && solidStrokes[0].color) {
        lines.push(`border-color: #${rgbToHex(solidStrokes[0].color)};`);
        lines.push(`border-style: solid;`);
        lines.push(`border-width: ${top}px ${right}px ${bottom}px ${left}px;`);
      }
    } else if (solidStrokes.length > 0 && solidStrokes[0].color) {
      const strokeAlign = node.strokeAlign || "CENTER";
      if (strokeAlign === "INSIDE") {
        lines.push(`box-shadow: inset 0 0 0 ${node.strokeWeight || 1}px #${rgbToHex(solidStrokes[0].color)};`);
      } else if (strokeAlign === "OUTSIDE") {
        lines.push(`box-shadow: 0 0 0 ${node.strokeWeight || 1}px #${rgbToHex(solidStrokes[0].color)};`);
      } else {
        lines.push(`border: ${node.strokeWeight || 1}px solid #${rgbToHex(solidStrokes[0].color)};`);
      }
    } else if (gradientStrokes.length > 0) {
      const gradCSS = gradientToCSS(gradientStrokes[0]);
      if (gradCSS) {
        lines.push(`border: ${node.strokeWeight || 1}px solid transparent;`);
        lines.push(`border-image: ${gradCSS} 1;`);
      }
    }
  }

  // Stroke dashes
  if (node.strokeDashes && node.strokeDashes.length > 0) {
    lines.push(`border-style: dashed;`);
  }

  if (node.cornerRadius) {
    lines.push(`border-radius: ${node.cornerRadius}px;`);
  } else if (node.rectangleCornerRadii) {
    const r = node.rectangleCornerRadii;
    lines.push(`border-radius: ${r[0]}px ${r[1]}px ${r[2]}px ${r[3]}px;`);
  }

  if (node.layoutMode === "HORIZONTAL") {
    lines.push(`display: flex;`);
    lines.push(`flex-direction: row;`);
    if (node.itemSpacing) lines.push(`gap: ${node.itemSpacing}px;`);
    if (node.layoutWrap === "WRAP") lines.push(`flex-wrap: wrap;`);
    appendFlexAlignment(lines, node);
  } else if (node.layoutMode === "VERTICAL") {
    lines.push(`display: flex;`);
    lines.push(`flex-direction: column;`);
    if (node.itemSpacing) lines.push(`gap: ${node.itemSpacing}px;`);
    if (node.layoutWrap === "WRAP") lines.push(`flex-wrap: wrap;`);
    appendFlexAlignment(lines, node);
  }

  if (node.paddingTop || node.paddingRight || node.paddingBottom || node.paddingLeft) {
    lines.push(
      `padding: ${node.paddingTop || 0}px ${node.paddingRight || 0}px ${node.paddingBottom || 0}px ${node.paddingLeft || 0}px;`
    );
  }

  // Overflow
  if (node.clipsContent) {
    if (node.overflowDirection === "HORIZONTAL_SCROLLING") {
      lines.push(`overflow-x: auto;`);
      lines.push(`overflow-y: hidden;`);
    } else if (node.overflowDirection === "VERTICAL_SCROLLING") {
      lines.push(`overflow-x: hidden;`);
      lines.push(`overflow-y: auto;`);
    } else if (node.overflowDirection === "HORIZONTAL_AND_VERTICAL_SCROLLING") {
      lines.push(`overflow: auto;`);
    } else {
      lines.push(`overflow: hidden;`);
    }
  }

  // Rotation
  if (node.rotation && Math.abs(node.rotation) > 0.01) {
    lines.push(`transform: rotate(${Math.round(node.rotation)}deg);`);
  }

  // Blend mode
  if (node.blendMode && node.blendMode !== "NORMAL" && node.blendMode !== "PASS_THROUGH") {
    lines.push(`mix-blend-mode: ${node.blendMode.toLowerCase().replace(/_/g, "-")};`);
  }

  // Image scaleMode → object-fit
  const imgFill = (node.fills || []).find((f: any) => f.type === "IMAGE" && f.visible !== false);
  if (imgFill && (imgFill as any).scaleMode) {
    const scaleMap: Record<string, string> = { FILL: "cover", FIT: "contain", CROP: "cover", TILE: "repeat" };
    const fit = scaleMap[(imgFill as any).scaleMode] || "cover";
    if (fit !== "repeat") {
      lines.push(`object-fit: ${fit};`);
    } else {
      lines.push(`background-size: auto;`);
      lines.push(`background-repeat: repeat;`);
    }
  }

  if (node.type === "TEXT" && node.style) {
    const s = node.style;
    if (s.fontFamily) lines.push(`font-family: "${s.fontFamily}";`);
    if (s.fontSize) lines.push(`font-size: ${s.fontSize}px;`);
    if (s.fontWeight) lines.push(`font-weight: ${s.fontWeight};`);
    if (s.lineHeightPx) lines.push(`line-height: ${s.lineHeightPx}px;`);
    if (s.letterSpacing) lines.push(`letter-spacing: ${s.letterSpacing}px;`);
    if (s.textAlignHorizontal) lines.push(`text-align: ${s.textAlignHorizontal.toLowerCase()};`);

    // Text decoration
    if (node.textDecoration === "UNDERLINE") lines.push(`text-decoration: underline;`);
    else if (node.textDecoration === "STRIKETHROUGH") lines.push(`text-decoration: line-through;`);

    // Text transform
    if (node.textCase === "UPPER") lines.push(`text-transform: uppercase;`);
    else if (node.textCase === "LOWER") lines.push(`text-transform: lowercase;`);
    else if (node.textCase === "TITLE") lines.push(`text-transform: capitalize;`);

    // Text truncation
    if (node.textTruncation === "ENDING") {
      lines.push(`overflow: hidden;`);
      lines.push(`text-overflow: ellipsis;`);
      if (node.maxLines && node.maxLines > 1) {
        lines.push(`display: -webkit-box;`);
        lines.push(`-webkit-line-clamp: ${node.maxLines};`);
        lines.push(`-webkit-box-orient: vertical;`);
      } else {
        lines.push(`white-space: nowrap;`);
      }
    }
  }

  if (node.opacity !== undefined && node.opacity !== 1) {
    lines.push(`opacity: ${node.opacity};`);
  }

  return `/* ${node.name} */\n.${toCSSClass(node.name)} {\n  ${lines.join("\n  ")}\n}`;
}

export function nodeToCSSRecursive(
  node: any,
  depth: number = 0,
  maxDepth: number = 8,
  parentBBox?: { x: number; y: number }
): string {
  if (!node || depth > maxDepth) return "";
  if (node.visible === false) return "";

  let output = nodeToCSS(node, parentBBox) + "\n\n";

  const myBBox = node.absoluteBoundingBox;
  if (node.children) {
    for (const child of node.children) {
      if (child.visible === false) continue;
      output += nodeToCSSRecursive(child, depth + 1, maxDepth, myBBox);
    }
  }

  return output;
}

export function nodeToTailwind(node: any, parentBBox?: { x: number; y: number }): string {
  const classes: string[] = [];
  const bbox = node.absoluteBoundingBox;

  // Positioning
  if (node.layoutPositioning === "ABSOLUTE") {
    classes.push("absolute");
    if (bbox && parentBBox) {
      classes.push(`left-[${Math.round(bbox.x - parentBBox.x)}px]`);
      classes.push(`top-[${Math.round(bbox.y - parentBBox.y)}px]`);
    } else if (bbox) {
      classes.push(`left-[${Math.round(bbox.x)}px]`);
      classes.push(`top-[${Math.round(bbox.y)}px]`);
    }
  } else if (node.children?.some((c: any) => c.layoutPositioning === "ABSOLUTE")) {
    classes.push("relative");
  }

  // Sizing
  if (bbox) {
    if (node.layoutSizingHorizontal === "FILL") {
      classes.push("flex-1");
    } else if (node.layoutSizingHorizontal === "HUG") {
      classes.push("w-fit");
    } else {
      classes.push(`w-[${Math.round(bbox.width)}px]`);
    }
    if (node.layoutSizingVertical === "FILL") {
      classes.push("self-stretch");
    } else if (node.layoutSizingVertical === "HUG") {
      classes.push("h-fit");
    } else {
      classes.push(`h-[${Math.round(bbox.height)}px]`);
    }
  }

  // Min/max constraints
  if (node.minWidth) classes.push(`min-w-[${node.minWidth}px]`);
  if (node.maxWidth) classes.push(`max-w-[${node.maxWidth}px]`);
  if (node.minHeight) classes.push(`min-h-[${node.minHeight}px]`);
  if (node.maxHeight) classes.push(`max-h-[${node.maxHeight}px]`);

  // Flex grow
  if (node.layoutGrow && node.layoutGrow > 0) classes.push("grow");

  // Layout align (STRETCH)
  if (node.layoutAlign === "STRETCH") classes.push("self-stretch");

  const fills = (node.fills || []).filter((f: any) => f.visible !== false);
  const solidFills = fills.filter((f: any) => f.type === "SOLID");
  const gradientFills = fills.filter((f: any) => f.type?.startsWith("GRADIENT_"));

  if (gradientFills.length > 0) {
    const g = gradientToCSS(gradientFills[0]);
    if (g) classes.push(`bg-[${g.replace(/\s+/g, "_")}]`);
  } else if (solidFills.length > 0 && solidFills[0].color) {
    classes.push(`bg-[#${rgbToHex(solidFills[0].color)}]`);
  }

  const strokes = (node.strokes || []).filter((s: any) => s.visible !== false && s.type === "SOLID");
  if (strokes.length > 0 && strokes[0].color) {
    if (node.individualStrokeWeights) {
      const { top, right, bottom, left } = node.individualStrokeWeights;
      classes.push(`border-t-[${top}px]`, `border-r-[${right}px]`, `border-b-[${bottom}px]`, `border-l-[${left}px]`);
    } else {
      classes.push(`border-[${node.strokeWeight || 1}px]`);
    }
    classes.push(`border-[#${rgbToHex(strokes[0].color)}]`);
    if (node.strokeDashes && node.strokeDashes.length > 0) classes.push("border-dashed");
  }

  // Layout
  if (node.layoutMode === "HORIZONTAL") {
    classes.push("flex", "flex-row");
    if (node.itemSpacing) classes.push(`gap-[${node.itemSpacing}px]`);
    if (node.layoutWrap === "WRAP") classes.push("flex-wrap");
    appendTailwindAlignment(classes, node);
  } else if (node.layoutMode === "VERTICAL") {
    classes.push("flex", "flex-col");
    if (node.itemSpacing) classes.push(`gap-[${node.itemSpacing}px]`);
    if (node.layoutWrap === "WRAP") classes.push("flex-wrap");
    appendTailwindAlignment(classes, node);
  }

  const efx = parseEffects(node.effects);
  if (efx) {
    for (const effect of efx) {
      if (effect.type === "drop-shadow") {
        classes.push(
          `shadow-[${effect.offset!.x}px_${effect.offset!.y}px_${effect.radius}px_${effect.spread}px_${effect.color}]`
        );
      } else if (effect.type === "inner-shadow") {
        classes.push(
          `shadow-[inset_${effect.offset!.x}px_${effect.offset!.y}px_${effect.radius}px_${effect.spread}px_${effect.color}]`
        );
      } else if (effect.type === "blur") {
        classes.push(`blur-[${effect.radius}px]`);
      } else if (effect.type === "backdrop-blur") {
        classes.push(`backdrop-blur-[${effect.radius}px]`);
      }
    }
  }

  if (node.cornerRadius) {
    classes.push(`rounded-[${node.cornerRadius}px]`);
  } else if (node.rectangleCornerRadii) {
    const r = node.rectangleCornerRadii;
    if (r[0] === r[1] && r[1] === r[2] && r[2] === r[3]) {
      if (r[0] > 0) classes.push(`rounded-[${r[0]}px]`);
    } else {
      classes.push(`rounded-[${r[0]}px_${r[1]}px_${r[2]}px_${r[3]}px]`);
    }
  }

  const pt = node.paddingTop || 0;
  const pb = node.paddingBottom || 0;
  const pl = node.paddingLeft || 0;
  const pr = node.paddingRight || 0;

  if (pt === pb && pl === pr && pt === pl && pt > 0) {
    classes.push(`p-[${pt}px]`);
  } else {
    if (pt === pb && pt > 0) classes.push(`py-[${pt}px]`);
    else {
      if (pt > 0) classes.push(`pt-[${pt}px]`);
      if (pb > 0) classes.push(`pb-[${pb}px]`);
    }
    if (pl === pr && pl > 0) classes.push(`px-[${pl}px]`);
    else {
      if (pl > 0) classes.push(`pl-[${pl}px]`);
      if (pr > 0) classes.push(`pr-[${pr}px]`);
    }
  }

  // Overflow
  if (node.clipsContent) {
    if (node.overflowDirection === "HORIZONTAL_SCROLLING") classes.push("overflow-x-auto", "overflow-y-hidden");
    else if (node.overflowDirection === "VERTICAL_SCROLLING") classes.push("overflow-x-hidden", "overflow-y-auto");
    else if (node.overflowDirection === "HORIZONTAL_AND_VERTICAL_SCROLLING") classes.push("overflow-auto");
    else classes.push("overflow-hidden");
  }

  // Rotation
  if (node.rotation && Math.abs(node.rotation) > 0.01) {
    classes.push(`rotate-[${Math.round(node.rotation)}deg]`);
  }

  // Blend mode
  if (node.blendMode && node.blendMode !== "NORMAL" && node.blendMode !== "PASS_THROUGH") {
    classes.push(`mix-blend-${node.blendMode.toLowerCase().replace(/_/g, "-")}`);
  }

  // Image scaleMode → object-fit
  const imgFillTw = (node.fills || []).find((f: any) => f.type === "IMAGE" && f.visible !== false);
  if (imgFillTw && (imgFillTw as any).scaleMode) {
    const scaleMap: Record<string, string> = { FILL: "cover", FIT: "contain", CROP: "cover", TILE: "repeat" };
    const fit = scaleMap[(imgFillTw as any).scaleMode] || "cover";
    if (fit === "cover") classes.push("object-cover");
    else if (fit === "contain") classes.push("object-contain");
  }

  // Text
  if (node.type === "TEXT" && node.style) {
    const s = node.style;
    if (s.fontFamily) classes.push(`font-['${s.fontFamily.replace(/\s+/g, "_")}']`);
    if (s.fontSize) classes.push(`text-[${s.fontSize}px]`);
    if (s.fontWeight && s.fontWeight !== 400) classes.push(`font-[${s.fontWeight}]`);
    if (s.lineHeightPx) classes.push(`leading-[${s.lineHeightPx}px]`);
    if (s.letterSpacing) classes.push(`tracking-[${s.letterSpacing}px]`);
    if (s.textAlignHorizontal === "CENTER") classes.push("text-center");
    else if (s.textAlignHorizontal === "RIGHT") classes.push("text-right");
    else if (s.textAlignHorizontal === "JUSTIFIED") classes.push("text-justify");

    const textFills = (node.fills || []).filter((f: any) => f.visible !== false && f.type === "SOLID");
    if (textFills.length > 0 && textFills[0].color) {
      classes.push(`text-[#${rgbToHex(textFills[0].color)}]`);
    }

    // Text decoration
    if (node.textDecoration === "UNDERLINE") classes.push("underline");
    else if (node.textDecoration === "STRIKETHROUGH") classes.push("line-through");

    // Text transform
    if (node.textCase === "UPPER") classes.push("uppercase");
    else if (node.textCase === "LOWER") classes.push("lowercase");
    else if (node.textCase === "TITLE") classes.push("capitalize");

    // Text truncation
    if (node.textTruncation === "ENDING") {
      if (node.maxLines && node.maxLines > 1) {
        classes.push(`line-clamp-${node.maxLines}`);
      } else {
        classes.push("truncate");
      }
    }
  }

  if (node.opacity !== undefined && node.opacity !== 1) {
    classes.push(`opacity-[${Math.round(node.opacity * 100) / 100}]`);
  }

  return classes.join(" ");
}

function appendTailwindAlignment(classes: string[], node: any): void {
  const mainMap: Record<string, string> = {
    MIN: "justify-start",
    CENTER: "justify-center",
    MAX: "justify-end",
    SPACE_BETWEEN: "justify-between",
    SPACE_AROUND: "justify-around",
    SPACE_EVENLY: "justify-evenly",
  };
  const crossMap: Record<string, string> = {
    MIN: "items-start",
    CENTER: "items-center",
    MAX: "items-end",
    BASELINE: "items-baseline",
  };
  if (node.primaryAxisAlignItems && mainMap[node.primaryAxisAlignItems]) {
    classes.push(mainMap[node.primaryAxisAlignItems]);
  }
  if (node.counterAxisAlignItems && crossMap[node.counterAxisAlignItems]) {
    classes.push(crossMap[node.counterAxisAlignItems]);
  }
}

export interface SearchResult {
  id: string;
  name: string;
  type: string;
  path: string;
}

export function searchNodes(
  node: any,
  options: { query?: string; type?: string; maxResults?: number },
  path: string = "",
  results: SearchResult[] = []
): SearchResult[] {
  const max = options.maxResults || 20;
  if (!node || results.length >= max) return results;

  const currentPath = path ? `${path} > ${node.name}` : node.name || "";
  const matchesQuery = !options.query || node.name?.toLowerCase().includes(options.query.toLowerCase());
  const matchesType = !options.type || node.type === options.type.toUpperCase();

  if (matchesQuery && matchesType && node.id) {
    results.push({ id: node.id, name: node.name || "", type: node.type || "", path: currentPath });
  }

  if (node.children && results.length < max) {
    for (const child of node.children) {
      searchNodes(child, options, currentPath, results);
      if (results.length >= max) break;
    }
  }

  return results;
}

export function nodeToTailwindRecursive(
  node: any,
  depth: number = 0,
  maxDepth: number = 8,
  parentBBox?: { x: number; y: number }
): string {
  if (!node || depth > maxDepth) return "";
  if (node.visible === false) return "";

  const indent = "  ".repeat(depth);
  const classes = nodeToTailwind(node, parentBBox);
  const semantic = inferSemanticRole(node);
  const tag = semantic?.html || "div";

  let output = `${indent}<${tag} class="${classes}"`;

  if (node.type === "TEXT") {
    output += `>${(node.characters || "").slice(0, 100)}</${tag}>\n`;
    return output;
  }

  if (!node.children || node.children.length === 0) {
    output += ` />\n`;
    return output;
  }

  const myBBox = node.absoluteBoundingBox;
  output += `>\n`;
  for (const child of node.children) {
    if (child.visible === false) continue;
    output += nodeToTailwindRecursive(child, depth + 1, maxDepth, myBBox);
  }
  output += `${indent}</${tag}>\n`;

  return output;
}
