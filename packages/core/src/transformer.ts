export interface FigmaColor {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export interface FigmaFill {
  type: string;
  visible?: boolean;
  color?: FigmaColor;
  opacity?: number;
  gradientStops?: FigmaGradientStop[];
  gradientHandlePositions?: FigmaPosition[];
  boundVariables?: Record<string, any>;
}

export interface FigmaGradientStop {
  color?: FigmaColor;
  position: number;
  boundVariables?: Record<string, any>;
}

export interface FigmaPosition {
  x: number;
  y: number;
}

export interface FigmaEffect {
  type: string;
  visible?: boolean;
  color?: FigmaColor;
  offset?: { x: number; y: number };
  radius?: number;
  spread?: number;
  boundVariables?: Record<string, any>;
}

export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  visible?: boolean;
  children?: FigmaNode[];
  fills?: FigmaFill[];
  strokes?: FigmaFill[];
  effects?: FigmaEffect[];
  absoluteBoundingBox?: { x: number; y: number; width: number; height: number };
  cornerRadius?: number;
  rectangleCornerRadii?: number[];
  layoutMode?: string;
  itemSpacing?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  primaryAxisAlignItems?: string;
  counterAxisAlignItems?: string;
  layoutWrap?: string;
  primaryAxisSizingMode?: string;
  counterAxisSizingMode?: string;
  opacity?: number;
  characters?: string;
  style?: Record<string, any>;
  componentId?: string;
  description?: string;
  boundVariables?: Record<string, any>;
  constraints?: { horizontal: string; vertical: string };
  strokeWeight?: number;
  [key: string]: any;
}

export interface SemanticRole {
  role: string;
  html: string;
}

export interface CondensedSvgRef {
  filename?: string;
  path?: string;
  href?: string;
}

export type CondensedSvgMap = Record<string, CondensedSvgRef | undefined>;

type InferredLayoutMode = "row" | "col" | "grid";

interface InferredLayout {
  mode: InferredLayoutMode;
  confidence: "high" | "medium";
  source: "bounds";
  gap?: number;
}

interface SimplifiedNode {
  id: string;
  name: string;
  type: string;
  role?: string;
  htmlTag?: string;
  bounds?: { x: number; y: number; w: number; h: number };
  fill?: string | null;
  gradient?: any[];
  effects?: ParsedEffect[] | null;
  stroke?: any;
  cornerRadius?: number | number[];
  layout?: any;
  inferredLayout?: InferredLayout;
  sizing?: { h?: string; v?: string };
  position?: "absolute";
  positionOffset?: { x: number; y: number };
  flexGrow?: number;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  overflow?: string;
  rotation?: number;
  blendMode?: string;
  textTruncation?: string;
  maxLines?: number;
  textDecoration?: string;
  textCase?: string;
  strokeAlign?: string;
  individualStrokes?: { top: number; right: number; bottom: number; left: number };
  strokeDashes?: number[];
  imageRef?: string;
  cornerSmoothing?: number;
  text?: string;
  textStyle?: Record<string, any>;
  componentId?: string;
  isComponent?: boolean;
  description?: string;
  tokens?: Record<string, any>;
  opacity?: number;
  constraints?: { h: string; v: string };
  responsiveHint?: string;
  children?: SimplifiedNode[];
}

interface ParsedEffect {
  type: string;
  color?: string | null;
  offset?: { x: number; y: number };
  radius: number;
  spread?: number;
}

interface NamePattern {
  pattern: RegExp;
  role: string;
  html: string;
}

const SKIP_TYPES = new Set(["BOOLEAN_OPERATION", "SLICE", "VECTOR", "STAR", "LINE", "REGULAR_POLYGON"]);
const ICON_CONTAINER_TYPES = new Set(["FRAME", "COMPONENT", "INSTANCE"]);
const ICON_NAME_PATTERN =
  /^(icon.*|ico(\b|[/_\-\s]|$)|icons?(\b|[/_\-\s]|$)|basics(\b|[/_\-\s]|$)|module(\b|[/_\-\s]|$)|(arrow|chevron|caret)(\b|[/_\-\s]|$)|(edit|calendar|time|user|help|error|close|search|plus|minus|check)(\b|[/_\-\s]|$)|用户[-_\s]?\d*)|(^|[/_.\-\s])icon($|[/_.\-\s])|图标/i;
const COMMON_ICON_SIZES = [4, 8, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 40, 44, 48, 64];
const ICON_SIZE_TOLERANCE = 1;
const MAX_ICON_DIMENSION = 96;

const NAME_PATTERNS: NamePattern[] = [
  { pattern: /^(top.?)?nav(bar|igation)?|header/i, role: "HEADER", html: "header" },
  { pattern: /^footer/i, role: "FOOTER", html: "footer" },
  { pattern: /^side.?bar|drawer/i, role: "SIDEBAR", html: "aside" },
  { pattern: /^nav|menu|tabs/i, role: "NAV", html: "nav" },
  { pattern: /^card|tile/i, role: "CARD", html: "article" },
  { pattern: /^(btn|button|cta)/i, role: "BUTTON", html: "button" },
  { pattern: /^(input|text.?field|search.?bar)/i, role: "INPUT", html: "input" },
  { pattern: /^(modal|dialog|popup|overlay)/i, role: "DIALOG", html: "dialog" },
  { pattern: /^(avatar|profile.?pic)/i, role: "AVATAR", html: "img" },
  { pattern: /^(badge|tag|chip|pill)/i, role: "BADGE", html: "span" },
  { pattern: /^(icon.*|ico\b)/i, role: "ICON", html: "svg" },
  { pattern: /^(img|image|photo|thumbnail|banner|hero.?image)/i, role: "IMG", html: "img" },
  { pattern: /^(list|items)/i, role: "LIST", html: "ul" },
  { pattern: /^(form)/i, role: "FORM", html: "form" },
  { pattern: /^(section|block|container|wrapper)/i, role: "SECTION", html: "section" },
  { pattern: /^(divider|separator|hr)/i, role: "DIVIDER", html: "hr" },
  { pattern: /^(link|anchor)/i, role: "LINK", html: "a" },
  { pattern: /^(table|grid|data.?table)/i, role: "TABLE", html: "table" },
  { pattern: /^(dropdown|select|combobox)/i, role: "SELECT", html: "select" },
  { pattern: /^(checkbox|check)/i, role: "CHECKBOX", html: "input" },
  { pattern: /^(radio)/i, role: "RADIO", html: "input" },
  { pattern: /^(toggle|switch)/i, role: "TOGGLE", html: "input" },
  { pattern: /^(tooltip|popover)/i, role: "TOOLTIP", html: "div" },
  { pattern: /^(breadcrumb)/i, role: "BREADCRUMB", html: "nav" },
  { pattern: /^(pagination|pager)/i, role: "PAGINATION", html: "nav" },
  { pattern: /^(progress|loading|spinner)/i, role: "PROGRESS", html: "div" },
  { pattern: /^(alert|notification|toast|snackbar)/i, role: "ALERT", html: "div" },
];

export function inferSemanticRole(node: FigmaNode): SemanticRole | null {
  if (!node) return null;

  for (const { pattern, role, html } of NAME_PATTERNS) {
    if (pattern.test(node.name)) {
      return { role, html };
    }
  }

  if (node.type === "TEXT") return { role: "TEXT", html: "span" };
  if (node.type === "IMAGE" || hasImageFill(node)) return { role: "IMG", html: "img" };

  if (node.children && node.children.length > 0) {
    const structural = inferFromStructure(node);
    if (structural) return structural;
  }

  if (node.type === "INSTANCE" && node.name) {
    for (const { pattern, role, html } of NAME_PATTERNS) {
      if (pattern.test(node.name)) {
        return { role, html };
      }
    }
    return { role: node.name.toUpperCase().replace(/[^A-Z0-9]/g, "_"), html: "div" };
  }

  if (node.type === "COMPONENT" || node.type === "COMPONENT_SET") {
    return { role: "COMPONENT", html: "div" };
  }

  return null;
}

function hasImageFill(node: FigmaNode): boolean {
  return (node.fills || []).some((f) => f.type === "IMAGE" && f.visible !== false);
}

function inferFromStructure(node: FigmaNode): SemanticRole | null {
  const children = node.children || [];
  if (children.length === 0) return null;

  const bbox = node.absoluteBoundingBox;
  const hasText = children.some((c) => c.type === "TEXT");
  const hasImage = children.some((c) => c.type === "IMAGE" || hasImageFill(c));
  const isHorizontal = node.layoutMode === "HORIZONTAL";
  const isVertical = node.layoutMode === "VERTICAL";

  if (bbox && bbox.width < 300 && bbox.height < 64 && node.cornerRadius && hasText) {
    const fills = (node.fills || []).filter((f) => f.visible !== false && f.type === "SOLID");
    if (fills.length > 0) {
      return { role: "BUTTON", html: "button" };
    }
  }

  if (hasImage && hasText && (isHorizontal || isVertical)) {
    return { role: "CARD", html: "article" };
  }

  if (bbox && bbox.width > 900 && bbox.y < 100 && isHorizontal) {
    return { role: "HEADER", html: "header" };
  }

  if (bbox && bbox.width > 900 && bbox.y > 700 && isHorizontal) {
    return { role: "FOOTER", html: "footer" };
  }

  return null;
}

export function simplifyNode(node: FigmaNode, depth: number = 0, maxDepth: number = 10): SimplifiedNode | null {
  if (depth > maxDepth) return null;
  if (!node) return null;
  if (SKIP_TYPES.has(node.type) && depth > 2) return null;
  if (node.visible === false) return null;

  const result: SimplifiedNode = {
    id: node.id,
    name: node.name,
    type: node.type,
  };

  const semantic = inferSemanticRole(node);
  if (semantic) {
    result.role = semantic.role;
    result.htmlTag = semantic.html;
  }

  const bbox = node.absoluteBoundingBox;
  if (bbox) {
    result.bounds = {
      x: Math.round(bbox.x),
      y: Math.round(bbox.y),
      w: Math.round(bbox.width),
      h: Math.round(bbox.height),
    };
  }

  const fills = (node.fills || []).filter((f) => f.visible !== false);
  if (fills.length > 0) {
    const solidFill = fills.find((f) => f.type === "SOLID");
    if (solidFill && solidFill.color) {
      result.fill = colorToString(solidFill.color, solidFill.opacity);
    }
    const gradients = fills.filter((f) => f.type?.startsWith("GRADIENT_"));
    if (gradients.length > 0) {
      result.gradient = gradients.map((g) => ({
        type: g.type,
        css: gradientToCSS(g),
      }));
    }
  }

  if (node.effects && node.effects.length > 0) {
    result.effects = parseEffects(node.effects);
  }

  const strokes = (node.strokes || []).filter((f: FigmaFill) => f.visible !== false);
  if (strokes.length > 0 && node.strokeWeight) {
    const solidStroke = strokes.find((s: FigmaFill) => s.type === "SOLID");
    if (solidStroke && solidStroke.color) {
      result.stroke = {
        color: colorToString(solidStroke.color, solidStroke.opacity),
        weight: node.strokeWeight,
      };
    }
  }

  if (node.strokeAlign && node.strokeAlign !== "CENTER") {
    result.strokeAlign = node.strokeAlign;
  }
  if (node.individualStrokeWeights) {
    const { top, right, bottom, left } = node.individualStrokeWeights;
    if (top !== right || right !== bottom || bottom !== left) {
      result.individualStrokes = { top, right, bottom, left };
    }
  }
  if (node.strokeDashes && node.strokeDashes.length > 0) {
    result.strokeDashes = node.strokeDashes;
  }

  if (node.cornerRadius) {
    result.cornerRadius = node.rectangleCornerRadii || node.cornerRadius;
  }
  if (node.cornerSmoothing && node.cornerSmoothing > 0) {
    result.cornerSmoothing = node.cornerSmoothing;
  }

  if (node.layoutMode && node.layoutMode !== "NONE") {
    result.layout = {
      mode: node.layoutMode === "HORIZONTAL" ? "row" : "col",
      gap: node.itemSpacing || 0,
      padding: compactPadding(node),
      align: mapAlign(node.primaryAxisAlignItems),
      crossAlign: mapAlign(node.counterAxisAlignItems),
    };
    if (node.layoutWrap === "WRAP") result.layout.wrap = true;
    if (node.primaryAxisSizingMode === "FIXED") result.layout.mainFixed = true;
    if (node.counterAxisSizingMode === "FIXED") result.layout.crossFixed = true;
  }

  const inferredLayout = inferLayoutFromChildBounds(node);
  if (inferredLayout) {
    result.inferredLayout = inferredLayout;
  }

  // Sizing mode (FILL/HUG/FIXED)
  if (node.layoutSizingHorizontal && node.layoutSizingHorizontal !== "FIXED") {
    if (!result.sizing) result.sizing = {};
    result.sizing.h = node.layoutSizingHorizontal;
  }
  if (node.layoutSizingVertical && node.layoutSizingVertical !== "FIXED") {
    if (!result.sizing) result.sizing = {};
    result.sizing.v = node.layoutSizingVertical;
  }

  // Absolute positioning
  if (node.layoutPositioning === "ABSOLUTE") {
    result.position = "absolute";
    if (bbox) {
      const parentBbox = node.absoluteRenderBounds || bbox;
      result.positionOffset = { x: Math.round(bbox.x), y: Math.round(bbox.y) };
    }
  }

  // Flex grow
  if (node.layoutGrow && node.layoutGrow > 0) {
    result.flexGrow = node.layoutGrow;
  }

  // Min/max constraints
  if (node.minWidth) result.minWidth = node.minWidth;
  if (node.maxWidth) result.maxWidth = node.maxWidth;
  if (node.minHeight) result.minHeight = node.minHeight;
  if (node.maxHeight) result.maxHeight = node.maxHeight;

  // Overflow
  if (node.clipsContent) {
    if (node.overflowDirection && node.overflowDirection !== "NONE") {
      const dirMap: Record<string, string> = {
        HORIZONTAL_SCROLLING: "auto-x",
        VERTICAL_SCROLLING: "auto-y",
        HORIZONTAL_AND_VERTICAL_SCROLLING: "auto",
      };
      result.overflow = dirMap[node.overflowDirection] || "hidden";
    } else {
      result.overflow = "hidden";
    }
  }

  // Rotation
  if (node.rotation && Math.abs(node.rotation) > 0.01) {
    result.rotation = Math.round(node.rotation * 100) / 100;
  }

  // Blend mode
  if (node.blendMode && node.blendMode !== "NORMAL" && node.blendMode !== "PASS_THROUGH") {
    result.blendMode = node.blendMode;
  }

  // Image reference
  const imageFill = (node.fills || []).find((f) => f.type === "IMAGE" && f.visible !== false);
  if (imageFill && (imageFill as any).imageRef) {
    result.imageRef = (imageFill as any).imageRef;
  }

  if (node.type === "TEXT") {
    result.text = (node.characters || "").slice(0, 200);
    const style = node.style || {};
    result.textStyle = {};
    if (style.fontFamily) result.textStyle.font = style.fontFamily;
    if (style.fontSize) result.textStyle.size = style.fontSize;
    if (style.fontWeight) result.textStyle.weight = style.fontWeight;
    if (style.lineHeightPx) result.textStyle.lineHeight = Math.round(style.lineHeightPx * 10) / 10;
    if (style.letterSpacing) result.textStyle.letterSpacing = style.letterSpacing;
    if (style.textAlignHorizontal) result.textStyle.align = style.textAlignHorizontal.toLowerCase();

    const textFills = (node.fills || []).filter((f) => f.visible !== false && f.type === "SOLID");
    if (textFills.length > 0) {
      result.textStyle.color = colorToString(textFills[0].color!, textFills[0].opacity);
    }

    if (node.textTruncation === "ENDING") {
      result.textTruncation = "ellipsis";
    }
    if (node.maxLines && node.maxLines > 0) {
      result.maxLines = node.maxLines;
    }
    if (node.textDecoration && node.textDecoration !== "NONE") {
      result.textDecoration = node.textDecoration.toLowerCase();
    }
    if (node.textCase && node.textCase !== "ORIGINAL") {
      result.textCase = node.textCase.toLowerCase();
    }

    if (Object.keys(result.textStyle).length === 0) delete result.textStyle;
  }

  if (node.type === "INSTANCE" && node.componentId) {
    result.componentId = node.componentId;
  }
  if (node.type === "COMPONENT" || node.type === "COMPONENT_SET") {
    result.isComponent = true;
    if (node.description) result.description = node.description;
  }

  if (node.boundVariables) {
    const tokens: Record<string, any> = {};
    for (const [prop, binding] of Object.entries(node.boundVariables)) {
      if (binding && binding.id) {
        tokens[prop] = binding.id;
      } else if (Array.isArray(binding)) {
        tokens[prop] = binding.map((b: any) => b.id).filter(Boolean);
      }
    }
    if (Object.keys(tokens).length > 0) {
      result.tokens = tokens;
    }
  }

  if (node.opacity !== undefined && node.opacity !== 1) {
    result.opacity = Math.round(node.opacity * 100) / 100;
  }

  if (node.constraints) {
    const { horizontal, vertical } = node.constraints;
    if (horizontal !== "LEFT" || vertical !== "TOP") {
      result.constraints = { h: horizontal, v: vertical };
    }
    const hint = inferResponsiveHint(node);
    if (hint) result.responsiveHint = hint;
  }

  if (node.children && node.children.length > 0) {
    const children = node.children
      .map((child) => simplifyNode(child, depth + 1, maxDepth))
      .filter(Boolean) as SimplifiedNode[];
    if (children.length > 0) {
      result.children = children;
    }
  }

  return result;
}

export function buildComponentMap(
  node: FigmaNode,
  map: Record<string, { name: string; description: string | null }> = {}
): Record<string, { name: string; description: string | null }> {
  if (node.type === "COMPONENT") {
    map[node.id] = {
      name: node.name,
      description: node.description || null,
    };
  }
  if (node.children) {
    for (const child of node.children) {
      buildComponentMap(child, map);
    }
  }
  return map;
}

export function generateSummary(tree: SimplifiedNode | null): any {
  if (!tree) return null;

  const stats = { total: 0, types: {} as Record<string, number>, texts: [] as string[], components: [] as string[] };
  walkTree(tree, stats);

  return {
    rootName: tree.name,
    rootType: tree.type,
    rootSize: tree.bounds ? `${tree.bounds.w}x${tree.bounds.h}` : null,
    totalNodes: stats.total,
    nodeTypes: stats.types,
    textContents: stats.texts.slice(0, 20),
    componentInstances: stats.components.slice(0, 20),
  };
}

export function toCondensedWithBudget(
  node: FigmaNode,
  maxTokens: number = 4000,
  variableMap: Record<string, string> | null = null,
  svgMap: CondensedSvgMap | null = null
): string {
  const maxChars = maxTokens * 4;

  const full = toCondensedFormat(node, 0, 15, variableMap, svgMap);
  if (full.length <= maxChars) return full;

  for (let depth = 10; depth >= 2; depth--) {
    const result = toCondensedFormat(node, 0, depth, variableMap, svgMap);
    if (result.length <= maxChars) {
      return result + `\n  ... (已截断，深度限制: ${depth}，完整节点树更深)`;
    }
  }

  return toCondensedFormat(node, 0, 2, variableMap, svgMap) + `\n  ... (节点树过大，仅展示前 2 层)`;
}

export function toCondensedFormat(
  node: FigmaNode,
  depth: number = 0,
  maxDepth: number = 10,
  variableMap: Record<string, string> | null = null,
  svgMap: CondensedSvgMap | null = null
): string {
  if (depth > maxDepth) return "";
  if (!node) return "";
  if (SKIP_TYPES.has(node.type) && depth > 2) return "";
  if (node.visible === false) return "";

  const lines: string[] = [];
  lines.push(toCondensedLine(node, depth, variableMap, svgMap));

  if (node.children) {
    for (const child of node.children) {
      const childOutput = toCondensedFormat(child, depth + 1, maxDepth, variableMap, svgMap);
      if (childOutput) lines.push(childOutput);
    }
  }

  return lines.join("\n");
}

export function colorToString(color: FigmaColor | undefined, opacity?: number): string | null {
  if (!color) return null;
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  const a = opacity !== undefined ? opacity : color.a !== undefined ? color.a : 1;

  if (a < 1) {
    return `rgba(${r}, ${g}, ${b}, ${Math.round(a * 100) / 100})`;
  }
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function colorToHex(color: FigmaColor | undefined): string {
  if (!color) return "#000000";
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export function gradientToCSS(fill: FigmaFill): string | null {
  if (!fill || !fill.gradientStops) return null;

  const fillOpacity = fill.opacity !== undefined ? fill.opacity : 1;

  const stops = fill.gradientStops
    .map((stop) => {
      const stopAlpha = (stop.color?.a !== undefined ? stop.color.a : 1) * fillOpacity;
      const color = colorToString(stop.color, stopAlpha);
      const position = Math.round(stop.position * 1000) / 10;
      return `${color} ${position}%`;
    })
    .join(", ");

  if (fill.type === "GRADIENT_LINEAR") {
    const angle = calcGradientAngle(fill.gradientHandlePositions);
    return `linear-gradient(${angle}deg, ${stops})`;
  } else if (fill.type === "GRADIENT_RADIAL") {
    const { rx, ry, cx, cy } = calcRadialGradientParams(fill.gradientHandlePositions);
    return `radial-gradient(${rx}% ${ry}% at ${cx}% ${cy}%, ${stops})`;
  } else if (fill.type === "GRADIENT_ANGULAR") {
    return `conic-gradient(${stops})`;
  } else if (fill.type === "GRADIENT_DIAMOND") {
    const { rx, ry, cx, cy } = calcRadialGradientParams(fill.gradientHandlePositions);
    return `radial-gradient(${rx}% ${ry}% at ${cx}% ${cy}%, ${stops})`;
  }
  return null;
}

function calcRadialGradientParams(positions: FigmaPosition[] | undefined): {
  rx: number;
  ry: number;
  cx: number;
  cy: number;
} {
  if (!positions || positions.length < 3) {
    return { rx: 50, ry: 50, cx: 50, cy: 50 };
  }
  const center = positions[0];
  const p1 = positions[1];
  const p2 = positions[2];

  const ry = Math.sqrt((p1.x - center.x) ** 2 + (p1.y - center.y) ** 2) * 100;
  const rx = Math.sqrt((p2.x - center.x) ** 2 + (p2.y - center.y) ** 2) * 100;

  const cx = Math.round(center.x * 100 * 100) / 100;
  const cy = Math.round(center.y * 100 * 100) / 100;

  return {
    rx: Math.round(rx * 100) / 100,
    ry: Math.round(ry * 100) / 100,
    cx,
    cy,
  };
}

function calcGradientAngle(positions: FigmaPosition[] | undefined): number {
  if (!positions || positions.length < 2) return 180;
  const start = positions[0];
  const end = positions[1];
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const angle = Math.round(Math.atan2(dx, -dy) * (180 / Math.PI));
  return ((angle % 360) + 360) % 360;
}

export function parseEffects(effects: FigmaEffect[] | undefined): ParsedEffect[] | null {
  if (!effects || effects.length === 0) return null;

  const result: ParsedEffect[] = [];
  for (const effect of effects) {
    if (effect.visible === false) continue;

    if (effect.type === "DROP_SHADOW" || effect.type === "INNER_SHADOW") {
      result.push({
        type: effect.type === "DROP_SHADOW" ? "drop-shadow" : "inner-shadow",
        color: colorToString(effect.color, effect.color?.a),
        offset: { x: effect.offset?.x || 0, y: effect.offset?.y || 0 },
        radius: effect.radius || 0,
        spread: effect.spread || 0,
      });
    } else if (effect.type === "LAYER_BLUR") {
      result.push({
        type: "blur",
        radius: effect.radius || 0,
      });
    } else if (effect.type === "BACKGROUND_BLUR") {
      result.push({
        type: "backdrop-blur",
        radius: effect.radius || 0,
      });
    }
  }
  return result.length > 0 ? result : null;
}

export function effectsToCSS(effects: FigmaEffect[] | undefined): Record<string, string> {
  const css: Record<string, string> = {};
  const parsed = parseEffects(effects);
  if (!parsed) return css;

  const shadows: string[] = [];
  for (const e of parsed) {
    if (e.type === "drop-shadow") {
      shadows.push(`${e.offset!.x}px ${e.offset!.y}px ${e.radius}px ${e.spread || 0}px ${e.color}`);
    } else if (e.type === "inner-shadow") {
      shadows.push(`inset ${e.offset!.x}px ${e.offset!.y}px ${e.radius}px ${e.spread || 0}px ${e.color}`);
    } else if (e.type === "blur") {
      css["filter"] = `blur(${e.radius}px)`;
    } else if (e.type === "backdrop-blur") {
      css["backdrop-filter"] = `blur(${e.radius}px)`;
    }
  }
  if (shadows.length > 0) {
    css["box-shadow"] = shadows.join(", ");
  }
  return css;
}

export function fillsToCSS(fills: FigmaFill[] | undefined): Record<string, string> {
  const css: Record<string, string> = {};
  if (!fills || fills.length === 0) return css;

  const visibleFills = fills.filter((f) => f.visible !== false);
  if (visibleFills.length === 0) return css;

  const backgrounds: string[] = [];
  for (const fill of visibleFills) {
    if (fill.type === "SOLID" && fill.color) {
      const color = colorToString(fill.color, fill.opacity);
      if (color) backgrounds.push(color);
    } else if (fill.type?.startsWith("GRADIENT_")) {
      const g = gradientToCSS(fill);
      if (g) {
        backgrounds.push(g);
      }
    }
  }

  if (backgrounds.length === 1) {
    css["background"] = backgrounds[0];
  } else if (backgrounds.length > 1) {
    css["background"] = backgrounds.join(", ");
  }

  return css;
}

function compactPadding(node: FigmaNode): string | number {
  const t = node.paddingTop || 0;
  const r = node.paddingRight || 0;
  const b = node.paddingBottom || 0;
  const l = node.paddingLeft || 0;

  if (t === r && r === b && b === l) return t;
  if (t === b && l === r) return `${t} ${r}`;
  return `${t} ${r} ${b} ${l}`;
}

function boundsOf(node: FigmaNode): { x: number; y: number; w: number; h: number; cx: number; cy: number } | null {
  const box = node.absoluteBoundingBox;
  if (!box || box.width <= 0 || box.height <= 0) return null;
  return {
    x: box.x,
    y: box.y,
    w: box.width,
    h: box.height,
    cx: box.x + box.width / 2,
    cy: box.y + box.height / 2,
  };
}

function averageGap(
  boxes: { x: number; y: number; w: number; h: number; cx: number; cy: number }[],
  axis: "x" | "y"
): number | undefined {
  if (boxes.length < 2) return undefined;
  const sorted = [...boxes].sort((a, b) => a[axis] - b[axis]);
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const previousEnd = axis === "x" ? sorted[i - 1].x + sorted[i - 1].w : sorted[i - 1].y + sorted[i - 1].h;
    const currentStart = sorted[i][axis];
    const gap = currentStart - previousEnd;
    if (gap >= 0) gaps.push(gap);
  }
  if (gaps.length === 0) return undefined;
  return Math.round(gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length);
}

function inferLayoutFromChildBounds(node: FigmaNode): InferredLayout | null {
  if (node.layoutMode && node.layoutMode !== "NONE") return null;
  if (!node.children || node.children.length < 2) return null;

  const boxes = node.children
    .filter((child) => child.visible !== false)
    .map(boundsOf)
    .filter(Boolean) as { x: number; y: number; w: number; h: number; cx: number; cy: number }[];

  if (boxes.length < 2) return null;

  const xRange = Math.max(...boxes.map((box) => box.cx)) - Math.min(...boxes.map((box) => box.cx));
  const yRange = Math.max(...boxes.map((box) => box.cy)) - Math.min(...boxes.map((box) => box.cy));
  const avgWidth = boxes.reduce((sum, box) => sum + box.w, 0) / boxes.length;
  const avgHeight = boxes.reduce((sum, box) => sum + box.h, 0) / boxes.length;
  const rowLike = xRange > avgWidth * 0.8 && yRange <= avgHeight * 0.75;
  const colLike = yRange > avgHeight * 0.8 && xRange <= avgWidth * 0.75;

  if (rowLike) {
    return { mode: "row", confidence: "high", source: "bounds", gap: averageGap(boxes, "x") };
  }

  if (colLike) {
    return { mode: "col", confidence: "high", source: "bounds", gap: averageGap(boxes, "y") };
  }

  if (xRange > avgWidth * 0.8 && yRange > avgHeight * 0.8 && boxes.length >= 4) {
    return { mode: "grid", confidence: "medium", source: "bounds" };
  }

  return null;
}

function mapAlign(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const map: Record<string, string> = {
    MIN: "start",
    CENTER: "center",
    MAX: "end",
    SPACE_BETWEEN: "space-between",
  };
  return map[value] || value;
}

export function buildVariableMap(variablesData: any): Record<string, string> {
  const map: Record<string, string> = {};
  if (!variablesData || !variablesData.meta || !variablesData.meta.variables) {
    return map;
  }
  for (const [id, variable] of Object.entries(variablesData.meta.variables) as [string, any][]) {
    const collection = variablesData.meta.variableCollections?.[variable.variableCollectionId];
    const prefix = collection ? collection.name : "";
    map[id] = prefix ? `--${prefix}-${variable.name}` : `--${variable.name}`;
  }
  return map;
}

export function buildVariableMapFromNodes(node: FigmaNode): Record<string, { color: string; cssVar: string }> {
  const varEntries: Record<string, { color: string; contexts: any[] }> = {};

  function addEntry(
    id: string,
    color: FigmaColor | undefined,
    context: { node: string; type: string; usage: string }
  ): void {
    const hex = colorToHex(color);
    if (!varEntries[id]) {
      varEntries[id] = { color: hex, contexts: [] };
    }
    varEntries[id].contexts.push(context);
  }

  function collectFills(fills: FigmaFill[], nodeName: string, nodeType: string, usage: string): void {
    for (const fill of fills) {
      if (fill.type === "SOLID" && fill.boundVariables?.color?.id) {
        addEntry(fill.boundVariables.color.id, fill.color, { node: nodeName, type: nodeType, usage });
      }
      if (fill.gradientStops) {
        for (const stop of fill.gradientStops) {
          if (stop.boundVariables?.color?.id) {
            addEntry(stop.boundVariables.color.id, stop.color, {
              node: nodeName,
              type: nodeType,
              usage: "gradient-stop",
            });
          }
        }
      }
    }
  }

  function collect(n: FigmaNode): void {
    if (!n) return;

    if (n.fills) collectFills(n.fills, n.name, n.type, "fill");
    if (n.strokes) collectFills(n.strokes, n.name, n.type, "stroke");

    if (n.effects) {
      for (const effect of n.effects) {
        if (effect.boundVariables?.color?.id) {
          addEntry(effect.boundVariables.color.id, effect.color, { node: n.name, type: n.type, usage: "effect" });
        }
      }
    }

    if (n.children) {
      for (const child of n.children) {
        collect(child);
      }
    }
  }

  collect(node);

  const result: Record<string, { color: string; cssVar: string }> = {};
  for (const [id, entry] of Object.entries(varEntries)) {
    const cssVar = inferVarName(id, entry.color, entry.contexts[0]);
    result[id] = { color: entry.color, cssVar };
  }
  return result;
}

function inferVarName(id: string, color: string, context: any): string {
  const idNum = id.replace("VariableID:", "").replace(/:/g, "-");
  const usage = context?.usage || "color";
  const nodeType = context?.type || "";

  let prefix = "color";
  if (usage === "fill") {
    prefix = nodeType === "TEXT" ? "text" : "bg";
  } else if (usage === "stroke" || usage === "stroke-gradient") {
    prefix = "border";
  } else if (usage === "gradient-stop") {
    prefix = "gradient";
  } else if (usage === "effect") {
    prefix = "effect";
  }

  return `--${prefix}-${idNum}`;
}

function inferResponsiveHint(node: FigmaNode): string | null {
  const bbox = node.absoluteBoundingBox;
  const constraints = node.constraints;
  if (!bbox || !constraints) return null;

  const hints: string[] = [];

  if (constraints.horizontal === "LEFT_RIGHT") {
    hints.push("stretch-x");
  } else if (constraints.horizontal === "SCALE") {
    hints.push("fluid-width");
  } else if (constraints.horizontal === "CENTER") {
    hints.push("center-x");
  }

  if (constraints.vertical === "TOP_BOTTOM") {
    hints.push("stretch-y");
  } else if (constraints.vertical === "SCALE") {
    hints.push("fluid-height");
  } else if (constraints.vertical === "CENTER") {
    hints.push("center-y");
  }

  if (bbox.width > 1200) {
    hints.push("full-width, use max-width");
  } else if (bbox.width > 768 && constraints.horizontal === "LEFT") {
    hints.push("fixed-desktop, needs mobile adaptation");
  }

  return hints.length > 0 ? hints.join(", ") : null;
}

function walkTree(
  node: SimplifiedNode,
  stats: { total: number; types: Record<string, number>; texts: any[]; components: any[] }
): void {
  stats.total++;
  stats.types[node.type] = (stats.types[node.type] || 0) + 1;

  if (node.type === "TEXT" && node.text) {
    stats.texts.push({ name: node.name, text: node.text.slice(0, 100) });
  }
  if (node.type === "INSTANCE") {
    stats.components.push({ name: node.name, componentId: (node as any).componentId });
  }

  if (node.children) {
    for (const child of node.children) {
      walkTree(child, stats);
    }
  }
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function isLikelyIconNode(node: FigmaNode): boolean {
  if (!node) return false;

  const semantic = inferSemanticRole(node);
  if (semantic?.role === "ICON") return true;

  if (!node.type || !ICON_CONTAINER_TYPES.has(node.type)) return false;
  if (!node.name || !ICON_NAME_PATTERN.test(node.name.trim())) return false;

  const bbox = node.absoluteBoundingBox;
  if (!bbox) return false;

  const width = Number(bbox.width || 0);
  const height = Number(bbox.height || 0);
  if (width <= 0 || height <= 0) return false;
  if (Math.abs(width - height) > ICON_SIZE_TOLERANCE) return false;
  if (Math.max(width, height) > MAX_ICON_DIMENSION) return false;

  return COMMON_ICON_SIZES.some(
    (size) => Math.abs(width - size) <= ICON_SIZE_TOLERANCE && Math.abs(height - size) <= ICON_SIZE_TOLERANCE
  );
}

function quoteCondensedValue(value: string): string {
  return JSON.stringify(value);
}

function quoteCondensedPath(value: string): string {
  return JSON.stringify(value.replace(/\\/g, "/"));
}

function toCondensedLine(
  node: FigmaNode,
  depth: number,
  variableMap: Record<string, string> | null,
  svgMap: CondensedSvgMap | null
): string {
  const indent = "  ".repeat(depth);
  const parts: string[] = [];

  const semantic = inferSemanticRole(node);
  const type = semantic ? semantic.role : node.type;
  const name = `"${node.name}"`;
  const svgRef = svgMap?.[node.id];

  const bbox = node.absoluteBoundingBox;
  let size = "";
  if (bbox) {
    size = `${Math.round(bbox.width)}x${Math.round(bbox.height)}`;
  }

  parts.push(`[${type} ${name}`);
  if (size) parts.push(size);
  if (isLikelyIconNode(node) || svgRef) parts.push("icon");
  if (svgRef?.filename) parts.push(`svg:${quoteCondensedValue(svgRef.filename)}`);
  if (svgRef?.path) parts.push(`svgPath:${quoteCondensedPath(svgRef.path)}`);
  if (svgRef?.href) parts.push(`svgHref:${quoteCondensedValue(svgRef.href)}`);

  const allFills = (node.fills || []).filter((f) => f.visible !== false);
  const solidFills = allFills.filter((f) => f.type === "SOLID");
  const gradientFills = allFills.filter((f) => f.type?.startsWith("GRADIENT_"));

  if (node.type !== "TEXT") {
    if (gradientFills.length > 0) {
      const cssGradient = gradientToCSS(gradientFills[0]);
      if (cssGradient) parts.push(`bg:${cssGradient}`);
    } else if (solidFills.length > 0) {
      parts.push(`bg:${colorToString(solidFills[0].color, solidFills[0].opacity)}`);
    }
  }

  const effects = parseEffects(node.effects);
  if (effects) {
    for (const effect of effects) {
      if (effect.type === "drop-shadow") {
        parts.push(`shadow:${effect.offset!.x},${effect.offset!.y},${effect.radius},${effect.color}`);
      } else if (effect.type === "inner-shadow") {
        parts.push(`inner-shadow:${effect.offset!.x},${effect.offset!.y},${effect.radius},${effect.color}`);
      } else if (effect.type === "blur") {
        parts.push(`blur:${effect.radius}`);
      } else if (effect.type === "backdrop-blur") {
        parts.push(`backdrop-blur:${effect.radius}`);
      }
    }
  }

  if (node.cornerRadius) {
    parts.push(`radius:${node.cornerRadius}`);
  } else if (node.rectangleCornerRadii) {
    const r = node.rectangleCornerRadii;
    if (r[0] === r[1] && r[1] === r[2] && r[2] === r[3]) {
      if (r[0] > 0) parts.push(`radius:${r[0]}`);
    } else {
      parts.push(`radius:${r.join(",")}`);
    }
  }

  const strokes = (node.strokes || []).filter((s) => s.visible !== false);
  if (strokes.length > 0 && strokes[0].color) {
    parts.push(`border:${node.strokeWeight || 1}px,${colorToString(strokes[0].color)}`);
  }

  if (node.layoutMode && node.layoutMode !== "NONE") {
    parts.push(node.layoutMode === "HORIZONTAL" ? "flex-row" : "flex-col");
    if (node.itemSpacing) parts.push(`gap:${node.itemSpacing}`);

    const padding = compactPadding(node);
    if (padding && padding !== 0 && padding !== "0") {
      parts.push(`p:${padding}`);
    }

    const align = mapAlign(node.primaryAxisAlignItems);
    if (align && align !== "start") parts.push(align);
    const crossAlign = mapAlign(node.counterAxisAlignItems);
    if (crossAlign && crossAlign !== "start") parts.push(`cross:${crossAlign}`);

    if (node.layoutWrap === "WRAP") parts.push("wrap");
  }

  // Sizing mode
  if (node.layoutSizingHorizontal === "FILL") parts.push("fill-w");
  else if (node.layoutSizingHorizontal === "HUG") parts.push("hug-w");
  if (node.layoutSizingVertical === "FILL") parts.push("fill-h");
  else if (node.layoutSizingVertical === "HUG") parts.push("hug-h");

  // Absolute positioning
  if (node.layoutPositioning === "ABSOLUTE") {
    parts.push("absolute");
    if (bbox) parts.push(`xy:${Math.round(bbox.x)},${Math.round(bbox.y)}`);
  }

  // Flex grow
  if (node.layoutGrow && node.layoutGrow > 0) parts.push(`grow:${node.layoutGrow}`);

  // Overflow
  if (node.clipsContent) {
    if (node.overflowDirection && node.overflowDirection !== "NONE") {
      parts.push(`overflow:scroll-${node.overflowDirection.includes("HORIZONTAL") ? "x" : "y"}`);
    } else {
      parts.push("clip");
    }
  }

  // Rotation
  if (node.rotation && Math.abs(node.rotation) > 0.01) {
    parts.push(`rotate:${Math.round(node.rotation)}deg`);
  }

  // Blend mode
  if (node.blendMode && node.blendMode !== "NORMAL" && node.blendMode !== "PASS_THROUGH") {
    parts.push(`blend:${node.blendMode.toLowerCase()}`);
  }

  // Stroke align
  if (node.strokeAlign && node.strokeAlign !== "CENTER") {
    parts.push(`stroke-${node.strokeAlign.toLowerCase()}`);
  }

  const inferredLayout = inferLayoutFromChildBounds(node);
  if (inferredLayout) {
    parts.push(`inferred-${inferredLayout.mode}`);
    if (inferredLayout.gap) parts.push(`inferred-gap:${inferredLayout.gap}`);
    parts.push(`confidence:${inferredLayout.confidence}`);
  }

  if (node.opacity !== undefined && node.opacity !== 1) {
    parts.push(`opacity:${Math.round(node.opacity * 100) / 100}`);
  }

  if (node.type === "TEXT") {
    const style = node.style || {};
    const textParts: string[] = [];
    if (style.fontSize) textParts.push(`${style.fontSize}px`);
    if (style.fontWeight) textParts.push(`/${style.fontWeight}`);
    if (textParts.length > 0) parts.push(textParts.join(""));

    if (style.fontFamily) parts.push(`font:${style.fontFamily}`);
    if (style.lineHeightPx) parts.push(`lh:${Math.round(style.lineHeightPx)}px`);
    if (style.letterSpacing) parts.push(`ls:${style.letterSpacing}`);
    if (style.textAlignHorizontal && style.textAlignHorizontal !== "LEFT") {
      parts.push(`align:${style.textAlignHorizontal.toLowerCase()}`);
    }

    const textFills = (node.fills || []).filter((f) => f.visible !== false && f.type === "SOLID");
    if (textFills.length > 0) {
      parts.push(colorToString(textFills[0].color, textFills[0].opacity) || "");
    }

    if (node.textTruncation === "ENDING") parts.push("truncate");
    if (node.maxLines && node.maxLines > 0) parts.push(`max-lines:${node.maxLines}`);
    if (node.textDecoration && node.textDecoration !== "NONE") {
      parts.push(node.textDecoration.toLowerCase());
    }
    if (node.textCase && node.textCase !== "ORIGINAL") {
      parts.push(`case:${node.textCase.toLowerCase()}`);
    }

    const text = (node.characters || "").slice(0, 50);
    if (text) parts.push(`"${text}"`);
  }

  if (hasImageFill(node) && node.type !== "IMAGE") {
    parts.push("has-image");
  }

  if (semantic && semantic.html !== "div" && semantic.html !== "span") {
    parts.push(`<${semantic.html}>`);
  }

  if (variableMap && node.boundVariables) {
    const tokenParts: string[] = [];
    for (const [prop, binding] of Object.entries(node.boundVariables)) {
      if (binding && binding.id && variableMap[binding.id]) {
        tokenParts.push(`${prop}:var(${variableMap[binding.id]})`);
      }
    }
    if (tokenParts.length > 0) {
      parts.push(`{${tokenParts.join(",")}}`);
    }
  }

  return indent + parts.join(" ") + "]";
}
