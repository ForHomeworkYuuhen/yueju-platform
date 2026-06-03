/* =============================================================
 * password.js —— 口令加盐哈希（Node 内置 crypto.scrypt，无第三方依赖）
 * 存储格式： scrypt$<盐(hex)>$<派生密钥(hex)>
 * - hashPassword(plain)      生成加盐哈希
 * - verifyPassword(plain, s) 校验；兼容历史明文（便于旧库平滑迁移）
 * - isHashed(s)              判断是否已是本格式哈希
 * ============================================================= */
const crypto = require('crypto');

const KEYLEN = 32;        // 派生密钥长度（字节）
const SALTLEN = 16;       // 盐长度（字节）

function hashPassword(plain) {
  const salt = crypto.randomBytes(SALTLEN);
  const dk = crypto.scryptSync(String(plain), salt, KEYLEN);
  return `scrypt$${salt.toString('hex')}$${dk.toString('hex')}`;
}

function isHashed(stored) {
  return typeof stored === 'string' && stored.startsWith('scrypt$');
}

function verifyPassword(plain, stored) {
  if (stored == null) return false;
  if (!isHashed(stored)) {
    // 历史明文：等值比较（成功后调用方应触发一次 rehash 升级）
    return String(plain) === String(stored);
  }
  const [, saltHex, hashHex] = stored.split('$');
  try {
    const salt = Buffer.from(saltHex, 'hex');
    const expected = Buffer.from(hashHex, 'hex');
    const dk = crypto.scryptSync(String(plain), salt, expected.length);
    return expected.length === dk.length && crypto.timingSafeEqual(expected, dk);
  } catch (e) {
    return false;
  }
}

module.exports = { hashPassword, verifyPassword, isHashed };
