import React, { useMemo, useState, useCallback, useRef, useEffect, useReducer } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Operator, OperatorRelation, TerraEvent, LangKey } from '../hooks/useTerraData';
import { RELATION_TYPE_STYLES } from '../utils/assets';
import OperatorAvatar, { ErrorBoundary } from './OperatorAvatar';

interface GraphNode extends Operator {
  x: number; y: number;
  connections: string[];
  rx: number; ry: number;
}

function circularLayout(ops: Operator[], rels: OperatorRelation[]): GraphNode[] {
  const connMap = new Map<string, Set<string>>();
  for (const r of rels) {
    if (!connMap.has(r.source)) connMap.set(r.source, new Set());
    if (!connMap.has(r.target)) connMap.set(r.target, new Set());
    connMap.get(r.source)!.add(r.target);
    connMap.get(r.target)!.add(r.source);
  }
  const cx = 400, cy = 300;
  const radius = ops.length <= 3 ? 150 : ops.length <= 5 ? 220 : ops.length <= 8 ? 280 : 320;
  return ops.map((op, i) => {
    const angle = (2 * Math.PI * i) / ops.length - Math.PI / 2;
    return {
      ...op,
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
      rx: cx + radius * Math.cos(angle),
      ry: cy + radius * Math.sin(angle),
      connections: Array.from(connMap.get(op.id) ?? []),
    };
  });
}

/* ---- SVG 连线 ---- */
interface SVGLineProps {
  x1: number; y1: number; x2: number; y2: number;
  hlColor: string; normalColor: string; highlighted: boolean;
}
const SVGLine: React.FC<SVGLineProps> = ({ x1, y1, x2, y2, hlColor, normalColor, highlighted }) => (
  <motion.line
    x1={x1} y1={y1} x2={x2} y2={y2}
    stroke={highlighted ? hlColor : normalColor}
    strokeWidth={highlighted ? 1.5 : 0.75}
    initial={{ opacity: 0, pathLength: 0 }}
    animate={{ opacity: highlighted ? 0.9 : 0.25, pathLength: 1 }}
    exit={{ opacity: 0, pathLength: 0 }}
    transition={{ duration: 0.45, ease: 'easeOut' }}
  />
);

interface SVG_LINESProps {
  rels: OperatorRelation[];
  highlighted: Set<string>;
  selId: string | null;
  /** Callback so SVG can read latest dragged positions from GraphCanvas's ref */
  getPos: (id: string) => { rx: number; ry: number };
}
const SVG_LINES: React.FC<SVG_LINESProps> = ({ rels, highlighted, selId, getPos }) => {
  // Use a FIXED viewBox so SVG coordinate space doesn't shift as nodes move.
  // The container's CSS transform (pan/zoom) is applied separately via transformRef.
  const FIXED_W = 800, FIXED_H = 600;

  return (
    <svg
      width={FIXED_W} height={FIXED_H}
      viewBox={`0 0 ${FIXED_W} ${FIXED_H}`}
      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 0, overflow: 'visible' }}
    >
      <AnimatePresence>
        {rels.map(r => {
          const srcPos = getPos(r.source);
          const tgtPos = getPos(r.target);
          if (!srcPos || !tgtPos) return null;
          const hl = !selId || highlighted.has(r.source) || highlighted.has(r.target);
          const st = RELATION_TYPE_STYLES[r.relation_type] ?? RELATION_TYPE_STYLES.neutral;
          return (
            <SVGLine
              key={r.id}
              x1={srcPos.rx} y1={srcPos.ry}
              x2={tgtPos.rx} y2={tgtPos.ry}
              hlColor={st.color}
              normalColor="rgba(255,255,255,0.12)"
              highlighted={hl}
            />
          );
        })}
      </AnimatePresence>
    </svg>
  );
};

/* ---- 图例 ---- */
const Legend: React.FC<{ lang: LangKey }> = ({ lang }) => {
  const types = ['allied', 'hostile', 'neutral', 'complex', 'bond', 'subordinate'];
  const labels: Record<string, Partial<Record<LangKey, string>>> = {
    allied: { zh_CN: '盟友', en_US: 'Allied' },
    hostile: { zh_CN: '敌对', en_US: 'Hostile' },
    neutral: { zh_CN: '中立', en_US: 'Neutral' },
    complex: { zh_CN: '复杂', en_US: 'Complex' },
    bond: { zh_CN: '羁绊', en_US: 'Bond' },
    subordinate: { zh_CN: '隶属', en_US: 'Subordinate' },
  };
  return (
    <div
      className="absolute bottom-20 right-6 z-10 flex flex-col gap-1"
      style={{ pointerEvents: 'none' }}
    >
      {types.map(t => {
        const st = RELATION_TYPE_STYLES[t] ?? RELATION_TYPE_STYLES.neutral;
        const label = labels[t]?.[lang] ?? t;
        return (
          <div key={t} className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 rounded-full" style={{ backgroundColor: st.color }} />
            <span className="text-[8px] font-mono tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

/* ---- 缩放控制 ---- */
const ZoomControls: React.FC<{ zi: () => void; zo: () => void; rst: () => void; z: number }> = ({ zi, zo, rst, z }) => (
  <div className="absolute bottom-20 left-6 z-10 flex flex-col gap-1">
    <button onClick={zi} className="w-7 h-7 rounded border flex items-center justify-center text-sm font-mono" style={{ borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)', background: 'rgba(0,0,0,0.4)' }}>+</button>
    <div className="text-center text-[8px] font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>{Math.round(z * 100)}%</div>
    <button onClick={zo} className="w-7 h-7 rounded border flex items-center justify-center text-sm font-mono" style={{ borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)', background: 'rgba(0,0,0,0.4)' }}>−</button>
    <button onClick={rst} className="w-7 h-7 rounded border flex items-center justify-center text-sm font-mono" style={{ borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)', background: 'rgba(0,0,0,0.4)' }}>⟲</button>
  </div>
);

interface GraphCanvasProps {
  operators: Operator[];
  relations: OperatorRelation[];
  operatorStatuses?: Map<string, { status: string; note?: string }>;
  currentEvent: TerraEvent;
  lang: LangKey;
  onSelectOperator?: (id: string | null, event?: { pageX: number; pageY: number }, avatarRect?: DOMRect) => void;
}

export default function GraphCanvas({
  operators, relations, operatorStatuses = new Map(), currentEvent, lang, onSelectOperator,
}: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef({ tx: 0, ty: 0, s: 1 });
  const [, forceUpdate] = useReducer(x => x + 1, 0);

  const isDraggingCanvas = useRef(false);
  const lastPan = useRef({ x: 0, y: 0 });
  const dragNodeRef = useRef<{ id: string; startX: number; startY: number; origRx: number; origRy: number } | null>(null);
  const nodePosMapRef = useRef<Record<string, { rx: number; ry: number }>>({});

  const nodes = useMemo(() => circularLayout(operators, relations), [operators, relations]);

  useEffect(() => {
    const nextIds = new Set(nodes.map(n => n.id));
    Object.keys(nodePosMapRef.current).forEach(id => {
      if (!nextIds.has(id)) delete nodePosMapRef.current[id];
    });
    nodes.forEach(n => {
      if (!nodePosMapRef.current[n.id]) {
        nodePosMapRef.current[n.id] = { rx: n.rx, ry: n.ry };
      }
    });
    forceUpdate();
  }, [nodes]);

  const [selId, setSelId] = useState<string | null>(null);

  const highlighted = useMemo(() => {
    if (!selId) return new Set<string>();
    const s = new Set([selId]);
    nodes.find(n => n.id === selId)?.connections.forEach(c => s.add(c));
    return s;
  }, [selId, nodes]);

  const apply = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const t = transformRef.current;
    el.style.transform = `translate(${t.tx}px, ${t.ty}px) scale(${t.s})`;
    forceUpdate();
  }, []);

  useEffect(() => { apply(); }, [apply]);

  const nodePos = useCallback((id: string) => nodePosMapRef.current[id] ?? nodes.find(n => n.id === id) ?? { rx: 400, ry: 300 }, [nodes]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('button')) return;
    isDraggingCanvas.current = true;
    lastPan.current = { x: e.clientX, y: e.clientY };
  }, []);

  const startNodeDrag = useCallback((id: string, startX: number, startY: number) => {
    const pos = nodePosMapRef.current[id] ?? nodes.find(n => n.id === id) ?? { rx: 0, ry: 0 };
    dragNodeRef.current = { id, startX, startY, origRx: pos.rx, origRy: pos.ry };
  }, [nodes]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragNodeRef.current) {
      const d = dragNodeRef.current;
      const dx = (e.clientX - d.startX) / transformRef.current.s;
      const dy = (e.clientY - d.startY) / transformRef.current.s;
      nodePosMapRef.current[d.id] = { rx: d.origRx + dx, ry: d.origRy + dy };
      forceUpdate();
      return;
    }
    if (!isDraggingCanvas.current) return;
    const t = transformRef.current;
    const dx = (e.clientX - lastPan.current.x) / t.s;
    const dy = (e.clientY - lastPan.current.y) / t.s;
    lastPan.current = { x: e.clientX, y: e.clientY };
    t.tx += dx;
    t.ty += dy;
    apply();
  }, [apply]);

  const onMouseUp = useCallback(() => {
    dragNodeRef.current = null;
    isDraggingCanvas.current = false;
  }, []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const t = transformRef.current;
    const rect = containerRef.current?.parentElement?.getBoundingClientRect();
    if (!rect) return;
    const factor = e.deltaY > 0 ? 0.92 : 1.08;
    const newS = Math.max(0.8, Math.min(1.4, t.s * factor));
    const mx = (e.clientX - rect.left) / rect.width;
    const my = (e.clientY - rect.top) / rect.height;
    t.tx -= (newS - t.s) * (containerRef.current!.clientWidth * mx) / (t.s * newS);
    t.ty -= (newS - t.s) * (containerRef.current!.clientHeight * my) / (t.s * newS);
    t.s = newS;
    apply();
  }, [apply]);

  const zoomIn = useCallback(() => {
    const t = transformRef.current;
    t.s = Math.min(1.4, t.s * 1.25);
    apply();
  }, [apply]);
  const zoomOut = useCallback(() => {
    const t = transformRef.current;
    t.s = Math.max(0.8, t.s * 0.8);
    apply();
  }, [apply]);
  const resetView = useCallback(() => {
    const t = transformRef.current;
    t.tx = 0; t.ty = 0; t.s = 1;
    apply();
  }, [apply]);

  const handleSelect = useCallback((id: string, e?: React.MouseEvent, avatarRect?: DOMRect) => {
    const next = selId === id ? null : id;
    setSelId(next);
    onSelectOperator?.(next, e ? { pageX: e.pageX, pageY: e.pageY } : undefined, avatarRect);
  }, [selId, onSelectOperator]);

  const zoom = transformRef.current.s;

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ cursor: isDraggingCanvas.current ? 'grabbing' : 'grab' }}>
      {/* Transform 容器：CSS transform 实现缩放/平移 */}
      <div
        ref={containerRef}
        className="absolute inset-0 will-change-transform"
        style={{ transformOrigin: '0 0' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
      >
        {/* SVG 连线 */}
        <SVG_LINES rels={relations} highlighted={highlighted} selId={selId} getPos={nodePos} />

        {/* HTML 节点 */}
        <AnimatePresence>
          {nodes.map(node => {
            const pos = nodePos(node.id);
            const label = node.display_name[lang] ?? node.display_name.zh_CN;
            const hl = !selId || highlighted.has(node.id);
            return (
              <motion.div
                key={node.id}
                onClick={(e) => { e.stopPropagation(); const rect = e.currentTarget.getBoundingClientRect(); handleSelect(node.id, e, rect); }}
                onMouseDown={(e) => { if (e.button === 0) startNodeDrag(node.id, e.clientX, e.clientY); }}
                className="absolute flex flex-col items-center cursor-pointer transition-opacity duration-200"
                initial={{ scale: 0.35, opacity: 0 }}
                animate={{ scale: 1, opacity: hl ? 1 : 0.3 }}
                exit={{ scale: 0.35, opacity: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                style={{
                  left: pos.rx, top: pos.ry,
                  x: '-50%',
                  y: '-50%',
                  zIndex: selId === node.id ? 20 : hl ? 10 : 1,
                  filter: hl ? 'none' : 'grayscale(0.5)',
                }}
              >
                {selId === node.id && (
                  <div className="absolute rounded-full" style={{
                    width: 60, height: 60,
                    border: '1.5px solid rgba(242, 161, 4, 0.35)',
                    boxShadow: '0 0 20px rgba(242, 161, 4, 0.15)',
                    animation: 'pulse-ring 2s ease-in-out infinite',
                  }} />
                )}
                <ErrorBoundary>
                  <OperatorAvatar
                    avatarKey={node.avatar_key}
                    name={label}
                    aliases={[node.id, node.display_name.zh_CN, node.display_name.en_US]}
                    highlighted={hl}
                    size={44}
                    isDeceased={operatorStatuses.get(node.id)?.status === "deceased"}
                  />
                </ErrorBoundary>
                {operatorStatuses.has(node.id) && (
                  <div className="absolute -top-1 -right-2 flex items-center gap-1">
                    <span className="text-[7px] font-mono px-1 py-0.5 border"
                      style={{
                        backgroundColor: operatorStatuses.get(node.id)!.status === 'deceased' ? 'rgba(200,0,0,0.2)' : 'rgba(0,180,216,0.15)',
                        borderColor: operatorStatuses.get(node.id)!.status === 'deceased' ? 'rgba(200,0,0,0.3)' : 'rgba(0,180,216,0.2)',
                        color: operatorStatuses.get(node.id)!.status === 'deceased' ? '#ff6b6b' : '#00b4d8',
                      }}>
                      {operatorStatuses.get(node.id)!.status.toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="text-[9px] font-mono mt-1 select-none whitespace-nowrap transition-colors duration-200"
                  style={{
                    color: hl ? '#f5f5f5' : 'rgba(255,255,255,0.2)',
                    letterSpacing: '0.05em',
                    textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                  }}>
                  {label}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <Legend lang={lang} />
      <ZoomControls zi={zoomIn} zo={zoomOut} rst={resetView} z={zoom} />

      <div className="absolute top-6 right-6 z-10 text-right">
        <div className="text-[8px] font-mono tracking-[0.2em] uppercase" style={{ color: 'rgba(242, 161, 4, 0.4)' }}>{currentEvent.id}</div>
        <div className="text-[9px] font-mono tracking-[0.1em] mt-0.5" style={{ color: 'rgba(255,255,255,0.15)' }}>{relations.length} RLT / {operators.length} OPS</div>
      </div>

      {!selId && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 pointer-events-none text-center">
          <div className="text-[8px] font-mono tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.06)' }}>DRAG TO PAN · SCROLL TO ZOOM</div>
        </div>
      )}
    </div>
  );
}
