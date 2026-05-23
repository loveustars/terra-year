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
  position: { x: number; y: number }; // percentage of viewport
}

function t(str: I18nString | undefined, lang: LangKey, fallback = ''): string {
  if (!str) return fallback;
  return str[lang] ?? str['zh_CN'] ?? fallback;
}

/** 头像下方弹出的迷你关系面板，尺寸与 OperatorSelector 一致 */
const AvatarRelationPopup: React.FC<AvatarRelationPopupProps> = ({
  relations,
  lang,
  onClose,
  position,
}) => {
  if (relations.length === 0) return null;

  // 计算面板位置：在头像下方，水平居中于头像
  const panelLeft = Math.max(16, Math.min(position.x - 128, window.innerWidth - 288)); // 256px wide
  const panelTop = Math.min(position.y + 60, window.innerHeight - 350);

  return (
    <AnimatePresence>
      <motion.div
        key="avatar-popup"
        initial={{ opacity: 0, y: -8, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.96 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="fixed z-50 w-64 flex flex-col overflow-hidden"
        style={{
          left: panelLeft,
          top: panelTop,
          backgroundColor: 'rgba(10, 10, 12, 0.96)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.08)',
          clipPath: 'polygon(0 0, 92% 0, 100% 8%, 100% 100%, 8% 100%, 0 92%)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(242,161,4,0.1)',
        }}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <span className="text-[10px] font-mono tracking-widest" style={{ color: 'rgba(242,161,4,0.7)' }}>
            {relations.length} RELATION{relations.length > 1 ? 'S' : ''}
          </span>
          <button
            onClick={onClose}
            className="text-[9px] font-mono tracking-widest transition-colors hover:opacity-100"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            [ CLOSE ]
          </button>
        </div>

        {/* 关系列表 */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2" style={{ scrollbarWidth: 'thin', maxHeight: '260px' }}>
          {relations.map(({ relation, sourceOp, targetOp }) => {
            const st = RELATION_TYPE_STYLES[relation.relation_type] ?? RELATION_TYPE_STYLES.unknown;
            const label = t((relation as any).description ?? relation.relation_label, lang, relation.relation_type);
            const ev = relation.evidences?.[0];
            const quote = ev ? t(ev.quote, lang) : null;

            return (
              <div
                key={relation.id}
                className="p-2 text-[10px] font-mono leading-relaxed"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  borderLeft: `2px solid ${st.color}`,
                  borderTop: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                {/* 关系人 */}
                <div className="flex items-center gap-1 mb-1">
                  <span className="font-semibold" style={{ color: '#f5f5f5' }}>
                    {t(sourceOp.display_name, lang)}
                  </span>
                  <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>⟷</span>
                  <span className="font-semibold" style={{ color: '#f5f5f5' }}>
                    {t(targetOp.display_name, lang)}
                  </span>
                </div>
                {/* 关系标签 */}
                <div className="mb-1" style={{ color: st.color }}>
                  {label}
                </div>
                {/* 台词 */}
                {quote && (
                  <div className="italic" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    "{quote.slice(0, 60)}{quote.length > 60 ? '...' : ''}"
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AvatarRelationPopup;