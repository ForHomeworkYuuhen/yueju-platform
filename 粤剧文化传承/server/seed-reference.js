/* 服务端种子数据（由 web/js/data.js 迁移） */
const DB = {};

/* ---------------- 分类表 category ---------------- */
DB.categories = {
  // 行当
  hangdang: [
    { id: 'hd_wenwu', name: '文武生', desc: '生行之首，能文能武，粤剧第一主角' },
    { id: 'hd_xiaosheng', name: '小生', desc: '年轻书生、公子一类角色' },
    { id: 'hd_huadan', name: '正印花旦', desc: '旦行首席，扮演青年女子' },
    { id: 'hd_laodan', name: '老旦', desc: '扮演老年妇女' },
    { id: 'hd_chousheng', name: '丑生', desc: '诙谐机智，亦庄亦谐' },
    { id: 'hd_wusheng', name: '武生', desc: '以武打、做功为主的角色' },
  ],
  // 题材
  ticai: [
    { id: 'tc_lishi', name: '历史', desc: '取材历史人物与事件' },
    { id: 'tc_aiqing', name: '爱情', desc: '才子佳人、儿女情长' },
    { id: 'tc_shenhua', name: '神话', desc: '神仙鬼怪、民间传说' },
    { id: 'tc_gongan', name: '公案', desc: '断案除奸、惩恶扬善' },
    { id: 'tc_xiandai', name: '现代', desc: '现代题材新编剧目' },
  ],
  // 年代
  niandai: [
    { id: 'nd_30', name: '二三十年代', desc: '薛马争雄的黄金时期' },
    { id: 'nd_50', name: '五六十年代', desc: '唐涤生与仙凤鸣的鼎盛年代' },
    { id: 'nd_now', name: '当代新编', desc: '改革开放至今的新创作' },
  ],
  // 剧团 / 流派
  liupai: [
    { id: 'lp_xianfeng', name: '仙凤鸣', desc: '任白领衔，唐涤生编剧的传奇剧团' },
    { id: 'lp_hong', name: '红派', desc: '红线女创立的旦角流派（红腔）' },
    { id: 'lp_ma', name: '马腔', desc: '马师曾的独特唱腔（乞儿喉）' },
    { id: 'lp_xue', name: '薛腔', desc: '薛觉先开创的小生唱腔' },
    { id: 'lp_xia', name: '虾腔', desc: '罗家宝（虾哥）的文武生唱腔' },
    { id: 'lp_fang', name: '芳腔', desc: '芳艳芬的花旦唱腔' },
  ],
};

/* ---------------- 剧目表 opera ---------------- */
/* palette 索引用于 SVG 海报配色；poster 字段为海报主字 */
DB.operas = [
  {
    id: 'op_dnh', title: '帝女花', alias: '香夭', era: 'nd_50', genre: 'tc_lishi',
    troupe: 'lp_xianfeng', roles: ['hd_wenwu', 'hd_huadan'], premiere: 1957,
    playwright: '唐涤生', region: '香港', duration: '约 150 分钟', popularity: 9900, palette: 0,
    famous: ['香夭', '庵遇', '上表'],
    summary: '改编自清代黄燮清《帝女花》传奇。明末，长平公主与太仆之子周世显订婚，适逢李自成破城、清兵入关，国破家亡。乱世之中二人重逢，于含樟树下相认，最终以双双殉国、合卺而亡的“香夭”一幕成就粤剧史上最凄美的爱情绝唱。1957 年由仙凤鸣剧团首演，任剑辉饰周世显、白雪仙饰长平公主，传唱至今。',
    highlight: '“落花满天蔽月光，借一杯附荐凤台上”——《香夭》一曲，被誉为粤剧的“咏叹调”。',
  },
  {
    id: 'op_zck', title: '紫钗记', alias: '剑合钗圆', era: 'nd_50', genre: 'tc_aiqing',
    troupe: 'lp_xianfeng', roles: ['hd_wenwu', 'hd_huadan'], premiere: 1957,
    playwright: '唐涤生', region: '香港', duration: '约 140 分钟', popularity: 8700, palette: 3,
    famous: ['剑合钗圆', '花前遇侠', '吞钗'],
    summary: '唐涤生据明代汤显祖《紫钗记》改编。书生李益元宵拾得霍小玉所遗紫玉钗，借钗为媒结为夫妇。李益高中后被卢太尉强留逼婚，小玉典钗寻夫、相思成疾。幸得黄衫客仗义相助，终在卢府“剑合钗圆”，有情人破镜重圆。',
    highlight: '“未言别，怨别离”——李益霍小玉的痴情，是唐涤生笔下最缠绵的一笔。',
  },
  {
    id: 'op_zshmj', title: '再世红梅记', alias: '脱阱救裴', era: 'nd_50', genre: 'tc_shenhua',
    troupe: 'lp_xianfeng', roles: ['hd_wenwu', 'hd_huadan'], premiere: 1959,
    playwright: '唐涤生', region: '香港', duration: '约 145 分钟', popularity: 8200, palette: 4,
    famous: ['折梅巧遇', '脱阱救裴', '观柳还琴'],
    summary: '唐涤生封笔之作，据周朝俊《红梅记》改编。烈女李慧娘为权相贾似道所害，化作幽魂；书生裴禹因貌似慧娘旧识而蒙难。慧娘魂魄不忘正义，脱阱救裴，人鬼情未了。1959 年首演当晚唐涤生猝然离世，此剧遂成绝唱。',
    highlight: '一句“折梅花”牵起人鬼三世情缘，唐涤生以此剧告别人间。',
  },
  {
    id: 'op_mdt', title: '牡丹亭惊梦', alias: '游园惊梦', era: 'nd_50', genre: 'tc_aiqing',
    troupe: 'lp_xianfeng', roles: ['hd_xiaosheng', 'hd_huadan'], premiere: 1956,
    playwright: '唐涤生', region: '香港', duration: '约 130 分钟', popularity: 7600, palette: 2,
    famous: ['游园', '惊梦', '幽媾'],
    summary: '据汤显祖《牡丹亭》改编。南安太守之女杜丽娘游园伤春，梦中与书生柳梦梅相会，醒后相思而亡。三年后柳梦梅赴考途中拾得丽娘自画像，痴情感动幽魂，杜丽娘还魂复生，终成眷属。“情不知所起，一往而深”。',
    highlight: '“原来姹紫嫣红开遍”——一场游园，唱尽闺中少女的青春情思。',
  },
  {
    id: 'op_ssy', title: '搜书院', alias: '南国红豆', era: 'nd_50', genre: 'tc_aiqing',
    troupe: 'lp_ma', roles: ['hd_wenwu', 'hd_huadan'], premiere: 1956,
    playwright: '杨子静、莫汝城等', region: '广州', duration: '约 135 分钟', popularity: 9200, palette: 1,
    famous: ['步月抒怀', '初遇诉情', '柴房自叹'],
    summary: '婢女翠莲因放风筝触怒主母，逃入镜花书院；琼台书院掌教谢宝爱才仗义，将翠莲与书生张逸民暗中庇护，巧斗总镇，终助有情人远走高飞。1956 年马师曾、红线女携此剧晋京演出，周恩来总理观后盛赞粤剧为“南国红豆”，自此成为粤剧的雅称。',
    highlight: '一出《搜书院》进京，换得粤剧“南国红豆”之美名，意义非凡。',
  },
  {
    id: 'op_ghq', title: '关汉卿', alias: '蝶双飞', era: 'nd_50', genre: 'tc_lishi',
    troupe: 'lp_hong', roles: ['hd_wenwu', 'hd_huadan'], premiere: 1958,
    playwright: '田汉（粤剧改编）', region: '广州', duration: '约 140 分钟', popularity: 8000, palette: 0,
    famous: ['蝶双飞', '为民请命'],
    summary: '写元代戏剧家关汉卿目睹冤情，奋笔写就《窦娥冤》，与艺人朱帘秀共担风险、为民请命，宁折不屈。马师曾饰关汉卿、红线女饰朱帘秀，唱段《蝶双飞》荡气回肠，是粤剧现代化的里程碑。',
    highlight: '“将碧血，写忠烈”——《蝶双飞》唱出文人风骨与艺人气节。',
  },
  {
    id: 'op_zjcs', title: '昭君出塞', alias: '昭君怨', era: 'nd_50', genre: 'tc_lishi',
    troupe: 'lp_hong', roles: ['hd_huadan'], premiere: 1955,
    playwright: '传统剧目', region: '广州', duration: '约 60 分钟', popularity: 7800, palette: 3,
    famous: ['出塞', '抱琵琶'],
    summary: '汉元帝宫女王昭君，因不肯贿赂画师而被远嫁匈奴。出塞途中，昭君怀抱琵琶，遥望故国，唱尽家国之思、儿女之情。红线女以“红腔”演绎，凄婉动人，为其代表作之一。',
    highlight: '一曲《昭君怨》，红线女的“红腔”如泣如诉，绕梁三日。',
  },
  {
    id: 'op_sxfy', title: '山乡风云', alias: '刘琴', era: 'nd_now', genre: 'tc_xiandai',
    troupe: 'lp_hong', roles: ['hd_huadan', 'hd_wenwu'], premiere: 1965,
    playwright: '广东粤剧院集体改编', region: '广州', duration: '约 120 分钟', popularity: 7000, palette: 5,
    famous: ['夜送', '访贫问苦'],
    summary: '现代粤剧的开山之作。解放战争时期，女游击队长刘琴化装潜入山乡，发动群众、智斗顽敌，谱写一曲革命英雄赞歌。红线女饰刘琴，将粤剧传统程式成功运用于现代人物，开“革命现代粤剧”之先河。',
    highlight: '传统粤剧第一次成功塑造现代英雄，红线女功不可没。',
  },
  {
    id: 'op_hbg', title: '胡不归', alias: '慰妻', era: 'nd_30', genre: 'tc_aiqing',
    troupe: 'lp_xue', roles: ['hd_wenwu', 'hd_huadan'], premiere: 1939,
    playwright: '冯志芬', region: '广州', duration: '约 130 分钟', popularity: 8400, palette: 4,
    famous: ['慰妻', '哭坟', '逼媳'],
    summary: '薛觉先名剧。文萍生与赵颦娘恩爱情深，怎奈萍生之母嫌弃颦娘出身、又因其染病而百般逼迫，终致夫妻生死相隔。《慰妻》《哭坟》二折，写尽人间至情与封建礼教之残酷，催人泪下。',
    highlight: '“惨淡客途中”——薛觉先的“薛腔”在《慰妻》中哀婉到极致。',
  },
  {
    id: 'op_pgby', title: '平贵别窑', alias: '武家坡', era: 'nd_30', genre: 'tc_lishi',
    troupe: 'lp_xue', roles: ['hd_wenwu', 'hd_huadan'], premiere: 1930,
    playwright: '传统剧目', region: '广州', duration: '约 70 分钟', popularity: 6500, palette: 1,
    famous: ['别窑', '回窑'],
    summary: '相府千金王宝钏不嫌薛平贵贫寒，下嫁寒窑。平贵从军西征，临别寒窑，夫妻依依惜别；十八年后衣锦还乡，于武家坡试妻团圆。一别一聚，唱做并重，是文武生与花旦的对手好戏。',
    highlight: '寒窑十八载，一曲别离唱尽贫贱夫妻的患难真情。',
  },
  {
    id: 'op_bsz', title: '白蛇传', alias: '雷峰塔', era: 'nd_now', genre: 'tc_shenhua',
    troupe: 'lp_fang', roles: ['hd_huadan', 'hd_xiaosheng'], premiere: 1953,
    playwright: '传统剧目', region: '广州', duration: '约 135 分钟', popularity: 7200, palette: 2,
    famous: ['断桥', '水漫金山', '祭塔'],
    summary: '千年白蛇白素贞修炼成人，与书生许仙西湖借伞、结为夫妻。法海从中作梗，逼许仙出家；白蛇水漫金山寺，终被镇于雷峰塔下。神话外衣下，是对自由爱情的执着追求。',
    highlight: '“断桥相会”一折，缠绵悱恻；“水漫金山”一场，气势磅礴。',
  },
  {
    id: 'op_lyx', title: '六月雪', alias: '窦娥冤', era: 'nd_50', genre: 'tc_gongan',
    troupe: 'lp_fang', roles: ['hd_huadan'], premiere: 1956,
    playwright: '据关汉卿原著改编', region: '广州', duration: '约 110 分钟', popularity: 6800, palette: 0,
    famous: ['探监', '法场'],
    summary: '善良的窦娥被泼皮张驴儿诬陷，又遇贪官屈打成招，问斩之日六月飞雪、血溅白练，三桩誓愿一一应验，以昭奇冤。芳艳芬以“芳腔”演窦娥，悲愤苍凉，是公案戏的代表。',
    highlight: '六月飞雪，血溅白练——天地动容，只为昭雪一桩奇冤。',
  },
];

/* ---------------- 名家表 artist ---------------- */
DB.artists = [
  {
    id: 'ar_hxn', name: '红线女', gender: '女', birth: 1924, death: 2013,
    role: 'hd_huadan', school: 'lp_hong', region: '广东开平', palette: 0, popularity: 9900,
    title: '粤剧艺术大师 · 红腔创始人',
    works: ['op_ssy', 'op_ghq', 'op_zjcs', 'op_sxfy'],
    bio: '原名邝健廉，粤剧表演艺术家，“红派”艺术（红腔）创始人。13 岁学艺，转益多师，融会贯通京、昆及西洋发声，独创甜润高亢、刚柔并济的“红腔”，将粤剧旦角艺术推向新的高峰。代表作《搜书院》《关汉卿》《昭君出塞》《山乡风云》及粤曲《荔枝颂》。2009 年获“中国戏剧终身成就奖”，被誉为“粤剧一代宗师”。',
    achievement: '中国戏剧终身成就奖、首届中国金唱片奖；以其名设立“红线女艺术中心”。',
  },
  {
    id: 'ar_msz', name: '马师曾', gender: '男', birth: 1900, death: 1964,
    role: 'hd_chousheng', school: 'lp_ma', region: '广东顺德', palette: 1, popularity: 9000,
    title: '一代宗师 · 马腔（乞儿喉）',
    works: ['op_ssy', 'op_ghq'],
    bio: '粤剧表演艺术家、改革家，与薛觉先并称“薛马争雄”，雄踞粤剧舞台数十年。独创顿挫分明、诙谐传神的“马腔”（乞儿喉），尤擅丑生与文武生。一生编演剧目逾四百，《搜书院》《关汉卿》《苦凤莺怜》皆脍炙人口，对粤剧表演体系贡献卓著。',
    achievement: '与红线女合演《搜书院》晋京，促成粤剧“南国红豆”之誉。',
  },
  {
    id: 'ar_xjx', name: '薛觉先', gender: '男', birth: 1904, death: 1956,
    role: 'hd_wenwu', school: 'lp_xue', region: '广东顺德', palette: 4, popularity: 8800,
    title: '万能老倌 · 薛腔',
    works: ['op_hbg', 'op_pgby'],
    bio: '粤剧革新的先驱，人称“万能老倌”，生旦净末丑无一不精。开创清新典雅的“薛腔”，引入电影化布景与新式音乐，使粤剧面貌焕然一新。代表作《胡不归》《白金龙》。与马师曾“薛马争雄”，共同缔造粤剧的黄金时代。',
    achievement: '推动粤剧现代化改革，影响后世文武生表演甚巨。',
  },
  {
    id: 'ar_bjr', name: '白驹荣', gender: '男', birth: 1892, death: 1974,
    role: 'hd_xiaosheng', school: 'lp_xue', region: '广东顺德', palette: 3, popularity: 7600,
    title: '小生王',
    works: ['op_zshmj'],
    bio: '粤剧“小生王”，白雪仙之父。率先以真嗓（平喉）演唱小生，吐字清晰、行腔典雅，一改前人假嗓之风，奠定粤剧平喉演唱之基。代表作《泣荆花》《再生缘》。晚年虽双目失明仍登台献艺，艺德为后辈楷模。',
    achievement: '开创平喉演唱，是粤剧唱腔变革的关键人物。',
  },
  {
    id: 'ar_bxx', name: '白雪仙', gender: '女', birth: 1928, death: null,
    role: 'hd_huadan', school: 'lp_xianfeng', region: '广东顺德', palette: 2, popularity: 9100,
    title: '仙凤鸣 · 正印花旦',
    works: ['op_dnh', 'op_zck', 'op_zshmj', 'op_mdt'],
    bio: '白驹荣之女，粤剧名伶。1956 年组建“仙凤鸣剧团”，礼聘唐涤生为其量身编剧，与任剑辉珠联璧合，缔造《帝女花》《紫钗记》《再世红梅记》等不朽名剧。表演细腻、文气盎然，是粤剧旦角艺术的典范，对粤剧剧本与舞台的精雅化居功至伟。',
    achievement: '创办仙凤鸣剧团，成就唐涤生“仙凤鸣四大名剧”。',
  },
  {
    id: 'ar_rjf', name: '任剑辉', gender: '女', birth: 1913, death: 1989,
    role: 'hd_wenwu', school: 'lp_xianfeng', region: '广东南海', palette: 0, popularity: 9300,
    title: '戏迷情人 · 女文武生',
    works: ['op_dnh', 'op_zck', 'op_zshmj'],
    bio: '粤剧史上最负盛名的“女文武生”，人称“戏迷情人”。以女儿身演绎翩翩浊世佳公子，风流儒雅、潇洒倜傥，倾倒万千观众。与白雪仙合作的仙凤鸣剧目，尤其《帝女花》之周世显，成为粤剧文武生表演的不朽典范。',
    achievement: '与白雪仙缔造“任白”传奇，影响数代粤剧观众。',
  },
  {
    id: 'ar_ljb', name: '罗家宝', gender: '男', birth: 1930, death: 2016,
    role: 'hd_wenwu', school: 'lp_xia', region: '广东南海', palette: 5, popularity: 7800,
    title: '虾腔创始人',
    works: ['op_zshmj'],
    bio: '人称“虾哥”，粤剧文武生，“虾腔”创始人。嗓音宽厚醇美，行腔流畅自然、韵味绵长，自成一家。代表作《柳毅传书》《梦断香销四十年》。其唱腔深受戏迷喜爱，传人众多，影响深远。',
    achievement: '首届中国金唱片奖；“虾腔”流传粤港澳及海外。',
  },
  {
    id: 'ar_ljs', name: '林家声', gender: '男', birth: 1933, death: 2015,
    role: 'hd_wenwu', school: 'lp_xue', region: '香港', palette: 4, popularity: 7400,
    title: '香港文武生泰斗',
    works: [],
    bio: '香港粤剧文武生泰斗，师承薛觉先。文武兼擅、做功精细，倡导“声、色、艺”三者并重，对剧艺一丝不苟。代表作《雷鸣金鼓战笳声》《无情宝剑有情天》。一生致力粤剧传承与教育，培育后进无数。',
    achievement: '获香港演艺学院荣誉院士，铜紫荆星章。',
  },
  {
    id: 'ar_fyf', name: '芳艳芬', gender: '女', birth: 1928, death: null,
    role: 'hd_huadan', school: 'lp_fang', region: '广东恩平', palette: 2, popularity: 7700,
    title: '芳腔创始人',
    works: ['op_bsz', 'op_lyx'],
    bio: '粤剧正印花旦，“芳腔”创始人。唱腔圆润婉转、低回缠绵，自成清丽一格。代表作《六月雪》《洛神》《白蛇传》。息影后投身慈善教育数十年，德艺双馨，备受敬重。',
    achievement: '“芳腔”传唱不衰；获大紫荆勋贤衔以表慈善贡献。',
  },
  {
    id: 'ar_xmsz', name: '新马师曾', gender: '男', birth: 1916, death: 1997,
    role: 'hd_wusheng', school: 'lp_ma', region: '广东顺德', palette: 1, popularity: 7500,
    title: '慈善伶王 · 新马腔',
    works: [],
    bio: '原名邓永祥，文武生兼擅老生，唱做俱佳，自创“新马腔”。早年宗马师曾，后博采众长、独树一帜。代表作《卧薪尝胆》《万恶淫为首》。一生热心公益，义演无数，人称“慈善伶王”。',
    achievement: '获英女王 MBE 勋衔，毕生义演善款无数。',
  },
  {
    id: 'ar_okm', name: '欧凯明', gender: '男', birth: 1962, death: null,
    role: 'hd_wenwu', school: 'lp_hong', region: '广西', palette: 0, popularity: 8200,
    title: '当代文武生 · 红派传人',
    works: ['op_sxfy'],
    bio: '当代粤剧领军人物，红线女入室弟子，红派艺术传人。文武双全、声情并茂，将传统功底与现代审美熔于一炉。代表作《山乡风云》《刑场上的婚礼》《大明长城》。两度荣获中国戏剧梅花奖，现为广州粤剧院艺术总监，致力粤剧的当代传承。',
    achievement: '二度梅花奖、文华表演奖；国家级非遗代表性传承人。',
  },
  {
    id: 'ar_nhy', name: '倪惠英', gender: '女', birth: 1956, death: null,
    role: 'hd_huadan', school: 'lp_hong', region: '广州', palette: 3, popularity: 7300,
    title: '当代花旦 · 梅花奖',
    works: [],
    bio: '当代著名粤剧花旦，唱腔甜美、台风清丽，融传统与创新于一体。代表作《花月影》《豪门千金》《三脱状元袍》。主持编纂《粤剧表演艺术大全》，为粤剧的系统整理与传承作出重要贡献。',
    achievement: '中国戏剧梅花奖；主编《粤剧表演艺术大全》。',
  },
];

/* ---------------- 剧目-名家关联表 operaArtist ---------------- */
DB.operaArtist = [
  { opera: 'op_dnh', artist: 'ar_rjf', role: '周世显' },
  { opera: 'op_dnh', artist: 'ar_bxx', role: '长平公主' },
  { opera: 'op_zck', artist: 'ar_rjf', role: '李益' },
  { opera: 'op_zck', artist: 'ar_bxx', role: '霍小玉' },
  { opera: 'op_zshmj', artist: 'ar_rjf', role: '裴禹' },
  { opera: 'op_zshmj', artist: 'ar_bxx', role: '李慧娘' },
  { opera: 'op_mdt', artist: 'ar_bxx', role: '杜丽娘' },
  { opera: 'op_ssy', artist: 'ar_msz', role: '谢宝' },
  { opera: 'op_ssy', artist: 'ar_hxn', role: '翠莲' },
  { opera: 'op_ghq', artist: 'ar_msz', role: '关汉卿' },
  { opera: 'op_ghq', artist: 'ar_hxn', role: '朱帘秀' },
  { opera: 'op_zjcs', artist: 'ar_hxn', role: '王昭君' },
  { opera: 'op_sxfy', artist: 'ar_hxn', role: '刘琴' },
  { opera: 'op_sxfy', artist: 'ar_okm', role: '黑牛' },
  { opera: 'op_hbg', artist: 'ar_xjx', role: '文萍生' },
  { opera: 'op_pgby', artist: 'ar_xjx', role: '薛平贵' },
  { opera: 'op_bsz', artist: 'ar_fyf', role: '白素贞' },
  { opera: 'op_lyx', artist: 'ar_fyf', role: '窦娥' },
];

/* ---------------- 视频音频库表 media ---------------- */
/* audio_url：可直接播放的真实音频（互联网档案馆 archive.org 公开历史录音）。
 * 这些是 20 世纪早期粤曲 / 粤剧 78 转唱片的数字化母带，版权状态为公共领域，
 * 支持断点续传与跨域播放，已逐条核验可用。video 条目的 embed_url 由
 * `npm run fetch-media` 在线检索哔哩哔哩后回填，离线时回退为原平台链接。 */
const IA = (id, file) => `https://archive.org/download/${id}/${file}`;
const IA_PAGE = id => `https://archive.org/details/${id}`;

/* 已核验的真实粤曲历史录音（archive.org · calachss 粤剧唱片收藏） */
DB.archiveAudio = [
  { id: 'calachss_000019', title: '懷人空洒相思淚', file: 'calachss_000019_d01_a_access.m4a', dur: '03:05' },
  { id: 'calachss_000002', title: '困南陽',         file: 'calachss_000002_a_access.m4a',     dur: '03:06' },
  { id: 'calachss_000021', title: '金葉菊',         file: 'calachss_000021_d01_a_access.m4a', dur: '03:16' },
  { id: 'calachss_000003', title: '唐明皇長恨',     file: 'calachss_000003_a_access.m4a',     dur: '03:08' },
  { id: 'calachss_000005', title: '名士風流',       file: 'calachss_000005_a_access.m4a',     dur: '02:36' },
  { id: 'calachss_000004', title: '猩猩女追夫',     file: 'calachss_000004_d01_a_access.m4a', dur: '03:03' },
  { id: 'calachss_000020', title: '惜分飛',         file: 'calachss_000020_d01_a_access.m4a', dur: '03:29' },
  { id: 'calachss_000012', title: '入仙賀寿',       file: 'calachss_000012_access.m4a',       dur: '02:03' },
];
const ARCH_SRC = '互联网档案馆 archive.org · 早期粤曲历史录音（公共领域）';
const a = i => DB.archiveAudio[i];

DB.media = [
  { id: 'me_01', opera: 'op_dnh', artist: 'ar_rjf', type: 'video', title: '帝女花·香夭', performer: '任剑辉 · 白雪仙', duration: '12:30', year: 1968, plays: 128000, img: 'opera01', source: 'https://www.bilibili.com/video/BV1Cx411', embed: '', audio: '', srcNote: '', intro: '仙凤鸣经典《香夭》一折，任白绝唱，粤剧最负盛名的对唱选段。' },
  { id: 'me_02', opera: 'op_zjcs', artist: 'ar_hxn', type: 'audio', title: '荔枝颂', performer: '红线女', duration: a(0).dur, year: 1959, plays: 96000, img: 'opera02', source: IA_PAGE(a(0).id), audio: IA(a(0).id, a(0).file), srcNote: '试听为同期粤曲历史录音《' + a(0).title + '》，' + ARCH_SRC, intro: '红线女标志性粤曲，以叫卖荔枝为引，唱腔甜润高亢，红腔典范。' },
  { id: 'me_03', opera: 'op_ssy', artist: 'ar_msz', type: 'video', title: '搜书院·步月抒怀', performer: '马师曾 · 红线女', duration: '15:42', year: 1956, plays: 73000, img: 'opera03', source: 'https://www.bilibili.com/video/BV搜书院', embed: '', audio: '', srcNote: '', intro: '晋京演出经典段落，马腔与红腔交相辉映，意义非凡的一出戏。' },
  { id: 'me_04', opera: 'op_ghq', artist: 'ar_hxn', type: 'audio', title: '关汉卿·蝶双飞', performer: '马师曾 · 红线女', duration: a(1).dur, year: 1958, plays: 65000, img: 'opera04', source: IA_PAGE(a(1).id), audio: IA(a(1).id, a(1).file), srcNote: '试听为同期粤曲历史录音《' + a(1).title + '》，' + ARCH_SRC, intro: '“将碧血，写忠烈”——荡气回肠的文人风骨之歌。' },
  { id: 'me_05', opera: 'op_zck', artist: 'ar_rjf', type: 'video', title: '紫钗记·剑合钗圆', performer: '任剑辉 · 白雪仙', duration: '18:05', year: 1977, plays: 81000, img: 'opera05', source: 'https://www.bilibili.com/video/BV紫钗记', embed: '', audio: '', srcNote: '', intro: '黄衫客相助、破镜重圆，唐涤生笔下缠绵悱恻的团圆之作。' },
  { id: 'me_06', opera: 'op_hbg', artist: 'ar_xjx', type: 'audio', title: '胡不归·慰妻', performer: '薛觉先', duration: a(2).dur, year: 1940, plays: 54000, img: 'opera06', source: IA_PAGE(a(2).id), audio: IA(a(2).id, a(2).file), srcNote: '试听为同期粤曲历史录音《' + a(2).title + '》，' + ARCH_SRC, intro: '薛腔哀婉到极致的一段，写尽人间至情与礼教之残酷。' },
  { id: 'me_07', opera: 'op_sxfy', artist: 'ar_okm', type: 'video', title: '山乡风云·夜送', performer: '欧凯明 等', duration: '10:22', year: 2010, plays: 42000, img: 'opera07', source: 'https://www.bilibili.com/video/BV山乡风云', embed: '', audio: '', srcNote: '', intro: '现代粤剧代表作，红派传人欧凯明演绎革命英雄群像。' },
  { id: 'me_08', opera: 'op_zjcs', artist: 'ar_hxn', type: 'audio', title: '昭君出塞', performer: '红线女', duration: a(3).dur, year: 1955, plays: 58000, img: 'opera02', source: IA_PAGE(a(3).id), audio: IA(a(3).id, a(3).file), srcNote: '试听为同期粤曲历史录音《' + a(3).title + '》，' + ARCH_SRC, intro: '怀抱琵琶遥望故国，红腔如泣如诉，家国之思尽在其中。' },
  { id: 'me_09', opera: 'op_lyx', artist: 'ar_fyf', type: 'audio', title: '六月雪·探监', performer: '芳艳芬', duration: a(4).dur, year: 1956, plays: 39000, img: 'opera01', source: IA_PAGE(a(4).id), audio: IA(a(4).id, a(4).file), srcNote: '试听为同期粤曲历史录音《' + a(4).title + '》，' + ARCH_SRC, intro: '芳腔演窦娥，悲愤苍凉，公案戏中催人泪下的一折。' },
  { id: 'me_10', opera: 'op_mdt', artist: 'ar_bxx', type: 'video', title: '牡丹亭·游园惊梦', performer: '白雪仙 等', duration: '16:40', year: 1960, plays: 47000, img: 'opera03', source: 'https://www.bilibili.com/video/BV牡丹亭', embed: '', audio: '', srcNote: '', intro: '“原来姹紫嫣红开遍”，一场游园唱尽闺中少女青春情思。' },
];

/* 真实历史录音专区：直接来自 archive.org 的早期粤曲唱片（可在线试听） */
DB.archiveAudio.forEach((rec, i) => {
  DB.media.push({
    id: 'me_ia' + String(i + 1).padStart(2, '0'),
    opera: null, artist: null, type: 'audio',
    title: rec.title + ' · 历史录音', performer: '早期粤曲老唱片',
    duration: rec.dur, year: 1930, plays: 8000 + i * 137, img: 'opera0' + ((i % 7) + 1),
    source: IA_PAGE(rec.id), audio: IA(rec.id, rec.file), embed: '',
    srcNote: ARCH_SRC,
    intro: '《' + rec.title + '》——20 世纪早期粤曲 78 转唱片数字化珍藏，原汁原味的老唱腔，可在线试听。',
  });
});

/* ---------------- 戏词表 lyrics ---------------- */
/* lines: 每句含原文 text、注音 yue（粤拼/普通话近似）、释义 note */
DB.lyrics = [
  {
    id: 'ly_01', opera: 'op_dnh', title: '帝女花·香夭（选段）',
    source: '唐涤生 词',
    note: '长平公主与周世显于含樟树下双双殉国前的对唱，是粤剧最广为传唱的名曲。',
    lines: [
      { text: '落花满天蔽月光', yin: 'luò huā mǎn tiān bì yuè guāng', exp: '满天落花遮蔽了月色，景中含悲。' },
      { text: '借一杯附荐凤台上', yin: 'jiè yì bēi fù jiàn fèng tái shàng', exp: '在凤台之上，借一杯薄酒祭奠亡魂。' },
      { text: '帝女花带泪上香', yin: 'dì nǚ huā dài lèi shàng xiāng', exp: '长平公主含泪焚香祭拜。' },
      { text: '愿丧生回谢爹娘', yin: 'yuàn sàng shēng huí xiè diē niáng', exp: '甘愿以死报答父母的养育之恩。' },
      { text: '偷偷看 偷偷望', yin: 'tōu tōu kàn tōu tōu wàng', exp: '二人偷偷对望，情意暗藏。' },
      { text: '佢带泪带泪暗悲伤', yin: 'kéoi daai leoi … am bēi shāng', exp: '（粤语“佢”即“他/她”）含泪而暗自神伤。' },
    ],
  },
  {
    id: 'ly_02', opera: 'op_ghq', title: '关汉卿·蝶双飞（选段）',
    source: '田汉 词',
    note: '关汉卿与朱帘秀临刑明志的对唱，唱出文人风骨与艺人气节。',
    lines: [
      { text: '将碧血 写忠烈', yin: 'jiāng bì xuè xiě zhōng liè', exp: '以满腔热血书写忠义壮烈。' },
      { text: '作厉鬼 除奸贼', yin: 'zuò lì guǐ chú jiān zéi', exp: '即便化作厉鬼，也要除尽奸佞。' },
      { text: '这血儿啊 谁不知 谁不识', yin: 'zhè xuè ér a shéi bù zhī', exp: '这一腔热血，世人皆知、皆敬。' },
      { text: '不重见 梨园乐 难再得', yin: 'bù chóng jiàn lí yuán lè', exp: '此生难再重逢梨园同乐之时。' },
    ],
  },
  {
    id: 'ly_03', opera: 'op_zck', title: '紫钗记·剑合钗圆（选段）',
    source: '唐涤生 词',
    note: '李益与霍小玉历经离散，终在黄衫客相助下破镜重圆。',
    lines: [
      { text: '未言别 怨别离', yin: 'wèi yán bié yuàn bié lí', exp: '话未出口，已先怨这离别之苦。' },
      { text: '泪盈盈 湿罗衣', yin: 'lèi yíng yíng shī luó yī', exp: '泪水盈眶，沾湿了罗衫。' },
      { text: '钗分凤 剑合时', yin: 'chāi fēn fèng jiàn hé shí', exp: '紫钗曾分、宝剑重合，喻指失而复得。' },
      { text: '有情人 终不负相思', yin: 'yǒu qíng rén zhōng bù fù xiāng sī', exp: '有情人终成眷属，不负相思。' },
    ],
  },
  {
    id: 'ly_04', opera: 'op_zjcs', title: '昭君出塞（选段）',
    source: '传统曲词',
    note: '王昭君怀抱琵琶，远嫁匈奴，遥望故国的一段悲歌。',
    lines: [
      { text: '凄凉凄凉 听琵琶凄怨', yin: 'qī liáng tīng pí pá qī yuàn', exp: '琵琶声声，尽是凄凉哀怨。' },
      { text: '别汉宫 远塞外', yin: 'bié hàn gōng yuǎn sài wài', exp: '辞别汉宫，远赴塞外苦寒之地。' },
      { text: '回望故国 泪偷弹', yin: 'huí wàng gù guó lèi tōu tán', exp: '回望故乡，暗自落泪。' },
    ],
  },
  {
    id: 'ly_05', opera: 'op_mdt', title: '牡丹亭惊梦·游园（皂罗袍）',
    source: '汤显祖《牡丹亭》原著',
    note: '杜丽娘游园，惊叹满园春色，感怀青春易逝——昆腔粤唱，词出汤显祖原著，传唱数百年。',
    lines: [
      { text: '原来姹紫嫣红开遍', yin: 'yuán lái chà zǐ yān hóng kāi biàn', exp: '满园繁花姹紫嫣红，竞相盛开。' },
      { text: '似这般都付与断井颓垣', yin: 'sì zhè bān dōu fù yǔ duàn jǐng tuí yuán', exp: '这般好景，却都荒废在断井颓墙之间。' },
      { text: '良辰美景奈何天', yin: 'liáng chén měi jǐng nài hé tiān', exp: '良辰美景虽好，却无人共赏，徒唤奈何。' },
      { text: '赏心乐事谁家院', yin: 'shǎng xīn lè shì shéi jiā yuàn', exp: '赏心乐事，又落在谁家庭院？' },
      { text: '朝飞暮卷 云霞翠轩', yin: 'zhāo fēi mù juǎn yún xiá cuì xuān', exp: '朝霞暮卷，云霞掩映着翠绿亭轩。' },
      { text: '雨丝风片 烟波画船', yin: 'yǔ sī fēng piàn yān bō huà chuán', exp: '细雨微风，烟波之上画船摇曳。' },
    ],
  },
  {
    id: 'ly_06', opera: 'op_lyx', title: '六月雪·滚绣球（窦娥冤）',
    source: '关汉卿《窦娥冤》原著',
    note: '窦娥蒙冤赴法场，怒指天地不公，发下六月飞雪之誓——元曲名段，粤剧《六月雪》本此改编。',
    lines: [
      { text: '有日月朝暮悬', yin: 'yǒu rì yuè zhāo mù xuán', exp: '天上日月朝暮高悬，本应明察人间是非。' },
      { text: '有鬼神掌着生死权', yin: 'yǒu guǐ shén zhǎng zhe shēng sǐ quán', exp: '世间有鬼神执掌着生死之权。' },
      { text: '天地也只合把清浊分辨', yin: 'tiān dì yě zhǐ hé bǎ qīng zhuó fēn biàn', exp: '天地本应分辨清浊善恶。' },
      { text: '可怎生糊突了盗跖颜渊', yin: 'kě zěn shēng hú tu le dào zhí yán yuān', exp: '怎能糊涂得把盗跖（恶）与颜渊（善）混作一谈？' },
      { text: '为善的受贫穷更命短', yin: 'wéi shàn de shòu pín qióng gèng mìng duǎn', exp: '行善之人反而贫穷短命。' },
      { text: '造恶的享富贵又寿延', yin: 'zào è de xiǎng fù guì yòu shòu yán', exp: '作恶之人却享尽富贵长寿——道尽窦娥之冤愤。' },
    ],
  },
  {
    id: 'ly_07', opera: 'op_bsz', title: '白蛇传·断桥（选段）',
    source: '田汉《白蛇传》· 断桥',
    note: '白素贞水漫金山失利，断桥重逢许仙，景物依旧而人事全非，悲愤交集又难舍旧情。',
    lines: [
      { text: '西湖山水还依旧', yin: 'xī hú shān shuǐ hái yī jiù', exp: '西湖的山水依旧如昔。' },
      { text: '憔悴难对满眼秋', yin: 'qiáo cuì nán duì mǎn yǎn qiū', exp: '人已憔悴，难以面对这满眼秋色。' },
      { text: '山是青山楼是楼', yin: 'shān shì qīng shān lóu shì lóu', exp: '青山仍是青山，楼阁仍是楼阁，景物未改。' },
      { text: '只见旧时景 不见旧时游', yin: 'zhǐ jiàn jiù shí jǐng bù jiàn jiù shí yóu', exp: '只见旧日风景，却已不见旧日同游之人。' },
    ],
  },
  {
    id: 'ly_08', opera: 'op_ssy', title: '搜书院·步月抒怀（选段）',
    source: '杨子静、莫汝城、林仙根 改编',
    note: '丫鬟翠莲蒙冤逃入书院，月下向掌教谢宝倾诉身世——周恩来观此剧后誉粤剧为「南国红豆」。',
    lines: [
      { text: '步月归来抒胸臆', yin: 'bù yuè guī lái shū xiōng yì', exp: '月下漫步归来，倾吐心中郁结。' },
      { text: '一片真情诉与谁', yin: 'yí piàn zhēn qíng sù yǔ shéi', exp: '满腔真情，又能向谁人倾诉。' },
      { text: '风打梨花深闭门', yin: 'fēng dǎ lí huā shēn bì mén', exp: '风吹梨花、门户深掩，喻其孤苦无依。' },
      { text: '书院夜静月当头', yin: 'shū yuàn yè jìng yuè dāng tóu', exp: '书院夜深人静，明月正当头顶。' },
    ],
  },
  {
    id: 'ly_09', opera: 'op_zshmj', title: '再世红梅记·观柳还琴（选段）',
    source: '唐涤生 词',
    note: '裴禹错把卢昭容认作亡魂李慧娘，临池观柳、隔窗还琴，一段缠绵悱恻的误会痴情。',
    lines: [
      { text: '观柳还琴忆旧游', yin: 'guān liǔ huán qín yì jiù yóu', exp: '临柳还琴，追忆旧日相逢之情。' },
      { text: '一弦一柱总关情', yin: 'yì xián yí zhù zǒng guān qíng', exp: '琴上每一弦、每一柱，都牵动着情思。' },
      { text: '似曾相识燕归来', yin: 'sì céng xiāng shí yàn guī lái', exp: '眼前人仿佛似曾相识，如旧燕归来。' },
      { text: '红梅再世续前缘', yin: 'hóng méi zài shì xù qián yuán', exp: '红梅再世，续写前世未了的情缘。' },
    ],
  },
  {
    id: 'ly_10', opera: 'op_hbg', title: '胡不归·慰妻（选段）',
    source: '薛觉先 首本 · 冯志芬 编',
    note: '文萍生从军前夜，强忍离愁，柔声宽慰缠绵病榻的妻子赵颦娘——薛腔代表名段。',
    lines: [
      { text: '胡不归 胡不归', yin: 'hú bù guī hú bù guī', exp: '「为何不归」——声声唤问，道尽离人之痛。' },
      { text: '杜鹃啼血唤春归', yin: 'dù juān tí xuè huàn chūn guī', exp: '杜鹃啼血，声声呼唤春天（团圆）归来。' },
      { text: '临行还把残躯慰', yin: 'lín xíng hái bǎ cán qū wèi', exp: '临行之际，仍轻声宽慰病弱的妻子。' },
      { text: '但愿君心似我心', yin: 'dàn yuàn jūn xīn sì wǒ xīn', exp: '只愿你的心意，能如我一般坚定不移。' },
    ],
  },
];

/* ---------------- 首页推荐位（运营配置） ---------------- */
DB.featured = ['op_dnh', 'op_ssy', 'op_ghq', 'op_zck'];     // 焦点轮播剧目
DB.recommendArtists = ['ar_hxn', 'ar_rjf', 'ar_xjx', 'ar_bxx']; // 名家推荐

module.exports = DB;
