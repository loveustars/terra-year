import { useState, useMemo, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTerraData } from './hooks/useTerraData';
import Timeline from './components/Timeline';
import EventBackground from './components/EventBackground';
import GraphCanvas from './components/GraphCanvas';
import OperatorSelector from './components/OperatorSelector';
import RelationPanel from './components/RelationPanel';
import AvatarRelationPopup from './components/AvatarRelationPopup';
import type { LangKey, TerraEvent, OperatorRelation } from './hooks/useTerraData';

type SingleRelationDetail = {
  relation: OperatorRelation;
  sourceOp: import('./hooks/useTerraData').Operator;
  targetOp: import('./hooks/useTerraData').Operator;
  event: TerraEvent;
};

function App() {
  const {
    operators, events, operatorStates,
    loading, error, yearRange,
    getOperatorById,
    getOperatorState, relations,
  } = useTerraData();

  const [lang, setLang] = useState<LangKey>('zh_CN');
  const [currentEvent, setCurrentEvent] = useState<TerraEvent | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  const currentEventIndex = useMemo(() => {
    if (!currentEvent) return -1;
    return events.findIndex(e => e.id === currentEvent.id);
  }, [currentEvent, events]);

  /** 已在左侧面板勾选的干员 */
  const [selectedOpIds, setSelectedOpIds] = useState<Set<string>>(new Set());

  const getCumulativeOperatorIds = useCallback((event: TerraEvent | null) => {
    if (!event) return new Set<string>();
    const eventIndex = events.findIndex(e => e.id === event.id);
    if (eventIndex < 0) return new Set<string>();
    const earlierEventIds = events.slice(0, eventIndex + 1).map(e => e.id);
    const ids = new Set<string>();
    relations
      .filter(r => earlierEventIds.includes(r.first_appear_event_id || r.associated_event_id))
      .forEach(r => {
        if (getOperatorById(r.source)) ids.add(r.source);
        if (getOperatorById(r.target)) ids.add(r.target);
      });
    return ids;
  }, [events, getOperatorById, relations]);

  useEffect(() => {
    if (!currentEvent && events.length > 0 && !loading && !error) {
      setCurrentEvent(events[0]);
      setSelectedOpIds(getCumulativeOperatorIds(events[0]));
    }
  }, [currentEvent, error, events, getCumulativeOperatorIds, loading]);

  const toggleOperator = useCallback((id: string) => {
    setSelectedOpIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectOperators = useCallback((ids: string[]) => {
    setSelectedOpIds(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.add(id));
      return next;
    });
  }, []);

  const deselectOperators = useCallback((ids: string[]) => {
    setSelectedOpIds(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.delete(id));
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedOpIds(getCumulativeOperatorIds(currentEvent));
  }, [currentEvent, getCumulativeOperatorIds]);

  const deselectAll = useCallback(() => setSelectedOpIds(new Set()), []);

  /** 当前事件在关系网中展示的干员 + 当前事件前（包括当前）所有章节的关系（树形生长） */
  const graphData = useMemo(() => {
    if (!currentEvent) return { operators: [] as typeof operators, relations: [] as OperatorRelation[] };

    if (currentEventIndex < 0) return { operators: [] as typeof operators, relations: [] as OperatorRelation[] };

    // 收集当前事件及之前所有章节的关系（树形生长）
    const earlierEventIds = events.slice(0, currentEventIndex + 1).map(e => e.id);
    const cumulativeRels = relations.filter(r => earlierEventIds.includes(r.first_appear_event_id || r.associated_event_id));

    const filtered = cumulativeRels.filter(r => selectedOpIds.has(r.source) && selectedOpIds.has(r.target));
    const opIds = new Set<string>();
    filtered.forEach(r => { opIds.add(r.source); opIds.add(r.target); });
    const graphOps = Array.from(opIds)
      .map(id => getOperatorById(id))
      .filter((op): op is NonNullable<typeof op> => op !== undefined);
    return { operators: graphOps, relations: filtered };
  }, [currentEvent, currentEventIndex, selectedOpIds, getOperatorById, relations, events]);

  /** 当前年份（用于取干员状态） */
  const currentYear = useMemo(() => {
    if (!currentEvent) return 1096;
    const s = currentEvent.terran_year_start;
    const e = currentEvent.terran_year_end;
    if (s === 'unknown' || e === 'unknown') return 1096;
    return Math.floor((s + e) / 2);
  }, [currentEvent]);

  /** 干员状态 Map（按当前年份） */
  const operatorStatuses = useMemo(() => {
    const map = new Map<string, { status: string; reason?: string }>();
    for (const op of graphData.operators) {
      const state = getOperatorState(op.id, currentYear, currentEvent?.id);
      if (state && state.status !== 'alive') {
        map.set(op.id, {
          status: state.status,
          reason: state.reason?.[lang] ?? state.reason?.zh_CN,
        });
      }
    }
    return map;
  }, [currentEvent?.id, graphData.operators, currentYear, getOperatorState, lang]);

  /* ---- 事件切换 ---- */
  const handleSelectEvent = useCallback((event: TerraEvent) => {
    setCurrentEvent(event);
    setSelectedOpIds(getCumulativeOperatorIds(event));
    setSelectedRelations([]);
    setAvatarPopup(null);
    if (!hasInteracted) setHasInteracted(true);
  }, [getCumulativeOperatorIds, hasInteracted]);

  /* ---- 点击头像：显示迷你弹出面板（头像下方跟随出现） ---- */
  const [selectedRelations, setSelectedRelations] = useState<OperatorRelation[]>([]);
  /** 头像点击时传入的 Operator（用于 RelationPanel 标题） */
  const [selectedPanelOperator, setSelectedPanelOperator] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [avatarPopup, setAvatarPopup] = useState<{
    relations: SingleRelationDetail[];
    rect: DOMRect;
  } | null>(null);
  const handleToggleDetail = useCallback((show: boolean) => { setShowDetail(show); }, []);

  const handleSelectOperator = useCallback((
    operatorId: string | null,
  ) => {
    if (!operatorId) {
      setSelectedRelations([]);
      setAvatarPopup(null);
      setSelectedPanelOperator(null);
      return;
    }
    // 显示该干员在当前事件及之前所有章节中的关系（树形生长）
    const earlierEventIds = currentEventIndex >= 0 ? events.slice(0, currentEventIndex + 1).map(e => e.id) : [];
    const cumulativeRels = relations.filter(r =>
      earlierEventIds.includes(r.first_appear_event_id || r.associated_event_id) &&
      (r.source === operatorId || r.target === operatorId)
    );
    // Always show the right-side RelationPanel when avatar is clicked (never small popup)
    setSelectedRelations(cumulativeRels);
    setSelectedPanelOperator(operatorId);
    setAvatarPopup(null);
  }, [currentEventIndex, events, relations]);

  const handleCloseRelations = useCallback(() => {
    setSelectedRelations([]);
    setAvatarPopup(null);
    setSelectedPanelOperator(null);
  }, []);

  /* ---- 关系详情数据 ---- */
  const relationDetails = useMemo(() => {
    if (!currentEvent) return [];
    // 用 selectedPanelOperator 确定标题显示哪个干员的名字
    const titleOp = selectedPanelOperator ? getOperatorById(selectedPanelOperator) : null;
    return selectedRelations.map(r => {
      const src = getOperatorById(r.source);
      const tgt = getOperatorById(r.target);
      if (!src || !tgt) return null;
      return { relation: r, sourceOp: src, targetOp: tgt, event: currentEvent, titleOp };
    }).filter(Boolean) as Array<{
      relation: OperatorRelation;
      sourceOp: NonNullable<ReturnType<typeof getOperatorById>>;
      targetOp: NonNullable<ReturnType<typeof getOperatorById>>;
      event: TerraEvent;
      titleOp: NonNullable<ReturnType<typeof getOperatorById>>;
    }>;
  }, [selectedRelations, currentEvent, getOperatorById, selectedPanelOperator]);

  const showWelcome = !currentEvent && !hasInteracted && !loading && !error;

  /** 当前事件及之前所有章节的干员（用于左侧面板，树形生长） */
  const allEventOperators = useMemo(() => {
    if (!currentEvent) return [];
    if (currentEventIndex < 0) return [];
    const earlierEventIds = events.slice(0, currentEventIndex + 1).map(e => e.id);
    const cumulativeRels = relations.filter(r => earlierEventIds.includes(r.first_appear_event_id || r.associated_event_id));
    const opIds = new Set<string>();
    cumulativeRels.forEach(r => { opIds.add(r.source); opIds.add(r.target); });
    return Array.from(opIds)
      .map(id => getOperatorById(id))
      .filter((op): op is NonNullable<typeof op> => op !== undefined);
  }, [currentEvent, currentEventIndex, getOperatorById, relations, events]);

  return (
    <div className="relative w-full h-screen overflow-hidden arknights-grid" style={{ backgroundColor: '#0a0a0a' }}>

      {/* 第1层：背景 */}
      <div className="absolute inset-0 z-0">
        <EventBackground event={currentEvent} lang={lang} />
      </div>

      {/* 第2层：干员选择面板（使用 allEventOperators 而非 graphData.operators） */}
      {currentEvent && (
        <OperatorSelector
          allEventOperators={allEventOperators}
          selectedIds={selectedOpIds}
          onToggle={toggleOperator}
          onSelectAll={selectAll}
          onDeselectAll={deselectAll}
          onSelectIds={selectOperators}
          onDeselectIds={deselectOperators}
          lang={lang}
          currentEvent={currentEvent}
        />
      )}

      {/* 第3层：语言切换 */}
      <div className="absolute top-4 right-6 z-30 flex items-center space-x-3 font-mono">
        <AnimatePresence>
          {currentEvent && (
            <motion.div className="text-[9px] tracking-[0.15em]"
              style={{ color: 'rgba(255,255,255,0.2)' }}
              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
              {typeof currentEvent.terran_year_start === 'number'
                ? `${currentEvent.terran_year_start} TY` : '? TY'}
            </motion.div>
          )}
        </AnimatePresence>
        <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.08)' }}>|</span>
        <button onClick={() => setLang('zh_CN')} className="text-[10px] tracking-[0.1em] transition-colors"
          style={{ color: lang === 'zh_CN' ? '#f2a104' : 'rgba(255,255,255,0.25)' }}>[ ZH ]</button>
        <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.08)' }}>|</span>
        <button onClick={() => setLang('en_US')} className="text-[10px] tracking-[0.1em] transition-colors"
          style={{ color: lang === 'en_US' ? '#f2a104' : 'rgba(255,255,255,0.25)' }}>[ EN ]</button>
      </div>

      {/* 第4层：主内容 */}
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        {loading && (
          <div className="font-mono text-xs tracking-widest animate-pulse" style={{ color: 'rgba(255,255,255,0.3)' }}>
            &gt; LOADING_DATA...
          </div>
        )}
        {error && (
          <div className="max-w-md p-4 text-sm font-mono border"
            style={{ backgroundColor: 'rgba(255,50,50,0.05)', borderColor: 'rgba(255,50,50,0.2)', color: '#ff6b6b',
              clipPath: 'polygon(0 0, 92% 0, 100% 12%, 100% 100%, 8% 100%, 0 88%)' }}>
            <div className="text-[10px] tracking-[0.2em] mb-1" style={{ color: 'rgba(255,50,50,0.5)' }}>&gt; ERROR</div>
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {showWelcome && (
            <motion.div key="welcome" className="relative max-w-lg w-full text-center px-6 py-8"
              style={{
                backgroundColor: 'rgba(18,18,18,0.85)', backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.06)',
                clipPath: 'polygon(0 0, 92% 0, 100% 8%, 100% 100%, 8% 100%, 0 92%)',
              }}
              initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }} transition={{ duration: 0.4 }}>
              <h1 className="text-3xl sm:text-4xl font-black tracking-[0.15em] font-mono" style={{ color: '#f2a104' }}>
                TERRA-YEAR
              </h1>
              <h2 className="text-[10px] tracking-[0.25em] font-mono mt-1 mb-5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                CHRONO-RELATIONS CHART
              </h2>
              <div className="w-16 h-px mx-auto mb-5" style={{ backgroundColor: 'rgba(242,161,4,0.3)' }} />
              <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto mb-5">
                {[{v: operators.length, l:'Operators'},{v: events.length, l:'Events'},{v: operatorStates.length, l:'State Changes'}].map((s,i)=>(
                  <div key={i}>
                    <div className="text-lg font-mono font-bold" style={{color:'#f5f5f5'}}>{s.v}</div>
                    <div className="text-[8px] font-mono tracking-[0.15em] uppercase" style={{color:'rgba(255,255,255,0.25)'}}>{s.l}</div>
                  </div>
                ))}
              </div>
              <div className="text-left text-[10px] font-mono leading-relaxed p-3 space-y-1"
                style={{backgroundColor:'rgba(0,0,0,0.3)',border:'1px dashed rgba(255,255,255,0.06)'}}>
                <div style={{color:'rgba(255,255,255,0.2)'}}>&gt; STACK: React 18 / Vite 4 / Tailwind v3</div>
                <div style={{color:'rgba(255,255,255,0.2)'}}>&gt; TIMELINE: {events.length} events spanning {yearRange[0]}–{yearRange[1]} TY</div>
                <div style={{color:'rgba(255,255,255,0.2)'}}>&gt; SELECT OPERATORS via the left panel, then explore relations</div>
                <div className="animate-pulse" style={{color:'rgba(242,161,4,0.6)'}}>&gt; STATUS: SYSTEM_READY</div>
              </div>
              <p className="mt-6 text-[9px] font-mono tracking-[0.15em]" style={{color:'rgba(255,255,255,0.12)'}}>
                ↓ SELECT AN EVENT ON THE TIMELINE BELOW
              </p>
            </motion.div>
          )}

          {currentEvent && (
            <motion.div key="graph" className="w-full h-full flex items-center justify-center"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
              {graphData.operators.length > 0 ? (
                <GraphCanvas
                  operators={graphData.operators}
                  relations={graphData.relations}
                  operatorStatuses={operatorStatuses}
                  currentEvent={currentEvent}
                  lang={lang}
                  onSelectOperator={handleSelectOperator}
                />
              ) : (
                <div className="text-center font-mono" style={{color:'rgba(255,255,255,0.15)'}}>
                  <div className="text-[10px] tracking-[0.2em]">&gt; NO_OPERATORS_SELECTED</div>
                  <div className="text-[9px] mt-2 tracking-[0.15em]" style={{color:'rgba(255,255,255,0.08)'}}>
                    SELECT OPERATORS FROM THE LEFT PANEL
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 第5层：头像弹出面板（头像下方跟随出现，与 OperatorSelector 等大） */}
      <AnimatePresence>
        {avatarPopup && (
          <AvatarRelationPopup
            relations={avatarPopup.relations}
            lang={lang}
            avatarRect={avatarPopup.rect}
            onClose={() => {
              setAvatarPopup(null);
              setSelectedRelations([]);
              setSelectedPanelOperator(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* 第6层：关系详情面板（仅在没有头像弹出面板时显示） */}
      <AnimatePresence>
        {relationDetails.length > 0 && !avatarPopup && (
          <RelationPanel
            key="relation-panel"
            relations={relationDetails}
            lang={lang}
            onClose={handleCloseRelations}
          />
        )}
      </AnimatePresence>

      {/* 第6层：底部时间轴 */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <Timeline
          events={events}
          lang={lang}
          selectedEvent={currentEvent}
          onSelectEvent={handleSelectEvent}
          showDetail={showDetail}
          onToggleDetail={handleToggleDetail}
        />
      </div>
    </div>
  );
}

export default App;
