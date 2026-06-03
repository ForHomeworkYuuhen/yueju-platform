/* 账号接口：注册 / 登录 / 当前用户 / 退出 / 改密 / 资料 */
const express = require('express');
const crypto = require('crypto');
const { db } = require('../db');
const { newToken, getToken, requireAuth, publicUser } = require('../middleware');
const { hashPassword, verifyPassword, isHashed } = require('../password');
const { logAction } = require('../audit');
const router = express.Router();

const now = () => {
  const d = new Date(), z = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}:${z(d.getSeconds())}`;
};
const uid = p => p + '_' + Date.now().toString(36) + crypto.randomBytes(2).toString('hex');

const MIN_PWD = 6;        // 最小口令长度

function issueToken(userId) {
  const tk = newToken();
  db.prepare('INSERT INTO token (token,user_id,created) VALUES (?,?,?)').run(tk, userId, now());
  return tk;
}

/* ---------------- 登录失败限流（内存级，进程内有效） ----------------
 * 同一账号 10 分钟内失败达 5 次则锁定 10 分钟，缓解暴力破解。 */
const FAILS = new Map();
const MAX_FAIL = 5;
const WINDOW_MS = 10 * 60 * 1000;
function loginGuard(key) {
  const r = FAILS.get(key);
  if (r && r.lockUntil && r.lockUntil > Date.now()) {
    return Math.ceil((r.lockUntil - Date.now()) / 1000);  // 剩余锁定秒数
  }
  return 0;
}
function noteFail(key) {
  const t = Date.now();
  let r = FAILS.get(key);
  if (!r || t - r.first > WINDOW_MS) r = { first: t, count: 0, lockUntil: 0 };
  r.count += 1;
  if (r.count >= MAX_FAIL) r.lockUntil = t + WINDOW_MS;
  FAILS.set(key, r);
}
function clearFail(key) { FAILS.delete(key); }

router.post('/register', (req, res) => {
  const { username, password, nickname } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: '账号和密码不能为空' });
  if (String(password).length < MIN_PWD) return res.status(400).json({ error: `密码至少 ${MIN_PWD} 位` });
  if (db.prepare('SELECT 1 FROM user WHERE username=?').get(username))
    return res.status(409).json({ error: '该账号已被注册' });
  const u = {
    id: uid('u'), username, password: hashPassword(password), nickname: nickname || username,
    signature: '初入梨园，愿与君共赏南国红豆。', gender: '保密', region: '岭南',
    role: '会员', avatar_seed: Math.floor(Math.random() * 6), created: now(),
  };
  db.prepare(`INSERT INTO user (id,username,password,nickname,signature,gender,region,role,avatar_seed,created)
    VALUES (@id,@username,@password,@nickname,@signature,@gender,@region,@role,@avatar_seed,@created)`).run(u);
  res.json({ token: issueToken(u.id), user: publicUser(u) });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: '账号和密码不能为空' });
  const key = String(username).toLowerCase();
  const wait = loginGuard(key);
  if (wait) return res.status(429).json({ error: `尝试过于频繁，请 ${wait} 秒后重试` });

  const u = db.prepare('SELECT * FROM user WHERE username=?').get(username);
  // 统一错误提示，避免暴露“账号是否存在”（防用户名枚举）
  if (!u || !verifyPassword(password, u.password)) {
    noteFail(key);
    return res.status(401).json({ error: '账号或密码错误' });
  }
  clearFail(key);
  // 历史明文 → 登录成功后自动升级为加盐哈希
  if (!isHashed(u.password)) {
    db.prepare('UPDATE user SET password=? WHERE id=?').run(hashPassword(password), u.id);
  }
  logAction(req, 'login', u.username);
  res.json({ token: issueToken(u.id), user: publicUser(u) });
});

router.get('/me', requireAuth, (req, res) => res.json(publicUser(req.user)));

router.post('/logout', (req, res) => {
  const tk = getToken(req);
  if (tk) db.prepare('DELETE FROM token WHERE token=?').run(tk);
  res.json({ ok: true });
});

router.put('/profile', requireAuth, (req, res) => {
  const { nickname, signature, region, gender, avatar_seed } = req.body || {};
  const u = req.user;
  let seed = u.avatar_seed;
  if (avatar_seed !== undefined && avatar_seed !== null && avatar_seed !== '') {
    const n = Number(avatar_seed);
    if (Number.isInteger(n) && n >= 0 && n <= 5) seed = n;
  }
  db.prepare('UPDATE user SET nickname=?,signature=?,region=?,gender=?,avatar_seed=? WHERE id=?')
    .run(nickname ?? u.nickname, signature ?? u.signature, region ?? u.region, gender ?? u.gender, seed, u.id);
  res.json(publicUser(db.prepare('SELECT * FROM user WHERE id=?').get(u.id)));
});

router.put('/password', requireAuth, (req, res) => {
  const { oldPwd, newPwd } = req.body || {};
  if (!verifyPassword(oldPwd, req.user.password)) return res.status(400).json({ error: '原密码不正确' });
  if (!newPwd || String(newPwd).length < MIN_PWD) return res.status(400).json({ error: `新密码至少 ${MIN_PWD} 位` });
  db.prepare('UPDATE user SET password=? WHERE id=?').run(hashPassword(newPwd), req.user.id);
  // 改密后使该用户其它已签发令牌失效（保留当前会话，其余设备需重新登录）
  const cur = getToken(req);
  db.prepare('DELETE FROM token WHERE user_id=? AND token<>?').run(req.user.id, cur || '');
  logAction(req, 'change_password', '');
  res.json({ ok: true });
});

module.exports = router;
