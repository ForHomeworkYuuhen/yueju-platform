/* 内容资料类接口：分类 / 剧目 / 名家 / 媒体 / 戏词 */
const express = require('express');
const repo = require('../repo');
const router = express.Router();

router.get('/categories', (req, res) => res.json(repo.categories()));

router.get('/operas', (req, res) => {
  const { genre, era, troupe, role, kw, sort, learn } = req.query;
  res.json(repo.listOperas({ genre, era, troupe, role, kw, sort, learn }));
});
router.get('/operas/:id', (req, res) => {
  const o = repo.getOpera(req.params.id);
  if (!o) return res.status(404).json({ error: '剧目不存在' });
  res.json(o);
});

router.get('/artists', (req, res) => res.json(repo.listArtists()));
router.get('/artists/:id', (req, res) => {
  const a = repo.getArtist(req.params.id);
  if (!a) return res.status(404).json({ error: '名家不存在' });
  res.json(a);
});

router.get('/media', (req, res) => {
  const { type, kw, opera } = req.query;
  res.json(repo.listMedia({ type, kw, opera }));
});
router.get('/media/:id', (req, res) => {
  const m = repo.getMedia(req.params.id);
  if (!m) return res.status(404).json({ error: '资源不存在' });
  res.json(m);
});

router.get('/lyrics', (req, res) => res.json(repo.listLyrics()));
router.get('/lyrics/:id', (req, res) => {
  const l = repo.getLyrics(req.params.id);
  if (!l) return res.status(404).json({ error: '戏词不存在' });
  res.json(l);
});

module.exports = router;
