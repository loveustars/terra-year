import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type {
  Operator, OperatorRelation, LangKey, TerraEvent,
  RelationType, ConfidenceLevel,
} from '../hooks/useTerraData';

/* ============================================================
 * Diff 类型定义
 * ============================================================ */
type DiffAction = 'modify' | 'add' | 'delete';
type DiffTarget = 'relation' | 'operator';

interface FieldDiff {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

interface DiffEntry {
  id: string; // 唯一 ID
  timestamp: number;
  action: DiffAction;
  target: DiffTarget;
  targetId: string; // 被修改对象 ID (relation.id / operator.id)
  fields: FieldDiff[];
  summary: string; // 人类可读摘要
}

/* ============================================================
 * Props
 * ============================================================ */
interface DataEditorProps {
  operators: Operator[];
  relations: OperatorRelation[];
  events: TerraEvent[];
  lang: LangKey;
  onClose: () => void;
}

const RELATION_TYPE_OPTIONS: RelationType[] = ['ally', 'rival', 'bound', 'subordinate', 'unknown'];
const CONFIDENCE_OPTIONS: ConfidenceLevel[] = ['official_fact', 'implied_plot', 'community_speculation'];

const STORAGE_KEY = 'terra_year_editor_changes';

/* ============================================================
 * Helpers
 * ============================================================ */
function getRelationSummary(rel: OperatorRelation, opMap: Map<string, Operator>, lang: LangKey): string {
  const src = opMap.get(rel.source);
  const tgt = opMap.get(rel.target);
  const srcName = src?.display_name?.[lang] ?? src?.display_name?.zh_CN ?? rel.source;
  const tgtName = tgt?.display_name?.[lang] ?? tgt?.display_name?.zh_CN ?? rel.target;
  const label = rel.relation_label?.[lang] ?? rel.relation_label?.zh_CN ?? rel.relation_type;
  return `${srcName} ⟷ ${tgtName}  [${label}]`;
}

function operatorDisplayName(op: Operator, lang: LangKey): string {
  return op.display_name?.[lang] ?? op.display_name?.zh_CN ?? op.id;
}

function getEventTitle(eventId: string, events: TerraEvent[], lang: LangKey): string {
  const ev = events.find(e => e.id === eventId);
  return ev?.title?.[lang] ?? ev?.title?.zh_CN ?? eventId;
}

/* ============================================================
 * Component
 * ============================================================ */
export default function DataEditor({ operators, relations, events, lang, onClose }: DataEditorProps) {
  const opMap = useMemo(() => new Map(operators.map(op => [op.id, op])), [operators]);

  /* ---- 状态 ---- */
  const [tab, setTab] = useState<'browse' | 'changes'>('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRelId, setSelectedRelId] = useState<string | null>(null);
  const [selectedOpId, setSelectedOpId] = useState<string | null>(null);
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set(['all']));
  /* ---- Changes 标签页中的干员搜索 ---- */
  const [opSearch, setOpSearch] = useState('');
  const filteredOps = useMemo(() => {
    if (!opSearch.trim()) return [];
    const q = opSearch.toLowerCase();
    return operators.filter(op => {
      const name = operatorDisplayName(op, lang).toLowerCase();
      return name.includes(q) || op.id.toLowerCase().includes(q);
    }).slice(0, 20);
  }, [opSearch, operators, lang]);

  /* ---- 编辑表单状态（关系） ---- */
  const [editRelType, setEditRelType] = useState<RelationType>('ally');
  const [editRelLabelZh, setEditRelLabelZh] = useState('');
  const [editRelLabelEn, setEditRelLabelEn] = useState('');
  const [editRelDescZh, setEditRelDescZh] = useState('');
  const [editRelDescEn, setEditRelDescEn] = useState('');
  const [editRelConfidence, setEditRelConfidence] = useState<ConfidenceLevel>('official_fact');

  /* ---- 编辑表单状态（干员） ---- */
  const [editOpNameZh, setEditOpNameZh] = useState('');
  const [editOpNameEn, setEditOpNameEn] = useState('');
  const [editOpFaction, setEditOpFaction] = useState('');
  const [editOpIsNpc, setEditOpIsNpc] = useState(false);

  /* ---- Changes (persisted to localStorage) ---- */
  const [changes, setChanges] = useState<DiffEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  /* ---- 弹出消息 ---- */
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(changes));
  }, [changes]);

  /* ---- 选中关系时填充表单 ---- */
  useEffect(() => {
    if (selectedRelId) {
      const rel = relations.find(r => r.id === selectedRelId);
      if (rel) {
        setEditRelType(rel.relation_type);
        setEditRelLabelZh(rel.relation_label?.zh_CN ?? '');
        setEditRelLabelEn(rel.relation_label?.en_US ?? '');
        setEditRelDescZh((rel as any).description?.zh_CN ?? '');
        setEditRelDescEn((rel as any).description?.en_US ?? '');
        setEditRelConfidence(rel.confidence_level);
      }
    }
  }, [selectedRelId, relations]);

  /* ---- 选中干员时填充表单 ---- */
  useEffect(() => {
    if (selectedOpId) {
      const op = operators.find(o => o.id === selectedOpId);
      if (op) {
        setEditOpNameZh(op.display_name?.zh_CN ?? '');
        setEditOpNameEn(op.display_name?.en_US ?? '');
        setEditOpFaction(Array.isArray(op.faction) ? op.faction.join(', ') : op.faction ?? '');
        setEditOpIsNpc(op.is_npc ?? false);
      }
    }
  }, [selectedOpId, operators]);

  /* ---- 按事件分组的关系 ---- */
  const groupedRelations = useMemo(() => {
    const filtered = relations.filter(rel => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const src = opMap.get(rel.source);
        const tgt = opMap.get(rel.target);
        const srcName = operatorDisplayName(src ?? { id: rel.source, display_name: { zh_CN: rel.source, en_US: rel.source } } as Operator, lang).toLowerCase();
        const tgtName = operatorDisplayName(tgt ?? { id: rel.target, display_name: { zh_CN: rel.target, en_US: rel.target } } as Operator, lang).toLowerCase();
        if (!srcName.includes(q) && !tgtName.includes(q) && !rel.id.toLowerCase().includes(q)) return false;
      }
      if (eventFilter !== 'all' && rel.associated_event_id !== eventFilter) return false;
      return true;
    });

    const groups = new Map<string, OperatorRelation[]>();
    for (const rel of filtered) {
      const eventId = rel.associated_event_id || 'unknown';
      if (!groups.has(eventId)) groups.set(eventId, []);
      groups.get(eventId)!.push(rel);
    }
    return Array.from(groups.entries())
      .map(([eventId, rels]) => ({ eventId, rels }))
      .sort((a, b) => events.findIndex(e => e.id === a.eventId) - events.findIndex(e => e.id === b.eventId));
  }, [relations, opMap, searchQuery, eventFilter, lang, events]);

  /* ---- 添加修改记录 ---- */
  const addChange = useCallback((target: DiffTarget, targetId: string, fields: FieldDiff[], summary: string) => {
    setChanges(prev => {
      // 如果该 target 已经有修改记录，合并
      const existingIdx = prev.findIndex(c => c.target === target && c.targetId === targetId && c.action === 'modify');
      if (existingIdx >= 0) {
        const updated = [...prev];
        const existing = { ...updated[existingIdx] };
        const existingFields = [...existing.fields];
        for (const newField of fields) {
          const fieldIdx = existingFields.findIndex(f => f.field === newField.field);
          if (fieldIdx >= 0) {
            existingFields[fieldIdx] = newField; // 覆盖
          } else {
            existingFields.push(newField);
          }
        }
        updated[existingIdx] = { ...existing, fields: existingFields, timestamp: Date.now(), summary };
        return updated;
      }
      return [...prev, { id: `${target}_${targetId}_${Date.now()}`, timestamp: Date.now(), action: 'modify' as DiffAction, target, targetId, fields, summary }];
    });
    showToast('修改已记录 ✓');
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }, []);

  /* ---- 保存关系修改 ---- */
  const handleSaveRelation = useCallback(() => {
    if (!selectedRelId) return;
    const rel = relations.find(r => r.id === selectedRelId);
    if (!rel) return;

    const fields: FieldDiff[] = [];
    if (editRelType !== rel.relation_type) {
      fields.push({ field: 'relation_type', oldValue: rel.relation_type, newValue: editRelType });
    }
    if (editRelLabelZh !== (rel.relation_label?.zh_CN ?? '')) {
      fields.push({ field: 'relation_label.zh_CN', oldValue: rel.relation_label?.zh_CN, newValue: editRelLabelZh });
    }
    if (editRelLabelEn !== (rel.relation_label?.en_US ?? '')) {
      fields.push({ field: 'relation_label.en_US', oldValue: rel.relation_label?.en_US, newValue: editRelLabelEn });
    }
    if (editRelDescZh !== ((rel as any).description?.zh_CN ?? '')) {
      fields.push({ field: 'description.zh_CN', oldValue: (rel as any).description?.zh_CN, newValue: editRelDescZh });
    }
    if (editRelDescEn !== ((rel as any).description?.en_US ?? '')) {
      fields.push({ field: 'description.en_US', oldValue: (rel as any).description?.en_US, newValue: editRelDescEn });
    }
    if (editRelConfidence !== rel.confidence_level) {
      fields.push({ field: 'confidence_level', oldValue: rel.confidence_level, newValue: editRelConfidence });
    }

    if (fields.length === 0) {
      showToast('没有修改');
      return;
    }

    const summary = `修改关系: ${getRelationSummary(rel, opMap, lang)}`;
    addChange('relation', selectedRelId, fields, summary);
  }, [selectedRelId, relations, editRelType, editRelLabelZh, editRelLabelEn, editRelDescZh, editRelDescEn, editRelConfidence, opMap, lang, addChange]);

  /* ---- 保存干员修改 ---- */
  const handleSaveOperator = useCallback(() => {
    if (!selectedOpId) return;
    const op = operators.find(o => o.id === selectedOpId);
    if (!op) return;

    const fields: FieldDiff[] = [];
    const currentFactionStr = Array.isArray(op.faction) ? op.faction.join(', ') : op.faction ?? '';

    if (editOpNameZh !== (op.display_name?.zh_CN ?? '')) {
      fields.push({ field: 'display_name.zh_CN', oldValue: op.display_name?.zh_CN, newValue: editOpNameZh });
    }
    if (editOpNameEn !== (op.display_name?.en_US ?? '')) {
      fields.push({ field: 'display_name.en_US', oldValue: op.display_name?.en_US, newValue: editOpNameEn });
    }
    if (editOpFaction !== currentFactionStr) {
      fields.push({ field: 'faction', oldValue: currentFactionStr, newValue: editOpFaction });
    }
    if (editOpIsNpc !== (op.is_npc ?? false)) {
      fields.push({ field: 'is_npc', oldValue: op.is_npc, newValue: editOpIsNpc });
    }

    if (fields.length === 0) {
      showToast('没有修改');
      return;
    }

    const name = operatorDisplayName(op, lang);
    addChange('operator', selectedOpId, fields, `修改干员: ${name}`);
  }, [selectedOpId, operators, editOpNameZh, editOpNameEn, editOpFaction, editOpIsNpc, lang, addChange]);

  /* ---- 删除修改记录 ---- */
  const removeChange = useCallback((changeId: string) => {
    setChanges(prev => prev.filter(c => c.id !== changeId));
  }, []);

  /* ---- 清空所有修改 ---- */
  const clearAllChanges = useCallback(() => {
    setChanges([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  /* ---- 生成 GitHub Issue URL ---- */
  const generateIssueUrl = useCallback(() => {
    if (changes.length === 0) {
      showToast('还没有任何修改记录');
      return;
    }

    const patch = {
      type: 'terra-year-data-patch',
      version: 1,
      created_at: new Date().toISOString(),
      changes: changes.map(c => ({
        action: c.action,
        target: c.target,
        target_id: c.targetId,
        fields: c.fields,
      })),
    };

    const title = encodeURIComponent(`[terra-year 数据修正] ${changes[0].summary}${changes.length > 1 ? ` 等${changes.length}项` : ''}`);

    const bodyLines = [
      '## 修改描述',
      '',
      '<!-- 请简要说明为什么需要这些修改（剧情依据、考据来源等） -->',
      '',
      '',
      '## 修改清单',
      '',
      ...changes.map((c, i) => {
        const fieldsList = c.fields.map(f => `- \`${f.field}\`: \`${JSON.stringify(f.oldValue)}\` → \`${JSON.stringify(f.newValue)}\``).join('\n');
        return `### ${i + 1}. ${c.summary}\n\n**目标:** \`${c.target}\` / \`${c.targetId}\`\n\n${fieldsList}\n`;
      }),
      '',
      '## Patch Data',
      '',
      '```json',
      JSON.stringify(patch, null, 2),
      '```',
      '',
      '---',
      '*此 Issue 由 terra-year 数据编辑器自动生成*',
    ].join('\n');

    const url = `https://github.com/loveustars/terra-year/issues/new?title=${title}&body=${encodeURIComponent(bodyLines)}`;
    window.open(url, '_blank');
  }, [changes]);

  /* ---- 取消选中 ---- */
  const handleBack = useCallback(() => {
    setSelectedRelId(null);
    setSelectedOpId(null);
  }, []);

  /* ---- 渲染编辑表单 ---- */
  const renderEditor = () => {
    if (selectedRelId) {
      const rel = relations.find(r => r.id === selectedRelId);
      if (!rel) return null;
      const src = opMap.get(rel.source);
      const tgt = opMap.get(rel.target);
      return (
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-white/10">
            <button onClick={handleBack} className="text-[10px] text-[#00c2ff] hover:text-white transition-colors mb-3">&larr; 返回列表</button>
            <div className="text-[10px] text-white/40 font-mono">{rel.id}</div>
            <div className="text-base font-black mt-1 text-white">
              {operatorDisplayName(src ?? { id: rel.source, display_name: { zh_CN: rel.source, en_US: rel.source } } as Operator, lang)}
              {' ⟷ '}
              {operatorDisplayName(tgt ?? { id: rel.target, display_name: { zh_CN: rel.target, en_US: rel.target } } as Operator, lang)}
            </div>
            <div className="text-[10px] text-[#00c2ff]/60 font-mono mt-1">
              章节: {getEventTitle(rel.associated_event_id, events, lang)}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-[12px]">
            {/* 关系类型 */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-white/50 mb-1">关系类型</label>
              <select value={editRelType} onChange={e => setEditRelType(e.target.value as RelationType)}
                className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 text-[12px] font-mono outline-none focus:border-[#00c2ff]">
                {RELATION_TYPE_OPTIONS.map(t => (
                  <option key={t} value={t} className="bg-[#1a1a2e]">{t}</option>
                ))}
              </select>
            </div>

            {/* 关系标签 */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-white/50 mb-1">标签 (zh_CN)</label>
              <input value={editRelLabelZh} onChange={e => setEditRelLabelZh(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 text-[12px] font-mono outline-none focus:border-[#00c2ff]" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-white/50 mb-1">标签 (en_US)</label>
              <input value={editRelLabelEn} onChange={e => setEditRelLabelEn(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 text-[12px] font-mono outline-none focus:border-[#00c2ff]" />
            </div>

            {/* 描述 */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-white/50 mb-1">描述 (zh_CN)</label>
              <textarea value={editRelDescZh} onChange={e => setEditRelDescZh(e.target.value)} rows={2}
                className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 text-[12px] font-mono outline-none focus:border-[#00c2ff] resize-none" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-white/50 mb-1">描述 (en_US)</label>
              <textarea value={editRelDescEn} onChange={e => setEditRelDescEn(e.target.value)} rows={2}
                className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 text-[12px] font-mono outline-none focus:border-[#00c2ff] resize-none" />
            </div>

            {/* 置信度 */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-white/50 mb-1">置信度</label>
              <select value={editRelConfidence} onChange={e => setEditRelConfidence(e.target.value as ConfidenceLevel)}
                className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 text-[12px] font-mono outline-none focus:border-[#00c2ff]">
                {CONFIDENCE_OPTIONS.map(c => (
                  <option key={c} value={c} className="bg-[#1a1a2e]">{c}</option>
                ))}
              </select>
            </div>

            {/* 证据（只读） */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-white/50 mb-1">
                证据 ({rel.evidences.length}条)
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {rel.evidences.map((ev, i) => (
                  <div key={i} className="bg-white/5 p-2 rounded text-[11px] leading-relaxed">
                    <div className="text-[#00c2ff]/60 text-[9px]">{ev.source_story}</div>
                    <div className="text-white/70 mt-1">{ev.quote?.zh_CN ?? JSON.stringify(ev.quote)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-white/10">
            <button onClick={handleSaveRelation}
              className="w-full py-2.5 bg-[#00c2ff] text-black text-[11px] font-black tracking-widest hover:bg-[#00d9ff] transition-colors">
              SAVE CHANGE
            </button>
          </div>
        </div>
      );
    }

    if (selectedOpId) {
      const op = operators.find(o => o.id === selectedOpId);
      if (!op) return null;
      return (
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-white/10">
            <button onClick={handleBack} className="text-[10px] text-[#00c2ff] hover:text-white transition-colors mb-3">&larr; 返回列表</button>
            <div className="text-[10px] text-white/40 font-mono">{op.id}</div>
            <div className="text-base font-black mt-1 text-white">
              {operatorDisplayName(op, lang)}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-[12px]">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-white/50 mb-1">名称 (zh_CN)</label>
              <input value={editOpNameZh} onChange={e => setEditOpNameZh(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 text-[12px] font-mono outline-none focus:border-[#00c2ff]" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-white/50 mb-1">名称 (en_US)</label>
              <input value={editOpNameEn} onChange={e => setEditOpNameEn(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 text-[12px] font-mono outline-none focus:border-[#00c2ff]" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-white/50 mb-1">阵营 (逗号分隔)</label>
              <input value={editOpFaction} onChange={e => setEditOpFaction(e.target.value)}
                placeholder="rhodes_island, lungmen"
                className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 text-[12px] font-mono outline-none focus:border-[#00c2ff]" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="edit-is-npc" checked={editOpIsNpc} onChange={e => setEditOpIsNpc(e.target.checked)}
                className="accent-[#00c2ff]" />
              <label htmlFor="edit-is-npc" className="text-[11px] text-white/70">NPC（不可抽取角色）</label>
            </div>
          </div>

          <div className="p-4 border-t border-white/10">
            <button onClick={handleSaveOperator}
              className="w-full py-2.5 bg-[#00c2ff] text-black text-[11px] font-black tracking-widest hover:bg-[#00d9ff] transition-colors">
              SAVE CHANGE
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  /* ---- 渲染浏览列表 ---- */
  const renderBrowse = () => (
    <div className="flex flex-col h-full">
      {/* 搜索和过滤 */}
      <div className="p-4 border-b border-white/10 space-y-2">
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="搜索干员名或关系 ID..."
          className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 text-[11px] font-mono outline-none focus:border-[#00c2ff] placeholder:text-white/20"
        />
        <select value={eventFilter} onChange={e => setEventFilter(e.target.value)}
          className="w-full bg-white/5 border border-white/10 text-white/70 px-3 py-2 text-[10px] font-mono outline-none focus:border-[#00c2ff]">
          <option value="all" className="bg-[#1a1a2e]">全部章节</option>
          {events.map(ev => (
            <option key={ev.id} value={ev.id} className="bg-[#1a1a2e]">
              {ev.title?.[lang] ?? ev.title?.zh_CN ?? ev.id}
            </option>
          ))}
        </select>
      </div>

      {/* 分事件展示关系 */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3">
          {/* 干员搜索按钮 */}
          <button onClick={() => setTab('changes')}
            className="w-full mb-3 py-2 text-[10px] font-mono tracking-wider text-white/50 border border-dashed border-white/10 hover:border-[#00c2ff]/50 transition-colors text-center">
            + 编辑干员信息（在 Changes 标签页搜索）
          </button>
        </div>
        {groupedRelations.length === 0 ? (
          <div className="text-center py-8 text-white/30 text-[11px] font-mono">无匹配结果</div>
        ) : (
          <div className="space-y-2 px-3 pb-4">
            {groupedRelations.map(({ eventId, rels }) => {
              const isExpanded = expandedEvents.has(eventId);
              const eventTitle = getEventTitle(eventId, events, lang);
              return (
                <div key={eventId}>
                  <button
                    onClick={() => setExpandedEvents(prev => { const n = new Set(prev); n.has(eventId) ? n.delete(eventId) : n.add(eventId); return n; })}
                    className="w-full flex items-center justify-between px-3 py-2 bg-white/5 text-left hover:bg-white/10 transition-colors"
                  >
                    <span className="text-[10px] font-bold tracking-wider text-[#00c2ff]">{eventTitle}</span>
                    <span className="text-[9px] text-white/40">{rels.length} 条关系 {isExpanded ? '▾' : '▸'}</span>
                  </button>
                  {isExpanded && (
                    <div className="space-y-1 mt-1">
                      {rels.map(rel => {
                        const isSavingChanges = changes.some(c => c.target === 'relation' && c.targetId === rel.id);
                        return (
                          <button
                            key={rel.id}
                            onClick={() => setSelectedRelId(rel.id)}
                            className={`w-full text-left px-3 py-2 border-l-2 transition-colors text-[11px] leading-relaxed
                              ${isSavingChanges
                                ? 'border-l-[#00c2ff] bg-[#00c2ff]/10'
                                : 'border-l-white/5 hover:border-l-[#00c2ff]/50 bg-white/[0.02] hover:bg-white/[0.06]'
                              }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-mono text-white/30 flex-shrink-0">{rel.id.slice(0, 14)}</span>
                              {isSavingChanges && <span className="text-[8px] text-[#00c2ff] font-bold">● 已修改</span>}
                            </div>
                            <div className="text-white/80 font-medium mt-0.5">
                              {getRelationSummary(rel, opMap, lang)}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-[8px] px-1 py-0.5 rounded ${
                                rel.confidence_level === 'official_fact' ? 'bg-green-500/20 text-green-400' :
                                rel.confidence_level === 'implied_plot' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-red-500/20 text-red-400'
                              }`}>
                                {rel.confidence_level}
                              </span>
                              <span className="text-white/30 text-[8px]">{rel.relation_type}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  /* ---- 渲染 Changes 标签页 ---- */
  const renderChanges = () => {
    return (
      <div className="flex flex-col h-full">
        {/* 搜索干员 */}
        <div className="p-4 border-b border-white/10">
          <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-2">搜索干员进行编辑</label>
          <input value={opSearch} onChange={e => setOpSearch(e.target.value)}
            placeholder="输入干员名..."
            className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 text-[11px] font-mono outline-none focus:border-[#00c2ff] placeholder:text-white/20" />
          {opSearch && filteredOps.length > 0 && (
            <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
              {filteredOps.map(op => (
                <button key={op.id}
                  onClick={() => { setSelectedOpId(op.id); setSelectedRelId(null); setTab('browse'); }}
                  className="w-full text-left px-3 py-1.5 text-[11px] text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <span className="text-[9px] text-white/30 font-mono">{op.id}</span>
                  {' '}{operatorDisplayName(op, lang)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 修改列表 */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] font-bold text-white/70">
              修改记录 ({changes.length})
            </div>
            {changes.length > 0 && (
              <button onClick={clearAllChanges} className="text-[9px] text-red-400/60 hover:text-red-400 transition-colors">
                清空全部
              </button>
            )}
          </div>

          {changes.length === 0 ? (
            <div className="text-center py-8 text-white/20 text-[11px] font-mono">
              暂无修改记录
              <div className="text-[9px] mt-2 text-white/10">在 Browse 标签页浏览关系，点击进入编辑</div>
            </div>
          ) : (
            <div className="space-y-2">
              {changes.map((change) => (
                <div key={change.id} className="bg-white/5 border border-white/10 p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-medium text-white/80 truncate">{change.summary}</div>
                      <div className="text-[9px] text-white/30 font-mono mt-1">
                        {change.target}/{change.targetId} · {change.fields.length} 个字段
                      </div>
                      <div className="mt-1 space-y-0.5">
                        {change.fields.map((f, i) => (
                          <div key={i} className="text-[9px] text-white/40 font-mono">
                            <span className="text-[#00c2ff]/60">{f.field}</span>:{' '}
                            <span className="line-through text-red-400/50">{JSON.stringify(f.oldValue)}</span>
                            {' → '}
                            <span className="text-green-400/70">{JSON.stringify(f.newValue)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => removeChange(change.id)}
                      className="text-[9px] text-white/20 hover:text-red-400 ml-2 flex-shrink-0">
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 提交按钮 */}
        <div className="p-4 border-t border-white/10 space-y-2">
          <button onClick={generateIssueUrl}
            disabled={changes.length === 0}
            className={`w-full py-3 text-[11px] font-black tracking-widest transition-colors ${
              changes.length > 0
                ? 'bg-[#00c2ff] text-black hover:bg-[#00d9ff]'
                : 'bg-white/5 text-white/20 cursor-not-allowed'
            }`}>
            SUBMIT TO GITHUB ISSUE ▸
          </button>
          <div className="text-[9px] text-white/20 text-center leading-relaxed">
            提交后将在新标签页打开 GitHub Issue 创建页面，<br />
            请填写修改理由后提交 Issue。
            <div className="mt-1 text-[#00c2ff]/50">需要 GitHub 账号</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-[#00c2ff] text-black text-[10px] font-mono font-bold tracking-wider"
            style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 主面板 */}
      <motion.div
        initial={{ opacity: 0, x: 80 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 80 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 bottom-0 z-40 w-[440px] max-w-[90vw] flex flex-col"
        style={{
          backgroundColor: '#0f0f1a',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '-8px 0 30px rgba(0,0,0,0.5)',
        }}
      >
        {/* 顶部栏 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-black tracking-widest text-[#00c2ff] uppercase">EDITOR</span>
            <div className="flex bg-white/5 rounded overflow-hidden">
              <button onClick={() => { setTab('browse'); handleBack(); }}
                className={`px-3 py-1 text-[9px] font-bold tracking-wider transition-colors ${
                  tab === 'browse' ? 'bg-[#00c2ff] text-black' : 'text-white/40 hover:text-white'
                }`}>
                BROWSE
              </button>
              <button onClick={() => { setTab('changes'); handleBack(); }}
                className={`px-3 py-1 text-[9px] font-bold tracking-wider transition-colors flex items-center gap-1 ${
                  tab === 'changes' ? 'bg-[#00c2ff] text-black' : 'text-white/40 hover:text-white'
                }`}>
                CHANGES
                {changes.length > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[14px] h-[14px] px-1 text-[8px] rounded-full bg-white/20">
                    {changes.length}
                  </span>
                )}
              </button>
            </div>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white text-[13px]">&times;</button>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-hidden">
          {selectedRelId || selectedOpId ? renderEditor() : (
            tab === 'changes' ? renderChanges() : renderBrowse()
          )}
        </div>
      </motion.div>
    </>
  );
}
