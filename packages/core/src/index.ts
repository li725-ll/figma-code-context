export {
  inferSemanticRole,
  simplifyNode,
  buildComponentMap,
  generateSummary,
  toCondensedFormat,
  toCondensedWithBudget,
  colorToString,
  gradientToCSS,
  fillsToCSS,
  effectsToCSS,
  parseEffects,
  buildVariableMap,
  buildVariableMapFromNodes,
  estimateTokens,
  isLikelyIconNode,
} from "./transformer.js";
export type {
  FigmaNode,
  FigmaColor,
  FigmaFill,
  FigmaEffect,
  FigmaGradientStop,
  FigmaPosition,
  SemanticRole,
  CondensedSvgMap,
} from "./transformer.js";

export {
  parseFigmaUrl,
  extractAllTexts,
  formatVariableValues,
  formatValue,
  extractDesignInfo,
  toCSSClass,
  nodeToCSS,
  nodeToCSSRecursive,
  nodeToTailwind,
  nodeToTailwindRecursive,
  searchNodes,
} from "./helpers.js";
export type { ExtractedText, SearchResult, CSSGenOptions } from "./helpers.js";

export { diffNodes, formatDiffOutput } from "./diff.js";
export type { DiffEntry } from "./diff.js";
