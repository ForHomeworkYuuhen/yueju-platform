# 南国红豆 · 粤剧文化传承平台

> 选题：**粤剧文化传承**（移动应用开发）
> 一个聚焦国家级 / 人类非物质文化遗产「粤剧」的数字化传承平台，提供
> **剧目分类查询、视频音频库、名家档案、收藏 / 推荐 / 评论、戏词学唱**，
> 并创新引入 **智能问戏（AI）** 与 **粤剧热度地图分析**。

---

## 一、技术架构（前后端分离）

| 层 | 技术 |
|----|------|
| 前端（移动端 + 管理后台） | Vue 3（全局构建）+ Vant 4 + Remix Icon + ECharts 5，哈希路由 SPA |
| 后端 | Node.js + Express 4，RESTful `/api` 接口 |
| 数据库 | SQLite（better-sqlite3），单文件 `server/yueju.db`，17 张表 |
| AI | DeepSeek 大模型（OpenAI 兼容接口），由后端代理，密钥仅存服务端 |

前端所有数据均经 `/api` 从后端获取，二者以 JSON 通信。

---

## 二、运行方式

```bash
# 1. 进入项目目录
cd 粤剧文化传承

# 2. 安装依赖
npm install

# 3. 启动（首次启动自动建表并填充种子数据）
npm start
# 如本机 Node 与 better-sqlite3 预编译版本不匹配，先执行：npm rebuild better-sqlite3
```

启动后访问：

- 用户端（移动端）：<http://localhost:3000/>
- 管理后台（桌面端）：<http://localhost:3000/admin>

演示账号：

- 普通用户：`liyuan` / `123456`
- 管理员：`admin` / `123456`

> 移动端预览建议用浏览器「设备模拟」切到手机尺寸（如 390×844）。

---

## 三、目录结构

```
粤剧文化传承/
├── server/                 后端
│   ├── index.js            Express 入口（路由挂载 + 静态托管 + 自动种子）
│   ├── db.js               SQLite 连接与建表（DDL）
│   ├── seed.js             种子数据填充
│   ├── seed-reference.js   剧目/名家/媒体/戏词等参考数据
│   ├── heat-data.js        地区地理与大样本演出数据生成
│   ├── repo.js             数据访问层（查询/映射/关联/聚合）
│   ├── middleware.js       令牌鉴权中间件
│   └── routes/             auth content social events stats assistant admin
├── web/                    前端
│   ├── index.html          用户端（移动端）
│   ├── admin.html          管理后台（桌面端）
│   ├── css/                style.css（用户端）、admin.css（后台）
│   ├── js/                 app.js（用户端）、admin.js（后台）、api.js、art.js
│   ├── assets/img/         粤剧真实剧照
│   └── vendor/             Vue / Vant / ECharts / Remix Icon / 地图 GeoJSON（本地化）
└── package.json
```

---

## 四、功能一览

1. **剧目分类查询** —— 按题材 / 年代 / 流派剧团 / 行当多维筛选 + 关键词检索；剧目详情含剧情、档案、名伶担纲、相关视听、经典戏词。
2. **视频音频库** —— 经典唱段视频 / 音频，分类浏览、播放、原平台外链。
3. **名家档案** —— 红线女、马师曾、薛觉先、任白等名家的生平、成就、代表剧目、流派。
4. **收藏 / 推荐 / 评论** —— 收藏剧目 / 名家 / 视听，带评分评论与点赞，首页推荐。
5. **戏词学唱** —— 逐句原文 + 注音 + 释义；单句朗读、整段卡拉 OK 跟唱、逐句标记、进度记录（浏览器语音合成，优先粤语）。
6. **智能问戏（仅客户端）** —— AI 解答粤剧剧情、名家、唱腔、戏词等问题，领域限定、密钥后端托管。
7. **热度分析（管理后台）** —— 基于 4 万+ 演出样本、36 地区的地图热力、年度趋势与渠道占比可视化。

---

## 五、AI 配置（可选）

智能问戏默认使用内置中转接口，亦可通过环境变量覆盖：

```bash
set LLM_BASE_URL=https://tbnx.plus7.plus/v1
set LLM_API_KEY=<你的密钥>
set LLM_MODEL=deepseek-v3.2
npm start
```

> 资料整理自公开权威来源，仅作教学演示与文化传播之用。
