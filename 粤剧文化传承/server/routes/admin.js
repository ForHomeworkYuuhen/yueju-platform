/* 管理后台接口（仅管理员）：总览 / 数据表浏览 / 公开演出审核 / 报名管理 */
const express = require('express');
const { db } = require('../db');
const repo = require('../repo');
const { requireAdmin } = require('../middleware');
const { logAction } = require('../audit');
const router = express.Router();

const now = () => {
  const d = new Date(), z = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}:${z(d.getSeconds())}`;
};

// 全部管理接口都需要管理员身份
router.use(requireAdmin);

/* 当前管理员信息（用于后台校验登录态） */
router.get('/me', (req, res) => {
  const { password, ...rest } = req.user;
  res.json(rest);
});

/* 后台总览（仪表盘 KPI） */
router.get('/overview', (req, res) => res.json(repo.adminOverview()));

/* ---------------- 公开演出审核 ---------------- */
router.get('/events', (req, res) => {
  const { status } = req.query;
  const list = status ? repo.listShows({ status }) : repo.allShows();
  res.json(list);
});

router.post('/events/:id/review', (req, res) => {
  const ev = db.prepare('SELECT * FROM show_event WHERE id=?').get(req.params.id);
  if (!ev) return res.status(404).json({ error: '演出不存在' });
  const { action, note } = req.body || {};
  if (!['approve', 'reject'].includes(action)) return res.status(400).json({ error: '无效的操作' });
  const status = action === 'approve' ? 'approved' : 'rejected';
  db.prepare('UPDATE show_event SET status=?, review_note=?, reviewed_at=? WHERE id=?')
    .run(status, note || '', now(), ev.id);
  logAction(req, 'review_event', `${ev.id} -> ${status}`);
  res.json({ ok: true, event: repo.getShow(ev.id) });
});

/* 某场演出的报名名单 */
router.get('/events/:id/signups', (req, res) => {
  const ev = repo.getShow(req.params.id);
  if (!ev) return res.status(404).json({ error: '演出不存在' });
  res.json({ event: ev, signups: repo.signupsOfEvent(ev.id) });
});

/* ---------------- 数据表浏览 ----------------
 * cols    : [字段名, 中文表头] 二元组（前者建 SQL，后者显示）
 * search  : 关键字搜索覆盖的文本列（LIKE）
 * filters : 可下拉筛选的分类列（选项动态取 DISTINCT）
 */
const TABLES = {
  opera:        { label: '剧目', group: '内容资料', search: ['title','alias','playwright'], filters: ['genre','troupe'],
    cols: [['id','编号'],['title','剧目名称'],['alias','别名'],['genre','题材'],['troupe','流派'],['premiere','首演年份'],['playwright','编剧'],['popularity','人气值']] },
  artist:       { label: '名家', group: '内容资料', search: ['name','title','region'], filters: ['role','school','gender'],
    cols: [['id','编号'],['name','姓名'],['gender','性别'],['role','行当'],['school','流派'],['birth','出生'],['death','逝世'],['region','籍贯']] },
  media:        { label: '视听资源', group: '内容资料', search: ['title','performer'], filters: ['type'],
    cols: [['id','编号'],['title','标题'],['type','类型'],['opera_id','所属剧目'],['performer','表演者'],['duration','时长'],['year','年份'],['plays','播放量']] },
  lyrics:       { label: '戏词', group: '内容资料', search: ['title','source','note'], filters: [],
    cols: [['id','编号'],['title','曲目'],['opera_id','所属剧目'],['source','出处'],['note','说明']] },
  category:     { label: '分类', group: '内容资料', search: ['name','descr'], filters: ['grp'],
    cols: [['id','编号'],['grp','分组'],['name','名称'],['descr','说明']] },
  user:         { label: '用户', group: '用户互动', search: ['username','nickname','region'], filters: ['role','gender'],
    cols: [['id','编号'],['username','账号'],['nickname','昵称'],['gender','性别'],['region','地区'],['role','角色'],['created','注册时间']] },
  favorite:     { label: '收藏', group: '用户互动', search: ['user_id','target_id'], filters: ['type'],
    cols: [['id','编号'],['user_id','用户'],['type','类型'],['target_id','收藏对象'],['created','收藏时间']] },
  comment:      { label: '评论', group: '用户互动', search: ['nickname','content'], filters: ['type','rating'],
    cols: [['id','编号'],['nickname','昵称'],['type','类型'],['target_id','评论对象'],['content','内容'],['rating','评分'],['likes','点赞'],['created','评论时间']] },
  learn_record: { label: '学唱记录', group: '用户互动', search: ['user_id','lyrics_id'], filters: [],
    cols: [['id','编号'],['user_id','用户'],['lyrics_id','曲目'],['progress','进度(%)'],['last','最近学习']] },
  show_event:   { label: '公开演出', group: '公开演出', search: ['title','opera_title','venue','applicant_name'], filters: ['status','city'],
    cols: [['id','编号'],['title','演出名称'],['opera_title','上演剧目'],['city','城市'],['venue','场馆'],['date','日期'],['time','时间'],['capacity','名额'],['status','状态'],['applicant_name','申请人']] },
  show_signup:  { label: '演出报名', group: '公开演出', search: ['name','phone'], filters: [],
    cols: [['id','编号'],['event_id','所属演出'],['user_id','用户'],['name','姓名'],['phone','联系电话'],['num','人数'],['created','报名时间']] },
  performance:  { label: '演出样本', group: '热度数据', search: ['region','venue','troupe','opera_title'], filters: ['channel','province'],
    cols: [['id','编号'],['region','地区'],['province','省份'],['venue','场馆'],['troupe','演出团体'],['opera_title','剧目'],['date','日期'],['audience','现场观众'],['online_play','线上播放'],['channel','渠道']] },
  region_geo:   { label: '地区地理', group: '热度数据', search: ['name','province'], filters: ['province'],
    cols: [['code','编码'],['name','地区名称'],['province','省份'],['lng','经度'],['lat','纬度'],['is_core','核心流行区']] },
};

router.get('/tables', (req, res) => {
  res.json(Object.entries(TABLES).map(([k, v]) => ({
    name: k, label: v.label, group: v.group,
    count: db.prepare(`SELECT COUNT(*) AS n FROM ${k}`).get().n,
  })));
});

router.get('/table/:name', (req, res) => {
  const def = TABLES[req.params.name];
  if (!def) return res.status(404).json({ error: '未知数据表' });
  const tbl = req.params.name;
  const keys = def.cols.map(c => c[0]);
  const limit = Math.min(500, Number(req.query.limit) || 100);
  const offset = Number(req.query.offset) || 0;

  const conds = [], args = [];
  const q = String(req.query.q || '').trim();
  if (q && def.search && def.search.length) {
    conds.push('(' + def.search.map(c => `${c} LIKE ?`).join(' OR ') + ')');
    def.search.forEach(() => args.push('%' + q + '%'));
  }
  (def.filters || []).forEach(fk => {
    const v = req.query[fk];
    if (v !== undefined && v !== '' && v !== 'all') { conds.push(`${fk} = ?`); args.push(v); }
  });
  const where = conds.length ? ' WHERE ' + conds.join(' AND ') : '';

  const total = db.prepare(`SELECT COUNT(*) AS n FROM ${tbl}${where}`).get(...args).n;
  const rows = db.prepare(`SELECT ${keys.join(',')} FROM ${tbl}${where} LIMIT ? OFFSET ?`).all(...args, limit, offset);
  const filters = (def.filters || []).map(fk => ({
    key: fk,
    label: (def.cols.find(c => c[0] === fk) || [fk, fk])[1],
    options: db.prepare(`SELECT DISTINCT ${fk} AS v FROM ${tbl} WHERE ${fk} IS NOT NULL AND ${fk} <> '' ORDER BY ${fk}`).all().map(r => r.v),
  }));
  res.json({
    name: tbl, label: def.label, total, rows,
    columns: def.cols.map(([key, title]) => ({ key, label: title })),
    filters,
  });
});

module.exports = router;
