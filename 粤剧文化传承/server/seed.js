/* =============================================================
 * seed.js —— 初始化数据库并写入种子数据
 *   node server/seed.js          首次/空库时填充
 *   node server/seed.js --force  清空并重建全部数据
 * ============================================================= */
const { db, initSchema, tableCount } = require('./db');
const REF = require('./seed-reference.js');
const { REGIONS, generatePerformances } = require('./heat-data');
const { hashPassword } = require('./password');

const force = process.argv.includes('--force');
const now = () => {
  const d = new Date(), z = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}:${z(d.getSeconds())}`;
};

initSchema();

function clearAll() {
  const tables = ['lyric_line','lyrics','opera_artist','media','opera','artist','category',
    'token','favorite','comment','learn_record','history','show_signup','show_event','user',
    'performance','region_geo'];
  db.exec('PRAGMA foreign_keys = OFF;');
  const tx = db.transaction(() => { tables.forEach(t => db.exec(`DELETE FROM ${t};`)); });
  tx();
  db.exec("DELETE FROM sqlite_sequence WHERE name='performance';");
  db.exec('PRAGMA foreign_keys = ON;');
}

function alreadySeeded() {
  return tableCount('opera') > 0 && tableCount('performance') > 0;
}

if (alreadySeeded() && !force) {
  console.log('数据库已存在数据，跳过填充（如需重建请运行：npm run reset）。');
  process.exit(0);
}
if (force) { console.log('--force：清空并重建数据…'); clearAll(); }

const seedContent = db.transaction(() => {
  /* 分类表 */
  const insCat = db.prepare('INSERT INTO category (id,grp,name,descr,sort) VALUES (?,?,?,?,?)');
  Object.entries(REF.categories).forEach(([grp, arr]) => {
    arr.forEach((c, i) => insCat.run(c.id, grp, c.name, c.desc, i));
  });

  /* 剧目表 */
  const insOpera = db.prepare(`INSERT INTO opera
    (id,title,alias,era,genre,troupe,roles,premiere,playwright,region,duration,popularity,palette,famous,summary,highlight)
    VALUES (@id,@title,@alias,@era,@genre,@troupe,@roles,@premiere,@playwright,@region,@duration,@popularity,@palette,@famous,@summary,@highlight)`);
  REF.operas.forEach(o => insOpera.run({
    ...o, roles: JSON.stringify(o.roles || []), famous: JSON.stringify(o.famous || []),
  }));

  /* 名家表 */
  const insArtist = db.prepare(`INSERT INTO artist
    (id,name,gender,birth,death,role,school,region,palette,popularity,title,bio,achievement)
    VALUES (@id,@name,@gender,@birth,@death,@role,@school,@region,@palette,@popularity,@title,@bio,@achievement)`);
  REF.artists.forEach(a => insArtist.run({ ...a, death: a.death ?? null }));

  /* 剧目-名家关联 */
  const insOA = db.prepare('INSERT OR IGNORE INTO opera_artist (opera_id,artist_id,role) VALUES (?,?,?)');
  REF.operaArtist.forEach(x => insOA.run(x.opera, x.artist, x.role));

  /* 媒体表 */
  const insMedia = db.prepare(`INSERT INTO media
    (id,opera_id,artist_id,type,title,performer,duration,year,plays,img,source,audio_url,embed_url,src_note,intro)
    VALUES (@id,@opera,@artist,@type,@title,@performer,@duration,@year,@plays,@img,@source,@audio,@embed,@srcNote,@intro)`);
  REF.media.forEach(m => insMedia.run({ audio: '', embed: '', srcNote: '', ...m }));

  /* 戏词 + 句子 */
  const insLy = db.prepare('INSERT INTO lyrics (id,opera_id,title,source,note) VALUES (?,?,?,?,?)');
  const insLine = db.prepare('INSERT INTO lyric_line (lyrics_id,idx,text,yin,exp) VALUES (?,?,?,?,?)');
  REF.lyrics.forEach(l => {
    insLy.run(l.id, l.opera, l.title, l.source, l.note);
    l.lines.forEach((ln, i) => insLine.run(l.id, i, ln.text, ln.yin, ln.exp));
  });
});

const seedDynamic = db.transaction(() => {
  const insUser = db.prepare(`INSERT INTO user
    (id,username,password,nickname,signature,gender,region,role,avatar_seed,created)
    VALUES (@id,@username,@password,@nickname,@signature,@gender,@region,@role,@avatar_seed,@created)`);
  // 演示口令统一加盐哈希后入库（演示账号仍为 123456，但库内不再明文）
  const DEMO_PWD = hashPassword('123456');
  // 普通会员演示账号（用户端）
  insUser.run({ id: 'u_demo', username: 'liyuan', password: DEMO_PWD, nickname: '梨园票友',
    signature: '一曲南音诉旧情，半生痴绝爱粤声。', gender: '男', region: '广州',
    role: '会员', avatar_seed: 2, created: '2025-01-08 10:20:00' });
  // 管理员账号（管理后台）
  insUser.run({ id: 'u_admin', username: 'admin', password: hashPassword('123456'), nickname: '平台管理员',
    signature: '南国红豆 · 后台管理', gender: '保密', region: '广州',
    role: '管理员', avatar_seed: 0, created: '2025-01-01 09:00:00' });
  // 另一位活跃会员（用于演出报名演示）
  insUser.run({ id: 'u_yh', username: 'yuehong', password: hashPassword('123456'), nickname: '红豆生',
    signature: '听戏三十年。', gender: '女', region: '佛山',
    role: '会员', avatar_seed: 4, created: '2025-02-02 11:00:00' });

  const insFav = db.prepare('INSERT OR IGNORE INTO favorite (id,user_id,type,target_id,created) VALUES (?,?,?,?,?)');
  [['f1','opera','op_dnh','2025-03-02 21:10:00'],
   ['f2','artist','ar_hxn','2025-03-05 19:40:00'],
   ['f3','media','me_02','2025-03-09 22:05:00']].forEach(([id,t,tid,c]) => insFav.run(id,'u_demo',t,tid,c));

  const insCmt = db.prepare(`INSERT INTO comment
    (id,user_id,nickname,avatar_seed,type,target_id,content,rating,likes,created)
    VALUES (@id,@user_id,@nickname,@avatar_seed,@type,@target_id,@content,@rating,@likes,@created)`);
  [
    { id:'c1', user_id:'u_demo', nickname:'梨园票友', avatar_seed:2, type:'opera', target_id:'op_dnh', content:'《香夭》一曲百听不厌，任白的默契无人能及，粤剧之魂也。', rating:5, likes:36, created:'2025-03-02 21:15:00' },
    { id:'c2', user_id:null, nickname:'红豆生南国', avatar_seed:4, type:'opera', target_id:'op_dnh', content:'第一次带长辈来看，老人家听得热泪盈眶，这就是传承。', rating:5, likes:21, created:'2025-03-11 20:02:00' },
    { id:'c3', user_id:null, nickname:'听戏的少年', avatar_seed:3, type:'artist', target_id:'ar_hxn', content:'红腔甜润高亢，《荔枝颂》是我学唱粤曲的启蒙。', rating:5, likes:18, created:'2025-03-12 09:30:00' },
    { id:'c4', user_id:null, nickname:'西关小姐', avatar_seed:5, type:'opera', target_id:'op_ssy', content:'原来“南国红豆”的称呼是这么来的，长知识了！', rating:4, likes:12, created:'2025-03-14 14:48:00' },
  ].forEach(c => insCmt.run(c));

  const insLearn = db.prepare('INSERT OR IGNORE INTO learn_record (id,user_id,lyrics_id,progress,last) VALUES (?,?,?,?,?)');
  insLearn.run('l1','u_demo','ly_01',100,'2025-03-10 21:30:00');
  insLearn.run('l2','u_demo','ly_02',40,'2025-03-13 22:12:00');

  /* 公开演出（申请 → 审核 → 报名） */
  const dPlus = n => { const d = new Date(Date.now() + n * 864e5), z = x => String(x).padStart(2, '0');
    return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}`; };
  const insEvt = db.prepare(`INSERT INTO show_event
    (id,title,opera_id,opera_title,troupe,city,venue,address,date,time,price,capacity,poster_seed,intro,contact,applicant_id,applicant_name,status,review_note,created,reviewed_at)
    VALUES (@id,@title,@opera_id,@opera_title,@troupe,@city,@venue,@address,@date,@time,@price,@capacity,@poster_seed,@intro,@contact,@applicant_id,@applicant_name,@status,@review_note,@created,@reviewed_at)`);
  const events = [
    { id:'ev_01', title:'仙凤鸣经典《帝女花》全本', opera_id:'op_dnh', opera_title:'帝女花', troupe:'广州粤剧院', city:'广州', venue:'广东粤剧艺术中心', address:'广州市荔湾区珠江桥中恒宝广场', date:dPlus(9), time:'19:30', price:'80 / 180 / 280 元', capacity:200, poster_seed:0, intro:'任白名剧《帝女花》全本搬演，长平公主与周世显的乱世绝唱，含《香夭》《庵遇》《上表》等经典折子。', contact:'020-8888xxxx', applicant_id:'u_demo', applicant_name:'梨园票友', status:'approved', review_note:'剧目经典，场地资质齐全，通过。', created:'2026-05-10 10:00:00', reviewed_at:'2026-05-11 09:20:00' },
    { id:'ev_02', title:'红派粤曲《荔枝颂》专场', opera_id:'op_zjcs', opera_title:'昭君出塞 / 荔枝颂', troupe:'红线女艺术中心', city:'广州', venue:'红线女艺术中心', address:'广州市珠江北岸华侨城', date:dPlus(16), time:'20:00', price:'免费（凭票入场）', capacity:120, poster_seed:0, intro:'纪念红线女诞辰，红派传人专场演唱《荔枝颂》《昭君出塞》等红腔名曲。', contact:'020-8666xxxx', applicant_id:'u_yh', applicant_name:'红豆生', status:'approved', review_note:'公益专场，通过。', created:'2026-05-12 14:00:00', reviewed_at:'2026-05-13 10:00:00' },
    { id:'ev_03', title:'佛山粤剧周·折子戏荟萃', opera_id:'op_bsz', opera_title:'白蛇传·断桥 等', troupe:'佛山粤剧团', city:'佛山', venue:'琼花大剧院', address:'佛山市禅城区福贤路', date:dPlus(24), time:'19:30', price:'60 / 120 元', capacity:300, poster_seed:2, intro:'佛山粤剧周系列演出，集合《白蛇传·断桥》《平贵别窑》等经典折子戏。', contact:'0757-8333xxxx', applicant_id:'u_demo', applicant_name:'梨园票友', status:'approved', review_note:'通过。', created:'2026-05-15 09:00:00', reviewed_at:'2026-05-16 09:00:00' },
    { id:'ev_04', title:'校园粤剧公益演出（待审核）', opera_id:'op_ssy', opera_title:'搜书院·步月抒怀', troupe:'南粤青年粤剧社', city:'深圳', venue:'深圳大学演艺中心', address:'深圳市南山区南海大道', date:dPlus(30), time:'15:00', price:'免费', capacity:150, poster_seed:3, intro:'面向高校学生的粤剧普及公益演出，希望申请在平台公开发布并接受报名。', contact:'138xxxx8888', applicant_id:'u_yh', applicant_name:'红豆生', status:'pending', review_note:'', created:'2026-05-28 16:30:00', reviewed_at:null },
    { id:'ev_05', title:'某商演（含商业广告）', opera_id:null, opera_title:'粤剧选段', troupe:'个人', city:'东莞', venue:'待定', address:'待定', date:dPlus(40), time:'20:00', price:'内部', capacity:50, poster_seed:4, intro:'夹带商业推广内容，信息不全。', contact:'139xxxx0000', applicant_id:'u_demo', applicant_name:'梨园票友', status:'rejected', review_note:'信息不完整且含商业广告，暂不通过，请完善后重新提交。', created:'2026-05-20 11:00:00', reviewed_at:'2026-05-21 10:00:00' },
  ];
  events.forEach(e => insEvt.run(e));

  const insSign = db.prepare('INSERT OR IGNORE INTO show_signup (id,event_id,user_id,name,phone,num,note,created) VALUES (?,?,?,?,?,?,?,?)');
  insSign.run('sg1','ev_01','u_yh','红豆生','139xxxx1234',2,'和家人一起观看','2026-05-18 20:10:00');
  insSign.run('sg2','ev_02','u_demo','梨园票友','138xxxx5678',1,'','2026-05-19 09:30:00');
});

const seedHeat = db.transaction(() => {
  const insGeo = db.prepare('INSERT OR REPLACE INTO region_geo (code,name,province,lng,lat,is_core) VALUES (?,?,?,?,?,?)');
  REGIONS.forEach(r => insGeo.run(r.code, r.name, r.province, r.lng, r.lat, r.core ? 1 : 0));

  const perfs = generatePerformances(REF.operas);
  const insPerf = db.prepare(`INSERT INTO performance
    (region,province,venue,troupe,opera_id,opera_title,date,year,audience,online_play,channel,source)
    VALUES (@region,@province,@venue,@troupe,@opera_id,@opera_title,@date,@year,@audience,@online_play,@channel,@source)`);
  perfs.forEach(p => insPerf.run(p));
  return perfs.length;
});

seedContent();
seedDynamic();
const perfCount = seedHeat();

console.log('✓ 内容数据：剧目 %d / 名家 %d / 媒体 %d / 戏词 %d',
  tableCount('opera'), tableCount('artist'), tableCount('media'), tableCount('lyrics'));
console.log('✓ 用户数据：用户 %d / 收藏 %d / 评论 %d / 学习 %d',
  tableCount('user'), tableCount('favorite'), tableCount('comment'), tableCount('learn_record'));
console.log('✓ 公开演出：活动 %d / 报名 %d', tableCount('show_event'), tableCount('show_signup'));
console.log('✓ 热度数据：地区 %d / 演出样本 %d', tableCount('region_geo'), perfCount);
console.log('数据库初始化完成 → data/yueju.db');
