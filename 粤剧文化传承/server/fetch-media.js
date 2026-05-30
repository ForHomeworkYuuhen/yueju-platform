/* =============================================================
 * fetch-media.js —— 为「戏苑」媒体接入真实音视频源
 *
 * 策略（对应“接入一些真实的音频/视频”）：
 *   · 音频：seed 阶段已写入 archive.org 公共领域粤曲历史录音的直链
 *           （可直接 <audio> 播放）。本脚本会逐条 HEAD 校验其可用性。
 *   · 视频：在线检索哔哩哔哩，取与剧目最相关的真实视频 BV 号，
 *           回填为官方播放器嵌入地址（<iframe> 可播放）。
 *   · 离线 / 风控失败时自动跳过，视频回退为“原平台观看”链接，
 *           不影响应用其它功能。
 *
 * 运行：node server/fetch-media.js  （需外网；在受限环境下自动降级）
 * ============================================================= */
const { db, initSchema, tableCount } = require('./db');

initSchema();
if (tableCount('media') === 0) {
  console.log('媒体表为空，请先运行：npm run seed');
  process.exit(0);
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function biliSearch(keyword) {
  const url = `https://api.bilibili.com/x/web-interface/search/type?search_type=video&keyword=${encodeURIComponent(keyword)}&page=1`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6000);
  try {
    const r = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.bilibili.com/',
        'Accept': 'application/json',
      },
    });
    const j = await r.json();
    if (j && j.code === 0 && j.data && Array.isArray(j.data.result)) {
      const hit = j.data.result.find(v => v.bvid);
      return hit ? { bvid: hit.bvid, title: String(hit.title || '').replace(/<[^>]+>/g, '') } : null;
    }
    throw new Error('接口返回码 ' + (j && j.code));
  } finally {
    clearTimeout(timer);
  }
}

async function headOk(url) {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 7000);
    const r = await fetch(url, { method: 'GET', headers: { 'Range': 'bytes=0-1', 'User-Agent': 'Mozilla/5.0' }, signal: ctrl.signal });
    clearTimeout(timer);
    return r.status >= 200 && r.status < 400;
  } catch (e) { return false; }
}

async function main() {
  /* 1) 校验音频直链 */
  const audios = db.prepare("SELECT id,title,audio_url FROM media WHERE type='audio' AND audio_url<>''").all();
  let audioOk = 0;
  console.log(`校验 ${audios.length} 条音频直链（archive.org 历史录音）…`);
  for (const m of audios) {
    const ok = await headOk(m.audio_url);
    if (ok) audioOk++;
    console.log(`  ${ok ? '✓' : '✗'} ${m.title}`);
  }
  console.log(`音频可用：${audioOk}/${audios.length}\n`);

  /* 2) 视频：检索哔哩哔哩真实 BV 号并回填嵌入地址 */
  const videos = db.prepare("SELECT id,title,opera_id FROM media WHERE type='video'").all();
  console.log(`检索 ${videos.length} 条视频的哔哩哔哩真实来源…`);

  let online = true;
  try { await biliSearch('粤剧'); } catch (e) { online = false; console.log(`✗ 哔哩哔哩检索不可用（${e.message}），视频保留原平台链接。`); }

  let vOk = 0;
  if (online) {
    const upd = db.prepare('UPDATE media SET embed_url=?, src_note=? WHERE id=?');
    for (const m of videos) {
      const kw = m.title.split('·')[0] + ' 粤剧';
      try {
        const hit = await biliSearch(kw);
        if (hit) {
          const embed = `https://player.bilibili.com/player.html?bvid=${hit.bvid}&autoplay=0&high_quality=1&danmaku=0`;
          upd.run(embed, `哔哩哔哩 · ${hit.title}（实时检索）`, m.id);
          vOk++;
          console.log(`  ✓ ${m.title} → ${hit.bvid}`);
        } else {
          console.log(`  - ${m.title}：未找到合适视频`);
        }
        await sleep(500);
      } catch (e) {
        console.log(`  ✗ ${m.title}：检索失败（${e.message}）`);
      }
    }
  }

  console.log(`\n✓ 媒体来源接入完成：音频可用 ${audioOk} 条，视频嵌入 ${vOk}/${videos.length} 条。`);
  process.exit(0);
}

main().catch(e => { console.error('接入异常：', e); process.exit(1); });
