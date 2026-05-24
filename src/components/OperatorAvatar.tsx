import React, { useState, useCallback, Component, ReactNode, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';

/**
 * ErrorBoundary — 捕获子组件渲染错误，防止整棵树上层崩溃
 */
interface ErrorBoundaryProps { children: ReactNode; fallback?: ReactNode; }
interface ErrorBoundaryState { hasError: boolean; message: string; }

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, message: '' };
  }
  static getDerivedStateFromError(e: unknown) {
    return { hasError: true, message: String(e) };
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex items-center justify-center w-full h-full text-[10px] font-mono" style={{color:'rgba(255,80,80,0.4)'}}>
          RENDER ERROR: {this.state.message}
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * OperatorAvatar — 干员头像组件
 *
 * 加载策略：本地 → 游戏资源CDN → Aceship CDN → 占位SVG
 * 带有玻璃碎裂效果（牺牲状态）
 */

interface OperatorAvatar {
  avatarKey?: string;
  name: string;
  aliases?: Array<string | undefined>;
  highlighted?: boolean;
  size?: number;
  onClick?: () => void;
  isDeceased?: boolean;
}

const LOCAL_EXTENSIONS = ['webp', 'png', 'svg'] as const;

const LOCAL_AVATAR_ALIASES: Record<string, string[]> = {
  ACE: ['ace'],
  BigBear: ['bigbob'],
  Doctor: ['doctor'],
  Faust: ['faust'],
  GreyThroat: ['greythroat'],
  Mephisto: ['mephisto'],
  Mon3tr: ['mon3tr'],
  Nine: ['nine'],
  Rosmontis: ['rosmontis'],
  Scout: ['scout'],
  Talulah: ['talulah'],
  'Wei Yenwu': ['weiyenwu'],
  临光: ['nearl'],
  杜宾: ['dobermann'],
  弑君者: ['crownslayer'],
  碎骨: ['skullshatterer'],
  米莎: ['misha'],
  银灰: ['silverash'],
  星熊: ['hoshiguma'],
  魏彦吾: ['weiyenwu'],
  霜星: ['frostnova'],
  诗怀雅: ['swire'],
  煌: ['blaze'],
  红: ['red'],
  陨星: ['meteorite'],
  杰西卡: ['jessica'],
  霜叶: ['frostleaf'],
  芙兰卡: ['franka'],
  雷蛇: ['liskarm'],
  能天使: ['exusiai'],
  凯尔希: ['kaltsit'],
};

const CDN_CHAINS = [
  (key: string) => `https://raw.githubusercontent.com/yuanyan3060/ArknightsGameResource/main/avatar/${key}.png`,
  (key: string) => `https://raw.githubusercontent.com/Aceship/Arknight-Images/main/avatars/${key}.png`,
  (key: string) => `https://fastly.jsdelivr.net/gh/Aceship/Arknight-Images@main/avatars/${key}.png`,
];

function normalizeAlias(value: string): string {
  return value
    .toLowerCase()
    .replace(/['.]/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '');
}

function keySuffix(key: string): string | null {
  const charMatch = key.match(/^char_\d+_(.+)$/);
  if (charMatch) return charMatch[1];
  const npcMatch = key.match(/^npc_(.+)$/);
  if (npcMatch) return npcMatch[1];
  return null;
}

function addLocalCandidates(target: string[], seen: Set<string>, alias: string) {
  if (!alias) return;
  for (const ext of LOCAL_EXTENSIONS) {
    const url = `/assets/avatars/${alias}.${ext}`;
    if (!seen.has(url)) {
      seen.add(url);
      target.push(url);
    }
  }
}

const OperatorAvatar: React.FC<OperatorAvatar> = ({
  avatarKey,
  name,
  aliases = [],
  highlighted = false,
  size = 44,
  onClick,
  isDeceased = false
}) => {
  const [urlIndex, setUrlIndex] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const aliasKey = aliases.filter(Boolean).join('\0');
  
  // 触发碎裂动画
  const [shatterStep, setShatterStep] = useState(0);

  useEffect(() => {
    if (isDeceased) {
      setShatterStep(1); // Start shattered
      const t = setTimeout(() => setShatterStep(2), 100);
      return () => clearTimeout(t);
    } else {
      setShatterStep(0);
    }
  }, [isDeceased]);

  const avatarUrls = useMemo(() => {
    const urls: string[] = [];
    const seen = new Set<string>();
    const safeKey = avatarKey?.trim();

    if (safeKey) {
      addLocalCandidates(urls, seen, safeKey);
      const suffix = keySuffix(safeKey);
      if (suffix) addLocalCandidates(urls, seen, suffix);
    }

    const stableAliases = aliasKey ? aliasKey.split('\0') : [];
    for (const rawAlias of [name, ...stableAliases]) {
      if (!rawAlias) continue;
      for (const mapped of LOCAL_AVATAR_ALIASES[rawAlias] ?? []) {
        addLocalCandidates(urls, seen, mapped);
      }
      const normalized = normalizeAlias(rawAlias);
      if (normalized) addLocalCandidates(urls, seen, normalized);
    }

    if (safeKey) {
      for (const cdnUrl of CDN_CHAINS.map(makeUrl => makeUrl(safeKey))) {
        if (!seen.has(cdnUrl)) {
          seen.add(cdnUrl);
          urls.push(cdnUrl);
        }
      }
    }

    return urls;
  }, [avatarKey, aliasKey, name]);

  useEffect(() => {
    setUrlIndex(0);
    setLoadError(false);
  }, [avatarUrls]);

  const currentUrl = loadError ? undefined : avatarUrls[urlIndex];

  const handleError = useCallback(() => {
    const nextIdx = urlIndex + 1;
    if (nextIdx < avatarUrls.length) {
      setUrlIndex(nextIdx);
    } else {
      setLoadError(true);
    }
  }, [avatarUrls.length, urlIndex]);

  const h = size;
  const w = size;
  const cx = size / 2;
  const cy = size / 2;

  const clipId = `clip-${(avatarKey || name).replace(/[.#\s]/g, '_')}`;
  const points = `${cx - w * 0.46},${cy - h * 0.52} ${cx + w * 0.32},${cy - h * 0.52} ${cx + w * 0.46},${cy - h * 0.28} ${cx + w * 0.46},${cy + h * 0.28} ${cx - w * 0.32},${cy + h * 0.52} ${cx - w * 0.46},${cy + h * 0.24}`;
  const margin = 4;
  const outerPoints = `${cx - w * 0.48 - margin},${cy - h * 0.54 - margin} ${cx + w * 0.34 + margin},${cy - h * 0.54 - margin} ${cx + w * 0.50 + margin},${cy - h * 0.30 - margin} ${cx + w * 0.50 + margin},${cy + h * 0.30 + margin} ${cx - w * 0.34 - margin},${cy + h * 0.54 + margin} ${cx - w * 0.50 - margin},${cy + h * 0.26 + margin}`;

  // 简单的玻璃裂纹路径
  const crackPath = `
    M ${cx},${cy} L ${cx-w*0.3},${cy-h*0.4}
    M ${cx},${cy} L ${cx+w*0.4},${cy-h*0.2}
    M ${cx},${cy} L ${cx+w*0.1},${cy+h*0.4}
    M ${cx},${cy} L ${cx-w*0.4},${cy+h*0.1}
    M ${cx+w*0.2},${cy-h*0.1} L ${cx+w*0.3},${cy-h*0.4}
    M ${cx-w*0.1},${cy+h*0.2} L ${cx-w*0.3},${cy+h*0.5}
  `;

  return (
    <motion.svg
      width={size + 8}
      height={size + 8}
      viewBox={`0 0 ${size + 8} ${size + 8}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default', overflow: 'visible' }}
      animate={
        shatterStep === 1 ? { scale: [1, 1.1, 1], filter: 'contrast(1.5) brightness(1.2)' }
        : shatterStep === 2 ? { scale: 1, filter: 'grayscale(100%) contrast(1.2) brightness(0.7)' }
        : { scale: 1, filter: 'none' }
      }
      transition={{ duration: 0.3 }}
    >
      <defs>
        <clipPath id={clipId}>
          <polygon points={points} />
        </clipPath>
        {highlighted && (
          <filter id={`glow-${clipId}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        )}
      </defs>

      {highlighted && (
        <polygon
          points={outerPoints}
          fill="none"
          stroke={isDeceased ? "rgba(200, 0, 0, 0.4)" : "rgba(242, 161, 4, 0.3)"}
          strokeWidth="2"
          filter={`url(#glow-${clipId})`}
        >
          <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2s" repeatCount="indefinite" />
        </polygon>
      )}

      <polygon
        points={points}
        fill={loadError ? 'rgba(20, 20, 20, 0.6)' : 'rgba(255,255,255,0.04)'}
        stroke={highlighted ? (isDeceased ? 'rgba(200, 0, 0, 0.6)' : 'rgba(242, 161, 4, 0.5)') : 'rgba(255,255,255,0.08)'}
        strokeWidth={1.5}
      />

      {!loadError && currentUrl && (
        <image
          href={currentUrl}
          x={cx - w / 2}
          y={cy - h / 2}
          width={w}
          height={h}
          clipPath={`url(#${clipId})`}
          preserveAspectRatio="xMidYMid slice"
          opacity={highlighted ? 1 : 0.75}
          crossOrigin="anonymous"
          onError={handleError}
        />
      )}

      {/* 碎裂效果层 */}
      {isDeceased && (
        <>
          <path 
            d={crackPath} 
            stroke="rgba(255,255,255,0.8)" 
            strokeWidth="1.5"
            fill="none" 
            clipPath={`url(#${clipId})`}
          />
          <path 
            d={crackPath} 
            stroke="rgba(0,0,0,0.5)" 
            strokeWidth="3"
            fill="none" 
            clipPath={`url(#${clipId})`}
            style={{ mixBlendMode: 'overlay' }}
          />
          {/* 加入一些碎块的位移效果(通过几何切片，或者用多边形)，这里用简单的深色半透多边形来模拟玻璃渣 */}
          <polygon points={`${cx},${cy} ${cx-w*0.3},${cy-h*0.4} ${cx+w*0.1},${cy-h*0.45}`} fill="rgba(255,255,255,0.15)" clipPath={`url(#${clipId})`}/>
          <polygon points={`${cx},${cy} ${cx-w*0.4},${cy+h*0.1} ${cx},${cy+h*0.4}`} fill="rgba(0,0,0,0.2)" clipPath={`url(#${clipId})`}/>
        </>
      )}

      {loadError && (
        <text
          x={cx}
          y={cy + 4}
          textAnchor="middle"
          dominantBaseline="central"
          fill="rgba(255,255,255,0.2)"
          fontSize={Math.max(size * 0.3, 10)}
          fontFamily="monospace"
        >
          {name.charAt(0)}
        </text>
      )}
    </motion.svg>
  );
};

export { ErrorBoundary };
export default OperatorAvatar;
