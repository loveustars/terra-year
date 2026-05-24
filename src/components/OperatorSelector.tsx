import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Operator as TOperator, LangKey, TerraEvent } from '../hooks/useTerraData';

type Operator = TOperator;

interface OperatorSelectorProps {
  allEventOperators: Operator[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  lang: LangKey;
  currentEvent?: TerraEvent;
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
  return FACTION_COLORS[faction] ?? 'rgba(0,0,0,0.4)';
}

const OperatorSelector: React.FC<OperatorSelectorProps> = ({
  allEventOperators,
  selectedIds,
  onToggle,
  onSelectAll,
  onDeselectAll,
  lang,
  currentEvent,
}) => {
  const [search, setSearch] = useState('');
  const [opsExpanded, setOpsExpanded] = useState(true);
  const [infoExpanded, setInfoExpanded] = useState(true);

  const filtered = useMemo(() => {
    if (!search.trim()) return allEventOperators;
    const q = search.toLowerCase();
    return allEventOperators.filter(op => {
      const name = (op.display_name[lang] ?? op.display_name.zh_CN ?? '').toLowerCase();
      return name.includes(q);
    });
  }, [allEventOperators, search, lang]);

  return (
    <div className="absolute top-20 left-6 z-30 w-72 flex flex-col gap-4">
      {/* 角色选择界面改为当前高度的一半 */}
      <div 
        className="flex flex-col flex-shrink-0 transition-all duration-300"
        style={{
          backgroundColor: '#fcfcfc',
          border: '1px solid rgba(0,0,0,0.1)',
          clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
          boxShadow: '-4px 4px 15px rgba(0,0,0,0.1)',
          maxHeight: opsExpanded ? 'min(400px, 40vh)' : '45px'
        }}
      >
        <div 
          className="flex items-center justify-between px-4 py-2 cursor-pointer bg-[#e0e0e0] select-none"
          onClick={() => setOpsExpanded(!opsExpanded)}
        >
          <span className="text-[11px] font-black tracking-widest text-[#222] uppercase">
            OPERATORS
          </span>
          <span className="text-[9px] font-bold text-[#888]">
            {opsExpanded ? '[ - ]' : '[ + ]'}
          </span>
        </div>

        <AnimatePresence>
          {opsExpanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} 
              animate={{ height: 'auto', opacity: 1 }} 
              exit={{ height: 0, opacity: 0 }} 
              className="flex flex-col flex-1 overflow-hidden"
            >
              <div className="px-3 pt-2 pb-2 border-b border-[#ccc] bg-[#f0f0f0] shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-[#555] tracking-widest">
                    SELECTED: {selectedIds.size}/{allEventOperators.length}
                  </span>
                  <div className="flex gap-1">
                    <button onClick={onSelectAll} className="text-[9px] font-black px-1.5 py-0.5 border border-[#999] text-[#444] bg-white hover:bg-[#ddd] transition-colors">ALL</button>
                    <button onClick={onDeselectAll} className="text-[9px] font-black px-1.5 py-0.5 border border-[#999] text-[#444] bg-white hover:bg-[#ddd] transition-colors">NONE</button>
                  </div>
                </div>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="SEARCH..."
                  className="w-full bg-white text-[10px] font-mono px-2 py-1.5 border border-[#bbb] outline-none text-[#333]"
                />
              </div>

              <div className="flex-1 overflow-y-auto bg-white p-2" style={{ scrollbarWidth: 'thin' }}>
                {filtered.map(op => {
                  const name = op.display_name[lang] ?? op.display_name.zh_CN ?? op.id;
                  const isSelected = selectedIds.has(op.id);
                  const factionColor = getFactionColor(op.faction);
                  return (
                    <button
                      key={op.id}
                      onClick={() => onToggle(op.id)}
                      className="w-full flex items-center gap-2 px-2 py-1 text-left transition-colors mb-0.5"
                      style={{ backgroundColor: isSelected ? 'rgba(242,161,4,0.15)' : 'transparent' }}
                    >
                      <div className="w-1.5 h-1.5 flex-shrink-0" style={{ backgroundColor: isSelected ? '#f2a104' : '#ccc' }} />
                      <span className="text-[11px] font-bold truncate text-[#111]">{name}</span>
                      <span className="text-[8px] font-bold ml-auto uppercase flex-shrink-0" style={{ color: factionColor }}>
                        {op.faction.slice(0, 4)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 章节内容简要说明 */}
      {currentEvent && (
        <div 
          className="flex flex-col flex-shrink-0 transition-all duration-300"
          style={{
            backgroundColor: '#fcfcfc',
            border: '1px solid rgba(0,0,0,0.1)',
            clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
            boxShadow: '-4px 4px 15px rgba(0,0,0,0.1)',
            maxHeight: infoExpanded ? 'min(400px, 40vh)' : '45px'
          }}
        >
          <div 
            className="flex items-center justify-between px-4 py-2 cursor-pointer bg-[#e0e0e0] select-none"
            onClick={() => setInfoExpanded(!infoExpanded)}
          >
            <span className="text-[11px] font-black tracking-widest text-[#222] uppercase">
              CHAPTER INFO
            </span>
            <span className="text-[9px] font-bold text-[#888]">
              {infoExpanded ? '[ - ]' : '[ + ]'}
            </span>
          </div>

          <AnimatePresence>
            {infoExpanded && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }} 
                animate={{ height: 'auto', opacity: 1 }} 
                exit={{ height: 0, opacity: 0 }} 
                className="flex flex-col overflow-hidden"
              >
                <div className="p-4 bg-white overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                  <div className="text-[10px] uppercase font-bold text-[#f2a104] mb-1">
                    {currentEvent.id}
                  </div>
                  <h3 className="text-xl font-black text-[#1a1a1a] mb-2 leading-tight">
                    {currentEvent.title[lang] ?? currentEvent.title.zh_CN}
                  </h3>
                  <div className="text-xs text-[#555] font-medium leading-relaxed bg-[#f9f9f9] p-2 border-l-[3px] border-[#999]">
                    {currentEvent.brief?.[lang] ?? currentEvent.brief?.zh_CN ?? "No description available."}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default OperatorSelector;
