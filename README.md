# 基于前后端分离架构的粤剧文化传承平台

> 《信息系统综合实训》课程作业。聚焦国家级 / 人类非物质文化遗产「粤剧」的数字化传承：剧目分类查询、视频音频库、名家档案、收藏 / 评论、戏词学唱，并引入 **AI 问戏** 与 **粤剧热度地图分析**。
>
> 后端已由 Node/Express 重构为 **Spring Boot 3 + MyBatis-Plus**，数据库迁移至 **MySQL 8**，引入 **Spring Security + JWT + RBAC**、**Redis** 缓存与登录限流、**Swagger** 接口文档、**Docker** 一键编排。

## 团队分工

| 成员 | 学号 | 主要职责 | 技术栈 |
|------|--------|----------|--------|
| 张俊昊 | 信管1234 | 全部前端开发及部分后端：移动端用户界面、管理后台界面、热度分析可视化、前后端接口联调、AI 问戏后端代理接口、工程入口与构建部署 | Vue3、Element Plus/Vant、ECharts、Axios、Spring Boot、Swagger、Maven、Docker |
| 熊烨 | 信管1234 | 后端内容与互动域：剧目 / 名家 / 媒体 / 戏词等内容资料接口、收藏 / 评论 / 学唱 / 历史等互动接口，MyBatis-Plus 数据访问层与关联查询 | Spring Boot、MyBatis-Plus、MySQL、RESTful API、JSR-303 校验 |
| 林兆永 | 信管1234 | 后端数据与安全域：MySQL 数据库设计建表（3NF）与数据迁移、热度分析聚合接口（Redis 缓存）、Spring Security + JWT + RBAC + BCrypt + 登录限流 + XSS 防护 + 操作日志（AOP）+ 备份、管理后台数据接口与演出审核 | Spring Boot、Spring Security、JWT、MyBatis-Plus、MySQL、Redis、AOP |

## 运行

### 后端（Spring Boot + MySQL + Redis，Docker 一键启动，推荐）

```bash
cd springboot-backend
docker compose up -d --build      # 起 MySQL(自动建表灌数据) + Redis + 后端服务
```

- 接口服务：<http://localhost:3000/api>
- 接口文档（Swagger）：<http://localhost:3000/swagger-ui.html>
- 演示账号：普通用户 `liyuan / 123456`；管理员 `admin / 123456`（口令 BCrypt 加盐存储）
- AI 问戏：在 `docker-compose.yml` 或环境变量设置 `LLM_API_KEY` 后启用（密钥不入库、不进源码）

### 前端（Vue3 SPA）

`粤剧文化传承/web` 为移动端 + 管理后台前端，接口指向后端 `http://localhost:3000/api`。

## 更新记录
- 2026-05-30　林兆永：项目初始化与数据库设计、建表（SQLite + better-sqlite3）
- 2026-05-30　林兆永：种子数据与演出样本生成、数据采集脚本
- 2026-05-31　熊烨：数据访问层 repo 与剧目 / 名家 / 媒体 / 戏词内容资料接口
- 2026-05-31　熊烨：收藏 / 评论 / 学唱 / 浏览历史等互动接口
- 2026-06-01　张俊昊：服务入口、路由挂载与公开演出申请 / 报名接口
- 2026-06-01　林兆永：热度分析聚合接口、管理后台数据接口与演出审核
- 2026-06-02　张俊昊：移动端用户界面：剧目分类查询 / 视听库 / 名家档案 / 收藏评论 / 戏词学唱
- 2026-06-02　张俊昊：管理后台界面与热度分析可视化（ECharts）
- 2026-06-03　张俊昊：AI 问戏后端代理接口与前后端联调
- 2026-06-03　林兆永：账号接口、令牌鉴权中间件与安全加固（口令 scrypt 加盐哈希、登录限流、令牌有效期）、操作审计与数据库备份、单元测试
- 2026-06-04　张俊昊：补充演示数据库与项目收尾（前后端联调整合）
- 2026-06-04　林兆永：重构后端架构为 Spring Boot + MyBatis-Plus：工程骨架、MySQL 建表(3NF) 与数据迁移、Docker(MySQL+Redis) 编排
- 2026-06-05　熊烨：迁移内容与互动域至 Spring Boot：剧目/名家/媒体/戏词内容接口与收藏/评论/学唱/历史互动服务
- 2026-06-05　林兆永：新增安全基座(Spring Security+JWT+RBAC+BCrypt+登录限流+XSS+操作审计AOP) 与热度聚合/后台数据接口/演出审核服务
- 2026-06-05　张俊昊：新增公开演出域、AI 问戏代理与全部 REST 控制器，完成前后端联调与后端架构迁移
