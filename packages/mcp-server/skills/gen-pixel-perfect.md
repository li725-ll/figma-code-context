---
description: 从 Figma 设计稿像素级精修，修正视觉差异
---

# 像素级精修

你将对比 Figma 设计稿与当前实现，修正视觉差异。

## 核心原则

目标是修正**视觉差异**，让浏览器渲染效果与设计稿一致。不是逐属性对比，而是关注用户能看到的差异。

- 如果当前实现用了不同的 CSS 方式但视觉效果相同，不需要修改
- 不要为了"属性对齐"而改动已经视觉正确的代码

## 工作流程

### 第一步：获取设计数据

调用 `get_node_css(recursive: true)` 获取完整 CSS。

### 第二步：读取当前实现

找到对应的组件/页面代码，理解当前样式实现方式。

### 第三步：视觉对比

关注以下维度的差异：

- 尺寸和间距（width/height/margin/padding/gap）
- 颜色（background/color/border-color）
- 字体（font-size/weight/line-height/letter-spacing）
- 圆角和阴影（border-radius/box-shadow）
- 布局方向和对齐（flex-direction/align/justify）
- 层叠关系（z-index/position）

### 第四步：修正差异

- 逐个修复发现的视觉差异
- 最小化改动范围，只修正有差异的部分
- 保持代码风格与项目一致

### 第五步：验证

构建通过 + 视觉效果与设计稿一致。

## 注意

- 最多 3 轮精修，每轮聚焦最明显的差异
- 如果某个区域偏差集中，对该区域单独获取数据精修
