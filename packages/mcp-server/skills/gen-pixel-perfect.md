---
description: 从 Figma 设计稿像素级精确还原前端组件/页面
---

# 像素级精确还原 Figma 设计

你将从 Figma 设计稿中生成像素级精确的前端代码。每个颜色值、间距、字体属性、布局行为都必须与设计稿完全一致。

## 第一步：检测项目技术栈

读取项目配置文件，确定：

1. 框架：React / Vue / Svelte / Angular / 原生 HTML
2. 样式方案：Tailwind / CSS Modules / Styled Components / SCSS / CSS-in-JS
3. 组件库：是否使用 MUI / Ant Design / Chakra 等
4. TypeScript 还是 JavaScript

## 第二步：获取设计数据（精确模式）

**必须使用 `precision: "pixel-perfect"` 参数：**

1. 调用 `get_node` 获取节点数据：
   - `format: "json"` — 必须使用 JSON 格式，不要用 condensed
   - `precision: "pixel-perfect"` — 启用完整属性输出
   - `depth: 15` — 使用更大深度确保子节点完整

2. 对每个有 `imageRef` 的节点，调用 `get_images` 获取图片 URL

3. 对图标/矢量节点，调用 `export_svg` 获取 SVG 文件

## 第三步：逐节点精确转换

对每个节点，按以下清单验证所有属性：

### 布局容器

- [ ] display: flex / grid
- [ ] flex-direction（从 layoutMode 映射）
- [ ] gap（itemSpacing 精确值）
- [ ] padding 四边独立值
- [ ] justify-content（primaryAxisAlignItems → flex-start/center/flex-end/space-between）
- [ ] align-items（counterAxisAlignItems → flex-start/center/flex-end/baseline）
- [ ] flex-wrap（layoutWrap === "WRAP"）

### 子元素尺寸策略

- [ ] FILL → `flex: 1 0 0` 或 `width: 100%`
- [ ] HUG → `width: fit-content` 或不设固定宽度
- [ ] FIXED → 精确 px 值
- [ ] layoutGrow > 0 → `flex-grow`
- [ ] min-width / max-width / min-height / max-height

### 定位

- [ ] layoutPositioning === "ABSOLUTE" → `position: absolute` + top/left
- [ ] 相对于父容器的偏移量

### 视觉属性

- [ ] 背景色：精确 hex/rgba 值
- [ ] 渐变：精确角度、色标位置
- [ ] 圆角：四角独立值（rectangleCornerRadii）
- [ ] 边框：宽度 + 颜色 + strokeAlign（inside 用 box-shadow 模拟）
- [ ] 四边独立边框（individualStrokeWeights）
- [ ] 虚线边框（strokeDashes）
- [ ] 阴影：x/y/blur/spread/color 精确值
- [ ] 透明度
- [ ] overflow: hidden（clipsContent）
- [ ] 旋转（rotation → transform: rotate）
- [ ] 混合模式（blendMode → mix-blend-mode）

### 文字属性

- [ ] font-family 精确字体名
- [ ] font-size 精确 px
- [ ] font-weight 精确数值
- [ ] line-height 精确 px
- [ ] letter-spacing 精确 px
- [ ] text-align
- [ ] text-decoration（underline / line-through）
- [ ] text-transform（uppercase / lowercase / capitalize）
- [ ] 文字颜色精确值
- [ ] 文字截断：text-overflow: ellipsis + -webkit-line-clamp

### 图片和图标

- [ ] IMAGE fill → img 标签 + 获取的图片 URL
- [ ] 矢量图标 → 内联 SVG 或 SVG 文件引用
- [ ] object-fit 根据缩放模式设置

## 第四步：生成代码

### 尺寸策略映射

| Figma 属性                    | CSS 输出            | Tailwind 输出 |
| ----------------------------- | ------------------- | ------------- |
| layoutSizingHorizontal: FILL  | flex: 1 0 0         | flex-1        |
| layoutSizingHorizontal: HUG   | width: fit-content  | w-fit         |
| layoutSizingHorizontal: FIXED | width: Npx          | w-[Npx]       |
| layoutSizingVertical: FILL    | align-self: stretch | self-stretch  |
| layoutSizingVertical: HUG     | height: fit-content | h-fit         |
| layoutSizingVertical: FIXED   | height: Npx         | h-[Npx]       |

### Stroke Align 处理

| strokeAlign | 实现方式                          |
| ----------- | --------------------------------- |
| CENTER      | border: Npx solid color           |
| INSIDE      | box-shadow: inset 0 0 0 Npx color |
| OUTSIDE     | box-shadow: 0 0 0 Npx color       |

## 第五步：自检清单

生成代码后，逐项验证：

1. **颜色**：每个颜色值是否与设计稿 hex 完全一致？
2. **间距**：padding/margin/gap 是否精确到 px？
3. **字体**：font-family、size、weight、line-height、letter-spacing 是否完整？
4. **布局**：flex 方向、对齐、换行是否正确？子元素 sizing 策略是否正确？
5. **圆角**：四角是否独立设置？数值是否精确？
6. **阴影**：参数是否完整（x/y/blur/spread/color）？
7. **边框**：宽度、颜色、对齐方式是否正确？
8. **图片**：是否所有图片都有正确引用？
9. **图标**：是否所有矢量图标都已导出为 SVG？
10. **溢出**：clipsContent 是否映射为 overflow: hidden？
11. **文字截断**：是否正确实现 ellipsis / line-clamp？

## 输出

完成后说明：

- 生成了哪些文件
- 使用了哪些精确数值（关键颜色、字体、间距）
- 哪些图片/图标需要替换为实际资源
- 是否有无法精确还原的部分（说明原因和替代方案）
