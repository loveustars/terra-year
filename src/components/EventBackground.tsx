import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TerraEvent, LangKey } from '../hooks/useTerraData';

interface EventBackgroundProps {
  event: TerraEvent | null;
  lang: LangKey;
}

const MovingGrid: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-10 bg-[#e8e8e8]">
    <div 
      className="absolute w-[200vw] h-[200vh] top-[-50vh] left-[-50vw]"
      style={{
        backgroundImage: `
          linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px),
          radial-gradient(#aaa 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px, 40px 40px, 20px 20px',
        backgroundPosition: '0 0, 0 0, 10px 10px',
        animation: 'moveBg 20s linear infinite'
      }}
    />
    <style dangerouslySetInnerHTML={{__html: `
      @keyframes moveBg {
        0% { transform: translate(0, 0); }
        100% { transform: translate(40px, 40px); }
      }
    `}} />
  </div>
);

const CornerDecor: React.FC = () => {
  const corners = [
    { t:0,l:0, rot:0 }, { t:0,ri:0, rot:90 }, { b:0,l:0, rot:-90 }, { b:0,ri:0, rot:180 }
  ];
  return (<>{corners.map((c,i)=>(
    <div key={i} className="absolute w-16 h-16 pointer-events-none z-20" style={{top:c.t!==undefined?c.t:'auto',bottom:c.b!==undefined?c.b:'auto',left:c.l!==undefined?c.l:'auto',right:c.ri!==undefined?c.ri:'auto',transform:`rotate(${c.rot}deg)`,opacity:0.4}}>
      <svg width="64" height="64" viewBox="0 0 64 64">
        <line x1="0" y1="0" x2="28" y2="0" stroke="#f2a104" strokeWidth="2"/>
        <line x1="0" y1="0" x2="0" y2="28" stroke="#f2a104" strokeWidth="2"/>
      </svg>
    </div>
  ))}</>);
};

const EventTitleOverlay: React.FC<{ event: TerraEvent; lang: LangKey }> = ({ event, lang }) => {
  const title = event.title[lang] ?? event.title.zh_CN;
  const subtitle = event.subtitle[lang] ?? event.subtitle.zh_CN;
  const sy = event.terran_year_start;
  const ey = event.terran_year_end;
  let yearStr = 'TIME UNKNOWN';
  if (sy !== 'unknown' && ey !== 'unknown') yearStr = sy === ey ? `${sy} TY` : `${sy} TY — ${ey} TY`;
  else if (sy !== 'unknown') yearStr = `— ${sy} TY`;
  else if (ey !== 'unknown') yearStr = `${ey} TY —`;

  return (
    <motion.div className="absolute top-8 left-8 z-30 select-none bg-white p-5 border border-[#ccc] shadow-sm transform-gpu"
      style={{ clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)' }}
      initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.5, ease: 'easeOut' }}>
      <div className="absolute top-0 right-4 w-12 h-1 bg-[#f2a104]"></div>
      <div className="absolute bottom-4 left-0 w-1 h-12 bg-[#f2a104]"></div>

      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-4 bg-[#1f1f1f]"></div>
        <div className="text-[10px] font-black tracking-[0.25em]" style={{ color: '#555' }}>[ {yearStr} ]</div>
      </div>
      <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-none uppercase" style={{ color: '#1a1a1a' }}>{title}</h1>
      <h2 className="text-sm font-bold tracking-[0.15em] mt-3 uppercase" style={{ color: '#888' }}>{subtitle}</h2>
    </motion.div>
  );
};

const EventBackground: React.FC< EventBackgroundProps > = ({ event, lang }) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div key={event ? event.id : 'default'} className="absolute inset-0 bg-[#f4f4f4]"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
        
        <MovingGrid />
        
        {/* White Vignette */}
        <div className="absolute inset-0 pointer-events-none z-20" style={{
          background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(244,244,244,0.6) 100%)'
        }} />

        <CornerDecor />

        {event && <EventTitleOverlay event={event} lang={lang} />}
      </motion.div>
    </AnimatePresence>
  );
};

export default EventBackground;