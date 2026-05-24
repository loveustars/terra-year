import os

content = """import React from 'react';
import { motion } from 'framer-motion';
import type { OperatorRelation, Operator, TerraEvent, LangKey, I18nString } from '../hooks/useTerraData';
import { RELATION_TYPE_STYLES } from '../utils/assets';

interface SingleRelationDetail {
  relation: OperatorRelation;
  sourceOp: Operator;
  targetOp: Operator;
  event: TerraEvent;
  titleOp?: Operator;
}

interface RelationPanelProps {
  relations: SingleRelationDetail[];
  lang: LangKey;
  onClose: () => void;
}

function t(str: I18nString | undefined, lang: LangKey, fallback = ''): string {
  if (!str) return fallback;
  return str[lang] ?? str['zh_CN'] ?? fallback;
}

const CONFIDENCE_LABELS: Record<string, Record<string, string>> = {
  official_fact: { zh_CN: '官方确凿', en_US: 'OFF.FACT' },
  implied_plot: { zh_CN: '剧情暗示', en_US: 'IMPLIED' },
  community_speculation: { zh_CN: '社区推测', en_US: 'SPECUL.' },
};

const RelationPanel: React.FC<RelationPanelProps> = ({ relations, lang, onClose }) => {
  if (relations.length === 0) return null;

  const titleOp = relations[0].titleOp;
  const titleOpName = titleOp ? t(titleOp.display_name, lang) : '';

  return (
    <motion.div
      className="fixed z-50 flex flex-col pointer-events-auto"
      style={{
        right: 'max(40px, 2vw)',
        top: '50%',
        height: 'min(90vh, 850px)',
        width: 'min(640px, 33vw)',
        color: '#1a1a1a',
        filter: 'drop-shadow(-15px 15px 50px rgba(0,0,0,0.4))',
      }}
      initial={{ opacity: 0, x: 50, y: '-50%' }}
      animate={{ opacity: 1, x: 0, y: '-50%' }}
      exit={{ opacity: 0, x: 50, y: '-50%' }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div 
        className="flex flex-col h-full relative"
        style={{
          background: '#fcfcfc',
          clipPath: 'polygon(0 0, calc(100% - 32px) 0, 100% 32px, 100% 100%, 32px 100%, 0 calc(100% - 32px))',
        }}
      >
        {/* Techwear Caution Tape Decoration */}
        <div 
          className="absolute top-[-10px] right-8 w-24 h-12 z-0 opacity-10 pointer-events-none"
          style={{
            background: 'repeating-linear-gradient(45deg, #000, #000 4px, transparent 4px, transparent 8px)'
          }}
        />

        {/* Decorative corner blocks to outline the clip-path borders */}
        <div className="absolute top-0 right-[32px] w-12 h-1.5 bg-[#f2a104] z-20" />
        <div className="absolute top-[32px] right-0 w-1.5 h-12 bg-[#f2a104] z-20" />

        <div className="absolute bottom-0 left-[32px] w-12 h-1.5 bg-[#f2a104] z-20" />
        <div className="absolute bottom-[32px] left-0 w-1.5 h-12 bg-[#f2a104] z-20" />

        {/* Header Section */}
        <div className="relative px-8 pt-10 pb-5 shrink-0 z-10 w-full overflow-hidden bg-[#e0e0e0] border-b-2 border-[#1f1f1f]">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[radial-gradient(#000_1.5px,transparent_1px)] [background-size:16px_16px]" />
          
          <div className="absolute -bottom-8 right-0 text-[#cfcfcf] text-8xl font-black opacity-30 select-none pointer-events-none tracking-tighter">
            {titleOp?.display_name?.en_US?.split(' ').pop()?.toUpperCase() || ''}
          </div>

          <div className="relative z-10 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-[#1f1f1f] text-white flex items-center justify-center font-black text-[10px]">
                //
              </div>
              <div className="text-[11px] font-black tracking-[0.2em] text-[#555] uppercase">
                CONFIDENTIAL RECORD
              </div>
              <div className="ml-auto bg-[#1f1f1f] text-white px-2 py-0.5 text-[10px] font-bold tracking-widest">
                ID: {titleOp?.id || 'Unknown'}
              </div>
            </div>

            <div className="flex justify-between items-end">
              <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter text-[#1f1f1f] leading-none mb-1 drop-shadow-sm max-w-[80%] break-words">
                {titleOpName}
              </h1>
              <div className="text-[#555] font-black text-[10px] tracking-widest bg-white/50 px-2 py-1 mb-1 border border-[#ccc]">
                {relations.length} CONNS
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="absolute top-6 right-8 text-[#555] font-black text-sm tracking-widest hover:text-black hover:bg-[#ccc] p-1 transition-colors z-20"
          >
            [ CLOSE ]
          </button>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto px-8 py-6 z-10 bg-[#f4f4f4] relative">
          {/* Subtle grid background for content area */}
          <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(rgba(0,0,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.1)_1px,transparent_1px)] bg-[size:40px_40px]" />

          {/* INSTANCES title stripe */}
          <div className="flex items-center gap-2 mb-6">
            <div className="bg-[#1f1f1f] text-white px-3 py-1 font-black text-xl lg:text-2xl uppercase tracking-widest">
              INSTANCES
            </div>
            <div className="flex-1 h-[3px] bg-[#1f1f1f]" />
          </div>

          <div className="flex flex-col space-y-6 relative z-10">
            {relations.map(({ relation, sourceOp, targetOp, event }) => {
              const label = t(relation.relation_label, lang);
              const evTitle = t(event.title, lang);
              const isSource = titleOp && relation.source === titleOp.id;
              const otherOp = isSource ? targetOp : sourceOp;
              const otherOpName = t(otherOp.display_name, lang);
              const conf = CONFIDENCE_LABELS[relation.confidence_level]?.[lang] ?? relation.confidence_level;
              const style = RELATION_TYPE_STYLES[relation.relation_type] ?? RELATION_TYPE_STYLES.unknown;

              return (
                <div key={relation.id} className="text-[13px] font-medium leading-relaxed pb-4 border-b border-[#cccccc] group">
                  <div className="mb-2 flex flex-wrap items-center gap-1.5 leading-snug">
                    <span className="text-[#555]">present in</span>
                    <span className="text-[#205ea8] font-bold border-b-2 border-[#205ea8]/30">
                      {evTitle}
                    </span>
                    <span className="text-[#fff] text-[10px] uppercase font-mono tracking-wider ml-1 bg-[#888] px-1.5 py-[1px]">
                      {conf}
                    </span>
                  </div>
                  <div className="leading-snug bg-white inline-block px-2 py-1.5 border border-[#dddddd] shadow-sm">
                    <span className="text-[#555]">connected to</span>
                    <span className="text-[#c12727] font-black uppercase mx-1 text-sm bg-[#c12727]/10 px-1">
                      {otherOpName}
                    </span>
                    <span className="text-[#555]">via</span>
                    <span 
                      className="font-bold px-2 py-0.5 text-[11px] ml-1 uppercase border-2 text-[#111]" 
                      style={{borderColor: style.color || '#333', backgroundColor: 'rgba(255,255,255,0.9)'}}
                    >
                      {label}
                    </span>
                  </div>

                  {relation.evidences.length > 0 && (
                    <div className="mt-3 ml-2 relative">
                      <div className="absolute -left-3 top-1 bottom-1 w-[3px]" style={{backgroundColor: style.color || '#999'}} />
                      <div className="bg-[#ffffff] border border-[#e0e0e0] p-4 shadow-sm group-hover:border-[#bbbbbb] transition-colors relative">
                        {/* Technical corner brackets */}
                        <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-[#999]" />
                        <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-[#999]" />
                        
                        {relation.evidences.slice(0, 1).map((ev, i) => (
                          <div key={i}>
                            <blockquote className="text-[13px] italic leading-relaxed text-[#333]">
                              "{t(ev.quote, lang)}"
                            </blockquote>
                            {ev.context_analysis && (
                              <div className="text-[11px] text-[#666] mt-3 tracking-wide font-mono bg-[#f4f4f4] p-2 border border-[#eaeaea]">
                                &gt; {t(ev.context_analysis, lang)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default RelationPanel;
"""

with open("/Users/dujinze/arkfiles/fe/terra-year/src/components/RelationPanel.tsx", "w", encoding="utf-8") as f:
    f.write(content)
