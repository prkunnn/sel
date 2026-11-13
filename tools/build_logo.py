# 把 LOGO 文字轉成向量路徑（字型：Noto Sans CJK TC Black，SIL OFL 授權）
from fontTools.ttLib import TTCollection
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

ttc = TTCollection('/usr/share/fonts/opentype/noto/NotoSansCJK-Black.ttc')
font = next(f for f in ttc.fonts if 'TC' in f['name'].getDebugName(1))
gs = font.getGlyphSet(); cmap = font.getBestCmap(); upm = font['head'].unitsPerEm

def text_path(text, x, y, size, spacing=0, anchor='start'):
    s = size / upm
    widths = [font['hmtx'][cmap[ord(ch)]][0] * s + spacing for ch in text]
    total = sum(widths) - spacing
    cx = x - total / 2 if anchor == 'middle' else x
    pen = SVGPathPen(gs)
    for ch, w in zip(text, widths):
        tp = TransformPen(pen, (s, 0, 0, -s, cx, y))
        gs[cmap[ord(ch)]].draw(tp)
        cx += w
    return pen.getCommands(), total

def layered(d, fill, outer=18, inner=5):
    return (f'<path d="{d}" fill="none" stroke="#23395b" stroke-width="{outer}" stroke-linejoin="round"/>\n'
            f'<path d="{d}" fill="none" stroke="#fff" stroke-width="{inner}" stroke-linejoin="round"/>\n'
            f'<path d="{d}" fill="{fill}"/>\n')

ok, okw = text_path('OK', 70, 160, 124)
title, tw = text_path('曲線衝浪', 262, 150, 86)
sub, sw = text_path('我的校園一天', 320, 272, 28, spacing=4, anchor='middle')
print('OK width', round(okw), 'title end', round(262 + tw))

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 300">
  <!-- 文字已轉為向量路徑，不依賴使用者電腦的字型（Noto Sans CJK TC Black, SIL OFL）。由 tools/build_logo.py 產生 -->
  <defs>
    <linearGradient id="wv" x1="0" x2="1">
      <stop offset="0" stop-color="#ff7a59"/><stop offset=".5" stop-color="#3fbf7f"/><stop offset="1" stop-color="#5b8def"/>
    </linearGradient>
    <linearGradient id="txt" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff3b0"/><stop offset="1" stop-color="#ffbb2e"/>
    </linearGradient>
    <linearGradient id="okg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#9ff0c4"/><stop offset="1" stop-color="#2fae6e"/>
    </linearGradient>
  </defs>
  <path d="M60 150c-30 0-44-36-16-52 2-34 46-46 66-22 18-36 74-36 92-4 22-30 74-22 80 12 20-24 66-18 72 14 22-22 72-14 76 20 18-14 56-6 58 22 30 4 34 46 4 56 6 32-30 50-56 34-18 28-66 26-80 0-22 26-70 22-82-4-24 26-72 22-84-6-22 24-66 20-78-6-26 20-70 12-74-18-30 12-62-6-58-36z" fill="#fff" opacity=".92"/>
  <path d="M40 228 C110 170 160 280 240 222 S370 160 440 220 S560 270 610 210" fill="none" stroke="url(#wv)" stroke-width="18" stroke-linecap="round"/>
  <path d="M40 228 C110 170 160 280 240 222 S370 160 440 220 S560 270 610 210" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-dasharray="2 18" opacity=".9"/>
{layered(ok, 'url(#okg)', 20, 5)}{layered(title, 'url(#txt)', 16, 5)}
  <rect x="180" y="236" width="280" height="48" rx="24" fill="#23395b"/>
  <path d="{sub}" fill="#fff"/>
  <g fill="#fff" stroke="#23395b" stroke-width="3">
    <circle cx="610" cy="192" r="9"/><circle cx="628" cy="210" r="6"/><circle cx="34" cy="214" r="7"/>
  </g>
  <path d="M590 60l6 14 15 2-11 10 3 15-13-7-13 7 3-15-11-10 15-2z" fill="#ffd35c" stroke="#23395b" stroke-width="3" stroke-linejoin="round"/>
  <path d="M250 40l4 9 10 1-7 7 2 10-9-5-9 5 2-10-7-7 10-1z" fill="#ffd35c" stroke="#23395b" stroke-width="2.5" stroke-linejoin="round"/>
</svg>
'''
import os; open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'svg', 'logo.svg'), 'w').write(svg)
print('bytes', len(svg))
