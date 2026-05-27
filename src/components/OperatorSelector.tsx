import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import type { Operator as TOperator, LangKey, TerraEvent } from '../hooks/useTerraData';

type Operator = TOperator;

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

const FACTION_COLORS: Record<string, string> = {
  rhodes_island:     '#00a7c7',
  penguin_logistics: '#5dade2',
  lungmen:           '#00c2ff',
  yan:               '#c84a31',
  babel:             '#8e44ad',
  leithanien:        '#7a65c7',
  rim:               '#3d8b8b',
  siracusa:          '#795548',
  laterano:          '#e8c44a',
  abyss:             '#2a8d9f',
  iberia:            '#c0392b',
  talar:             '#8b4513',
  victoria:          '#b84d85',
  sami:              '#4f8fda',
  sargon:            '#9a7b36',
  bolivar:           '#5d8a50',
  ursus:             '#2c5aa0',
  kazimierz:         '#d4af37',
  columbia:          '#3498db',
  minos:             '#9b59b6',
  reunion:           '#e74c3c',
  deeppool:          '#1a5c5c',
  kazimierz_mc:      '#c0392b',
  dongguo:           '#d35400',
  unknown:           '#777',
};

const FACTION_LABELS: Record<string, Partial<Record<LangKey, string>>> = {
  rhodes_island:     { zh_CN: '罗德岛',              en_US: 'Rhodes Island' },
  penguin_logistics:  { zh_CN: '企鹅物流',            en_US: 'Penguin Logistics' },
  lungmen:            { zh_CN: '龙门',                en_US: 'Lungmen' },
  yan:                { zh_CN: '炎国',                en_US: 'Yan' },
  babel:              { zh_CN: '巴别塔',              en_US: 'Babel' },
  leithanien:         { zh_CN: '莱塔尼亚',            en_US: 'Leithanien' },
  rim:                { zh_CN: '雷姆必拓',            en_US: 'Rhodes Hill' },
  siracusa:           { zh_CN: '叙拉古',             en_US: 'Siracusa' },
  laterano:           { zh_CN: '拉特兰',             en_US: 'Laterano' },
  abyss:              { zh_CN: '阿戈尔',              en_US: 'Abyss' },
  iberia:             { zh_CN: '伊比利亚',            en_US: 'Iberia' },
  talar:              { zh_CN: '塔拉',                en_US: 'Talar' },
  victoria:           { zh_CN: '维多利亚',            en_US: 'Victoria' },
  sami:               { zh_CN: '谢拉格',             en_US: 'Kjerag' },
  sargon:             { zh_CN: '萨尔贡',             en_US: 'Sargon' },
  bolivar:            { zh_CN: '玻利瓦尔',            en_US: 'Bolivar' },
  ursus:              { zh_CN: '乌萨斯',              en_US: 'Ursus' },
  kazimierz:          { zh_CN: '卡西米尔',            en_US: 'Kazimierz' },
  columbia:           { zh_CN: '哥伦比亚',            en_US: 'Columbia' },
  minos:              { zh_CN: '米诺斯',             en_US: 'Minos' },
  reunion:            { zh_CN: '整合运动',            en_US: 'Reunion' },
  deeppool:           { zh_CN: '深海教会',            en_US: 'Deeppool' },
  kazimierz_mc:       { zh_CN: '卡兹戴尔军事委员会', en_US: 'Kazimierz MC' },
  dongguo:            { zh_CN: '东国',                en_US: 'Dongguo' },
  unknown:            { zh_CN: '未知',                en_US: 'Unknown' },
};

function getFactionColor(faction: string): string {
  return FACTION_COLORS[faction] ?? '#777';
}

function getFactionLabel(faction: string, lang: LangKey): string {
  return FACTION_LABELS[faction]?.[lang] ?? faction;
}

const OperatorSelector: React.FC<OperatorSelectorProps> = ({
  allEventOperators,
  selectedIds,
  onToggle,
  onSelectAll,
  onDeselectAll,
  onSelectIds,
  onDeselectIds,
  lang,
  currentEvent,
}) => {
  const dragControls = useDragControls();
  const [search, setSearch] = useState('');
  const [opsExpanded, setOpsExpanded] = useState(true);
  const [infoExpanded, setInfoExpanded] = useState(true);
  const [collapsedFactions, setCollapsedFactions] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    if (!search.trim()) return allEventOperators;
    const q = search.toLowerCase();
    return allEventOperators.filter(op => {
      const localName = op.display_name[lang] ?? op.display_name.zh_CN ?? '';
      const zhName = op.display_name.zh_CN ?? '';
      const enName = op.display_name.en_US ?? '';
      return `${localName} ${zhName} ${enName} ${Array.isArray(op.faction) ? op.faction.join(',') : op.faction}`.toLowerCase().includes(q);
    });
  }, [allEventOperators, search, lang]);

  const grouped = useMemo(() => {
    const groups = new Map<string, Operator[]>();
    for (const op of filtered) {
      const factions = (Array.isArray(op.faction) ? op.faction : [op.faction || 'unknown']);
      for (const faction of factions) {
        if (!groups.has(faction)) groups.set(faction, []);
        groups.get(faction)!.push(op);
      }
    }
    return Array.from(groups.entries())
      .map(([faction, ops]) => ({
        faction,
        ops: [...ops].sort((a, b) =>
          (a.display_name[lang] ?? a.display_name.zh_CN).localeCompare(b.display_name[lang] ?? b.display_name.zh_CN),
        ),
      }))
      .sort((a, b) => b.ops.length - a.ops.length || getFactionLabel(a.faction, lang).localeCompare(getFactionLabel(b.faction, lang)));
  }, [filtered, lang]);

  const toggleFaction = (faction: string) => {
    setCollapsedFactions(prev => {
      const next = new Set(prev);
      if (next.has(faction)) next.delete(faction);
      else next.add(faction);
      return next;
    });
  };

  return (
    <motion.div
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      className="absolute top-20 left-6 z-30 w-80 flex flex-col gap-4"
    >
      <div
        className="flex flex-col flex-shrink-0 transition-all duration-300"
        style={{
          backgroundColor: '#fcfcfc',
          border: '1px solid rgba(0,0,0,0.1)',
          clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
          boxShadow: '-4px 4px 15px rgba(0,0,0,0.1)',
          maxHeight: opsExpanded ? 'min(560px, 58vh)' : '45px',
        }}
      >
        <div className="flex items-center justify-between px-4 py-2 bg-[#e0e0e0] select-none">
          <button
            type="button"
            className="text-[11px] font-black tracking-widest text-[#222] uppercase cursor-move"
            onPointerDown={(e) => dragControls.start(e)}
          >
            OPERATORS
          </button>
          <button
            type="button"
            className="text-[9px] font-bold text-[#888]"
            onClick={() => setOpsExpanded(!opsExpanded)}
          >
            {opsExpanded ? '[ - ]' : '[ + ]'}
          </button>
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
                  placeholder="SEARCH NAME / FACTION..."
                  className="w-full bg-white text-[10px] font-mono px-2 py-1.5 border border-[#bbb] outline-none text-[#333]"
                />
              </div>

              <div className="flex-1 overflow-y-auto bg-white p-2" style={{ scrollbarWidth: 'thin' }}>
                {grouped.map(({ faction, ops }) => {
                  const selectedInGroup = ops.filter(op => selectedIds.has(op.id)).length;
                  const collapsed = collapsedFactions.has(faction);
                  const factionColor = getFactionColor(faction);
                  return (
                    <div key={faction} className="mb-2 border border-[#e2e2e2] bg-[#fafafa]">
                      <div className="flex items-center gap-2 px-2 py-1.5 bg-[#eeeeee]">
                        <button
                          type="button"
                          onClick={() => toggleFaction(faction)}
                          className="text-[9px] font-black text-[#555] w-5"
                        >
                          {collapsed ? '[+]' : '[-]'}
                        </button>
                        <span className="h-2 w-2 flex-shrink-0" style={{ backgroundColor: factionColor }} />
                        <span className="min-w-0 flex-1 truncate text-[10px] font-black uppercase tracking-wider text-[#222]">
                          {getFactionLabel(faction, lang)}
                        </span>
                        <span className="text-[9px] font-mono text-[#777]">{selectedInGroup}/{ops.length}</span>
                        <button
                          type="button"
                          onClick={() => onSelectIds(ops.map(op => op.id))}
                          className="text-[8px] font-black px-1 py-0.5 border border-[#aaa] bg-white text-[#444]"
                        >
                          ALL
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeselectIds(ops.map(op => op.id))}
                          className="text-[8px] font-black px-1 py-0.5 border border-[#aaa] bg-white text-[#444]"
                        >
                          NONE
                        </button>
                      </div>

                      {!collapsed && (
                        <div className="py-1">
                          {ops.map(op => {
                            const name = op.display_name[lang] ?? op.display_name.zh_CN ?? op.id;
                            const isSelected = selectedIds.has(op.id);
                            return (
                              <button
                                key={op.id}
                                onClick={() => onToggle(op.id)}
                                className="w-full flex items-center gap-2 px-2 py-1 text-left transition-colors"
                                style={{ backgroundColor: isSelected ? 'rgba(0,194,255,0.15)' : 'transparent' }}
                              >
                                <span className="w-1.5 h-1.5 flex-shrink-0" style={{ backgroundColor: isSelected ? '#00c2ff' : '#ccc' }} />
                                <span className="text-[11px] font-bold truncate text-[#111]">{name}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {currentEvent && (
        <div
          className="flex flex-col flex-shrink-0 transition-all duration-300"
          style={{
            backgroundColor: '#fcfcfc',
            border: '1px solid rgba(0,0,0,0.1)',
            clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
            boxShadow: '-4px 4px 15px rgba(0,0,0,0.1)',
            maxHeight: infoExpanded ? 'min(260px, 30vh)' : '45px',
          }}
        >
          <div className="flex items-center justify-between px-4 py-2 bg-[#e0e0e0] select-none">
            <button
              type="button"
              className="text-[11px] font-black tracking-widest text-[#222] uppercase cursor-move"
              onPointerDown={(e) => dragControls.start(e)}
            >
              CHAPTER INFO
            </button>
            <button
              type="button"
              className="text-[9px] font-bold text-[#888]"
              onClick={() => setInfoExpanded(!infoExpanded)}
            >
              {infoExpanded ? '[ - ]' : '[ + ]'}
            </button>
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
                  <div className="text-[10px] uppercase font-bold text-[#00c2ff] mb-1">
                    {currentEvent.id}
                  </div>
                  <h3 className="text-xl font-black text-[#1a1a1a] mb-2 leading-tight">
                    {currentEvent.title[lang] ?? currentEvent.title.zh_CN}
                  </h3>
                  <div className="text-xs text-[#555] font-medium leading-relaxed bg-[#f9f9f9] p-2 border-l-[3px] border-[#999]">
                    {currentEvent.brief?.[lang] ?? currentEvent.brief?.zh_CN ?? 'No description available.'}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};

export default OperatorSelector;
