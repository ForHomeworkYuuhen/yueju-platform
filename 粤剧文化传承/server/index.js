/* =============================================================
 * index.js —— Express 服务入口
 * 提供 REST API（/api/*）并托管前端静态资源（web/）。
 * 首次启动时若数据库为空，自动执行种子填充。
 * ============================================================= */
const path = require('path');
const express = require('express');
const cors = require('cors');
const { db, initSchema, tableCount, DB_FILE } = require('./db');
const { attachUser } = require('./middleware');

initSchema();

// 空库自动填充
if (tableCount('opera') === 0 || tableCount('performance') === 0) {
  console.log('检测到数据库为空，正在自动填充种子数据…');
  require('child_process').execSync(`node "${path.join(__dirname, 'seed.js')}"`, { stdio: 'inherit' });
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(attachUser);

// 简易访问日志
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    const t = Date.now();
    res.on('finish', () => console.log(`${req.method} ${req.originalUrl} → ${res.statusCode} (${Date.now()-t}ms)`));
  }
  next();
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api', require('./routes/content'));
app.use('/api', require('./routes/social'));
app.use('/api', require('./routes/events'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/assistant', require('./routes/assistant'));
app.use('/api/admin', require('./routes/admin'));

app.get('/api/health', (req, res) => res.json({ ok: true, db: path.basename(DB_FILE), time: new Date().toISOString() }));

// 托管前端
const WEB = path.join(__dirname, '..', 'web');
app.use(express.static(WEB));
// 地图等较大的静态 JSON 已在 web/vendor 下，由 static 提供

// 管理后台（电脑端界面）
app.get('/admin', (req, res) => res.sendFile(path.join(WEB, 'admin.html')));

// 兜底：未匹配的非 /api、非 /admin 请求返回用户端首页（SPA）
app.get(/^\/(?!api|admin).*/, (req, res) => res.sendFile(path.join(WEB, 'index.html')));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: '服务器内部错误', detail: String(err.message || err) });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n南国红豆 · 粤剧文化传承平台`);
  console.log(`服务已启动： http://localhost:${PORT}`);
  console.log(`API 健康检查：http://localhost:${PORT}/api/health\n`);
});
