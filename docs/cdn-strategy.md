# Avatar Asset Loading Strategy

The current app uses a local-first avatar strategy.

## Load Order

`OperatorAvatar.tsx` resolves avatars in this order:

1. `/assets/avatars/{avatar_key}.webp`
2. `/assets/avatars/{avatar_key}.png`
3. `/assets/avatars/{avatar_key}.svg`
4. suffix aliases such as `char_002_amiya` -> `amiya.webp`
5. known manual aliases such as `Doctor` -> `doctor.webp`
6. remote CDN fallbacks
7. text placeholder

## Local Asset Rules

- Place new avatar files in `public/assets/avatars/`.
- Prefer lowercase friendly filenames, for example `amiya.webp`, `doctor.webp`, `frostnova.webp`.
- Keep existing canonical-key files when present, for example `char_367_swllow.png`.
- Do not rename `avatar_key` just to match an asset file; use aliases or add a matching local file.

## CDN Fallbacks

Remote fallback URLs are used only after local candidates fail:

```ts
const CDN_CHAINS = [
  (key: string) => `https://raw.githubusercontent.com/yuanyan3060/ArknightsGameResource/main/avatar/${key}.png`,
  (key: string) => `https://raw.githubusercontent.com/Aceship/Arknight-Images/main/avatars/${key}.png`,
  (key: string) => `https://fastly.jsdelivr.net/gh/Aceship/Arknight-Images@main/avatars/${key}.png`,
];
```

Relationship agents usually should not modify avatar loading code. If an extracted character lacks an avatar, add an asset file or update the alias table in `OperatorAvatar.tsx`.
