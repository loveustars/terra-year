import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TerraEvent, LangKey } from '../hooks/useTerraData';

interface TimelineProps {
  events: TerraEvent[];
  lang: LangKey;
  selectedEvent: TerraEvent | null;
  onSelectEvent: (event: TerraEvent) => void;
  showDetail: boolean;
  onToggleDetail: (show: boolean) => void;
}

function t(str: { [key in LangKey]?: string } | undefined, lang: LangKey): string {
  if (!str) return '—';
  return str[lang] ?? str['zh_CN'] ?? '—';
}

function formatYear(year: number | 'unknown'): string {
  if (year === 'unknown') return '? TY';
  return `${Math.abs(year)} ${year < 0 ? 'BCE' : 'TY'}`;
}

/* ---- 事件详情卡 ---- */
const EventDetailCard: React.FC<{ event: TerraEvent; lang: LangKey; onClose: () => void }> = ({ event, lang, onClose }) => {
  const sy = event.terran_year_start;
  const ey = event.terran_year_end;
  const yearStr = sy === 'unknown' && ey === 'unknown'
    ? 'TIME UNKNOWN'
    : sy === 'unknown' ? `? — ${ey} TY`
    : ey === 'unknown' ? `${sy} TY — ?`
    : sy === ey ? `${sy} TY`
    : `${sy} TY — ${ey} TY`;

  return (
    <motion.div className="absolute left-0 right-0 z-50 mx-auto"
      style={{ bottom: 'calc(100% + 16px)', maxWidth: 520 }}
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.95 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <div className="relative p-5 shadow-2xl border max-h-[55vh] overflow-y-auto"
        style={{
          backgroundColor: 'rgba(18, 18, 18, 0.96)',
          backdropFilter: 'blur(12px)',
          borderColor: 'rgba(242, 161, 4, 0.2)',
          clipPath: 'polygon(0 0, 94% 0, 100% 6%, 100% 100%, 6% 100%, 0 94%)',
        }}
      >
        <button onClick={onClose}
          className="absolute top-2 right-3 text-[10px] font-mono transition-colors z-10"
          style={{ color: 'rgba(255,255,255,0.3)' }}
          onMouseEnter={e => e.currentTarget.style.color = '#f2a104'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)' }>
          [ CLOSE ]
        </button>
        <div className="text-[10px] font-mono mb-2 tracking-[0.15em]" style={{ color: '#f2a104' }}>
          {yearStr}
        </div>
        <h3 className="text-lg font-mono font-bold mb-1 tracking-wide" style={{ color: '#f5f5f5' }}>{t(event.title, lang)}</h3>
        <h4 className="text-[10px] font-mono mb-3 tracking-[0.12em] uppercase" style={{ color: 'rgba(255,255,255,0.4)' }}>{t(event.subtitle, lang)}</h4>
        <div className="w-full h-px my-3" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
        <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>{t(event.brief, lang)}</p>
        <div className="text-[9px] font-mono mt-3 pt-2 tracking-[0.08em] uppercase"
          style={{ color: 'rgba(242, 161, 4, 0.5)', borderTop: '1px dashed rgba(255,255,255,0.06)' }}>
          &gt; EVENT ID: {event.id}
          <span className="float-right">{typeof event.bg_preset === 'string' ? event.bg_preset.toUpperCase() : '—'}</span>
        </div>
      </div>
      <div className="mx-auto" style={{ width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: '8px solid rgba(242, 161, 4, 0.2)' }} />
    </motion.div>
  );
};

/* ---- 主组件：单轴章节时间轴 ---- */
const Timeline: React.FC<TimelineProps> = ({ events, lang, selectedEvent, onSelectEvent, showDetail, onToggleDetail }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const sorted = useMemo(() => [...events].sort((a, b) => {
    const ay = a.terran_year_start === 'unknown' ? 9999 : a.terran_year_start;
    const by = b.terran_year_start === 'unknown' ? 9999 : b.terran_year_start;
    return ay - by;
  }), [events]);

  // 年份范围
  const years = useMemo(() => {
    const validEvents = events.filter(e => typeof e.terran_year_start === 'number' && typeof e.terran_year_end === 'number') as Array<{terran_year_start: number; terran_year_end: number} & TerraEvent>;
    if (validEvents.length === 0) return { min: 1096, max: 1100, range: 4 };
    const min = Math.min(...validEvents.map(e => e.terran_year_start));
    const max = Math.max(...validEvents.map(e => e.terran_year_end));
    return { min, max, range: max - min || 1 };
  }, [events]);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => { el?.removeEventListener('scroll', checkScroll); };
  }, [sorted]);

  const scrollBy = (dir: 'left' | 'right') => scrollRef.current?.scrollBy({ left: dir === 'left' ? -280 : 280, behavior: 'smooth' });

  const handleNodeClick = useCallback((event: TerraEvent) => {
    onSelectEvent(event);
    onToggleDetail(true);
  }, [onSelectEvent, onToggleDetail]);

  if (events.length === 0) {
    return (
      <div className="w-full py-4 px-6 border-t text-center font-mono text-xs" style={{ borderColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>
        &gt; NO_EVENTS_LOADED
      </div>
    );
  }

  // 均匀分布：将事件沿线均匀排布，不管实际年份差距
  // 最小间距80px，最大间距200px
  const totalWidth = events.length * 140;
  const startPadding = 60;
  const getNodeX = (index: number) => startPadding + (index / Math.max(events.length - 1, 1)) * (totalWidth - startPadding * 2);

  return (
    <div className="relative w-full border-t" style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(10, 10, 10, 0.95)' }}>

      {/* 时间轴头部 */}
      <div className="flex items-center px-5 pt-2 pb-1">
        <span className="text-[10px] font-mono tracking-[0.2em] uppercase" style={{ color: 'rgba(255,255,255,0.25)' }}>&gt;&gt; TERRA-YEAR</span>
        <span className="mx-3" style={{ color: 'rgba(255,255,255,0.08)' }}>|</span>
        <span className="text-[9px] font-mono tracking-[0.15em] uppercase" style={{ color: 'rgba(242,161,4,0.5)' }}>MAINLINE CHAPTERS</span>
        <div className="flex-1" />
        <span className="text-[9px] font-mono tracking-[0.1em]" style={{ color: 'rgba(255,255,255,0.15)' }}>
          {sorted.length} CHAPTERS · {years.min}–{years.max} TY
        </span>
      </div>

      {/* 详情浮层 */}
      <div className="relative px-6">
        <AnimatePresence mode="wait">
          {showDetail && selectedEvent && (
            <EventDetailCard key={selectedEvent.id} event={selectedEvent} lang={lang} onClose={() => onToggleDetail(false)} />
          )}
        </AnimatePresence>
      </div>

      {/* 单轴时间轴 */}
      <div className="relative">
        <AnimatePresence>
          {canScrollLeft && (
            <motion.button key="sl" className="absolute left-0 top-0 bottom-0 z-20 flex items-center justify-center w-8"
              style={{ background: 'linear-gradient(to right, rgba(10,10,10,0.9) 0%, transparent 100%)' }}
              onClick={() => scrollBy('left')}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>&lt;</span>
            </motion.button>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {canScrollRight && (
            <motion.button key="sr" className="absolute right-0 top-0 bottom-0 z-20 flex items-center justify-center w-8"
              style={{ background: 'linear-gradient(to left, rgba(10,10,10,0.9) 0%, transparent 100%)' }}
              onClick={() => scrollBy('right')}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>&gt;</span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* 滚动区域 */}
        <div ref={scrollRef} className="overflow-x-auto overflow-y-hidden scroll-smooth" style={{ scrollbarWidth: 'none' }}>
          <div className="relative px-6 pb-3" style={{ minWidth: totalWidth + startPadding * 2 + 40 }}>
            {/* 水平轴线 */}
            <div className="absolute top-1/2 left-6 right-6 h-px -translate-y-1/2" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />

            {/* 事件节点：沿轴线均匀分布 */}
            <div className="relative flex items-center" style={{ height: 64 }}>
              {sorted.map((event, index) => {
                const isSelected = selectedEvent?.id === event.id;
                const nodeX = getNodeX(index);
                return (
                  <div
                    key={event.id}
                    className="absolute flex flex-col items-center cursor-pointer group"
                    style={{ left: nodeX, top: 0, transform: 'translateX(-50%)' }}
                    onClick={() => handleNodeClick(event)}
                  >
                    {/* 上方标签 */}
                    <div
                      className="mb-1.5 text-center transition-all duration-200 opacity-0 group-hover:opacity-100"
                      style={{
                        color: isSelected ? '#f2a104' : 'rgba(255,255,255,0.25)',
                        fontSize: '9px',
                        fontFamily: 'monospace',
                        letterSpacing: '0.1em',
                      }}
                    >
                      {t(event.title, lang)}
                    </div>

                    {/* 节点圆点（轴线穿过） */}
                    <div className="relative flex items-center justify-center" style={{ width: 32, height: 32 }}>
                      <motion.div
                        className="w-3 h-3 rounded-full border-2 relative z-10"
                        style={{
                          backgroundColor: isSelected ? '#f2a104' : 'transparent',
                          borderColor: isSelected ? '#f2a104' : 'rgba(255,255,255,0.2)',
                          boxShadow: isSelected ? '0 0 12px rgba(242, 161, 4, 0.5)' : '0 0 0px rgba(242, 161, 4, 0)',
                        }}
                        animate={{ scale: isSelected ? 1.3 : 1 }}
                        transition={{ duration: 0.3 }}
                      />
                      {/* 年份标签在圆点正下方 */}
                      <div
                        className="absolute top-full mt-1 text-[9px] font-mono whitespace-nowrap transition-colors"
                        style={{ color: isSelected ? '#f2a104' : 'rgba(255,255,255,0.2)', letterSpacing: '0.08em' }}
                      >
                        {formatYear(event.terran_year_start)}
                      </div>
                    </div>

                    {/* 选中时显示副标题 */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          key={event.id + '-label'}
                          className="absolute top-full mt-8 text-[8px] font-mono whitespace-nowrap"
                          style={{ color: 'rgba(242,161,4,0.4)', letterSpacing: '0.08em' }}
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                        >
                          {t(event.subtitle, lang)}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* 底部年份刻度 */}
            <div className="relative h-4 mt-1">
              {/* 刻度线 */}
              {sorted.map((event, index) => {
                const nodeX = getNodeX(index);
                return (
                  <div
                    key={event.id}
                    className="absolute"
                    style={{ left: nodeX, transform: 'translateX(-50%)' }}
                  >
                    <div className="w-px h-2 -translate-y-full" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timeline;