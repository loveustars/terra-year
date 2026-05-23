import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TerraEvent, LangKey } from '../hooks/useTerraData';

/* ============================================================
 * EventBackground — 全屏活动主题背景（支持KV图片+渐变拼接）
 *
 * 视觉层次：
 *   1. KV实景图片（优先）+ 渐变背景
 *   2. 拼接过渡（多个同期事件）
 *   3. 半透明遮盖层 + 扫描线 + 网格 + 四角装饰
 *   4. 顶部标题浮层
 * ============================================================ */

interface EventBackgroundProps {
  event: TerraEvent | null;
  lang: LangKey;
}

interface BgConfig {
  gradient: string;
  overlayOpacity: number;
}

const BG_CONFIGS: Record<string, BgConfig> = {
  antique_gold: { 
    gradient: 'radial-gradient(ellipse at 20% 50%, rgba(80,45,15,0.6) 0%, transparent 60%),radial-gradient(ellipse at 80% 30%, rgba(60,35,10,0.4) 0%, transparent 50%),linear-gradient(180deg, #0d0a05 0%, #1a1208 30%, #0f0b05 70%, #0a0804 100%)',
    overlayOpacity: 0.35,
  },
  starry: { 
    gradient: 'radial-gradient(ellipse at 30% 20%, rgba(10,20,60,0.5) 0%, transparent 60%),radial-gradient(ellipse at 70% 70%, rgba(20,10,50,0.4) 0%, transparent 50%),linear-gradient(180deg, #050510 0%, #0a0a20 30%, #080820 70%, #040410 100%)',
    overlayOpacity: 0.4,
  },
  snow: { 
    gradient: 'radial-gradient(ellipse at 40% 20%, rgba(40,60,80,0.5) 0%, transparent 60%),radial-gradient(ellipse at 60% 70%, rgba(30,40,60,0.4) 0%, transparent 50%),linear-gradient(180deg, #0a0f18 0%, #101a28 30%, #0c1420 70%, #080c14 100%)',
    overlayOpacity: 0.35,
  },
  rain: { 
    gradient: 'radial-gradient(ellipse at 50% 30%, rgba(15,25,45,0.6) 0%, transparent 60%),radial-gradient(ellipse at 70% 60%, rgba(10,20,35,0.5) 0%, transparent 50%),linear-gradient(180deg, #060810 0%, #0c0e1a 30%, #080a14 70%, #040608 100%)',
    overlayOpacity: 0.4,
  },
  default: { 
    gradient: 'radial-gradient(ellipse at 50% 30%, rgba(30,30,30,0.5) 0%, transparent 60%),linear-gradient(180deg, #0a0a0a 0%, #121212 40%, #0d0d0d 70%, #080808 100%)',
    overlayOpacity: 0.3,
  },
};

/** KV 图片路径 */
function kvUrl(eventId: string): string | null {
  // Check if KV file exists locally
  const images: Record<string, string> = {
    act33side: '/assets/backgrounds/act33side.jpg',
    act11d0: '/assets/backgrounds/act11d0.jpg',
    act13side: '/assets/backgrounds/act13side.jpg',
    act25side: '/assets/backgrounds/act25side.jpg',
    ep05: '/assets/backgrounds/ep05.jpg',
  };
  return images[eventId] ?? null;
}

/* ---- 事件标题浮层 ---- */
const EventTitleOverlay: React.FC<{ event: TerraEvent; lang: LangKey }> = ({ event, lang }) => {
  const title = event.title[lang] ?? event.title.zh_CN;
  const subtitle = event.subtitle[lang] ?? event.subtitle.zh_CN;
  const sy = event.terran_year_start;
  const ey = event.terran_year_end;
  const yearStr = sy === 'unknown' && ey === 'unknown'
    ? 'TIME UNKNOWN'
    : sy === 'unknown' ? `— ${ey} TY`
    : ey === 'unknown' ? `${sy} TY —`
    : sy === ey ? `${sy} TY`
    : `${sy} TY — ${ey} TY`;

  return (
    <motion.div className="absolute top-8 left-8 z-10 select-none"
      initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.5, ease: 'easeOut' }}>
      <div className="text-[10px] font-mono tracking-[0.25em] mb-2" style={{ color: 'rgba(242, 161, 4, 0.5)' }}>{yearStr}</div>
      <h1 className="text-3xl sm:text-4xl font-black font-mono tracking-[0.08em] leading-tight" style={{ color: '#f5f5f5' }}>{title}</h1>
      <h2 className="text-sm font-mono tracking-[0.15em] mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{subtitle}</h2>
      <div className="w-12 h-px mt-4" style={{ backgroundColor: 'rgba(242, 161, 4, 0.25)' }} />
    </motion.div>
  );
};

/* ---- 纹理层 ---- */
const Scanlines: React.FC = () => (
  <div className="absolute inset-0 pointer-events-none" style={{backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.08) 2px,rgba(0,0,0,0.08) 4px)',backgroundSize:'100% 4px'}} />
);

const HexGrid: React.FC = () => (
  <div className="absolute inset-0 pointer-events-none opacity-[0.02]"
    style={{backgroundImage:'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'52\' viewBox=\'0 0 60 52\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M30 0l26 15v30L30 60 4 45V15z\' fill=\'none\' stroke=\'rgba(255,255,255,0.5)\' stroke-width=\'0.5\'/%3E%3C/svg%3E")',backgroundSize:'60px 52px'}} />
);

const CornerDecor: React.FC<{ accent: string }> = ({ accent }) => {
  const corners = [
    { t:0,l:0, rot:0 }, { t:0,ri:0, rot:90 }, { b:0,l:0, rot:-90 }, { b:0,ri:0, rot:180 }
  ];
  return (<>{corners.map((c,i)=>(
    <div key={i} className="absolute w-16 h-16 pointer-events-none" style={{top:c.t!==undefined?c.t:'auto',bottom:c.b!==undefined?c.b:'auto',left:c.l!==undefined?c.l:'auto',right:c.ri!==undefined?c.ri:'auto',transform:`rotate(${c.rot}deg)`,opacity:0.3}}>
      <svg width="64" height="64" viewBox="0 0 64 64"><line x1="0" y1="0" x2="24" y2="0" stroke={accent} strokeWidth="1"/><line x1="0" y1="0" x2="0" y2="24" stroke={accent} strokeWidth="1"/><line x1="0" y1="0" x2="12" y2="12" stroke={accent} strokeWidth="0.5" opacity="0.5"/></svg>
    </div>
  ))}</>);
};

/* ---- 粒子 ---- */
const BgParticles: React.FC<{ eventId: string; color: string }> = ({ eventId, color }) => {
  const particles = useMemo(() => {
    return Array.from({length:30},()=>({x:Math.random()*100,y:Math.random()*100,size:Math.random()*3+1,delay:Math.random()*5}));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[eventId]);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p,idx)=>(
        <motion.div key={idx} className="absolute rounded-full" style={{left:`${p.x}%`,top:`${p.y}%`,width:p.size,height:p.size,backgroundColor:color}}
          animate={{opacity:[0.4,0.9,0.4],y:[0,-8,0]}} transition={{duration:4+p.delay,repeat:Infinity,ease:'easeInOut',delay:p.delay}} />
      ))}
    </div>
  );
};

/* ============================================================
 * 主组件
 * ============================================================ */

const PARTICLE_COLORS: Record<string, string> = {
  antique_gold: 'rgba(242,161,4,0.08)',
  starry: 'rgba(100,150,255,0.06)',
  snow: 'rgba(180,210,255,0.05)',
  rain: 'rgba(60,100,160,0.06)',
};

const ACCENT_COLORS: Record<string, string> = {
  antique_gold: '#f2a104',
  starry: '#4a80ff',
  snow: 'rgba(255,255,255,0.15)',
  rain: 'rgba(255,255,255,0.15)',
};

const EventBackground: React.FC<EventBackgroundProps> = ({ event, lang }) => {
  const config = event ? BG_CONFIGS[event.bg_preset] ?? BG_CONFIGS.default : BG_CONFIGS.default;
  const accent = event ? (ACCENT_COLORS[event.bg_preset] ?? 'rgba(255,255,255,0.15)') : 'rgba(255,255,255,0.15)';
  const particleColor = event ? (PARTICLE_COLORS[event.bg_preset] ?? 'rgba(255,255,255,0.03)') : 'rgba(255,255,255,0.03)';

  return (
    <AnimatePresence mode="wait">
      {event ? (
        <motion.div key={event.id} className="absolute inset-0"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>

          {/* KV 背景图（优先）+ 渐变兜底 */}
          <div className="absolute inset-0" style={{ background: config.gradient }}>
            {kvUrl(event.id) && (
              <img
                src={kvUrl(event.id)!}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ opacity: 0.25, mixBlendMode: 'screen' }}
                alt=""
              />
            )}
          </div>

          {/* 遮盖层 */}
          <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${config.overlayOpacity})` }} />

          {/* 粒子 */}
          <BgParticles eventId={event.id} color={particleColor} />
          
          {/* 纹理 */}
          <Scanlines />
          <HexGrid />
          <CornerDecor accent={accent} />

          {/* 标题浮层 */}
          <EventTitleOverlay event={event} lang={lang} />
        </motion.div>
      ) : (
        <motion.div key="default-bg" className="absolute inset-0" style={{ background: BG_CONFIGS.default.gradient }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <Scanlines />
          <HexGrid />
          <CornerDecor accent="rgba(255,255,255,0.15)" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EventBackground;
