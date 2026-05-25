export interface FigmaClientOptions {
  token: string;
  baseUrl?: string;
  cacheTTL?: number;
  cacheMaxSize?: number;
  maxRetries?: number;
  maxConcurrency?: number;
  requestTimeoutMs?: number;
}

export interface FigmaRequestParams {
  [key: string]: string | number | boolean | undefined | null;
}

export interface FigmaFile {
  name: string;
  lastModified: string;
  thumbnailUrl: string;
  version: string;
  document: FigmaNode;
  components: Record<string, FigmaComponent>;
  styles: Record<string, FigmaStyle>;
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
  absoluteBoundingBox?: FigmaBoundingBox;
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
  style?: Record<string, unknown>;
  componentId?: string;
  description?: string;
  boundVariables?: Record<string, unknown>;
  constraints?: { horizontal: string; vertical: string };
  strokeWeight?: number;
  exportSettings?: Array<{ suffix: string; format: string; constraint?: { type: string; value: number } }>;
  layoutAlign?: string;
  layoutGrow?: number;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  clipsContent?: boolean;
  background?: FigmaFill[];
  backgroundColor?: FigmaColor;
  [key: string]: unknown;
}

export interface FigmaComponent {
  key: string;
  name: string;
  description: string;
  componentSetId?: string;
}

export interface FigmaStyle {
  key: string;
  name: string;
  styleType: string;
  description: string;
}

export interface FigmaGradientStop {
  color?: FigmaColor;
  position: number;
  boundVariables?: Record<string, unknown>;
}

export interface FigmaPosition {
  x: number;
  y: number;
}

export interface FigmaFill {
  type: string;
  visible?: boolean;
  opacity?: number;
  color?: FigmaColor;
  gradientStops?: FigmaGradientStop[];
  gradientHandlePositions?: FigmaPosition[];
  boundVariables?: Record<string, unknown>;
  imageRef?: string;
  scaleMode?: string;
}

export interface FigmaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface FigmaEffect {
  type: string;
  visible?: boolean;
  radius?: number;
  color?: FigmaColor;
  offset?: { x: number; y: number };
  spread?: number;
  boundVariables?: Record<string, unknown>;
}

export interface FigmaBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FigmaVersion {
  id: string;
  created_at: string;
  label: string;
  description: string;
  user: { id: string; handle: string; img_url: string };
}

export interface FigmaImageResponse {
  err: string | null;
  images: Record<string, string | null>;
}

export interface FigmaFileNodesResponse {
  name: string;
  lastModified: string;
  version: string;
  nodes: Record<
    string,
    { document: FigmaNode; components: Record<string, FigmaComponent>; styles: Record<string, FigmaStyle> }
  >;
}

export interface FigmaVersionsResponse {
  versions: FigmaVersion[];
}

export interface FigmaComponentsResponse {
  meta: { components: FigmaComponent[] };
}

export interface FigmaStylesResponse {
  meta: { styles: FigmaStyle[] };
}

export interface FigmaVariablesResponse {
  meta: {
    variables: Record<string, unknown>;
    variableCollections: Record<string, unknown>;
  };
}
