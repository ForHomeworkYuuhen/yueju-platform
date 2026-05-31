/* 用户互动接口：收藏 / 评论 / 学唱记录 / 浏览历史 */
const express = require('express');
const crypto = require('crypto');
const { db } = require('../db');
const repo = require('../repo');
const { requireAuth, attachUser } = require('../middleware');
const router = express.Router();

const now = () => {
  const d = new Date(), z = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}:${z(d.getSeconds())}`;
};
const uid = p => p + '_' + Date.now().toString(36) + crypto.randomBytes(2).toString('hex');

/* ---------------- 收藏 ---------------- */
router.get('/favorites', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM favorite WHERE user_id=? ORDER BY created DESC').all(req.user.id);
  // 附带目标对象的展示信息
  const enrich = rows.map(f => {
    let target = null;
    if (f.type === 'opera')  target = repo.getOpera(f.target_id);
    if (f.type === 'artist') target = repo.getArtist(f.target_id);
    if (f.type === 'media')  target = repo.getMedia(f.target_id);
    return { ...f, target };
  });
  res.json(enrich);
});

router.get('/favorites/check', requireAuth, (req, res) => {
  const { type, targetId } = req.query;
  const row = db.prepare('SELECT 1 FROM favorite WHERE user_id=? AND type=? AND target_id=?')
    .get(req.user.id, type, targetId);
  res.json({ fav: !!row });
});

router.post('/favorites/toggle', requireAuth, (req, res) => {
  const { type, targetId } = req.body || {};
  if (!type || !targetId) return res.status(400).json({ error: '参数不完整' });
  const exist = db.prepare('SELECT id FROM favorite WHERE user_id=? AND type=? AND target_id=?')
    .get(req.user.id, type, targetId);
  if (exist) {
    db.prepare('DELETE FROM favorite WHERE id=?').run(exist.id);
    return res.json({ fav: false });
  }
  db.prepare('INSERT INTO favorite (id,user_id,type,target_id,created) VALUES (?,?,?,?,?)')
    .run(uid('f'), req.user.id, type, targetId, now());
  res.json({ fav: true });
});

/* ---------------- 评论 ---------------- */
router.get('/comments', (req, res) => {
  const { type, targetId } = req.query;
  const rows = db.prepare('SELECT * FROM comment WHERE type=? AND target_id=? ORDER BY created DESC')
    .all(type, targetId);
  res.json(rows);
});

router.get('/comments/mine', requireAuth, (req, res) => {
  res.json(db.prepare('SELECT * FROM comment WHERE user_id=? ORDER BY created DESC').all(req.user.id));
});

router.post('/comments', requireAuth, (req, res) => {
  const { type, targetId, content, rating } = req.body || {};
  if (!content || !String(content).trim()) return res.status(400).json({ error: '评论内容不能为空' });
  const c = {
    id: uid('c'), user_id: req.user.id, nickname: req.user.nickname,
    avatar_seed: req.user.avatar_seed, type, target_id: targetId,
    content: String(content).trim(), rating: rating || 5, likes: 0, created: now(),
  };
  db.prepare(`INSERT INTO comment (id,user_id,nickname,avatar_seed,type,target_id,content,rating,likes,created)
    VALUES (@id,@user_id,@nickname,@avatar_seed,@type,@target_id,@content,@rating,@likes,@created)`).run(c);
  res.json(c);
});

router.post('/comments/:id/like', (req, res) => {
  const c = db.prepare('SELECT * FROM comment WHERE id=?').get(req.params.id);
  if (!c) return res.status(404).json({ error: '评论不存在' });
  db.prepare('UPDATE comment SET likes=likes+1 WHERE id=?').run(c.id);
  res.json({ likes: c.likes + 1 });
});

/* ---------------- 学唱记录 ---------------- */
router.get('/learn', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM learn_record WHERE user_id=? ORDER BY last DESC').all(req.user.id);
  res.json(rows.map(r => ({ ...r, lyrics: repo.getLyrics(r.lyrics_id) })));
});

router.post('/learn', requireAuth, (req, res) => {
  const { lyricsId, progress } = req.body || {};
  const p = Math.max(0, Math.min(100, Number(progress) || 0));
  const exist = db.prepare('SELECT * FROM learn_record WHERE user_id=? AND lyrics_id=?').get(req.user.id, lyricsId);
  if (exist) {
    db.prepare('UPDATE learn_record SET progress=?, last=? WHERE id=?')
      .run(Math.max(exist.progress, p), now(), exist.id);
  } else {
    db.prepare('INSERT INTO learn_record (id,user_id,lyrics_id,progress,last) VALUES (?,?,?,?,?)')
      .run(uid('l'), req.user.id, lyricsId, p, now());
  }
  res.json({ ok: true });
});

/* ---------------- 浏览历史 ---------------- */
router.get('/history', requireAuth, (req, res) => {
  res.json(db.prepare('SELECT * FROM history WHERE user_id=? ORDER BY time DESC LIMIT 60').all(req.user.id));
});

router.post('/history', requireAuth, (req, res) => {
  const { type, targetId, title } = req.body || {};
  if (!type || !targetId) return res.status(400).json({ error: '参数不完整' });
  db.prepare('DELETE FROM history WHERE user_id=? AND type=? AND target_id=?')
    .run(req.user.id, type, targetId);
  db.prepare('INSERT INTO history (id,user_id,type,target_id,title,time) VALUES (?,?,?,?,?,?)')
    .run(uid('h'), req.user.id, type, targetId, title || '', now());
  res.json({ ok: true });
});

module.exports = router;
