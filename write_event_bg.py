content = """import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TerraEvent, LangKey } from '../hooks/useTerraData';

interface EventBackgroundProps {
  event: TerraEvent | null;
  lang: LangKey;
}

const MovingGrid: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-10 bg-[#f4f4f4]">
    {/* Animated moving background (grid + dots going bottom-right) */}
    <div 
      className="absolute w-[200vw] h-[200vh] top-[-50vh] left-[-50vw]"
      style={{
        backgroundImage: `
          linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px),
          radial-gradient(#bbb 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px, 40px 40px, 20px 20px',
        backgroundPosition: '0 0, 0 0, 10px 10px',
        animation: 'moveBg 20s linear infinite'
      }}
    />
    <style dangerouslySetInnerHTML={{__html:content = """import React from '  import { motion, AnimatePresence } fro  import type { TerraEvent, LangKey } from '../hooks/useT}

interface EventBackgroundProps {
  event: TerraEvent | null;
  con  event: TerraEvent | null;
  lot  lang: LangKey;
}

const , }

const Moving-90 }  <div className="absolute inset-0 rn    {/* Animated moving background (grid + dots going bottom-right) */}
    <div 
      con    <div 
      className="absolute w-[200vw] h-[200vh] top-[-50vh] lec.      cl,l      style={{
        backgroundImage: `
          linear-gradient(rgsf        backg{c          linear-gradient
           linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparein          radial-gradient(#bbb 1px, transparent 1px)
        `,
                 `,
        backgroundSize: '40px 40px, 40px"         bth        backgroundPosition: '0 0, 0 0, 10px 10px',
      Ti        animation: 'moveBg 20s linear infinite'
 an      }}
    />
    <style dangerouslySetInner = event.title[lan
interface EventBackgroundProps {
  event: TerraEvent | null;
  con  event: TerraEvent | null;
  lot  lang: LangKey;
}

const , }

const Moving-90 }  <div className="absolutear  event: TerraEvent | null;
  c=   con  event: TerraEvent |OW  lot  lang: LangKey;
}

const ? }

const , }

const == 'u
const M? `    <div 
      con    <div 
      className="absolute w-[200vw] h-[200vh] top-[-50vh] lec.      cl,l      style={{
        p-8 left-8 z      className="g-        backgroundImage: `
          linear-gradient(rgsf        backg{c          linal          linear-gradientpx           linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparein  te        `,
                 `,
        backgroundSize: '40px 40px, 40px"         bth        backgroundPosition: '0 0, sN      lex i        backgroundmb      Ti        animation: 'moveBg 20s linear infinite'
 an      }}
    />
    <style dangerouslySetIno tracking-[0.25em]" style={{ color: '#555' }}>[{yearStr}]    />
         <v>interface EventBackgroundProps {
  event: Terra-b  event: TerraEvent | null;
  ce"  con  event: TerraEvent | }  lot  lang: LangKey;
}

const am}

const , }

const  trac
const M15e  c=   con  event: TerraEvent |OW  lot  lang: LangKey;
}

const ? }

coon}

const ? }

const , }

const == 'u
const M? `    <dackgr
const ,s> 
const =nt,const M? `>       con    <div An      className="e=        p-8 left-8 z      className="g-        backgroundImage: `
          linear-grt-          linear-gradient(rgsf        backg{c          linal    it                 `,
        backgroundSize: '40px 40px, 40px"         bth        backgroundPosition: '0 0, sN      lex i        backgroundmb      Ti        animation: in        backgroundts an      }}
    />
    <style dangerouslySetIno tracking-[0.25em]" style={{ color: '#555' }}>[{yearStr}]    />
         <v>interface EventBackgroundProps {
  event: Terra-b  ev    />
   en    <eO         <v>interface EventBackgroundProps {
  event: Terra-b  event: TerraEvent | null;
  )  event: Terra-b  event: TerraEvent | null;wi  ce"  con  event: TerraEvent | }  lot  lax", "w", encoding="utf-8") as f:
    f.write(content)
