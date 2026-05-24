import React, { useMemo, useCallback } from 'react';
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

const Timeline: React.FC<TimelineProps> = ({ events, lang, selectedEvent, onSelectEvent, onToggleDetail }) => {
  const sorted = useMemo(() => [...events].sort((a, b) => {
    const ay = a.terran_year_start === 'unknown' ? 9999 : a.terran_year_start;
    const by = b.terran_year_start === 'unknown' ? 9999 : b.terran_year_start;
    return ay - by;
  }), [events]);

  const selectedIndex = useMemo(() => {
    if (!selectedEvent) return 0;
    return Math.max(0, sorted.findIndex(event => event.id === selectedEvent.id));
  }, [selectedEvent, sorted]);

  const progress = sorted.length <= 1 ? 0 : (selectedIndex / (sorted.length - 1)) * 100;

  const years = useMemo(() => {
    const validEvents = events.filter(e => typeof e.terran_year_start === 'number' && typeof e.terran_year_end === 'number') as Array<{terran_year_start: number; terran_year_end: number} & TerraEvent>;
    if (validEvents.length === 0) return { min: 1096, max: 1100, range: 4 };
    const min = Math.min(...validEvents.map(e => e.terran_year_start));
    const max = Math.max(...validEvents.map(e => e.terran_year_end));
    return { min, max, range: max - min || 1 };
  }, [events]);

  const handleNodeClick = useCallback((event: TerraEvent) => {
    onSelectEvent(event);
    onToggleDetail(true);
  }, [onSelectEvent, onToggleDetail]);

  const handleRangeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const nextEvent = sorted[Number(e.target.value)];
    if (!nextEvent) return;
    onSelectEvent(nextEvent);
    onToggleDetail(true);
  }, [onSelectEvent, onToggleDetail, sorted]);

  if (events.length === 0) {
    return (
      <div className="w-full py-4 px-6 border-t text-center font-mono text-xs shadow-[0_-4px_15px_rgba(0,0,0,0.05)] border-black/10 bg-[#f9f9f9] text-[#777] tracking-[0.1em]">
        &gt; NO_EVENTS_LOADED
      </div>
    );
  }

  return (
    <div className="relative w-full border-t border-black/10 shadow-[0_-4px_15px_rgba(0,0,0,0.05)] bg-[#fcfcfc] select-none">
      <div className="flex items-center px-5 pt-2 pb-1 relative z-10">
        <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-[#666]">&gt;&gt; TERRA-YEAR</span>
        <span className="mx-3 text-[#ccc]">|</span>
        <AnimatePresence mode="wait">
          <motion.span
            key={selectedEvent?.id ?? 'none'}
            className="text-[9px] font-mono tracking-[0.15em] uppercase text-[#00c2ff]"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
          >
            {selectedEvent ? `${t(selectedEvent.title, lang)} / ${formatYear(selectedEvent.terran_year_start)}` : 'MAINLINE CHAPTERS'}
          </motion.span>
        </AnimatePresence>
        <div className="flex-1" />
        <span className="text-[9px] font-mono tracking-[0.1em] text-[#888]">
          {selectedIndex + 1}/{sorted.length} · {years.min}–{years.max} TY
        </span>
      </div>

      <div className="relative px-6 pt-3 pb-5">
        <div className="relative h-16">
          <div className="absolute left-0 right-0 top-7 h-1 bg-[#dedede]" />
          <motion.div
            className="absolute left-0 top-7 h-1 bg-[#00c2ff]"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          />
          <input
            aria-label="Timeline chapter"
            type="range"
            min={0}
            max={Math.max(sorted.length - 1, 0)}
            step={1}
            value={selectedIndex}
            onChange={handleRangeChange}
            className="terra-timeline-range absolute left-0 right-0 top-4 z-20 w-full"
          />

          <div className="absolute inset-x-0 top-0 z-30 flex justify-between pointer-events-none">
            {sorted.map((event, index) => {
              const isSelected = selectedEvent?.id === event.id;
              const isPast = index <= selectedIndex;
              return (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => handleNodeClick(event)}
                  className="group relative flex h-16 w-10 flex-col items-center pointer-events-auto"
                >
                  <span
                    className="mb-1 h-3 max-w-16 overflow-hidden text-center text-[8px] font-mono uppercase text-ellipsis whitespace-nowrap"
                    style={{ color: isSelected ? '#00c2ff' : 'rgba(0,0,0,0.38)', letterSpacing: '0.06em' }}
                  >
                    {t(event.title, lang)}
                  </span>
                  <motion.span
                    className="relative block h-4 w-4 border-2 bg-[#fcfcfc]"
                    style={{
                      borderColor: isPast ? '#00c2ff' : '#bcbcbc',
                      boxShadow: isSelected ? '0 0 14px rgba(0,194,255,0.45)' : 'none',
                      clipPath: 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%)',
                    }}
                    animate={{ scale: isSelected ? 1.35 : 1 }}
                    transition={{ duration: 0.2 }}
                  />
                  {isSelected && (
                    <motion.span
                      className="absolute top-10 max-w-24 overflow-hidden text-center text-[8px] font-mono text-[#00c2ff] text-ellipsis whitespace-nowrap"
                      style={{ letterSpacing: '0.08em' }}
                      initial={{ opacity: 0, y: -3 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {t(event.subtitle, lang)}
                    </motion.span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timeline;
