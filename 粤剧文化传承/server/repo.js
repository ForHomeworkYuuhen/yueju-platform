/* =============================================================
 * repo.js —— 数据访问层（查询 + 行映射 + 关联展开）
 * 路由层只调用本模块，保持接口干净、SQL 集中。
 * ============================================================= */
const { db } = require('./db');

/* 分类名缓存 */
let CAT = null;
function loadCat() {
  if (CAT) return CAT;
  CAT = new Map();
  db.prepare('SELECT id,grp,name,descr FROM category').all()
    .forEach(c => CAT.set(c.id, c));
  return CAT;
}
const catName = id => (loadCat().get(id)?.name) || id;

function categories() {
  const grouped = {};
  db.prepare('SELECT id,grp,name,descr,sort FROM category ORDER BY grp,sort').all()
    .forEach(c => { (grouped[c.grp] = grouped[c.grp] || []).push({ id: c.id, name: c.name, desc: c.descr }); });
  return grouped;
}

/* ---------------- 剧目 ---------------- */
function mapOpera(o) {
  if (!o) return null;
  const roles = JSON.parse(o.roles || '[]');
  return {
    ...o,
    roles,
    famous: JSON.parse(o.famous || '[]'),
    genreName: catName(o.genre),
    troupeName: catName(o.troupe),
    eraName: catName(o.era),
    rolesText: roles.map(catName).join(' · '),
  };
}

function listOperas(f = {}) {
  let sql = 'SELECT * FROM opera WHERE 1=1';
  const p = [];
  if (f.genre) { sql += ' AND genre = ?'; p.push(f.genre); }
  if (f.era)   { sql += ' AND era = ?';   p.push(f.era); }
  if (f.troupe){ sql += ' AND troupe = ?';p.push(f.troupe); }
  let rows = db.prepare(sql).all(...p).map(mapOpera);
  if (f.role) rows = rows.filter(o => o.roles.includes(f.role));
  if (f.kw) {
    const kw = String(f.kw).toLowerCase();
    rows = rows.filter(o => (o.title + o.alias + o.playwright + o.summary + o.famous.join(''))
      .toLowerCase().includes(kw));
  }
  // 标注哪些剧目可「学唱」（有戏词选段），供前端点亮入口按钮
  const lc = new Map(db.prepare(
    'SELECT opera_id, COUNT(*) n FROM lyrics WHERE opera_id IS NOT NULL GROUP BY opera_id'
  ).all().map(r => [r.opera_id, r.n]));
  rows.forEach(o => { o.lyricsCount = lc.get(o.id) || 0; o.hasLyrics = o.lyricsCount > 0; });
  if (f.learn === '1' || f.learn === 1 || f.learn === true) rows = rows.filter(o => o.hasLyrics);
  const sort = f.sort || 'popularity';
  rows.sort((a, b) => sort === 'premiere' ? a.premiere - b.premiere : b.popularity - a.popularity);
  return rows;
}

function castOfOpera(operaId) {
  return db.prepare(`SELECT oa.role, a.* FROM opera_artist oa
    JOIN artist a ON a.id = oa.artist_id WHERE oa.opera_id = ?`).all(operaId)
    .map(r => ({ role: r.role, artist: mapArtist(r) }));
}

function getOpera(id) {
  const o = mapOpera(db.prepare('SELECT * FROM opera WHERE id = ?').get(id));
  if (!o) return null;
  o.cast = castOfOpera(id);
  o.media = listMedia({ opera: id });
  o.lyrics = db.prepare('SELECT id,title,note FROM lyrics WHERE opera_id = ?').all(id);
  o.lyricsCount = o.lyrics.length;
  o.hasLyrics = o.lyricsCount > 0;
  return o;
}

/* ---------------- 名家 ---------------- */
function mapArtist(a) {
  if (!a) return null;
  return {
    id: a.id, name: a.name, gender: a.gender, birth: a.birth, death: a.death,
    role: a.role, school: a.school, region: a.region, palette: a.palette,
    popularity: a.popularity, title: a.title, bio: a.bio, achievement: a.achievement,
    roleName: catName(a.role), schoolName: catName(a.school),
  };
}
function listArtists() {
  return db.prepare('SELECT * FROM artist ORDER BY popularity DESC').all().map(mapArtist);
}
function getArtist(id) {
  const a = mapArtist(db.prepare('SELECT * FROM artist WHERE id = ?').get(id));
  if (!a) return null;
  const ids = new Set();
  db.prepare('SELECT opera_id, role FROM opera_artist WHERE artist_id = ?').all(id)
    .forEach(x => ids.add(x.opera_id));
  a.works = [...ids].map(oid => {
    const o = mapOpera(db.prepare('SELECT * FROM opera WHERE id = ?').get(oid));
    const r = db.prepare('SELECT role FROM opera_artist WHERE opera_id=? AND artist_id=?').get(oid, id);
    return o ? { ...o, playedRole: r ? r.role : '' } : null;
  }).filter(Boolean);
  return a;
}

/* ---------------- 媒体 ---------------- */
function mapMedia(m) {
  if (!m) return null;
  const o = m.opera_id ? db.prepare('SELECT title FROM opera WHERE id=?').get(m.opera_id) : null;
  return { ...m, opera: m.opera_id, artist: m.artist_id, operaTitle: o ? o.title : '' };
}
function listMedia(f = {}) {
  let sql = 'SELECT * FROM media WHERE 1=1'; const p = [];
  if (f.type)  { sql += ' AND type = ?';     p.push(f.type); }
  if (f.opera) { sql += ' AND opera_id = ?'; p.push(f.opera); }
  let rows = db.prepare(sql).all(...p).map(mapMedia);
  if (f.kw) {
    const kw = String(f.kw).toLowerCase();
    rows = rows.filter(m => (m.title + m.performer + m.intro).toLowerCase().includes(kw));
  }
  return rows;
}
function getMedia(id) { return mapMedia(db.prepare('SELECT * FROM media WHERE id=?').get(id)); }

/* ---------------- 戏词 ---------------- */
function listLyrics() {
  return db.prepare('SELECT id,opera_id,title,source,note FROM lyrics').all()
    .map(l => ({ ...l, opera: l.opera_id }));
}
function getLyrics(id) {
  const l = db.prepare('SELECT id,opera_id,title,source,note FROM lyrics WHERE id=?').get(id);
  if (!l) return null;
  l.opera = l.opera_id;
  l.lines = db.prepare('SELECT text,yin,exp FROM lyric_line WHERE lyrics_id=? ORDER BY idx').all(id);
  return l;
}

/* ---------------- 热度分析聚合 ----------------
 * 热度并非凭空给定，而是统计自「演出样本表(performance)」：
 * 每条样本贡献 = (现场观众 + 0.15 × 线上播放量) × 年份权重，
 * 再按地区 / 省份 / 剧目分组求和，得到复合「热度指数」。
 *   · 现场观众权重高于线上播放（到场参与价值更高，线上以 0.15 折算）；
 *   · 年份权重 0.55→1.0 线性递增，近年的活跃度对当前热度贡献更大。
 * 这样地图、榜单、趋势的热度全部来源于真实演出统计与同一套算法。
 */
let _yr = null;
function yearRange() {
  if (!_yr) {
    const r = db.prepare('SELECT MIN(year) AS a, MAX(year) AS b FROM performance').get();
    _yr = { a: (r && r.a) || 2005, b: (r && r.b) || 2024 };
  }
  return _yr;
}
// 复合热度指数 SQL 表达式（al = performance 的表别名，传 '' 表示无别名）
function heatExpr(al = 'p') {
  const { a, b } = yearRange();
  const span = Math.max(1, b - a);
  const c = al ? al + '.' : '';
  return `CAST(ROUND(SUM((${c}audience + ${c}online_play*0.15) * (0.55 + 0.45*(${c}year-${a})/${span}.0))) AS INTEGER)`;
}
// 筛选条件片段（年份区间 + 渠道），返回可拼接的 ' AND ...' 与参数
function condFrag(f = {}, al = 'p') {
  const c = al ? al + '.' : '';
  const parts = [], args = [];
  if (f.from)    { parts.push(`${c}year >= ?`);   args.push(Number(f.from)); }
  if (f.to)      { parts.push(`${c}year <= ?`);   args.push(Number(f.to)); }
  if (f.channel) { parts.push(`${c}channel = ?`); args.push(f.channel); }
  return { frag: parts.map(p => ' AND ' + p).join(''), args };
}

function heatByCity(f = {}) {
  // 广东省内城市热度（地图：广东市级）
  const { frag, args } = condFrag(f, 'p');
  return db.prepare(`
    SELECT g.name, g.lng, g.lat, g.is_core,
           COUNT(p.id) AS shows,
           COALESCE(SUM(p.audience),0) AS audience,
           COALESCE(SUM(p.online_play),0) AS online,
           COALESCE(${heatExpr('p')},0) AS heat
    FROM region_geo g
    LEFT JOIN performance p ON p.region = g.name${frag}
    WHERE g.province = '广东'
    GROUP BY g.name
    ORDER BY heat DESC`).all(...args);
}
function heatByProvince(f = {}) {
  // 省级热度（地图：全国），含港澳广西等
  const { frag, args } = condFrag(f, 'p');
  return db.prepare(`
    SELECT p.province AS name,
           COUNT(p.id) AS shows,
           COALESCE(SUM(p.audience),0) AS audience,
           COALESCE(SUM(p.online_play),0) AS online,
           COALESCE(${heatExpr('p')},0) AS heat
    FROM performance p
    WHERE p.province <> '海外'${frag}
    GROUP BY p.province
    ORDER BY heat DESC`).all(...args);
}
function heatPoints(f = {}) {
  // 散点（含港澳广西及海外），用于地图打点 + 海外传播明细
  const { frag, args } = condFrag(f, 'p');
  return db.prepare(`
    SELECT g.name, g.lng, g.lat, g.province,
           CASE WHEN g.code IN ('sgp','kl','sf','van','syd') THEN 1 ELSE 0 END AS overseas,
           COUNT(p.id) AS shows,
           COALESCE(SUM(p.audience),0) AS audience,
           COALESCE(SUM(p.online_play),0) AS online,
           COALESCE(${heatExpr('p')},0) AS heat
    FROM region_geo g
    LEFT JOIN performance p ON p.region = g.name${frag}
    GROUP BY g.name
    ORDER BY heat DESC`).all(...args);
}
function perfByYear(f = {}) {
  // 年度趋势：保留完整年份轴，仅按渠道筛选
  const parts = [], args = [];
  if (f.channel) { parts.push('channel = ?'); args.push(f.channel); }
  const where = parts.length ? ' WHERE ' + parts.join(' AND ') : '';
  return db.prepare(`SELECT year, COUNT(id) AS shows,
    COALESCE(SUM(audience),0) AS audience, COALESCE(SUM(online_play),0) AS online
    FROM performance${where} GROUP BY year ORDER BY year`).all(...args);
}
function perfByChannel(f = {}) {
  // 渠道占比：按年份区间筛选（不按渠道筛，渠道本身是分组维度）
  const parts = [], args = [];
  if (f.from) { parts.push('year >= ?'); args.push(Number(f.from)); }
  if (f.to)   { parts.push('year <= ?'); args.push(Number(f.to)); }
  const where = parts.length ? ' WHERE ' + parts.join(' AND ') : '';
  return db.prepare(`SELECT channel, COUNT(id) AS shows,
    COALESCE(SUM(audience),0) AS audience, COALESCE(SUM(online_play),0) AS online
    FROM performance${where} GROUP BY channel ORDER BY shows DESC`).all(...args);
}
function topOperasByHeat(limit = 10, f = {}) {
  const { frag, args } = condFrag(f, 'p');
  return db.prepare(`SELECT p.opera_title AS title, p.opera_id AS id,
    COUNT(p.id) AS shows, COALESCE(${heatExpr('p')},0) AS heat
    FROM performance p WHERE p.opera_id IS NOT NULL${frag}
    GROUP BY p.opera_id ORDER BY heat DESC LIMIT ?`).all(...args, limit);
}
function heatOverview(f = {}) {
  const { frag, args } = condFrag(f, '');
  return db.prepare(`SELECT COUNT(id) AS shows,
    COALESCE(SUM(audience),0) AS audience, COALESCE(SUM(online_play),0) AS online,
    COALESCE(${heatExpr('')},0) AS heat,
    COUNT(DISTINCT region) AS regions, MIN(year) AS minY, MAX(year) AS maxY
    FROM performance WHERE 1=1${frag}`).get(...args);
}

/* ---------------- 公开演出 ---------------- */
function signupStat(eventId) {
  return db.prepare('SELECT COUNT(*) AS records, COALESCE(SUM(num),0) AS people FROM show_signup WHERE event_id=?').get(eventId);
}
function mapEvent(e) {
  if (!e) return null;
  const s = signupStat(e.id);
  return { ...e, opera: e.opera_id, signupRecords: s.records, signupPeople: s.people,
    remaining: e.capacity > 0 ? Math.max(0, e.capacity - s.people) : null };
}
function listShows({ status = 'approved' } = {}) {
  return db.prepare('SELECT * FROM show_event WHERE status=? ORDER BY date ASC, time ASC').all(status).map(mapEvent);
}
function allShows() {
  return db.prepare('SELECT * FROM show_event ORDER BY created DESC').all().map(mapEvent);
}
function getShow(id) {
  return mapEvent(db.prepare('SELECT * FROM show_event WHERE id=?').get(id));
}
function showsByApplicant(userId) {
  return db.prepare('SELECT * FROM show_event WHERE applicant_id=? ORDER BY created DESC').all(userId).map(mapEvent);
}
function signupsOfEvent(eventId) {
  return db.prepare('SELECT * FROM show_signup WHERE event_id=? ORDER BY created ASC').all(eventId);
}
function mySignups(userId) {
  return db.prepare(`SELECT s.*, e.title AS event_title, e.date AS event_date, e.time AS event_time,
    e.venue AS event_venue, e.city AS event_city, e.status AS event_status
    FROM show_signup s JOIN show_event e ON e.id = s.event_id
    WHERE s.user_id=? ORDER BY s.created DESC`).all(userId);
}

/* ---------------- 管理后台总览 ---------------- */
function adminOverview() {
  const one = sql => db.prepare(sql).get().n;
  return {
    operas: one('SELECT COUNT(*) n FROM opera'),
    artists: one('SELECT COUNT(*) n FROM artist'),
    media: one('SELECT COUNT(*) n FROM media'),
    lyrics: one('SELECT COUNT(*) n FROM lyrics'),
    users: one('SELECT COUNT(*) n FROM user'),
    comments: one('SELECT COUNT(*) n FROM comment'),
    favorites: one('SELECT COUNT(*) n FROM favorite'),
    samples: one('SELECT COUNT(*) n FROM performance'),
    events: one('SELECT COUNT(*) n FROM show_event'),
    pending: one("SELECT COUNT(*) n FROM show_event WHERE status='pending'"),
    approved: one("SELECT COUNT(*) n FROM show_event WHERE status='approved'"),
    rejected: one("SELECT COUNT(*) n FROM show_event WHERE status='rejected'"),
    signups: one('SELECT COUNT(*) n FROM show_signup'),
  };
}

module.exports = {
  categories, catName,
  listOperas, getOpera, castOfOpera,
  listArtists, getArtist,
  listMedia, getMedia,
  listLyrics, getLyrics,
  heatByCity, heatByProvince, heatPoints, perfByYear, perfByChannel, topOperasByHeat, heatOverview,
  listShows, allShows, getShow, showsByApplicant, signupsOfEvent, mySignups, signupStat, adminOverview,
};
