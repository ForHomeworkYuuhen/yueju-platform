/* 公开演出接口（用户端）：申请 / 列表 / 详情 / 报名 / 我的申请 / 我的报名 */
const express = require('express');
const crypto = require('crypto');
const { db } = require('../db');
const repo = require('../repo');
const { requireAuth } = require('../middleware');
const router = express.Router();

const now = () => {
  const d = new Date(), z = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}:${z(d.getSeconds())}`;
};
const uid = p => p + '_' + Date.now().toString(36) + crypto.randomBytes(2).toString('hex');

/* 已通过审核的公开演出（用于展示 + 报名） */
router.get('/shows', (req, res) => res.json(repo.listShows({ status: 'approved' })));

/* 我发起的申请 */
router.get('/shows/mine', requireAuth, (req, res) => res.json(repo.showsByApplicant(req.user.id)));

/* 我的报名 */
router.get('/shows/signups/mine', requireAuth, (req, res) => res.json(repo.mySignups(req.user.id)));

/* 演出详情（含我是否已报名） */
router.get('/shows/:id', (req, res) => {
  const ev = repo.getShow(req.params.id);
  if (!ev) return res.status(404).json({ error: '演出不存在' });
  let mine = null;
  if (req.user) mine = db.prepare('SELECT * FROM show_signup WHERE event_id=? AND user_id=?').get(ev.id, req.user.id) || null;
  res.json({ ...ev, mySignup: mine });
});

/* 申请公开演出（创建为待审核） */
router.post('/shows/apply', requireAuth, (req, res) => {
  const b = req.body || {};
  if (!b.title || !b.title.trim()) return res.status(400).json({ error: '请填写演出名称' });
  if (!b.date) return res.status(400).json({ error: '请选择演出日期' });
  if (!b.city || !b.venue) return res.status(400).json({ error: '请填写城市与场馆' });
  const ev = {
    id: uid('ev'), title: b.title.trim(), opera_id: b.opera_id || null,
    opera_title: b.opera_title || b.title.trim(), troupe: b.troupe || '', city: b.city,
    venue: b.venue, address: b.address || '', date: b.date, time: b.time || '19:30',
    price: b.price || '待定', capacity: Math.max(0, Number(b.capacity) || 0),
    poster_seed: Math.floor(Math.random() * 6), intro: b.intro || '', contact: b.contact || '',
    applicant_id: req.user.id, applicant_name: req.user.nickname, status: 'pending',
    review_note: '', created: now(), reviewed_at: null,
  };
  db.prepare(`INSERT INTO show_event
    (id,title,opera_id,opera_title,troupe,city,venue,address,date,time,price,capacity,poster_seed,intro,contact,applicant_id,applicant_name,status,review_note,created,reviewed_at)
    VALUES (@id,@title,@opera_id,@opera_title,@troupe,@city,@venue,@address,@date,@time,@price,@capacity,@poster_seed,@intro,@contact,@applicant_id,@applicant_name,@status,@review_note,@created,@reviewed_at)`).run(ev);
  res.json({ ok: true, event: repo.getShow(ev.id) });
});

/* 报名 */
router.post('/shows/:id/signup', requireAuth, (req, res) => {
  const ev = repo.getShow(req.params.id);
  if (!ev) return res.status(404).json({ error: '演出不存在' });
  if (ev.status !== 'approved') return res.status(400).json({ error: '该演出尚未开放报名' });
  const b = req.body || {};
  const num = Math.max(1, Number(b.num) || 1);
  if (ev.remaining != null && num > ev.remaining) return res.status(400).json({ error: '剩余名额不足' });
  const exist = db.prepare('SELECT id FROM show_signup WHERE event_id=? AND user_id=?').get(ev.id, req.user.id);
  if (exist) return res.status(409).json({ error: '您已报名该演出' });
  db.prepare('INSERT INTO show_signup (id,event_id,user_id,name,phone,num,note,created) VALUES (?,?,?,?,?,?,?,?)')
    .run(uid('sg'), ev.id, req.user.id, b.name || req.user.nickname, b.phone || '', num, b.note || '', now());
  res.json({ ok: true, event: repo.getShow(ev.id) });
});

/* 取消报名 */
router.delete('/shows/:id/signup', requireAuth, (req, res) => {
  const r = db.prepare('DELETE FROM show_signup WHERE event_id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true, removed: r.changes });
});

module.exports = router;
