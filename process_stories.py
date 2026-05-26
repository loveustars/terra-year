#!/usr/bin/env python3
"""
清洗明日方舟剧本文件：
- 保留对话行 [name="角色名"] xxx
- 保留 Decision 行，标注为博士说的话
- 保留纯叙述行（| 开头或无标签的纯文本段落）
- 删除所有游戏引擎标签（Character/Background/PlayMusic/CameraShake等）
- 删除空行

用法: python process_stories.py [输入目录] [输出目录]
"""

import os
import re
import sys
from pathlib import Path

# 引擎标签模式（整行删除）
ENGINE_TAGS = [
    r'^\[HEADER\(',
    r'^\[PlayMusic\(',
    r'^\[stopmusic\(',
    r'^\[Background\(',
    r'^\[Blocker\(',
    r'^\[Image\(',
    r'^\[ImageTween\(',
    r'^\[Delay\(',
    r'^\[CameraShake\(',
    r'^\[PlaySound\(',
    r'^\[Character\(',       # Character() 单独一行（引擎控制）
    r'^\[dialog\]\s*$',      # [Dialog] 空标签
    r'^\[character\]\s*$',   # [character] 空标签
    r'^\[image\]\s*$',       # [image] 空标签
    r'^\[image\(',            # [image(...) 纯引擎
    r'^\[Dialog\(',
    r'^\[Predicate\(',
    r'^\[Voice\(',
    r'^\[Filter\(',
    r'^\[FadeIn\(',
    r'^\[FadeOut\(',
    r'^\[stopmusic',
    r'^\[delay\(',
    r'^\[playMusic\(',
]

ENGINE_PATTERNS = [re.compile(p) for p in ENGINE_TAGS]

def is_engine_line(line: str) -> bool:
    """判断是否为引擎标签行（整行删除）"""
    s = line.strip()
    if not s:
        return True
    for pat in ENGINE_PATTERNS:
        if pat.match(s):
            return True
    return False

def process_line(line: str):
    """
    处理单行，返回 (keep: bool, output_line: str or None)
    - keep=True, output_line=str  -> 保留此行
    - keep=False, output_line=None -> 删除此行
    """
    s = line.strip()
    original = s

    # 删除引擎标签行
    if is_engine_line(s):
        return False, None

    # ========== [name="角色名"] 开头 -> 对话行 ==========
    name_m = re.match(r'^\[name="([^"]+)"\]\s*(.*)$', s)
    if name_m:
        speaker = name_m.group(1)
        rest = name_m.group(2).strip()
        if rest:
            return True, f'[{speaker}] {rest}'
        else:
            # 只有 [name="xxx"] 没有内容，整行删除
            return False, None

    # ========== [Decision(options=...] -> 博士说的话 ==========
    decision_m = re.match(r'^\[Decision\(options="([^"]*)",?\s*values="\d+"\)\]', s)
    if decision_m:
        text = decision_m.group(1)
        return True, f'[博士] {text}'

    # ========== 纯叙述行（无标签，以字母/中文开头，不是 | 开头）==========
    # 格式：没有 [ 包裹，直接是文本内容
    # 排除明显是引擎残渣的行
    if not s.startswith('[') and not s.startswith('#'):
        # 排除纯引擎残留（如单个关键词）
        # 纯叙述：长度大于3，或者含有空格（说明是句子）
        if len(s) > 3 or ' ' in s or '。' in s or '，' in s or '？' in s or '！' in s:
            return True, s
        # 太短的单字/无意义残留丢弃
        return False, None

    # 其他所有含 [ 的行 -> 引擎残留，丢弃
    if '[' in s:
        return False, None

    # 兜底保留
    return True, s

def process_file(filepath: Path, out_dir: Path):
    """处理单个剧本文件"""
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    output_lines = []
    for line in lines:
        keep, out = process_line(line.rstrip('\n'))
        if keep and out is not None:
            output_lines.append(out)

    # 写输出文件
    out_path = out_dir / (filepath.stem + '.txt')
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(output_lines))

    return out_path, len(lines), len(output_lines)

def main():
    if len(sys.argv) >= 3:
        in_dir = Path(sys.argv[1])
        out_dir = Path(sys.argv[2])
    else:
        # 默认路径
        base = Path(__file__).parent
        in_dir = base / 'levelfiles/cn/story/main'
        out_dir = base / 'levelfiles/cn/story/main_clean'

    out_dir.mkdir(parents=True, exist_ok=True)

    files = sorted(in_dir.glob('level_main_*.txt'))
    print(f'处理 {len(files)} 个文件...')
    print(f'输入: {in_dir}')
    print(f'输出: {out_dir}')

    total_in = 0
    total_out = 0
    for fp in files:
        out_path, n_in, n_out = process_file(fp, out_dir)
        total_in += n_in
        total_out += n_out
        print(f'  {fp.name}: {n_in} → {n_out} 行  → {out_path.name}')

    print(f'\n完成：{total_in} 行 → {total_out} 行（{len(files)} 文件）')
    print(f'输出目录: {out_dir}')

if __name__ == '__main__':
    main()