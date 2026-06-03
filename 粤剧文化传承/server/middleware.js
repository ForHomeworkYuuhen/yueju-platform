/* 简易令牌鉴权：登录后下发 token，存于 token 表；
 * 客户端通过 Authorization: Bearer <token> 携带。 */
const crypto = require('crypto');
const { db } = require('./db');

const newToken = () => crypto.randomBytes(24).toString('hex');

// 令牌有效期（天）：超期自动失效并清理，降低令牌泄露后的长期风险
const TOKEN_TTL_DAYS = Number(process.env.TOKEN_TTL_DAYS) || 7;
const TOKEN_TTL_MS = TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;

function getToken(req) {
  const h = req.headers['authorization'] || '';
  if (h.startsWith('Bearer ')) return h.slice(7);
  return req.headers['x-token'] || null;
}

function currentUser(req) {
  const tk = getToken(req);
  if (!tk) return null;
  const row = db.prepare(
    `SELECT u.*, t.created AS token_created FROM token t JOIN user u ON u.id = t.user_id WHERE t.token = ?`
  ).get(tk);
  if (!row) return null;
  // 过期校验（created 形如 'YYYY-MM-DD HH:MM:SS'，按本地时间解析）
  const issued = Date.parse(String(row.token_created || '').replace(' ', 'T'));
  if (!Number.isNaN(issued) && Date.now() - issued > TOKEN_TTL_MS) {
    db.prepare('DELETE FROM token WHERE token=?').run(tk);
    return null;
  }
  delete row.token_created;
  return row;
}

// 解析用户（不强制）
function attachUser(req, res, next) {
  req.user = currentUser(req);
  next();
}

// 强制登录
function requireAuth(req, res, next) {
  req.user = currentUser(req);
  if (!req.user) return res.status(401).json({ error: '请先登录' });
  next();
}

// 强制管理员
function requireAdmin(req, res, next) {
  req.user = currentUser(req);
  if (!req.user) return res.status(401).json({ error: '请先登录' });
  if (req.user.role !== '管理员') return res.status(403).json({ error: '需要管理员权限' });
  next();
}

function publicUser(u) {
  if (!u) return null;
  const { password, ...rest } = u;
  return rest;
}

module.exports = { newToken, getToken, attachUser, requireAuth, requireAdmin, publicUser };
