# FPAGENT Relationship Data Contract

This file is the handoff guide for agents that extract, merge, validate, or generate Terra-Year relationship data.

## Runtime Files To Read And Write

Agents should treat these as the app-facing files:

```text
public/data/
├── operatiors.json        # canonical characters/operators
├── events.json            # timeline chapters/events
├── relations.json         # relationship edges rendered by the graph
└── operators_state.json   # alive/deceased/amnesiac/missing/etc. timeline states
```

Do not assume the app reads intermediate files such as `relations_combined.json`, `relations_NEW_ch00_04.json`, or files in `docs/lore/` unless `src/hooks/useTerraData.ts` is changed.

## Required Relation Shape

```json
{
  "id": "rel_unique_id",
  "source": "char_002_amiya",
  "target": "npc_ace",
  "first_appear_event_id": "main_ch00",
  "associated_event_id": "main_ch00",
  "relation_type": "ally",
  "relation_label": {
    "zh_CN": "战友与保护者",
    "en_US": "Comrade & Protector"
  },
  "description": {
    "zh_CN": "简短关系描述",
    "en_US": "Short relationship description"
  },
  "confidence_level": "official_fact",
  "evidences": [
    {
      "source_story": "level_main_00-01_beg",
      "quote": {
        "zh_CN": "短引用",
        "en_US": "Short quote"
      },
      "context_analysis": {
        "zh_CN": "为什么这句话支持该关系",
        "en_US": "Why this quote supports the relation"
      }
    }
  ]
}
```

## Required Status Shape

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

Use `event_id` when multiple chapters share the same `terran_year`. The frontend hides `alive`, so only add `alive` records when they are needed as historical anchors for later status changes.

## Allowed Values

Relation types:

- `ally`
- `rival`
- `bound`
- `subordinate`
- `unknown`

Confidence levels:

- `official_fact`
- `implied_plot`
- `community_speculation`

Operator statuses:

- `alive`
- `deceased`
- `amnesiac`
- `awakened`
- `missing`

## Timeline Rules

- The graph is cumulative.
- `first_appear_event_id` controls when a relation appears.
- `associated_event_id` is the narrative/source bucket.
- If old data lacks `first_appear_event_id`, the app may fall back to `associated_event_id`, but new data must include both.
- Do not duplicate an existing pair just to repeat the same relationship in later chapters. Add a new relation only when the relationship meaning changes or first appears as a distinct edge.

## Character Rules

- Every `source`, `target`, and `operator_id` must exist in `operatiors.json`.
- If a character is missing, add a minimal operator record before referencing it.
- Keep `id` stable once created.
- `faction` is used by the selector as character belonging/department. Prefer stable machine-readable keys such as `rhodes_island`, `reunion`, `penguin_logistics`, `babel`, etc.
- `avatar_key` is optional but useful. Missing or mismatched avatars can be handled by local asset aliases.

Minimal operator:

```json
{
  "id": "npc_example",
  "display_name": {
    "zh_CN": "示例角色",
    "en_US": "Example Character"
  },
  "faction": "unknown",
  "avatar_key": "npc_example",
  "is_npc": true
}
```

## Merge Checklist

Before writing `relations.json` or `operators_state.json`, validate:

- JSON parses.
- IDs are unique inside each file.
- Relation endpoints exist in `operatiors.json`.
- Status `operator_id` values exist in `operatiors.json`.
- Event references exist in `events.json`.
- `zh_CN` and `en_US` are present for display strings.
- Evidence arrays are not empty for canon-backed relations.
- `first_appear_event_id` is not later than `associated_event_id` in the current `events.json` order unless deliberately modeling a legacy/source bucket.

## Frontend Effects Driven By Data

- Death/broken-glass avatar effects come from `operators_state.json` with `status: "deceased"`.
- The graph grows from relation `first_appear_event_id`.
- The selector groups by `Operator.faction`.
- The UI does not show `[ALIVE]`; alive is treated as default.

Keep story facts in JSON. Avoid adding one-off status or relationship rules in React components.
