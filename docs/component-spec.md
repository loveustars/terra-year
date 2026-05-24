# Core Component Specification & Interfaces

This document describes the current React component contracts. Relationship agents usually do not edit these files, but they must understand which data fields drive each UI behavior.

## Timeline

Manual chapter/year cursor at the bottom of the app.

```ts
interface TimelineProps {
  events: TerraEvent[];
  lang: LangKey;
  selectedEvent: TerraEvent | null;
  onSelectEvent: (event: TerraEvent) => void;
  showDetail: boolean;
  onToggleDetail: (show: boolean) => void;
}
```

Behavior:

- Renders `events.json` in chronological order.
- Uses a range input as a snap-to-chapter progress bar.
- Calls `onSelectEvent` with the full `TerraEvent`.
- The selected event controls cumulative relation visibility in `App.tsx`.

## GraphCanvas

Main relationship web.

```ts
interface GraphCanvasProps {
  operators: Operator[];
  relations: OperatorRelation[];
  operatorStatuses?: Map<string, { status: string; note?: string }>;
  currentEvent: TerraEvent;
  lang: LangKey;
  onSelectOperator?: (
    id: string | null,
    event?: { pageX: number; pageY: number },
    avatarRect?: DOMRect
  ) => void;
}
```

Behavior:

- Preserves existing node positions across chapter changes.
- Inserts newly visible operators and relations as the timeline advances.
- Runs collision relaxation to reduce avatar overlap.
- Applies broken-glass grayscale avatar styling when `operatorStatuses.get(id)?.status === "deceased"`.

## OperatorSelector

Draggable left-side filter panel.

```ts
interface OperatorSelectorProps {
  allEventOperators: Operator[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onSelectIds: (ids: string[]) => void;
  onDeselectIds: (ids: string[]) => void;
  lang: LangKey;
  currentEvent?: TerraEvent;
}
```

Behavior:

- Groups characters by `Operator.faction`.
- Provides ALL/NONE controls globally and per group.
- Search matches localized names and faction.
- Empty `selectedIds` means the graph is empty.

## OperatorAvatar

Avatar renderer with local-first asset resolution.

```ts
interface OperatorAvatarProps {
  avatarKey?: string;
  name: string;
  aliases?: Array<string | undefined>;
  highlighted?: boolean;
  size?: number;
  onClick?: () => void;
  isDeceased?: boolean;
}
```

Behavior:

- Tries local files under `public/assets/avatars/` before CDN fallback.
- Supports `.webp`, `.png`, and `.svg`.
- Uses aliases for data IDs that do not match friendly avatar filenames.
- Renders broken-glass grayscale treatment for deceased characters.

## RelationPanel

Right-side detail panel for selected operator relations. Data is assembled in `App.tsx` from the selected relation list plus `getOperatorById` lookups.
