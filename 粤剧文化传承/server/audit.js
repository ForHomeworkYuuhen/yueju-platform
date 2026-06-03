/* =============================================================
 * audit.js —— 轻量操作审计日志
 * 记录登录、注册、改密、演出审核等关键操作，便于安全追溯。
 * 表 audit_log 懒加载创建；记录失败不影响主流程。
 * ============================================================= */
const { db } = require('./db');

let ready = false;
function ensure() {
  if (ready) return;
  db.exec(`CREATE TABLE IF NOT EXISTS audit_log (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    time     TEXT,
    user_id  TEXT,
    username TEXT,
    action   TEXT,
    detail   TEXT,
    ip       TEXT
  )`);
  ready = true;
}

const now = () => {
  const d = new Date(), z = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}:${z(d.getSeconds())}`;
};

function clientIp(req) {
  const xf = (req.headers && req.headers['x-forwarded-for']) || '';
  return String(xf).split(',')[0].trim() || (req.socket && req.socket.remoteAddress) || '';
}

function logAction(req, action, detail = '') {
  try {
    ensure();
    const u = req && req.user;
    const username = (u && u.username) || (req && req.body && req.body.username) || null;
    db.prepare('INSERT INTO audit_log (time,user_id,username,action,detail,ip) VALUES (?,?,?,?,?,?)')
      .run(now(), u ? u.id : null, username, action, String(detail).slice(0, 200), clientIp(req));
  } catch (e) { /* 审计失败不影响主流程 */ }
}

module.exports = { logAction };
