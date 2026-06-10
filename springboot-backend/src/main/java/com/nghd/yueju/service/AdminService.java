package com.nghd.yueju.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.nghd.yueju.common.exception.BusinessException;
import com.nghd.yueju.common.util.Ids;
import com.nghd.yueju.entity.AuditLog;
import com.nghd.yueju.entity.ShowEvent;
import com.nghd.yueju.entity.ShowSignup;
import com.nghd.yueju.mapper.AdminMapper;
import com.nghd.yueju.mapper.AuditLogMapper;
import com.nghd.yueju.mapper.ShowEventMapper;
import com.nghd.yueju.mapper.ShowSignupMapper;
import com.nghd.yueju.security.AuthUser;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * 管理后台服务：总览 KPI、演出审核、报名名单、底层数据表浏览。
 */
@Service
public class AdminService {

    private final AdminMapper adminMapper;
    private final ShowEventMapper eventMapper;
    private final ShowSignupMapper signupMapper;
    private final AuditLogMapper auditLogMapper;
    private final EventService eventService;
    private final JdbcTemplate jdbc;
    private final RedisTemplate<String, Object> redisTemplate;

    public AdminService(AdminMapper adminMapper, ShowEventMapper eventMapper, ShowSignupMapper signupMapper,
                        AuditLogMapper auditLogMapper, EventService eventService, JdbcTemplate jdbc,
                        RedisTemplate<String, Object> redisTemplate) {
        this.adminMapper = adminMapper;
        this.eventMapper = eventMapper;
        this.signupMapper = signupMapper;
        this.auditLogMapper = auditLogMapper;
        this.eventService = eventService;
        this.jdbc = jdbc;
        this.redisTemplate = redisTemplate;
    }

    public Map<String, Object> overview() {
        return adminMapper.overview();
    }

    public List<Map<String, Object>> events(String status) {
        return status != null && !status.isBlank() ? eventService.listShows(status) : eventService.allShows();
    }

    public Map<String, Object> review(String id, String action, String note, AuthUser admin) {
        ShowEvent e = eventMapper.selectById(id);
        if (e == null) throw BusinessException.notFound("演出不存在");
        if (!"approve".equals(action) && !"reject".equals(action)) {
            throw BusinessException.badRequest("无效的操作");
        }
        String status = "approve".equals(action) ? "approved" : "rejected";
        e.setStatus(status);
        e.setReviewNote(note == null ? "" : note);
        e.setReviewedAt(Ids.now());
        eventMapper.updateById(e);
        audit(admin, "review_event", id + " -> " + status);

        // 清除演出列表缓存
        redisTemplate.delete("cache:shows:approved");

        return Map.of("ok", true, "event", eventService.mapEvent(eventMapper.selectById(id)));
    }

    public Map<String, Object> signupsOfEvent(String id) {
        Map<String, Object> event = eventService.getShow(id, null);
        List<ShowSignup> signups = signupMapper.selectList(new QueryWrapper<ShowSignup>()
                .eq("event_id", id).orderByAsc("created"));
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("event", event);
        r.put("signups", signups);
        return r;
    }

    /* ---------------- 通用数据表浏览 ---------------- */
    private record TableDef(String label, String group, List<String> search,
                            List<String> filters, List<String[]> cols) {}

    private static final Map<String, TableDef> TABLES = new LinkedHashMap<>();
    static {
        TABLES.put("opera", new TableDef("剧目", "内容资料", List.of("title", "alias", "playwright"),
                List.of("genre", "troupe"),
                cols("id:编号", "title:剧目名称", "alias:别名", "genre:题材", "troupe:流派",
                        "premiere:首演年份", "playwright:编剧", "popularity:人气值")));
        TABLES.put("artist", new TableDef("名家", "内容资料", List.of("name", "title", "region"),
                List.of("role", "school", "gender"),
                cols("id:编号", "name:姓名", "gender:性别", "role:行当", "school:流派",
                        "birth:出生", "death:逝世", "region:籍贯")));
        TABLES.put("media", new TableDef("视听资源", "内容资料", List.of("title", "performer"),
                List.of("type"),
                cols("id:编号", "title:标题", "type:类型", "opera_id:所属剧目", "performer:表演者",
                        "duration:时长", "year:年份", "plays:播放量")));
        TABLES.put("lyrics", new TableDef("戏词", "内容资料", List.of("title", "source", "note"),
                List.of(),
                cols("id:编号", "title:曲目", "opera_id:所属剧目", "source:出处", "note:说明")));
        TABLES.put("category", new TableDef("分类", "内容资料", List.of("name", "descr"),
                List.of("grp"),
                cols("id:编号", "grp:分组", "name:名称", "descr:说明")));
        TABLES.put("user", new TableDef("用户", "用户互动", List.of("username", "nickname", "region"),
                List.of("role", "gender"),
                cols("id:编号", "username:账号", "nickname:昵称", "gender:性别", "region:地区",
                        "role:角色", "created:注册时间")));
        TABLES.put("favorite", new TableDef("收藏", "用户互动", List.of("user_id", "target_id"),
                List.of("type"),
                cols("id:编号", "user_id:用户", "type:类型", "target_id:收藏对象", "created:收藏时间")));
        TABLES.put("comment", new TableDef("评论", "用户互动", List.of("nickname", "content"),
                List.of("type", "rating"),
                cols("id:编号", "nickname:昵称", "type:类型", "target_id:评论对象", "content:内容",
                        "rating:评分", "likes:点赞", "created:评论时间")));
        TABLES.put("learn_record", new TableDef("学唱记录", "用户互动", List.of("user_id", "lyrics_id"),
                List.of(),
                cols("id:编号", "user_id:用户", "lyrics_id:曲目", "progress:进度(%)", "last:最近学习")));
        TABLES.put("show_event", new TableDef("公开演出", "公开演出",
                List.of("title", "opera_title", "venue", "applicant_name"), List.of("status", "city"),
                cols("id:编号", "title:演出名称", "opera_title:上演剧目", "city:城市", "venue:场馆",
                        "date:日期", "time:时间", "capacity:名额", "status:状态", "applicant_name:申请人")));
        TABLES.put("show_signup", new TableDef("演出报名", "公开演出", List.of("name", "phone"),
                List.of(),
                cols("id:编号", "event_id:所属演出", "user_id:用户", "name:姓名", "phone:联系电话",
                        "num:人数", "created:报名时间")));
        TABLES.put("performance", new TableDef("演出样本", "热度数据",
                List.of("region", "venue", "troupe", "opera_title"), List.of("channel", "province"),
                cols("id:编号", "region:地区", "province:省份", "venue:场馆", "troupe:演出团体",
                        "opera_title:剧目", "date:日期", "audience:现场观众", "online_play:线上播放", "channel:渠道")));
        TABLES.put("region_geo", new TableDef("地区地理", "热度数据", List.of("name", "province"),
                List.of("province"),
                cols("code:编码", "name:地区名称", "province:省份", "lng:经度", "lat:纬度", "is_core:核心流行区")));
    }

    private static List<String[]> cols(String... defs) {
        List<String[]> list = new ArrayList<>();
        for (String d : defs) {
            int i = d.indexOf(':');
            list.add(new String[]{d.substring(0, i), d.substring(i + 1)});
        }
        return list;
    }

    public List<Map<String, Object>> tables() {
        List<Map<String, Object>> out = new ArrayList<>();
        for (Map.Entry<String, TableDef> en : TABLES.entrySet()) {
            Long n = jdbc.queryForObject("SELECT COUNT(*) FROM `" + en.getKey() + "`", Long.class);
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("name", en.getKey());
            m.put("label", en.getValue().label());
            m.put("group", en.getValue().group());
            m.put("count", n);
            out.add(m);
        }
        return out;
    }

    public Map<String, Object> table(String name, String q, Map<String, String> query) {
        TableDef def = TABLES.get(name);
        if (def == null) throw BusinessException.notFound("未知数据表");
        List<String> keys = def.cols().stream().map(c -> c[0]).toList();
        int limit = Math.min(500, parseInt(query.get("limit"), 100));
        int offset = parseInt(query.get("offset"), 0);

        List<String> conds = new ArrayList<>();
        List<Object> args = new ArrayList<>();
        if (q != null && !q.isBlank() && !def.search().isEmpty()) {
            List<String> ors = new ArrayList<>();
            for (String c : def.search()) { ors.add("`" + c + "` LIKE ?"); args.add("%" + q + "%"); }
            conds.add("(" + String.join(" OR ", ors) + ")");
        }
        for (String fk : def.filters()) {
            String v = query.get(fk);
            if (v != null && !v.isBlank() && !"all".equals(v)) { conds.add("`" + fk + "` = ?"); args.add(v); }
        }
        String where = conds.isEmpty() ? "" : " WHERE " + String.join(" AND ", conds);

        Long total = jdbc.queryForObject("SELECT COUNT(*) FROM `" + name + "`" + where, Long.class, args.toArray());
        String colSql = String.join(",", keys.stream().map(k -> "`" + k + "`").toList());
        List<Object> rowArgs = new ArrayList<>(args);
        rowArgs.add(limit); rowArgs.add(offset);
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT " + colSql + " FROM `" + name + "`" + where + " LIMIT ? OFFSET ?", rowArgs.toArray());

        List<Map<String, Object>> columns = new ArrayList<>();
        for (String[] c : def.cols()) columns.add(Map.of("key", c[0], "label", c[1]));

        List<Map<String, Object>> filters = new ArrayList<>();
        for (String fk : def.filters()) {
            List<String> options = jdbc.queryForList(
                    "SELECT DISTINCT `" + fk + "` v FROM `" + name + "` WHERE `" + fk + "` IS NOT NULL AND `" + fk + "` <> '' ORDER BY `" + fk + "`",
                    String.class);
            String label = def.cols().stream().filter(c -> c[0].equals(fk)).map(c -> c[1]).findFirst().orElse(fk);
            filters.add(Map.of("key", fk, "label", label, "options", options));
        }

        Map<String, Object> r = new LinkedHashMap<>();
        r.put("name", name);
        r.put("label", def.label());
        r.put("total", total);
        r.put("rows", rows);
        r.put("columns", columns);
        r.put("filters", filters);
        return r;
    }

    private int parseInt(String s, int d) {
        try { return s == null ? d : Integer.parseInt(s); } catch (Exception e) { return d; }
    }

    private void audit(AuthUser u, String action, String detail) {
        try {
            AuditLog log = new AuditLog();
            log.setTime(Ids.now());
            log.setUserId(u != null ? u.id() : null);
            log.setUsername(u != null ? u.username() : null);
            log.setAction(action);
            log.setDetail(detail);
            auditLogMapper.insert(log);
        } catch (Exception ignored) {
        }
    }
}
