/* 口令加盐哈希单元测试（Node 内置 node:test，无需第三方依赖）
 * 运行： npm test   （等价于 node --test）
 */
const test = require('node:test');
const assert = require('node:assert');
const { hashPassword, verifyPassword, isHashed } = require('../server/password');

test('hashPassword 生成 scrypt$ 格式且非明文', () => {
  const h = hashPassword('abc123');
  assert.ok(h.startsWith('scrypt$'), '应以 scrypt$ 开头');
  assert.notStrictEqual(h, 'abc123', '不得为明文');
  assert.strictEqual(h.split('$').length, 3, '格式应为 scrypt$盐$哈希');
});

test('isHashed 正确判别', () => {
  assert.strictEqual(isHashed(hashPassword('x')), true);
  assert.strictEqual(isHashed('123456'), false);
  assert.strictEqual(isHashed(null), false);
});

test('verifyPassword 正确口令通过 / 错误口令拒绝', () => {
  const h = hashPassword('abc123');
  assert.strictEqual(verifyPassword('abc123', h), true);
  assert.strictEqual(verifyPassword('wrong', h), false);
});

test('兼容历史明文（便于旧库平滑迁移）', () => {
  assert.strictEqual(verifyPassword('123456', '123456'), true);
  assert.strictEqual(verifyPassword('bad', '123456'), false);
});

test('每次加盐随机（相同口令哈希不同）', () => {
  assert.notStrictEqual(hashPassword('same'), hashPassword('same'));
});
