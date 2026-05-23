import React, { useState, useCallback, Component, ReactNode } from 'react';

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
 * 实现 Arknights 官网风格的 Hex 六边形裁切边框
 */

interface OperatorAvatarProps {
  /** 头像 key（如 'char_002_amiya'） */
  avatarKey: string;
  /** 干员显示名（备用显示） */
  name: string;
  /** 是否高亮（显示金色边框） */
  highlighted?: boolean;
  /** 尺寸（px 单位，默认 44） */
  size?: number;
  onClick?: () => void;
}

/** CDN 回退链 */
const CDN_CHAINS = [
  (key: string) => `https://raw.githubusercontent.com/yuanyan3060/ArknightsGameResource/main/avatar/${key}.png`,
  (key: string) => `https://raw.githubusercontent.com/Aceship/Arknight-Images/main/avatars/${key}.png`,
  (key: string) => `https://fastly.jsdelivr.net/gh/Aceship/Arknight-Images@main/avatars/${key}.png`,
];

/** 本地头像路径 */
function localUrl(key: string): string {
  // Vite 从 public/ 静态提供服务
  return `/assets/avatars/${key}.png`;
}

const OperatorAvatar: React.FC<OperatorAvatarProps> = ({
  avatarKey,
  name,
  highlighted = false,
  size = 44,
  onClick,
}) => {
  if (!avatarKey) return null;
  const [urlIndex, setUrlIndex] = useState(-1); // -1 = local, 0+ = CDN chain
  const [loadError, setLoadError] = useState(false);

  const currentUrl = loadError
    ? undefined
    : urlIndex === -1
      ? localUrl(avatarKey)
      : CDN_CHAINS[urlIndex](avatarKey);

  const handleError = useCallback(() => {
    const nextIdx = urlIndex + 1;
    if (nextIdx < CDN_CHAINS.length) {
      setUrlIndex(nextIdx);
    } else {
      setLoadError(true);
    }
  }, [urlIndex]);

  const half = size / 2;

  const h = size;
  const w = size;
  const cx = half;
  const cy = half;

  // SVG 六边形裁切坐标
  const clipId = `clip-${avatarKey.replace(/[.#]/g, '_')}`;
  const points = `${cx - w * 0.46},${cy - h * 0.52} ${cx + w * 0.32},${cy - h * 0.52} ${cx + w * 0.46},${cy - h * 0.28} ${cx + w * 0.46},${cy + h * 0.28} ${cx - w * 0.32},${cy + h * 0.52} ${cx - w * 0.46},${cy + h * 0.24}`;
  const margin = 4;
  const outerPoints = `${cx - w * 0.48 - margin},${cy - h * 0.54 - margin} ${cx + w * 0.34 + margin},${cy - h * 0.54 - margin} ${cx + w * 0.50 + margin},${cy - h * 0.30 - margin} ${cx + w * 0.50 + margin},${cy + h * 0.30 + margin} ${cx - w * 0.34 - margin},${cy + h * 0.54 + margin} ${cx - w * 0.50 - margin},${cy + h * 0.26 + margin}`;

  return (
    <svg
      width={size + 8}
      height={size + 8}
      viewBox={`0 0 ${size + 8} ${size + 8}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default', overflow: 'visible' }}
    >
      <defs>
        <clipPath id={clipId}>
          <polygon points={points} />
        </clipPath>
        {/* 发光滤镜 */}
        {highlighted && (
          <filter id={`glow-${clipId}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        )}
      </defs>

      {/* 高亮外发光 */}
      {highlighted && (
        <polygon
          points={outerPoints}
          fill="none"
          stroke="rgba(242, 161, 4, 0.3)"
          strokeWidth="2"
          filter={`url(#glow-${clipId})`}
        >
          <animate
            attributeName="opacity"
            values="0.4;0.8;0.4"
            dur="2s"
            repeatCount="indefinite"
          />
        </polygon>
      )}

      {/* 背景底色 */}
      <polygon
        points={points}
        fill={loadError ? 'rgba(20, 20, 20, 0.6)' : 'rgba(255,255,255,0.04)'}
        stroke={highlighted ? 'rgba(242, 161, 4, 0.5)' : 'rgba(255,255,255,0.08)'}
        strokeWidth={1.5}
      />

      {/* 头像图片 — SVG image 支持 onError（需配合 key 变更强制重渲染） */}
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

      {/* 加载失败占位 */}
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

      {/* 失败的 onError 无法在 SVG <image> 上直接捕获，仅显示首字 */}
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
    </svg>
  );
};

export { ErrorBoundary };
export default OperatorAvatar;
