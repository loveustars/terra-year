# Application Architecture & State Flow

## 1. 目录结构
```text
terra-year/
├── AGENTS.md                  # 项目总纲
├── docs/                      # 核心说明文档目录
├── public/
│   └── data/                  # 主数据目录 (JSON)
├── src/
│   ├── assets/                # 全局静态样式与预设字体
│   ├── components/            # 可复用组件目录
│   │   ├── Timeline.tsx       # 底部纪年时间轴
│   │   ├── GraphCanvas.tsx    # 核心画布
│   │   ├── RelationCard.tsx   # 右侧详情卡
│   │   └── EditorPanel.tsx    # 可视化数据编辑器
│   ├── hooks/                 # 自定义 Hooks
│   │   └── useTerraData.ts    # 统一读取、过滤 JSON 数据的逻辑
│   ├── App.tsx                # 应用入口，负责组件协调