/* =============================================================
 * heat-data.js —— 粤剧热度分析数据源
 * 1) REGIONS：地区地理表（经纬度 + 粤剧流行权重），覆盖
 *    广东 21 个地级市 + 港澳 + 广西粤语区 + 海外华人聚居地。
 * 2) generatePerformances()：基于权重的大样本演出/活动记录生成器，
 *    采用可复现的伪随机（固定种子），样本量约 8000 条，作为
 *    地图热度聚合的明细来源（scrape.js 会优先尝试真实爬取再以此补全）。
 *
 * 权重依据：粤剧（广府大戏）以广府文化区（粤语区）为核心，
 * 广州、佛山为发源与最盛之地，港澳及广西粤语区次之，
 * 潮汕（潮剧）、梅州（客家汉剧）属其他剧种区，权重较低。
 * ============================================================= */

// name 须与地图 GeoJSON 的 properties.name 对应（广东市级图为“XX市”）
const REGIONS = [
  // ---- 广东 21 地级市（广东省城市级地图用） ----
  { code: 'gz', name: '广州市', province: '广东', lng: 113.2644, lat: 23.1291, weight: 100, core: 1 },
  { code: 'fs', name: '佛山市', province: '广东', lng: 113.1218, lat: 23.0218, weight: 94,  core: 1 },
  { code: 'zs', name: '中山市', province: '广东', lng: 113.3926, lat: 22.5170, weight: 72,  core: 1 },
  { code: 'jm', name: '江门市', province: '广东', lng: 113.0946, lat: 22.5907, weight: 74,  core: 1 },
  { code: 'zh', name: '珠海市', province: '广东', lng: 113.5767, lat: 22.2707, weight: 56,  core: 1 },
  { code: 'zq', name: '肇庆市', province: '广东', lng: 112.4720, lat: 23.0515, weight: 62,  core: 1 },
  { code: 'dg', name: '东莞市', province: '广东', lng: 113.7518, lat: 23.0207, weight: 66,  core: 1 },
  { code: 'sz', name: '深圳市', province: '广东', lng: 114.0579, lat: 22.5431, weight: 78,  core: 1 },
  { code: 'zj', name: '湛江市', province: '广东', lng: 110.3594, lat: 21.2707, weight: 50,  core: 0 },
  { code: 'mm', name: '茂名市', province: '广东', lng: 110.9192, lat: 21.6630, weight: 46,  core: 0 },
  { code: 'yj', name: '阳江市', province: '广东', lng: 111.9755, lat: 21.8590, weight: 44,  core: 0 },
  { code: 'qy', name: '清远市', province: '广东', lng: 113.0561, lat: 23.6817, weight: 40,  core: 0 },
  { code: 'yf', name: '云浮市', province: '广东', lng: 112.0444, lat: 22.9290, weight: 38,  core: 0 },
  { code: 'sg', name: '韶关市', province: '广东', lng: 113.5917, lat: 24.8011, weight: 30,  core: 0 },
  { code: 'hz', name: '惠州市', province: '广东', lng: 114.4161, lat: 23.1115, weight: 46,  core: 0 },
  { code: 'sw', name: '汕尾市', province: '广东', lng: 115.3729, lat: 22.7787, weight: 30,  core: 0 },
  { code: 'hy', name: '河源市', province: '广东', lng: 114.6978, lat: 23.7462, weight: 24,  core: 0 },
  { code: 'mz', name: '梅州市', province: '广东', lng: 116.1255, lat: 24.2992, weight: 12,  core: 0 },
  { code: 'st', name: '汕头市', province: '广东', lng: 116.6820, lat: 23.3535, weight: 12,  core: 0 },
  { code: 'cz', name: '潮州市', province: '广东', lng: 116.6229, lat: 23.6618, weight: 9,   core: 0 },
  { code: 'jy', name: '揭阳市', province: '广东', lng: 116.3559, lat: 23.5499, weight: 9,   core: 0 },

  // ---- 港澳 + 广西粤语区（全国省级地图用） ----
  { code: 'hk',  name: '香港特别行政区', province: '香港', lng: 114.1694, lat: 22.3193, weight: 95, core: 1 },
  { code: 'mo',  name: '澳门特别行政区', province: '澳门', lng: 113.5439, lat: 22.1987, weight: 55, core: 1 },
  { code: 'nn',  name: '南宁',  province: '广西', lng: 108.3669, lat: 22.8170, weight: 52, core: 1 },
  { code: 'wz',  name: '梧州',  province: '广西', lng: 111.2790, lat: 23.4767, weight: 62, core: 1 },
  { code: 'ylin',name: '玉林',  province: '广西', lng: 110.1810, lat: 22.6540, weight: 40, core: 1 },
  { code: 'bh',  name: '北海',  province: '广西', lng: 109.1200, lat: 21.4810, weight: 34, core: 1 },
  { code: 'gg',  name: '贵港',  province: '广西', lng: 109.5980, lat: 23.1110, weight: 30, core: 1 },

  // ---- 巡演 / 交流（省级地图用，体现晋京及对外交流演出） ----
  { code: 'bj', name: '北京', province: '北京', lng: 116.4074, lat: 39.9042, weight: 16, core: 0 },
  { code: 'sh', name: '上海', province: '上海', lng: 121.4737, lat: 31.2304, weight: 14, core: 0 },
  { code: 'hn', name: '海口', province: '海南', lng: 110.1990, lat: 20.0440, weight: 18, core: 0 },

  // ---- 海外华人聚居地（单独列表展示，不在中国地图上） ----
  { code: 'sgp', name: '新加坡', province: '海外', lng: 103.8198, lat: 1.3521,  weight: 30, core: 1, overseas: 1 },
  { code: 'kl',  name: '吉隆坡', province: '海外', lng: 101.6869, lat: 3.1390,  weight: 26, core: 1, overseas: 1 },
  { code: 'sf',  name: '旧金山', province: '海外', lng: -122.4194, lat: 37.7749, weight: 22, core: 1, overseas: 1 },
  { code: 'van', name: '温哥华', province: '海外', lng: -123.1207, lat: 49.2827, weight: 20, core: 1, overseas: 1 },
  { code: 'syd', name: '悉尼',  province: '海外', lng: 151.2093, lat: -33.8688, weight: 16, core: 1, overseas: 1 },
];

// 可复现伪随机（mulberry32）
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TROUPES = [
  '广州粤剧院', '广东粤剧院', '佛山粤剧院', '红豆粤剧团', '香港八和会馆',
  '深圳市粤剧团', '珠海市粤剧团', '广西粤剧团', '民间私伙局', '青年粤剧团',
];
const CHANNELS = [
  { k: 'offline',  w: 42, label: '线下演出' },
  { k: 'bilibili', w: 20, label: '哔哩哔哩' },
  { k: 'douyin',   w: 18, label: '抖音' },
  { k: 'wechat',   w: 12, label: '视频号' },
  { k: 'tv',       w: 8,  label: '电视/电台' },
];
const VENUE_SUFFIX = ['大剧院', '文化宫', '粤剧艺术中心', '文化馆', '戏院', '茶楼戏台', '影剧院', '群众艺术馆'];

function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }
function weightedPick(rng, items, wkey) {
  const total = items.reduce((s, x) => s + x[wkey], 0);
  let r = rng() * total;
  for (const x of items) { r -= x[wkey]; if (r <= 0) return x; }
  return items[items.length - 1];
}
const isLeap = y => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
const z2 = n => String(n).padStart(2, '0');
// 在指定年份内取一个真实日期；当年（部分年）只取到「今天」为止
function randomDateInYear(rng, year, today) {
  const maxDays = (year === today.getFullYear())
    ? Math.floor((today - new Date(year, 0, 1)) / 864e5) + 1   // 当年已过天数
    : (isLeap(year) ? 366 : 365);
  const d = new Date(year, 0, 1);
  d.setDate(d.getDate() + Math.floor(rng() * Math.max(1, maxDays)));
  return `${d.getFullYear()}-${z2(d.getMonth() + 1)}-${z2(d.getDate())}`;
}

/**
 * 生成大样本演出 / 活动明细（热度分析的明细来源）。
 * 设计要点（让聚合出来的热度更贴近真实规律）：
 *  · 地区记录数与「粤剧流行权重」正相关，核心广府区样本更密；
 *  · 年份按二次增长加权——近年演出与上传更密集（流媒体兴起）；
 *  · 剧目按「人气 popularity」加权抽取，热门剧目样本更多、上座更高；
 *  · 线上播放量叠加「年代系数」，2015 年后短视频/直播带来爆发式增长；
 *  · 全程使用固定种子的可复现伪随机，便于实训报告复现实验数据。
 * @param {Array} operas 剧目数组（含 popularity，用于人气加权与关联）
 * @param {number} scale 规模系数（越大样本越多，默认约 4 万条）
 * @returns {Array} performance 记录数组
 */
function generatePerformances(operas, scale = 2600) {
  const rng = mulberry32(20250601);
  const rows = [];
  const today = new Date();
  const startYear = 2005, endYear = today.getFullYear(), span = Math.max(1, endYear - startYear);
  // 当年只过了一部分，样本量按已过天数比例缩减（数据持续到「今天」为止）
  const curFrac = (Math.floor((today - new Date(endYear, 0, 1)) / 864e5) + 1) / (isLeap(endYear) ? 366 : 365);
  const operaList = (operas && operas.length ? operas : [{ id: null, title: '折子戏专场', popularity: 50 }])
    .map(o => ({ id: o.id, title: o.title, __pw: Math.max(1, o.popularity || 50) }));
  const maxPop = Math.max(...operaList.map(o => o.__pw), 1);

  // 年份抽样权重：t² 增长，越近的年份演出/上传越多；当年按已过比例折算
  const yearWeights = [];
  for (let y = startYear; y <= endYear; y++) {
    const t = (y - startYear) / span;
    let w = 0.5 + t * t * 2.4;
    if (y === endYear) w *= curFrac;
    yearWeights.push({ y, w: Math.max(0.05, w) });
  }

  for (const reg of REGIONS) {
    // 记录数与权重正相关；核心区再适度上浮
    const base = Math.round(reg.weight * scale / 100);
    const count = Math.max(12, Math.round(base * (reg.core ? 1.15 : 0.8)));
    for (let i = 0; i < count; i++) {
      const year = weightedPick(rng, yearWeights, 'w').y;
      const op = weightedPick(rng, operaList, '__pw');
      const ch = weightedPick(rng, CHANNELS, 'w');

      const t = (year - startYear) / span;
      const eraOnline = 0.5 + t * t * 3.2;                       // 线上播放的年代爆发系数
      const popFactor = 0.6 + (op.__pw / maxPop) * 0.8;          // 人气剧目上座 / 播放更高
      const heatBase = reg.weight * (0.7 + rng() * 0.9) * popFactor;

      const audience = ch.k === 'offline'
        ? Math.round(180 + heatBase * (6 + rng() * 14))
        : Math.round(20 + heatBase * (1 + rng() * 3));
      const onlinePlay = ch.k === 'offline'
        ? Math.round(heatBase * (8 + rng() * 30) * eraOnline)
        : Math.round(heatBase * (120 + rng() * 900) * eraOnline);
      rows.push({
        region: reg.name,
        province: reg.province,
        venue: reg.name.replace(/市|特别行政区/g, '') + pick(rng, VENUE_SUFFIX),
        troupe: pick(rng, TROUPES),
        opera_id: op.id,
        opera_title: op.title,
        date: randomDateInYear(rng, year, today),
        year,
        audience,
        online_play: onlinePlay,
        channel: ch.k,
        source: '大样本采集(合成)',
      });
    }
  }
  // 按日期排序，更接近真实采集顺序
  rows.sort((a, b) => a.date.localeCompare(b.date));
  return rows;
}

module.exports = { REGIONS, generatePerformances };
