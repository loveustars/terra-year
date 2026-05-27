# Data Schema Specification

Primary runtime data lives in `public/data/`. Relationship-handling agents must treat these files as the source of truth for app-facing data.

## Core Files

- `public/data/operatiors.json`: canonical operator/character records. The filename is intentionally misspelled in the current app and must not be renamed unless the code is updated.
- `public/data/events.json`: ordered timeline chapters/events.
- `public/data/relations.json`: relationship edges between operators.
- `public/data/operators_state.json`: time-aware status changes such as deceased, amnesiac, missing, awakened.

Generated extraction files may exist under `scripts/`, `docs/lore/`, or alternate `public/data/relations_*` files, but agents should not assume the app reads them unless `src/hooks/useTerraData.ts` is updated.

## TypeScript Contract

```ts
interface I18nString {
  zh_CN: string;
  en_US: string;
  ja_JP?: string;
  ko_KR?: string;
}

interface Operator {
  id: string;
  display_name: I18nString;
  /** 所属势力（可多值，如同时属于罗德岛和企鹅物流） */
  faction: string[];
  avatar_key?: string;
  is_npc: boolean;
}

interface TerraEvent {
  id: string;
  terran_year_start: number | "unknown";
  terran_year_end: number | "unknown";
  title: I18nString;
  subtitle: I18nString;
  brief: I18nString;
  bg_preset: "snow" | "rain" | "starry" | "antique_gold" | "default";
}

interface RelationEvidence {
  source_story: string;
  quote: I18nString;
  context_analysis?: I18nString;
}

type RelationType = "ally" | "rival" | "bound" | "subordinate" | "unknown";
type ConfidenceLevel = "official_fact" | "implied_plot" | "community_speculation";

interface OperatorRelation {
  id: string;
  source: string;
  target: string;
  first_appear_event_id: string;
  associated_event_id: string;
  relation_type: RelationType;
  relation_label: I18nString;
  description?: I18nString;
  confidence_level: ConfidenceLevel;
  evidences: RelationEvidence[];
}

type OperatorStatus = "alive" | "deceased" | "amnesiac" | "awakened" | "missing";

interface OperatorState {
  operator_id: string;
  terran_year: number;
  event_id?: string;
  status: OperatorStatus;
  reason?: I18nString;
}
```

## ID Rules

- `Operator.id` is the canonical stable identifier used by relations and states.
- `OperatorRelation.source` and `OperatorRelation.target` must both reference existing `Operator.id` values.
- `OperatorState.operator_id` must reference an existing `Operator.id`.
- `TerraEvent.id` must be stable. Current mainline event IDs use `main_ch00`, `main_ch01`, etc.
- `first_appear_event_id` controls when a relationship first appears on the cumulative graph.
- `associated_event_id` describes the story/event bucket for organization. If both fields are present, `first_appear_event_id` drives timeline visibility.

## Timeline Semantics

The frontend treats the selected chapter as a manual time cursor.

- The graph includes all relations whose `first_appear_event_id` is at or before the selected event.
- If `first_appear_event_id` is missing in older data, the app falls back to `associated_event_id`.
- Operator status is resolved by `terran_year`, then refined by optional `event_id` for chapters in the same year.
- `alive` is the default/non-exceptional state and is not shown as a badge.
- Non-default states such as `deceased`, `amnesiac`, `awakened`, and `missing` may be shown in the UI.

## Relationship Authoring Rules

- Prefer one clear relation edge per meaningful pair/event. Avoid duplicate edges with different IDs unless they represent a new first appearance or materially different relationship.
- Keep `relation_label` human-readable and specific, for example `"Trust & Reliance"` rather than only `"Ally"`.
- Use `relation_type` for broad visual styling only.
- Evidence quotes should be short and directly relevant.
- `confidence_level` should reflect source strength:
  - `official_fact`: directly stated or unambiguous canon.
  - `implied_plot`: strongly implied by context.
  - `community_speculation`: plausible but not canon-confirmed.

## Status Authoring Rules

Use `operators_state.json` for alive/death/condition transitions. Do not hardcode story status in React components.

Example:

```json
{
  "operator_id": "npc_ace",
  "terran_year": 1096,
  "event_id": "main_ch00",
  "status": "deceased",
  "reason": {
    "zh_CN": "在切尔诺伯格行动中牺牲",
    "en_US": "Sacrificed during the Chernobog operation"
  }
}
```

Add `event_id` when chapter-level precision matters, especially when multiple chapters share the same Terran year.
