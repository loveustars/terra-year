import React from 'react';
import { motion } from 'framer-motion';
import type { OperatorRelation, Operator, TerraEvent, LangKey, I18nString } from '../hooks/useTerraData';
import { RELATION_TYPE_STYLES } from '../utils/assets';

interface RelationDetailCardProps {
  relation: OperatorRelation;
  sourceOp: Operator;
  targetOp: Operator;
  event: TerraEvent;
  lang: LangKey;
  onClose: () => void;
}

function t(str: I18nString | undefined, lang: LangKey, fallback = ''): string {
  if (!str) return fallback;
  return str[lang] ?? str['zh_CN'] ?? fallback;
}

const CONFIDENCE_LABELS: Record<string, Record<string, string>> = {
  official_fact: { zh_CN: '官方确认', en_US: 'Official Fact' },
  implied_plot: { zh_CN: '剧情暗示', en_US: 'Implied Plot' },
  community_speculation: { zh_CN: '社区推测', en_US: 'Community Speculation' },
};

const RelationDetailCard: React.FC<RelationDetailCardProps> = ({
  relation, sourceOp, targetOp, event, lang, onClose,
}) => {
  const style = RELATION_TYPE_STYLES[relation.relation_type] ?? RELATION_TYPE_STYLES.unknown;
  const label = t(relation.relation_label, lang);
  const evTitle = t(event.title, lang);
  const confidence = CONFIDENCE_LABELS[relation.confidence_level]?.[lang] ?? relation.confidence_level;

  return (
    <motion.div
      className="fixed z-50"
      style={{
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(420px, 90vw)',
      }}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {/* 背景遮罩 */}
      <div className="fixed inset-0 -z-10" onClick={onClose} style={{ backgroundColor: 'rgba(0,0,0,0.4)' }} />

      {/* 切角卡片 */}
      <div
        className="relative p-5 shadow-2xl border max-h-[70vh] overflow-y-auto"
        style={{
          backgroundColor: 'rgba(18, 18, 18, 0.97)',
          backdropFilter: 'blur(16px)',
          borderColor: `${style.color}33`,
          clipPath: 'polygon(0 0, 94% 0, 100% 6%, 100% 100%, 6% 100%, 0 94%)',
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-[10px] font-mono transition-colors z-10"
          style={{ color: 'rgba(255,255,255,0.3)' }}
          onMouseEnter={e => e.currentTarget.style.color = '#f2a104'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
        >
          [ CLOSE ]
        </button>

        {/* 关系类型标签 */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-px" style={{ backgroundColor: style.color }} />
          <span className="text-[9px] font-mono tracking-[0.12em] uppercase" style={{ color: style.color }}>
            {style.label[lang] ?? style.label.zh_CN}
          </span>
        </div>

        {/* 干员名称 */}
        <h3 className="text-base font-mono font-bold tracking-wide" style={{ color: '#f5f5f5' }}>
          {t(sourceOp.display_name, lang)} <span className="text-sm" style={{ color: 'rgba(255,255,255,0.2)' }}>⟷</span> {t(targetOp.display_name, lang)}
        </h3>

        {/* 关系标签 */}
        <div className="mt-1 mb-3 text-sm font-mono" style={{ color: style.color, letterSpacing: '0.05em' }}>
          {label}
        </div>

        {/* 可靠度 */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[9px] font-mono tracking-[0.1em]" style={{ color: 'rgba(255,255,255,0.2)' }}>CONFIDENCE:</span>
          <span className="text-[9px] font-mono tracking-[0.1em]" style={{
            color: relation.confidence_level === 'official_fact' ? '#00b4d8' : 'rgba(255,255,255,0.4)',
          }}>
            {confidence}
          </span>
        </div>

        <div className="w-full h-px my-3" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />

        {/* 关联事件 */}
        <div className="mb-3">
          <span className="text-[9px] font-mono tracking-[0.1em]" style={{ color: 'rgba(242, 161, 4, 0.5)' }}>
            EVENT: {event.id}
          </span>
          <span className="text-[11px] font-mono ml-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {evTitle}
          </span>
        </div>

        {/* 证据链 */}
        <div className="space-y-3">
          {relation.evidences.map((ev, i) => (
            <div
              key={i}
              className="p-3"
              style={{
                backgroundColor: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.04)',
                clipPath: 'polygon(0 0, 94% 0, 100% 12%, 100% 100%, 6% 100%, 0 88%)',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[8px] font-mono tracking-[0.15em] uppercase" style={{ color: 'rgba(242, 161, 4, 0.4)' }}>
                  EVIDENCE #{i + 1}
                </span>
                <span className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>
                  {ev.source_story}
                </span>
              </div>
              <blockquote className="text-[11px] italic leading-relaxed pl-3 border-l-2" style={{
                color: 'rgba(255,255,255,0.65)',
                borderColor: style.color,
              }}>
                {t(ev.quote, lang)}
              </blockquote>
              {ev.context_analysis && (
                <p className="text-[10px] mt-2 leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {t(ev.context_analysis, lang)}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* 底部 ID */}
        <div className="text-[8px] font-mono mt-3 pt-2 tracking-[0.08em]"
          style={{ color: 'rgba(255,255,255,0.1)', borderTop: '1px dashed rgba(255,255,255,0.04)' }}>
          RELATION ID: {relation.id}
        </div>
      </div>
    </motion.div>
  );
};

export default RelationDetailCard;
