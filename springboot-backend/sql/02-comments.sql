-- ================================================================
-- 粤剧平台 - 表/字段注释脚本
-- 适用于 MySQL 8.0+，执行顺序：先建表，再执行本脚本
-- ================================================================

-- -------------------- category --------------------
ALTER TABLE `category` COMMENT '剧目分类维度表（如行当、题材、年代、流派等）';
ALTER TABLE `category` MODIFY COLUMN `id`     VARCHAR(64)  NOT NULL COMMENT '分类ID';
ALTER TABLE `category` MODIFY COLUMN `grp`    VARCHAR(255) COMMENT '所属维度（如 genre/era/role）';
ALTER TABLE `category` MODIFY COLUMN `name`   VARCHAR(255) COMMENT '分类名称';
ALTER TABLE `category` MODIFY COLUMN `descr`  TEXT          COMMENT '分类描述';
ALTER TABLE `category` MODIFY COLUMN `sort`   INT           COMMENT '排序序号';

-- -------------------- opera --------------------
ALTER TABLE `opera` COMMENT '剧目主表';
ALTER TABLE `opera` MODIFY COLUMN `id`         VARCHAR(64)  NOT NULL COMMENT '剧目ID';
ALTER TABLE `opera` MODIFY COLUMN `title`      VARCHAR(255) COMMENT '剧目名称';
ALTER TABLE `opera` MODIFY COLUMN `alias`      VARCHAR(255) COMMENT '剧目别名';
ALTER TABLE `opera` MODIFY COLUMN `era`        VARCHAR(255) COMMENT '所处年代';
ALTER TABLE `opera` MODIFY COLUMN `genre`      VARCHAR(255) COMMENT '题材类型';
ALTER TABLE `opera` MODIFY COLUMN `troupe`     VARCHAR(255) COMMENT '所属院团';
ALTER TABLE `opera` MODIFY COLUMN `roles`      TEXT          COMMENT '角色行当列表（JSON）';
ALTER TABLE `opera` MODIFY COLUMN `premiere`    INT           COMMENT '首演年份';
ALTER TABLE `opera` MODIFY COLUMN `playwright` VARCHAR(255) COMMENT '编剧';
ALTER TABLE `opera` MODIFY COLUMN `region`      VARCHAR(255) COMMENT '主要流传地区';
ALTER TABLE `opera` MODIFY COLUMN `duration`    VARCHAR(255) COMMENT '演出时长';
ALTER TABLE `opera` MODIFY COLUMN `popularity` INT           COMMENT '热度/人气值';
ALTER TABLE `opera` MODIFY COLUMN `palette`     INT           COMMENT '配色方案编号';
ALTER TABLE `opera` MODIFY COLUMN `famous`      TEXT          COMMENT '经典唱段';
ALTER TABLE `opera` MODIFY COLUMN `summary`    TEXT          COMMENT '剧情简介';
ALTER TABLE `opera` MODIFY COLUMN `highlight`  TEXT          COMMENT '艺术特色';

-- -------------------- artist --------------------
ALTER TABLE `artist` COMMENT '演员/艺术家信息表';
ALTER TABLE `artist` MODIFY COLUMN `id`         VARCHAR(64)  NOT NULL COMMENT '演员ID';
ALTER TABLE `artist` MODIFY COLUMN `name`       VARCHAR(255) COMMENT '演员姓名';
ALTER TABLE `artist` MODIFY COLUMN `gender`     VARCHAR(255) COMMENT '性别';
ALTER TABLE `artist` MODIFY COLUMN `birth`      INT           COMMENT '出生年份';
ALTER TABLE `artist` MODIFY COLUMN `death`       INT           COMMENT '逝世年份（空表示在世）';
ALTER TABLE `artist` MODIFY COLUMN `role`       VARCHAR(255) COMMENT '主工行当';
ALTER TABLE `artist` MODIFY COLUMN `school`     VARCHAR(255) COMMENT '所属流派';
ALTER TABLE `artist` MODIFY COLUMN `region`     VARCHAR(255) COMMENT '主要活动地区';
ALTER TABLE `artist` MODIFY COLUMN `palette`    INT           COMMENT '配色方案编号';
ALTER TABLE `artist` MODIFY COLUMN `popularity` INT           COMMENT '热度/人气值';
ALTER TABLE `artist` MODIFY COLUMN `title`      VARCHAR(255) COMMENT '职称/称号（如国家一级演员）';
ALTER TABLE `artist` MODIFY COLUMN `bio`        TEXT          COMMENT '人物小传';
ALTER TABLE `artist` MODIFY COLUMN `achievement` TEXT         COMMENT '艺术成就';

-- -------------------- opera_artist --------------------
ALTER TABLE `opera_artist` COMMENT '剧目与演员的关联表（演出阵容）';
ALTER TABLE `opera_artist` MODIFY COLUMN `opera_id`  VARCHAR(64)  NOT NULL COMMENT '剧目ID';
ALTER TABLE `opera_artist` MODIFY COLUMN `artist_id` VARCHAR(64)  NOT NULL COMMENT '演员ID';
ALTER TABLE `opera_artist` MODIFY COLUMN `role`      VARCHAR(255) COMMENT '在该剧中饰演的角色';

-- -------------------- media --------------------
ALTER TABLE `media` COMMENT '影音资料表（视频/音频/图片等）';
ALTER TABLE `media` MODIFY COLUMN `id`          VARCHAR(64)  NOT NULL COMMENT '影音ID';
ALTER TABLE `media` MODIFY COLUMN `opera_id`    VARCHAR(64)  COMMENT '关联剧目ID';
ALTER TABLE `media` MODIFY COLUMN `artist_id`  VARCHAR(64)  COMMENT '关联演员ID';
ALTER TABLE `media` MODIFY COLUMN `type`        VARCHAR(255) COMMENT '资料类型（如 video/audio/image）';
ALTER TABLE `media` MODIFY COLUMN `title`       VARCHAR(255) COMMENT '标题';
ALTER TABLE `media` MODIFY COLUMN `performer`   VARCHAR(255) COMMENT '表演者';
ALTER TABLE `media` MODIFY COLUMN `duration`    VARCHAR(255) COMMENT '时长（如 03:45）';
ALTER TABLE `media` MODIFY COLUMN `year`        INT           COMMENT '发行/录制年份';
ALTER TABLE `media` MODIFY COLUMN `plays`       INT           COMMENT '播放次数';
ALTER TABLE `media` MODIFY COLUMN `img`          TEXT          COMMENT '封面图片地址';
ALTER TABLE `media` MODIFY COLUMN `source`      TEXT          COMMENT '来源出处';
ALTER TABLE `media` MODIFY COLUMN `intro`        TEXT          COMMENT '简介';
ALTER TABLE `media` MODIFY COLUMN `audio_url`    TEXT          COMMENT '音频直链地址';
ALTER TABLE `media` MODIFY COLUMN `embed_url`   TEXT          COMMENT '第三方嵌入地址（如B站）';
ALTER TABLE `media` MODIFY COLUMN `src_note`    TEXT          COMMENT '来源备注';

-- -------------------- lyrics --------------------
ALTER TABLE `lyrics` COMMENT '唱词主表';
ALTER TABLE `lyrics` MODIFY COLUMN `id`       VARCHAR(64)  NOT NULL COMMENT '唱词ID';
ALTER TABLE `lyrics` MODIFY COLUMN `opera_id` VARCHAR(64)  COMMENT '所属剧目ID';
ALTER TABLE `lyrics` MODIFY COLUMN `title`    VARCHAR(255) COMMENT '唱段名称';
ALTER TABLE `lyrics` MODIFY COLUMN `source`   TEXT          COMMENT '唱词原文';
ALTER TABLE `lyrics` MODIFY COLUMN `note`      TEXT          COMMENT '注释/译注';

-- -------------------- lyric_line --------------------
ALTER TABLE `lyric_line` COMMENT '唱词逐行表（与唱词主表为一对多）';
ALTER TABLE `lyric_line` MODIFY COLUMN `lyrics_id` VARCHAR(64) NOT NULL COMMENT '唱词主表ID';
ALTER TABLE `lyric_line` MODIFY COLUMN `idx`      INT          NOT NULL COMMENT '行序号（从0或1开始）';
ALTER TABLE `lyric_line` MODIFY COLUMN `text`     TEXT          COMMENT '唱词原文';
ALTER TABLE `lyric_line` MODIFY COLUMN `yin`      TEXT          COMMENT '拼音/音韵';
ALTER TABLE `lyric_line` MODIFY COLUMN `exp`      TEXT          COMMENT '唱词解释/译文';

-- -------------------- user --------------------
ALTER TABLE `user` COMMENT '用户表';
ALTER TABLE `user` MODIFY COLUMN `id`          VARCHAR(64)  NOT NULL COMMENT '用户ID';
ALTER TABLE `user` MODIFY COLUMN `username`   VARCHAR(255) NOT NULL COMMENT '登录用户名（唯一）';
ALTER TABLE `user` MODIFY COLUMN `password`   VARCHAR(255) NOT NULL COMMENT '登录密码（加密存储）';
ALTER TABLE `user` MODIFY COLUMN `nickname`   VARCHAR(255) COMMENT '昵称';
ALTER TABLE `user` MODIFY COLUMN `signature`  TEXT          COMMENT '个性签名';
ALTER TABLE `user` MODIFY COLUMN `gender`     VARCHAR(255) COMMENT '性别';
ALTER TABLE `user` MODIFY COLUMN `region`     VARCHAR(255) COMMENT '所在地区';
ALTER TABLE `user` MODIFY COLUMN `role`       VARCHAR(255) COMMENT '角色（user/admin）';
ALTER TABLE `user` MODIFY COLUMN `avatar_seed` INT           COMMENT '头像随机种子';
ALTER TABLE `user` MODIFY COLUMN `created`    VARCHAR(255) COMMENT '注册时间';

-- -------------------- favorite --------------------
ALTER TABLE `favorite` COMMENT '用户收藏表';
ALTER TABLE `favorite` MODIFY COLUMN `id`        VARCHAR(64)  NOT NULL COMMENT '收藏记录ID';
ALTER TABLE `favorite` MODIFY COLUMN `user_id`  VARCHAR(64)  NOT NULL COMMENT '用户ID';
ALTER TABLE `favorite` MODIFY COLUMN `type`      VARCHAR(255) NOT NULL COMMENT '收藏对象类型（opera/artist/media/lyrics）';
ALTER TABLE `favorite` MODIFY COLUMN `target_id` VARCHAR(64)  NOT NULL COMMENT '被收藏对象ID';
ALTER TABLE `favorite` MODIFY COLUMN `created`  VARCHAR(255) COMMENT '收藏时间';

-- -------------------- comment --------------------
ALTER TABLE `comment` COMMENT '用户评论表';
ALTER TABLE `comment` MODIFY COLUMN `id`         VARCHAR(64)  NOT NULL COMMENT '评论ID';
ALTER TABLE `comment` MODIFY COLUMN `user_id`   VARCHAR(64)  COMMENT '评论用户ID';
ALTER TABLE `comment` MODIFY COLUMN `nickname`  VARCHAR(255) COMMENT '评论者昵称（冗余存储）';
ALTER TABLE `comment` MODIFY COLUMN `avatar_seed` INT         COMMENT '评论者头像种子';
ALTER TABLE `comment` MODIFY COLUMN `type`       VARCHAR(255) COMMENT '被评论对象类型';
ALTER TABLE `comment` MODIFY COLUMN `target_id` VARCHAR(64)  COMMENT '被评论对象ID';
ALTER TABLE `comment` MODIFY COLUMN `content`   TEXT          COMMENT '评论内容';
ALTER TABLE `comment` MODIFY COLUMN `rating`    INT           COMMENT '评分（1-5，可为空）';
ALTER TABLE `comment` MODIFY COLUMN `likes`     INT           COMMENT '点赞数';
ALTER TABLE `comment` MODIFY COLUMN `created`   VARCHAR(255) COMMENT '评论时间';

-- -------------------- learn_record --------------------
ALTER TABLE `learn_record` COMMENT '用户学唱记录表';
ALTER TABLE `learn_record` MODIFY COLUMN `id`       VARCHAR(64)  NOT NULL COMMENT '学唱记录ID';
ALTER TABLE `learn_record` MODIFY COLUMN `user_id` VARCHAR(64)  NOT NULL COMMENT '用户ID';
ALTER TABLE `learn_record` MODIFY COLUMN `lyrics_id` VARCHAR(64) NOT NULL COMMENT '唱词ID';
ALTER TABLE `learn_record` MODIFY COLUMN `progress` INT           COMMENT '学习进度（0-100）';
ALTER TABLE `learn_record` MODIFY COLUMN `last`    VARCHAR(255) COMMENT '最近学习时间';

-- -------------------- history --------------------
ALTER TABLE `history` COMMENT '用户浏览历史表';
ALTER TABLE `history` MODIFY COLUMN `id`        VARCHAR(64)  NOT NULL COMMENT '历史记录ID';
ALTER TABLE `history` MODIFY COLUMN `user_id`  VARCHAR(64)  COMMENT '用户ID';
ALTER TABLE `history` MODIFY COLUMN `type`      VARCHAR(255) COMMENT '浏览对象类型';
ALTER TABLE `history` MODIFY COLUMN `target_id` VARCHAR(64)  COMMENT '浏览对象ID';
ALTER TABLE `history` MODIFY COLUMN `title`    VARCHAR(255) COMMENT '浏览对象标题（冗余）';
ALTER TABLE `history` MODIFY COLUMN `time`     VARCHAR(255) COMMENT '浏览时间';

-- -------------------- region_geo --------------------
ALTER TABLE `region_geo` COMMENT '地区地理信息表（用于地图可视化）';
ALTER TABLE `region_geo` MODIFY COLUMN `code`     VARCHAR(64)  NOT NULL COMMENT '地区编码';
ALTER TABLE `region_geo` MODIFY COLUMN `name`    VARCHAR(255) NOT NULL COMMENT '地区名称';
ALTER TABLE `region_geo` MODIFY COLUMN `province` VARCHAR(255) COMMENT '所属省份';
ALTER TABLE `region_geo` MODIFY COLUMN `lng`      DOUBLE       COMMENT '经度';
ALTER TABLE `region_geo` MODIFY COLUMN `lat`      DOUBLE       COMMENT '纬度';
ALTER TABLE `region_geo` MODIFY COLUMN `is_core`  INT           COMMENT '是否为粤剧核心传播地区（1=是）';

-- -------------------- performance --------------------
ALTER TABLE `performance` COMMENT '演出场次数据表（历年演出统计）';
ALTER TABLE `performance` MODIFY COLUMN `id`          BIGINT NOT NULL COMMENT '演出记录ID（自增主键）';
ALTER TABLE `performance` MODIFY COLUMN `region`      VARCHAR(255) COMMENT '演出地区';
ALTER TABLE `performance` MODIFY COLUMN `province`   VARCHAR(255) COMMENT '所属省份';
ALTER TABLE `performance` MODIFY COLUMN `venue`      VARCHAR(255) COMMENT '演出场馆';
ALTER TABLE `performance` MODIFY COLUMN `troupe`     VARCHAR(255) COMMENT '演出院团';
ALTER TABLE `performance` MODIFY COLUMN `opera_id`   VARCHAR(64)  COMMENT '剧目ID';
ALTER TABLE `performance` MODIFY COLUMN `opera_title` VARCHAR(255) COMMENT '剧目名称';
ALTER TABLE `performance` MODIFY COLUMN `date`        VARCHAR(255) COMMENT '演出日期';
ALTER TABLE `performance` MODIFY COLUMN `year`       INT           COMMENT '演出年份';
ALTER TABLE `performance` MODIFY COLUMN `audience`  INT           COMMENT '现场观众人数';
ALTER TABLE `performance` MODIFY COLUMN `online_play` INT          COMMENT '线上播放量';
ALTER TABLE `performance` MODIFY COLUMN `channel`    VARCHAR(255) COMMENT '传播渠道（如网络/电视/剧院）';
ALTER TABLE `performance` MODIFY COLUMN `source`    TEXT          COMMENT '数据来源';

-- -------------------- show_event --------------------
ALTER TABLE `show_event` COMMENT '演出活动表（用户可申请/报名）';
ALTER TABLE `show_event` MODIFY COLUMN `id`            VARCHAR(64)  NOT NULL COMMENT '活动ID';
ALTER TABLE `show_event` MODIFY COLUMN `title`        VARCHAR(255) COMMENT '活动标题';
ALTER TABLE `show_event` MODIFY COLUMN `opera_id`    VARCHAR(64)  COMMENT '剧目ID';
ALTER TABLE `show_event` MODIFY COLUMN `opera_title`  VARCHAR(255) COMMENT '剧目名称';
ALTER TABLE `show_event` MODIFY COLUMN `troupe`       VARCHAR(255) COMMENT '演出院团';
ALTER TABLE `show_event` MODIFY COLUMN `city`         VARCHAR(255) COMMENT '城市';
ALTER TABLE `show_event` MODIFY COLUMN `venue`        VARCHAR(255) COMMENT '场馆名称';
ALTER TABLE `show_event` MODIFY COLUMN `address`      TEXT          COMMENT '详细地址';
ALTER TABLE `show_event` MODIFY COLUMN `date`        VARCHAR(255) COMMENT '演出日期';
ALTER TABLE `show_event` MODIFY COLUMN `time`        VARCHAR(255) COMMENT '演出时间';
ALTER TABLE `show_event` MODIFY COLUMN `price`       VARCHAR(255) COMMENT '票价信息';
ALTER TABLE `show_event` MODIFY COLUMN `capacity`    INT           COMMENT '场馆座位数';
ALTER TABLE `show_event` MODIFY COLUMN `poster_seed`  INT           COMMENT '海报图片种子';
ALTER TABLE `show_event` MODIFY COLUMN `intro`        TEXT          COMMENT '活动介绍';
ALTER TABLE `show_event` MODIFY COLUMN `contact`     VARCHAR(255) COMMENT '联系方式';
ALTER TABLE `show_event` MODIFY COLUMN `applicant_id` VARCHAR(64)  COMMENT '申请人用户ID';
ALTER TABLE `show_event` MODIFY COLUMN `applicant_name` VARCHAR(255) COMMENT '申请人姓名';
ALTER TABLE `show_event` MODIFY COLUMN `status`      VARCHAR(255) COMMENT '审核状态（pending/approved/rejected）';
ALTER TABLE `show_event` MODIFY COLUMN `review_note`  TEXT          COMMENT '审核备注';
ALTER TABLE `show_event` MODIFY COLUMN `created`     VARCHAR(255) COMMENT '申请创建时间';
ALTER TABLE `show_event` MODIFY COLUMN `reviewed_at` VARCHAR(255) COMMENT '审核时间';

-- -------------------- show_signup --------------------
ALTER TABLE `show_signup` COMMENT '演出活动报名表';
ALTER TABLE `show_signup` MODIFY COLUMN `id`       VARCHAR(64)  NOT NULL COMMENT '报名记录ID';
ALTER TABLE `show_signup` MODIFY COLUMN `event_id` VARCHAR(64)  NOT NULL COMMENT '活动ID';
ALTER TABLE `show_signup` MODIFY COLUMN `user_id`  VARCHAR(64)  NOT NULL COMMENT '报名用户ID';
ALTER TABLE `show_signup` MODIFY COLUMN `name`    VARCHAR(255) COMMENT '报名人姓名';
ALTER TABLE `show_signup` MODIFY COLUMN `phone`   VARCHAR(255) COMMENT '联系电话';
ALTER TABLE `show_signup` MODIFY COLUMN `num`      INT           COMMENT '购票数量';
ALTER TABLE `show_signup` MODIFY COLUMN `note`    TEXT          COMMENT '报名备注';
ALTER TABLE `show_signup` MODIFY COLUMN `created` VARCHAR(255) COMMENT '报名时间';

-- -------------------- audit_log --------------------
ALTER TABLE `audit_log` COMMENT '审计日志表（管理员操作记录）';
ALTER TABLE `audit_log` MODIFY COLUMN `id`       BIGINT NOT NULL COMMENT '日志ID（自增主键）';
ALTER TABLE `audit_log` MODIFY COLUMN `time`    VARCHAR(32) COMMENT '操作时间';
ALTER TABLE `audit_log` MODIFY COLUMN `user_id` VARCHAR(64)  COMMENT '操作用户ID';
ALTER TABLE `audit_log` MODIFY COLUMN `username` VARCHAR(64)  COMMENT '操作用户名';
ALTER TABLE `audit_log` MODIFY COLUMN `action`  VARCHAR(64)  COMMENT '操作类型';
ALTER TABLE `audit_log` MODIFY COLUMN `detail`  VARCHAR(255) COMMENT '操作详情';
ALTER TABLE `audit_log` MODIFY COLUMN `ip`      VARCHAR(64)  COMMENT '操作IP';
