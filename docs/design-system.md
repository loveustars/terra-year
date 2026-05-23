# Arknights Cyber-Brutalist Design System

本项目视觉风格完全复刻《明日方舟》极简、高对比度、带有切角和极细虚线的“机能风（Cyber-Brutalist）”设计。

## 1. 调色板 (Color Palette)
- **Base Background** (背景基色): `#0a0a0a` (极深黑) / `#121212` (深灰)
- **High Contrast White** (高反白): `#f5f5f5` (冷白，正文)
- **Muted Text** (暗灰): `#666666` (辅助信息)
- **Rhodes Blue** (罗德岛蓝 - 交互与状态色): `#00b4d8`
- **Arknights Orange** (方舟橙 - 核心高亮与强调色): `#f2a104` 
- **Border Tone** (极细边框色): `rgba(255, 255, 255, 0.08)` / `#222222`

## 2. 方舟专属组件 CSS / Tailwind 实现

### 45度经典切角卡片样式
```html
<div class="bg-zinc-900 border border-white/10 text-white p-4"
     style="clip-path: polygon(0 0, 92% 0, 100% 15%, 100% 100%, 8% 100%, 0 85%);">
  <!-- Content -->
</div>
```

### 磨砂玻璃抽屉/面板

```html
<div class="bg-black/60 backdrop-blur-md border border-white/10 shadow-2xl">
  <!-- 用于右侧详情抽屉 -->
</div>
```
### 点阵背景类
在组件外层使用：arknights-grid (定义于 src/index.css 中)。
