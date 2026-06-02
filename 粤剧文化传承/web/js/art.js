/* =============================================================
 * art.js —— 粤剧主题 SVG 美术引擎
 * 以纯 SVG 生成脸谱、海报、名家头像、印章与纹样，
 * 确定性配色，离线可用，简约而不失绚丽。
 * ============================================================= */

const ART = (() => {

  // 六组粤剧戏服配色（底色 / 主色 / 金 / 点缀）
  const PALETTES = [
    { bg: '#7d1416', deep: '#4a0d0e', accent: '#e8b84b', ink: '#2b0708', glow: '#c8402f' }, // 朱红
    { bg: '#9c3b12', deep: '#5e2208', accent: '#f0c860', ink: '#3a1505', glow: '#d9742a' }, // 赭金
    { bg: '#155449', deep: '#0c332c', accent: '#e8c45a', ink: '#06231d', glow: '#2f8f6f' }, // 黛玉
    { bg: '#3a2a6e', deep: '#221842', accent: '#e6bf57', ink: '#140d29', glow: '#6a52b8' }, // 紫绶
    { bg: '#7a1538', deep: '#4a0c22', accent: '#edc15a', ink: '#2c0712', glow: '#c23a64' }, // 胭脂
    { bg: '#1f3b66', deep: '#10223f', accent: '#e4c25c', ink: '#08152b', glow: '#3f6bb0' }, // 黛蓝
  ];

  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  const pal = (seed) => PALETTES[(typeof seed === 'number' ? seed : hash(String(seed))) % PALETTES.length];

  const enc = (svg) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

  // 回纹 / 云纹 等可复用的纹样定义
  function defs(p, idp) {
    return `
    <defs>
      <linearGradient id="g${idp}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${p.bg}"/>
        <stop offset="1" stop-color="${p.deep}"/>
      </linearGradient>
      <radialGradient id="r${idp}" cx="0.5" cy="0.32" r="0.85">
        <stop offset="0" stop-color="${p.glow}" stop-opacity="0.55"/>
        <stop offset="1" stop-color="${p.deep}" stop-opacity="0"/>
      </radialGradient>
      <pattern id="cloud${idp}" width="60" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(0)">
        <path d="M8 28 q6 -10 16 -6 q4 -8 14 -4 q8 -2 10 6 q6 1 4 8 l-46 0 q-4 -4 -2 -8 z"
              fill="none" stroke="${p.accent}" stroke-opacity="0.13" stroke-width="1.4"/>
      </pattern>
    </defs>`;
  }

  // 牡丹花（写意）
  function peony(cx, cy, r, color, accent) {
    let petals = '';
    const n = 8;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const x = cx + Math.cos(a) * r * 0.5, y = cy + Math.sin(a) * r * 0.5;
      petals += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(r*0.42).toFixed(1)}" ry="${(r*0.26).toFixed(1)}"
        fill="${color}" fill-opacity="0.9" transform="rotate(${(a*180/Math.PI).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
    }
    return `<g>${petals}
      <circle cx="${cx}" cy="${cy}" r="${(r*0.28).toFixed(1)}" fill="${accent}"/>
      <circle cx="${cx}" cy="${cy}" r="${(r*0.14).toFixed(1)}" fill="${color}"/></g>`;
  }

  /* ---------- 脸谱 mask ---------- */
  function mask(seed, size = 240) {
    const p = pal(seed);
    const h = hash('mask' + seed);
    const browStyle = h % 3;
    const s = size;
    const cx = s / 2;
    const brow = browStyle === 0
      ? `<path d="M${cx-58} ${s*0.40} q28 -26 52 -4" /><path d="M${cx+58} ${s*0.40} q-28 -26 -52 -4"/>`
      : browStyle === 1
      ? `<path d="M${cx-60} ${s*0.42} q30 -34 56 2 l-10 6 q-22 -22 -40 0z" fill="${p.ink}"/><path d="M${cx+60} ${s*0.42} q-30 -34 -56 2 l10 6 q22 -22 40 0z" fill="${p.ink}"/>`
      : `<path d="M${cx-58} ${s*0.38} l50 10 -6 12 -46 -8z" fill="${p.ink}"/><path d="M${cx+58} ${s*0.38} l-50 10 6 12 46 -8z" fill="${p.ink}"/>`;
    return enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}">
      ${defs(p,'m')}
      <rect width="${s}" height="${s}" fill="url(#gm)"/>
      <rect width="${s}" height="${s}" fill="url(#cloudm)"/>
      <g stroke="${p.ink}" stroke-width="3" fill="none">
        <!-- 脸型 -->
        <path d="M${cx} ${s*0.14} C ${s*0.20} ${s*0.16}, ${s*0.16} ${s*0.62}, ${cx} ${s*0.90} C ${s*0.84} ${s*0.62}, ${s*0.80} ${s*0.16}, ${cx} ${s*0.14} Z"
              fill="#f3ead4"/>
        <!-- 额心牡丹 -->
      </g>
      ${peony(cx, s*0.26, s*0.12, p.bg, p.accent)}
      <g fill="${p.bg}">
        <path d="M${cx-52} ${s*0.50} q26 -16 46 0 q-22 22 -46 0z"/>
        <path d="M${cx+52} ${s*0.50} q-26 -16 -46 0 q22 22 46 0z"/>
      </g>
      <g stroke="${p.ink}" stroke-width="4" fill="none" stroke-linecap="round">${brow}</g>
      <g fill="${p.ink}">
        <ellipse cx="${cx-30}" cy="${s*0.52}" rx="9" ry="11"/>
        <ellipse cx="${cx+30}" cy="${s*0.52}" rx="9" ry="11"/>
      </g>
      <path d="M${cx} ${s*0.54} q-7 14 0 22 q7 -8 0 -22z" fill="${p.glow}"/>
      <path d="M${cx-26} ${s*0.70} q26 18 52 0 q-26 14 -52 0z" fill="${p.bg}" stroke="${p.ink}" stroke-width="2"/>
      <g stroke="${p.accent}" stroke-width="2.4" fill="none" opacity="0.9">
        <path d="M${cx-44} ${s*0.30} q-10 8 -4 18"/>
        <path d="M${cx+44} ${s*0.30} q10 8 4 18"/>
      </g>
    </svg>`);
  }

  /* ---------- 剧目海报 poster（带主字与纹样） ---------- */
  function poster(title, seed, opts = {}) {
    const p = pal(seed);
    const w = opts.w || 300, h = opts.h || 380;
    const ch = (title || '').slice(0, 4);
    const sub = opts.sub || '';
    const fontSize = ch.length >= 4 ? 58 : 66;
    // 竖排主字
    let chars = '';
    ch.split('').forEach((c, i) => {
      chars += `<text x="${w*0.5}" y="${h*0.30 + i*fontSize*1.06}" font-size="${fontSize}"
        font-family="STKaiti,KaiTi,'Kaiti SC','楷体',serif" font-weight="700"
        fill="#fff7e6" text-anchor="middle" style="paint-order:stroke" stroke="${p.ink}" stroke-width="1.2">${esc(c)}</text>`;
    });
    return enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
      ${defs(p,'p')}
      <rect width="${w}" height="${h}" fill="url(#gp)"/>
      <rect width="${w}" height="${h}" fill="url(#cloudp)"/>
      <rect width="${w}" height="${h}" fill="url(#rp)"/>
      <!-- 回纹边框 -->
      <rect x="10" y="10" width="${w-20}" height="${h-20}" fill="none" stroke="${p.accent}" stroke-width="2" rx="6"/>
      <rect x="16" y="16" width="${w-32}" height="${h-32}" fill="none" stroke="${p.accent}" stroke-opacity="0.5" stroke-width="1" rx="4"/>
      ${peony(w*0.5, h*0.80, 56, p.glow, p.accent)}
      <g opacity="0.9">${chars}</g>
      ${sub ? `<text x="${w*0.5}" y="${h*0.92}" font-size="15" letter-spacing="3"
        font-family="STKaiti,KaiTi,serif" fill="${p.accent}" text-anchor="middle">${esc(sub)}</text>` : ''}
      <!-- 印章 -->
      <g transform="translate(${w-54},34)">
        <rect width="30" height="30" rx="4" fill="${p.glow}" stroke="#fff7e6" stroke-width="1.5"/>
        <text x="15" y="21" font-size="15" font-family="STKaiti,serif" fill="#fff7e6" text-anchor="middle">粤</text>
      </g>
    </svg>`);
  }

  /* ---------- 名家头像 avatar（圆形脸谱） ---------- */
  function avatar(name, seed, size = 160) {
    const p = pal(seed);
    const s = size, cx = s/2;
    const initial = (name || '名').slice(0, 1);
    return enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}">
      ${defs(p,'a')}
      <circle cx="${cx}" cy="${cx}" r="${cx}" fill="url(#ga)"/>
      <circle cx="${cx}" cy="${cx}" r="${cx-3}" fill="none" stroke="${p.accent}" stroke-width="2"/>
      <circle cx="${cx}" cy="${cx}" r="${cx-9}" fill="none" stroke="${p.accent}" stroke-opacity="0.4" stroke-width="1"/>
      ${peony(cx, s*0.30, s*0.13, p.glow, p.accent)}
      <text x="${cx}" y="${s*0.70}" font-size="${s*0.42}" font-family="STKaiti,KaiTi,serif" font-weight="700"
        fill="#fff7e6" text-anchor="middle" stroke="${p.ink}" stroke-width="1" style="paint-order:stroke">${esc(initial)}</text>
    </svg>`);
  }

  /* ---------- 印章 LOGO ---------- */
  function seal(text = '粤', size = 88) {
    const p = PALETTES[0];
    const s = size;
    return enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}">
      <rect x="4" y="4" width="${s-8}" height="${s-8}" rx="10" fill="${p.bg}"/>
      <rect x="4" y="4" width="${s-8}" height="${s-8}" rx="10" fill="none" stroke="${p.accent}" stroke-width="2.5"/>
      <rect x="11" y="11" width="${s-22}" height="${s-22}" rx="6" fill="none" stroke="${p.accent}" stroke-opacity="0.5"/>
      <text x="${s/2}" y="${s*0.70}" font-size="${s*0.56}" font-family="STKaiti,KaiTi,serif" font-weight="700"
        fill="#fff7e6" text-anchor="middle">${esc(text)}</text>
    </svg>`);
  }

  /* ---------- 顶部横幅纹样（祥云描金） ---------- */
  function banner(seed, w = 800, h = 200) {
    const p = pal(seed);
    return enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice">
      ${defs(p,'b')}
      <rect width="${w}" height="${h}" fill="url(#gb)"/>
      <rect width="${w}" height="${h}" fill="url(#cloudb)"/>
      <rect width="${w}" height="${h}" fill="url(#rb)"/>
      ${peony(w*0.83, h*0.5, 80, p.glow, p.accent)}
      ${peony(w*0.14, h*0.78, 50, p.glow, p.accent)}
    </svg>`);
  }

  function esc(s) { return String(s).replace(/[<>&'"]/g, c => ({ '<':'&lt;','>':'&gt;','&':'&amp;',"'":'&#39;','"':'&quot;' }[c])); }

  return { mask, poster, avatar, seal, banner, peony, pal, PALETTES };
})();

window.ART = ART;
