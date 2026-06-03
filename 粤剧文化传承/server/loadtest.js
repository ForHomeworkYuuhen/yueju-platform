/* =============================================================
 * loadtest.js —— 后端并发 / 延迟压测脚本（零依赖，Node 18+ 内置 fetch）
 *
 * 用法：
 *   node server/loadtest.js                          # 默认：延迟基线 + 并发梯度
 *   node server/loadtest.js --url=http://localhost:3000
 *   node server/loadtest.js --requests=3000 --concurrency=100
 *   node server/loadtest.js --sweep=1,10,50,100,200  # 自定义并发梯度
 *   node server/loadtest.js --duration=15            # 改为按持续秒数压测
 *   node server/loadtest.js --mode=latency           # 只跑延迟基线
 *   node server/loadtest.js --mode=concurrency       # 只跑并发梯度
 *
 * 报告内容：
 *   1) 延迟基线：单并发逐个请求各接口，给出 p50/p90/p95/p99/最大值；
 *   2) 并发梯度：在不同并发数下跑混合只读流量，给出吞吐(req/s)、
 *      延迟分位、错误率，用以观察系统在压力下的延迟变化与拐点。
 * ============================================================= */
'use strict';
const { performance } = require('perf_hooks');

/* ---------------- 参数解析 ---------------- */
function arg(name, def) {
  const hit = process.argv.find(a => a.startsWith('--' + name + '='));
  return hit ? hit.split('=').slice(1).join('=') : def;
}
const BASE = (arg('url', process.env.LT_URL || 'http://localhost:3000')).replace(/\/$/, '');
const REQUESTS = Number(arg('requests', 2000));
const TARGET_C = Number(arg('concurrency', 50));
const DURATION = Number(arg('duration', 0));               // >0 时按秒数压测
const SWEEP = String(arg('sweep', '1,5,10,20,50,100')).split(',').map(Number).filter(Boolean);
const MODE = arg('mode', 'both');                          // latency | concurrency | both

/* ---------------- 工具 ---------------- */
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function timeReq(path, opts) {
  const t = performance.now();
  try {
    const res = await fetch(BASE + path, opts);
    await res.arrayBuffer();                                // 读完响应体，计入真实耗时
    return { ok: res.ok, status: res.status, ms: performance.now() - t };
  } catch (e) {
    return { ok: false, status: 0, ms: performance.now() - t, err: e.message };
  }
}
function pct(sortedMs, p) {
  if (!sortedMs.length) return 0;
  const rank = Math.ceil((p / 100) * sortedMs.length) - 1;
  return sortedMs[Math.max(0, Math.min(sortedMs.length - 1, rank))];
}
function stats(results) {
  const ok = results.filter(r => r.ok);
  const ms = ok.map(r => r.ms).sort((a, b) => a - b);
  const sum = ms.reduce((s, x) => s + x, 0);
  return {
    n: results.length, ok: ok.length, err: results.length - ok.length,
    avg: ms.length ? sum / ms.length : 0, min: ms[0] || 0, max: ms[ms.length - 1] || 0,
    p50: pct(ms, 50), p90: pct(ms, 90), p95: pct(ms, 95), p99: pct(ms, 99),
  };
}
const f1 = n => n.toFixed(1);

/* 并发池：固定总请求数 totalReqs，以 concurrency 个“工人”并行取任务 */
async function runFixed(totalReqs, concurrency, makeReq) {
  let i = 0; const results = [];
  const t0 = performance.now();
  const worker = async () => { while (true) { const idx = i++; if (idx >= totalReqs) break; results.push(await makeReq(idx)); } };
  await Promise.all(Array.from({ length: concurrency }, worker));
  return { results, wall: performance.now() - t0 };
}
/* 并发池：固定持续时间 durationMs，期间持续发压 */
async function runDuration(durationMs, concurrency, makeReq) {
  const results = []; let n = 0;
  const t0 = performance.now();
  const worker = async () => { while (performance.now() - t0 < durationMs) results.push(await makeReq(n++)); };
  await Promise.all(Array.from({ length: concurrency }, worker));
  return { results, wall: performance.now() - t0 };
}

/* ---------------- 接口探测：取真实 id 拼装明细接口 ---------------- */
async function discover() {
  const endpoints = [
    { name: '健康检查', path: '/api/health' },
    { name: '剧目列表', path: '/api/operas' },
    { name: '名家列表', path: '/api/artists' },
    { name: '视听列表', path: '/api/media' },
    { name: '戏词列表', path: '/api/lyrics' },
    { name: '公开演出', path: '/api/shows' },
    { name: '热度总览', path: '/api/stats/overview' },
    { name: '热度地图', path: '/api/stats/heat' },
    { name: '热度(近五年)', path: '/api/stats/heat?from=2022' },
  ];
  try {
    const operas = await (await fetch(BASE + '/api/operas')).json();
    if (Array.isArray(operas) && operas[0]) endpoints.push({ name: '剧目详情', path: '/api/operas/' + operas[0].id });
    const withLy = Array.isArray(operas) && operas.find(o => o.hasLyrics);
  } catch (e) {}
  try {
    const media = await (await fetch(BASE + '/api/media')).json();
    if (Array.isArray(media) && media[0]) endpoints.push({ name: '视听详情', path: '/api/media/' + media[0].id });
  } catch (e) {}
  try {
    const lys = await (await fetch(BASE + '/api/lyrics')).json();
    if (Array.isArray(lys) && lys[0]) endpoints.push({ name: '戏词详情(学唱)', path: '/api/lyrics/' + lys[0].id });
  } catch (e) {}
  return endpoints;
}

/* ---------------- 1) 延迟基线（单并发） ---------------- */
async function latencyBaseline(endpoints, perEndpoint = 50) {
  console.log('\n──────── 延迟基线（单并发，每接口 ' + perEndpoint + ' 次）────────');
  console.log('接口'.padEnd(22) + 'avg     p50     p90     p95     p99     max     错误');
  for (const ep of endpoints) {
    const out = [];
    for (let i = 0; i < perEndpoint; i++) out.push(await timeReq(ep.path));
    const s = stats(out);
    console.log(
      ep.name.padEnd(20) +
      [s.avg, s.p50, s.p90, s.p95, s.p99, s.max].map(v => (f1(v) + 'ms').padEnd(8)).join('') +
      (s.err ? (s.err + '/' + s.n) : '0')
    );
  }
}

/* ---------------- 2) 并发梯度（混合只读流量） ---------------- */
async function concurrencySweep(endpoints) {
  // 混合流量：剔除健康检查，按真实读多写少场景轮询各接口
  const mix = endpoints.filter(e => e.name !== '健康检查');
  const makeReq = idx => timeReq(mix[idx % mix.length].path);

  console.log('\n──────── 并发梯度压测 ' +
    (DURATION > 0 ? '（每档持续 ' + DURATION + 's）' : '（每档 ' + REQUESTS + ' 次请求）') + ' ────────');
  console.log('并发    总数    吞吐(req/s)   avg      p50      p95      p99      max      错误率');
  const rows = [];
  for (const c of SWEEP) {
    const { results, wall } = DURATION > 0
      ? await runDuration(DURATION * 1000, c, makeReq)
      : await runFixed(REQUESTS, c, makeReq);
    const s = stats(results);
    const qps = results.length / (wall / 1000);
    rows.push({ c, qps, s });
    console.log(
      String(c).padEnd(6) +
      String(s.n).padEnd(8) +
      f1(qps).padEnd(13) +
      [s.avg, s.p50, s.p95, s.p99, s.max].map(v => (f1(v) + 'ms').padEnd(9)).join('') +
      (s.err ? f1(s.err / s.n * 100) + '%' : '0%')
    );
    await sleep(300);                                       // 档位之间稍作喘息
  }
  // 找吞吐峰值，作为“拐点”提示
  const best = rows.reduce((a, b) => (b.qps > a.qps ? b : a), rows[0]);
  console.log('\n峰值吞吐 ≈ ' + f1(best.qps) + ' req/s（并发 ' + best.c + '，p99 ' + f1(best.s.p99) + 'ms）');
}

/* ---------------- 主流程 ---------------- */
(async () => {
  console.log('目标服务：' + BASE);
  // 连通性预检
  const probe = await timeReq('/api/health');
  if (!probe.ok) { console.error('✗ 无法连接后端（' + (probe.err || probe.status) + '），请先启动服务：node server/index.js'); process.exit(1); }
  console.log('✓ 连接正常（health ' + f1(probe.ms) + 'ms）');

  const endpoints = await discover();
  // 预热，排除冷启动 / JIT 抖动
  for (let i = 0; i < 30; i++) await timeReq(endpoints[i % endpoints.length].path);

  if (MODE === 'latency' || MODE === 'both') await latencyBaseline(endpoints);
  if (MODE === 'concurrency' || MODE === 'both') await concurrencySweep(endpoints);

  console.log('\n压测完成。');
})().catch(e => { console.error('压测异常：', e); process.exit(1); });
