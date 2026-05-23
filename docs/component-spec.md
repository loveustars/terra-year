# Core Component Specification & Interfaces

## 1. Timeline (时间轴组件)
底部时间轴必须根据 `events.json` 自动渲染历史节点：

```typescript
interface TimelineProps {
  events: TerraEvent[];
  activeEventId: string;
  onEventChange: (eventId: string) => void;
  currentLanguage: "zh_CN" | "en_US" | "ja_JP" | "ko_KR";
}
```

## 2. GraphCanvas (核心画布)
负责接收当前被选中的干员，并且当这些干员被点击时，动态“绽放”并连线：

```typeScript
interface GraphCanvasProps {
  activeEventId: string;
  relations: OperatorRelation[];
  operators: Operator[];
  selectedOperatorIds: string[]; // 用户当前选中/搜索聚焦的干员列表
  onOperatorSelect: (operatorIds: string[]) => void;
  onRelationClick: (relation: OperatorRelation) => void; // 点击线条触发卡片滑出
  currentLanguage: "zh_CN" | "en_US" | "ja_JP" | "ko_KR";
}
```

## 3. EditorPanel (可视化编辑器组件)
允许用户实时绘制新连线，并能够把更新后的配置生成纯 JSON 导出：

```typeScript
interface EditorPanelProps {
  onDataExport: (exportedJson: string) => void; // 传递生成的 JSON 字符串给父层进行导出/复制弹窗
  operators: Operator[];
  events: TerraEvent[];
}
```