import { useState, useEffect, useMemo, useCallback } from 'react';

/* ============================================================
 * TypeScript 类型定义（对应 data-schema.md）
 * ============================================================ */

export interface I18nString {
  zh_CN: string;
  en_US: string;
  ja_JP?: string;
  ko_KR?: string;
}

export interface Operator {
  id: string;
  display_name: I18nString;
  /** 所属势力（可多值） */
  faction: string[];
  avatar_key?: string;
  is_npc: boolean;
}

export interface TerraEvent {
  id: string;
  terran_year_start: number | 'unknown';
  terran_year_end: number | 'unknown';
  title: I18nString;
  subtitle: I18nString;
  brief: I18nString;
  bg_preset: 'snow' | 'rain' | 'starry' | 'antique_gold' | 'default';
}

export interface RelationEvidence {
  source_story: string;
  quote: I18nString;
  context_analysis?: I18nString;
}

export type RelationType = 'ally' | 'rival' | 'bound' | 'subordinate' | 'unknown';
export type ConfidenceLevel = 'official_fact' | 'implied_plot' | 'community_speculation';

export interface OperatorRelation {
  id: string;
  source: string;
  target: string;
  /** 关系首次出现的章节事件 ID（用于时间轴过滤） */
  first_appear_event_id: string;
  /** 关联的事件 ID（可能与首次出现不同，用于组织数据） */
  associated_event_id: string;
  relation_type: RelationType;
  relation_label: I18nString;
  confidence_level: ConfidenceLevel;
  evidences: RelationEvidence[];
}

export type LangKey = 'zh_CN' | 'en_US' | 'ja_JP' | 'ko_KR';

/** 干员在特定时间点的状态 */
export interface OperatorState {
  operator_id: string;
  year?: number;
  terran_year?: number;
  status: 'alive' | 'deceased' | 'amnesiac' | 'awakened' | 'missing';
  reason?: I18nString;
  event_id?: string;
}

/* ============================================================
 * useTerraData — 核心数据 Hook
 *
 * 职责：
 *  - 异步加载 public/data/ 下的三个 JSON 文件
 *  - 提供按事件 ID、干员 ID、年份等维度过滤的能力
 *  - 暴露加载状态 / 错误信息
 * ============================================================ */

const DATA_PATHS: Record<string, string> = {
  operators: '/data/operatiors.json',
  events: '/data/events.json',
  relations: '/data/relations.json',
  states: '/data/operators_state.json',
} as const;

export interface TerraDataState {
  operators: Operator[];
  events: TerraEvent[];
  relations: OperatorRelation[];
  loading: boolean;
  error: string | null;
}

export interface UseTerraDataReturn extends TerraDataState {
  operatorStates: OperatorState[];
  /** 获取指定年份范围内的事件 */
  getEventsByYear: (year: number) => TerraEvent[];
  /** 获取与指定事件关联的关系 */
  getRelationsByEvent: (eventId: string) => OperatorRelation[];
  /** 根据 ID 查找干员 */
  getOperatorById: (id: string) => Operator | undefined;
  /** 根据阵营过滤干员 */
  getOperatorsByFaction: (faction: string) => Operator[];
  /** 获取指定干员相关的所有关系（可按事件过滤） */
  getConnectedOperators: (operatorId: string, eventId?: string) => OperatorRelation[];
  /** 获取干员在指定年份的状态 */
  getOperatorState: (operatorId: string, year: number, eventId?: string) => OperatorState | undefined;
  /** 事件的最小/最大年份范围 */
  yearRange: [number, number];
  /** 全部关系数据（用于树形生长过滤） */
  relations: OperatorRelation[];
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`加载数据失败: ${path} (HTTP ${response.status})`);
  }
  return response.json() as Promise<T>;
}

function normalizeI18n(value: Partial<I18nString> | string | undefined, fallback: string): I18nString {
  if (typeof value === 'string') {
    return { zh_CN: value, en_US: value };
  }
  return {
    zh_CN: value?.zh_CN || value?.en_US || fallback,
    en_US: value?.en_US || value?.zh_CN || fallback,
    ja_JP: value?.ja_JP,
    ko_KR: value?.ko_KR,
  };
}

function normalizeEventId(eventId: string | undefined, eventIds: Set<string>): string {
  if (!eventId) return '';
  const candidates = eventId.split(',').map(id => id.trim()).filter(Boolean);
  for (const candidate of candidates) {
    if (eventIds.has(candidate)) return candidate;
    const chMatch = candidate.match(/^ch(\d{1,2})$/i);
    if (chMatch) {
      const normalized = `main_ch${chMatch[1].padStart(2, '0')}`;
      if (eventIds.has(normalized)) return normalized;
    }
  }
  return eventId;
}

function normalizeOperators(operators: Operator[]): Operator[] {
  return operators.map((operator) => ({
    ...operator,
    display_name: normalizeI18n(operator.display_name, operator.id),
    faction: Array.isArray(operator.faction)
      ? operator.faction
      : [operator.faction || 'unknown'],
    avatar_key: operator.avatar_key || operator.id,
    is_npc: operator.is_npc ?? (operator.id.startsWith('npc_') || operator.id.startsWith('avg_')),
  }));
}

function normalizeRelations(relations: OperatorRelation[], events: TerraEvent[]): OperatorRelation[] {
  const eventIds = new Set(events.map(event => event.id));
  return relations.map((relation) => {
    const associated_event_id = normalizeEventId(relation.associated_event_id, eventIds);
    const first_appear_event_id = normalizeEventId(
      relation.first_appear_event_id || associated_event_id,
      eventIds,
    );

    return {
      ...relation,
      first_appear_event_id,
      associated_event_id,
      relation_label: normalizeI18n(relation.relation_label, relation.relation_type || 'unknown'),
      confidence_level: relation.confidence_level || 'implied_plot',
      evidences: Array.isArray(relation.evidences)
        ? relation.evidences.map(evidence => ({
          ...evidence,
          source_story: evidence.source_story || associated_event_id || first_appear_event_id || 'unknown',
          quote: normalizeI18n(evidence.quote, ''),
          context_analysis: evidence.context_analysis
            ? normalizeI18n(evidence.context_analysis, '')
            : undefined,
        }))
        : [],
    };
  });
}

export function useTerraData(): UseTerraDataReturn {
  const [state, setState] = useState<TerraDataState & { operatorStates: OperatorState[] }>({
    operators: [],
    events: [],
    relations: [],
    operatorStates: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const [operators, events, relations, opStates] = await Promise.all([
          fetchJson<Operator[]>(DATA_PATHS.operators),
          fetchJson<TerraEvent[]>(DATA_PATHS.events),
          fetchJson<OperatorRelation[]>(DATA_PATHS.relations),
          fetchJson<OperatorState[]>(DATA_PATHS.states),
        ]);

        if (!cancelled) {
          const normalizedOperators = normalizeOperators(operators);
          const normalizedRelations = normalizeRelations(relations, events);
          setState({
            operators: normalizedOperators,
            events,
            relations: normalizedRelations,
            operatorStates: opStates,
            loading: false,
            error: null,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: err instanceof Error ? err.message : '未知数据加载错误',
          }));
        }
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, []);

  /* ---------- 过滤辅助 ---------- */

  const getEventsByYear = useCallback(
    (year: number) =>
      state.events.filter((e) => {
        if (e.terran_year_start === 'unknown' || e.terran_year_end === 'unknown') return false;
        return e.terran_year_start <= year && e.terran_year_end >= year;
      }),
    [state.events],
  );

  const getRelationsByEvent = useCallback(
    (eventId: string) =>
      state.relations.filter((r) => r.associated_event_id === eventId),
    [state.relations],
  );

  const getOperatorById = useCallback(
    (id: string) => state.operators.find((o) => o.id === id),
    [state.operators],
  );

  const getOperatorsByFaction = useCallback(
    (faction: string) =>
      state.operators.filter((o) => o.faction.includes(faction)),
    [state.operators],
  );

  const getConnectedOperators = useCallback(
    (operatorId: string, eventId?: string) => {
      const base = state.relations.filter(
        (r) => r.source === operatorId || r.target === operatorId,
      );
      if (eventId) return base.filter((r) => r.associated_event_id === eventId);
      return base;
    },
    [state.relations],
  );

  const getOperatorState = useCallback(
    (operatorId: string, year: number, eventId?: string): OperatorState | undefined => {
      const currentEventIndex = eventId ? state.events.findIndex(e => e.id === eventId) : -1;
      return state.operatorStates
        .filter(s => {
          const stateYear = s.year ?? s.terran_year;
          if (s.operator_id !== operatorId || stateYear === undefined || stateYear > year) return false;
          if (!s.event_id || currentEventIndex < 0) return true;
          const stateEventIndex = state.events.findIndex(e => e.id === s.event_id);
          return stateEventIndex < 0 || stateEventIndex <= currentEventIndex;
        })
        .sort((a, b) => {
          const yearDiff = (b.year ?? b.terran_year ?? 0) - (a.year ?? a.terran_year ?? 0);
          if (yearDiff !== 0) return yearDiff;
          const aEventIndex = a.event_id ? state.events.findIndex(e => e.id === a.event_id) : -1;
          const bEventIndex = b.event_id ? state.events.findIndex(e => e.id === b.event_id) : -1;
          return bEventIndex - aEventIndex;
        })[0];
    },
    [state.events, state.operatorStates],
  );

  const yearRange = useMemo<[number, number]>(() => {
    const withYears = state.events.filter(
      (e): e is TerraEvent & { terran_year_start: number; terran_year_end: number } =>
        e.terran_year_start !== 'unknown' && e.terran_year_end !== 'unknown',
    );
    if (withYears.length === 0) return [0, 0];
    const years = withYears.flatMap((e) => [e.terran_year_start, e.terran_year_end]);
    return [Math.min(...years), Math.max(...years)];
  }, [state.events]);

  return {
    ...state,
    getOperatorState,
    getEventsByYear,
    getRelationsByEvent,
    getOperatorById,
    getOperatorsByFaction,
    getConnectedOperators,
    operatorStates: state.operatorStates,
    yearRange,
    relations: state.relations,
  };
}
