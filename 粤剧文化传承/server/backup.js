/* =============================================================
 * backup.js —— 数据库备份
 *   node server/backup.js   生成带时间戳的 SQLite 备份到 backups/
 * 备份前对 WAL 做 checkpoint，保证单文件备份一致。
 * ============================================================= */
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'data', 'yueju.db');
const DIR = path.join(__dirname, '..', 'backups');

if (!fs.existsSync(SRC)) {
  console.error('未找到数据库：', SRC, '（请先 npm start 生成）');
  process.exit(1);
}

// 合并 WAL，确保主库文件包含最新数据
try {
  const { db } = require('./db');
  db.pragma('wal_checkpoint(TRUNCATE)');
} catch (e) { /* 忽略：即使未 checkpoint 也可复制主文件 */ }

fs.mkdirSync(DIR, { recursive: true });
const d = new Date(), z = n => String(n).padStart(2, '0');
const ts = `${d.getFullYear()}${z(d.getMonth()+1)}${z(d.getDate())}-${z(d.getHours())}${z(d.getMinutes())}${z(d.getSeconds())}`;
const dst = path.join(DIR, `yueju-${ts}.db`);
fs.copyFileSync(SRC, dst);

const kb = (fs.statSync(dst).size / 1024).toFixed(0);
console.log(`备份完成 → ${dst}  (${kb} KB)`);
