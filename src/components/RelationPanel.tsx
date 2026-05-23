import React from 'react';
import { motion } from 'framer-motion';
import type { OperatorRelation, Operator, TerraEvent, LangKey, I18nString } from '../hooks/useTerraData';
import { RELATION_TYPE_STYLES } from '../utils/assets';

interface SingleRelationDetail {
  relation: OperatorRelation;
  sourceOp: Operator;
  targetOp: Operator;
  event: TerraEvent;
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
  official_fact: { zh_CN: '官方确认', en_US: 'Official Fact' },
  implied_plot: { zh_CN: '剧情暗示', en_US: 'Implied Plot' },
  community_speculation: { zh_CN: '社区推测', en_US: 'Community Speculation' },
};

/** 将所有关系渲染在同一面板内，而非多个浮层叠加 */
const RelationPanel: React.FC<RelationPanelProps> = ({ relations, lang, onClose }) => {
  if (relations.length === 0) return null;

  return (
    <motion.div
      className="fixed z-50 flex items-center justify-center"
      style={{ inset: 0 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* 全屏遮罩 */}
      <div className="fixed inset-0 -z-10" style={{ backgroundColor: 'rgba(0,0,0,0.55)' }} onClick={onClose} />

      <motion.div
        className="relative w-full max-w-2xl max-h-[85vh] flex flex-col m-4"
        style={{
          backgroundColor: 'rgba(12, 12, 12, 0.97)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.07)',
          clipPath: 'polygon(0 0, 96% 0, 100% 4%, 100% 100%, 4% 100%, 0 96%)',
        }}
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
      >
        {/* 头部标题栏 */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div>
            <div className="text-[9px] font-mono tracking-[0.15em] uppercase" style={{ color: 'rgba(242, 161, 4, 0.5)' }}>
              RELATIONS — {relations.length} TOTAL
            </div>
            <div className="text-xs font-mono font-bold mt-0.5" style={{ color: '#f5f5f5' }}>
              {t(relations[0].sourceOp.display_name, lang)} 的关系网
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[10px] font-mono transition-colors"
            style={{ color: 'rgba(255,255,255,0.3)' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#f2a104')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
          >
            [ CLOSE ]
          </button>
        </div>

        {/* 关系列表（可滚动） */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ scrollbarWidth: 'thin' }}>
          {relations.map(({ relation, sourceOp, targetOp, event }) => {
            const style = RELATION_TYPE_STYLES[relation.relation_type] ?? RELATION_TYPE_STYLES.unknown;
            const label = t(relation.relation_label, lang);
            const evTitle = t(event.title, lang);
            const confidence = CONFIDENCE_LABELS[relation.confidence_level]?.[lang] ?? relation.confidence_level;

            return (
              <div
                key={relation.id}
                className="p-4"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  border: `1px solid ${style.color}22`,
                  clipPath: 'polygon(0 0, 96% 0, 100% 8%, 100% 100%, 4% 100%, 0 92%)',
                }}
              >
                {/* 关系类型 + 名称 */}
                <div className="flex items-start gap-3 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-5 h-px" style={{ backgroundColor: style.color }} />
                      <span className="text-[8px] font-mono tracking-[0.1em] uppercase" style={{ color: style.color }}>
                        {style.label[lang] ?? style.label.zh_CN}
                      </span>
                    </div>
                    <h3 className="text-sm font-mono font-bold" style={{ color: '#f0f0f0' }}>
                      {t(sourceOp.display_name, lang)}
                      <span className="mx-2 text-base" style={{ color: 'rgba(255,255,255,0.15)' }}>⟷</span>
                      {t(targetOp.display_name, lang)}
                    </h3>
                    <div className="mt-0.5 text-xs font-mono" style={{ color: style.color }}>
                      {label}
                    </div>
                  </div>
                  <span className="text-[8px] font-mono px-1.5 py-0.5 border uppercase tracking-wider"
                    style={{
                      color: relation.confidence_level === 'official_fact' ? '#00b4d8' : 'rgba(255,255,255,0.3)',
                      borderColor: relation.confidence_level === 'official_fact' ? '#00b4d844' : 'rgba(255,255,255,0.08)',
                      flexShrink: 0,
                    }}>
                    {confidence}
                  </span>
                </div>

                <div className="h-px mb-3" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }} />

                {/* 事件 */}
                <div className="mb-2">
                  <span className="text-[8px] font-mono uppercase tracking-wider" style={{ color: 'rgba(242, 161, 4, 0.4)' }}>
                    {event.id}
                  </span>
                  <span className="text-[10px] font-mono ml-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {evTitle}
                  </span>
                </div>

                {/* 证据 */}
                {relation.evidences.map((ev, i) => (
                  <div key={i} className="mt-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[8px] font-mono uppercase tracking-wider" style={{ color: 'rgba(242, 161, 4, 0.3)' }}>
                        #{i + 1} {ev.source_story}
                      </span>
                    </div>
                    <blockquote
                      className="text-[11px] italic leading-relaxed pl-3 border-l"
                      style={{
                        color: 'rgba(255,255,255,0.6)',
                        borderColor: style.color + '55',
                      }}
                    >
                      {t(ev.quote, lang)}
                    </blockquote>
                    {ev.context_analysis && (
                      <p className="text-[9px] mt-1 leading-relaxed pl-3" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        {t(ev.context_analysis, lang)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default RelationPanel;