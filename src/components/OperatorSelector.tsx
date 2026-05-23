import React, { useState, useMemo } from 'react';
import type { Operator as TOperator, LangKey } from '../hooks/useTerraData';

type Operator = TOperator;

interface OperatorSelectorProps {
  allEventOperators: Operator[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  lang: LangKey;
}

const FACTION_COLORS: Record<string, string> = {
  '罗德岛': '#00b4d8',
  '芭芭拉': '#9b59b6',
  '巴别塔': '#8e44ad',
  '卡兹戴尔': '#c0392b',
  '龙门': '#e67e22',
  '整合运动': '#e74c3c',
  '企鹅物流': '#3498db',
  '汐斯塔': '#2ecc71',
  '卡西米尔': '#f39c12',
  '维多利亚': '#e91e63',
  '莱茵生命': '#00b4d8',
  '阿卡胡拉': '#27ae60',
  '叙拉古': '#795548',
  '拉特兰': '#f1c40f',
  '哥伦比亚': '#7f8c8d',
  '玻利瓦尔': '#c0392b',
};

function getFactionColor(faction: string): string {
  return FACTION_COLORS[faction] ?? 'rgba(255,255,255,0.2)';
}

const OperatorSelector: React.FC<OperatorSelectorProps> = ({
  allEventOperators,
  selectedIds,
  onToggle,
  onSelectAll,
  onDeselectAll,
  lang,
}) => {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return allEventOperators;
    const q = search.toLowerCase();
    return allEventOperators.filter(op => {
      const name = (op.display_name[lang] ?? op.display_name.zh_CN ?? '').toLowerCase();
      return name.includes(q);
    });
  }, [allEventOperators, search, lang]);

  return (
    <div
      className="absolute top-24 left-4 z-30 w-64 max-h-[60vh] flex flex-col"
      style={{
        backgroundColor: 'rgba(10, 10, 10, 0.92)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.06)',
        clipPath: 'polygon(0 0, 94% 0, 100% 4%, 100% 100%, 6% 100%, 0 96%)',
      }}
    >
      {/* 头部 */}
      <div className="px-3 pt-3 pb-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] font-mono tracking-[0.15em] uppercase" style={{ color: 'rgba(242, 161, 4, 0.5)' }}>
            OPERATORS
          </span>
          <span className="text-[8px] font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>
            {selectedIds.size}/{allEventOperators.length}
          </span>
        </div>
        <div className="flex gap-1 mb-2">
          <button onClick={onSelectAll}
            className="text-[8px] font-mono px-2 py-0.5 border transition-colors hover:bg-white/5"
            style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' }}>
            ALL
          </button>
          <button onClick={onDeselectAll}
            className="text-[8px] font-mono px-2 py-0.5 border transition-colors hover:bg-white/5"
            style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' }}>
            NONE
          </button>
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="SEARCH..."
          className="w-full bg-transparent text-[10px] font-mono px-2 py-1 border outline-none transition-colors"
          style={{
            borderColor: 'rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.5)',
          }}
        />
      </div>

      {/* 列表 - 使用传入的 allEventOperators 而非 filtered（搜索结果），但显示搜索过滤 */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
        {filtered.map(op => {
          const name = op.display_name[lang] ?? op.display_name.zh_CN ?? op.id;
          const isSelected = selectedIds.has(op.id);
          const factionColor = getFactionColor(op.faction);
          return (
            <button
              key={op.id}
              onClick={() => onToggle(op.id)}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors"
              style={{
                backgroundColor: isSelected ? 'rgba(242, 161, 4, 0.06)' : 'transparent',
              }}
              onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'; }}
              onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              {/* 选择指示器 */}
              <div
                className="w-2 h-2 flex-shrink-0"
                style={{
                  backgroundColor: isSelected ? '#f2a104' : 'transparent',
                  border: `1px solid ${isSelected ? '#f2a104' : 'rgba(255,255,255,0.15)'}`,
                }}
              />
              {/* 角色名 */}
              <span
                className="text-[10px] font-mono truncate"
                style={{
                  color: isSelected ? '#f5f5f5' : 'rgba(255,255,255,0.3)',
                  letterSpacing: '0.05em',
                }}
              >
                {name}
              </span>
              {/* 阵营标签 */}
              <span
                className="text-[7px] font-mono ml-auto uppercase flex-shrink-0"
                style={{ color: factionColor }}
              >
                {op.faction.slice(0, 4)}
              </span>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-[9px] font-mono px-3 py-4 text-center" style={{ color: 'rgba(255,255,255,0.2)' }}>
            NO MATCH
          </div>
        )}
      </div>
    </div>
  );
};

export default OperatorSelector;