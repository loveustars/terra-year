# Application Architecture & State Flow

## Directory Structure

```text
terra-year/
├── docs/
│   ├── FPAGENT.md             # Agent-facing relationship data contract
│   ├── data-schema.md         # Runtime JSON schema
│   ├── component-spec.md      # Current component interfaces
│   └── lore/                  # Lore extraction/reference artifacts
├── public/
│   ├── assets/avatars/        # Local avatar files, preferred before CDN fallback
│   └── data/
│       ├── operatiors.json    # Canonical operators/characters
│       ├── events.json        # Timeline chapters/events
│       ├── relations.json     # App-read relationship edges
│       └── operators_state.json
├── src/
│   ├── components/
│   │   ├── Timeline.tsx
│   │   ├── GraphCanvas.tsx
│   │   ├── OperatorSelector.tsx
│   │   ├── OperatorAvatar.tsx
│   │   ├── EventBackground.tsx
│   │   ├── RelationPanel.tsx
│   │   └── AvatarRelationPopup.tsx
│   ├── hooks/
│   │   └── useTerraData.ts
│   ├── utils/
│   │   └── assets.ts
│   └── App.tsx
└── scripts/                   # Extraction/generation helpers and intermediate data
```

## Data Loading

`src/hooks/useTerraData.ts` loads all runtime JSON from `public/data/`:

- operators from `/data/operatiors.json`
- events from `/data/events.json`
- relations from `/data/relations.json`
- operator states from `/data/operators_state.json`

It exposes lookup helpers such as `getOperatorById`, `getRelationsByEvent`, and `getOperatorState`.

## Timeline Cursor

`App.tsx` owns `currentEvent`. The bottom `Timeline` is a manual progress bar that changes `currentEvent`.

When the current event changes:

1. `App.tsx` finds the event index in `events`.
2. It collects all event IDs up to that index.
3. It includes relations whose `first_appear_event_id` appears in that cumulative set, falling back to `associated_event_id` for legacy data.
4. It resolves operator statuses for the selected year/event.
5. It passes cumulative operators/relations to `GraphCanvas`.

## Graph Growth

The relationship graph is cumulative. It should feel like a growing web, not a full redraw.

- Existing node coordinates are preserved in `GraphCanvas`.
- New nodes receive deterministic initial positions.
- A collision relaxation pass reduces avatar overlap.
- New relationship lines animate in.
- The app should avoid remounting `GraphCanvas` on chapter changes.

For very large future graphs, the next recommended step is moving layout work into a Web Worker or rendering the graph with canvas/WebGL while keeping React for controls and panels.

## Status Flow

Operator life/condition state belongs in `operators_state.json`, not in component code.

`getOperatorState(operatorId, year, eventId)` returns the effective latest state. The UI hides `alive` because it is the default state and only renders exceptional states such as `deceased`, `amnesiac`, `awakened`, and `missing`.

## Selector Flow

`OperatorSelector` receives the cumulative operators for the current timeline cursor. It groups them by `faction`/belonging and supports:

- global ALL/NONE
- per-faction ALL/NONE
- search by name/faction
- dragging the panel away from graph content

An empty selected set means no graph nodes are shown.
