/* 热度分析接口：地图热度（城市/省份/散点）+ 趋势 + 渠道 + 榜单 */
const express = require('express');
const repo = require('../repo');
const router = express.Router();

// 解析筛选参数：from / to（年份区间）+ channel（渠道）
function parseFilter(q = {}) {
  const f = {};
  if (q.from) f.from = Number(q.from);
  if (q.to) f.to = Number(q.to);
  if (q.channel && q.channel !== 'all') f.channel = String(q.channel);
  return f;
}

router.get('/overview', (req, res) => {
  const f = parseFilter(req.query);
  res.json({
    ...repo.heatOverview(f),
    byChannel: repo.perfByChannel(f),
    topOperas: repo.topOperasByHeat(8, f),
  });
});

router.get('/heat', (req, res) => {
  const f = parseFilter(req.query);
  res.json({
    cities: repo.heatByCity(f),       // 广东省内城市
    provinces: repo.heatByProvince(f),// 全国省级
    points: repo.heatPoints(f),       // 含港澳/广西/海外的散点
    byYear: repo.perfByYear(f),
    byChannel: repo.perfByChannel(f),
    topOperas: repo.topOperasByHeat(10, f),
    overview: repo.heatOverview(f),
    filter: f,
  });
});

router.get('/heat/cities', (req, res) => res.json(repo.heatByCity()));
router.get('/heat/provinces', (req, res) => res.json(repo.heatByProvince()));
router.get('/heat/points', (req, res) => res.json(repo.heatPoints()));

module.exports = router;
