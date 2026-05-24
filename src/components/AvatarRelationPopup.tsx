import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { OperatorRelation, Operator, TerraEvent, LangKey, I18nString } from '../hooks/useTerraData';
import { RELATION_TYPE_STYLES } from '../utils/assets';

interface SingleRelationDetail {
  relation: OperatorRelation;
  sourceOp: Operator;
  targetOp: Operator;
  event: TerraEvent;
}

interface AvatarRelationPopupProps {
  relations: SingleRelationDetail[];
  lang: LangKey;
  onClose: () => void;
  avatarRect: DOMRect;
}

function t(str: I18nString | undefined, lang: LangKey, fallback = ''): string {
  if (!str) return fallback;
  return str[lang] ?? str['zh_CN'] ?? fallback;
}

const AvatarRelationPopup: React.FC<AvatarRelationPopupProps> = ({
  relations,
  lang,
  onClose,
  avatarRect,
}) => {
  if (relations.length === 0) return null;

  const avatarCenterX = avatarRect.left + avatarRect.width / 2;
  const avatarBottom = avatarRect.bottom;
  const panelWidth = 320;
  const panelLeft = Math.max(16, Math.min(avatarCenterX - panelWidth / 2, window.innerWidth - panelWidth - 16));
  const panelTop = Math.min(avatarBottom + 12, window.innerHeight - 380);

  return (
    <AnimatePresence>
      <motion.div
        key="avatar-popup"
        initial={{ opacity: 0, y: -8, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.96 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="fixed z-50 flex flex-col overflow-hidden pointer-events-auto shadow-2xl"
        style={{
          width: panelWidth,
          left: panelLeft,
          top: panelTop,
          background: '#fcfcfc',
          border: '1px solid #d4d4d4',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          clipPath: 'polygon(0 0, 94% 0, 100% 6%, 100% 100%, 6% 100%, 0 94%)',
          color: '#1a1a1a'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-[#cccccc] bg-[#e6e6e6]">
          <span className="text-[11px] font-black tracking-widest text-[#333]">
            {relations.length} INSTANCE{relations.length > 1 ? 'S' : ''}
          </span>
          <button
            onClick={onClose}
            className="text-[10px] font-bold tracking-widest text-[#777] hover:text-[#111] transition-colors"
          >
            [CLOSE]
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-[#f2f2f2]" style={{ scrollbarWidth: 'thin', maxHeight: '280px' }}>
          {relations.map(({ relation, sourceOp, targetOp }) => {
            const st = RELATION_TYPE_STYLES[relation.relation_type] ?? RELATION_TYPE_STYLES.unknown;
            const ev = relation.evidences?.[0];
            const quote = ev ? t(ev.quote, lang) : null;

            return (
              <div
                key={relation.id}
                className="text-[11px] font-medium leading-relaxed pb-3 border-b border-[#dddddd] last:border-0"
              >
                {/* Ops */}
                <div className="flex items-center flex-wrap gap-x-1.5 gap-y-1 mb-1.5 leading-tight">
                  <span className="font-bold text-[#c12727] uppercase">
                    {t(sourceOp.display_name, lang)}
                  </span>
                  <span className="text-[10px] text-[#666]">connected to</span>
                  <span className="font-bold text-[#c12727] uppercase">
                    {t(targetOp.display_name, lang)}
                  </span>
                </div>
                
                {/* Label */}
                <div className="mb-2">
                  <span className="font-bold px-1.5 py-0.5 text-[10px] uppercase border" style={{ borderColor: st.color, backgroundColor: 'rgba(255,255,255,0.7)', color: '#222' }}>
                    {t(relation.relation_label, lang)}
                  </span>
                </div>

                {quote && (
                  <div className="mt-1.5 bg-white border border-[#e0e0e0] p-1.5 shadow-sm">
                    <blockquote className="text-[11px] text-[#444] italic border-l-[3px] py-0.5 pl-2" style={{borderColor: st.color || '#999'}}>
                      "{quote}"
                    </blockquote>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Footer */}
        <div className="px-3 py-1.5 bg-[#444] text-[9px] text-[#f0f0f0] text-right font-black uppercase tracking-widest w-full">
          TERRA-YEAR RELATIONS
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AvatarRelationPopup;