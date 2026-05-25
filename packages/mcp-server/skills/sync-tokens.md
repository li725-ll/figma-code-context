---
description: 将 Figma Variables 和 Styles 同步为项目的 design token 文件
---

# 同步 Figma Design Tokens

你将从 Figma 文件中提取 Variables 和 Styles，转换为项目可用的 design token 格式。

## 第一步：检测项目 token 体系

读取项目配置，确定当前使用的 token 方案：

1. 检查是否已有 token 文件：
   - `tailwind.config.{js,ts,mjs}` → Tailwind theme extend
   - `tokens/`、`design-tokens/` 目录 → Style Dictionary / Token Studio 格式
   - `src/styles/variables.css` → CSS Custom Properties
   - `src/theme.{ts,js}` → JS/TS theme 对象（MUI、Chakra、Ant Design）
   - `src/styles/_variables.scss` → SASS 变量
2. 如果没有已有 token 文件，根据样式方案决定输出格式：
   - Tailwind 项目 → 扩展 tailwind.config
   - CSS-in-JS 项目 → theme 对象
   - 纯 CSS/SASS 项目 → CSS Custom Properties
3. **如果无法确定** → 询问用户偏好的 token 格式

## 第二步：获取 Figma 设计数据

1. 调用 `get_variables` 获取所有 Variables（颜色、数值、字符串、布尔值）
2. 调用 `get_styles` 获取所有 Styles（颜色样式、文字样式、效果样式）
3. 分析 Variable Collections 和 Modes（如 Light/Dark 主题）

## 第三步：转换 Token

### 颜色 Token

- Variable Collection 中的颜色 → CSS 变量 / theme 颜色
- 保留 Figma 中的命名层级（如 `primary/500` → `--color-primary-500`）
- 如果有多个 Mode（Light/Dark）→ 生成对应的主题变体

### 间距 / 尺寸 Token

- 数值类型的 Variables → spacing / sizing scale
- 保留语义命名（如 `spacing/sm` → `--spacing-sm`）

### 字体 Token

- Text Styles → 字体族、字号、行高、字重的组合
- 生成 typography scale（如 heading-1、body-large）

### 效果 Token

- Effect Styles → box-shadow、backdrop-filter 等
- 保留语义命名（如 `elevation/md` → `--shadow-md`）

### 圆角 / 边框 Token

- 从 Variables 或常用节点中提取 border-radius scale

## 第四步：生成输出

根据检测到的格式生成对应文件：

### Tailwind 项目

```
更新 tailwind.config.{js,ts} 的 theme.extend 部分
- colors: { ... }
- spacing: { ... }
- fontSize: { ... }
- boxShadow: { ... }
- borderRadius: { ... }
```

### CSS Custom Properties

```
生成/更新 CSS 变量文件
:root { ... }
[data-theme="dark"] { ... }  或  @media (prefers-color-scheme: dark) { ... }
```

### JS/TS Theme 对象

```
生成/更新 theme 文件，匹配项目使用的 UI 库格式
```

## 第五步：处理冲突

- 如果项目已有 token 文件，**合并而非覆盖**
- 新增的 token 追加到对应分类末尾
- 已存在同名 token → 更新值（Figma 为准）
- 项目中有但 Figma 中没有的 token → 保留不动
- 生成前展示变更摘要，让用户确认

## 输出

完成后说明：

- 同步了哪些 token 分类（颜色 N 个、间距 N 个、字体 N 个...）
- 更新了哪些文件
- 如果有多主题（Light/Dark），说明主题切换方式
- 建议：哪些组件可能需要更新以使用新 token
