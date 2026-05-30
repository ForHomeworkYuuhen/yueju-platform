/* =============================================================
 * scrape.js —— 粤剧热度数据「爬取」尝试 + 大样本补全
 *
 * 策略（对应需求“先尝试爬取，再用大样本数据集补全”）：
 *   1) 尝试从公开平台（哔哩哔哩搜索接口）实时爬取各地区
 *      “粤剧 + 地名” 的视频数量，作为线上热度的真实信号；
 *   2) 若网络不可用 / 接口风控失败，则跳过，保留 seed 阶段
 *      生成的大样本（约 8000 条）作为分析底座。
 *
 * 运行：node server/scrape.js
 * 需要外网访问；在受限环境下会自动降级，不影响地图分析。
 * ============================================================= */
const { db, initSchema, tableCount } = require('./db');
const { REGIONS } = require('./heat-data');

initSchema();
if (tableCount('opera') === 0) {
  console.log('数据库为空，请先运行：npm run seed');
  process.exit(0);
}

const today = () => new Date().toISOString().slice(0, 10);
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function biliCount(keyword) {
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
    if (j && j.code === 0 && j.data) return j.data.numResults || 0;
    throw new Error('接口返回码 ' + (j && j.code));
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const targets = REGIONS.filter(r => !r.overseas);
  console.log(`开始尝试爬取 ${targets.length} 个地区的线上热度（哔哩哔哩）…`);

  // 先探测连通性
  let online = true;
  try {
    const probe = await biliCount('粤剧');
    console.log(`✓ 连通成功，「粤剧」全站视频数：${probe}`);
  } catch (e) {
    online = false;
    console.log(`✗ 爬取不可用（${e.message}）。将使用已生成的大样本数据集进行分析。`);
  }

  if (!online) {
    const n = tableCount('performance');
    console.log(`当前演出样本：${n} 条（合成大样本），地图热度分析可正常进行。`);
    process.exit(0);
  }

  // 清理上一次的实时爬取数据，避免重复累加
  db.prepare("DELETE FROM performance WHERE source LIKE '%实时爬取%'").run();

  const ins = db.prepare(`INSERT INTO performance
    (region,province,venue,troupe,opera_id,opera_title,date,year,audience,online_play,channel,source)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`);
  const tx = db.transaction(rows => rows.forEach(r => ins.run(...r)));

  const rows = [];
  let ok = 0;
  for (const reg of targets) {
    const cityShort = reg.name.replace(/市|特别行政区/g, '');
    try {
      const cnt = await biliCount(`粤剧 ${cityShort}`);
      rows.push([reg.name, reg.province, '哔哩哔哩', '线上', null, '粤剧相关视频',
        today(), new Date().getFullYear(), 0, cnt * 50, 'bilibili', '哔哩哔哩搜索(实时爬取)']);
      ok++;
      console.log(`  ${reg.name}：${cnt} 个相关视频`);
      await sleep(400);
    } catch (e) {
      console.log(`  ${reg.name}：爬取失败（${e.message}），跳过`);
    }
  }
  if (rows.length) tx(rows);
  console.log(`\n✓ 实时爬取完成：成功 ${ok}/${targets.length} 个地区，新增 ${rows.length} 条线上热度记录。`);
  console.log(`演出样本总数：${tableCount('performance')} 条。`);
  process.exit(0);
}

main().catch(e => { console.error('爬取异常：', e); process.exit(1); });
