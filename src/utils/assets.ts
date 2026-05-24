/**
 * 干员头像加载工具
 *
 * 优先使用本地素材（public/assets/avatars/），
 * 本地不存在时回退到 CDN 远程加载。
 */

const MASTER_CDN_PREFIX = 'https://fastly.jsdelivr.net/gh/Aceship/Arknight-Images@main/avatars/';
const FALLBACK_CDN_PREFIX = 'https://gcore.jsdelivr.net/gh/ArknightsAssets/ArknightsAssets/cn/assets/torappu/dynamicassets/arts/charportraits/';

export function getOperatorAvatarUrl(
  avatarKey: string,
  useFallback: boolean = false,
): string {
  if (useFallback) {
    return `${FALLBACK_CDN_PREFIX}${avatarKey}_1.png`;
  }
  return `${MASTER_CDN_PREFIX}${avatarKey}.png`;
}

/** 头像占位色：根据干员 id hash 取色 */
export function avatarPlaceholderColor(id: string): string {
  const colors = [
    'rgba(0, 194, 255, 0.08)',
    'rgba(0, 180, 216, 0.08)',
    'rgba(255, 255, 255, 0.04)',
    'rgba(200, 120, 200, 0.08)',
    'rgba(100, 200, 150, 0.08)',
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export const FACTION_LABELS: Record<string, { zh_CN: string; en_US: string }> = {
  babel: { zh_CN: '巴别塔', en_US: 'Babel' },
  rhodes_island: { zh_CN: '罗德岛', en_US: 'Rhodes Island' },
  penguin_logistics: { zh_CN: '企鹅物流', en_US: 'Penguin Logistics' },
  lungmen: { zh_CN: '龙门', en_US: 'Lungmen' },
  abyss: { zh_CN: '深海猎人', en_US: 'Abyssal Hunters' },
};

export const RELATION_TYPE_STYLES: Record<
  string,
  { color: string; label: Record<string, string>; dash: string }
> = {
  ally: { color: '#00b4d8', label: { zh_CN: '盟友', en_US: 'Ally' }, dash: '4 4' },
  allied: { color: '#00b4d8', label: { zh_CN: '盟友', en_US: 'Allied' }, dash: '4 4' },
  hostile: { color: '#ff4757', label: { zh_CN: '敌对', en_US: 'Hostile' }, dash: '8 4' },
  rival: { color: '#ff4757', label: { zh_CN: '敌对', en_US: 'Rival' }, dash: '8 4' },
  neutral: { color: '#a0a0a0', label: { zh_CN: '中立', en_US: 'Neutral' }, dash: '4 4' },
  complex: { color: '#00c2ff', label: { zh_CN: '复杂', en_US: 'Complex' }, dash: '6 3' },
  bound: { color: '#00c2ff', label: { zh_CN: '羁绊', en_US: 'Bound' }, dash: '' },
  subordinate: { color: 'rgba(255,255,255,0.3)', label: { zh_CN: '隶属', en_US: 'Subordinate' }, dash: '2 4' },
  unknown: { color: 'rgba(255,255,255,0.15)', label: { zh_CN: '未知', en_US: 'Unknown' }, dash: '2 2' },
};
