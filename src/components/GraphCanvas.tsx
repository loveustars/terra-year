import React, { useMemo, useState, useCallback, useRef, useEffect, useReducer } from 'react';
import type { Operator, OperatorRelation, TerraEvent, LangKey } from '../hooks/useTerraData';
import { RELATION_TYPE_STYLES } from '../utils/assets';
import OperatorAvatar, { ErrorBoundary } from './OperatorAvatar';

/* CSS Transform 驱动的平移/缩放（GPU 加速，实时更新） */

interface GraphNode extends Operator {
  x: number; y: number;
  connections: string[];
}

const BASE_W = 800, BASE_H = 600;

function circularLayout(ops: Operator[], rels: OperatorRelation[]): GraphNode[] {
  const connMap = new Map<string, Set<string>>();
  for (const r of rels) {
    if (!connMap.has(r.source)) connMap.set(r.source, new Set());
    if (!connMap.has(r.target)) connMap.set(r.target, new Set());
    connMap.get(r.source)!.add(r.target);
    connMap.get(r.target)!.add(r.source);
  }
  const cx = BASE_W / 2, cy = BASE_H / 2;
  const radius = ops.length <= 3 ? 100 : ops.length <= 5 ? 150 : 200;
  return ops.map((op, i) => {
    const angle = (2 * Math.PI * i) / ops.length - Math.PI / 2;
    return {
      ...op,
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
      connections: Array.from(connMap.get(op.id) ?? []),
    };
  });
}

/* ---- 关系连线 ---- */
const SVG_LINES: React.FC<{
  nodes: GraphNode[]; rels: OperatorRelation[];
  highlighted: Set<string>; selId: string | null; lang: LangKey;
}> = ({ nodes, rels, highlighted, selId, lang }) => (
  <svg width={BASE_W} height={BASE_H} className="absolute top-0 left-0 pointer-events-none z-0 overflow-visible">
    {rels.map(r => {
      const src = nodes.find(n => n.id === r.source);
      const tgt = nodes.find(n => n.id === r.target);
      if (!src || !tgt) return null;
      const hl = !selId || highlighted.has(r.source) || highlighted.has(r.target);
      const st = RELATION_TYPE_STYLES[r.relation_type] ?? RELATION_TYPE_STYLES.unknown;
      return (
        <g key={r.id}>
          {hl && <line x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y} stroke={st.color} strokeWidth={6} opacity={0.1} strokeLinecap="round" />}
          <line x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y} stroke={hl ? st.color : 'rgba(255,255,255,0.06)'} strokeWidth={hl ? 2 : 1} strokeDasharray={hl ? (st.dash || 'none') : 'none'} opacity={hl ? 1 : 0.3} />
{hl && r.relation_label ? <text x={(src.x+tgt.x)/2} y={(src.y+tgt.y)/2-6} textAnchor="middle" fill={st.color} fontSize="8" fontFamily="monospace" opacity={0.7}>{r.relation_label[lang] ?? r.relation_label.zh_CN}</text> : null}
        </g>
      );
    })}
  </svg>
);

/* ---- 缩放控件 ---- */
const ZoomControls: React.FC<{ zi: () => void; zo: () => void; rst: () => void; z: number }> = ({ zi, zo, rst, z }) => (
  <div className="absolute bottom-6 right-6 z-10 flex flex-col gap-1">
    {[
      { l: '+', o: zi, t: 'Zoom in' },
      { l: `${Math.round(z*100)}%`, o: undefined, t: '' },
      { l: '−', o: zo, t: 'Zoom out' },
      { l: '⟲', o: rst, t: 'Reset view' },
    ].map((b, i) =>
      b.o
        ? <button key={i} onClick={b.o} className="w-7 h-7 flex items-center justify-center text-[11px] font-mono border transition-colors hover:bg-white/5" style={{borderColor:'rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.4)',clipPath:'polygon(0 0, 85% 0, 100% 20%, 100% 100%, 15% 100%, 0 80%)'}} title={b.t}>{b.l}</button>
        : <span key={i} className="text-[8px] font-mono text-center block" style={{color:'rgba(255,255,255,0.15)'}}>{b.l}</span>
    )}
  </div>
);

/* ---- 图例 ---- */
const Legend: React.FC<{ lang: LangKey }> = ({ lang }) => (
  <div className="absolute bottom-6 left-6 z-10 flex flex-col gap-1.5">
    {Object.entries(RELATION_TYPE_STYLES).map(([k, s]) => (
      <div key={k} className="flex items-center gap-2 text-[9px] font-mono">
        <div className="w-4 h-px" style={{backgroundColor:s.color,...(s.dash?{borderTop:`1px dashed ${s.color}`,background:'transparent'}:{})}} />
        <span style={{color:'rgba(255,255,255,0.25)',letterSpacing:'0.1em'}}>{s.label[lang]??s.label.zh_CN}</span>
      </div>
    ))}
  </div>
);

/* ---- 主组件 ---- */
interface GraphCanvasProps {
  operators: Operator[]; relations: OperatorRelation[];
  operatorStatuses?: Map<string, { status: string; reason?: string }>;
  currentEvent: TerraEvent; lang: LangKey;
  onSelectOperator?: (id: string | null, event?: { pageX: number; pageY: number }) => void;
}

const GraphCanvas: React.FC<GraphCanvasProps> = ({ operators, relations, operatorStatuses = new Map(), currentEvent, lang, onSelectOperator }) => {
  const [selId, setSelId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const transformRef = useRef({ tx: 0, ty: 0, s: 1 });
  const [, forceUpdate] = useReducer(x => x + 1, 0);
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const nodes = useMemo(() => circularLayout(operators, relations), [operators, relations]);

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

  /* Drag */
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('button')) return;
    isDragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const t = transformRef.current;
    const dx = (e.clientX - lastPos.current.x) / t.s;
    const dy = (e.clientY - lastPos.current.y) / t.s;
    lastPos.current = { x: e.clientX, y: e.clientY };
    t.tx += dx;
    t.ty += dy;
    apply();
  }, [apply]);

  const onMouseUp = useCallback(() => { isDragging.current = false; }, []);

  /* Wheel zoom */
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const t = transformRef.current;
    const rect = containerRef.current?.parentElement?.getBoundingClientRect();
    if (!rect) return;
    const factor = e.deltaY > 0 ? 0.92 : 1.08;
    const newS = Math.max(0.2, Math.min(5, t.s * factor));
    const mx = (e.clientX - rect.left) / rect.width;
    const my = (e.clientY - rect.top) / rect.height;
    t.tx -= (newS - t.s) * (containerRef.current!.clientWidth * mx) / (t.s * newS);
    t.ty -= (newS - t.s) * (containerRef.current!.clientHeight * my) / (t.s * newS);
    t.s = newS;
    apply();
  }, [apply]);

  const zoomIn = useCallback(() => {
    const t = transformRef.current;
    t.s = Math.min(5, t.s * 1.25);
    apply();
  }, [apply]);
  const zoomOut = useCallback(() => {
    const t = transformRef.current;
    t.s = Math.max(0.2, t.s * 0.8);
    apply();
  }, [apply]);
  const resetView = useCallback(() => {
    const t = transformRef.current;
    t.tx = 0; t.ty = 0; t.s = 1;
    apply();
  }, [apply]);

  const handleSelect = useCallback((id: string, e?: React.MouseEvent) => {
    const next = selId === id ? null : id;
    setSelId(next);
    onSelectOperator?.(next, e ? { pageX: e.pageX, pageY: e.pageY } : undefined);
  }, [selId, onSelectOperator]);

  const zoom = transformRef.current.s;

  return (
    <div className="relative w-full h-full overflow-hidden" style={{cursor: isDragging.current ? 'grabbing' : 'grab'}}>
      {/* Transform 容器 */}
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
        <SVG_LINES nodes={nodes} rels={relations} highlighted={highlighted} selId={selId} lang={lang} />

        {/* HTML 节点 */}
        {nodes.map(node => {
          const label = node.display_name[lang] ?? node.display_name.zh_CN;
          const hl = !selId || highlighted.has(node.id);
          return (
            <div
              key={node.id}
              onClick={(e) => { e.stopPropagation(); handleSelect(node.id, e); }}
              className="absolute flex flex-col items-center cursor-pointer transition-opacity duration-200"
              style={{
                left: node.x, top: node.y,
                transform: 'translate(-50%, -50%)',
                zIndex: selId === node.id ? 20 : hl ? 10 : 1,
                opacity: hl ? 1 : 0.3,
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
              <OperatorAvatar avatarKey={node.avatar_key} name={label} highlighted={hl} size={44} />
            </ErrorBoundary>
              {/* 角色状态标签 */}
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
            </div>
          );
        })}
      </div>

      <Legend lang={lang} />
      <ZoomControls zi={zoomIn} zo={zoomOut} rst={resetView} z={zoom} />

      <div className="absolute top-6 right-6 z-10 text-right">
        <div className="text-[8px] font-mono tracking-[0.2em] uppercase" style={{color:'rgba(242, 161, 4, 0.4)'}}>{currentEvent.id}</div>
        <div className="text-[9px] font-mono tracking-[0.1em] mt-0.5" style={{color:'rgba(255,255,255,0.15)'}}>{relations.length} RLT / {operators.length} OPS</div>
      </div>

      {/* 提示 - 第一次交互后淡出 */}
      {!selId && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 pointer-events-none text-center">
          <div className="text-[8px] font-mono tracking-[0.2em]" style={{color:'rgba(255,255,255,0.06)'}}>DRAG TO PAN · SCROLL TO ZOOM</div>
        </div>
      )}
    </div>
  );
};

export default GraphCanvas;
