import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { useIsMobile } from '../hooks/useIsMobile';
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

/* ---- 共享内容组件 ---- */
const OperatorListContent: React.FC<{
  allEventOperators: Operator[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onSelectIds: (ids: string[]) => void;
  onDeselectIds: (ids: string[]) => void;
  search: string;
  setSearch: (v: string) => void;
  collapsedFactions: Set<string>;
  toggleFaction: (f: string) => void;
  grouped: { faction: string; ops: Operator[] }[];
  lang: LangKey;
  onToggleCollapse: () => void;
  opsExpanded: boolean;
  onClose?: () => void;
}> = ({
  allEventOperators, selectedIds, onToggle, onSelectAll, onDeselectAll,
  onSelectIds, onDeselectIds, search, setSearch,
  collapsedFactions, toggleFaction, grouped, lang,
  onToggleCollapse, opsExpanded, onClose,
}) => (
  <>
    <div className="flex items-center justify-between px-4 py-2 bg-[#e0e0e0] select-none">
      <button
        type="button"
        className="text-[11px] font-black tracking-widest text-[#222] uppercase cursor-move"
        onClick={onToggleCollapse}
      >
        OPERATORS
      </button>
      <button type="button" className="text-[9px] font-bold text-[#888]" onClick={onToggleCollapse}>
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
                    <button type="button" onClick={() => toggleFaction(faction)} className="text-[9px] font-black text-[#555] w-5">
                      {collapsed ? '[+]' : '[-]'}
                    </button>
                    <span className="h-2 w-2 flex-shrink-0" style={{ backgroundColor: factionColor }} />
                    <span className="min-w-0 flex-1 truncate text-[10px] font-black uppercase tracking-wider text-[#222]">
                      {getFactionLabel(faction, lang)}
                    </span>
                    <span className="text-[9px] font-mono text-[#777]">{selectedInGroup}/{ops.length}</span>
                    <button type="button" onClick={() => onSelectIds(ops.map(op => op.id))} className="text-[8px] font-black px-1 py-0.5 border border-[#aaa] bg-white text-[#444]">ALL</button>
                    <button type="button" onClick={() => onDeselectIds(ops.map(op => op.id))} className="text-[8px] font-black px-1 py-0.5 border border-[#aaa] bg-white text-[#444]">NONE</button>
                  </div>
                  {!collapsed && (
                    <div className="py-1">
                      {ops.map(op => {
                        const name = op.display_name[lang] ?? op.display_name.zh_CN ?? op.id;
                        const isSelected = selectedIds.has(op.id);
                        return (
                          <button
                            key={op.id}
                            onClick={() => { onToggle(op.id); onClose?.(); }}
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
  </>
);

/* ---- 桌面端面板 ---- */
const DesktopPanel: React.FC<OperatorSelectorProps & {
  search: string; setSearch: (v: string) => void;
  opsExpanded: boolean; setOpsExpanded: (v: boolean) => void;
  infoExpanded: boolean; setInfoExpanded: (v: boolean) => void;
  collapsedFactions: Set<string>; toggleFaction: (f: string) => void;
  grouped: { faction: string; ops: Operator[] }[];
  dragControls: ReturnType<typeof useDragControls>;
}> = ({ currentEvent, lang, dragControls, ...props }) => (
  <motion.div
    drag
    dragControls={dragControls}
    dragListener={false}
    dragMomentum={false}
    className="absolute top-48 left-6 z-30 w-80 flex flex-col gap-4"
  >
    <div
      className="flex flex-col flex-shrink-0 transition-all duration-300"
      style={{
        backgroundColor: '#fcfcfc',
        border: '1px solid rgba(0,0,0,0.1)',
        clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
        boxShadow: '-4px 4px 15px rgba(0,0,0,0.1)',
        maxHeight: props.opsExpanded ? 'min(560px, 58vh)' : '45px',
      }}
    >
      <OperatorListContent
        allEventOperators={props.allEventOperators}
        selectedIds={props.selectedIds}
        onToggle={props.onToggle}
        onSelectAll={props.onSelectAll}
        onDeselectAll={props.onDeselectAll}
        onSelectIds={props.onSelectIds}
        onDeselectIds={props.onDeselectIds}
        search={props.search}
        setSearch={props.setSearch}
        collapsedFactions={props.collapsedFactions}
        toggleFaction={props.toggleFaction}
        grouped={props.grouped}
        lang={lang}
        onToggleCollapse={() => props.setOpsExpanded(!props.opsExpanded)}
        opsExpanded={props.opsExpanded}
      />
    </div>
    {currentEvent && (
      <div
        className="flex flex-col flex-shrink-0 transition-all duration-300"
        style={{
          backgroundColor: '#fcfcfc',
          border: '1px solid rgba(0,0,0,0.1)',
          clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
          boxShadow: '-4px 4px 15px rgba(0,0,0,0.1)',
          maxHeight: props.infoExpanded ? 'min(260px, 30vh)' : '45px',
        }}
      >
        <div className="flex items-center justify-between px-4 py-2 bg-[#e0e0e0] select-none">
          <span className="text-[11px] font-black tracking-widest text-[#222] uppercase">CHAPTER INFO</span>
          <button type="button" className="text-[9px] font-bold text-[#888]" onClick={() => props.setInfoExpanded(!props.infoExpanded)}>
            {props.infoExpanded ? '[ - ]' : '[ + ]'}
          </button>
        </div>
        <AnimatePresence>
          {props.infoExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex flex-col overflow-hidden"
            >
              <div className="p-4 bg-white overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                <div className="text-[10px] uppercase font-bold text-[#00c2ff] mb-1">{currentEvent.id}</div>
                <h3 className="text-xl font-black text-[#1a1a1a] mb-2 leading-tight">{currentEvent.title[lang] ?? currentEvent.title.zh_CN}</h3>
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

/* ---- 移动端抽屉 ---- */
const MobileDrawer: React.FC<OperatorSelectorProps & {
  drawerOpen: boolean; setDrawerOpen: (v: boolean) => void;
  search: string; setSearch: (v: string) => void;
  opsExpanded: boolean; setOpsExpanded: (v: boolean) => void;
  infoExpanded: boolean; setInfoExpanded: (v: boolean) => void;
  collapsedFactions: Set<string>; toggleFaction: (f: string) => void;
  grouped: { faction: string; ops: Operator[] }[];
  lang: LangKey;
}> = (props) => (
  <>
    <AnimatePresence>
      {!props.drawerOpen && (
        <motion.button
          type="button"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="absolute top-6 left-6 z-30 flex items-center gap-2 px-4 py-2.5 text-[10px] font-black tracking-widest bg-[#00c2ff] text-white"
          style={{ clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)' }}
          onClick={() => props.setDrawerOpen(true)}
        >
          OPERATORS ▾
        </motion.button>
      )}
    </AnimatePresence>
    <AnimatePresence>
      {props.drawerOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => props.setDrawerOpen(false)}
          />
          <motion.div
            initial={{ x: -340 }}
            animate={{ x: 0 }}
            exit={{ x: -340 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 bottom-0 z-50 w-[85vw] max-w-[340px] flex flex-col gap-4 p-4 overflow-y-auto"
            style={{ backgroundColor: 'rgba(10,10,10,0.97)', backdropFilter: 'blur(16px)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-black tracking-widest text-[#00c2ff] uppercase">OPERATORS</span>
              <button onClick={() => props.setDrawerOpen(false)} className="text-[11px] font-bold text-white/40">[ × ]</button>
            </div>
            <div className="flex flex-col flex-1 gap-4">
              <div
                className="flex flex-col flex-shrink-0 transition-all duration-300"
                style={{
                  backgroundColor: '#fcfcfc',
                  border: '1px solid rgba(0,0,0,0.1)',
                  clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
                  maxHeight: props.opsExpanded ? '50vh' : '45px',
                }}
              >
                <OperatorListContent
                  allEventOperators={props.allEventOperators}
                  selectedIds={props.selectedIds}
                  onToggle={props.onToggle}
                  onSelectAll={props.onSelectAll}
                  onDeselectAll={props.onDeselectAll}
                  onSelectIds={props.onSelectIds}
                  onDeselectIds={props.onDeselectIds}
                  search={props.search}
                  setSearch={props.setSearch}
                  collapsedFactions={props.collapsedFactions}
                  toggleFaction={props.toggleFaction}
                  grouped={props.grouped}
                  lang={props.lang}
                  onToggleCollapse={() => props.setOpsExpanded(!props.opsExpanded)}
                  opsExpanded={props.opsExpanded}
                  onClose={() => props.setDrawerOpen(false)}
                />
              </div>
              {props.currentEvent && (
                <div
                  className="flex flex-col flex-shrink-0 transition-all duration-300"
                  style={{
                    backgroundColor: '#fcfcfc',
                    border: '1px solid rgba(0,0,0,0.1)',
                    clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
                    maxHeight: props.infoExpanded ? '30vh' : '45px',
                  }}
                >
                  <div className="flex items-center justify-between px-4 py-2 bg-[#e0e0e0] select-none">
                    <span className="text-[11px] font-black tracking-widest text-[#222] uppercase">CHAPTER INFO</span>
                    <button type="button" className="text-[9px] font-bold text-[#888]" onClick={() => props.setInfoExpanded(!props.infoExpanded)}>
                      {props.infoExpanded ? '[ - ]' : '[ + ]'}
                    </button>
                  </div>
                  <AnimatePresence>
                    {props.infoExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="flex flex-col overflow-hidden"
                      >
                        <div className="p-4 bg-white overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                          <div className="text-[10px] uppercase font-bold text-[#00c2ff] mb-1">{props.currentEvent.id}</div>
                          <h3 className="text-xl font-black text-[#1a1a1a] mb-2 leading-tight">{props.currentEvent.title[props.lang] ?? props.currentEvent.title.zh_CN}</h3>
                          <div className="text-xs text-[#555] font-medium leading-relaxed bg-[#f9f9f9] p-2 border-l-[3px] border-[#999]">
                            {props.currentEvent.brief?.[props.lang] ?? props.currentEvent.brief?.zh_CN ?? 'No description available.'}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  </>
);

const OperatorSelector: React.FC<OperatorSelectorProps> = (props) => {
  const dragControls = useDragControls();
  const [search, setSearch] = useState('');
  const [opsExpanded, setOpsExpanded] = useState(false);
  const [infoExpanded, setInfoExpanded] = useState(true);
  const [collapsedFactions, setCollapsedFactions] = useState<Set<string>>(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isMobile = useIsMobile();

  const filtered = useMemo(() => {
    if (!search.trim()) return props.allEventOperators;
    const q = search.toLowerCase();
    return props.allEventOperators.filter(op => {
      const localName = op.display_name[props.lang] ?? op.display_name.zh_CN ?? '';
      const zhName = op.display_name.zh_CN ?? '';
      const enName = op.display_name.en_US ?? '';
      return `${localName} ${zhName} ${enName} ${Array.isArray(op.faction) ? op.faction.join(',') : op.faction}`.toLowerCase().includes(q);
    });
  }, [props.allEventOperators, search, props.lang]);

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
          (a.display_name[props.lang] ?? a.display_name.zh_CN).localeCompare(b.display_name[props.lang] ?? b.display_name.zh_CN),
        ),
      }))
      .sort((a, b) => b.ops.length - a.ops.length || getFactionLabel(a.faction, props.lang).localeCompare(getFactionLabel(b.faction, props.lang)));
  }, [filtered, props.lang]);

  const toggleFaction = (faction: string) => {
    setCollapsedFactions(prev => {
      const next = new Set(prev);
      if (next.has(faction)) next.delete(faction);
      else next.add(faction);
      return next;
    });
  };

  if (isMobile) {
    return (
      <MobileDrawer
        {...props}
        drawerOpen={drawerOpen}
        setDrawerOpen={setDrawerOpen}
        search={search}
        setSearch={setSearch}
        opsExpanded={opsExpanded}
        setOpsExpanded={setOpsExpanded}
        infoExpanded={infoExpanded}
        setInfoExpanded={setInfoExpanded}
        collapsedFactions={collapsedFactions}
        toggleFaction={toggleFaction}
        grouped={grouped}
        lang={props.lang}
      />
    );
  }

  return (
    <DesktopPanel
      {...props}
      dragControls={dragControls}
      search={search}
      setSearch={setSearch}
      opsExpanded={opsExpanded}
      setOpsExpanded={setOpsExpanded}
      infoExpanded={infoExpanded}
      setInfoExpanded={setInfoExpanded}
      collapsedFactions={collapsedFactions}
      toggleFaction={toggleFaction}
      grouped={grouped}
      lang={props.lang}
    />
  );
};

export default OperatorSelector;