# Data Schema Specification

主数据存放在 `public/data/` 目录下，分为三个核心 JSON 文件。

## 1. TypeScript 类型定义

```typescript
interface I18nString {
  zh_CN: string;
  en_US: string;
  ja_JP: string;
  ko_KR: string;
}

// 对应 operators.json
interface Operator {
  id: string;              
  display_name: I18nString; 
  faction: string;         
  avatar_key: string;      
  is_npc: boolean;         
}

// 对应 events.json
interface TerraEvent {
  id: string;              
  terran_year_start: number; 
  terran_year_end: number;   
  title: I18nString;       
  subtitle: I18nString;    
  brief: I18nString;       
  bg_preset: "snow" | "rain" | "starry" | "antique_gold" | "default"; 
}

// 对应 relations.json 中的证据链
interface RelationEvidence {
  source_story: string;    
  quote: I18nString;       
  context_analysis?: I18nString; 
}

// 对应 relations.json 中的关系
interface OperatorRelation {
  id: string;              
  source: string;          
  target: string;          
  associated_event_id: string; 
  relation_type: "ally" | "rival" | "bound" | "subordinate" | "unknown"; 
  relation_label: I18nString; 
  confidence_level: "official_fact" | "implied_plot" | "community_speculation"; 
  evidences: RelationEvidence[]; 
}