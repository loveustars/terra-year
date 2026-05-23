# CDN Asset Loading Strategy

为了防止 Git 仓库膨胀并保证中国大陆用户的极速加载体验，本项目一律通过外部 CDN 动态拼装干员头像与势力 Logo。

## 1. 核心 URL 拼装公式 (干员头像)

AI Agent 在实现组件图像渲染时，必须统一调用此逻辑：

```typescript
const MASTER_CDN_PREFIX = "https://fastly.jsdelivr.net/gh/Aceship/Arknight-Images@main/avatars/";
const FALLBACK_CDN_PREFIX = "https://gcore.jsdelivr.net/gh/ArknightsAssets/ArknightsAssets/cn/assets/torappu/dynamicassets/arts/charportraits/";

export function getOperatorAvatarUrl(avatarKey: string, useFallback = false): string {
  if (useFallback) {
    return `${FALLBACK_CDN_PREFIX}${avatarKey}_1.png`;
  }
  return `${MASTER_CDN_PREFIX}${avatarKey}.png`;
}