/* =============================================================
 * db.js —— SQLite 数据库连接与表结构定义
 * 使用 better-sqlite3：同步 API、单文件、零配置，生成真实的 .db 文件，
 * 可用 DB Browser for SQLite 打开查看（便于实训报告截图）。
 * ============================================================= */
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_FILE = path.join(DATA_DIR, 'yueju.db');
const db = new Database(DB_FILE);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/* ---------------- 建表（资料类 + 动态类 + 热度类） ---------------- */
function initSchema() {
  db.exec(`
  /* 分类表：行当 / 题材 / 年代 / 流派 */
  CREATE TABLE IF NOT EXISTS category (
    id     TEXT PRIMARY KEY,
    grp    TEXT NOT NULL,           -- hangdang | ticai | niandai | liupai
    name   TEXT NOT NULL,
    descr  TEXT,
    sort   INTEGER DEFAULT 0
  );

  /* 剧目表 */
  CREATE TABLE IF NOT EXISTS opera (
    id         TEXT PRIMARY KEY,
    title      TEXT NOT NULL,
    alias      TEXT,
    era        TEXT,                -- -> category(niandai)
    genre      TEXT,                -- -> category(ticai)
    troupe     TEXT,                -- -> category(liupai)
    roles      TEXT,                -- JSON 数组（行当 id）
    premiere   INTEGER,
    playwright TEXT,
    region     TEXT,
    duration   TEXT,
    popularity INTEGER DEFAULT 0,
    palette    INTEGER DEFAULT 0,
    famous     TEXT,                -- JSON 数组
    summary    TEXT,
    highlight  TEXT
  );

  /* 名家表 */
  CREATE TABLE IF NOT EXISTS artist (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    gender      TEXT,
    birth       INTEGER,
    death       INTEGER,
    role        TEXT,               -- -> category(hangdang)
    school      TEXT,               -- -> category(liupai)
    region      TEXT,
    palette     INTEGER DEFAULT 0,
    popularity  INTEGER DEFAULT 0,
    title       TEXT,
    bio         TEXT,
    achievement TEXT
  );

  /* 剧目-名家关联表 */
  CREATE TABLE IF NOT EXISTS opera_artist (
    opera_id  TEXT NOT NULL,
    artist_id TEXT NOT NULL,
    role      TEXT,
    PRIMARY KEY (opera_id, artist_id),
    FOREIGN KEY (opera_id)  REFERENCES opera(id),
    FOREIGN KEY (artist_id) REFERENCES artist(id)
  );

  /* 视频音频库表 */
  CREATE TABLE IF NOT EXISTS media (
    id        TEXT PRIMARY KEY,
    opera_id  TEXT,
    artist_id TEXT,
    type      TEXT,                 -- video | audio
    title     TEXT NOT NULL,
    performer TEXT,
    duration  TEXT,
    year      INTEGER,
    plays     INTEGER DEFAULT 0,
    img       TEXT,
    source    TEXT,                 -- 原平台页面链接
    audio_url TEXT,                 -- 可直接播放的音频地址（archive.org 等）
    embed_url TEXT,                 -- 可嵌入的视频播放器地址（哔哩哔哩等）
    src_note  TEXT,                 -- 音视频真实来源说明
    intro     TEXT
  );

  /* 戏词表 + 戏词句子表 */
  CREATE TABLE IF NOT EXISTS lyrics (
    id       TEXT PRIMARY KEY,
    opera_id TEXT,
    title    TEXT NOT NULL,
    source   TEXT,
    note     TEXT
  );
  CREATE TABLE IF NOT EXISTS lyric_line (
    lyrics_id TEXT NOT NULL,
    idx       INTEGER NOT NULL,
    text      TEXT,
    yin       TEXT,
    exp       TEXT,
    PRIMARY KEY (lyrics_id, idx),
    FOREIGN KEY (lyrics_id) REFERENCES lyrics(id)
  );

  /* ---------------- 用户产生的动态数据 ---------------- */
  CREATE TABLE IF NOT EXISTS user (
    id          TEXT PRIMARY KEY,
    username    TEXT UNIQUE NOT NULL,
    password    TEXT NOT NULL,
    nickname    TEXT,
    signature   TEXT,
    gender      TEXT,
    region      TEXT,
    role        TEXT,
    avatar_seed INTEGER DEFAULT 0,
    created     TEXT
  );

  CREATE TABLE IF NOT EXISTS token (
    token   TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created TEXT,
    FOREIGN KEY (user_id) REFERENCES user(id)
  );

  CREATE TABLE IF NOT EXISTS favorite (
    id        TEXT PRIMARY KEY,
    user_id   TEXT NOT NULL,
    type      TEXT NOT NULL,        -- opera | artist | media
    target_id TEXT NOT NULL,
    created   TEXT,
    UNIQUE (user_id, type, target_id),
    FOREIGN KEY (user_id) REFERENCES user(id)
  );

  CREATE TABLE IF NOT EXISTS comment (
    id          TEXT PRIMARY KEY,
    user_id     TEXT,
    nickname    TEXT,
    avatar_seed INTEGER DEFAULT 0,
    type        TEXT NOT NULL,
    target_id   TEXT NOT NULL,
    content     TEXT,
    rating      INTEGER DEFAULT 5,
    likes       INTEGER DEFAULT 0,
    created     TEXT
  );

  CREATE TABLE IF NOT EXISTS learn_record (
    id        TEXT PRIMARY KEY,
    user_id   TEXT NOT NULL,
    lyrics_id TEXT NOT NULL,
    progress  INTEGER DEFAULT 0,
    last      TEXT,
    UNIQUE (user_id, lyrics_id),
    FOREIGN KEY (user_id) REFERENCES user(id)
  );

  CREATE TABLE IF NOT EXISTS history (
    id        TEXT PRIMARY KEY,
    user_id   TEXT NOT NULL,
    type      TEXT NOT NULL,
    target_id TEXT NOT NULL,
    title     TEXT,
    time      TEXT,
    FOREIGN KEY (user_id) REFERENCES user(id)
  );

  /* ---------------- 热度分析数据（爬取 / 大样本采集） ---------------- */
  /* 城市维度（用于地图打点 + 聚合） */
  CREATE TABLE IF NOT EXISTS region_geo (
    code      TEXT PRIMARY KEY,     -- 城市/地区编码
    name      TEXT NOT NULL,        -- 与地图 properties.name 对应
    province  TEXT,
    lng       REAL,
    lat       REAL,
    is_core   INTEGER DEFAULT 0     -- 是否粤剧核心流行区（广府文化区）
  );

  /* 演出 / 活动 样本记录（大样本，热度分析的明细来源） */
  CREATE TABLE IF NOT EXISTS performance (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    region     TEXT NOT NULL,       -- -> region_geo(name)
    province   TEXT,
    venue      TEXT,
    troupe     TEXT,
    opera_id   TEXT,
    opera_title TEXT,
    date       TEXT,                -- YYYY-MM-DD
    year       INTEGER,
    audience   INTEGER,             -- 观众人数
    online_play INTEGER,           -- 线上播放/搜索热度
    channel    TEXT,                -- offline | bilibili | douyin | wechat | tv
    source     TEXT                 -- 数据来源（爬取来源 / 采集方式）
  );

  /* ---------------- 公开演出（用户申请 → 管理员审核 → 展示报名） ---------------- */
  CREATE TABLE IF NOT EXISTS show_event (
    id            TEXT PRIMARY KEY,
    title         TEXT NOT NULL,       -- 演出名称
    opera_id      TEXT,                -- 关联剧目（可空）
    opera_title   TEXT,                -- 上演剧目
    troupe        TEXT,                -- 演出团体
    city          TEXT,                -- 城市
    venue         TEXT,                -- 场馆
    address       TEXT,                -- 详细地址
    date          TEXT,                -- 演出日期 YYYY-MM-DD
    time          TEXT,                -- 演出时间 HH:MM
    price         TEXT,                -- 票价说明
    capacity      INTEGER DEFAULT 0,   -- 可报名名额（0=不限）
    poster_seed   INTEGER DEFAULT 0,   -- 海报配色
    intro         TEXT,                -- 演出介绍
    contact       TEXT,                -- 联系方式
    applicant_id  TEXT,                -- 申请人 user.id
    applicant_name TEXT,               -- 申请人昵称
    status        TEXT DEFAULT 'pending', -- pending | approved | rejected
    review_note   TEXT,                -- 审核意见
    created       TEXT,
    reviewed_at   TEXT,
    FOREIGN KEY (applicant_id) REFERENCES user(id)
  );

  CREATE TABLE IF NOT EXISTS show_signup (
    id        TEXT PRIMARY KEY,
    event_id  TEXT NOT NULL,
    user_id   TEXT NOT NULL,
    name      TEXT,                    -- 观众姓名
    phone     TEXT,                    -- 联系电话
    num       INTEGER DEFAULT 1,       -- 报名人数
    note      TEXT,
    created   TEXT,
    UNIQUE (event_id, user_id),
    FOREIGN KEY (event_id) REFERENCES show_event(id),
    FOREIGN KEY (user_id)  REFERENCES user(id)
  );

  CREATE INDEX IF NOT EXISTS idx_perf_region ON performance(region);
  CREATE INDEX IF NOT EXISTS idx_perf_year   ON performance(year);
  CREATE INDEX IF NOT EXISTS idx_fav_user    ON favorite(user_id);
  CREATE INDEX IF NOT EXISTS idx_cmt_target  ON comment(type, target_id);
  CREATE INDEX IF NOT EXISTS idx_evt_status  ON show_event(status, date);
  CREATE INDEX IF NOT EXISTS idx_signup_evt  ON show_signup(event_id);
  `);
  migrate();
}

/* 轻量迁移：为已存在的旧库补充新增列（媒体真实音视频地址） */
function migrate() {
  const cols = db.prepare(`PRAGMA table_info(media)`).all().map(c => c.name);
  const add = (name, type) => { if (!cols.includes(name)) db.exec(`ALTER TABLE media ADD COLUMN ${name} ${type}`); };
  add('audio_url', 'TEXT');
  add('embed_url', 'TEXT');
  add('src_note', 'TEXT');
}

function tableCount(name) {
  try { return db.prepare(`SELECT COUNT(*) AS n FROM ${name}`).get().n; }
  catch (e) { return 0; }
}

module.exports = { db, initSchema, tableCount, DB_FILE };
